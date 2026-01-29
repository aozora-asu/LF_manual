import hashlib
import re
from pathlib import Path

from src.common.paths import get_state_dir
from src.common.logger import get_logger

logger = get_logger("watcher")


def _get_snapshot_path(target_name: str) -> Path:
    name_hash = hashlib.sha256(target_name.encode("utf-8")).hexdigest()[:16]
    return get_state_dir() / "watcher" / "snapshots" / f"{name_hash}.txt"


def get_target_hash(target_name: str) -> str:
    return hashlib.sha256(target_name.encode("utf-8")).hexdigest()[:16]


def detect_change(
    target_name: str,
    current_text: str,
    detect_mode: str,
    ignore_patterns: list[str] | None = None,
) -> bool:
    """前回スナップショットと比較し、変更があれば True を返す。
    スナップショットを更新する。"""
    snapshot_path = _get_snapshot_path(target_name)
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)

    processed = current_text
    if ignore_patterns:
        for pattern in ignore_patterns:
            processed = re.sub(pattern, "", processed)

    if not snapshot_path.exists():
        snapshot_path.write_text(processed, encoding="utf-8")
        logger.info("初回スナップショット保存: %s", target_name)
        return False

    previous = snapshot_path.read_text(encoding="utf-8")

    changed = False
    if detect_mode == "text_change":
        changed = processed != previous
    elif detect_mode == "element_added":
        changed = len(processed) > len(previous)
    elif detect_mode == "keyword":
        changed = processed != previous
    else:
        changed = processed != previous

    if changed:
        logger.info("変更検出: %s (mode=%s)", target_name, detect_mode)

    snapshot_path.write_text(processed, encoding="utf-8")
    return changed
