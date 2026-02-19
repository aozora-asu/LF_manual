import re
import json
import hashlib
from datetime import datetime

from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    abort,
    jsonify,
    send_from_directory,
)
import markdown as md

from src.common.config import load_config
from src.common.paths import get_state_dir, get_data_dir
from src.wiki_app.services.page_service import PageService

pages_bp = Blueprint("pages", __name__)

_page_service: PageService | None = None


def init_pages(page_service: PageService) -> None:
    global _page_service
    _page_service = page_service


_NOTE_MD_PATTERN = re.compile(
    r"^> \[!(NOTE|WARNING|IMPORTANT|TIP)\]\s*\n((?:> (?!\[!(?:NOTE|WARNING|IMPORTANT|TIP)\]).*\n?)*)",
    re.MULTILINE,
)

_NOTE_LABELS = {"NOTE": "情報", "WARNING": "注意", "IMPORTANT": "重要", "TIP": "ヒント"}
_NOTE_TYPES = {"NOTE": "info", "WARNING": "warning", "IMPORTANT": "important", "TIP": "tip"}


def _preprocess_notes(text: str) -> str:
    """Markdown テキスト中の > [!NOTE] 記法を HTML div に変換してから返す。

    Markdown パーサーに渡す前に処理するため、連続するノートブロックが
    一つの blockquote にまとめられてしまう問題を回避できる。
    ノート本文中の Markdown（太字・リンク・画像など）も正しくレンダリングする。
    """

    def _replace(m: re.Match) -> str:
        kind = m.group(1)
        body_lines = m.group(2).strip().splitlines()
        body = "\n".join(
            line[2:] if line.startswith("> ") else line[1:] if line.startswith(">") else line
            for line in body_lines
        )
        note_type = _NOTE_TYPES[kind]
        label = _NOTE_LABELS[kind]
        wiki_config = load_config("wiki")
        extensions = wiki_config.get("markdown_extensions", [])
        body_html = md.markdown(body, extensions=extensions)
        return (
            f'<div class="note note-{note_type}" data-note-type="{note_type}">'
            f'<div class="note-title">{label}</div>'
            f'<div class="note-body">{body_html}</div>'
            f"</div>\n"
        )

    return _NOTE_MD_PATTERN.sub(_replace, text)


_COMMENT_TAG_PATTERN = re.compile(
    r'<comment\s+id="([^"]+)">(.*?)</comment>',
    re.DOTALL,
)

_TASK_ITEM_PATTERN = re.compile(
    r"<(?P<tag>p|li)>\s*\[(?P<mark>[ xX])\]\s*(?P<body>.*?)</(?P=tag)>",
    re.DOTALL,
)
_LIST_INDENT_PATTERN = re.compile(
    r"^(?P<indent> +)(?P<marker>(?:[-+*])|\d+\.)\s+(?P<body>.*)$"
)
_ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
_MIME_TO_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
}
_INVALID_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


def _postprocess_comment_tags(html: str) -> str:
    """<comment id="xxx">text</comment> を <span class="comment-highlight" data-thread-id="xxx">text</span> に変換する"""
    def _replace(m: re.Match) -> str:
        tid = m.group(1)
        text = m.group(2)
        return f'<span class="comment-highlight" data-thread-id="{tid}">{text}</span>'
    return _COMMENT_TAG_PATTERN.sub(_replace, html)


def _postprocess_task_items(html: str) -> str:
    """[ ] / [x] 形式の行をチェックボックス表示に変換する。"""
    counter = {"value": 0}

    def _replace(m: re.Match) -> str:
        counter["value"] += 1
        tag = m.group("tag")
        checked = m.group("mark").lower() == "x"
        body_raw = m.group("body")
        body = body_raw if body_raw and body_raw.strip() else "&nbsp;"
        checked_attr = " checked" if checked else ""
        checkbox_id = f"cb-{counter['value']}"
        return (
            f'<{tag}><label class="check-item">'
            f'<input type="checkbox" data-checkbox-id="{checkbox_id}"{checked_attr}> {body}'
            f"</label></{tag}>"
        )

    return _TASK_ITEM_PATTERN.sub(_replace, html)


