import io
import base64
import mimetypes
import os
import re
import shutil
import subprocess
import tempfile
import textwrap
import zipfile
from html import escape
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit, urlunsplit

from flask import Blueprint, jsonify, send_file

from src.common.paths import get_data_dir, get_web_dir
from src.common.config import load_config
from src.common.logger import get_logger
from src.wiki_app.services.page_service import PageService
from src.wiki_app.routes.pages import _render_md

export_bp = Blueprint("export", __name__)
logger = get_logger("admin")

_page_service: PageService | None = None
_DEFAULT_UI_PATTERN = "latte_notebook"
_UI_PATTERN_CSS: dict[str, str] = {
    "latte_notebook": "pattern-latte-notebook.css",
    "city_pop_guide": "pattern-city-pop-guide.css",
    "midnight_console": "pattern-midnight-console.css",
    "robotic_slate": "pattern-robotic-slate.css",
}
_ATTR_URL_PATTERN = re.compile(r'(?P<attr>href|src)=("|\')(?P<url>[^"\']+)("|\')')
_INVALID_FILE_PART = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


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


@export_bp.route("/api/export/html")
def export_html_zip():
    if _page_service is None:
        return {"ok": False, "error": "page service unavailable"}, 500

    pages, slug_map, ui_pattern_class, style_css, pattern_css = _prepare_export_context()
    images_dir = get_data_dir() / "images"

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for page in pages:
            raw_html = _render_md(page.body)
            body_html = _rewrite_html_links_for_export(raw_html, slug_map, images_dir)
            page_doc = _build_page_html(
                title=page.title,
                slug=page.slug,
                created=page.created,
                updated=page.updated,
                body_html=body_html,
                ui_pattern_class=ui_pattern_class,
                style_css=style_css,
                pattern_css=pattern_css,
            )
            zf.writestr(f"pages/{slug_map[page.slug]}", page_doc)

        zf.writestr(
            "index.html",
            _build_index_html(
                pages=pages,
                slug_map=slug_map,
                ui_pattern_class=ui_pattern_class,
                style_css=style_css,
                pattern_css=pattern_css,
            ),
        )

    buf.seek(0)
    logger.info("ページHTMLエクスポート実行")
    return send_file(
        buf,
        mimetype="application/zip",
        as_attachment=True,
        download_name="wiki_pages_html.zip",
    )


@export_bp.route("/api/export/word")
def export_word_zip():
    if _page_service is None:
        return jsonify({"ok": False, "error": "page service unavailable"}), 500
    if os.name != "nt":
        return jsonify({"ok": False, "error": "WordエクスポートはWindows環境のみ対応です"}), 400

    powershell = shutil.which("powershell") or shutil.which("powershell.exe")
    if not powershell:
        return jsonify({"ok": False, "error": "PowerShell が見つかりません"}), 500

    pages, slug_map, ui_pattern_class, style_css, pattern_css = _prepare_export_context()
    images_dir = get_data_dir() / "images"

    with tempfile.TemporaryDirectory(prefix="wiki_word_export_") as tmpdir:
        base = Path(tmpdir)
        pages_dir = base / "pages"
        pages_dir.mkdir(parents=True, exist_ok=True)

        for page in pages:
            raw_html = _render_md(page.body)
            body_html = _rewrite_html_links_for_export(raw_html, slug_map, images_dir)
            html_doc = _build_page_html(
                title=page.title,
                slug=page.slug,
                created=page.created,
                updated=page.updated,
                body_html=body_html,
                ui_pattern_class=ui_pattern_class,
                style_css=style_css,
                pattern_css=pattern_css,
            )
            rel = PurePosixPath(slug_map[page.slug])
            target = pages_dir.joinpath(*rel.parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                f.write(html_doc)

        ps1_path = base / "convert_html_to_docx.ps1"
        with open(str(ps1_path), "w", encoding="utf-8") as f:
            f.write(_word_convert_script())

        proc = subprocess.run(
            [
                powershell,
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ps1_path),
                "-Path",
                str(pages_dir),
            ],
            capture_output=True,
            text=True,
            timeout=600,
        )
        if proc.returncode != 0:
            msg = (proc.stderr or proc.stdout or "").strip()
            if not msg:
                msg = "Word変換の実行に失敗しました"
            logger.error("Wordエクスポート失敗: %s", msg)
            return jsonify({"ok": False, "error": msg}), 500

        docx_files: list[str] = []
        for root, _, files in os.walk(str(pages_dir)):
            for name in files:
                if name.lower().endswith(".docx"):
                    docx_files.append(os.path.join(root, name))
        if not docx_files:
            return jsonify({"ok": False, "error": "Wordファイルが生成されませんでした"}), 500

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path in sorted(docx_files):
                rel = os.path.relpath(file_path, str(pages_dir)).replace("\\", "/")
                zf.write(file_path, rel)

        buf.seek(0)
        logger.info("ページWordエクスポート実行")
        return send_file(
            buf,
            mimetype="application/zip",
            as_attachment=True,
            download_name="wiki_pages_word.zip",
        )


