from pathlib import Path
from datetime import datetime

from src.common.paths import get_data_dir
from src.common.logger import get_logger
from src.wiki_app.models.page import Page
from src.wiki_app.services.repo_service import RepoService

logger = get_logger("wiki")


class PageService:
    def __init__(self, repo_service: RepoService):
        self._repo = repo_service
        self._pages_dir = get_data_dir() / "pages"
        self._pages_dir.mkdir(parents=True, exist_ok=True)

    def list_pages(self) -> list[Page]:
        """全ページを一覧で返す（更新日降順）"""
        pages = []
        for md_file in self._pages_dir.glob("*.md"):
            slug = md_file.stem
            text = md_file.read_text(encoding="utf-8")
            page = Page.from_markdown(slug, text)
            pages.append(page)
        pages.sort(key=lambda p: p.updated or p.created, reverse=True)
        return pages

    def get_page(self, slug: str) -> Page | None:
        """スラッグでページを取得する"""
        md_file = self._pages_dir / f"{slug}.md"
        if not md_file.exists():
            return None
        text = md_file.read_text(encoding="utf-8")
        return Page.from_markdown(slug, text)

    def create_page(self, slug: str, title: str, body: str, tags: list[str] | None = None) -> Page:
        """ページを新規作成する"""
        now = datetime.now().isoformat(timespec="seconds")
        page = Page(
            slug=slug,
            title=title,
            body=body,
            created=now,
            updated=now,
            tags=tags or [],
        )
        md_text = page.to_markdown()
        md_file = self._pages_dir / f"{slug}.md"
        md_file.write_text(md_text, encoding="utf-8")

        self._repo.commit(
            f"pages/{slug}.md",
            md_text.encode("utf-8"),
            f"Create: {title}",
        )
        logger.info("ページ作成: %s (%s)", slug, title)
        return page

    def update_page(self, slug: str, title: str, body: str, tags: list[str] | None = None) -> Page:
        """ページを更新する"""
        existing = self.get_page(slug)
        created = existing.created if existing else datetime.now().isoformat(timespec="seconds")

        page = Page(
            slug=slug,
            title=title,
            body=body,
            created=created,
            updated=datetime.now().isoformat(timespec="seconds"),
            tags=tags or [],
        )
        md_text = page.to_markdown()
        md_file = self._pages_dir / f"{slug}.md"
        md_file.write_text(md_text, encoding="utf-8")

        self._repo.commit(
            f"pages/{slug}.md",
            md_text.encode("utf-8"),
            f"Edit: {title}",
        )
        logger.info("ページ更新: %s (%s)", slug, title)
        return page

    def delete_page(self, slug: str) -> None:
        """ページを削除する"""
        page = self.get_page(slug)
        title = page.title if page else slug

        md_file = self._pages_dir / f"{slug}.md"
        if md_file.exists():
            md_file.unlink()

        self._repo.delete(
            f"pages/{slug}.md",
            f"Delete: {title}",
        )
        logger.info("ページ削除: %s (%s)", slug, title)

    def page_exists(self, slug: str) -> bool:
        """スラッグのページが存在するか確認する"""
        return (self._pages_dir / f"{slug}.md").exists()
