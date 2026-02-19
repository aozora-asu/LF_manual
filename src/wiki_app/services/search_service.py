import re

import markdown as md

from src.common.config import load_config
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

        for md_file in self._pages_dir.rglob("*.md"):
            text = md_file.read_text(encoding="utf-8")
            slug = str(md_file.relative_to(self._pages_dir).with_suffix(""))
            page = Page.from_markdown(slug, text)

            title_match = query_lower in page.title.lower()
            body_match = query_lower in page.body.lower()

            if title_match or body_match:
                snippet = ""
                snippet_html = ""
                if body_match:
                    snippet_md = self._extract_snippet_markdown(page.body, query_lower)
                    snippet = self._to_plain_snippet(snippet_md)
                    snippet_html = self._render_snippet_html(snippet_md)

                results.append({
                    "slug": slug,
                    "title": page.title,
                    "snippet": snippet,
                    "snippet_html": snippet_html,
                    "title_match": title_match,
                })

        results.sort(key=lambda r: (not r["title_match"], r["title"]))
        return results

    def _extract_snippet_markdown(self, body: str, query_lower: str) -> str:
        lines = body.splitlines()
        hit = -1
        for i, line in enumerate(lines):
            if query_lower in line.lower():
                hit = i
                break
        if hit < 0:
            return ""

        start = hit
        end = hit
        while start > 0 and lines[start - 1].strip():
            start -= 1
        while end < len(lines) - 1 and lines[end + 1].strip():
            end += 1

        # ブロックが長すぎる場合はヒット周辺だけを抜粋する
        max_lines = 10
        if end - start + 1 > max_lines:
            half = max_lines // 2
            start = max(0, hit - half)
            end = min(len(lines) - 1, start + max_lines - 1)
            start = max(0, end - max_lines + 1)

        snippet = "\n".join(lines[start : end + 1]).strip()
        if not snippet:
            return ""
        if start > 0:
            snippet = "...\n" + snippet
        if end < len(lines) - 1:
            snippet = snippet + "\n..."
        return snippet

    def _to_plain_snippet(self, snippet_md: str) -> str:
        if not snippet_md:
            return ""
        plain = re.sub(r"```[\s\S]*?```", " ", snippet_md)
        plain = re.sub(r"<[^>]+>", " ", plain)
        plain = plain.replace("\n", " ")
        plain = re.sub(r"\s+", " ", plain).strip()
        if len(plain) > 140:
            plain = plain[:140].rstrip() + "..."
        return plain

    def _render_snippet_html(self, snippet_md: str) -> str:
        if not snippet_md:
            return ""
        text = self._preprocess_notes(snippet_md)
        wiki_config = load_config("wiki")
        html = md.markdown(text, extensions=wiki_config.get("markdown_extensions", []))
        return self._postprocess_task_items(html)

    _NOTE_MD_PATTERN = re.compile(
        r"^> \[!(NOTE|WARNING|IMPORTANT|TIP)\]\s*\n((?:> (?!\[!(?:NOTE|WARNING|IMPORTANT|TIP)\]).*\n?)*)",
        re.MULTILINE,
    )
    _NOTE_LABELS = {"NOTE": "情報", "WARNING": "注意", "IMPORTANT": "重要", "TIP": "ヒント"}
    _NOTE_TYPES = {"NOTE": "info", "WARNING": "warning", "IMPORTANT": "important", "TIP": "tip"}
    _TASK_ITEM_PATTERN = re.compile(
        r"<(?P<tag>p|li)>\s*\[(?P<mark>[ xX])\]\s*(?P<body>.*?)</(?P=tag)>",
        re.DOTALL,
    )

    def _preprocess_notes(self, text: str) -> str:
        def _replace(m: re.Match) -> str:
            kind = m.group(1)
            body_lines = m.group(2).strip().splitlines()
            body = "\n".join(
                line[2:] if line.startswith("> ") else line[1:] if line.startswith(">") else line
                for line in body_lines
            )
            note_type = self._NOTE_TYPES[kind]
            label = self._NOTE_LABELS[kind]
            wiki_config = load_config("wiki")
            body_html = md.markdown(body, extensions=wiki_config.get("markdown_extensions", []))
            return (
                f'<div class="note note-{note_type}" data-note-type="{note_type}">'
                f'<div class="note-title">{label}</div>'
                f'<div class="note-body">{body_html}</div>'
                f"</div>\n"
            )

        return self._NOTE_MD_PATTERN.sub(_replace, text)

    def _postprocess_task_items(self, html: str) -> str:
        def _replace(m: re.Match) -> str:
            checked = m.group("mark").lower() == "x"
            tag = m.group("tag")
            body = m.group("body").strip() or "&nbsp;"
            checked_attr = " checked" if checked else ""
            return (
                f'<{tag}><label class="check-item">'
                f'<input type="checkbox"{checked_attr} disabled> {body}'
                f"</label></{tag}>"
            )

        return self._TASK_ITEM_PATTERN.sub(_replace, html)
