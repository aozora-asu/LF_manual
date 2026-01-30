import os

from flask import Blueprint, jsonify

from src.common.paths import get_state_dir
from src.common.logger import get_logger

state_bp = Blueprint("state_cleanup", __name__)
logger = get_logger("admin")


def _dir_stats(directory):
    """ディレクトリ内のファイル数と合計サイズを返す"""
    file_count = 0
    total_size = 0
    if directory.exists():
        for f in directory.iterdir():
            if f.is_file():
                file_count += 1
                try:
                    total_size += f.stat().st_size
                except OSError:
                    pass
    return {"file_count": file_count, "total_size_bytes": total_size}


@state_bp.route("/api/state/watcher")
def watcher_state():
    watcher_dir = get_state_dir() / "watcher"
    snapshots_dir = watcher_dir / "snapshots"
    events_dir = watcher_dir / "events"

    return jsonify({
        "snapshots": _dir_stats(snapshots_dir),
        "events": _dir_stats(events_dir),
    })


@state_bp.route("/api/state/watcher/snapshots", methods=["DELETE"])
def delete_snapshots():
    snapshots_dir = get_state_dir() / "watcher" / "snapshots"
    deleted = 0
    if snapshots_dir.exists():
        for f in snapshots_dir.iterdir():
            if f.is_file():
                f.unlink()
                deleted += 1
    logger.info("スナップショット削除: %d 件", deleted)
    return jsonify({"deleted": deleted})


@state_bp.route("/api/state/watcher/events", methods=["DELETE"])
def delete_events():
    events_dir = get_state_dir() / "watcher" / "events"
    deleted = 0
    if events_dir.exists():
        for f in events_dir.iterdir():
            if f.is_file():
                f.unlink()
                deleted += 1
    logger.info("イベント削除: %d 件", deleted)
    return jsonify({"deleted": deleted})
