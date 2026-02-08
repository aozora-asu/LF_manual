"""電車運行情報パーサー

Yahoo!路線情報の運行障害ページをスクレイピングし、
運転見合わせ・運転再開等の情報を取得する。
"""
import re

from src.common.logger import get_logger
from src.watcher.fetcher import fetch_html

logger = get_logger("watcher")


def check_train(target: dict, default_timeout: int) -> tuple[bool, str]:
    """電車運行情報をチェックする。

    Returns:
        (changed: bool を判定するためのテキスト, サマリー文字列)
        テキストが前回と異なれば変更ありと判定される。
    """
    url = target["url"]
    detail_base = target.get("detail_base_url", "https://transit.yahoo.co.jp")
    selector = target.get("selector", "#mdStatusTroubleLine")
    detail_selector = target.get("detail_selector", "#mdServiceStatus")
    alert_statuses = target.get("alert_statuses", ["運転見合わせ", "運転再開"])
    soup = fetch_html(url, timeout=default_timeout)
    
    trouble_div = soup.select_one(selector)
    if not trouble_div:
        return "no_trouble", ""

    rows = trouble_div.find_all("tr")
    results = []

    def contains_alert(text: str) -> bool:
        return any(status in text for status in alert_statuses)

    def pick_alert(text: str) -> str | None:
        for status in alert_statuses:
            if status in text:
                return status
        return None

    for tr in rows:
        tds = tr.find_all("td")
        if len(tds) < 3:
            continue

        link = tds[0].find("a")
        if not link:
            continue

        line_name = link.get_text(strip=True)
        href = link.get("href", "")

        if href.startswith("http"):
            detail_url = href
        elif href.startswith("/"):
            detail_url = detail_base + href
        else:
            detail_url = detail_base + "/" + href

        status = tds[1].get_text(strip=True)
        status_hit = contains_alert(status)
        needs_detail_check = (not status_hit) and ("他" in status or "運転計画" in status)
        plan = ""
        if status_hit or needs_detail_check:
            plan = _fetch_detail(detail_url, detail_selector, default_timeout)
            if not status_hit and plan:
                matched = pick_alert(plan)
                if matched:
                    status_hit = True
                    status = matched

        if not status_hit:
            continue

        results.append({
            "line": line_name,
            "status": status,
            "detail": plan,
            "url": detail_url,
        })

    if not results:
        return "no_alert", ""

    text_parts = []
    summary_parts = []
    for r in results:
        text_parts.append(f"{r['line']}:{r['status']}:{r['detail']}")
        detail_str = f"   {r['detail']}" if r["detail"] else ""
        summary_parts.append(f"{r['line']}   {r['status']}\n{detail_str}")

    current_text = "\n".join(text_parts)
    summary = "\n\n".join(summary_parts)

    return current_text, summary


def _fetch_detail(detail_url: str, selector: str, timeout: int) -> str:
    """詳細ページから運転計画を取得する"""
    try:
        soup = fetch_html(detail_url, timeout=timeout)
        svc_div = soup.select_one(selector)
        if not svc_div:
            return ""

        texts = []
        dl = svc_div.find("dl")
        if dl:
            nodes = dl.find_all(["dt", "dd"])
            current_title = ""
            for node in nodes:
                if node.name == "dt":
                    current_title = node.get_text(strip=True)
                    continue
                if node.name == "dd":
                    body = node.get_text(strip=True)
                    if current_title and body:
                        texts.append(f"{current_title} {body}")
                    elif body:
                        texts.append(body)
        else:
            dds = svc_div.find_all("dd")
            texts = [dd.get_text(strip=True) for dd in dds if dd.get_text(strip=True)]

        return " / ".join(texts) if texts else ""

    except Exception as e:
        logger.warning("詳細ページ取得失敗: %s - %s", detail_url, e)
        return ""
