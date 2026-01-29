# WikiSuite アーキテクチャ設計

本ドキュメントは CLAUDE.md（設計憲章）に基づく具体的な実装設計である。

---

## 1. モジュール構成

### 1.1 Common Context (`src/common/`)

```text
src/common/
├─ __init__.py
├─ paths.py        # パス解決（exe / 開発 両対応）
├─ config.py       # config/*.json 読み込み
└─ logger.py       # ログ設定・ロガー取得
```

**公開インターフェース**

```python
# paths.py
def get_base_dir() -> Path:
    """exe実行時: sys.executable の親ディレクトリ
       開発時: プロジェクトルート"""

def get_data_dir() -> Path       # base / "data"
def get_config_dir() -> Path     # base / "config"
def get_state_dir() -> Path      # base / "state"
def get_web_dir() -> Path        # base / "web"
def get_alert_ui_dir() -> Path   # base / "alert_ui"
def get_logs_dir() -> Path       # base / "logs"

# config.py
def load_config(name: str) -> dict:
    """config/{name}.json を読み込んで dict を返す"""

# logger.py
def get_logger(name: str) -> logging.Logger:
    """用途別ロガーを返す。logs/{name}.log に出力"""
```

### 1.2 Wiki Context (`src/wiki_app/`)

```text
src/wiki_app/
├─ __init__.py
├─ app.py          # Flask アプリケーション生成
├─ routes/
│  ├─ __init__.py
│  ├─ pages.py     # ページ CRUD
│  ├─ comments.py  # コメント CRUD
│  ├─ history.py   # 履歴（dulwich）
│  └─ search.py    # 全文検索
├─ services/
│  ├─ __init__.py
│  ├─ page_service.py     # ページ操作ビジネスロジック
│  ├─ comment_service.py  # コメント操作
│  ├─ repo_service.py     # dulwich Git 操作
│  └─ search_service.py   # 検索ロジック
└─ models/
   ├─ __init__.py
   └─ page.py      # Page データクラス（front matter 解析）
```

**公開インターフェース**

```python
# app.py
def create_app() -> Flask:
    """Flask アプリケーションを構築して返す"""
```

### 1.3 Watcher Context (`src/watcher/`)

```text
src/watcher/
├─ __init__.py
├─ scheduler.py    # 定期実行スケジューラ
├─ fetcher.py      # Webページ取得
├─ detector.py     # 差分検出
└─ event_writer.py # 変更イベントをファイル出力
```

**公開インターフェース**

```python
# scheduler.py
def start_watcher() -> None:
    """Watcher を開始する（ブロッキング、スレッドから呼ぶ）"""

def stop_watcher() -> None:
    """Watcher を停止する"""
```

### 1.4 Alert UI Context（利用側: `src/main.py` から起動）

```text
alert_ui/
├─ layout.json     # ウィンドウサイズ・位置・フォント・色の定義
├─ sound/
│  └─ alert.wav    # 通知音（差し替え可）
└─ icon/
   └─ alert.ico    # アイコン（差し替え可）
```

Alert UI は tkinter で実装する。レイアウト定義は `alert_ui/layout.json` から読み込み、Python コードに埋め込まない。

```python
# main.py 内、または src/common/alert.py
def show_alert(event: dict) -> None:
    """tkinter ウィンドウでアラートを表示する。
    layout.json からデザインを読み込む。"""
```

---

## 2. Flask ルート設計

### 2.1 ページ (`src/wiki_app/routes/pages.py`)

| Method | Path | 説明 |
|--------|------|------|
| GET | `/` | トップページ（ページ一覧） |
| GET | `/pages/<slug>` | ページ表示 |
| GET | `/pages/<slug>/edit` | 編集画面（EasyMDE） |
| POST | `/pages/<slug>/edit` | 編集保存 |
| GET | `/pages/new` | 新規作成画面 |
| POST | `/pages/new` | 新規作成保存 |
| POST | `/pages/<slug>/delete` | ページ削除 |
| GET | `/pages/<slug>/print` | 印刷用表示 |

