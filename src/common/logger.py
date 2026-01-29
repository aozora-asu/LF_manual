import logging
from pathlib import Path

from src.common.paths import get_logs_dir

_initialized: dict[str, bool] = {}


def get_logger(name: str) -> logging.Logger:
    """用途別ロガーを返す。logs/{name}.log に出力"""
    logger = logging.getLogger(name)

    if name not in _initialized:
        logger.setLevel(logging.DEBUG)

        log_file = get_logs_dir() / f"{name}.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)

        handler = logging.FileHandler(log_file, encoding="utf-8")
        handler.setLevel(logging.DEBUG)

        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        )
        handler.setFormatter(formatter)

        logger.addHandler(handler)
        _initialized[name] = True

    return logger
