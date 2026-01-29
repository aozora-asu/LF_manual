import re

from flask import Blueprint, render_template, request, redirect, url_for, abort
import markdown as md

from src.common.config import load_config
from src.wiki_app.services.page_service import PageService

pages_bp = Blueprint("pages", __name__)

_page_service: PageService | None = None


def init_pages(page_service: PageService) -> None:
    global _page_service
    _page_service = page_service


def _render_md(text: str) -> str:
    wiki_config = load_config("wiki")
    extensions = wiki_config.get("markdown_extensions", [])
    return md.markdown(text, extensions=extensions)


@pages_bp.route("/")
def index():
    wiki_config = load_config("wiki")
    pages = _page_service.list_pages()
    return render_template(
        "page_list.html",
        pages=pages,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/pages/new", methods=["GET", "POST"])
def new_page():
    wiki_config = load_config("wiki")
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        body = request.form.get("body", "")
        tags_str = request.form.get("tags", "")
        tags = [t.strip() for t in tags_str.split(",") if t.strip()]

        slug = re.sub(r"[^\w\-]", "-", title.lower()).strip("-")
        slug = re.sub(r"-+", "-", slug)
        if not slug:
            slug = "untitled"

        if _page_service.page_exists(slug):
            counter = 2
            while _page_service.page_exists(f"{slug}-{counter}"):
                counter += 1
            slug = f"{slug}-{counter}"

        _page_service.create_page(slug, title, body, tags)
        return redirect(url_for("pages.view_page", slug=slug))

    return render_template(
        "page_new.html",
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/pages/<slug>")
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


@pages_bp.route("/pages/<slug>/edit", methods=["GET", "POST"])
def edit_page(slug):
    wiki_config = load_config("wiki")
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        body = request.form.get("body", "")
        tags_str = request.form.get("tags", "")
        tags = [t.strip() for t in tags_str.split(",") if t.strip()]

        _page_service.update_page(slug, title, body, tags)
        return redirect(url_for("pages.view_page", slug=slug))

    page = _page_service.get_page(slug)
    if not page:
        abort(404)
    return render_template(
        "page_edit.html",
        page=page,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@pages_bp.route("/pages/<slug>/delete", methods=["POST"])
def delete_page(slug):
    _page_service.delete_page(slug)
    return redirect(url_for("pages.index"))


@pages_bp.route("/pages/<slug>/print")
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
