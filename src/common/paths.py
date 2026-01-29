import sys
from pathlib import Path


def get_base_dir() -> Path:
    """exe実行時: sys.executable の親ディレクトリ
    開発時: プロジェクトルート"""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    else:
        return Path(__file__).resolve().parent.parent.parent


def get_data_dir() -> Path:
    return get_base_dir() / "data"


def get_config_dir() -> Path:
    return get_base_dir() / "config"


def get_state_dir() -> Path:
    return get_base_dir() / "state"


def get_web_dir() -> Path:
    return get_base_dir() / "web"


def get_alert_ui_dir() -> Path:
    return get_base_dir() / "alert_ui"


def get_logs_dir() -> Path:
    return get_base_dir() / "logs"


def ensure_dirs() -> None:
    """data/, state/, logs/ ディレクトリを自動作成する"""
    dirs = [
        get_data_dir() / "pages",
        get_data_dir() / "comments",
        get_state_dir() / "watcher" / "snapshots",
        get_state_dir() / "watcher" / "events",
        get_logs_dir(),
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
