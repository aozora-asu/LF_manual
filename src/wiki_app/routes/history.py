from datetime import datetime
import re

from flask import Blueprint, render_template, redirect, url_for, abort, jsonify

from src.common.config import load_config
from src.wiki_app.models.page import Page
from src.wiki_app.services.repo_service import RepoService
from src.wiki_app.services.page_service import PageService
from src.wiki_app.routes.pages import _render_md

history_bp = Blueprint("history", __name__)

_repo_service: RepoService | None = None
_page_service: PageService | None = None
_HISTORY_KIND_RE = re.compile(r"^(Create|Edit|Move|Delete)\s*:\s*(.*)$", re.IGNORECASE)
_MOVE_SLUG_RE = re.compile(r"\((.+?)\s*→\s*(.+?)\)\s*$")


def init_history(repo_service: RepoService, page_service: PageService) -> None:
    global _repo_service, _page_service
    _repo_service = repo_service
    _page_service = page_service


def _render_revision(slug: str, commit_id: str) -> dict:
    """指定コミットのMarkdownを取得してレンダリング済みHTMLを返す。"""
    content_bytes = _repo_service.show(commit_id, f"pages/{slug}.md")
    content_text = content_bytes.decode("utf-8")

    import frontmatter

    post = frontmatter.loads(content_text)
    return {
        "title": post.get("title") or slug,
        "body": post.content,
        "html": _render_md(post.content),
    }


def _parse_history_kind(message: str) -> str:
    m = _HISTORY_KIND_RE.match(str(message or "").strip())
    if not m:
        return ""
    return m.group(1).capitalize()


def _parse_move_slugs(message: str) -> tuple[str, str] | None:
    text = str(message or "").strip()
    m = _MOVE_SLUG_RE.search(text)
    if not m:
        return None
    old_slug = m.group(1).strip().strip("/")
    new_slug = m.group(2).strip().strip("/")
    if not old_slug or not new_slug:
        return None
    return old_slug, new_slug


def _build_commit_slug_index(commit_ids: set[str]) -> tuple[dict[str, str], dict[str, str], dict[tuple[str, str], str]]:
    """commit_id -> slug の推定インデックスを構築する。"""
    commit_to_slug: dict[str, str] = {}
    slug_latest_commit: dict[str, str] = {}
    slug_prev_commit: dict[tuple[str, str], str] = {}

    slugs = {page.slug for page in _page_service.list_pages()}
    for item in _page_service.list_trashed_pages():
        slug = str(item.get("slug", "")).strip().strip("/")
        if slug:
            slugs.add(slug)

    unresolved = set(commit_ids)
    for slug in sorted(slugs):
        path = f"pages/{slug}.md"
        history = _repo_service.log(path, max_count=200)
        if not history:
            continue

        slug_latest_commit[slug] = history[0]["id"]
        for idx, entry in enumerate(history):
            cid = entry["id"]
            if cid not in commit_to_slug:
                commit_to_slug[cid] = slug
            if idx + 1 < len(history):
                slug_prev_commit[(slug, cid)] = history[idx + 1]["id"]
            unresolved.discard(cid)
        if not unresolved:
            break

    return commit_to_slug, slug_latest_commit, slug_prev_commit


@history_bp.route("/pages/<path:slug>/history")
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


