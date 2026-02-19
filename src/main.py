import json
import multiprocessing
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
from src.common.heartbeat import get_active_session_count, get_last_activity, init_heartbeat
from src.common.shutdown import cleanup_and_exit, register_exit_cleanup
from src.common.logger import get_logger
from src.wiki_app.app import create_app
from src.admin_app.app import create_admin_app
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
                        _normalize_event(event)
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
        alert_config = load_config("alert")
    except Exception:
        alert_config = {}
    if not alert_config.get("window_enabled", True):
        return

    if sys.platform == "darwin" and threading.current_thread() is not threading.main_thread():
        try:
            ctx = multiprocessing.get_context("spawn")
            p = ctx.Process(target=_show_alert_ui, args=(event,), daemon=True)
            p.start()
        except Exception as e:
            get_logger("alert").error("Alert UI プロセス起動失敗: %s", e)
        return

    _show_alert_ui(event)


def _show_alert_ui(event: dict) -> None:
    """tkinter ウィンドウをメインスレッドで表示する"""
    try:
        if sys.platform == "darwin":
            os.environ.setdefault("TK_SILENCE_DEPRECATION", "1")
        import tkinter as tk
    except ImportError:
        get_logger("alert").error("tkinter が利用できません")
        return

    _normalize_event(event)
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
    root.title("LF リンローマニュアル Alert")
    root.geometry(
        f"{win_cfg.get('width', 400)}x{win_cfg.get('height', 200)}"
    )
    root.configure(bg=win_cfg.get("background", "#ffffff"))

    if alert_config.get("topmost", True):
        root.attributes("-topmost", True)

    title_font_family = _pick_font(title_cfg.get("font_family", "Yu Gothic UI"))
    msg_font_family = _pick_font(msg_cfg.get("font_family", "Yu Gothic UI"))
    btn_font_family = _pick_font(btn_cfg.get("font_family", "Yu Gothic UI"))

    title_label = tk.Label(
        root,
        text=event.get("target_name", "通知"),
        font=(
            title_font_family,
            title_cfg.get("font_size", 14),
            title_cfg.get("font_weight", "bold"),
        ),
        fg=title_cfg.get("color", "#333333"),
        bg=win_cfg.get("background", "#ffffff"),
    )
    title_label.pack(pady=(20, 5))

    summary_text = event.get("summary", "")
    summary_lines = summary_text.count("\n") + 1
    summary_height = max(3, min(8, summary_lines))
    msg_box = tk.Text(
        root,
        height=summary_height,
        wrap="word",
        font=(msg_font_family, msg_cfg.get("font_size", 11)),
        fg=msg_cfg.get("color", "#555555"),
        bg=win_cfg.get("background", "#ffffff"),
        bd=0,
        highlightthickness=0,
    )
    msg_box.insert("1.0", summary_text)
    msg_box.tag_add("body", "1.0", "end")
    msg_box.tag_configure("body", foreground=msg_cfg.get("color", "#555555"))
    msg_box.configure(state="disabled")
    msg_box.pack(pady=5, padx=20, fill="x")

    url_label = tk.Label(
        root,
        text=event.get("url", ""),
        font=(msg_font_family, 9),
        fg="#888888",
        bg=win_cfg.get("background", "#ffffff"),
    )
    url_label.pack(pady=2)

    close_btn = tk.Button(
        root,
        text=btn_cfg.get("text", "閉じる"),
        font=(
            btn_font_family,
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


def _normalize_event(event: dict) -> None:
    """アラート表示用に最低限の情報を補完する"""
    if not isinstance(event, dict):
        return

    if not event.get("target_name"):
        event["target_name"] = event.get("name") or event.get("title") or "通知"

    summary = event.get("summary")
    if not summary:
        lines = []
        if event.get("detect_mode"):
            lines.append(f"検知モード: {event.get('detect_mode')}")
        if event.get("detected_at"):
            lines.append(f"検知時刻: {event.get('detected_at')}")
        if event.get("url"):
            lines.append(f"URL: {event.get('url')}")
        event["summary"] = "\n".join(lines) if lines else "詳細はログを確認してください"

    # 念のため文字列化
    event["target_name"] = str(event.get("target_name", "通知"))
    event["summary"] = str(event.get("summary", ""))
    event["url"] = str(event.get("url", ""))


def _pick_font(font_family: str) -> str:
    if sys.platform == "darwin" and font_family == "Yu Gothic UI":
        return "Hiragino Sans"
    return font_family


def _start_admin_thread() -> threading.Thread:
    """Admin サーバをバックグラウンドスレッドで起動する"""
    admin_config = load_config("admin")
    admin_app = create_admin_app()
    host = admin_config.get("host", "127.0.0.1")
    port = admin_config.get("port", 8081)
    t = threading.Thread(
        target=lambda: admin_app.run(
            host=host,
            port=port,
            use_reloader=False,
            threaded=True,
        ),
        daemon=True,
        name="admin",
    )
    t.start()
    logger.info("Admin サーバ起動: %s:%s", host, port)
    return t


def _start_heartbeat_monitor_thread() -> threading.Thread:
    """ブラウザからのハートビートが途絶えたらプロセスを終了するスレッド"""
    t = threading.Thread(target=_heartbeat_monitor, daemon=True, name="heartbeat-monitor")
    t.start()
    logger.info("Heartbeat Monitor スレッド起動")
    return t


def _heartbeat_monitor() -> None:
    """ハートビートを監視し、一定時間途絶えたらプロセスを終了する"""
    grace_period = 30
    timeout = 60
    expire_after = 120

    time.sleep(grace_period)

    while True:
        active = get_active_session_count(expire_after)
        if active == 0:
            elapsed = time.time() - get_last_activity()
            if elapsed > timeout:
                cleanup_and_exit(
                    f"ブラウザのタブが閉じたため終了します (idle={int(elapsed)}秒)"
                )
        time.sleep(1)


def main() -> None:
    logger.info("LF リンローマニュアル 起動開始")

    ensure_dirs()

    app_config = load_config("app")

    init_heartbeat()
    register_exit_cleanup()

    _start_watcher_thread()
    _start_alert_poller_thread()
    _start_heartbeat_monitor_thread()
    _start_admin_thread()

    host = app_config.get("host", "127.0.0.1")
    port = app_config.get("port", 8080)

    if app_config.get("open_browser", True):
        threading.Timer(1.5, lambda: webbrowser.open(f"http://{host}:{port}")).start()

    app = create_app()
    logger.info("Flask サーバ起動: %s:%s", host, port)
    app.run(
        host=host,
        port=port,
        debug=app_config.get("debug", False),
        use_reloader=False,
        threaded=True,
    )


if __name__ == "__main__":
    main()
