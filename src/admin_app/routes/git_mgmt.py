from flask import Blueprint, jsonify

from src.common.paths import get_data_dir
from src.common.logger import get_logger
from src.wiki_app.services.repo_service import RepoService

git_bp = Blueprint("git_mgmt", __name__)
logger = get_logger("admin")

_repo_service: RepoService | None = None


def init_git(repo_service: RepoService) -> None:
    global _repo_service
    _repo_service = repo_service


@git_bp.route("/api/git/status")
def git_status():
    data_dir = get_data_dir()
    git_dir = data_dir / ".git"

    checks = {
        "git_dir_exists": git_dir.exists(),
        "head_readable": False,
        "objects_dir_exists": False,
    }

    if git_dir.exists():
        head_path = git_dir / "HEAD"
        checks["head_readable"] = head_path.exists() and head_path.is_file()

        objects_dir = git_dir / "objects"
        checks["objects_dir_exists"] = objects_dir.exists() and objects_dir.is_dir()

    healthy = all(checks.values())
    return jsonify({"healthy": healthy, "checks": checks})


@git_bp.route("/api/git/reinit", methods=["POST"])
def git_reinit():
    try:
        _repo_service.reinit()
        return jsonify({"ok": True, "message": "リポジトリを再初期化しました"})
    except Exception as e:
        logger.error("Git 再初期化失敗: %s", e)
        return jsonify({"ok": False, "error": str(e)}), 500


@git_bp.route("/api/git/log")
def git_log():
    try:
        commits = _repo_service.log_all(max_count=50)
        return jsonify(commits)
    except Exception as e:
        logger.error("Git ログ取得失敗: %s", e)
        return jsonify({"error": str(e)}), 500
