import os
import subprocess


def hidden_subprocess_kwargs() -> dict:
    """Windows では子プロセスのコンソールを表示しない。"""
    if os.name != "nt":
        return {}

    kwargs = {
        "creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0),
    }

    startupinfo_cls = getattr(subprocess, "STARTUPINFO", None)
    if startupinfo_cls is not None:
        startupinfo = startupinfo_cls()
        startupinfo.dwFlags |= getattr(subprocess, "STARTF_USESHOWWINDOW", 0)
        startupinfo.wShowWindow = getattr(subprocess, "SW_HIDE", 0)
        kwargs["startupinfo"] = startupinfo

    return kwargs