### 2.2 コメント (`src/wiki_app/routes/comments.py`)

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/pages/<slug>/comments` | コメント一覧取得（JSON） |
| POST | `/api/pages/<slug>/comments` | コメント追加 |
| DELETE | `/api/pages/<slug>/comments/<id>` | コメント削除 |

### 2.3 履歴 (`src/wiki_app/routes/history.py`)

| Method | Path | 説明 |
|--------|------|------|
| GET | `/pages/<slug>/history` | 変更履歴一覧 |
| GET | `/pages/<slug>/history/<commit_id>` | 特定リビジョン表示 |
| GET | `/pages/<slug>/diff/<commit_a>/<commit_b>` | 差分表示 |
| POST | `/pages/<slug>/restore/<commit_id>` | リビジョン復元 |

### 2.4 検索 (`src/wiki_app/routes/search.py`)

| Method | Path | 説明 |
|--------|------|------|
| GET | `/search?q=<query>` | 全文検索 |

### 2.5 静的ファイル

Flask の `static_folder` を `web/static/` に設定し、CSS / JS / favicon / 画像を配信する。
テンプレートは `web/templates/` から読み込む。

---

## 3. Config JSON スキーマ

### 3.1 `config/app.json`

```json
{
  "host": "127.0.0.1",
  "port": 5000,
  "debug": false,
  "open_browser": true
}
```

| キー | 型 | 説明 |
|------|----|------|
| host | string | バインドアドレス |
| port | int | ポート番号 |
| debug | bool | Flask デバッグモード |
| open_browser | bool | 起動時にブラウザを自動で開くか |

### 3.2 `config/wiki.json`

```json
{
  "site_name": "社内Wiki",
  "default_page": "home",
  "markdown_extensions": ["tables", "fenced_code", "nl2br"]
}
```

| キー | 型 | 説明 |
|------|----|------|
| site_name | string | サイト名（タイトルバーに表示） |
| default_page | string | トップページのスラッグ |
| markdown_extensions | string[] | 有効にする Markdown 拡張 |

### 3.3 `config/watcher.json`

```json
{
  "interval_seconds": 300,
  "targets": [
    {
      "name": "Example Site",
      "url": "https://example.com/news",
      "selector": "#main-content",
      "detect_mode": "text_change",
      "ignore_patterns": []
    }
  ]
}
```

| キー | 型 | 説明 |
|------|----|------|
| interval_seconds | int | 監視間隔（秒） |
| targets | array | 監視対象リスト |
| targets[].name | string | 対象の表示名 |
| targets[].url | string | 監視URL |
| targets[].selector | string | 監視範囲のCSSセレクタ |
| targets[].detect_mode | string | 検出モード（`text_change` / `element_added` / `keyword`） |
| targets[].ignore_patterns | string[] | 無視するテキストパターン（正規表現） |

### 3.4 `config/alert.json`

```json
{
  "duration_seconds": 30,
  "play_sound": true,
  "sound_file": "alert_ui/sound/alert.wav",
  "topmost": true
}
```

| キー | 型 | 説明 |
|------|----|------|
| duration_seconds | int | アラート自動閉じまでの秒数（0=手動閉じ） |
| play_sound | bool | 通知音を鳴らすか |
| sound_file | string | 通知音ファイルパス（base_dir からの相対） |
| topmost | bool | 最前面に表示するか |

---

## 4. データモデル

### 4.1 ページ（Markdown + YAML front matter）

ファイルパス: `data/pages/{slug}.md`

```markdown
---
title: ページタイトル
created: "2025-01-01T00:00:00"
updated: "2025-01-15T12:00:00"
tags:
  - 業務
  - マニュアル
---

# ページ本文

Markdown でコンテンツを記述。HTML タグも直接利用可能。

<details>
<summary>折りたたみ</summary>
詳細内容
</details>
```

**解析**: `python-frontmatter` ライブラリで YAML ヘッダと本文を分離する。

### 4.2 コメント（JSON）

ファイルパス: `data/comments/{slug}.json`

```json
[
  {
    "id": "c001",
    "author": "名前なし",
    "body": "コメント本文",
    "created": "2025-01-10T09:30:00"
  }
]
```

コメントIDは UUID4 の先頭8文字を使用する。

### 4.3 Git リポジトリ（dulwich）

パス: `data/repo/`

dulwich で bare リポジトリとして管理する。ページの作成・編集・削除のたびに自動コミットする。
コミットメッセージはシステムが自動生成する（例: `"Edit: ページタイトル"`）。

### 4.4 Watcher スナップショット

パス: `state/watcher/snapshots/{target_name_hash}.txt`

前回取得したHTML（セレクタ抽出後のテキスト）を保存する。
ファイル名はターゲット名のSHA256先頭16文字。

### 4.5 Watcher イベント

パス: `state/watcher/events/`

変更検出時に以下の JSON ファイルを書き出す。Alert UI がポーリングで読み取り、表示後に削除する。

ファイル名: `{timestamp}_{target_name_hash}.json`

```json
{
  "target_name": "Example Site",
  "url": "https://example.com/news",
  "detected_at": "2025-01-15T14:30:00",
  "detect_mode": "text_change",
  "summary": "テキスト変更を検出しました"
}
```

### 4.6 Watcher インデックス

パス: `state/watcher/index.json`

```json
{
  "last_run": "2025-01-15T14:30:00",
  "targets": {
    "a1b2c3d4e5f6g7h8": {
      "name": "Example Site",
      "last_checked": "2025-01-15T14:30:00",
      "last_changed": "2025-01-10T08:00:00",
      "status": "ok"
    }
  }
}
```

---

## 5. Watcher → Alert 連携フロー

```text
┌─────────────┐    ┌──────────────┐    ┌──────────────────────┐
│  Scheduler  │───>│   Fetcher    │───>│     Detector         │
│  (定期実行)  │    │  (HTTP取得)   │    │ (前回スナップと比較)   │
└─────────────┘    └──────────────┘    └──────────┬───────────┘
                                                  │ 変更あり
                                                  ▼
                                       ┌──────────────────────┐
                                       │   EventWriter        │
                                       │ state/watcher/events/ │
                                       │ にJSONを書き出す       │
                                       └──────────────────────┘

