import json
from pathlib import Path

from src.common.paths import get_config_dir


def load_config(name: str) -> dict:
    """config/{name}.json を読み込んで dict を返す"""
    config_path = get_config_dir() / f"{name}.json"
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_config(name: str, data: dict) -> None:
    """config/{name}.json に dict を保存する"""
    config_path: Path = get_config_dir() / f"{name}.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
