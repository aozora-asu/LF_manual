"""停電情報パーサー

東京電力停電情報APIからXMLデータを取得し、
指定件数以上の停電が発生しているエリアの情報を返す。
"""
import xml.etree.ElementTree as ET

from src.common.logger import get_logger
from src.watcher.fetcher import fetch_xml

logger = get_logger("watcher")


def check_outage(target: dict, default_timeout: int) -> tuple[str, str]:
    """停電情報をチェックする。

    Returns:
        (比較用テキスト, サマリー文字列)
    """
    base_url = target["base_url"]
    auth_token = target.get("auth_token", "")
    area_code = target.get("area_code", "00000000000")
    threshold = target.get("threshold", 1000)
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://teideninfo.tepco.co.jp/",
    }
    cookies = {}
    if auth_token:
        cookies["teideninfo-auth"] = auth_token

    root = fetch_xml(
        f"{base_url}/{area_code}.xml",
        timeout=default_timeout,
        headers=headers,
        cookies=cookies,
    )

    ns = _detect_namespace(root)
    global_notices = _get_notices(root, ns)

    areas = root.findall(f".//{ns}エリア") if ns else root.findall(".//エリア")
    affected = []
    for area in areas:
        name_el = area.find(f"{ns}名前" if ns else "名前")
        count_el = area.find(f"{ns}停電軒数" if ns else "停電軒数")
        code_el = area.find(f"{ns}コード" if ns else "コード")

        if name_el is None or count_el is None:
            continue

        try:
            count = int(count_el.text or "0")
        except ValueError:
            continue

        if count > threshold:
            pref_code = code_el.text if code_el is not None else ""
            pref_name = name_el.text or ""

            pref_detail = _fetch_prefecture_detail(
                base_url, pref_code, default_timeout, headers, cookies, ns
            )

            affected.append({
                "prefecture": pref_name,
                "count": count,
                "code": pref_code,
                "notices": pref_detail.get("notices", []),
                "sub_areas": pref_detail.get("sub_areas", []),
            })

    if not affected and not global_notices:
        return "no_outage", ""

    text_parts = []
    summary_parts = []

    for notice in global_notices:
        text_parts.append(f"notice:{notice}")
        summary_parts.append(f"<停電情報> {notice}")

    for pref in affected:
        text_parts.append(f"{pref['prefecture']}:{pref['count']}")
        summary_parts.append(f"  {pref['prefecture']} : {pref['count']}軒")

        for notice in pref["notices"]:
            summary_parts.append(f"    {notice}")

        for sub in pref["sub_areas"]:
            text_parts.append(f"  {sub['name']}:{sub['count']}")
            summary_parts.append(f"    {sub['name']} : {sub['count']}軒")
            if sub.get("detail"):
                for line in sub["detail"].split("\n"):
                    if line.strip():
                        summary_parts.append(f"      {line.strip()}")

    current_text = "\n".join(text_parts)
    summary = "\n".join(summary_parts)

    return current_text, summary


def _detect_namespace(root: ET.Element) -> str:
    """XMLのネームスペースを検出する"""
    tag = root.tag
    if tag.startswith("{"):
        ns_end = tag.index("}")
        return tag[:ns_end + 1]
    return ""


def _get_notices(root: ET.Element, ns: str) -> list[str]:
    """お知らせ1〜13を取得する"""
    msgs = []
    for i in range(1, 14):
        tag = f"{ns}お知らせ{i}" if ns else f"お知らせ{i}"
        el = root.find(f".//{tag}")
        if el is not None and el.text and el.text.strip():
            msgs.append(el.text.strip())
    return msgs


def _fetch_prefecture_detail(
    base_url: str,
    pref_code: str,
    timeout: int,
    headers: dict,
    cookies: dict,
    ns: str,
) -> dict:
    """都道府県レベルの詳細を取得する"""
    result: dict = {"notices": [], "sub_areas": []}

    if not pref_code:
        return result

    try:
        pref_root = fetch_xml(
            f"{base_url}/{pref_code}.xml",
            timeout=timeout,
            headers=headers,
            cookies=cookies,
        )
    except Exception as e:
        logger.warning("都道府県詳細取得失敗: %s - %s", pref_code, e)
        return result

    result["notices"] = _get_notices(pref_root, ns)

    areas = pref_root.findall(f".//{ns}エリア" if ns else ".//エリア")
    for area in areas:
        name_el = area.find(f"{ns}名前" if ns else "名前")
        count_el = area.find(f"{ns}停電軒数" if ns else "停電軒数")
        code_el = area.find(f"{ns}コード" if ns else "コード")

        if name_el is None or count_el is None:
            continue

        try:
            count = int(count_el.text or "0")
        except ValueError:
            continue

        if count <= 0:
            continue

        sub_code = code_el.text if code_el is not None else ""
        detail = _fetch_city_detail(base_url, sub_code, timeout, headers, cookies, ns)

        result["sub_areas"].append({
            "name": name_el.text or "",
            "count": count,
            "detail": detail,
        })

    return result


def _fetch_city_detail(
    base_url: str,
    city_code: str,
    timeout: int,
    headers: dict,
    cookies: dict,
    ns: str,
) -> str:
    """市区町村レベルの地域詳細情報を取得する"""
    if not city_code:
        return ""

    try:
        city_root = fetch_xml(
            f"{base_url}/{city_code}.xml",
            timeout=timeout,
            headers=headers,
            cookies=cookies,
        )
    except Exception as e:
        logger.warning("市区町村詳細取得失敗: %s - %s", city_code, e)
        return ""

    tag = f"{ns}地域詳細情報" if ns else "地域詳細情報"
    detail_el = city_root.find(f".//{tag}")
    if detail_el is not None and detail_el.text:
        return detail_el.text.strip()
    return ""
