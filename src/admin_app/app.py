import json
import threading

from flask import Flask, jsonify, request

from src.common.paths import get_web_dir, get_data_dir
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
from src.admin_app.routes.dashboard import dashboard_bp, init_dashboard
from src.admin_app.routes.git_mgmt import git_bp, init_git
from src.admin_app.routes.logs import logs_bp
from src.admin_app.routes.config_editor import config_bp
from src.admin_app.routes.export import export_bp, init_export
from src.admin_app.routes.comments_mgmt import comments_mgmt_bp, init_comments_mgmt
from src.admin_app.routes.state_cleanup import state_bp
from src.admin_app.routes.watcher_mgmt import watcher_mgmt_bp


def create_admin_app() -> Flask:
    """Admin Flask アプリケーションを構築して返す"""
    web_dir = get_web_dir()

    app = Flask(
        __name__,
        template_folder=str(web_dir / "admin" / "templates"),
        static_folder=str(web_dir / "admin" / "static"),
        static_url_path="/static",
    )
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
    app.jinja_env.auto_reload = True

    @app.after_request
    def disable_cache(response):
        cache_targets = {
            "text/html",
            "text/css",
            "application/javascript",
            "application/json",
        }
        if request.path.startswith("/static/") or response.mimetype in cache_targets:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

    repo_service = RepoService(get_data_dir())
    page_service = PageService(repo_service)
    comment_service = CommentService()

    init_dashboard(repo_service, page_service, comment_service)
    init_git(repo_service)
    init_export(page_service)
    init_comments_mgmt(comment_service, page_service)

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(git_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(config_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(comments_mgmt_bp)
    app.register_blueprint(state_bp)
    app.register_blueprint(watcher_mgmt_bp)

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
