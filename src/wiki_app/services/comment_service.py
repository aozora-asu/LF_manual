import json
import uuid
from datetime import datetime
from pathlib import Path

from src.common.paths import get_data_dir
from src.common.logger import get_logger

logger = get_logger("wiki")


class CommentService:
    def __init__(self):
        self._comments_dir = get_data_dir() / "comments"
        self._comments_dir.mkdir(parents=True, exist_ok=True)

    def _get_file(self, slug: str) -> Path:
        return self._comments_dir / f"{slug}.json"

    def _load(self, slug: str) -> list[dict]:
        f = self._get_file(slug)
        if not f.exists():
            return []
        with open(f, "r", encoding="utf-8") as fh:
            return json.load(fh)

    def _save(self, slug: str, comments: list[dict]) -> None:
        f = self._get_file(slug)
        with open(f, "w", encoding="utf-8") as fh:
            json.dump(comments, fh, ensure_ascii=False, indent=2)

    def get_comments(self, slug: str) -> list[dict]:
        """コメント一覧を取得する"""
        return self._load(slug)

    def add_comment(self, slug: str, author: str, body: str) -> dict:
        """コメントを追加する"""
        comments = self._load(slug)
        comment = {
            "id": uuid.uuid4().hex[:8],
            "author": author or "名前なし",
            "body": body,
            "created": datetime.now().isoformat(timespec="seconds"),
        }
        comments.append(comment)
        self._save(slug, comments)
        logger.info("コメント追加: %s (%s)", slug, comment["id"])
        return comment

    def delete_comment(self, slug: str, comment_id: str) -> bool:
        """コメントを削除する"""
        comments = self._load(slug)
        new_comments = [c for c in comments if c["id"] != comment_id]
        if len(new_comments) == len(comments):
            return False
        self._save(slug, new_comments)
        logger.info("コメント削除: %s (%s)", slug, comment_id)
        return True
