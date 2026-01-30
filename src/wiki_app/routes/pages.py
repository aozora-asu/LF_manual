import re

from flask import Blueprint, render_template, request, redirect, url_for, abort, jsonify
import markdown as md

from src.common.config import load_config
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


def _postprocess_comment_tags(html: str) -> str:
    """<comment id="xxx">text</comment> を <span class="comment-highlight" data-thread-id="xxx">text</span> に変換する"""
    def _replace(m: re.Match) -> str:
        tid = m.group(1)
        text = m.group(2)
        return f'<span class="comment-highlight" data-thread-id="{tid}">{text}</span>'
    return _COMMENT_TAG_PATTERN.sub(_replace, html)


def _render_md(text: str) -> str:
    wiki_config = load_config("wiki")
    extensions = wiki_config.get("markdown_extensions", [])
    text = _preprocess_notes(text)
    html = md.markdown(text, extensions=extensions)
    html = _postprocess_comment_tags(html)
    return html


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
    _page_service.delete_page(slug)
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


@pages_bp.route("/api/pages/tree")
def page_tree():
    """ページ階層ツリーをJSONで返す"""
    tree = _page_service.get_tree()
    return jsonify(tree)


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
    _page_service.delete_page(slug)
    return jsonify({"ok": True})


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
