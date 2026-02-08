"""停電情報パーサー

東京電力停電情報APIからXMLデータを取得し、
指定件数以上の停電が発生しているエリアの情報を返す。
"""
import xml.etree.ElementTree as ET

from src.common.logger import get_logger
from src.watcher.fetcher import fetch_xml

logger = get_logger("watcher")


def check_outage(target: dict, default_timeout: int) -> tuple[str, str, str]:
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

    global_notices = _get_notices(root)

    areas = _find_all_by_local_name(root, "エリア")
    if not areas:
        logger.debug(
            "停電XMLのエリアが見つかりません: root=%s tags=%s",
            _local_name(root.tag),
            _sample_tags(root),
        )
    
    affected = []
    for area in areas:
        name_el = _find_descendant_by_local_name(area, "名前")
        count_el = _find_descendant_by_local_name(area, "停電軒数")
        code_el = _find_descendant_by_local_name(area, "コード")
        if code_el is None:
            code_el = _find_descendant_by_suffix(area, "コード")

        if name_el is None or count_el is None:
            continue

        try:
            count = int(count_el.text or "0")
        except ValueError:
            continue

        if count > threshold:
            pref_code = ""
            if code_el is not None and code_el.text:
                pref_code = code_el.text.strip()
            if not pref_code:
                pref_code = _find_code_attr(area)
            pref_name = name_el.text or ""

            pref_detail = _fetch_prefecture_detail(
                base_url, pref_code, default_timeout, headers, cookies
            )

            affected.append({
                "prefecture": pref_name,
                "count": count,
                "code": pref_code,
                "notices": pref_detail.get("notices", []),
                "sub_areas": pref_detail.get("sub_areas", []),
            })

    if not affected and not global_notices:
        return "no_outage", "", "none"

    text_parts = []
    summary_parts = []
    info_only = not affected
    info_suffix = f"（{threshold}軒以下）" if info_only else ""

    for notice in global_notices:
        text_parts.append(f"notice:{notice}{info_suffix}")
        summary_parts.append(f"{notice}{info_suffix}")

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

    alert_level = "alert" if affected else "info"
    return current_text, summary, alert_level


def _get_notices(root: ET.Element) -> list[str]:
    """お知らせ1〜13を取得する"""
    msgs = []
    for i in range(1, 14):
        tag = f"お知らせ{i}"
        el = _find_first_by_local_name(root, tag)
        if el is not None and el.text and el.text.strip():
            msgs.append(el.text.strip())
    return msgs


def _fetch_prefecture_detail(
    base_url: str,
    pref_code: str,
    timeout: int,
    headers: dict,
    cookies: dict,
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

    # result["notices"] = _get_notices(pref_root)

    areas = _find_all_by_local_name(pref_root, "エリア")
    if not areas:
        logger.debug(
            "都道府県XMLのエリアが見つかりません: code=%s root=%s tags=%s",
            pref_code,
            _local_name(pref_root.tag),
            _sample_tags(pref_root),
        )
    for area in areas:
        name_el = _find_descendant_by_local_name(area, "名前")
        count_el = _find_descendant_by_local_name(area, "停電軒数")
        code_el = _find_descendant_by_local_name(area, "コード")
        if code_el is None:
            code_el = _find_descendant_by_suffix(area, "コード")

        if name_el is None or count_el is None:
            continue

        try:
            count = int(count_el.text or "0")
        except ValueError:
            continue

        if count <= 0:
            continue

        sub_code = ""
        if code_el is not None and code_el.text:
            sub_code = code_el.text.strip()
        if not sub_code:
            sub_code = _find_code_attr(area)
        detail = _fetch_city_detail(base_url, sub_code, timeout, headers, cookies)

        result["sub_areas"].append({
            "name": name_el.text or "",
            "count": count,
            "detail": detail,
        })

    if not result["sub_areas"]:
        logger.debug(
            "都道府県XMLの詳細エリアが見つかりません: code=%s tags=%s",
            pref_code,
            _sample_tags(pref_root),
        )

    return result


def _fetch_city_detail(
    base_url: str,
    city_code: str,
    timeout: int,
    headers: dict,
    cookies: dict,
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

    lines: list[str] = []

    detail_el = _find_first_by_local_name(city_root, "地域詳細情報")
    if detail_el is not None and detail_el.text:
        lines.append(detail_el.text.strip())

    areas = _find_all_by_local_name(city_root, "エリア")
    area_lines = []
    for area in areas:
        name_el = _find_descendant_by_local_name(area, "名前")
        count_el = _find_descendant_by_local_name(area, "停電軒数")
        if name_el is None or count_el is None:
            continue
        try:
            count = int(count_el.text or "0")
        except ValueError:
            continue
        area_lines.append((name_el.text or "", count))

    if area_lines:
        positive = [item for item in area_lines if item[1] > 0]
        target_lines = positive if positive else area_lines
        for name, count in target_lines:
            if not name:
                continue
            lines.append(f"{name} : {count}軒")

    return "\n".join([line for line in lines if line.strip()])


def _local_name(tag: str) -> str:
    """ネームスペース付きタグからローカル名を抽出する"""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def _find_first_by_local_name(root: ET.Element, local_name: str) -> ET.Element | None:
    for el in root.iter():
        if _local_name(el.tag) == local_name:
            return el
    return None


def _find_all_by_local_name(root: ET.Element, local_name: str) -> list[ET.Element]:
    return [el for el in root.iter() if _local_name(el.tag) == local_name]


def _find_descendant_by_local_name(
    root: ET.Element, local_name: str
) -> ET.Element | None:
    for el in root.iter():
        if _local_name(el.tag) == local_name:
            return el
    return None


def _find_descendant_by_suffix(
    root: ET.Element, suffix: str
) -> ET.Element | None:
    for el in root.iter():
        if _local_name(el.tag).endswith(suffix):
            return el
    return None


def _find_code_attr(root: ET.Element) -> str:
    for key, value in root.attrib.items():
        if _local_name(key).endswith("コード") and value:
            return value.strip()
    return ""


def _sample_tags(root: ET.Element, limit: int = 20) -> list[str]:
    tags: list[str] = []
    seen = set()
    for el in root.iter():
        name = _local_name(el.tag)
        if name in seen:
            continue
        tags.append(name)
        seen.add(name)
        if len(tags) >= limit:
            break
    return tags