def _resolve_ui_pattern() -> tuple[str, str]:
    wiki_config = load_config("wiki")
    key = str(wiki_config.get("ui_pattern", _DEFAULT_UI_PATTERN))
    if key not in _UI_PATTERN_CSS:
        key = _DEFAULT_UI_PATTERN
    return key, _UI_PATTERN_CSS[key]


def _prepare_export_context():
    pages = _page_service.list_pages()
    slug_map = {p.slug: _slug_to_filename(p.slug) for p in pages}
    ui_pattern_key, pattern_css_name = _resolve_ui_pattern()
    ui_pattern_class = ui_pattern_key.replace("_", "-")

    web_dir = get_web_dir()
    style_path = web_dir / "static" / "css" / "style.css"
    pattern_path = web_dir / "static" / "css" / pattern_css_name
    style_css = style_path.read_text(encoding="utf-8") if style_path.exists() else ""
    pattern_css = pattern_path.read_text(encoding="utf-8") if pattern_path.exists() else ""
    return pages, slug_map, ui_pattern_class, style_css, pattern_css


def _slug_to_filename(slug: str) -> str:
    raw_parts = PurePosixPath(str(slug or "").strip("/")).parts
    cleaned: list[str] = []
    for part in raw_parts:
        if not part or part in (".", ".."):
            continue
        p = _INVALID_FILE_PART.sub("_", part).rstrip(" .")
        if p:
            cleaned.append(p)
    if not cleaned:
        cleaned = ["untitled"]
    return "/".join(cleaned) + ".html"


def _normalize_image_rel(raw: str) -> PurePosixPath | None:
    decoded = unquote(raw or "")
    path = PurePosixPath(decoded.lstrip("/"))
    if not path.parts:
        return None
    if ".." in path.parts:
        return None
    return path


def _rewrite_html_links_for_export(
    html: str, slug_map: dict[str, str], images_dir
) -> str:

    def _replace(m: re.Match) -> str:
        attr = m.group("attr")
        url = m.group("url")
        parsed = urlsplit(url)
        new_url = url

        if attr == "src" and parsed.path.startswith("/data/images/"):
            rel = _normalize_image_rel(parsed.path[len("/data/images/") :])
            if rel is not None:
                data_uri = _image_data_uri(images_dir, rel)
                if data_uri:
                    new_url = data_uri
        elif attr == "href" and parsed.path.startswith("/pages/"):
            slug = unquote(parsed.path[len("/pages/") :].strip("/"))
            if slug in slug_map:
                new_path = slug_map[slug]
                new_url = urlunsplit(("", "", new_path, parsed.query, parsed.fragment))

        quote_char = m.group(2)
        return f'{attr}={quote_char}{new_url}{quote_char}'

    return _ATTR_URL_PATTERN.sub(_replace, html)


def _image_data_uri(images_dir, rel: PurePosixPath) -> str | None:
    src = images_dir.joinpath(*rel.parts)
    if not src.exists() or not src.is_file():
        return None
    try:
        binary = src.read_bytes()
    except OSError:
        return None
    mime, _ = mimetypes.guess_type(src.name)
    if not mime:
        mime = "application/octet-stream"
    b64 = base64.b64encode(binary).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _build_page_html(
    title: str,
    slug: str,
    created: str,
    updated: str,
    body_html: str,
    ui_pattern_class: str,
    style_css: str,
    pattern_css: str,
) -> str:
    safe_title = escape(title)
    safe_slug = escape(slug)
    safe_created = escape(created or "")
    safe_updated = escape(updated or "")
    inline_css = (style_css + "\n" + pattern_css).replace("</style", "<\\/style")
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{safe_title}</title>
  <style>{inline_css}</style>
  <style>
    body {{ margin: 0; padding: 18px 14px 24px; }}
    .page-view {{ width: min(1180px, calc(100% - 16px)); margin: 0 auto; }}
    .export-meta {{
      margin-top: 12px;
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }}
  </style>
