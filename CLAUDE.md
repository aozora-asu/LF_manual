# CLAUDE.md

## 社内Wiki＋Web監視アプリ（Python / Windows配布）開発ガイド

本ドキュメントは **AIエージェント（Claude等）と協働しながら段階的に実装を進めるための設計憲章** である。  
要件・制約・設計原則・Bounded Context を明確にし、  
**途中で人が入れ替わっても、AIが読めば続きを正しく実装できる状態** を目指す。

---

## 1. アプリケーション概要（What / Why）

### 1.1 目的

- 1台の共有Windows PCのみで利用する **社内Wiki** を構築する
- Pythonやランタイム、パッケージを **配布先に一切インストールさせない**
- Wiki起動と同時に **Webサイト監視機能** を常駐起動する
- Webサイトに特定の変更があった場合、**Windows画面にアラートを表示**する
- 配布後も以下を **非エンジニアが編集可能** にする
  - Wikiの見た目（HTML / CSS / JS / favicon）
  - Web監視対象・検知条件
  - Windowsアラートウィンドウのデザイン(HTMLではない)

### 1.2 非目的（スコープ外）

- クラウド同期
- マルチユーザー / 認証 / 権限管理
- スマートフォン対応
- 外部APIやSaaS連携

---

## 2. 技術的前提・制約（Hard Constraints）

### 2.1 配布環境

- OS: Windows
- Python / pip / Node / npm 等は **一切インストール不可**
- exe + フォルダ配布のみ許可

### 2.2 開発環境

- Python 3.x
- PyInstaller（`--onedir` 必須）
- ローカルHTTPサーバ（Flask想定）

### 2.3 編集可能ポリシー

| 種別                | 配布後編集 |
| ------------------- | ---------- |
| Pythonコード        | 不可       |
| HTML / CSS / JS     | 可         |
| favicon / 画像 / 音 | 可         |
| config JSON         | 可         |
| data / state        | 可         |

---

## 3. 全体アーキテクチャ（Logical View）

```text
┌──────────────────────────┐
│ WikiSuite.exe            │
│（Pythonランタイム同梱）  　　│
└──────────┬───────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ main.py (Launcher)                  │
│ - 実行パス解決                   　　　│
│ - Wikiサーバ起動　　　　　　　　　　　　　│
│ - Watcher起動（スレッド/子Process） 　　│
└──────────┬───────────────┬────────-─┘
           │               │
           ▼               ▼
┌─────────────────┐   ┌─────────────────┐
│ Wiki Context    │   │ Watcher Context │
│（HTTP / Repo）   │   │（Fetch / Detect）│
└─────────────────┘   └─────────────────┘
           │               │
           ▼               ▼
      web/ , data/     config/ , state/
```

---

## 4. Bounded Context 設計（DDD）

### 4.1 Wiki Context

**責務**

- ページ作成 / 編集 / 削除
- コメント管理
- 検索
- 印刷用表示
- 履歴管理（Git的挙動）

**関心外**

- Web監視
- アラートUI制御

**主要データ**

- `data/pages/`
- `data/comments/`
- `data/repo/`

---

### 4.2 Watcher Context

**責務**

- Webページの定期取得
- 差分検出
- 変更イベント生成

**関心外**

- Wiki表示
- UIデザイン

**主要データ**

- `state/watcher/snapshots/`
- `state/watcher/index.json`

---

### 4.3 Alert UI Context

**責務**

- Windows画面への通知表示
- アラートの見た目 / 音 / 自動閉じ制御

**重要ルール**

- PythonコードにUI内容を埋め込まない
- HTML / CSS / JS をそのまま読み込んで表示する

---

### 4.4 Common Context

**責務**

- パス解決（開発時 / exe実行時両対応）
- config 読み込み
- logging

---

## 5. ディレクトリ構成（正）

```text
wiki_suite/
├─ src/
│  ├─ main.py
│  ├─ wiki_app/
│  ├─ watcher/
│  └─ common/
├─ config/
├─ web/
├─ alert_ui/
├─ data/
├─ state/
├─ logs/
└─ dist/WikiSuite/
```

※ AIエージェントは **この構成を変更・再設計してはならない**

---

## 6. 実装ルール（AI厳守）

### 6.1 パス・I/O

- `sys.executable` を基準に相対パス解決
- CWD依存禁止
- 絶対パス直書き禁止

### 6.2 UI関連

- HTML / CSS / JS をPython内に埋め込まない
- テンプレートは毎回ファイルから読み込む
- favicon / CSS / JS は static 配信のみ

### 6.3 設定

- 設定値はすべて `config/*.json`
- URLや監視条件をコードに直書き禁止

### 6.4 ログ

- print禁止
- `logs/*.log` に用途別出力

### 6.5 並行処理

- WikiとWatcherは疎結合
- 共有状態は `state/` を介す
- グローバル変数共有禁止

---

## 7. AIエージェント開発フロー（推奨）

### Phase 1

- パス解決
- config loader
- logging

### Phase 2

- Wiki最小起動
- HTML反映確認

### Phase 3

- Web監視
- 差分検出

### Phase 4

- アラートUI表示

### Phase 5

- exe化検証

---

## 8. AIに投げるときの基本プロンプト

```text
このプロジェクトは CLAUDE.md に従って実装してください。
Bounded Context を跨ぐ責務を混在させないでください。
HTML/CSS/JS は外部ファイルとして扱い、Pythonに埋め込まないでください。
パス解決は exe 実行を前提にしてください。
```

---

## 9. 最終ゴール

- フォルダをコピーするだけで社内Wiki＋監視が起動する
- HTMLを編集できる人なら見た目を自由に変更できる
- AIが途中参加しても破綻しない構造

---

## 10. 原則

この CLAUDE.md は設計上の **憲法** である。  
AIは **効率より整合性・保守性・継続性** を最優先せよ。