def _normalize_nested_list_indent(text: str) -> str:
    """2スペース階層の箇条書きを4スペース階層へ正規化する。"""
    lines = text.splitlines()
    out: list[str] = []
    in_fence = False

    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            out.append(line)
            continue
        if in_fence:
            out.append(line)
            continue

        m = _LIST_INDENT_PATTERN.match(line)
        if not m:
            out.append(line)
            continue

        indent = m.group("indent")
        marker = m.group("marker")
        body = m.group("body")
        indent_len = len(indent)

        if indent_len >= 2 and indent_len % 2 == 0 and indent_len % 4 != 0:
            level = indent_len // 2
            out.append((" " * (level * 4)) + marker + " " + body)
        else:
            out.append(line)

    trailing_nl = "\n" if text.endswith("\n") else ""
    return "\n".join(out) + trailing_nl


def _render_md(text: str) -> str:
    wiki_config = load_config("wiki")
    extensions = wiki_config.get("markdown_extensions", [])
    text = _normalize_nested_list_indent(text)
    text = _preprocess_notes(text)
    html = md.markdown(text, extensions=extensions)
    html = _postprocess_task_items(html)
    html = _postprocess_comment_tags(html)
    return html


def _sanitize_upload_filename(name: str) -> str:
    # ディレクトリ成分を除去し、OS非互換文字を置換
    base = (name or "").strip().replace("\x00", "")
    base = base.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    base = _INVALID_FILENAME_CHARS.sub("_", base).strip()
    # Windows互換のため末尾ドット/空白を除去
    base = base.rstrip(" .")
    return base


def _checkbox_state_path(slug: str):
    key = hashlib.sha1(slug.encode("utf-8")).hexdigest()
    return get_state_dir() / "page_checkboxes" / f"{key}.json"


