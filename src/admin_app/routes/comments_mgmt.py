import json

from flask import Blueprint, jsonify

from src.common.paths import get_data_dir
from src.common.logger import get_logger
from src.wiki_app.services.comment_service import CommentService
from src.wiki_app.services.page_service import PageService

comments_mgmt_bp = Blueprint("comments_mgmt", __name__)
logger = get_logger("admin")

_comment_service: CommentService | None = None
_page_service: PageService | None = None


def init_comments_mgmt(
    comment_service: CommentService,
    page_service: PageService,
) -> None:
    global _comment_service, _page_service
    _comment_service = comment_service
    _page_service = page_service


def _slug_from_filename(filename: str) -> str:
    """コメントファイル名からslugを復元する"""
    return filename.replace("__", "/")


def _count_threads_and_comments(data: dict | list) -> tuple[int, int]:
    """スレッド数と総コメント数を返す（旧リスト形式にも対応）"""
    if isinstance(data, list):
        return 0, len(data)
    threads = data.get("threads", {})
    thread_count = len(threads)
    comment_count = sum(len(t.get("comments", [])) for t in threads.values())
    return thread_count, comment_count


@comments_mgmt_bp.route("/api/comments/list")
def comments_list():
    comments_dir = get_data_dir() / "comments"
    result = []
    if comments_dir.exists():
        for f in sorted(comments_dir.glob("*.json")):
            slug = _slug_from_filename(f.stem)
            try:
                with open(f, "r", encoding="utf-8") as fh:
                    data = json.load(fh)
                thread_count, comment_count = _count_threads_and_comments(data)
                result.append({
                    "slug": slug,
                    "filename": f.name,
                    "thread_count": thread_count,
                    "comment_count": comment_count,
                })
            except Exception:
                result.append({
                    "slug": slug,
                    "filename": f.name,
                    "thread_count": -1,
                    "comment_count": -1,
                })
    return jsonify(result)


@comments_mgmt_bp.route("/api/comments/orphans")
def comments_orphans():
    comments_dir = get_data_dir() / "comments"
    orphans = []
    if comments_dir.exists():
        for f in sorted(comments_dir.glob("*.json")):
            slug = _slug_from_filename(f.stem)
            if not _page_service.page_exists(slug):
                try:
                    with open(f, "r", encoding="utf-8") as fh:
                        data = json.load(fh)
                    thread_count, comment_count = _count_threads_and_comments(data)
                except Exception:
                    thread_count, comment_count = -1, -1
                orphans.append({
                    "slug": slug,
                    "filename": f.name,
                    "thread_count": thread_count,
                    "comment_count": comment_count,
                })
    return jsonify(orphans)


@comments_mgmt_bp.route("/api/comments/orphans", methods=["DELETE"])
def comments_delete_orphans():
    comments_dir = get_data_dir() / "comments"
    deleted = []
    if comments_dir.exists():
        for f in sorted(comments_dir.glob("*.json")):
            slug = _slug_from_filename(f.stem)
            if not _page_service.page_exists(slug):
                f.unlink()
                deleted.append(slug)
                logger.info("孤児コメント削除: %s", slug)
    return jsonify({"deleted": deleted, "count": len(deleted)})
