import json
import threading
import time
from datetime import datetime

from flask import Flask, jsonify, request, Response, stream_with_context

from src.common.paths import get_web_dir, get_data_dir, get_state_dir, get_config_dir
from src.common.config import load_config
from src.common.heartbeat import (
    register_session,
    touch_session,
    close_session,
    get_active_session_count,
)
from src.common.shutdown import cleanup_and_exit
from src.wiki_app.services.repo_service import RepoService
from src.wiki_app.services.page_service import PageService
from src.wiki_app.services.comment_service import CommentService
from src.wiki_app.services.search_service import SearchService
from src.wiki_app.routes.pages import pages_bp, init_pages
from src.wiki_app.routes.comments import comments_bp, init_comments
from src.wiki_app.routes.history import history_bp, init_history
from src.wiki_app.routes.search import search_bp, init_search

def create_app() -> Flask:
    """Flask アプリケーションを構築して返す"""
    web_dir = get_web_dir()

    app = Flask(
        __name__,
        template_folder=str(web_dir / "templates"),
        static_folder=str(web_dir / "static"),
        static_url_path="/static",
    )

    @app.context_processor
    def inject_admin_url():
        try:
            admin_config = load_config("admin")
            host = admin_config.get("host", "127.0.0.1")
            port = admin_config.get("port", 8081)
            return {"admin_url": f"http://{host}:{port}"}
        except Exception:
            return {"admin_url": "http://127.0.0.1:8081"}

    repo_service = RepoService(get_data_dir())
    page_service = PageService(repo_service)
    comment_service = CommentService()
    search_service = SearchService()

    init_pages(page_service)
    init_comments(comment_service, page_service)
    init_history(repo_service, page_service)
    init_search(search_service)

    app.register_blueprint(pages_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(search_bp)

    @app.template_filter("fmt_datetime")
    def fmt_datetime(value: str) -> str:
        """ISO文字列を yyyy-M-dd H:mm:ss (ゼロ埋めなし) に変換する"""
        if not value:
            return ""
        try:
            dt = datetime.fromisoformat(value)
            return f"{dt.year}-{dt.month}-{dt.day:02d} {dt.hour}:{dt.minute:02d}:{dt.second:02d}"
        except (ValueError, TypeError):
            return value

    @app.route("/api/heartbeat", methods=["POST"])
    def heartbeat():
        payload = _parse_heartbeat_payload()
        action = payload.get("action", "ping")
        session_id = payload.get("session_id") or _legacy_session_id()

        if action == "open":
            register_session(session_id)
        elif action == "close":
            close_session(session_id)
            if get_active_session_count(120) == 0:
                _exit_soon()
        else:
            touch_session(session_id)
        return jsonify({"ok": True})

    @app.route("/api/watcher/status")
    def watcher_status():
        index_path = get_state_dir() / "watcher" / "index.json"
        try:
            if index_path.exists():
                with open(index_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                targets = data.get("targets", {})
                config_targets = []
                config_names: set[str] = set()
                try:
                    config = load_config("watcher")
                    config_targets = [
                        t for t in config.get("targets", []) if t.get("enabled", True)
                    ]
                    config_names = {
                        t.get("name") for t in config_targets if t.get("name")
                    }
                except Exception:
                    config_targets = []
                    config_names = set()

                if config_names:
                    targets = {
                        h: t
                        for h, t in targets.items()
                        if t.get("name") in config_names
                    }

                error_count = sum(
                    1 for t in targets.values() if t.get("status") == "error"
                )
                return jsonify({
                    "running": True,
                    "last_run": data.get("last_run", ""),
                    "target_count": len(config_targets) if config_names else len(targets),
                    "error_count": error_count,
                    "targets": targets,
                })
            else:
                return jsonify({"running": False})
        except Exception:
            return jsonify({"running": False})

    @app.route("/api/watcher/board")
    def watcher_board():
        config = load_config("watcher")
        targets_cfg = config.get("targets", [])
        index_path = get_state_dir() / "watcher" / "index.json"
        index = {"last_run": "", "targets": {}}
        if index_path.exists():
            try:
                with open(index_path, "r", encoding="utf-8") as f:
                    index = json.load(f)
            except Exception:
                index = {"last_run": "", "targets": {}}

        index_by_name = {}
        for t in index.get("targets", {}).values():
            name = t.get("name")
            if name:
                index_by_name[name] = t

        results = []
        for t in targets_cfg:
            name = t.get("name", "unknown")
            entry = index_by_name.get(name, {})
            results.append({
                "name": name,
                "type": t.get("type", "generic"),
                "enabled": t.get("enabled", True),
                "status": entry.get("status", "unknown"),
                "alert_active": entry.get("alert_active", False),
                "last_checked": entry.get("last_checked", ""),
                "last_changed": entry.get("last_changed", ""),
                "last_alert_at": entry.get("last_alert_at", ""),
                "last_alert_summary": entry.get("last_alert_summary", ""),
                "url": t.get("url")
                or t.get("warning_url")
                or t.get("base_url")
                or "",
                "selector": t.get("selector", ""),
                "detect_mode": t.get("detect_mode", "text_change"),
                "alert_statuses": t.get("alert_statuses", []),
                "warning_codes": t.get("warning_codes", []),
                "threshold": t.get("threshold", None),
                "area_code": t.get("area_code", ""),
                "timeout": t.get("timeout", None),
            })

        return jsonify({
            "running": index_path.exists(),
            "last_run": index.get("last_run", ""),
            "night_stop": config.get("night_stop", {}),
            "targets": results,
        })

    @app.route("/api/watcher/night_stop", methods=["GET", "PUT"])
    def watcher_night_stop():
        config_path = get_config_dir() / "watcher.json"
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception:
            config = {}

        if request.method == "GET":
            return jsonify(config.get("night_stop", {}))

        payload = request.get_json(silent=True) or {}

        def _to_hour(value, default):
            try:
                num = int(value)
            except (TypeError, ValueError):
                return default
            return max(0, min(23, num))

        night_stop = {
            "enabled": bool(payload.get("enabled", False)),
            "start_hour": _to_hour(payload.get("start_hour", 0), 0),
            "end_hour": _to_hour(payload.get("end_hour", 4), 4),
        }
        config["night_stop"] = night_stop
        try:
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 500

        return jsonify({"ok": True, "night_stop": night_stop})

    @app.route("/api/watcher/stream")
    def watcher_stream():
        index_path = get_state_dir() / "watcher" / "index.json"

        def _stream():
            last_key = ""
            last_ping = 0.0
            while True:
                try:
                    if index_path.exists():
                        stat = index_path.stat()
                        key = f"{stat.st_mtime_ns}:{stat.st_size}"
                    else:
                        key = "missing"
                    if key != last_key:
                        last_key = key
                        payload = json.dumps({"type": "index", "key": key})
                        yield f"data: {payload}\n\n"
                except Exception:
                    pass

                now = time.time()
                if now - last_ping > 15:
                    yield ": keepalive\n\n"
                    last_ping = now
                time.sleep(1)

        return Response(
            stream_with_context(_stream()),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    return app


def _parse_heartbeat_payload() -> dict:
    payload: dict = {}
    if request.is_json:
        payload = request.get_json(silent=True) or {}
    if not payload:
        raw = request.get_data(as_text=True)
        if raw:
            try:
                payload = json.loads(raw)
            except Exception:
                payload = {}
    if not payload:
        payload = request.form.to_dict()
    return payload


def _legacy_session_id() -> str:
    ua = request.headers.get("User-Agent", "")
    addr = request.remote_addr or "unknown"
    return f"legacy:{addr}:{ua}"


def _exit_soon() -> None:
    def _maybe_exit() -> None:
        if get_active_session_count(120) == 0:
            cleanup_and_exit("ブラウザのタブが閉じたため終了します")

    t = threading.Timer(1.5, _maybe_exit)
    t.daemon = True
    t.start()
