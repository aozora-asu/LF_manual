import requests
from bs4 import BeautifulSoup

from src.common.logger import get_logger

logger = get_logger("watcher")


def fetch_content(url: str, selector: str, timeout: int = 30) -> str:
    """URLからHTMLを取得し、CSSセレクタで抽出したテキストを返す"""
    try:
        response = requests.get(url, timeout=timeout)
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
