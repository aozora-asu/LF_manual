import hashlib
import json
import threading
import time
from datetime import datetime

from src.common.config import load_config
from src.common.logger import get_logger
from src.common.paths import get_state_dir
from src.watcher.fetcher import fetch_content
from src.watcher.detector import detect_change, snapshot_exists
from src.watcher.event_writer import write_event, update_index, get_target_entry
from src.watcher.parsers.train_parser import check_train
from src.watcher.parsers.weather_parser import check_weather
from src.watcher.parsers.outage_parser import check_outage

logger = get_logger("watcher")

_stop_event = threading.Event()
DEFAULT_INTERVAL_SECONDS = 30


def start_watcher() -> None:
    """Watcher を開始する（ブロッキング、スレッドから呼ぶ）"""
    logger.info("Watcher 開始")
    config = load_config("watcher")
    targets = config.get("targets", [])
    night_stop = config.get("night_stop", {})
    last_config_check = 0.0
    was_night_stopped = False
    next_run: dict[str, float] = {}
    now = time.time()
    for target in targets:
        name = target.get("name", "unknown")
        next_run[name] = now

    while not _stop_event.is_set():
        now = time.time()
        if now - last_config_check > 5:
            try:
                config = load_config("watcher")
                night_stop = config.get("night_stop", {})
            except Exception:
                pass
            last_config_check = now

        if _is_night_stopped(night_stop):
            if not was_night_stopped:
                _reset_watcher_state()
                was_night_stopped = True
            logger.info("夜間停止時間帯のためスキップ")
            _stop_event.wait(timeout=60)
            continue
        if was_night_stopped:
            now = time.time()
            for target in targets:
                name = target.get("name", "unknown")
                next_run[name] = now
            was_night_stopped = False

        now = time.time()
        for target in targets:
            if _stop_event.is_set():
                break
            name = target.get("name", "unknown")
            interval_seconds = _get_target_interval_seconds(
                target, DEFAULT_INTERVAL_SECONDS
            )
            due_at = next_run.get(name, now)
            if now < due_at:
                continue
            if not target.get("enabled", True):
                next_run[name] = now + interval_seconds
                continue
            _check_target(target, interval_seconds)
            next_run[name] = now + interval_seconds

        if _stop_event.is_set():
            break
        now = time.time()
        if next_run:
            next_due = min(next_run.values())
            wait_seconds = max(1, next_due - now)
        else:
            wait_seconds = DEFAULT_INTERVAL_SECONDS
        _stop_event.wait(timeout=wait_seconds)

    logger.info("Watcher 停止")


def stop_watcher() -> None:
    """Watcher を停止する"""
    _stop_event.set()


def _is_night_stopped(night_stop: dict) -> bool:
    """夜間停止時間帯かどうか判定する"""
    if not night_stop.get("enabled", False):
        return False

    now = datetime.now()
    start_hour = night_stop.get("start_hour", 0)
    end_hour = night_stop.get("end_hour", 4)

    return start_hour <= now.hour < end_hour


def _check_target(target: dict, interval_seconds: int) -> None:
    """単一ターゲットをチェックする"""
    name = target.get("name", "unknown")
    target_type = target.get("type", "generic")

    try:
        is_first = not snapshot_exists(name)
        if target_type == "train":
            current_text, summary = check_train(target, interval_seconds)
        elif target_type == "weather":
            current_text, summary = check_weather(target, interval_seconds)
        elif target_type == "outage":
            current_text, summary = check_outage(target, interval_seconds)
        else:
            current_text, summary = _check_generic(target, interval_seconds)

        changed = detect_change(name, current_text, "text_change")

        summary_text = summary or ""
        alert_hash = (
            hashlib.sha256(summary_text.encode("utf-8")).hexdigest()[:16]
            if summary_text
            else ""
        )
        last_entry = get_target_entry(target)
        last_alert_hash = last_entry.get("last_alert_hash", "")

        repeat_alert = target.get("repeat_alert", False)
        should_alert = bool(summary_text) and (
            changed
            or is_first
            or repeat_alert
            or (alert_hash and alert_hash != last_alert_hash)
        )

        if should_alert:
            write_event(target, "text_change", summary)

        status = "error" if summary_text else "ok"
        update_index(
            target,
            status,
            changed,
            alert_hash=alert_hash if summary_text else None,
            alert_active=bool(summary_text),
            alert_summary=summary_text if summary_text else None,
        )

    except Exception as e:
        logger.error("チェック失敗: %s - %s", name, e)
        update_index(target, "error", False, alert_active=False)


def _check_generic(target: dict, interval_seconds: int) -> tuple[str, str]:
    """汎用ターゲット（HTML CSSセレクタ方式）のチェック"""
    url = target.get("url", "")
    selector = target.get("selector", "")
    text = fetch_content(url, selector, timeout=interval_seconds)
    summary = "変更を検出しました" if text else ""
    return text, summary


def _get_target_interval_seconds(target: dict, default_interval: int) -> int:
    value = target.get("interval_seconds", default_interval)
    try:
        interval = int(value)
    except (TypeError, ValueError):
        interval = default_interval
    return max(1, interval)


def _reset_watcher_state() -> None:
    state_dir = get_state_dir() / "watcher"
    snapshots_dir = state_dir / "snapshots"
    events_dir = state_dir / "events"
    for directory in (snapshots_dir, events_dir):
        try:
            if directory.exists():
                for item in directory.iterdir():
                    if item.is_file():
                        item.unlink()
        except Exception as e:
            logger.warning("state削除失敗: %s - %s", directory, e)
    try:
        state_dir.mkdir(parents=True, exist_ok=True)
        index_path = state_dir / "index.json"
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump({"last_run": "", "targets": {}}, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning("index初期化失敗: %s", e)
