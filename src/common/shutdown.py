import atexit
import hashlib
import json
import os
from typing import Iterable

from src.common.config import load_config
from src.common.logger import get_logger
from src.common.paths import get_state_dir

logger = get_logger("app")

_CLEANUP_TYPES = {"train", "weather", "outage"}


def register_exit_cleanup() -> None:
    """通常終了時にもクリーンアップを実行する"""
    atexit.register(_cleanup_on_exit)


def cleanup_and_exit(reason: str) -> None:
    """クリーンアップ後に強制終了する（os._exit）"""
    try:
        logger.info(reason)
        _cleanup_on_exit()
    finally:
        os._exit(0)


def _cleanup_on_exit() -> None:
    """停電・電車・気象情報の状態を終了時に削除する"""
    try:
        cleanup_watcher_targets(_CLEANUP_TYPES)
    except Exception as e:
        logger.warning("終了時クリーンアップ失敗: %s", e)


def cleanup_watcher_targets(target_types: Iterable[str]) -> None:
    """指定タイプのWatcher状態（events/snapshots/index）を削除する"""
    config = load_config("watcher")
    targets = config.get("targets", [])
    names = {
        t.get("name")
        for t in targets
        if t.get("type") in set(target_types) and t.get("name")
    }
    if not names:
        return

    state_dir = get_state_dir() / "watcher"
    snapshots_dir = state_dir / "snapshots"
    events_dir = state_dir / "events"
    index_path = state_dir / "index.json"

    # snapshots
    removed_snapshots = 0
    for name in names:
        name_hash = hashlib.sha256(name.encode("utf-8")).hexdigest()[:16]
        snapshot_path = snapshots_dir / f"{name_hash}.txt"
        if snapshot_path.exists():
            snapshot_path.unlink()
            removed_snapshots += 1

    # events
    removed_events = 0
    if events_dir.exists():
        for ef in events_dir.glob("*.json"):
            try:
                with open(ef, "r", encoding="utf-8") as f:
                    event = json.load(f)
                if event.get("target_name") in names:
                    ef.unlink()
                    removed_events += 1
            except Exception:
                pass

    # index.json
    removed_index = 0
    if index_path.exists():
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                index = json.load(f)
            targets_map = index.get("targets", {})
            filtered = {
                h: t for h, t in targets_map.items() if t.get("name") not in names
            }
            removed_index = len(targets_map) - len(filtered)
            index["targets"] = filtered
            with open(index_path, "w", encoding="utf-8") as f:
                json.dump(index, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    logger.info(
        "終了時クリーンアップ: snapshots=%d, events=%d, index=%d",
        removed_snapshots,
        removed_events,
        removed_index,
    )
