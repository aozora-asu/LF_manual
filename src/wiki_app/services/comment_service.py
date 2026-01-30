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
        safe_name = slug.replace("/", "__")
        return self._comments_dir / f"{safe_name}.json"

    def _load(self, slug: str) -> dict:
        f = self._get_file(slug)
        if not f.exists():
            return {"threads": {}}
        with open(f, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, list):
            return {"threads": {}}
        if "threads" not in data:
            data["threads"] = {}
        return data

    def _save(self, slug: str, data: dict) -> None:
        f = self._get_file(slug)
        with open(f, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)

    def get_threads(self, slug: str) -> dict:
        """全スレッドを取得する"""
        return self._load(slug)

    def create_thread(
        self, slug: str, thread_id: str, selected_text: str, body: str
    ) -> dict:
        """新しいスレッドを作成する"""
        data = self._load(slug)
        now = datetime.now().isoformat(timespec="seconds")
        comment = {
            "id": uuid.uuid4().hex[:8],
            "body": body,
            "created": now,
        }
        thread = {
            "id": thread_id,
            "status": "open",
            "selected_text": selected_text,
            "created": now,
            "comments": [comment],
        }
        data["threads"][thread_id] = thread
        self._save(slug, data)
        logger.info("スレッド作成: %s (thread=%s)", slug, thread_id)
        return thread

    def add_reply(self, slug: str, thread_id: str, body: str) -> dict | None:
        """スレッドに返信を追加する"""
        data = self._load(slug)
        thread = data["threads"].get(thread_id)
        if not thread:
            return None
        comment = {
            "id": uuid.uuid4().hex[:8],
            "body": body,
            "created": datetime.now().isoformat(timespec="seconds"),
        }
        thread["comments"].append(comment)
        self._save(slug, data)
        logger.info("返信追加: %s (thread=%s)", slug, thread_id)
        return comment

    def resolve_thread(self, slug: str, thread_id: str) -> bool:
        """スレッドを解決済みにする"""
        data = self._load(slug)
        thread = data["threads"].get(thread_id)
        if not thread:
            return False
        thread["status"] = "resolved"
        self._save(slug, data)
        logger.info("スレッド解決: %s (thread=%s)", slug, thread_id)
        return True

    def reopen_thread(self, slug: str, thread_id: str) -> bool:
        """スレッドを再開する"""
        data = self._load(slug)
        thread = data["threads"].get(thread_id)
        if not thread:
            return False
        thread["status"] = "open"
        self._save(slug, data)
        logger.info("スレッド再開: %s (thread=%s)", slug, thread_id)
        return True

    def delete_comment(self, slug: str, thread_id: str, comment_id: str) -> bool:
        """スレッド内の個別コメントを削除する（最後の1件なら削除不可）"""
        data = self._load(slug)
        thread = data["threads"].get(thread_id)
        if not thread:
            return False
        comments = thread["comments"]
        if len(comments) <= 1:
            return False
        new_comments = [c for c in comments if c["id"] != comment_id]
        if len(new_comments) == len(comments):
            return False
        thread["comments"] = new_comments
        self._save(slug, data)
        logger.info("コメント削除: %s (thread=%s, comment=%s)", slug, thread_id, comment_id)
        return True

    def delete_thread(self, slug: str, thread_id: str) -> bool:
        """スレッドを削除する"""
        data = self._load(slug)
        if thread_id not in data["threads"]:
            return False
        del data["threads"][thread_id]
        self._save(slug, data)
        logger.info("スレッド削除: %s (thread=%s)", slug, thread_id)
        return True
