#!/usr/bin/env python3
"""Build a release zip with editable assets next to the exe.

- Python code is frozen into the exe via PyInstaller.
- Editable assets (web/config/alert_ui/data) are copied next to the exe.
- A zip is created so users can unzip and run immediately.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

APP_NAME = "LF リンローマニュアル"
ASSET_DIRS = ("web", "config", "alert_ui", "data")


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def copy_assets(repo_root: Path, app_dir: Path) -> None:
    for name in ASSET_DIRS:
        src = repo_root / name
        if not src.exists():
            continue
        dest = app_dir / name
        if src.is_dir():
            shutil.copytree(src, dest, dirs_exist_ok=True)
        else:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)


def build_release(repo_root: Path, skip_build: bool, output_dir: Path) -> Path:
    spec = repo_root / "wiki_suite.spec"
    dist_dir = repo_root / "dist"
    app_dir = dist_dir / APP_NAME

    if not skip_build:
        if not spec.exists():
            raise FileNotFoundError(f"spec not found: {spec}")
        run([sys.executable, "-m", "PyInstaller", str(spec)])

    if not app_dir.exists():
        raise FileNotFoundError(f"dist app directory not found: {app_dir}")

    copy_assets(repo_root, app_dir)

    zip_base = output_dir / f"{APP_NAME}_release"
    if zip_base.with_suffix(".zip").exists():
        zip_base.with_suffix(".zip").unlink()

    return Path(
        shutil.make_archive(str(zip_base), "zip", root_dir=dist_dir, base_dir=APP_NAME)
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Skip PyInstaller build and only copy assets + zip.",
    )
    parser.add_argument(
        "--output-dir",
        default=".",
        help="Output directory for the release zip (default: repo root).",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    output_dir = Path(args.output_dir)
    if not output_dir.is_absolute():
        output_dir = repo_root / output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_path = build_release(repo_root, args.skip_build, output_dir)
    print(f"Release zip created: {zip_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
