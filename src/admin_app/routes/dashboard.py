import json
import os

from flask import Blueprint, render_template, jsonify

from src.common.paths import get_data_dir, get_state_dir
from src.common.config import load_config
from src.common.logger import get_logger
from src.wiki_app.services.repo_service import RepoService
from src.wiki_app.services.page_service import PageService
from src.wiki_app.services.comment_service import CommentService

dashboard_bp = Blueprint("dashboard", __name__)
logger = get_logger("admin")

_repo_service: RepoService | None = None
_page_service: PageService | None = None
_comment_service: CommentService | None = None


def init_dashboard(
    repo_service: RepoService,
    page_service: PageService,
    comment_service: CommentService,
) -> None:
    global _repo_service, _page_service, _comment_service
    _repo_service = repo_service
    _page_service = page_service
    _comment_service = comment_service


@dashboard_bp.route("/")
def index():
    return render_template("dashboard.html")


@dashboard_bp.route("/api/stats")
def stats():
    page_count = 0
    comment_count = 0
    disk_usage = 0
    commit_count = 0
    watcher_status = "不明"
    config_targets = []
    config_names: set[str] = set()

    try:
        pages = _page_service.list_pages()
        page_count = len(pages)
    except Exception as e:
        logger.warning("ページ数の取得に失敗: %s", e)

    try:
        comments_dir = get_data_dir() / "comments"
        if comments_dir.exists():
            for f in comments_dir.glob("*.json"):
                try:
                    with open(f, "r", encoding="utf-8") as fh:
                        data = json.load(fh)
                        if isinstance(data, dict) and "threads" in data:
                            comment_count += len(data["threads"])
                        elif isinstance(data, list):
                            comment_count += len(data)
                except Exception:
                    pass
    except Exception as e:
        logger.warning("コメント数の取得に失敗: %s", e)

    try:
        data_dir = get_data_dir()
        for dirpath, _dirnames, filenames in os.walk(data_dir):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                try:
                    disk_usage += os.path.getsize(filepath)
                except OSError:
                    pass
    except Exception as e:
        logger.warning("ディスク使用量の取得に失敗: %s", e)

    try:
        commits = _repo_service.log_all(max_count=9999)
        commit_count = len(commits)
    except Exception as e:
        logger.warning("コミット数の取得に失敗: %s", e)

    try:
        config = load_config("watcher")
        config_targets = [
            t for t in config.get("targets", []) if t.get("enabled", True)
        ]
        config_names = {t.get("name") for t in config_targets if t.get("name")}
    except Exception as e:
        logger.warning("Watcher設定の読み込みに失敗: %s", e)
        config_targets = []
        config_names = set()

    try:
        index_path = get_state_dir() / "watcher" / "index.json"
        if index_path.exists():
            with open(index_path, "r", encoding="utf-8") as f:
                watcher_index = json.load(f)
            targets = watcher_index.get("targets", {})
            if config_names:
                targets = {
                    h: t for h, t in targets.items() if t.get("name") in config_names
                }
            error_count = sum(
                1 for t in targets.values() if t.get("status") == "error"
            )
            target_total = len(config_targets) if config_names else len(targets)
            if error_count > 0:
                watcher_status = f"監視中 ({target_total}件 / {error_count}件エラー)"
            else:
                watcher_status = f"監視中 ({target_total}件)"
        else:
            watcher_status = "未稼働"
    except Exception as e:
        logger.warning("Watcher状態の取得に失敗: %s", e)
        watcher_status = "取得エラー"

    return jsonify({
        "page_count": page_count,
        "comment_count": comment_count,
        "disk_usage_bytes": disk_usage,
        "commit_count": commit_count,
        "watcher_status": watcher_status,
    })
