from flask import Blueprint, request, render_template

from src.common.config import load_config
from src.wiki_app.services.search_service import SearchService

search_bp = Blueprint("search", __name__)

_search_service: SearchService | None = None


def init_search(search_service: SearchService) -> None:
    global _search_service
    _search_service = search_service


@search_bp.route("/search")
def search():
    wiki_config = load_config("wiki")
    query = request.args.get("q", "")
    results = _search_service.search(query) if query else []
    return render_template(
        "search.html",
        query=query,
        results=results,
        site_name=wiki_config.get("site_name", "Wiki"),
    )