</head>
<body class="ui-pattern ui-pattern-{ui_pattern_class}">
  <article class="page-view">
    <div class="page-header">
      <h1>{safe_title}</h1>
    </div>
    <div class="page-body">{body_html}</div>
    <div class="export-meta">
      <span>Slug: {safe_slug}</span>
      <span>作成: {safe_created}</span>
      <span>更新: {safe_updated}</span>
    </div>
  </article>
  <script>
    (function () {{
      document.querySelectorAll(".page-body table").forEach(function (table) {{
        if (table.parentElement && table.parentElement.classList.contains("page-table-scroll")) return;
        var wrap = document.createElement("div");
        wrap.className = "page-table-scroll";
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }});
      document.querySelectorAll(".page-body").forEach(function (body) {{
        var hrs = body.querySelectorAll("hr");
        var total = hrs.length;
        if (!total) return;
        hrs.forEach(function (hr, idx) {{
          var width;
          if (total === 1 || idx === total - 1) {{
            width = 100;
          }} else {{
            width = 22 + (78 * idx) / (total - 1);
          }}
          hr.style.setProperty("--hr-accent-width", width.toFixed(1) + "%");
        }});
      }});
    }})();
  </script>
</body>
</html>
"""


def _build_index_html(
    pages: list,
    slug_map: dict[str, str],
    ui_pattern_class: str,
    style_css: str,
    pattern_css: str,
) -> str:
    list_items = []
    for page in pages:
        href = f"pages/{slug_map[page.slug]}"
        list_items.append(
            f'<li><a href="{href}">{escape(page.title)}</a>'
            f'<span class="meta">/{escape(page.slug)}</span></li>'
        )

    inline_css = (style_css + "\n" + pattern_css).replace("</style", "<\\/style")
    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ページHTMLエクスポート</title>
  <style>{inline_css}</style>
  <style>
    body {{ margin: 0; padding: 18px 14px 24px; }}
    .page-view {{ width: min(980px, calc(100% - 16px)); margin: 0 auto; }}
    .page-list {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }}
    .page-list li {{ padding: 8px 10px; border: 1px solid var(--glass-border); border-radius: 8px; background: var(--glass-bg); }}
    .meta {{ margin-left: 8px; color: var(--text-secondary); font-size: 12px; }}
  </style>
</head>
<body class="ui-pattern ui-pattern-{ui_pattern_class}">
  <article class="page-view">
    <div class="page-header"><h1>HTML エクスポート一覧</h1></div>
    <div class="page-body">
      <ul class="page-list">
        {"".join(list_items)}
      </ul>
    </div>
  </article>
</body>
</html>
"""


def _word_convert_script() -> str:
    return textwrap.dedent(
        """
        param(
          [Parameter(Mandatory=$true)][string]$Path
        )

        $word = $null
        try {
          $word = New-Object -ComObject Word.Application
          $word.Visible = $false
          $word.DisplayAlerts = 0

          $files = Get-ChildItem -Path $Path -Filter "*.html" -Recurse
          foreach ($file in $files) {
            $doc = $null
            try {
              $htmlPath = $file.FullName
              $docxPath = [System.IO.Path]::ChangeExtension($htmlPath, ".docx")
              $doc = $word.Documents.Open($htmlPath, $false, $true)
              $doc.SaveAs2([ref] $docxPath, [ref] 16)
            } finally {
              if ($doc -ne $null) {
                $doc.Close([ref] $false)
                [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
              }
            }
          }
        } finally {
          if ($word -ne $null) {
            $word.Quit()
            [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
          }
          [GC]::Collect()
          [GC]::WaitForPendingFinalizers()
        }
        """
    ).strip() + "\\n"
