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

    event = {
        "target_name": target["name"],
        "url": target["url"],
        "detected_at": now.isoformat(timespec="seconds"),
        "detect_mode": detect_mode,
        "summary": summary,
    }

    event_path = events_dir / filename
    with open(event_path, "w", encoding="utf-8") as f:
        json.dump(event, f, ensure_ascii=False, indent=2)

    logger.info("イベント書き出し: %s", filename)


def update_index(target: dict, status: str, changed: bool) -> None:
    """state/watcher/index.json を更新する"""
    index_path = get_state_dir() / "watcher" / "index.json"

    if index_path.exists():
        with open(index_path, "r", encoding="utf-8") as f:
            index = json.load(f)
    else:
        index = {"last_run": "", "targets": {}}

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
    index["targets"][target_hash]["last_checked"] = now
    index["targets"][target_hash]["status"] = status
    if changed:
        index["targets"][target_hash]["last_changed"] = now

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
