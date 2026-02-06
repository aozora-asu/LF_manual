"""気象警報パーサー

気象庁APIから警報データを取得し、指定コードの警報が
出ている地域を都道府県単位でまとめて返す。
"""
from src.common.logger import get_logger
from src.watcher.fetcher import fetch_json

logger = get_logger("watcher")

WARNING_CODE_LABELS = {
    "02": "暴風雪警報",
    "03": "大雨警報",
    "04": "洪水警報",
    "05": "暴風警報",
    "06": "大雪警報",
    "07": "波浪警報",
    "08": "高潮警報",
}


def check_weather(target: dict, default_timeout: int) -> tuple[str, str]:
    """気象警報をチェックする。

    Returns:
        (比較用テキスト, サマリー文字列)
    """
    warning_url = target["warning_url"]
    area_url = target["area_url"]
    warning_codes = target.get("warning_codes", ["03"])
    warning_data = fetch_json(warning_url, timeout=default_timeout)
    area_data = fetch_json(area_url, timeout=default_timeout)
    alerts = _extract_alerts(warning_data, warning_codes)

    if not alerts:
        return "no_warning", ""

    results = []
    for alert in alerts:
        hierarchy = _get_area_hierarchy(area_data, alert["area_code"])
        results.append({
            **alert,
            **hierarchy,
        })

    grouped = _group_by_prefecture(results)

    text_parts = []
    summary_parts = []
    for pref, items in sorted(grouped.items()):
        by_attention = {}
        for item in items:
            att = item.get("warning_label") or item.get("attention", "")
            if att not in by_attention:
                by_attention[att] = []
            city = item.get("city", item["area_code"])
            if city:
                by_attention[att].append(city)

        pref_text = f"<{pref}>"
        pref_lines = [pref_text]
        for att, cities in by_attention.items():
            places = "、".join(sorted(set(cities)))
            att_label = att if att else "警報"
            pref_lines.append(f"  {att_label}: {places}")

        text_parts.append("\n".join(pref_lines))
        summary_parts.append("\n".join(pref_lines))

    current_text = "\n\n".join(text_parts)
    summary = "【警戒情報】\n" + "\n\n".join(summary_parts)

    return current_text, summary


def _extract_alerts(warning_data: list, warning_codes: list[str]) -> list[dict]:
    """warning.jsonから指定コードの警報を抽出する"""
    alerts = []
    for entry in warning_data:
        for area_type in entry.get("areaTypes", []):
            for area in area_type.get("areas", []):
                for warning in area.get("warnings", []):
                    code = warning.get("code")
                    if code in warning_codes:
                        label = (
                            WARNING_CODE_LABELS.get(code)
                            or warning.get("name")
                            or warning.get("type")
                            or warning.get("status")
                            or "警報"
                        )
                        attentions = warning.get("attentions", [None])
                        if not attentions:
                            attentions = [None]
                        for att in attentions:
                            alerts.append({
                                "area_code": area.get("code", ""),
                                "warning_code": code or "",
                                "warning_label": label,
                                "status": warning.get("status", ""),
                                "condition": warning.get("condition", ""),
                                "attention": att,
                            })
    return alerts


def _get_area_hierarchy(area_data: dict, code: str) -> dict:
    """エリアコードから地域階層（市町村→都道府県）を辿る"""
    result = {
        "city": None,
        "district": None,
        "region": None,
        "prefecture": None,
    }

    cur = str(code)
    levels = ["class20s", "class15s", "class10s", "offices", "centers"]

    for _ in range(10):
        found = None
        level = None

        for lv in levels:
            area_dict = area_data.get(lv, {})
            if cur in area_dict:
                found = area_dict[cur]
                level = lv
                break
            for key in area_dict:
                try:
                    if int(key) == int(cur):
                        found = area_dict[key]
                        level = lv
                        cur = key
                        break
                except (ValueError, TypeError):
                    continue
            if found:
                break

        if not found:
            break

        if level == "class20s":
            result["city"] = found.get("name")
        elif level == "class15s":
            result["district"] = found.get("name")
        elif level == "class10s":
            if not result["region"]:
                result["region"] = found.get("name")
        elif level == "offices":
            if not result["prefecture"]:
                result["prefecture"] = found.get("name")
        elif level == "centers":
            pass

        parent = found.get("parent")
        if parent:
            cur = str(parent)
        else:
            break

    return result


def _group_by_prefecture(results: list[dict]) -> dict[str, list[dict]]:
    """結果を都道府県でグルーピングする"""
    grouped: dict[str, list[dict]] = {}
    for r in results:
        pref = r.get("prefecture") or r.get("region") or "不明"
        if pref not in grouped:
            grouped[pref] = []
        grouped[pref].append(r)
    return grouped
