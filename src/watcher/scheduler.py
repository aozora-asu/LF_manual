import threading
import time

from src.common.config import load_config
from src.common.logger import get_logger
from src.watcher.fetcher import fetch_content
from src.watcher.detector import detect_change
from src.watcher.event_writer import write_event, update_index

logger = get_logger("watcher")

_stop_event = threading.Event()


def start_watcher() -> None:
    """Watcher を開始する（ブロッキング、スレッドから呼ぶ）"""
    logger.info("Watcher 開始")
    config = load_config("watcher")
    interval = config.get("interval_seconds", 300)
    targets = config.get("targets", [])

    while not _stop_event.is_set():
        for target in targets:
            if _stop_event.is_set():
                break
            _check_target(target)
        _stop_event.wait(timeout=interval)

    logger.info("Watcher 停止")


def stop_watcher() -> None:
    """Watcher を停止する"""
    _stop_event.set()


def _check_target(target: dict) -> None:
    """単一ターゲットをチェックする"""
    name = target.get("name", "unknown")
    url = target.get("url", "")
    selector = target.get("selector", "")
    detect_mode = target.get("detect_mode", "text_change")
    ignore_patterns = target.get("ignore_patterns", [])

    try:
        text = fetch_content(url, selector)
        changed = detect_change(name, text, detect_mode, ignore_patterns)

        if changed:
            summary_map = {
                "text_change": "テキスト変更を検出しました",
                "element_added": "新しい要素の追加を検出しました",
                "keyword": "キーワードの変更を検出しました",
            }
            summary = summary_map.get(detect_mode, "変更を検出しました")
            write_event(target, detect_mode, summary)

        update_index(target, "ok", changed)

    except Exception as e:
        logger.error("チェック失敗: %s - %s", name, e)
        update_index(target, "error", False)
