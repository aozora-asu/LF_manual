import io
import zipfile

from flask import Blueprint, send_file

from src.common.paths import get_data_dir
from src.common.logger import get_logger
from src.wiki_app.services.page_service import PageService

export_bp = Blueprint("export", __name__)
logger = get_logger("admin")

_page_service: PageService | None = None


def init_export(page_service: PageService) -> None:
    global _page_service
    _page_service = page_service


@export_bp.route("/api/export/zip")
def export_zip():
    pages_dir = get_data_dir() / "pages"
    buf = io.BytesIO()

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        if pages_dir.exists():
            for md_file in pages_dir.rglob("*.md"):
                arcname = str(md_file.relative_to(pages_dir))
                zf.write(md_file, arcname)

    buf.seek(0)
    logger.info("ページZIPエクスポート実行")

    return send_file(
        buf,
        mimetype="application/zip",
        as_attachment=True,
        download_name="wiki_pages.zip",
    )
