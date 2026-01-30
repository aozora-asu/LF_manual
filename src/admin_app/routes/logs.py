import os
import re

from flask import Blueprint, jsonify, request

from src.common.paths import get_logs_dir
from src.common.logger import get_logger

logs_bp = Blueprint("logs", __name__)
logger = get_logger("admin")

_SAFE_FILENAME = re.compile(r"^[a-zA-Z0-9_\-]+\.log$")


@logs_bp.route("/api/logs/list")
def logs_list():
    logs_dir = get_logs_dir()
    files = []
    if logs_dir.exists():
        for f in sorted(logs_dir.iterdir()):
            if f.is_file() and f.suffix == ".log":
                files.append({
                    "name": f.name,
                    "size_bytes": f.stat().st_size,
                })
    return jsonify(files)


@logs_bp.route("/api/logs/<filename>")
def logs_content(filename):
    if not _SAFE_FILENAME.match(filename):
        return jsonify({"error": "不正なファイル名です"}), 400

    log_file = get_logs_dir() / filename
    if not log_file.exists():
        return jsonify({"error": "ファイルが見つかりません"}), 404

    tail_lines = request.args.get("lines", 100, type=int)
    tail_lines = min(tail_lines, 1000)

    try:
        with open(log_file, "r", encoding="utf-8", errors="replace") as f:
            all_lines = f.readlines()
        lines = all_lines[-tail_lines:]
        return jsonify({
            "filename": filename,
            "total_lines": len(all_lines),
            "lines": [line.rstrip("\n") for line in lines],
        })
    except Exception as e:
        logger.error("ログファイル読込失敗: %s - %s", filename, e)
        return jsonify({"error": str(e)}), 500