--- ファイルシステムを境界として分離 ---

┌──────────────────────────────────────┐
│  Alert Poller（main.py 内スレッド）    │
│  state/watcher/events/ を定期監視     │
│  新規JSONを検出 → show_alert() 呼出   │
│  表示完了後にJSONを削除                │
└──────────────────────────────────────┘
```

**設計原則**:
- Watcher と Alert UI は直接呼び出しを行わない
- `state/watcher/events/` ディレクトリをメッセージキューとして使用する
- これにより Bounded Context の疎結合を維持する

---

## 6. Wiki エディタ統合（EasyMDE）

### 6.1 テンプレート構成

```text
web/
├─ templates/
│  ├─ base.html          # 共通レイアウト
│  ├─ page_list.html     # ページ一覧
│  ├─ page_view.html     # ページ表示
│  ├─ page_edit.html     # 編集画面（EasyMDE）
│  ├─ page_new.html      # 新規作成
│  ├─ page_history.html  # 履歴一覧
│  ├─ page_diff.html     # 差分表示
│  ├─ page_print.html    # 印刷用
│  └─ search.html        # 検索結果
├─ static/
│  ├─ css/
│  │  └─ style.css       # カスタムスタイル
│  ├─ js/
│  │  └─ app.js          # カスタムJS
│  ├─ vendor/
│  │  ├─ easymde.min.css
│  │  └─ easymde.min.js
│  ├─ favicon.ico
│  └─ images/
└─ (Flask template_folder / static_folder として設定)
```

### 6.2 EasyMDE 設定

`page_edit.html` 内でEasyMDEを初期化する。設定はHTML/JS内に記述し、配布後に編集可能とする。

```html
<!-- web/templates/page_edit.html 内 -->
<textarea id="editor">{{ content }}</textarea>
<script>
var easyMDE = new EasyMDE({
    element: document.getElementById('editor'),
    spellChecker: false,
    renderingConfig: {
        sanitize: false  // HTMLタグを許可
    },
    toolbar: [
        "bold", "italic", "heading", "|",
        "unordered-list", "ordered-list", "|",
        "link", "image", "table", "|",
        "preview", "side-by-side", "fullscreen", "|",
        "guide"
    ]
});
</script>
```

### 6.3 Markdown → HTML レンダリング

サーバーサイドで `markdown` ライブラリを使用してHTMLに変換する。
`sanitize=False` とし、HTMLタグをそのまま描画する。

```python
import markdown

def render_markdown(text: str, extensions: list[str]) -> str:
    return markdown.markdown(text, extensions=extensions)
```

---

## 7. dulwich 統合設計

### 7.1 リポジトリ操作（`src/wiki_app/services/repo_service.py`）

```python
class RepoService:
    def __init__(self, repo_path: Path):
        """リポジトリを開く。存在しなければ init する。"""

    def init(self) -> None:
        """data/repo/ に bare リポジトリを作成"""

    def commit(self, file_path: str, content: bytes, message: str) -> str:
        """ファイルを追加/更新してコミット。コミットIDを返す。"""

    def log(self, file_path: str, max_count: int = 50) -> list[dict]:
        """指定ファイルのコミット履歴を返す。
        各要素: {id, message, author, timestamp}"""

    def show(self, commit_id: str, file_path: str) -> bytes:
        """特定コミット時点のファイル内容を返す"""

    def diff(self, commit_a: str, commit_b: str, file_path: str) -> str:
        """2つのコミット間の差分を返す"""

    def restore(self, commit_id: str, file_path: str) -> bytes:
        """特定コミットの内容を取得（復元用）。
        呼び出し側が新たに commit() する。"""

    def delete(self, file_path: str, message: str) -> str:
        """ファイルを削除してコミット。コミットIDを返す。"""
