from datetime import datetime

from flask import Blueprint, render_template, redirect, url_for, abort

from src.common.config import load_config
from src.wiki_app.services.repo_service import RepoService
from src.wiki_app.services.page_service import PageService

history_bp = Blueprint("history", __name__)

_repo_service: RepoService | None = None
_page_service: PageService | None = None


def init_history(repo_service: RepoService, page_service: PageService) -> None:
    global _repo_service, _page_service
    _repo_service = repo_service
    _page_service = page_service


@history_bp.route("/pages/<slug>/history")
def page_history(slug):
    wiki_config = load_config("wiki")
    page = _page_service.get_page(slug)
    if not page:
        abort(404)

    commits = _repo_service.log(f"pages/{slug}.md")
    for c in commits:
        c["timestamp_str"] = datetime.fromtimestamp(c["timestamp"]).strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    return render_template(
        "page_history.html",
        page=page,
        commits=commits,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@history_bp.route("/pages/<slug>/history/<commit_id>")
def page_revision(slug, commit_id):
    wiki_config = load_config("wiki")
    import markdown as md

    page = _page_service.get_page(slug)
    if not page:
        abort(404)

    try:
        content_bytes = _repo_service.show(commit_id, f"pages/{slug}.md")
        content_text = content_bytes.decode("utf-8")
    except (FileNotFoundError, KeyError):
        abort(404)

    import frontmatter
    post = frontmatter.loads(content_text)
    extensions = load_config("wiki").get("markdown_extensions", [])
    html_content = md.markdown(post.content, extensions=extensions)

    return render_template(
        "page_view.html",
        page=page,
        html_content=html_content,
        revision=commit_id[:8],
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@history_bp.route("/pages/<slug>/diff/<commit_a>/<commit_b>")
def page_diff(slug, commit_a, commit_b):
    wiki_config = load_config("wiki")
    page = _page_service.get_page(slug)
    if not page:
        abort(404)

    diff_data = _repo_service.diff(commit_a, commit_b, f"pages/{slug}.md")

    return render_template(
        "page_diff.html",
        page=page,
        old_content=diff_data["old"],
        new_content=diff_data["new"],
        commit_a=commit_a,
        commit_b=commit_b,
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@history_bp.route("/pages/<slug>/restore/<commit_id>", methods=["POST"])
def restore_page(slug, commit_id):
    try:
        content_bytes = _repo_service.restore(commit_id, f"pages/{slug}.md")
        content_text = content_bytes.decode("utf-8")
    except (FileNotFoundError, KeyError):
        abort(404)

    import frontmatter
    post = frontmatter.loads(content_text)
    title = post.get("title", slug)
    tags = post.get("tags", [])

    _page_service.update_page(slug, title, post.content, tags)
    return redirect(url_for("pages.view_page", slug=slug))
