import json
import re
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
        self._page_order_file = get_data_dir() / "page_order.json"

    def _slug_from_path(self, md_file: Path) -> str:
        """mdファイルパスから階層slugを算出する（例: 日勤/手順書）"""
        rel = md_file.relative_to(self._pages_dir)
        return str(rel.with_suffix(""))

    def list_pages(self) -> list[Page]:
        """全ページを一覧で返す（更新日降順）"""
        pages = []
        for md_file in self._pages_dir.rglob("*.md"):
            slug = self._slug_from_path(md_file)
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

    def create_page(self, slug: str, title: str, body: str) -> Page:
        """ページを新規作成する"""
        now = datetime.now().isoformat(timespec="seconds")
        page = Page(
            slug=slug,
            title=title,
            body=body,
            created=now,
            updated=now,
        )
        md_text = page.to_markdown()
        md_file = self._pages_dir / f"{slug}.md"
        md_file.parent.mkdir(parents=True, exist_ok=True)
        md_file.write_text(md_text, encoding="utf-8")

        self._repo.commit(
            f"pages/{slug}.md",
            md_text.encode("utf-8"),
            f"Create: {title}",
        )
        logger.info("ページ作成: %s (%s)", slug, title)
        return page

    def update_page(self, slug: str, title: str, body: str) -> Page:
        """ページを更新する"""
        existing = self.get_page(slug)
        created = existing.created if existing else datetime.now().isoformat(timespec="seconds")

        page = Page(
            slug=slug,
            title=title,
            body=body,
            created=created,
            updated=datetime.now().isoformat(timespec="seconds"),
        )
        md_text = page.to_markdown()
        md_file = self._pages_dir / f"{slug}.md"
        md_file.parent.mkdir(parents=True, exist_ok=True)
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

        self._cleanup_empty_dirs(md_file.parent)

        self._repo.delete(
            f"pages/{slug}.md",
            f"Delete: {title}",
        )
        logger.info("ページ削除: %s (%s)", slug, title)

    def _cleanup_empty_dirs(self, directory: Path) -> None:
        """空のディレクトリを再帰的に削除する（pages_dirまで）"""
        while directory != self._pages_dir and directory.is_dir():
            if any(directory.iterdir()):
                break
            directory.rmdir()
            directory = directory.parent

    def page_exists(self, slug: str) -> bool:
        """スラッグのページが存在するか確認する"""
        return (self._pages_dir / f"{slug}.md").exists()

    def load_page_order(self) -> dict:
        """page_order.json を読み込む"""
        if self._page_order_file.exists():
            try:
                return json.loads(self._page_order_file.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                logger.warning("page_order.json の読み込みに失敗")
        return {}

    def save_page_order(self, order: dict) -> None:
        """page_order.json を保存する"""
        self._page_order_file.write_text(
            json.dumps(order, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def reorder_pages(self, directory: str, slugs: list[str]) -> None:
        """指定ディレクトリ内のページ順序を保存する"""
        order = self.load_page_order()
        order[directory] = slugs
        self.save_page_order(order)
        logger.info("ページ並び替え: directory=%s, slugs=%s", directory, slugs)

    def reorder_dirs(self, parent: str, dir_names: list[str]) -> None:
        """指定親ディレクトリ内の子ディレクトリ順序を保存する"""
        order = self.load_page_order()
        key = "_dirs:" + parent
        order[key] = dir_names
        self.save_page_order(order)
        logger.info("ディレクトリ並び替え: parent=%s, dirs=%s", parent, dir_names)

    def _title_to_slug(self, title: str) -> str:
        """タイトルからslug（ファイル名部分）を生成する"""
        slug = re.sub(r"[^\w\-]", "-", title.lower()).strip("-")
        slug = re.sub(r"-+", "-", slug)
        return slug or "untitled"

    def rename_page(self, slug: str, new_title: str) -> Page | None:
        """ページのタイトルを更新し、slugも新タイトルに合わせて変更する"""
        page = self.get_page(slug)
        if not page:
            return None

        # ディレクトリ部分を保持して新slugを生成
        parts = slug.split("/")
        directory = "/".join(parts[:-1])
        new_filename = self._title_to_slug(new_title)
        new_slug = f"{directory}/{new_filename}" if directory else new_filename

        # slug が変わらない場合はタイトルだけ更新
        if new_slug == slug:
            return self.update_page(slug, new_title, page.body)

        # 衝突回避
        if self.page_exists(new_slug):
            counter = 2
            while self.page_exists(f"{new_slug}-{counter}"):
                counter += 1
            new_slug = f"{new_slug}-{counter}"

        # タイトルを更新してから移動
        updated = self.update_page(slug, new_title, page.body)
        if not updated:
            return None
        return self.move_page(slug, new_slug)

    def get_tree(self) -> dict:
        """ページ階層をネストdictで返す（API用）"""
        tree = {"name": "root", "children": {}, "pages": []}
        for md_file in self._pages_dir.rglob("*.md"):
            slug = self._slug_from_path(md_file)
            text = md_file.read_text(encoding="utf-8")
            page = Page.from_markdown(slug, text)
            parts = slug.split("/")

            node = tree
            for part in parts[:-1]:
                if part not in node["children"]:
                    node["children"][part] = {"name": part, "children": {}, "pages": []}
                node = node["children"][part]
            node["pages"].append({"slug": slug, "title": page.title})

        page_order = self.load_page_order()
        return self._sort_tree(tree, page_order, "")

    def _sort_tree(self, node: dict, page_order: dict, current_path: str) -> dict:
        """ツリーのページとディレクトリをソートする（page_order優先）"""
        if current_path in page_order:
            order_list = page_order[current_path]
            order_map = {slug: i for i, slug in enumerate(order_list)}
            node["pages"].sort(
                key=lambda p: (order_map.get(p["slug"], len(order_list)), p["title"])
            )
        else:
            node["pages"].sort(key=lambda p: p["title"])

        dir_order_key = "_dirs:" + current_path
        child_keys = list(node["children"].keys())
        if dir_order_key in page_order:
            dir_order_list = page_order[dir_order_key]
            dir_order_map = {name: i for i, name in enumerate(dir_order_list)}
            child_keys.sort(
                key=lambda k: (dir_order_map.get(k, len(dir_order_list)), k)
            )
        else:
            child_keys.sort()

        sorted_children = {}
        for key in child_keys:
            child_path = current_path + "/" + key if current_path else key
            sorted_children[key] = self._sort_tree(
                node["children"][key], page_order, child_path
            )
        node["children"] = sorted_children
        return node

    def move_page(self, old_slug: str, new_slug: str) -> Page | None:
        """ページを別の階層に移動する"""
        page = self.get_page(old_slug)
        if not page:
            return None
        if old_slug == new_slug:
            return page
        if self.page_exists(new_slug):
            return None

        old_file = self._pages_dir / f"{old_slug}.md"
        new_file = self._pages_dir / f"{new_slug}.md"
        new_file.parent.mkdir(parents=True, exist_ok=True)

        md_text = old_file.read_text(encoding="utf-8")
        new_file.write_text(md_text, encoding="utf-8")
        old_file.unlink()
        self._cleanup_empty_dirs(old_file.parent)

        self._repo.delete(
            f"pages/{old_slug}.md",
            f"Move: {page.title} ({old_slug} -> {new_slug})",
        )
        self._repo.commit(
            f"pages/{new_slug}.md",
            md_text.encode("utf-8"),
            f"Move: {page.title} ({old_slug} -> {new_slug})",
        )
        logger.info("ページ移動: %s -> %s", old_slug, new_slug)
        return Page.from_markdown(new_slug, md_text)

    def insert_comment_tag(
        self,
        slug: str,
        selected_text: str,
        thread_id: str,
        context_before: str = "",
        context_after: str = "",
    ) -> bool:
        """Markdownソース内の selected_text を <comment id="thread_id">...</comment> で囲む"""
        md_file = self._pages_dir / f"{slug}.md"
        if not md_file.exists():
            return False
        content = md_file.read_text(encoding="utf-8")

        # context を使って正確な位置を特定する
        if context_before or context_after:
            needle = context_before + selected_text + context_after
            pos = content.find(needle)
            if pos != -1:
                start = pos + len(context_before)
                end = start + len(selected_text)
                tag = f'<comment id="{thread_id}">{selected_text}</comment>'
                new_content = content[:start] + tag + content[end:]
                md_file.write_text(new_content, encoding="utf-8")
                return True

        # フォールバック: 単純な文字列置換（最初の出現）
        if selected_text in content:
            tag = f'<comment id="{thread_id}">{selected_text}</comment>'
            new_content = content.replace(selected_text, tag, 1)
            md_file.write_text(new_content, encoding="utf-8")
            return True

        return False

    def remove_comment_tag(self, slug: str, thread_id: str) -> bool:
        """Markdownソースから <comment id="thread_id">...</comment> タグを除去し中身だけ残す"""
        md_file = self._pages_dir / f"{slug}.md"
        if not md_file.exists():
            return False
        content = md_file.read_text(encoding="utf-8")
        pattern = re.compile(
            r'<comment\s+id="' + re.escape(thread_id) + r'">(.*?)</comment>',
            re.DOTALL,
        )
        new_content, count = pattern.subn(r"\1", content)
        if count == 0:
            return False
        md_file.write_text(new_content, encoding="utf-8")
        return True

    def list_directories(self) -> list[str]:
        """全ディレクトリ一覧を返す（新規作成フォーム用）"""
        dirs = set()
        for md_file in self._pages_dir.rglob("*.md"):
            rel = md_file.relative_to(self._pages_dir).parent
            if str(rel) != ".":
                parts = rel.parts
                for i in range(len(parts)):
                    dirs.add("/".join(parts[: i + 1]))
        return sorted(dirs)