@pages_bp.route("/")
def index():
    """トップページ（index.md）を表示する。なければ自動作成。"""
    wiki_config = load_config("wiki")
    slug = "index"
    if not _page_service.page_exists(slug):
        _page_service.create_page(
            slug,
            wiki_config.get("site_name", "Wiki"),
            "トップページへようこそ。\n\n[ページ一覧](/pages/list) から各ページにアクセスできます。",
        )
    page = _page_service.get_page(slug)
    html_content = _render_md(page.body)
    return render_template(
        "page_view.html",
        page=page,
        html_content=html_content,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/pages/list")
def page_list():
    """全ページ一覧（階層ツリー表示）"""
    wiki_config = load_config("wiki")
    tree = _page_service.get_tree()
    return render_template(
        "page_list.html",
        tree=tree,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/pages/print/all")
def print_all_pages():
    """全ページを印刷用にまとめて表示する"""
    wiki_config = load_config("wiki")
    pages = _page_service.list_pages()
    rendered_pages = []
    for page in pages:
        html_content = _render_md(page.body)
        rendered_pages.append({
            "title": page.title,
            "slug": page.slug,
            "created": page.created,
            "updated": page.updated,
            "html": html_content,
        })
    auto = request.args.get("autoprint") == "1"
    return render_template(
        "page_print_all.html",
        pages=rendered_pages,
        site_name=wiki_config.get("site_name", "Wiki"),
        autoprint=auto,
    )


@pages_bp.route("/pages/new", methods=["GET", "POST"])
def new_page():
    wiki_config = load_config("wiki")
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        body = request.form.get("body", "")
        directory = request.form.get("directory", "").strip().strip("/")

        slug = re.sub(r"[^\w\-]", "-", title.lower()).strip("-")
        slug = re.sub(r"-+", "-", slug)
        if not slug:
            slug = "untitled"

        if directory:
            slug = f"{directory}/{slug}"

        if _page_service.page_exists(slug):
            counter = 2
            while _page_service.page_exists(f"{slug}-{counter}"):
                counter += 1
            slug = f"{slug}-{counter}"

        _page_service.create_page(slug, title, body)
        return redirect(url_for("pages.view_page", slug=slug))

    directories = _page_service.list_directories()
    return render_template(
        "page_new.html",
        site_name=wiki_config.get("site_name", "Wiki"),
        directories=directories,
    )


@pages_bp.route("/pages/<path:slug>")
def view_page(slug):
    wiki_config = load_config("wiki")
    page = _page_service.get_page(slug)
    if not page:
        abort(404)
    html_content = _render_md(page.body)
    return render_template(
        "page_view.html",
        page=page,
        html_content=html_content,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/trash/<trash_id>")
def view_trashed_page(trash_id):
    wiki_config = load_config("wiki")
    trashed = _page_service.get_trashed_page(trash_id)
    if not trashed:
        abort(404)
    page = trashed["page"]
    meta = trashed["meta"]
    html_content = _render_md(page.body)
    return render_template(
        "page_trash_view.html",
        page=page,
        html_content=html_content,
        trash_meta=meta,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/pages/<path:slug>/edit", methods=["GET", "POST"])
def edit_page(slug):
    wiki_config = load_config("wiki")
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        body = request.form.get("body", "")

        _page_service.update_page(slug, title, body)
        return redirect(url_for("pages.view_page", slug=slug))

    page = _page_service.get_page(slug)
    if not page:
        abort(404)
    html_body = _render_md(page.body)
    return render_template(
        "page_edit.html",
        page=page,
        html_body=html_body,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/pages/<path:slug>/delete", methods=["POST"])
def delete_page(slug):
    _page_service.trash_page(slug)
    return redirect(url_for("pages.page_list"))


@pages_bp.route("/pages/<path:slug>/print")
def print_page(slug):
    wiki_config = load_config("wiki")
    page = _page_service.get_page(slug)
    if not page:
        abort(404)
    html_content = _render_md(page.body)
    return render_template(
        "page_print.html",
        page=page,
        html_content=html_content,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/api/pages/images/upload", methods=["POST"])
def upload_image_api():
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"ok": False, "error": "画像ファイルがありません"}), 400

    ext = ("." + file.filename.rsplit(".", 1)[-1].lower()) if "." in file.filename else ""
    mimetype = (file.mimetype or "").lower()
    if not ext:
        ext = _MIME_TO_EXT.get(mimetype, "")
    if ext not in _ALLOWED_IMAGE_EXTS:
        return jsonify({"ok": False, "error": "対応していない画像形式です"}), 400
    if mimetype and not mimetype.startswith("image/"):
        return jsonify({"ok": False, "error": "画像ファイルではありません"}), 400

    images_dir = get_data_dir() / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    raw_name = _sanitize_upload_filename(file.filename or "")
    stem = raw_name
    if "." in raw_name:
        stem = raw_name.rsplit(".", 1)[0]
    stem = stem or "image"
    filename = stem + ext
    dst = images_dir / filename
    # 同名が既にある場合のみ連番を付与（基本は元ファイル名を維持）
    counter = 2
    while dst.exists():
        filename = f"{stem}-{counter}{ext}"
        dst = images_dir / filename
        counter += 1
    file.save(dst)
    return jsonify({"ok": True, "url": url_for("pages.serve_image_file", filename=filename)})


@pages_bp.route("/data/images/<path:filename>")
def serve_image_file(filename):
    images_dir = get_data_dir() / "images"
    return send_from_directory(images_dir, filename)


@pages_bp.route("/api/pages/tree")
def page_tree():
    """ページ階層ツリーをJSONで返す"""
    tree = _page_service.get_tree()
    resp = jsonify(tree)
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp


@pages_bp.route("/api/trash/pages", methods=["GET"])
def trash_pages_api():
    items = _page_service.list_trashed_pages()
    return jsonify({"ok": True, "items": items})


@pages_bp.route("/api/trash/pages/<trash_id>/restore", methods=["POST"])
def restore_trash_page_api(trash_id):
    restored = _page_service.restore_trashed_page(trash_id)
    if not restored:
        return jsonify({"ok": False, "error": "復元できませんでした"}), 400
    return jsonify({"ok": True, **restored})


@pages_bp.route("/api/trash/pages/<trash_id>", methods=["DELETE"])
def purge_trash_page_api(trash_id):
    purged = _page_service.purge_trashed_page(trash_id)
    if not purged:
        return jsonify({"ok": False, "error": "削除できませんでした"}), 400
    return jsonify({"ok": True, **purged})


@pages_bp.route("/api/pages/<path:slug>/checkboxes", methods=["GET", "PUT"])
def page_checkboxes(slug):
    path = _checkbox_state_path(slug)
    if request.method == "GET":
        if not path.exists():
            return jsonify({"states": {}})
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if data.get("slug") != slug:
                return jsonify({"states": {}})
            return jsonify({"states": data.get("states", {})})
        except Exception:
            return jsonify({"states": {}})

    payload = request.get_json(silent=True) or {}
    states = payload.get("states", {})
    if not isinstance(states, dict):
        return jsonify({"ok": False, "error": "invalid states"}), 400

    cleaned = {}
    for key, value in states.items():
        k = str(key).strip()
        if not k:
            continue
        cleaned[k] = bool(value)

    path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "slug": slug,
        "updated_at": datetime.now().isoformat(timespec="seconds"),
        "states": cleaned,
    }
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    return jsonify({"ok": True, "states": cleaned})


@pages_bp.route("/api/pages/reorder", methods=["POST"])
def reorder_pages_api():
    """同一ディレクトリ内のページ並び順を保存する"""
    data = request.get_json()
    directory = data.get("directory", "")
    slugs = data.get("slugs", [])
    if not isinstance(slugs, list):
        return jsonify({"error": "slugsはリストで指定してください"}), 400
    _page_service.reorder_pages(directory, slugs)
    return jsonify({"ok": True})


@pages_bp.route("/api/pages/reorder-dirs", methods=["POST"])
def reorder_dirs_api():
    """同一親ディレクトリ内のディレクトリ並び順を保存する"""
    data = request.get_json()
    parent = data.get("parent", "")
    dirs = data.get("dirs", [])
    if not isinstance(dirs, list):
        return jsonify({"error": "dirsはリストで指定してください"}), 400
    _page_service.reorder_dirs(parent, dirs)
    return jsonify({"ok": True})


@pages_bp.route("/api/pages/reorder-items", methods=["POST"])
def reorder_items_api():
    """同一親ディレクトリ内の項目（ディレクトリ/ページ混在）並び順を保存する"""
    data = request.get_json() or {}
    parent = data.get("parent", "")
    items = data.get("items", [])
    if not isinstance(items, list):
        return jsonify({"error": "itemsはリストで指定してください"}), 400
    _page_service.reorder_items(parent, items)
    return jsonify({"ok": True})


@pages_bp.route("/api/pages/<path:slug>/title", methods=["PATCH"])
def rename_page_api(slug):
    """ページタイトルのみ更新する"""
    data = request.get_json()
    new_title = data.get("title", "").strip()
    if not new_title:
        return jsonify({"error": "タイトルが空です"}), 400
    page = _page_service.rename_page(slug, new_title)
    if not page:
        return jsonify({"error": "ページが見つかりません"}), 404
    return jsonify({"ok": True, "title": page.title, "slug": page.slug})


@pages_bp.route("/api/pages/<path:slug>", methods=["DELETE"])
def delete_page_api(slug):
    """ページをJSON APIで削除する"""
    if not _page_service.page_exists(slug):
        return jsonify({"error": "ページが見つかりません"}), 404
    moved = _page_service.trash_page(slug)
    if not moved:
        return jsonify({"error": "ゴミ箱へ移動できませんでした"}), 400
    return jsonify({"ok": True, **moved})


@pages_bp.route("/api/pages/move", methods=["POST"])
def move_page_api():
    """ページを別の階層に移動する"""
    data = request.get_json()
    old_slug = data.get("old_slug", "")
    new_slug = data.get("new_slug", "")
    if not old_slug or not new_slug:
        return jsonify({"error": "slugが必要です"}), 400
    result = _page_service.move_page(old_slug, new_slug)
    if not result:
        return jsonify({"error": "移動できませんでした"}), 400
    return jsonify({"ok": True, "new_slug": result.slug})


@pages_bp.route("/api/pages/move-dir", methods=["POST"])
def move_dir_api():
    """ディレクトリを別の親ディレクトリへ移動する"""
    data = request.get_json() or {}
    old_dir = data.get("old_dir", "")
    target_parent = data.get("target_parent", "")
    if not old_dir:
        return jsonify({"error": "old_dirが必要です"}), 400
    result = _page_service.move_directory(old_dir, target_parent)
    if not result:
        return jsonify({"error": "ディレクトリを移動できませんでした"}), 400
    return jsonify({"ok": True, **result})


@pages_bp.route("/api/pages/rename-dir", methods=["PATCH"])
def rename_dir_api():
    """ディレクトリ名を変更する"""
    data = request.get_json() or {}
    old_dir = data.get("old_dir", "")
    new_name = data.get("new_name", "")
    if not old_dir:
        return jsonify({"error": "old_dirが必要です"}), 400
    if not str(new_name or "").strip():
        return jsonify({"error": "new_nameが必要です"}), 400
    result = _page_service.rename_directory(old_dir, new_name)
    if not result:
        return jsonify({"error": "ディレクトリ名を変更できませんでした"}), 400
    return jsonify({"ok": True, **result})
