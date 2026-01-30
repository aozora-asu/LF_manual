import json
import re

from flask import Blueprint, jsonify, request

from src.common.paths import get_config_dir
from src.common.logger import get_logger

config_bp = Blueprint("config_editor", __name__)
logger = get_logger("admin")

_SAFE_NAME = re.compile(r"^[a-zA-Z0-9_\-]+$")


@config_bp.route("/api/config/list")
def config_list():
    config_dir = get_config_dir()
    files = []
    if config_dir.exists():
        for f in sorted(config_dir.iterdir()):
            if f.is_file() and f.suffix == ".json":
                files.append(f.stem)
    return jsonify(files)


@config_bp.route("/api/config/<name>")
def config_get(name):
    if not _SAFE_NAME.match(name):
        return jsonify({"error": "不正な名前です"}), 400

    config_file = get_config_dir() / f"{name}.json"
    if not config_file.exists():
        return jsonify({"error": "設定ファイルが見つかりません"}), 404

    try:
        with open(config_file, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({"name": name, "content": content})
    except Exception as e:
        logger.error("設定読込失敗: %s - %s", name, e)
        return jsonify({"error": str(e)}), 500


@config_bp.route("/api/config/<name>", methods=["PUT"])
def config_put(name):
    if not _SAFE_NAME.match(name):
        return jsonify({"error": "不正な名前です"}), 400

    config_file = get_config_dir() / f"{name}.json"
    if not config_file.exists():
        return jsonify({"error": "設定ファイルが見つかりません"}), 404

    data = request.get_json()
    content = data.get("content", "")

    try:
        json.loads(content)
    except json.JSONDecodeError as e:
        return jsonify({"error": f"JSON構文エラー: {e}"}), 400

    try:
        with open(config_file, "w", encoding="utf-8") as f:
            f.write(content)
        logger.info("設定保存: %s", name)
        return jsonify({"ok": True})
    except Exception as e:
        logger.error("設定保存失敗: %s - %s", name, e)
        return jsonify({"error": str(e)}), 500
