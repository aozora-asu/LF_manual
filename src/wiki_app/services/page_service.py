import json
import re
from pathlib import Path
from datetime import datetime
from uuid import uuid4

from src.common.paths import get_data_dir
from src.common.logger import get_logger
from src.wiki_app.models.page import Page
from src.wiki_app.services.backup_service import BackupService
from src.wiki_app.services.repo_service import RepoService

logger = get_logger("wiki")


class PageService:
    def __init__(self, repo_service: RepoService):
        self._repo = repo_service
        self._pages_dir = get_data_dir() / "pages"
        self._pages_dir.mkdir(parents=True, exist_ok=True)
        self._trash_pages_dir = get_data_dir() / "trash" / "pages"
        self._trash_pages_dir.mkdir(parents=True, exist_ok=True)
        self._trash_index_file = get_data_dir() / "trash" / "trash_index.json"
        self._page_order_file = get_data_dir() / "page_order.json"
        self._backup = BackupService(self)

    def _refresh_backup(self) -> None:
        try:
            self._backup.refresh_latest_backup()
        except Exception:
            logger.exception("最新版バックアップの更新に失敗")

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

    def create_page(self, slug: str, title: str, body: str, run_backup: bool = True) -> Page:
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
        if run_backup:
            self._refresh_backup()
        logger.info("ページ作成: %s (%s)", slug, title)
        return page

    def update_page(self, slug: str, title: str, body: str, run_backup: bool = True) -> Page:
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
        if run_backup:
            self._refresh_backup()
        logger.info("ページ更新: %s (%s)", slug, title)
        return page

    def delete_page(self, slug: str) -> None:
        """ページをゴミ箱へ移動する"""
        self.trash_page(slug)

    def _load_trash_index(self) -> list[dict]:
        if not self._trash_index_file.exists():
            return []
        try:
            raw = json.loads(self._trash_index_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        if not isinstance(raw, list):
            return []
        items: list[dict] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            trash_id = str(item.get("id", "")).strip()
            slug = str(item.get("slug", "")).strip().strip("/")
            title = str(item.get("title", "")).strip()
            deleted_at = str(item.get("deleted_at", "")).strip()
            file_name = str(item.get("file", "")).strip()
            if not trash_id or not slug or not file_name:
                continue
            items.append(
                {
                    "id": trash_id,
                    "slug": slug,
                    "title": title or slug,
                    "deleted_at": deleted_at,
                    "file": file_name,
                }
            )
        return items

    def _save_trash_index(self, items: list[dict]) -> None:
        self._trash_index_file.parent.mkdir(parents=True, exist_ok=True)
        self._trash_index_file.write_text(
            json.dumps(items, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def list_trashed_pages(self) -> list[dict]:
        items = self._load_trash_index()
        items.sort(key=lambda x: x.get("deleted_at", ""), reverse=True)
        return items

    def trash_page(self, slug: str, run_backup: bool = True) -> dict | None:
        page = self.get_page(slug)
        if not page:
            return None

        md_file = self._pages_dir / f"{slug}.md"
        if not md_file.exists():
            return None

        trash_id = datetime.now().strftime("%Y%m%d%H%M%S") + "_" + uuid4().hex[:8]
        file_name = f"{trash_id}.md"
        trash_file = self._trash_pages_dir / file_name

        text = md_file.read_text(encoding="utf-8")
        trash_file.write_text(text, encoding="utf-8")
        md_file.unlink()
        self._cleanup_empty_dirs(md_file.parent)

        items = self._load_trash_index()
        items.append(
            {
                "id": trash_id,
                "slug": slug,
                "title": page.title,
                "deleted_at": datetime.now().isoformat(timespec="seconds"),
                "file": file_name,
            }
        )
        self._save_trash_index(items)

        self._repo.delete(
            f"pages/{slug}.md",
            f"Delete: {page.title}",
        )
        if run_backup:
            self._refresh_backup()
        logger.info("ページをゴミ箱へ移動: %s (%s)", slug, page.title)
        return {
            "id": trash_id,
            "slug": slug,
            "title": page.title,
            "deleted_at": items[-1]["deleted_at"],
        }

    def get_trashed_page(self, trash_id: str) -> dict | None:
        tid = str(trash_id or "").strip()
        if not tid:
            return None
        for item in self._load_trash_index():
            if item.get("id") != tid:
                continue
            trash_file = self._trash_pages_dir / item.get("file", "")
            if not trash_file.exists():
                return None
            text = trash_file.read_text(encoding="utf-8")
            page = Page.from_markdown(item["slug"], text)
            return {"meta": item, "page": page, "text": text}
        return None

    def restore_trashed_page(self, trash_id: str, run_backup: bool = True) -> dict | None:
        data = self.get_trashed_page(trash_id)
        if not data:
            return None

        meta = data["meta"]
        page: Page = data["page"]
        text = data["text"]
        target_slug = meta["slug"]

        # 既存名と衝突する場合は連番を付与
        if self.page_exists(target_slug):
            parts = target_slug.split("/")
            leaf = parts[-1]
            parent = "/".join(parts[:-1])
            counter = 2
            while True:
                cand_leaf = f"{leaf}-{counter}"
                cand_slug = f"{parent}/{cand_leaf}" if parent else cand_leaf
                if not self.page_exists(cand_slug):
                    target_slug = cand_slug
                    break
                counter += 1

        target_file = self._pages_dir / f"{target_slug}.md"
        target_file.parent.mkdir(parents=True, exist_ok=True)
        target_file.write_text(text, encoding="utf-8")

        # ゴミ箱から除去
        trash_file = self._trash_pages_dir / meta.get("file", "")
        if trash_file.exists():
            trash_file.unlink()
        items = [x for x in self._load_trash_index() if x.get("id") != meta["id"]]
        self._save_trash_index(items)

        restored_page = Page.from_markdown(target_slug, text)
        self._repo.commit(
            f"pages/{target_slug}.md",
            text.encode("utf-8"),
            f"Restore: {restored_page.title}",
        )
        if run_backup:
            self._refresh_backup()
        logger.info("ゴミ箱から復元: %s -> %s", meta["slug"], target_slug)
        return {
            "id": meta["id"],
            "old_slug": meta["slug"],
            "slug": target_slug,
            "title": restored_page.title,
        }

    def purge_trashed_page(self, trash_id: str) -> dict | None:
        """ゴミ箱内ページを完全削除する。"""
        tid = str(trash_id or "").strip()
        if not tid:
            return None
        items = self._load_trash_index()
        target = None
        for item in items:
            if item.get("id") == tid:
                target = item
                break
        if not target:
            return None

        trash_file = self._trash_pages_dir / target.get("file", "")
        if trash_file.exists():
            trash_file.unlink()

        next_items = [x for x in items if x.get("id") != tid]
        self._save_trash_index(next_items)
        logger.info("ゴミ箱から完全削除: id=%s slug=%s", tid, target.get("slug", ""))
        return {
            "id": tid,
            "slug": target.get("slug", ""),
            "title": target.get("title", "") or target.get("slug", ""),
        }

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
        """page_order.json を読み込む（新スキーマ: root tree）。"""
        if self._page_order_file.exists():
            try:
                raw = json.loads(self._page_order_file.read_text(encoding="utf-8"))
                if self._is_order_root(raw):
                    cleaned = self._sanitize_order_root(raw)
                    if cleaned != raw:
                        self.save_page_order(cleaned)
                    return cleaned
                # 旧形式(dict map)は get_tree 内で移行する
                return raw if isinstance(raw, dict) else {"name": "", "items": []}
            except (json.JSONDecodeError, OSError):
                logger.warning("page_order.json の読み込みに失敗")
        return {"name": "", "items": []}

    def save_page_order(self, order: dict) -> None:
        """page_order.json を保存する（新スキーマ: root tree）。"""
        self._page_order_file.write_text(
            json.dumps(self._sanitize_order_root(order), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def reorder_pages(self, directory: str, slugs: list[str]) -> None:
        """互換API: 指定ディレクトリ内のページ順序を保存する。"""
        desired = [{"type": "page", "slug": s} for s in self._sanitize_str_list(slugs)]
        self._reorder_items_by_type(directory, desired, "page")
        logger.info("ページ並び替え: directory=%s, slugs=%s", directory, slugs)

    def reorder_dirs(self, parent: str, dir_names: list[str]) -> None:
        """互換API: 指定親ディレクトリ内のディレクトリ順序を保存する。"""
        desired = [{"type": "dir", "name": d} for d in self._sanitize_str_list(dir_names)]
        self._reorder_items_by_type(parent, desired, "dir")
        logger.info("ディレクトリ並び替え: parent=%s, dirs=%s", parent, dir_names)

    def reorder_items(self, parent: str, items: list[dict | str]) -> None:
        """指定親ディレクトリ内の項目（ディレクトリ/ページ混在）順序を保存する。"""
        self._reorder_items(parent, items)
        logger.info("項目並び替え: parent=%s, items=%s", parent, items)

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
        updated = self.update_page(slug, new_title, page.body, run_backup=False)
        if not updated:
            return None
        return self.move_page(slug, new_slug, run_backup=True)

    def get_tree(self) -> dict:
        """ページ階層をネストdictで返す（API用）。"""
        fs_tree = self._build_fs_tree()

        raw = self.load_page_order()
        migrated = False
        if self._is_order_root(raw):
            order_root = self._sanitize_order_root(raw)
        else:
            order_root = self._legacy_map_to_order_root(raw, fs_tree)
            migrated = True

        tree = self._apply_order_root(fs_tree, order_root, "")

        # 旧形式や壊れた構造は新形式に自動移行して保存
        normalized = self._tree_to_order_root(tree)
        if migrated or normalized != order_root:
            self.save_page_order(normalized)

        return tree

    def _build_fs_tree(self) -> dict:
        tree = {"name": "", "children": {}, "pages": []}
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
        return tree

    def _sanitize_str_list(self, values) -> list[str]:
        if not isinstance(values, list):
            return []
        out: list[str] = []
        seen: set[str] = set()
        for value in values:
            if not isinstance(value, str):
                continue
            item = value.strip()
            if not item or item in seen:
                continue
            seen.add(item)
            out.append(item)
        return out

    def _item_ref_from_raw(self, raw) -> tuple[str, str] | None:
        """項目参照を (kind, value) で返す。kind は dir/page。"""
        if isinstance(raw, dict):
            kind = str(raw.get("type", "")).strip()
            if kind == "dir":
                name = str(raw.get("name", "")).strip()
                return ("dir", name) if name else None
            if kind == "page":
                slug = str(raw.get("slug", "")).strip()
                return ("page", slug) if slug else None
            return None
        if isinstance(raw, str):
            # 旧形式互換: "d:name" / "p:slug"
            value = raw.strip()
            if value.startswith("d:"):
                name = value[2:].strip()
                return ("dir", name) if name else None
            if value.startswith("p:"):
                slug = value[2:].strip()
                return ("page", slug) if slug else None
        return None

    def _item_ref_from_order_item(self, item: dict) -> tuple[str, str] | None:
        if not isinstance(item, dict):
            return None
        return self._item_ref_from_raw(item)

    def _is_order_root(self, data) -> bool:
        return isinstance(data, dict) and isinstance(data.get("items"), list)

    def _sanitize_order_root(self, data) -> dict:
        if not self._is_order_root(data):
            return {"name": "", "items": []}
        return {
            "name": str(data.get("name", "")),
            "items": self._sanitize_order_items(data.get("items", [])),
        }

    def _sanitize_order_items(self, items) -> list[dict]:
        if not isinstance(items, list):
            return []
        out: list[dict] = []
        seen: set[tuple[str, str]] = set()
        for item in items:
            if not isinstance(item, dict):
                continue
            kind = item.get("type")
            if kind == "page":
                slug = str(item.get("slug", "")).strip()
                if not slug:
                    continue
                key = ("page", slug)
                if key in seen:
                    continue
                seen.add(key)
                out.append({"type": "page", "slug": slug})
                continue
            if kind == "dir":
                name = str(item.get("name", "")).strip()
                if not name:
                    continue
                key = ("dir", name)
                if key in seen:
                    continue
                seen.add(key)
                out.append(
                    {
                        "type": "dir",
                        "name": name,
                        "items": self._sanitize_order_items(item.get("items", [])),
                    }
                )
        return out

    def _legacy_map_to_order_root(self, raw, fs_tree: dict) -> dict:
        """旧 map 形式(_dirs/_items)を新 root tree 形式へ変換する。"""
        if not isinstance(raw, dict):
            return {"name": "", "items": []}
        legacy = {k: v for k, v in raw.items() if isinstance(k, str)}

        def walk(fs_node: dict, current_path: str) -> dict:
            pages = list(fs_node.get("pages", []))
            children = dict(fs_node.get("children", {}))
            page_by_slug = {p["slug"]: p for p in pages if p.get("slug")}

            page_order = self._sanitize_str_list(legacy.get(current_path, []))
            ordered_page_slugs = [s for s in page_order if s in page_by_slug]
            remaining_pages = [p for p in pages if p.get("slug") not in ordered_page_slugs]
            remaining_pages.sort(key=lambda p: p.get("title", ""))
            ordered_page_slugs.extend([p["slug"] for p in remaining_pages if p.get("slug")])

            dir_order = self._sanitize_str_list(legacy.get("_dirs:" + current_path, []))
            ordered_dirs = [d for d in dir_order if d in children]
            remaining_dirs = [d for d in children.keys() if d not in ordered_dirs]
            ordered_dirs.extend(sorted(remaining_dirs))

            default_items = (
                [{"type": "dir", "name": d} for d in ordered_dirs]
                + [{"type": "page", "slug": s} for s in ordered_page_slugs]
            )
            mixed = self._sanitize_str_list(legacy.get("_items:" + current_path, []))
            if mixed:
                token_to_item = {
                    ("d:" + item["name"] if item["type"] == "dir" else "p:" + item["slug"]): item
                    for item in default_items
                }
                seen: set[str] = set()
                items = []
                for token in mixed:
                    item = token_to_item.get(token)
                    if not item:
                        continue
                    if token in seen:
                        continue
                    seen.add(token)
                    items.append(item)
                for item in default_items:
                    token = "d:" + item["name"] if item["type"] == "dir" else "p:" + item["slug"]
                    if token in seen:
                        continue
                    seen.add(token)
                    items.append(item)
            else:
                items = default_items

            out_items: list[dict] = []
            for item in items:
                if item["type"] == "page":
                    out_items.append({"type": "page", "slug": item["slug"]})
                    continue
                name = item["name"]
                child = children.get(name)
                if not child:
                    continue
                child_path = current_path + "/" + name if current_path else name
                child_order = walk(child, child_path)
                out_items.append({"type": "dir", "name": name, "items": child_order["items"]})

            return {"name": fs_node.get("name", ""), "items": out_items}

        return walk(fs_tree, "")

    def _apply_order_root(self, fs_node: dict, order_node: dict, current_path: str) -> dict:
        order_items = self._sanitize_order_items(order_node.get("items", []))

        fs_children = dict(fs_node.get("children", {}))
        fs_pages = list(fs_node.get("pages", []))
        page_by_slug = {p["slug"]: p for p in fs_pages if p.get("slug")}

        children_out: dict[str, dict] = {}
        pages_out: list[dict] = []
        items_out: list[dict] = []
        seen_dirs: set[str] = set()
        seen_pages: set[str] = set()

        order_child_by_name = {
            i["name"]: i for i in order_items if i.get("type") == "dir" and i.get("name")
        }

        for item in order_items:
            if item.get("type") == "dir":
                name = item.get("name")
                if not name or name in seen_dirs or name not in fs_children:
                    continue
                child_path = current_path + "/" + name if current_path else name
                child = self._apply_order_root(fs_children[name], item, child_path)
                children_out[name] = child
                items_out.append({"type": "dir", "name": name})
                seen_dirs.add(name)
            elif item.get("type") == "page":
                slug = item.get("slug")
                if not slug or slug in seen_pages or slug not in page_by_slug:
                    continue
                pages_out.append(page_by_slug[slug])
                items_out.append({"type": "page", "slug": slug})
                seen_pages.add(slug)

        # 未登録のディレクトリ/ページは末尾に追加
        for name in sorted(fs_children.keys()):
            if name in seen_dirs:
                continue
            child_order = order_child_by_name.get(name, {"type": "dir", "name": name, "items": []})
            child_path = current_path + "/" + name if current_path else name
            child = self._apply_order_root(fs_children[name], child_order, child_path)
            children_out[name] = child
            items_out.append({"type": "dir", "name": name})
            seen_dirs.add(name)

        remaining_pages = [p for p in fs_pages if p.get("slug") not in seen_pages]
        remaining_pages.sort(key=lambda p: p.get("title", ""))
        for p in remaining_pages:
            slug = p.get("slug")
            if not slug:
                continue
            pages_out.append(p)
            items_out.append({"type": "page", "slug": slug})
            seen_pages.add(slug)

        return {
            "name": fs_node.get("name", ""),
            "children": children_out,
            "pages": pages_out,
            "items": items_out,
        }

    def _tree_to_order_root(self, tree: dict) -> dict:
        def walk(node: dict) -> dict:
            out_items: list[dict] = []
            for item in node.get("items", []):
                if item.get("type") == "page":
                    slug = item.get("slug")
                    if slug:
                        out_items.append({"type": "page", "slug": slug})
                elif item.get("type") == "dir":
                    name = item.get("name")
                    if not name:
                        continue
                    child = node.get("children", {}).get(name)
                    child_items = walk(child or {"items": [], "children": {}})["items"]
                    out_items.append({"type": "dir", "name": name, "items": child_items})
            return {"name": node.get("name", ""), "items": out_items}

        root = walk(tree)
        root["name"] = ""
        return self._sanitize_order_root(root)

    def _find_order_node(self, order_root: dict, path: str) -> dict | None:
        if not path:
            return order_root
        cur = order_root
        for part in [p for p in path.split("/") if p]:
            if not isinstance(cur, dict):
                return None
            found = None
            for item in cur.get("items", []):
                if item.get("type") == "dir" and item.get("name") == part:
                    found = item
                    break
            if not found:
                return None
            cur = found
        return cur

    def _reorder_items(self, parent: str, desired_items: list[dict | str]) -> None:
        tree = self.get_tree()
        order_root = self._tree_to_order_root(tree)
        node = self._find_order_node(order_root, parent)
        if not node:
            return

        key_to_item: dict[tuple[str, str], dict] = {}
        for item in node.get("items", []):
            key = self._item_ref_from_order_item(item)
            if key and key not in key_to_item:
                key_to_item[key] = item

        ordered_items: list[dict] = []
        seen: set[tuple[str, str]] = set()
        for raw in desired_items:
            key = self._item_ref_from_raw(raw)
            if not key or key in seen:
                continue
            item = key_to_item.get(key)
            if not item:
                continue
            ordered_items.append(item)
            seen.add(key)
        for key, item in key_to_item.items():
            if key in seen:
                continue
            ordered_items.append(item)

        node["items"] = self._sanitize_order_items(ordered_items)
        self.save_page_order(order_root)

    def _reorder_items_by_type(
        self, parent: str, desired_items: list[dict | str], kind: str
    ) -> None:
        tree = self.get_tree()
        node = self._find_order_node(self._tree_to_order_root(tree), parent)
        if not node:
            return
        current_keys: list[tuple[str, str]] = []
        for item in node.get("items", []):
            key = self._item_ref_from_order_item(item)
            if key:
                current_keys.append(key)

        desired_keys: list[tuple[str, str]] = []
        seen_desired: set[tuple[str, str]] = set()
        for raw in desired_items:
            key = self._item_ref_from_raw(raw)
            if not key:
                continue
            if key[0] != kind:
                continue
            if key in seen_desired:
                continue
            seen_desired.add(key)
            desired_keys.append(key)

        remain = [k for k in current_keys if k[0] == kind and k not in seen_desired]

        merged_keys: list[tuple[str, str]] = []
        it = iter(desired_keys + remain)
        for key in current_keys:
            if key[0] == kind:
                merged_keys.append(next(it, key))
            else:
                merged_keys.append(key)

        merged_items: list[dict] = []
        for item_kind, value in merged_keys:
            if item_kind == "dir":
                merged_items.append({"type": "dir", "name": value})
            else:
                merged_items.append({"type": "page", "slug": value})
        self._reorder_items(parent, merged_items)

    def move_page(self, old_slug: str, new_slug: str, run_backup: bool = True) -> Page | None:
        """ページを別の階層に移動する"""
        page = self.get_page(old_slug)
        if not page:
            return None
        if old_slug == new_slug:
            return page
        target_slug = str(new_slug or "").strip().strip("/")
        if not target_slug:
            return None

        # 既存名と衝突する場合は連番で回避（VSCode風に移動しやすくする）
        if target_slug != old_slug and self.page_exists(target_slug):
            parts = target_slug.split("/")
            leaf = parts[-1]
            parent = "/".join(parts[:-1])
            counter = 2
            while True:
                candidate_leaf = f"{leaf}-{counter}"
                candidate_slug = f"{parent}/{candidate_leaf}" if parent else candidate_leaf
                if candidate_slug == old_slug or not self.page_exists(candidate_slug):
                    target_slug = candidate_slug
                    break
                counter += 1

        old_file = self._pages_dir / f"{old_slug}.md"
        new_file = self._pages_dir / f"{target_slug}.md"
        new_file.parent.mkdir(parents=True, exist_ok=True)

        md_text = old_file.read_text(encoding="utf-8")
        new_file.write_text(md_text, encoding="utf-8")
        old_file.unlink()
        self._cleanup_empty_dirs(old_file.parent)

        self._repo.delete(
            f"pages/{old_slug}.md",
            f"Move: {page.title} ({old_slug} → {target_slug})",
        )
        self._repo.commit(
            f"pages/{target_slug}.md",
            md_text.encode("utf-8"),
            f"Move: {page.title} ({old_slug} → {target_slug})",
        )
        if run_backup:
            self._refresh_backup()
        logger.info("ページ移動: %s → %s", old_slug, target_slug)
        return Page.from_markdown(target_slug, md_text)

    def move_directory(self, old_dir: str, target_parent: str) -> dict | None:
        """ディレクトリ配下のページをまとめて別親へ移動する。"""
        old_dir = str(old_dir or "").strip().strip("/")
        target_parent = str(target_parent or "").strip().strip("/")
        if not old_dir:
            return None

        dir_name = old_dir.split("/")[-1]
        requested_new_dir = f"{target_parent}/{dir_name}" if target_parent else dir_name
        if target_parent == old_dir or target_parent.startswith(old_dir + "/"):
            # 自分自身配下への移動は禁止
            return None
        return self._move_directory_to(old_dir, requested_new_dir)

    def rename_directory(self, old_dir: str, new_name: str) -> dict | None:
        """ディレクトリ名を変更する（親階層は維持）。"""
        old_dir = str(old_dir or "").strip().strip("/")
        new_name = str(new_name or "").strip().strip("/")
        if not old_dir or not new_name:
            return None
        if "/" in new_name or "\\" in new_name:
            return None

        parts = old_dir.split("/")
        parent = "/".join(parts[:-1])
        requested_new_dir = f"{parent}/{new_name}" if parent else new_name
        return self._move_directory_to(old_dir, requested_new_dir)

    def _move_directory_to(self, old_dir: str, requested_new_dir: str) -> dict | None:
        old_dir = str(old_dir or "").strip().strip("/")
        requested_new_dir = str(requested_new_dir or "").strip().strip("/")
        if not old_dir or not requested_new_dir:
            return None
        if requested_new_dir == old_dir:
            return None
        if requested_new_dir.startswith(old_dir + "/"):
            # 自分自身配下への移動は禁止
            return None

        dir_name = requested_new_dir.split("/")[-1]
        # 既存ディレクトリと衝突する場合は連番で回避（VSCode風）
        new_dir = requested_new_dir
        new_path = self._pages_dir / new_dir
        if new_path.exists():
            counter = 2
            while True:
                candidate_name = f"{dir_name}-{counter}"
                parent = "/".join(requested_new_dir.split("/")[:-1])
                candidate_dir = f"{parent}/{candidate_name}" if parent else candidate_name
                candidate_path = self._pages_dir / candidate_dir
                if not candidate_path.exists():
                    new_dir = candidate_dir
                    new_path = candidate_path
                    break
                counter += 1

        old_path = self._pages_dir / old_dir
        if not old_path.exists() or not old_path.is_dir():
            return None

        old_prefix = old_dir + "/"
        slugs: list[str] = []
        for md_file in old_path.rglob("*.md"):
            slug = self._slug_from_path(md_file)
            if slug.startswith(old_prefix):
                slugs.append(slug)
        slugs.sort()
        if not slugs:
            return None

        move_pairs: list[tuple[str, str]] = []
        for old_slug in slugs:
            new_slug = new_dir + "/" + old_slug[len(old_prefix) :]
            if self.page_exists(new_slug):
                return None
            move_pairs.append((old_slug, new_slug))

        moved: list[dict[str, str]] = []
        for old_slug, new_slug in move_pairs:
            result = self.move_page(old_slug, new_slug, run_backup=False)
            if not result:
                return None
            moved.append({"old_slug": old_slug, "new_slug": new_slug})

        self._refresh_backup()
        logger.info("ディレクトリ移動: %s → %s (%s件)", old_dir, new_dir, len(moved))
        return {"old_dir": old_dir, "new_dir": new_dir, "moved": moved}

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
