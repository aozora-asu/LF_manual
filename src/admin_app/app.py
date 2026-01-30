from flask import Flask

from src.common.paths import get_web_dir, get_data_dir
from src.wiki_app.services.repo_service import RepoService
from src.wiki_app.services.page_service import PageService
from src.wiki_app.services.comment_service import CommentService
from src.admin_app.routes.dashboard import dashboard_bp, init_dashboard
from src.admin_app.routes.git_mgmt import git_bp, init_git
from src.admin_app.routes.logs import logs_bp
from src.admin_app.routes.config_editor import config_bp
from src.admin_app.routes.export import export_bp, init_export
from src.admin_app.routes.comments_mgmt import comments_mgmt_bp, init_comments_mgmt
from src.admin_app.routes.state_cleanup import state_bp


def create_admin_app() -> Flask:
    """Admin Flask アプリケーションを構築して返す"""
    web_dir = get_web_dir()

    app = Flask(
        __name__,
        template_folder=str(web_dir / "admin" / "templates"),
        static_folder=str(web_dir / "admin" / "static"),
        static_url_path="/static",
    )

    repo_service = RepoService(get_data_dir())
    page_service = PageService(repo_service)
    comment_service = CommentService()

    init_dashboard(repo_service, page_service, comment_service)
    init_git(repo_service)
    init_export(page_service)
    init_comments_mgmt(comment_service, page_service)

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(git_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(config_bp)
    app.register_blueprint(export_bp)
    app.register_blueprint(comments_mgmt_bp)
    app.register_blueprint(state_bp)

    return app
