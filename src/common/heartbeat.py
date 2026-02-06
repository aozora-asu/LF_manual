import threading
import time

_lock = threading.Lock()
_last_activity: float = 0.0
_sessions: dict[str, float] = {}


def init_heartbeat() -> None:
    """起動時のハートビート初期化"""
    global _last_activity
    with _lock:
        _last_activity = time.time()
        _sessions.clear()


def register_session(session_id: str) -> None:
    """新規セッション登録"""
    _touch_session(session_id)


def touch_session(session_id: str) -> None:
    """セッションのハートビート更新"""
    _touch_session(session_id)


def close_session(session_id: str) -> None:
    """セッション終了"""
    global _last_activity
    with _lock:
        _sessions.pop(session_id, None)
        _last_activity = time.time()


def get_active_session_count(expire_after: float) -> int:
    """期限切れを除外したアクティブセッション数を返す"""
    now = time.time()
    with _lock:
        stale = [sid for sid, ts in _sessions.items() if now - ts > expire_after]
        for sid in stale:
            _sessions.pop(sid, None)
        return len(_sessions)


def get_last_activity() -> float:
    """最終アクティビティ時刻を返す（epoch秒）"""
    with _lock:
        return _last_activity


def _touch_session(session_id: str) -> None:
    global _last_activity
    now = time.time()
    with _lock:
        _sessions[session_id] = now
        _last_activity = now