@history_bp.route("/pages/<path:slug>/history/<commit_id>")
def page_revision(slug, commit_id):
    wiki_config = load_config("wiki")

    try:
        content_bytes = _repo_service.show(commit_id, f"pages/{slug}.md")
        content_text = content_bytes.decode("utf-8")
    except (FileNotFoundError, KeyError):
        abort(404)

    import frontmatter
    post = frontmatter.loads(content_text)
    html_content = _render_md(post.content)
    page = _page_service.get_page(slug) or Page(
        slug=slug,
        title=post.get("title") or slug,
        body=post.content,
        created=post.get("created", ""),
        updated=post.get("updated", ""),
    )

    return render_template(
        "page_view.html",
        page=page,
        html_content=html_content,
        revision=commit_id[:8],
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@history_bp.route("/pages/<path:slug>/diff/<commit_a>/<commit_b>")
def page_diff(slug, commit_a, commit_b):
    wiki_config = load_config("wiki")
    page = _page_service.get_page(slug)
    if not page:
        abort(404)

    try:
        old_rev = _render_revision(slug, commit_a)
        new_rev = _render_revision(slug, commit_b)
    except (FileNotFoundError, KeyError):
        abort(404)

    return render_template(
        "page_diff.html",
        page=page,
        old_html=old_rev["html"],
        new_html=new_rev["html"],
        old_commit_id=commit_a,
        old_revision=commit_a[:8],
        new_revision=commit_b[:8],
        compare_mode="revision",
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@history_bp.route("/pages/<path:slug>/compare/<commit_id>")
def page_compare_latest(slug, commit_id):
    """指定リビジョンと現在の最新版を左右比較する。"""
    wiki_config = load_config("wiki")
    page = _page_service.get_page(slug)
    if not page:
        abort(404)

    try:
        old_rev = _render_revision(slug, commit_id)
    except (FileNotFoundError, KeyError):
        abort(404)

    latest_commit = _repo_service.log(f"pages/{slug}.md", max_count=1)
    latest_revision = latest_commit[0]["id"][:8] if latest_commit else "latest"

    return render_template(
        "page_diff.html",
        page=page,
        old_html=old_rev["html"],
        new_html=_render_md(page.body),
        old_commit_id=commit_id,
        old_revision=commit_id[:8],
        new_revision=latest_revision,
        compare_mode="latest",
        site_name=wiki_config.get("site_name", "Wiki"),
    )


@history_bp.route("/pages/<path:slug>/restore/<commit_id>", methods=["POST"])
def restore_page(slug, commit_id):
    try:
        content_bytes = _repo_service.restore(commit_id, f"pages/{slug}.md")
        content_text = content_bytes.decode("utf-8")
    except (FileNotFoundError, KeyError):
        abort(404)

    import frontmatter
    post = frontmatter.loads(content_text)
    title = post.get("title", slug)

    _page_service.update_page(slug, title, post.content)
    return redirect(url_for("pages.view_page", slug=slug))


@history_bp.route("/api/history")
def global_history():
    """マニュアル全体のコミット履歴をJSONで返す"""
    commits = _repo_service.log_all(max_count=30)
    commit_ids = {c.get("id", "") for c in commits if c.get("id")}
    commit_to_slug, slug_latest_commit, slug_prev_commit = _build_commit_slug_index(commit_ids)

    for c in commits:
        commit_id = c.get("id", "")
        kind = _parse_history_kind(c.get("message", ""))
        slug = commit_to_slug.get(commit_id, "")

        move_slugs = _parse_move_slugs(c.get("message", ""))
        if not slug and move_slugs:
            old_slug, new_slug = move_slugs
            slug = new_slug if _page_service.page_exists(new_slug) else old_slug

        target_commit = commit_id
        if slug and kind == "Delete":
            fallback = slug_prev_commit.get((slug, commit_id), "")
            if fallback:
                target_commit = fallback

        is_latest = bool(slug and slug_latest_commit.get(slug) == commit_id and kind != "Delete")
        view_url = ""
        version_label = ""
        if slug:
            if is_latest:
                view_url = url_for("pages.view_page", slug=slug)
                version_label = "最新版"
            elif target_commit:
                view_url = url_for("history.page_revision", slug=slug, commit_id=target_commit)
                if kind == "Delete" and target_commit != commit_id:
                    version_label = f"削除直前 {target_commit[:8]}"
                else:
                    version_label = f"過去版 {target_commit[:8]}"

        c["slug"] = slug
        c["view_url"] = view_url
        c["version_label"] = version_label
        c["is_latest"] = is_latest
        c["timestamp_str"] = datetime.fromtimestamp(c["timestamp"]).strftime(
            "%Y-%m-%d %H:%M"
        )
    return jsonify(commits)
