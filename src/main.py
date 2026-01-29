import json
import os
import sys
import threading
import time
import webbrowser

# exe 実行時・直接実行時にモジュール解決できるようプロジェクトルートを追加
if not getattr(sys, "frozen", False):
    _project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if _project_root not in sys.path:
        sys.path.insert(0, _project_root)

from src.common.paths import ensure_dirs, get_state_dir, get_base_dir, get_alert_ui_dir
from src.common.config import load_config
from src.common.logger import get_logger
from src.wiki_app.app import create_app
from src.watcher.scheduler import start_watcher, stop_watcher

logger = get_logger("app")


def _start_watcher_thread() -> threading.Thread:
    """Watcher をバックグラウンドスレッドで起動する"""
    t = threading.Thread(target=start_watcher, daemon=True, name="watcher")
    t.start()
    logger.info("Watcher スレッド起動")
    return t


def _start_alert_poller_thread() -> threading.Thread:
    """Alert Poller をバックグラウンドスレッドで起動する"""
    t = threading.Thread(target=_alert_poller, daemon=True, name="alert-poller")
    t.start()
    logger.info("Alert Poller スレッド起動")
    return t


def _alert_poller() -> None:
    """state/watcher/events/ を定期監視し、新規JSONを検出したらアラートを表示する"""
    alert_logger = get_logger("alert")
    events_dir = get_state_dir() / "watcher" / "events"

    while True:
        try:
            if events_dir.exists():
                for event_file in sorted(events_dir.glob("*.json")):
                    try:
                        with open(event_file, "r", encoding="utf-8") as f:
                            event = json.load(f)
                        alert_logger.info(
                            "アラート表示: %s - %s",
                            event.get("target_name"),
                            event.get("summary"),
                        )
                        _show_alert(event)
                        os.remove(event_file)
                    except Exception as e:
                        alert_logger.error("イベント処理失敗: %s - %s", event_file.name, e)
        except Exception as e:
            alert_logger.error("Alert Poller エラー: %s", e)

        time.sleep(5)


def _show_alert(event: dict) -> None:
    """tkinter ウィンドウでアラートを表示する。layout.json からデザインを読み込む。"""
    try:
        import tkinter as tk
    except ImportError:
        get_logger("alert").error("tkinter が利用できません")
        return

    alert_config = load_config("alert")
    layout_path = get_alert_ui_dir() / "layout.json"

    if layout_path.exists():
        with open(layout_path, "r", encoding="utf-8") as f:
            layout = json.load(f)
    else:
        layout = {}

    win_cfg = layout.get("window", {})
    title_cfg = layout.get("title", {})
    msg_cfg = layout.get("message", {})
    btn_cfg = layout.get("close_button", {})

    root = tk.Tk()
    root.title("WikiSuite Alert")
    root.geometry(
        f"{win_cfg.get('width', 400)}x{win_cfg.get('height', 200)}"
    )
    root.configure(bg=win_cfg.get("background", "#ffffff"))

    if alert_config.get("topmost", True):
        root.attributes("-topmost", True)

    title_label = tk.Label(
        root,
        text=event.get("target_name", "通知"),
        font=(
            title_cfg.get("font_family", "Yu Gothic UI"),
            title_cfg.get("font_size", 14),
            title_cfg.get("font_weight", "bold"),
        ),
        fg=title_cfg.get("color", "#333333"),
        bg=win_cfg.get("background", "#ffffff"),
    )
    title_label.pack(pady=(20, 5))

    msg_label = tk.Label(
        root,
        text=event.get("summary", ""),
        font=(
            msg_cfg.get("font_family", "Yu Gothic UI"),
            msg_cfg.get("font_size", 11),
        ),
        fg=msg_cfg.get("color", "#555555"),
        bg=win_cfg.get("background", "#ffffff"),
        wraplength=win_cfg.get("width", 400) - 40,
    )
    msg_label.pack(pady=5)

    url_label = tk.Label(
        root,
        text=event.get("url", ""),
        font=(msg_cfg.get("font_family", "Yu Gothic UI"), 9),
        fg="#888888",
        bg=win_cfg.get("background", "#ffffff"),
    )
    url_label.pack(pady=2)

    close_btn = tk.Button(
        root,
        text=btn_cfg.get("text", "閉じる"),
        font=(
            btn_cfg.get("font_family", "Yu Gothic UI"),
            btn_cfg.get("font_size", 10),
        ),
        bg=btn_cfg.get("background", "#4a90d9"),
        fg=btn_cfg.get("color", "#ffffff"),
        command=root.destroy,
    )
    close_btn.pack(pady=10)

    duration = alert_config.get("duration_seconds", 30)
    if duration > 0:
        root.after(duration * 1000, root.destroy)

    if alert_config.get("play_sound", False):
        sound_file = get_base_dir() / alert_config.get("sound_file", "")
        if sound_file.exists():
            try:
                import winsound
                winsound.PlaySound(str(sound_file), winsound.SND_ASYNC)
            except Exception:
                pass

    root.mainloop()


def _start_heartbeat_monitor_thread() -> threading.Thread:
    """ブラウザからのハートビートが途絶えたらプロセスを終了するスレッド"""
    t = threading.Thread(target=_heartbeat_monitor, daemon=True, name="heartbeat-monitor")
    t.start()
    logger.info("Heartbeat Monitor スレッド起動")
    return t


def _heartbeat_monitor() -> None:
    """ハートビートを監視し、一定時間途絶えたらプロセスを終了する"""
    from src.wiki_app.app import get_last_heartbeat

    grace_period = 30
    timeout = 15

    time.sleep(grace_period)

    while True:
        elapsed = time.time() - get_last_heartbeat()
        if elapsed > timeout:
            logger.info("ブラウザからのハートビートが %d 秒途絶えたため終了します", int(elapsed))
            os._exit(0)
        time.sleep(5)


def main() -> None:
    logger.info("WikiSuite 起動開始")

    ensure_dirs()

    app_config = load_config("app")

    _start_watcher_thread()
    _start_alert_poller_thread()
    _start_heartbeat_monitor_thread()

    host = app_config.get("host", "127.0.0.1")
    port = app_config.get("port", 8080)

    if app_config.get("open_browser", True):
        threading.Timer(1.5, lambda: webbrowser.open(f"http://{host}:{port}")).start()

    app = create_app()
    logger.info("Flask サーバ起動: %s:%s", host, port)
    app.run(host=host, port=port, debug=app_config.get("debug", False), use_reloader=False)


if __name__ == "__main__":
    main()
