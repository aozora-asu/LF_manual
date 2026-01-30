import time
from datetime import datetime

from flask import Flask, jsonify

from src.common.paths import get_web_dir, get_data_dir
from src.wiki_app.services.repo_service import RepoService
from src.wiki_app.services.page_service import PageService
from src.wiki_app.services.comment_service import CommentService
from src.wiki_app.services.search_service import SearchService
from src.wiki_app.routes.pages import pages_bp, init_pages
from src.wiki_app.routes.comments import comments_bp, init_comments
from src.wiki_app.routes.history import history_bp, init_history
from src.wiki_app.routes.search import search_bp, init_search

last_heartbeat: float = 0.0


def get_last_heartbeat() -> float:
    return last_heartbeat


def create_app() -> Flask:
    """Flask アプリケーションを構築して返す"""
    global last_heartbeat
    last_heartbeat = time.time()

    web_dir = get_web_dir()

    app = Flask(
        __name__,
        template_folder=str(web_dir / "templates"),
        static_folder=str(web_dir / "static"),
        static_url_path="/static",
    )

    repo_service = RepoService(get_data_dir())
    page_service = PageService(repo_service)
    comment_service = CommentService()
    search_service = SearchService()

    init_pages(page_service)
    init_comments(comment_service, page_service)
    init_history(repo_service, page_service)
    init_search(search_service)

    app.register_blueprint(pages_bp)
    app.register_blueprint(comments_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(search_bp)

    @app.template_filter("fmt_datetime")
    def fmt_datetime(value: str) -> str:
        """ISO文字列を yyyy-M-dd H:mm:ss (ゼロ埋めなし) に変換する"""
        if not value:
            return ""
        try:
            dt = datetime.fromisoformat(value)
            return f"{dt.year}-{dt.month}-{dt.day:02d} {dt.hour}:{dt.minute:02d}:{dt.second:02d}"
        except (ValueError, TypeError):
            return value

    @app.route("/api/heartbeat", methods=["POST"])
    def heartbeat():
        global last_heartbeat
        last_heartbeat = time.time()
        return jsonify({"ok": True})

    return app
