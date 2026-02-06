import json
from datetime import datetime
from pathlib import Path

from src.common.paths import get_state_dir
from src.common.logger import get_logger
from src.watcher.detector import get_target_hash

logger = get_logger("watcher")


def write_event(target: dict, detect_mode: str, summary: str) -> None:
    """変更イベントを state/watcher/events/ にJSONとして書き出す"""
    events_dir = get_state_dir() / "watcher" / "events"
    events_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now()
    target_hash = get_target_hash(target["name"])
    filename = f"{now.strftime('%Y%m%d%H%M%S')}_{target_hash}.json"
    url = _resolve_target_url(target)

    event = {
        "target_name": target["name"],
        "url": url,
        "detected_at": now.isoformat(timespec="seconds"),
        "detect_mode": detect_mode,
        "summary": summary,
    }

    event_path = events_dir / filename
    with open(event_path, "w", encoding="utf-8") as f:
        json.dump(event, f, ensure_ascii=False, indent=2)

    logger.info("イベント書き出し: %s", filename)


def update_index(
    target: dict,
    status: str,
    changed: bool,
    alert_hash: str | None = None,
    alert_active: bool = False,
    alert_summary: str | None = None,
) -> None:
    """state/watcher/index.json を更新する"""
    index_path = get_state_dir() / "watcher" / "index.json"

    index = _load_index(index_path)

    now = datetime.now().isoformat(timespec="seconds")
    target_hash = get_target_hash(target["name"])

    if target_hash not in index["targets"]:
        index["targets"][target_hash] = {
            "name": target["name"],
            "last_checked": "",
            "last_changed": "",
            "status": "ok",
        }

    index["last_run"] = now
    entry = index["targets"][target_hash]
    entry["last_checked"] = now
    entry["status"] = status
    if changed:
        entry["last_changed"] = now

    if alert_active:
        entry["alert_active"] = True
        if alert_hash:
            entry["last_alert_hash"] = alert_hash
            entry["last_alert_at"] = now
        if alert_summary:
            entry["last_alert_summary"] = alert_summary
    else:
        entry["alert_active"] = False
        entry.pop("last_alert_hash", None)
        entry.pop("last_alert_at", None)
        entry.pop("last_alert_summary", None)

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)


def _resolve_target_url(target: dict) -> str:
    if target.get("url"):
        return target.get("url", "")
    target_type = target.get("type", "")
    if target_type == "weather":
        return target.get("warning_url", "")
    if target_type == "outage":
        return target.get("base_url", "")
    if target_type == "train":
        return target.get("url", "")
    return ""


def get_target_entry(target: dict) -> dict:
    """index.json からターゲット情報を取得する"""
    index_path = get_state_dir() / "watcher" / "index.json"
    index = _load_index(index_path)
    target_hash = get_target_hash(target.get("name", ""))
    return index.get("targets", {}).get(target_hash, {})


def _load_index(index_path: Path) -> dict:
    index = {"last_run": "", "targets": {}}
    if index_path.exists():
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                index = json.load(f)
        except (json.JSONDecodeError, OSError):
            index = {"last_run": "", "targets": {}}
    return index