```

### 7.2 ページ操作との統合

`PageService` がページの CRUD を行い、各操作で `RepoService` を呼ぶ。

```
PageService.create(slug, title, body)
  → data/pages/{slug}.md に書き込み
  → RepoService.commit("pages/{slug}.md", content, "Create: {title}")

PageService.update(slug, title, body)
  → data/pages/{slug}.md を上書き
  → RepoService.commit("pages/{slug}.md", content, "Edit: {title}")

PageService.delete(slug)
  → data/pages/{slug}.md を削除
  → RepoService.delete("pages/{slug}.md", "Delete: {title}")
```

---

## 8. PyInstaller ビルド設計

### 8.1 spec ファイル構成

```python
# wiki_suite.spec
a = Analysis(
    ['src/main.py'],
    pathex=[],
    datas=[
        ('config', 'config'),
        ('web', 'web'),
        ('alert_ui', 'alert_ui'),
    ],
    hiddenimports=[
        'dulwich', 'flask', 'markdown',
        'frontmatter', 'bs4', 'requests',
    ],
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz, a.scripts,
    name='WikiSuite',
    console=False,        # コンソールウィンドウ非表示
)

coll = COLLECT(
    exe, a.binaries, a.datas,
    name='WikiSuite',
)
```

### 8.2 配布ディレクトリ構成

```text
dist/WikiSuite/
├─ WikiSuite.exe          # 実行ファイル
├─ _internal/             # PyInstaller ランタイム
├─ config/                # 設定ファイル（編集可）
│  ├─ app.json
│  ├─ wiki.json
│  ├─ watcher.json
│  └─ alert.json
├─ web/                   # テンプレート・静的ファイル（編集可）
│  ├─ templates/
│  └─ static/
├─ alert_ui/              # アラートデザイン（編集可）
│  ├─ layout.json
│  ├─ sound/
│  └─ icon/
├─ data/                  # Wikiデータ（自動生成）
│  ├─ pages/
│  ├─ comments/
│  └─ repo/
├─ state/                 # 実行時状態（自動生成）
│  └─ watcher/
│     ├─ snapshots/
│     ├─ events/
│     └─ index.json
└─ logs/                  # ログ（自動生成）
   ├─ wiki.log
   ├─ watcher.log
   └─ alert.log
```

### 8.3 パス解決の分岐

```python
# src/common/paths.py
import sys
from pathlib import Path

def get_base_dir() -> Path:
    if getattr(sys, 'frozen', False):
        # PyInstaller exe 実行時
        return Path(sys.executable).parent
    else:
        # 開発時: src/common/paths.py → src/common/ → src/ → project root
        return Path(__file__).resolve().parent.parent.parent
```

`data/`, `state/`, `logs/` は起動時に存在しなければ自動作成する。

---

## 9. 依存ライブラリ一覧

| ライブラリ | 用途 | Context |
|-----------|------|---------|
| flask | Web フレームワーク | Wiki |
| markdown | Markdown → HTML 変換 | Wiki |
| python-frontmatter | YAML front matter 解析 | Wiki |
| dulwich | Git 操作（pure Python） | Wiki |
| requests | HTTP 取得 | Watcher |
| beautifulsoup4 | HTML パース・セレクタ抽出 | Watcher |
| pyinstaller | exe ビルド | ビルド |

tkinter は Python 標準ライブラリのため追加不要。

---

## 10. 起動シーケンス

```text
main.py 起動
  │
  ├─ 1. paths.get_base_dir() でベースパス確定
  ├─ 2. data/, state/, logs/ ディレクトリ自動作成
  ├─ 3. config/*.json 読み込み
  ├─ 4. ロガー初期化
  │
  ├─ 5. Watcher スレッド起動
  │     └─ scheduler.start_watcher()
  │
  ├─ 6. Alert Poller スレッド起動
  │     └─ state/watcher/events/ を定期監視
  │
  ├─ 7. ブラウザ自動起動（config.open_browser が true の場合）
  │
  └─ 8. Flask サーバ起動（メインスレッド）
        └─ wiki_app.create_app().run()
```
