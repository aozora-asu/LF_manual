import json
from datetime import datetime

from flask import Blueprint, jsonify

from src.common.paths import get_state_dir, get_config_dir
from src.common.logger import get_logger

watcher_mgmt_bp = Blueprint("watcher_mgmt", __name__)
logger = get_logger("admin")


@watcher_mgmt_bp.route("/api/watcher/overview")
def watcher_overview():
    """Watcher全体のステータスを返す"""
    index_path = get_state_dir() / "watcher" / "index.json"
    config_path = get_config_dir() / "watcher.json"

    result = {
        "running": False,
        "last_run": "",
        "night_stop": {},
        "targets": [],
    }

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        result["night_stop"] = config.get("night_stop", {})
        config_targets = config.get("targets", [])
    except Exception as e:
        logger.warning("Watcher設定の読み込み失敗: %s", e)
        config_targets = []

    index_data = {}
    try:
        if index_path.exists():
            with open(index_path, "r", encoding="utf-8") as f:
                index_data = json.load(f)
            result["running"] = True
            result["last_run"] = index_data.get("last_run", "")
    except Exception as e:
        logger.warning("Watcherインデックスの読み込み失敗: %s", e)

    index_targets = index_data.get("targets", {})

    for ct in config_targets:
        name = ct.get("name", "unknown")
        target_type = ct.get("type", "generic")
        enabled = ct.get("enabled", True)

        state = None
        for _hash, t in index_targets.items():
            if t.get("name") == name:
                state = t
                break

        target_info = {
            "name": name,
            "type": target_type,
            "enabled": enabled,
            "status": state.get("status", "unknown") if state else "未実行",
            "last_checked": state.get("last_checked", "") if state else "",
            "last_changed": state.get("last_changed", "") if state else "",
        }

        if target_type == "train":
            target_info["url"] = ct.get("url", "")
        elif target_type == "weather":
            target_info["url"] = ct.get("warning_url", "")
        elif target_type == "outage":
            target_info["url"] = ct.get("base_url", "")
        else:
            target_info["url"] = ct.get("url", "")

        result["targets"].append(target_info)

    return jsonify(result)


@watcher_mgmt_bp.route("/api/watcher/events")
def watcher_events():
    """最新のイベント一覧を返す（最新20件）"""
    events_dir = get_state_dir() / "watcher" / "events"
    events = []

    if events_dir.exists():
        event_files = sorted(events_dir.glob("*.json"), reverse=True)
        for ef in event_files[:20]:
            try:
                with open(ef, "r", encoding="utf-8") as f:
                    event = json.load(f)
                event["filename"] = ef.name
                events.append(event)
            except Exception:
                pass

    return jsonify(events)


@watcher_mgmt_bp.route("/api/watcher/events/history")
def watcher_events_history():
    """全イベントの件数と日別サマリーを返す"""
    events_dir = get_state_dir() / "watcher" / "events"
    total = 0
    by_target: dict[str, int] = {}

    if events_dir.exists():
        for ef in events_dir.glob("*.json"):
            total += 1
            try:
                with open(ef, "r", encoding="utf-8") as f:
                    event = json.load(f)
                name = event.get("target_name", "unknown")
                by_target[name] = by_target.get(name, 0) + 1
            except Exception:
                pass

    return jsonify({
        "total_events": total,
        "by_target": by_target,
    })
