import base64
import mimetypes
import os
import posixpath
import re
import shutil
import subprocess
import textwrap
from datetime import datetime
from html import escape
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit, urlunsplit

import markdown as md

from src.common.config import load_config
from src.common.logger import get_logger
from src.common.paths import get_base_dir, get_data_dir, get_web_dir

logger = get_logger("wiki")

_DEFAULT_UI_PATTERN = "latte_notebook"
_UI_PATTERN_CSS: dict[str, str] = {
    "latte_notebook": "pattern-latte-notebook.css",
    "city_pop_guide": "pattern-city-pop-guide.css",
    "midnight_console": "pattern-midnight-console.css",
    "robotic_slate": "pattern-robotic-slate.css",
}
_ATTR_URL_PATTERN = re.compile(r'(?P<attr>href|src)=("|\')(?P<url>[^"\']+)("|\')')
_INVALID_FILE_PART = re.compile(r'[<>:"/\\|?*\x00-\x1f]')


class BackupService:
    def __init__(self, page_service):
        self._page_service = page_service

    def refresh_latest_backup(self) -> Path:
        """最新版のみのバックアップを日付ディレクトリに再生成する。"""
        date_label = datetime.now().strftime("%Y-%m-%d")
        base_dir = get_base_dir()
        backup_dir = base_dir / f"バックアップ-{date_label}"
        staging_dir = base_dir / f".backup-staging-{date_label}"

        if staging_dir.exists():
            shutil.rmtree(staging_dir, ignore_errors=True)
        staging_dir.mkdir(parents=True, exist_ok=True)

        md_dir = staging_dir / "md"
        html_dir = staging_dir / "html"
        docs_dir = staging_dir / "docs"
        pdf_dir = staging_dir / "pdf"
        for directory in (md_dir, html_dir, docs_dir, pdf_dir):
            directory.mkdir(parents=True, exist_ok=True)

        self._export_markdown(md_dir)
        self._export_html(html_dir)
        (html_dir / "html2docs.ps1").write_text(
            self._html_to_docs_script(),
            encoding="utf-8",
        )
        self._export_docs_and_pdf(html_dir, docs_dir, pdf_dir)

        if backup_dir.exists():
            shutil.rmtree(backup_dir, ignore_errors=True)
        staging_dir.rename(backup_dir)

        logger.info("最新版バックアップ更新: %s", backup_dir)
        return backup_dir

    def _export_markdown(self, md_dir: Path) -> None:
        pages_dir = get_data_dir() / "pages"
        if not pages_dir.exists():
            return
        shutil.copytree(pages_dir, md_dir, dirs_exist_ok=True)

    def _export_html(self, html_dir: Path) -> None:
        pages_dir = html_dir / "pages"
        pages_dir.mkdir(parents=True, exist_ok=True)

        pages = self._page_service.list_pages()
        slug_map = {page.slug: self._slug_to_filename(page.slug) for page in pages}
        ui_pattern_class, style_css, pattern_css = self._resolve_style_context()
        images_dir = get_data_dir() / "images"

        for page in pages:
            raw_html = self._render_markdown(page.body)
            body_html = self._rewrite_html_links(
                raw_html=raw_html,
                current_slug=page.slug,
                slug_map=slug_map,
                images_dir=images_dir,
            )
            html_doc = self._build_page_html(
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
            target.write_text(html_doc, encoding="utf-8")

        (html_dir / "index.html").write_text(
            self._build_index_html(
                pages=pages,
                slug_map=slug_map,
                ui_pattern_class=ui_pattern_class,
                style_css=style_css,
                pattern_css=pattern_css,
            ),
            encoding="utf-8",
        )

    def _resolve_style_context(self) -> tuple[str, str, str]:
        wiki_config = load_config("wiki")
        pattern_key = str(wiki_config.get("ui_pattern", _DEFAULT_UI_PATTERN))
        if pattern_key not in _UI_PATTERN_CSS:
            pattern_key = _DEFAULT_UI_PATTERN
        pattern_name = _UI_PATTERN_CSS[pattern_key]

        web_dir = get_web_dir()
        style_path = web_dir / "static" / "css" / "style.css"
        pattern_path = web_dir / "static" / "css" / pattern_name
        style_css = style_path.read_text(encoding="utf-8") if style_path.exists() else ""
        pattern_css = pattern_path.read_text(encoding="utf-8") if pattern_path.exists() else ""
        return pattern_key.replace("_", "-"), style_css, pattern_css

    def _render_markdown(self, text: str) -> str:
        try:
            # ページ閲覧時と同じレンダラーを優先利用
            from src.wiki_app.routes.pages import _render_md  # noqa: PLC0415

            return _render_md(text)
        except Exception:
            wiki_config = load_config("wiki")
            extensions = wiki_config.get("markdown_extensions", [])
            return md.markdown(text, extensions=extensions)

    def _slug_to_filename(self, slug: str) -> str:
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

    def _normalize_image_rel(self, raw: str) -> PurePosixPath | None:
        decoded = unquote(raw or "")
        path = PurePosixPath(decoded.lstrip("/"))
        if not path.parts or ".." in path.parts:
            return None
        return path

    def _image_data_uri(self, images_dir: Path, rel: PurePosixPath) -> str | None:
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

    def _rewrite_html_links(
        self,
        raw_html: str,
        current_slug: str,
        slug_map: dict[str, str],
        images_dir: Path,
    ) -> str:
        current_rel = PurePosixPath(slug_map.get(current_slug, ""))
        current_parent = str(current_rel.parent).strip(".")

        def _replace(match: re.Match) -> str:
            attr = match.group("attr")
            url = match.group("url")
            parsed = urlsplit(url)
            new_url = url

            if attr == "src" and parsed.path.startswith("/data/images/"):
                rel = self._normalize_image_rel(parsed.path[len("/data/images/") :])
                if rel is not None:
                    data_uri = self._image_data_uri(images_dir, rel)
                    if data_uri:
                        new_url = data_uri
            elif attr == "href" and parsed.path.startswith("/pages/"):
                slug = unquote(parsed.path[len("/pages/") :].strip("/"))
                target = slug_map.get(slug)
                if target:
                    base = current_parent or "."
                    rel_path = posixpath.relpath(target, base)
                    new_url = urlunsplit(("", "", rel_path, parsed.query, parsed.fragment))

            quote_char = match.group(2)
            return f'{attr}={quote_char}{new_url}{quote_char}'

        return _ATTR_URL_PATTERN.sub(_replace, raw_html)

    def _build_page_html(
        self,
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
        self,
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
  <title>バックアップHTML一覧</title>
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
    <div class="page-header"><h1>バックアップHTML一覧</h1></div>
    <div class="page-body">
      <ul class="page-list">
        {"".join(list_items)}
      </ul>
    </div>
  </article>
</body>
</html>
"""

    def _export_docs_and_pdf(self, html_dir: Path, docs_dir: Path, pdf_dir: Path) -> None:
        if os.name != "nt":
            self._write_conversion_note(
                docs_dir,
                "docx生成はWindows + Word環境で html/html2docs.ps1 を実行してください。",
            )
            self._write_conversion_note(
                pdf_dir,
                "pdf生成はWindows + Word環境で html/html2docs.ps1 を実行してください。",
            )
            return

        powershell = shutil.which("powershell") or shutil.which("powershell.exe")
        if not powershell:
            self._write_conversion_note(docs_dir, "PowerShellが見つからないためdocx生成をスキップしました。")
            self._write_conversion_note(pdf_dir, "PowerShellが見つからないためpdf生成をスキップしました。")
            return

        script_path = html_dir / "html2docs.ps1"
        html_pages = html_dir / "pages"
        proc = subprocess.run(
            [
                powershell,
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(script_path),
                "-Path",
                str(html_pages),
                "-DocxOut",
                str(docs_dir),
                "-PdfOut",
                str(pdf_dir),
            ],
            capture_output=True,
            text=True,
            timeout=900,
        )
        if proc.returncode != 0:
            msg = (proc.stderr or proc.stdout or "").strip()
            if not msg:
                msg = "Word変換に失敗しました。"
            self._write_conversion_note(docs_dir, msg)
            self._write_conversion_note(pdf_dir, msg)
            logger.warning("バックアップ用Word/PDF変換失敗: %s", msg)

    def _write_conversion_note(self, directory: Path, message: str) -> None:
        directory.mkdir(parents=True, exist_ok=True)
        (directory / "README.txt").write_text(message + "\n", encoding="utf-8")

    def _html_to_docs_script(self) -> str:
        return textwrap.dedent(
            """
            param(
              [Parameter(Mandatory=$true)][string]$Path,
              [string]$DocxOut = (Join-Path $PSScriptRoot "..\\docs"),
              [string]$PdfOut = (Join-Path $PSScriptRoot "..\\pdf")
            )

            $word = $null
            try {
              New-Item -ItemType Directory -Force -Path $DocxOut | Out-Null
              New-Item -ItemType Directory -Force -Path $PdfOut | Out-Null

              $inputRoot = [System.IO.Path]::GetFullPath($Path).TrimEnd('\\','/')
              $word = New-Object -ComObject Word.Application
              $word.Visible = $false
              $word.DisplayAlerts = 0

              $files = Get-ChildItem -Path $inputRoot -Filter "*.html" -Recurse
              foreach ($file in $files) {
                $full = [System.IO.Path]::GetFullPath($file.FullName)
                $relative = $full.Substring($inputRoot.Length).TrimStart('\\','/')
                $docxPath = Join-Path $DocxOut ([System.IO.Path]::ChangeExtension($relative, ".docx"))
                $pdfPath = Join-Path $PdfOut ([System.IO.Path]::ChangeExtension($relative, ".pdf"))

                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $docxPath) | Out-Null
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pdfPath) | Out-Null

                $doc = $null
                try {
                  $doc = $word.Documents.Open($full, $false, $true)
                  $doc.SaveAs2([ref] $docxPath, [ref] 16)
                  $doc.ExportAsFixedFormat($pdfPath, 17)
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
        ).strip() + "\n"
