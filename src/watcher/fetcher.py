import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

from src.common.logger import get_logger

logger = get_logger("watcher")

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/142.0.0.0 Safari/537.36"
    )
}


def fetch_content(url: str, selector: str, timeout: int = 30) -> str:
    """URLからHTMLを取得し、CSSセレクタで抽出したテキストを返す"""
    try:
        response = requests.get(url, timeout=timeout, headers=DEFAULT_HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("取得失敗: %s - %s", url, e)
        raise

    soup = BeautifulSoup(response.text, "html.parser")

    if selector:
        element = soup.select_one(selector)
        if element is None:
            logger.warning("セレクタに一致する要素なし: %s (%s)", selector, url)
            return ""
        return element.get_text(strip=True)
    else:
        return soup.get_text(strip=True)


def fetch_html(url: str, timeout: int = 30) -> BeautifulSoup:
    """URLからHTMLを取得し、BeautifulSoupオブジェクトを返す"""
    try:
        response = requests.get(url, timeout=timeout, headers=DEFAULT_HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("HTML取得失敗: %s - %s", url, e)
        raise

    return BeautifulSoup(response.text, "html.parser")


def fetch_json(url: str, timeout: int = 30) -> dict | list:
    """URLからJSONを取得して返す"""
    try:
        response = requests.get(url, timeout=timeout, headers=DEFAULT_HEADERS)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("JSON取得失敗: %s - %s", url, e)
        raise

    return response.json()


def fetch_xml(url: str, timeout: int = 30,
              headers: dict | None = None,
              cookies: dict | None = None) -> ET.Element:
    """URLからXMLを取得し、ElementTreeのルート要素を返す"""
    try:
        merged_headers = {**DEFAULT_HEADERS, **(headers or {})}
        response = requests.get(
            url,
            timeout=timeout,
            headers=merged_headers,
            cookies=cookies or {},
        )
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("XML取得失敗: %s - %s", url, e)
        raise

    return ET.fromstring(response.content)
