import json
from pathlib import Path

from src.common.paths import get_config_dir


def load_config(name: str) -> dict:
    """config/{name}.json を読み込んで dict を返す"""
    config_path = get_config_dir() / f"{name}.json"
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)
