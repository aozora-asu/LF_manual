from pathlib import Path

from src.common.paths import get_data_dir
from src.wiki_app.models.page import Page


class SearchService:
    def __init__(self):
        self._pages_dir = get_data_dir() / "pages"

    def search(self, query: str) -> list[dict]:
        """全文検索を行い、マッチしたページ情報を返す"""
        if not query.strip():
            return []

        query_lower = query.lower()
        results = []

        for md_file in self._pages_dir.glob("*.md"):
            text = md_file.read_text(encoding="utf-8")
            slug = md_file.stem
            page = Page.from_markdown(slug, text)

            title_match = query_lower in page.title.lower()
            body_match = query_lower in page.body.lower()

            if title_match or body_match:
                snippet = ""
                if body_match:
                    idx = page.body.lower().find(query_lower)
                    start = max(0, idx - 50)
                    end = min(len(page.body), idx + len(query) + 50)
                    snippet = page.body[start:end]
                    if start > 0:
                        snippet = "..." + snippet
                    if end < len(page.body):
                        snippet = snippet + "..."

                results.append({
                    "slug": slug,
                    "title": page.title,
                    "snippet": snippet,
                    "title_match": title_match,
                })

        results.sort(key=lambda r: (not r["title_match"], r["title"]))
        return results
