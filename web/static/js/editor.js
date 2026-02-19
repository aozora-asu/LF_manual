/* LF リンローマニュアル WYSIWYG エディタ - 編集可能 */

(function () {
  "use strict";

  /* ---- ツールバーアイコン (SVG) ---- */

  var ICONS = {
    bold: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2.5h5a3 3 0 010 6H4V2.5z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/><path d="M4 8.5h5.5a3 3 0 010 6H4V8.5z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/></svg>',
    italic:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14l4-12M5 14h4M7 2h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    strikethrough:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10.5 4.5c0-1.5-1.3-2.5-3-2.5S4.5 3 4.5 4.5c0 1 .6 1.8 1.5 2.2M5.5 11.5c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5c0-1-.6-1.8-1.5-2.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    h1: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 3v10M1.5 8h5.5M7 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="9.5" y="13" font-size="8" font-weight="bold" fill="currentColor">1</text></svg>',
    h2: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 3v10M1.5 8h5.5M7 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="9.5" y="13" font-size="8" font-weight="bold" fill="currentColor">2</text></svg>',
    h3: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 3v10M1.5 8h5.5M7 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="9.5" y="13" font-size="8" font-weight="bold" fill="currentColor">3</text></svg>',
    toggleP:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 4.5l3 3-3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 5h6M8 8h5M8 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    toggleH1:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.8 8l3-3v6l-3-3z" fill="currentColor"/><path d="M6.5 3v10M6.5 8h4.2M10.7 3v10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><text x="12.2" y="13" font-size="7.2" font-weight="700" fill="currentColor">1</text></svg>',
    toggleH2:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.8 8l3-3v6l-3-3z" fill="currentColor"/><path d="M6.5 3v10M6.5 8h4.2M10.7 3v10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><text x="12.2" y="13" font-size="7.2" font-weight="700" fill="currentColor">2</text></svg>',
    toggleH3:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.8 8l3-3v6l-3-3z" fill="currentColor"/><path d="M6.5 3v10M6.5 8h4.2M10.7 3v10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><text x="12.2" y="13" font-size="7.2" font-weight="700" fill="currentColor">3</text></svg>',
    paragraph:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 13.5V2.5h2m0 11V2.5m0 0h2.5M6.5 2.5a3.5 3.5 0 100 7h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ul: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="4" r="1.2" fill="currentColor"/><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    ol: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><text x="1.5" y="5.5" font-size="5.5" font-weight="bold" fill="currentColor">1</text><text x="1.5" y="9.5" font-size="5.5" font-weight="bold" fill="currentColor">2</text><text x="1.5" y="13.5" font-size="5.5" font-weight="bold" fill="currentColor">3</text><path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    blockquote:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3v10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/><path d="M6.5 5h7M6.5 8h5M6.5 11h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    code: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 4L1.5 8 5 12M11 4l3.5 4L11 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    codeblock:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M5 6L3 8l2 2M11 6l2 2-2 2M7.5 5.5l1 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    link: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    image:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="5" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11l3-3 2.5 2.5L10 7.5l4.5 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    table:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 6h13M1.5 10h13M6 6v8M10.5 6v8" stroke="currentColor" stroke-width="1.2"/></svg>',
    hr: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    textColor:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 12L8 2.5 12.5 12M5 9h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><rect class="tb-color-bar" x="2" y="13.5" width="12" height="2" rx="0.5" fill="currentColor"/></svg>',
    highlight:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect class="tb-highlight-bar" x="1" y="13" width="14" height="2.5" rx="0.5" fill="#fef08a"/><path d="M10.5 2.5l3 3-7 7H3.5v-3l7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    noteInfo:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#3b82f6" stroke-width="1.3"/><path d="M8 7v4.5M8 5v.5" stroke="#3b82f6" stroke-width="1.6" stroke-linecap="round"/></svg>',
    noteWarn:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L1 14h14L8 1.5z" stroke="#d97706" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6v4M8 11.5v.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/></svg>',
    noteImportant:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#7c3aed" stroke-width="1.3"/><path d="M8 4.5v5M8 11v.5" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round"/></svg>',
    noteTip:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6.5" r="4.5" stroke="#059669" stroke-width="1.3"/><path d="M6 11v1.5a2 2 0 004 0V11" stroke="#059669" stroke-width="1.3"/><path d="M6 13.5h4" stroke="#059669" stroke-width="1.2" stroke-linecap="round"/></svg>',
    checkbox:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 8.5l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alignLeft:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6.5h8M2 10h10M2 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    alignCenter:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 6.5h8M3 10h10M5 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    alignRight:
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M6 6.5h8M4 10h10M8 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  };

  /* ---- ツールバー定義 ---- */

  var TOOLS = [
    { id: "paragraph", title: "本文", icon: "paragraph", block: "p" },
    "|",
    { id: "bold", title: "太字", icon: "bold", cmd: "bold" },
    { id: "italic", title: "斜体", icon: "italic", cmd: "italic" },
    {
      id: "strikethrough",
      title: "取り消し線",
      icon: "strikethrough",
      cmd: "strikeThrough",
    },
    "|",
    { id: "h1", title: "見出し1", icon: "h1", block: "h1" },
    { id: "h2", title: "見出し2", icon: "h2", block: "h2" },
    { id: "h3", title: "見出し3", icon: "h3", block: "h3" },
    "|",
    {
      id: "toggleP",
      title: "トグル本文",
      icon: "toggleP",
      custom: "toggleP",
    },
    {
      id: "toggleH1",
      title: "トグル見出し1",
      icon: "toggleH1",
      custom: "toggleH1",
    },
    {
      id: "toggleH2",
      title: "トグル見出し2",
      icon: "toggleH2",
      custom: "toggleH2",
    },
    {
      id: "toggleH3",
      title: "トグル見出し3",
      icon: "toggleH3",
      custom: "toggleH3",
    },
    "|",
    {
      id: "ul",
      title: "箇条書きリスト",
      icon: "ul",
      cmd: "insertUnorderedList",
    },
    { id: "ol", title: "番号付きリスト", icon: "ol", cmd: "insertOrderedList" },
    {
      id: "checkbox",
      title: "チェックボックス",
      icon: "checkbox",
      custom: "checkbox",
    },
    "|",
    { id: "alignLeft", title: "左揃え", icon: "alignLeft", cmd: "justifyLeft" },
    {
      id: "alignCenter",
      title: "中央揃え",
      icon: "alignCenter",
      cmd: "justifyCenter",
    },
    {
      id: "alignRight",
      title: "右揃え",
      icon: "alignRight",
      cmd: "justifyRight",
    },
    "|",
    {
      id: "blockquote",
      title: "引用ブロック",
      icon: "blockquote",
      block: "blockquote",
    },
    { id: "code", title: "インラインコード", icon: "code", custom: "code" },
    {
      id: "codeblock",
      title: "コードブロック",
      icon: "codeblock",
      custom: "codeblock",
    },
    "|",
    {
      id: "textColor",
      title: "文字色",
      icon: "textColor",
      custom: "textColor",
    },
    {
      id: "highlight",
      title: "ハイライト",
      icon: "highlight",
      custom: "highlight",
    },
    "|",
    {
      id: "noteInfo",
      title: "ノート（情報）",
      icon: "noteInfo",
      custom: "noteInfo",
    },
    {
      id: "noteWarn",
      title: "ノート（警告）",
      icon: "noteWarn",
      custom: "noteWarn",
    },
    {
      id: "noteImportant",
      title: "ノート（重要）",
      icon: "noteImportant",
      custom: "noteImportant",
    },
    {
      id: "noteTip",
      title: "ノート（ヒント）",
      icon: "noteTip",
      custom: "noteTip",
    },
    "|",
    { id: "link", title: "リンク", icon: "link", custom: "link" },
    { id: "image", title: "画像", icon: "image", custom: "image" },
    { id: "table", title: "テーブル", icon: "table", custom: "table" },
    "|",
    { id: "hr", title: "水平線", icon: "hr", custom: "hr" },
  ];

  var TOOL_TIPS = {
    paragraph: "本文",
    bold: "太字",
    italic: "斜体",
    strikethrough: "取り消し線",
    h1: "見出し1",
    h2: "見出し2",
    h3: "見出し3",
    toggleP: "トグル本文",
    toggleH1: "トグル見出し1",
    toggleH2: "トグル見出し2",
    toggleH3: "トグル見出し3",
    ul: "箇条書きリスト",
    ol: "番号付きリスト",
    checkbox: "チェックボックス",
    alignLeft: "左揃え",
    alignCenter: "中央揃え",
    alignRight: "右揃え",
    blockquote: "引用ブロック",
    code: "インラインコード",
    codeblock: "コードブロック",
    textColor: "文字色を指定",
    highlight: "ハイライト",
    noteInfo: "ノートブロック（情報）",
    noteWarn: "ノートブロック（警告）",
    noteImportant: "ノートブロック（重要）",
    noteTip: "ノートブロック（ヒント）",
    link: "リンク",
    image: "画像",
    table: "テーブル",
    hr: "水平線",
  };

  /* ---- カラーパレット ---- */

  var TEXT_COLORS = [
    { label: "黒", value: "#1e293b" },
    { label: "赤", value: "#dc2626" },
    { label: "青", value: "#2563eb" },
    { label: "緑", value: "#16a34a" },
    { label: "紫", value: "#7c3aed" },
    { label: "オレンジ", value: "#ea580c" },
    { label: "ピンク", value: "#db2777" },
    { label: "グレー", value: "#6b7280" },
  ];

  var HIGHLIGHT_COLORS = [
    { label: "黄色", value: "#fef08a" },
    { label: "緑", value: "#bbf7d0" },
    { label: "青", value: "#bfdbfe" },
    { label: "ピンク", value: "#fecdd3" },
    { label: "紫", value: "#e9d5ff" },
    { label: "オレンジ", value: "#fed7aa" },
    { label: "なし", value: "" },
  ];

  /* ---- ノートタイプ定義 ---- */

  var NOTE_TYPES = {
    info: { label: "情報", mdTag: "NOTE" },
    warning: { label: "注意", mdTag: "WARNING" },
    important: { label: "重要", mdTag: "IMPORTANT" },
    tip: { label: "ヒント", mdTag: "TIP" },
  };

  var DEFAULT_IMAGE_ALT = "ファイルを読み込めませんでした";

  /* ---- エディタ初期化 ---- */

  window.initWysiwygEditor = function (textareaId, initialHtml) {
    var textarea = document.getElementById(textareaId);
    if (!textarea) return;

    textarea.style.display = "none";

    var currentTextColor = "#1e293b";
    var currentHighlightColor = "#fef08a";

    var editorWrap = document.createElement("div");
    editorWrap.className = "wysiwyg-editor";

    // ツールバー
    var toolbar = document.createElement("div");
    toolbar.className = "wysiwyg-toolbar";

    var textColorBtn = null;
    var highlightBtn = null;
    var toolButtons = {};

    TOOLS.forEach(function (tool) {
      if (tool === "|") {
        var sep = document.createElement("span");
        sep.className = "wysiwyg-toolbar-sep";
        toolbar.appendChild(sep);
        return;
      }

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wysiwyg-toolbar-btn";
      var tipText = TOOL_TIPS[tool.id] || tool.title;
      btn.title = tipText;
      btn.setAttribute("aria-label", tipText);
      btn.dataset.baseTip = tipText;
      btn.dataset.tip = tipText;
      btn.dataset.toolId = tool.id;

      if (tool.icon && ICONS[tool.icon]) {
        btn.innerHTML = ICONS[tool.icon];
      }

      if (tool.id === "textColor") textColorBtn = btn;
      if (tool.id === "highlight") highlightBtn = btn;
      toolButtons[tool.id] = btn;

      btn.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        execTool(tool, btn);
      });

      toolbar.appendChild(btn);
    });

    // contentEditable 本文エリア
    var editArea = document.createElement("div");
    editArea.className = "wysiwyg-content page-body";
    editArea.contentEditable = "true";
    editArea.innerHTML = initialHtml || "";

    if (!editArea.innerHTML.trim()) {
      editArea.innerHTML = "<p><br></p>";
    }

    editorWrap.appendChild(toolbar);
    editorWrap.appendChild(editArea);
    textarea.parentNode.insertBefore(editorWrap, textarea);

    // 既存ノートタイトルを編集不可にする
    makeNoteTitlesReadOnly(editArea);
    initTableEditing(editArea);
    initImageEditing(editArea);
    initQuoteEditing(editArea);
    initToggleEditing(editArea);
    normalizeIndentStyles(editArea);
    refreshHrAccent();

    // フォーム送信時にHTMLをMarkdownに変換
    var form = textarea.closest("form");
    if (form) {
      form.addEventListener("submit", function () {
        textarea.value = htmlToMarkdown(editArea.innerHTML);
      });
    }

    // ペースト: サニタイズ
    editArea.addEventListener("paste", function (e) {
      e.preventDefault();
      var html = e.clipboardData.getData("text/html");
      var text = e.clipboardData.getData("text/plain");
      if (html) {
        var cleaned = sanitizeHtml(html);
        document.execCommand("insertHTML", false, cleaned);
        makeNoteTitlesReadOnly(editArea);
        initTableEditing(editArea);
        initImageEditing(editArea);
        initQuoteEditing(editArea);
        initToggleEditing(editArea);
        normalizeIndentStyles(editArea);
        refreshHrAccent();
      } else if (text) {
        document.execCommand("insertText", false, text);
        initTableEditing(editArea);
        initImageEditing(editArea);
        initQuoteEditing(editArea);
        initToggleEditing(editArea);
        normalizeIndentStyles(editArea);
        refreshHrAccent();
      }
    });

    // 水平線の段階表示を編集時にも即時反映
    editArea.addEventListener("input", function () {
      initToggleEditing(editArea);
      refreshHrAccent();
    });

    // Backspace/Delete: ノート内の空行では、条件に応じてノート終了または削除
    // Backspace: ブロック先頭でインデントがあれば先にインデントを解除
    editArea.addEventListener("keydown", function (e) {
      if (e.key === "Delete" || e.key === "Backspace") {
        var sel0 = window.getSelection();
        if (!sel0.rangeCount || !sel0.isCollapsed) return;
        if (deleteEmptyToggleIfNeeded(sel0, editArea)) {
          e.preventDefault();
          return;
        }

        // ノート/引用は専用ハンドラを優先
        if (
          findAncestorByClass(sel0.anchorNode, editArea, "note-body") ||
          findAncestorByClass(sel0.anchorNode, editArea, "quote-body")
        ) {
          // noop
        } else {
          var block0 = sel0.anchorNode;
          while (block0 && block0 !== editArea && !isBlockElement(block0)) {
            block0 = block0.parentNode;
          }
          if (block0 && block0 !== editArea) {
            var level0 = getBlockIndentLevel(block0);
            // 空行では、前後行へ結合する前にまずインデントを1段戻す
            if (level0 > 0 && isVisuallyEmptyBlock(block0)) {
              e.preventDefault();
              setBlockIndentLevel(block0, level0 - 1);
              return;
            }
          }
        }
      }

      if (e.key === "Delete") {
        var sel = window.getSelection();
        if (!sel.rangeCount || !sel.isCollapsed) return;
        if (
          breakOutFromEmptyNoteLine(sel, editArea, e.key) ||
          breakOutFromEmptyQuoteLine(sel, editArea, e.key)
        ) {
          e.preventDefault();
          return;
        }
      }

      if (e.key === "Backspace") {
        var sel = window.getSelection();
        if (!sel.rangeCount || !sel.isCollapsed) return;

        // カーソルがブロック先頭にあるか判定
        var block = sel.anchorNode;
        while (block && block !== editArea && !isBlockElement(block)) {
          block = block.parentNode;
        }
        if (!block || block === editArea) return;

        var indentLevel = getBlockIndentLevel(block);
        if (indentLevel <= 0) return;

        // カーソルがブロックの一番先頭にあるかチェック
        var atStart = false;
        if (sel.anchorOffset === 0) {
          var firstText = getFirstTextNode(block);
          if (!firstText || firstText === sel.anchorNode) {
            atStart = true;
          }
        }

        if (atStart) {
          e.preventDefault();
          setBlockIndentLevel(block, indentLevel - 1);
          return;
        }
      }
    });

    // Enterキー制御
    editArea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        var sel = window.getSelection();
        if (!sel.rangeCount) return;

        var toggleSummaryText = findAncestorByClass(
          sel.anchorNode,
          editArea,
          "toggle-summary-text",
        );
        if (toggleSummaryText) {
          e.preventDefault();
          handleToggleSummaryEnter(toggleSummaryText, sel, editArea);
          return;
        }

        var noteBody = findAncestorByClass(
          sel.anchorNode,
          editArea,
          "note-body",
        );
        if (noteBody) {
          e.preventDefault();
          handleNoteBodyEnter(noteBody, sel, editArea);
          return;
        }

        var quoteBody = findAncestorByClass(
          sel.anchorNode,
          editArea,
          "quote-body",
        );
        if (quoteBody) {
          e.preventDefault();
          handleQuoteBodyEnter(quoteBody, sel, editArea);
          return;
        }

        var checkLabel = findAncestorByClass(
          sel.anchorNode,
          editArea,
          "check-item",
        );
        if (checkLabel) {
          e.preventDefault();
          handleCheckboxEnter(checkLabel, sel, editArea);
          return;
        }

        var activeLi = findAncestorTag(sel.anchorNode, editArea, "LI");
        if (activeLi) {
          // LI内はブラウザ標準に任せる（同種継続 → 空行で次Enterで本文へ）
          return;
        }

        var node = sel.anchorNode;
        while (node && node !== editArea) {
          if (node.nodeName === "PRE") return;
          node = node.parentNode;
        }

        // 現在のブロック要素を取得
        var block = null;
        if (sel.rangeCount > 0) {
          block = sel.anchorNode;
          while (block && block !== editArea && !isBlockElement(block)) {
            block = block.parentNode;
          }
          if (block === editArea) block = null;
        }

        // P以外のブロックで中身が空ならPに戻す
        if (block && block.nodeName !== "P") {
          var content = block.textContent || "";
          if (content.trim() === "") {
            e.preventDefault();
            var p = document.createElement("p");
            p.innerHTML = "<br>";
            block.parentNode.replaceChild(p, block);
            var range = document.createRange();
            range.setStart(p, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
          }
        }

        // 通常のEnter: ブラウザデフォルト（同じタグを継続）に任せる
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        var sel = window.getSelection();
        if (!sel.rangeCount) return;

        // LI内かチェック
        var li = null;
        var node = sel.anchorNode;
        while (node && node !== editArea) {
          if (node.nodeName === "LI") {
            li = node;
            break;
          }
          node = node.parentNode;
        }
        if (li) {
          if (e.shiftKey) {
            unindentListItem(li, sel);
          } else {
            indentListItem(li, sel);
          }
          return;
        }

        // LI以外: ブロック要素のmargin-leftで段下げ
        var block = sel.anchorNode;
        while (block && block !== editArea && !isBlockElement(block)) {
          block = block.parentNode;
        }
        if (block && block !== editArea) {
          if (e.shiftKey) {
            setBlockIndentLevel(block, getBlockIndentLevel(block) - 1);
          } else {
            setBlockIndentLevel(block, getBlockIndentLevel(block) + 1);
          }
        }
      }
    });

    /* ---- Markdown記法の自動変換 ---- */

    editArea.addEventListener("input", function () {
      var sel = window.getSelection();
      if (!sel.rangeCount || !sel.isCollapsed) return;

      var anchorNode = sel.anchorNode;
      if (!anchorNode || anchorNode.nodeType !== 3) return;

      var text = anchorNode.textContent;

      // 現在のブロック要素を取得
      var block = anchorNode.parentNode;
      while (block && block !== editArea && !isBlockElement(block)) {
        block = block.parentNode;
      }
      if (!block || block === editArea) return;
      // リスト内やPRE内では変換しない
      if (isInsideTag(block, editArea, ["LI", "PRE", "CODE"])) return;

      // テキストノードがブロックの最初のテキストかチェック
      var firstText = getFirstTextNode(block);
      if (firstText !== anchorNode) return;

      var converted = false;

      // # + スペース → H1〜H6
      var headingMatch = text.match(/^(#{1,6})[ \u3000\u00A0]/);
      if (headingMatch) {
        var level = headingMatch[1].length;
        var rest = text.substring(headingMatch[0].length);
        converted = convertBlock(block, "H" + level, rest, sel);
      }

      // [!NOTE] / [!WARNING] / [!IMPORTANT] / [!TIP] → ノート
      if (!converted) {
        var noteMatch = text
          .trim()
          .match(/^>?\s*\[!(NOTE|WARNING|IMPORTANT|TIP)\]\s*$/i);
        if (noteMatch) {
          converted = convertBlockToNote(block, noteMatch[1], sel);
        }
      }

      // [] / [ ] / [x]（先頭）または - [ ] / ・ [x] → チェックボックス行
      if (!converted) {
        var cbMatch = text.match(/^\[( |x|X)?\](?:[ \u3000\u00A0]+(.*))?$/);
        if (!cbMatch) {
          cbMatch = text.match(
            /^[-*・][ \u3000\u00A0]+\[( |x|X)?\](?:[ \u3000\u00A0]+(.*))?$/,
          );
        }
        if (cbMatch) {
          converted = convertBlockToCheckbox(
            block,
            cbMatch[2] || "",
            String(cbMatch[1] || "").toLowerCase() === "x",
            sel,
          );
        }
      }

      // - / * / ・ + スペース → 箇条書きリスト
      if (!converted) {
        var ulMatch = text.match(/^[-*・][ \u3000\u00A0](.*)$/);
        if (ulMatch) {
          converted = convertBlockToList(block, "UL", ulMatch[1] || "", sel);
        }
      }

      // 1. / 1) + スペース → 番号付きリスト
      if (!converted) {
        var olMatch = text.match(/^\d+[.)][ \u3000\u00A0](.*)$/);
        if (olMatch) {
          converted = convertBlockToList(block, "OL", olMatch[1] || "", sel);
        }
      }

      // > + スペース → 引用ブロック
      if (!converted) {
        var quoteMatch = text.match(/^>[ \u3000\u00A0](.*)$/);
        if (quoteMatch) {
          converted = convertBlockToQuote(block, quoteMatch[1] || "", sel);
        }
      }

      // ``` → コードブロック
      if (!converted && /^```[\w-]*$/.test(text.trim())) {
        block.innerHTML = "<pre><code>コードを入力</code></pre>";
        // PRE内のcodeにカーソルを移動
        var codeEl = block.querySelector("code");
        if (codeEl) {
          var range = document.createRange();
          range.selectNodeContents(codeEl);
          sel.removeAllRanges();
          sel.addRange(range);
        }
        // blockがP等ならPREに置き換える
        if (block.nodeName !== "PRE") {
          var pre = block.querySelector("pre");
          if (pre) {
            block.parentNode.replaceChild(pre, block);
            // 後続に空pを追加
            var newP = document.createElement("p");
            newP.innerHTML = "<br>";
            pre.parentNode.insertBefore(newP, pre.nextSibling);
          }
        }
        converted = true;
      }

      // --- → 水平線
      if (!converted && /^(---|\*\*\*|___)$/.test(text.trim())) {
        var hr = document.createElement("hr");
        var newP = document.createElement("p");
        newP.innerHTML = "<br>";
        block.parentNode.insertBefore(hr, block);
        block.parentNode.insertBefore(newP, block);
        block.parentNode.removeChild(block);
        var range = document.createRange();
        range.setStart(newP, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        converted = true;
      }

      if (!converted) {
        applyInlineMarkdownShortcut(anchorNode, sel, editArea);
      }
      refreshHrAccent();
      refreshDynamicToolTips();
    });

    editArea.addEventListener("keyup", function () {
      refreshDynamicToolTips();
    });
    editArea.addEventListener("mouseup", function () {
      setTimeout(refreshDynamicToolTips, 0);
    });
    document.addEventListener("selectionchange", function () {
      refreshDynamicToolTips();
    });

    function isBlockElement(el) {
      var blocks = [
        "P",
        "DIV",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "BLOCKQUOTE",
        "PRE",
        "LI",
        "UL",
        "OL",
      ];
      return blocks.indexOf(el.nodeName) !== -1;
    }

    function refreshHrAccent() {
      if (typeof window.initPageHrAccent === "function") {
        window.initPageHrAccent();
      }
    }

    function isInsideTag(el, root, tags) {
      var node = el;
      while (node && node !== root) {
        if (tags.indexOf(node.nodeName) !== -1) return true;
        node = node.parentNode;
      }
      return false;
    }

    function getBlockIndentLevel(block) {
      if (!block || !block.style) return 0;
      var attrLevel = getIndentLevelAttr(block);
      if (attrLevel > 0) return attrLevel;
      var raw = String(block.style.marginLeft || "").trim();
      if (!raw) return 0;
      var num = parseFloat(raw);
      if (!isFinite(num) || num <= 0) return 0;

      var stepPx = getIndentStepPx(block);
      if (raw.endsWith("ch")) {
        var zeroWidth = getZeroCharWidthPx(block);
        return Math.max(0, Math.round((num * zeroWidth) / stepPx));
      }
      if (raw.endsWith("em")) {
        var fontPx = parseFloat(window.getComputedStyle(block).fontSize) || 16;
        return Math.max(0, Math.round((num * fontPx) / stepPx));
      }
      if (raw.endsWith("px")) return Math.max(0, Math.round(num / stepPx));
      return Math.max(0, Math.round(num / stepPx));
    }

    function setBlockIndentLevel(block, level) {
      if (!block || !block.style) return;
      if (level <= 0) {
        block.style.marginLeft = "";
        block.removeAttribute("data-indent-level");
        return;
      }
      // Tab indent = 半角スペース2つ相当
      block.style.marginLeft =
        2 * Math.round(level * getIndentStepPx(block)) + "px";
      block.setAttribute("data-indent-level", String(level));
    }

    function getIndentLevelAttr(el) {
      if (!el || !el.getAttribute) return 0;
      var raw = (el.getAttribute("data-indent-level") || "").trim();
      if (!raw) return 0;
      var n = parseInt(raw, 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }

    function getIndentStepPx(block) {
      // 実フォントで「半角スペース2つ」の幅を使う
      var px = measureTextWidth(block, "  ");
      return px > 0 ? px : 16;
    }

    function getZeroCharWidthPx(block) {
      var px = measureTextWidth(block, "0");
      return px > 0 ? px : 8;
    }

    function measureTextWidth(block, text) {
      var probe = document.createElement("span");
      probe.textContent = text;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.style.whiteSpace = "pre";
      probe.style.padding = "0";
      probe.style.margin = "0";
      probe.style.border = "0";
      var cs = window.getComputedStyle(block);
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontSize = cs.fontSize;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.fontStyle = cs.fontStyle;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.style.textTransform = cs.textTransform;
      document.body.appendChild(probe);
      var width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    }

    function findAncestorTag(node, root, tagName) {
      var cur = node && node.nodeType === 3 ? node.parentNode : node;
      while (cur && cur !== root) {
        if (cur.nodeType === 1 && cur.nodeName === tagName) return cur;
        cur = cur.parentNode;
      }
      return null;
    }

    function findAncestorByClass(node, root, className) {
      var cur = node && node.nodeType === 3 ? node.parentNode : node;
      while (cur && cur !== root) {
        if (
          cur.nodeType === 1 &&
          cur.classList &&
          cur.classList.contains(className)
        ) {
          return cur;
        }
        cur = cur.parentNode;
      }
      return null;
    }

    function normalizeIndentStyles(root) {
      if (!root || !root.querySelectorAll) return;
      var nodes = root.querySelectorAll(
        "p,div,h1,h2,h3,h4,h5,h6,blockquote,pre",
      );
      nodes.forEach(function (el) {
        if (!el.style || !el.style.marginLeft) return;
        var level = getBlockIndentLevel(el);
        if (level <= 0) {
          el.style.marginLeft = "";
        } else {
          setBlockIndentLevel(el, level);
        }
      });
    }

    function isRangeAtStartOfNode(sel, node) {
      if (!sel.rangeCount) return false;
      var range = sel.getRangeAt(0);
      if (!node.contains(range.startContainer)) return false;
      var probe = range.cloneRange();
      probe.selectNodeContents(node);
      probe.setEnd(range.startContainer, range.startOffset);
      return probe.toString().length === 0;
    }

    function getDirectLineNode(node, container) {
      var cur = node && node.nodeType === 3 ? node.parentNode : node;
      while (cur && cur !== container) {
        if (cur.parentNode === container) return cur;
        cur = cur.parentNode;
      }
      return null;
    }

    function resolveCurrentStructuredLine(sel, body) {
      var line = getDirectLineNode(sel.anchorNode, body);
      if (line) return line;
      if (!sel.rangeCount) return null;
      var r = sel.getRangeAt(0);
      if (r.startContainer === body) {
        var idx = r.startOffset;
        return (
          body.childNodes[idx] ||
          body.childNodes[idx - 1] ||
          body.lastChild ||
          null
        );
      }
      return body.lastChild || null;
    }

    function ensureStructuredLineElement(body, lineNode) {
      if (lineNode && lineNode.nodeType === 1 && lineNode.parentNode === body) {
        return lineNode;
      }
      var p = document.createElement("p");
      var text = "";
      if (lineNode) text = lineNode.textContent || "";
      if (text.trim()) {
        p.textContent = text;
      } else {
        p.innerHTML = "<br>";
      }
      if (lineNode && lineNode.parentNode === body) {
        body.replaceChild(p, lineNode);
      } else if (body.firstChild) {
        body.insertBefore(p, body.firstChild);
      } else {
        body.appendChild(p);
      }
      return p;
    }

    function isVisuallyEmptyBlock(node) {
      if (!node) return false;
      var text = (node.textContent || "").replace(/\u200B/g, "").trim();
      if (text) return false;
      if (!node.querySelector) return true;
      var rich = node.querySelector("img,table,pre,code,ul,ol,blockquote");
      return !rich;
    }

    function structuredBodyHasAnyInput(body, ignoreLine) {
      if (!body) return false;
      var nodes = body.childNodes;
      for (var i = 0; i < nodes.length; i++) {
        var line = nodes[i];
        if (line === ignoreLine) continue;
        if (line.nodeType === 3) {
          if ((line.textContent || "").replace(/\u200B/g, "").trim())
            return true;
          continue;
        }
        if (line.nodeType === 1 && !isVisuallyEmptyBlock(line)) return true;
      }
      return false;
    }

    function replaceStructuredBlockWithParagraph(block, sel) {
      if (!block || !block.parentNode) return false;
      var p = document.createElement("p");
      p.innerHTML = "<br>";
      block.parentNode.replaceChild(p, block);
      moveCaretToBlockStart(p, sel);
      return true;
    }

    function breakOutFromEmptyStructuredLine(
      sel,
      root,
      key,
      bodyClass,
      containerClass,
    ) {
      var body = findAncestorByClass(sel.anchorNode, root, bodyClass);
      if (!body) return false;
      var container = findAncestorByClass(body, root, containerClass);
      if (!container || !container.parentNode) return false;

      var lineNode = resolveCurrentStructuredLine(sel, body);
      if (!lineNode) return false;
      // Delete は「空行ならどこにカーソルがあっても」ノート外へ出す。
      // Backspace は先頭時のみ動作させ、通常の削除操作を邪魔しない。
      if (key !== "Delete" && !isRangeAtStartOfNode(sel, lineNode))
        return false;
      if (!isVisuallyEmptyBlock(lineNode)) return false;

      // コンテナ全体が未入力ならコンテナ自体を削除して本文へ
      if (!structuredBodyHasAnyInput(body, lineNode)) {
        return replaceStructuredBlockWithParagraph(container, sel);
      }

      var p = document.createElement("p");
      p.innerHTML = "<br>";
      container.parentNode.insertBefore(p, container.nextSibling);

      if (lineNode.parentNode) {
        lineNode.parentNode.removeChild(lineNode);
      }
      if (!body.firstChild) {
        body.innerHTML = "<p><br></p>";
      }

      var range = document.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    }

    function breakOutFromEmptyNoteLine(sel, root, key) {
      return breakOutFromEmptyStructuredLine(
        sel,
        root,
        key,
        "note-body",
        "note",
      );
    }

    function breakOutFromEmptyQuoteLine(sel, root, key) {
      return breakOutFromEmptyStructuredLine(
        sel,
        root,
        key,
        "quote-body",
        "notion-quote",
      );
    }

    function handleStructuredBodyEnter(body, sel, root, containerClass) {
      var container = findAncestorByClass(body, root, containerClass);
      if (!container || !container.parentNode) return;

      var lineNode = resolveCurrentStructuredLine(sel, body);
      if (!lineNode) {
        var base = document.createElement("p");
        base.innerHTML = "<br>";
        body.appendChild(base);
        lineNode = base;
      }
      lineNode = ensureStructuredLineElement(body, lineNode);

      if (isVisuallyEmptyBlock(lineNode)) {
        // コンテナ全体が空のままならコンテナごと消す
        if (!structuredBodyHasAnyInput(body, lineNode)) {
          replaceStructuredBlockWithParagraph(container, sel);
          return;
        }

        var outside = document.createElement("p");
        outside.innerHTML = "<br>";
        container.parentNode.insertBefore(outside, container.nextSibling);

        if (lineNode.parentNode === body) {
          body.removeChild(lineNode);
        }
        if (!body.firstChild) {
          body.innerHTML = "<p><br></p>";
        }
        moveCaretToBlockStart(outside, sel);
        return;
      }

      var nextLine = document.createElement("p");
      nextLine.innerHTML = "<br>";
      body.insertBefore(nextLine, lineNode.nextSibling);
      moveCaretToBlockStart(nextLine, sel);
    }

    function handleNoteBodyEnter(noteBody, sel, root) {
      handleStructuredBodyEnter(noteBody, sel, root, "note");
    }

    function handleQuoteBodyEnter(quoteBody, sel, root) {
      handleStructuredBodyEnter(quoteBody, sel, root, "notion-quote");
    }

    function normalizeNoteType(kind) {
      var key = String(kind || "").toUpperCase();
      if (key === "NOTE") return "info";
      if (key === "WARNING") return "warning";
      if (key === "IMPORTANT") return "important";
      if (key === "TIP") return "tip";
      return "info";
    }

    function moveCaretToBlockStart(block, sel) {
      var target = getFirstTextNode(block);
      if (!target) {
        target = document.createTextNode("");
        block.appendChild(target);
      }
      var range = document.createRange();
      range.setStart(target, 0);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    function convertBlockToNote(block, kind, sel) {
      var noteType = normalizeNoteType(kind);
      var noteMeta = NOTE_TYPES[noteType] || NOTE_TYPES.info;
      var note = document.createElement("div");
      note.className = "note note-" + noteType;
      note.setAttribute("data-note-type", noteType);

      var title = document.createElement("div");
      title.className = "note-title";
      title.setAttribute("contenteditable", "false");
      title.textContent = noteMeta.label;
      note.appendChild(title);

      var body = document.createElement("div");
      body.className = "note-body";
      var p = document.createElement("p");
      p.innerHTML = "<br>";
      body.appendChild(p);
      note.appendChild(body);

      block.parentNode.replaceChild(note, block);
      moveCaretToBlockStart(p, sel);
      return true;
    }

    function convertBlockToCheckbox(block, content, checked, sel) {
      var p = document.createElement("p");
      var label = document.createElement("label");
      label.className = "check-item";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = !!checked;
      input.setAttribute("contenteditable", "false");
      input.tabIndex = -1;
      label.appendChild(input);
      var textWrap = document.createElement("span");
      textWrap.className = "check-text";
      textWrap.textContent = content || "";
      label.appendChild(document.createTextNode(" "));
      label.appendChild(textWrap);
      p.appendChild(label);
      block.parentNode.replaceChild(p, block);
      placeCaretInCheckText(textWrap, sel);
      return true;
    }

    function extractCheckboxText(label) {
      var text = "";
      if (!label) return "";
      for (var i = 0; i < label.childNodes.length; i++) {
        var node = label.childNodes[i];
        if (
          node.nodeType === 1 &&
          node.nodeName === "INPUT" &&
          (node.getAttribute("type") || "").toLowerCase() === "checkbox"
        ) {
          continue;
        }
        text += node.textContent || "";
      }
      return text.replace(/\u200B/g, "").trim();
    }

    function handleCheckboxEnter(label, sel, root) {
      var block =
        findAncestorTag(label, root, "P") || findAncestorTag(label, root, "LI");
      if (!block || !block.parentNode) return;
      var text = extractCheckboxText(label);

      if (!text) {
        var plain = document.createElement("p");
        plain.innerHTML = "<br>";
        block.parentNode.replaceChild(plain, block);
        moveCaretToBlockStart(plain, sel);
        return;
      }

      var newBlock = document.createElement(
        block.nodeName === "LI" ? "LI" : "P",
      );
      var newLabel = document.createElement("label");
      newLabel.className = "check-item";
      var newInput = document.createElement("input");
      newInput.type = "checkbox";
      newInput.setAttribute("contenteditable", "false");
      newInput.tabIndex = -1;
      newLabel.appendChild(newInput);
      newLabel.appendChild(document.createTextNode(" "));
      var textWrap = document.createElement("span");
      textWrap.className = "check-text";
      textWrap.appendChild(document.createTextNode("\u200B"));
      newLabel.appendChild(textWrap);
      newBlock.appendChild(newLabel);
      block.parentNode.insertBefore(newBlock, block.nextSibling);

      placeCaretInCheckText(textWrap, sel);
    }

    function placeCaretInCheckText(textWrap, sel) {
      if (!textWrap) return;
      var textNode = textWrap.firstChild;
      if (!textNode || textNode.nodeType !== 3) {
        textWrap.innerHTML = "";
        textNode = document.createTextNode("\u200B");
        textWrap.appendChild(textNode);
      } else if ((textNode.textContent || "").indexOf("\u200B") !== 0) {
        textNode.textContent = "\u200B" + (textNode.textContent || "");
      }

      function apply() {
        var range = document.createRange();
        range.setStart(textNode, 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      apply();
      setTimeout(apply, 0);
    }

    function getFirstTextNode(el) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var child = el.childNodes[i];
        if (child.nodeType === 3 && child.textContent.length > 0) return child;
        if (child.nodeType === 1) {
          var found = getFirstTextNode(child);
          if (found) return found;
        }
      }
      return null;
    }

    function convertBlock(block, newTag, content, sel) {
      var newEl = document.createElement(newTag);
      if (content) {
        newEl.textContent = content;
      } else {
        newEl.innerHTML = "<br>";
      }
      block.parentNode.replaceChild(newEl, block);

      function applyCaret() {
        var range = document.createRange();
        var textNode = getFirstTextNode(newEl);
        if (!textNode) {
          range.setStart(newEl, 0);
        } else {
          range.setStart(textNode, textNode.length);
        }
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        editArea.focus();
      }
      applyCaret();
      setTimeout(applyCaret, 0);
      return true;
    }

    function convertBlockToList(block, listTag, content, sel) {
      var list = document.createElement(listTag);
      var li = document.createElement("li");
      if (content) {
        li.textContent = content;
      } else {
        li.innerHTML = "<br>";
      }
      list.appendChild(li);
      block.parentNode.replaceChild(list, block);
      function applyCaret() {
        var range = document.createRange();
        var textNode = getFirstTextNode(li);
        if (!textNode) {
          range.setStart(li, 0);
        } else {
          range.setStart(textNode, textNode.length);
        }
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        editArea.focus();
      }
      applyCaret();
      setTimeout(applyCaret, 0);
      return true;
    }

    function convertBlockToQuote(block, content, sel) {
      var built = buildQuoteBlock(content);
      var quote = built.quote;
      var firstLine = built.firstLine;
      block.parentNode.replaceChild(quote, block);

      function applyCaret() {
        var range = document.createRange();
        var textNode = getFirstTextNode(firstLine);
        if (!textNode) {
          range.setStart(firstLine, 0);
        } else {
          range.setStart(textNode, textNode.length);
        }
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        editArea.focus();
      }
      applyCaret();
      setTimeout(applyCaret, 0);
      return true;
    }

    function buildQuoteBlock(content) {
      var quote = document.createElement("blockquote");
      quote.className = "notion-quote";
      quote.setAttribute("data-block-type", "quote");

      var inner = document.createElement("div");
      inner.className = "notion-quote-inner";

      var body = document.createElement("div");
      body.className = "quote-body";
      body.setAttribute("data-placeholder", "入力してください...");
      body.setAttribute("role", "textbox");
      body.setAttribute("aria-multiline", "true");
      body.setAttribute("aria-roledescription", "引用");

      setQuoteBodyFromText(body, content);

      inner.appendChild(body);
      quote.appendChild(inner);

      var tail = document.createElement("div");
      tail.className = "notion-quote-tail";
      quote.appendChild(tail);

      return {
        quote: quote,
        body: body,
        firstLine: body.firstElementChild || body,
      };
    }

    function setQuoteBodyFromText(body, text) {
      body.innerHTML = "";
      var lines = String(text || "")
        .replace(/\r\n/g, "\n")
        .split("\n");
      var hasInput = false;
      for (var i = 0; i < lines.length; i++) {
        var lineText = lines[i];
        var p = document.createElement("p");
        if (lineText && lineText.length) {
          p.textContent = lineText;
          hasInput = true;
        } else {
          p.innerHTML = "<br>";
        }
        body.appendChild(p);
      }
      if (!hasInput && !body.firstChild) {
        body.innerHTML = "<p><br></p>";
      }
    }

    function normalizeQuoteBody(body) {
      if (!body) return;
      var nodes = Array.prototype.slice.call(body.childNodes);
      if (!nodes.length) {
        body.innerHTML = "<p><br></p>";
        return;
      }
      var lines = [];
      nodes.forEach(function (node) {
        if (node.nodeType === 3) {
          if ((node.textContent || "").trim()) {
            var pText = document.createElement("p");
            pText.textContent = node.textContent;
            lines.push(pText);
          }
          return;
        }
        if (node.nodeType !== 1) return;
        if (node.nodeName === "P") {
          lines.push(node);
          return;
        }
        if (node.nodeName === "BR") {
          var pBr = document.createElement("p");
          pBr.innerHTML = "<br>";
          lines.push(pBr);
          return;
        }
        var p = document.createElement("p");
        if ((node.textContent || "").trim()) {
          p.innerHTML = node.innerHTML;
        } else {
          p.innerHTML = "<br>";
        }
        lines.push(p);
      });
      body.innerHTML = "";
      if (!lines.length) {
        body.innerHTML = "<p><br></p>";
        return;
      }
      lines.forEach(function (line) {
        body.appendChild(line);
      });
    }

    function initQuoteEditing(root) {
      if (!root) return;
      var blocks = root.querySelectorAll("blockquote");
      blocks.forEach(function (block) {
        if (block.classList.contains("notion-quote")) {
          var quoteBody = block.querySelector(".quote-body");
          if (!quoteBody) {
            var builtEmpty = buildQuoteBlock(block.textContent || "");
            block.replaceWith(builtEmpty.quote);
            return;
          }
          normalizeQuoteBody(quoteBody);
          return;
        }

        var lines = [];
        var children = Array.prototype.slice.call(block.childNodes);
        children.forEach(function (node) {
          if (node.nodeType === 3) {
            if ((node.textContent || "").trim())
              lines.push(node.textContent || "");
            return;
          }
          if (node.nodeType !== 1) return;
          if (node.nodeName === "P") {
            lines.push(node.textContent || "");
            return;
          }
          if (node.nodeName === "BR") {
            lines.push("");
            return;
          }
          if ((node.textContent || "").trim()) {
            lines.push(node.textContent || "");
          }
        });

        var built = buildQuoteBlock(lines.join("\n"));
        block.replaceWith(built.quote);
      });
    }

    function normalizeToggleLevel(raw) {
      var level = String(raw || "p").toLowerCase();
      if (level !== "h1" && level !== "h2" && level !== "h3" && level !== "p") {
        return "p";
      }
      return level;
    }

    function defaultToggleTitle(level) {
      if (level === "h1") return "見出し1トグル";
      if (level === "h2") return "見出し2トグル";
      if (level === "h3") return "見出し3トグル";
      return "トグル";
    }

    function applyToggleLevelClasses(details, level) {
      details.classList.remove("toggle-h1", "toggle-h2", "toggle-h3", "toggle-p");
      details.classList.add("toggle-" + level);
      details.setAttribute("data-toggle-level", level);
    }

    function getDirectSummary(details) {
      if (!details) return null;
      for (var i = 0; i < details.childNodes.length; i++) {
        var child = details.childNodes[i];
        if (child.nodeType === 1 && child.nodeName === "SUMMARY") return child;
      }
      return null;
    }

    function getDirectToggleBody(details) {
      if (!details) return null;
      for (var i = 0; i < details.childNodes.length; i++) {
        var child = details.childNodes[i];
        if (
          child.nodeType === 1 &&
          child.classList &&
          child.classList.contains("toggle-body")
        ) {
          return child;
        }
      }
      return null;
    }

    function ensureToggleSummary(details, level) {
      var summary = getDirectSummary(details);
      if (!summary) {
        summary = document.createElement("summary");
        details.insertBefore(summary, details.firstChild || null);
      }
      summary.setAttribute("contenteditable", "false");

      var title = summary.querySelector(".toggle-summary-text");
      if (!title) {
        var titleText = (summary.textContent || "").replace(/\u200B/g, "").trim();
        summary.innerHTML = "";
        title = document.createElement("span");
        title.className = "toggle-summary-text";
        title.setAttribute("contenteditable", "true");
        title.textContent = titleText || defaultToggleTitle(level);
        summary.appendChild(title);
      } else {
        title.setAttribute("contenteditable", "true");
      }

      if (!summary.dataset.toggleBind) {
        summary.addEventListener("click", function (e) {
          if (e.target && e.target.closest(".toggle-summary-text")) {
            e.preventDefault();
          }
        });
        summary.dataset.toggleBind = "1";
      }
      return summary;
    }

    function getToggleSummaryText(details) {
      var summary = getDirectSummary(details);
      if (!summary) return "";
      var title = summary.querySelector(".toggle-summary-text");
      var raw = title ? title.textContent || "" : summary.textContent || "";
      return raw.replace(/\u200B/g, "").trim();
    }

    function hasToggleBodyInput(details) {
      var body = getDirectToggleBody(details);
      if (!body) return false;
      return structuredBodyHasAnyInput(body, null);
    }

    function unwrapToggle(details, sel) {
      if (!details || !details.parentNode) return false;
      var parent = details.parentNode;
      var frag = document.createDocumentFragment();
      var body = getDirectToggleBody(details);
      var firstMoved = null;

      if (body) {
        while (body.firstChild) {
          var child = body.firstChild;
          if (!firstMoved && child.nodeType === 1) firstMoved = child;
          frag.appendChild(child);
        }
      } else {
        var summary = getDirectSummary(details);
        var moved = [];
        for (var i = 0; i < details.childNodes.length; i++) {
          var n = details.childNodes[i];
          if (n === summary) continue;
          moved.push(n);
        }
        moved.forEach(function (n) {
          if (!firstMoved && n.nodeType === 1) firstMoved = n;
          frag.appendChild(n);
        });
      }

      if (!frag.firstChild) {
        var p = document.createElement("p");
        p.innerHTML = "<br>";
        firstMoved = p;
        frag.appendChild(p);
      } else if (!firstMoved) {
        var firstNode = frag.firstChild;
        if (firstNode.nodeType === 3) {
          var wrap = document.createElement("p");
          wrap.textContent = firstNode.textContent || "";
          frag.replaceChild(wrap, firstNode);
          firstMoved = wrap;
        } else {
          firstMoved = firstNode;
        }
      }

      parent.insertBefore(frag, details);
      parent.removeChild(details);

      if (sel) {
        moveCaretToBlockStart(firstMoved, sel);
      }
      return true;
    }

    function normalizeToggleBody(body) {
      if (!body) return;
      if (!body.childNodes.length) {
        body.innerHTML = "<p><br></p>";
        return;
      }
      var hasContent = false;
      for (var i = 0; i < body.childNodes.length; i++) {
        var node = body.childNodes[i];
        if (node.nodeType === 3) {
          if ((node.textContent || "").replace(/\u200B/g, "").trim()) {
            hasContent = true;
            break;
          }
          continue;
        }
        if (node.nodeType !== 1) continue;
        if (!isVisuallyEmptyBlock(node)) {
          hasContent = true;
          break;
        }
      }
      if (!hasContent) {
        body.innerHTML = "<p><br></p>";
      }
    }

    function ensureToggleBody(details) {
      var body = getDirectToggleBody(details);
      if (!body) {
        body = document.createElement("div");
        body.className = "toggle-body";
        var nodesToMove = [];
        for (var i = 0; i < details.childNodes.length; i++) {
          var child = details.childNodes[i];
          if (child.nodeType === 1 && child.nodeName === "SUMMARY") continue;
          nodesToMove.push(child);
        }
        nodesToMove.forEach(function (node) {
          body.appendChild(node);
        });
        details.appendChild(body);
      }
      normalizeToggleBody(body);
      return body;
    }

    function initToggleEditing(root) {
      if (!root) return;
      var toggles = root.querySelectorAll("details, details.toggle-block");
      toggles.forEach(function (details) {
        if (!details || details.nodeName !== "DETAILS") return;
        details.classList.add("toggle-block");
        var level = normalizeToggleLevel(
          details.getAttribute("data-toggle-level") ||
            (details.classList.contains("toggle-h1")
              ? "h1"
              : details.classList.contains("toggle-h2")
                ? "h2"
                : details.classList.contains("toggle-h3")
                  ? "h3"
                  : details.classList.contains("toggle-p")
                    ? "p"
                    : "p"),
        );
        applyToggleLevelClasses(details, level);
        var summary = ensureToggleSummary(details, level);
        var body = ensureToggleBody(details);

        // summary が消された（空になった）場合は toggle を解除して中身を外へ出す
        if (!summary || !getToggleSummaryText(details)) {
          unwrapToggle(details, null);
          return;
        }
        normalizeToggleBody(body);
      });
    }

    function handleToggleSummaryEnter(summaryText, sel, root) {
      var details = findAncestorTag(summaryText, root, "DETAILS");
      if (!details) return;
      var body = ensureToggleBody(details);
      details.open = true;
      var firstLine = body.firstElementChild;
      if (!firstLine) {
        firstLine = document.createElement("p");
        firstLine.innerHTML = "<br>";
        body.appendChild(firstLine);
      }
      moveCaretToBlockStart(firstLine, sel);
    }

    function deleteEmptyToggleIfNeeded(sel, root) {
      if (!sel || !sel.rangeCount || !sel.isCollapsed) return false;
      var details = findAncestorTag(sel.anchorNode, root, "DETAILS");
      if (
        !details ||
        !details.classList ||
        !details.classList.contains("toggle-block")
      ) {
        return false;
      }

      var level = normalizeToggleLevel(details.getAttribute("data-toggle-level"));
      var summaryText = getToggleSummaryText(details);
      var defaultTitle = defaultToggleTitle(level);
      var summaryIsDefaultOrEmpty =
        !summaryText || summaryText === defaultTitle;

      var bodyHasInput = hasToggleBodyInput(details);
      if (!summaryIsDefaultOrEmpty || bodyHasInput) return false;

      // summary が空なら toggle解除（中身を外へ）。それ以外の空toggleは削除して本文へ。
      if (!summaryText) {
        return unwrapToggle(details, sel);
      }
      var p = document.createElement("p");
      p.innerHTML = "<br>";
      details.parentNode.replaceChild(p, details);
      moveCaretToBlockStart(p, sel);
      return true;
    }

    function buildToggleBlock(level, titleText) {
      var details = document.createElement("details");
      details.className = "toggle-block";
      details.open = true;
      applyToggleLevelClasses(details, normalizeToggleLevel(level));

      var summary = document.createElement("summary");
      summary.setAttribute("contenteditable", "false");
      var title = document.createElement("span");
      title.className = "toggle-summary-text";
      title.setAttribute("contenteditable", "true");
      title.textContent =
        (titleText || "").trim() || defaultToggleTitle(normalizeToggleLevel(level));
      summary.appendChild(title);
      details.appendChild(summary);

      var body = document.createElement("div");
      body.className = "toggle-body";
      var p = document.createElement("p");
      p.innerHTML = "<br>";
      body.appendChild(p);
      details.appendChild(body);

      return {
        details: details,
        summaryText: title,
        bodyFirstLine: p,
      };
    }

    function applyInlineMarkdownShortcut(anchorNode, sel, root) {
      if (!anchorNode || anchorNode.nodeType !== 3) return false;
      if (isInsideTag(anchorNode.parentNode, root, ["A", "PRE", "CODE"]))
        return false;

      var text = anchorNode.textContent || "";
      var offset = sel.anchorOffset;
      var before = text.slice(0, offset);

      var m = null;
      m = before.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/);
      if (m) {
        var img = document.createElement("img");
        img.setAttribute("alt", m[1] || "");
        img.setAttribute("src", m[2] || "");
        return replaceTextNodeRange(
          anchorNode,
          offset - m[0].length,
          offset,
          img,
          sel,
        );
      }

      m = before.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (m) {
        var a = document.createElement("a");
        a.setAttribute("href", m[2] || "");
        a.textContent = m[1] || "";
        return replaceTextNodeRange(
          anchorNode,
          offset - m[0].length,
          offset,
          a,
          sel,
        );
      }

      m = before.match(/\*\*([^*\n]+)\*\*$/);
      if (m) {
        var strong = document.createElement("strong");
        strong.textContent = m[1];
        return replaceTextNodeRange(
          anchorNode,
          offset - m[0].length,
          offset,
          strong,
          sel,
        );
      }

      m = before.match(/~~([^~\n]+)~~$/);
      if (m) {
        var del = document.createElement("del");
        del.textContent = m[1];
        return replaceTextNodeRange(
          anchorNode,
          offset - m[0].length,
          offset,
          del,
          sel,
        );
      }

      m = before.match(/`([^`\n]+)`$/);
      if (m) {
        var code = document.createElement("code");
        code.textContent = m[1];
        return replaceTextNodeRange(
          anchorNode,
          offset - m[0].length,
          offset,
          code,
          sel,
        );
      }

      m = before.match(/\*([^*\n]+)\*$/);
      if (m) {
        var em = document.createElement("em");
        em.textContent = m[1];
        return replaceTextNodeRange(
          anchorNode,
          offset - m[0].length,
          offset,
          em,
          sel,
        );
      }

      return false;
    }

    function replaceTextNodeRange(textNode, start, end, replacementEl, sel) {
      var text = textNode.textContent || "";
      if (start < 0 || end < start || end > text.length) return false;

      var beforeText = text.slice(0, start);
      var afterText = text.slice(end);
      var parent = textNode.parentNode;
      if (!parent) return false;

      var beforeNode = document.createTextNode(beforeText);
      var afterNode = document.createTextNode(afterText);
      parent.insertBefore(beforeNode, textNode);
      parent.insertBefore(replacementEl, textNode);
      parent.insertBefore(afterNode, textNode);
      parent.removeChild(textNode);

      var range = document.createRange();
      if (afterText.length) {
        range.setStart(afterNode, 0);
      } else {
        range.setStartAfter(replacementEl);
      }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    }

    function replaceBlockContent(block, content, sel) {
      block.textContent = content;
      var textNode =
        block.firstChild || block.appendChild(document.createTextNode(""));
      var range = document.createRange();
      range.setStart(textNode, textNode.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    /* ---- リスト入れ子操作 ---- */

    function indentListItem(li, sel) {
      // 前の兄弟LIが必要（最初のLIはインデント不可）
      var prevLi = li.previousElementSibling;
      if (!prevLi || prevLi.nodeName !== "LI") return;

      // 親のリストタイプ(UL/OL)を継承
      var parentList = li.parentNode;
      var listTag = parentList.nodeName; // 'UL' or 'OL'

      // 前のLI内に既にサブリストがあればそこに追加、なければ新規作成
      var subList = null;
      for (var i = prevLi.childNodes.length - 1; i >= 0; i--) {
        var child = prevLi.childNodes[i];
        if (
          child.nodeType === 1 &&
          (child.nodeName === "UL" || child.nodeName === "OL")
        ) {
          subList = child;
          break;
        }
      }
      if (!subList) {
        subList = document.createElement(listTag);
        prevLi.appendChild(subList);
      }

      // LIを移動
      parentList.removeChild(li);
      subList.appendChild(li);

      // カーソル復元
      restoreCursorToLi(li, sel);
    }

    function unindentListItem(li, sel) {
      var parentList = li.parentNode; // UL or OL
      if (
        !parentList ||
        (parentList.nodeName !== "UL" && parentList.nodeName !== "OL")
      )
        return;

      var grandParentLi = parentList.parentNode; // 親のLI
      if (!grandParentLi || grandParentLi.nodeName !== "LI") return;

      var greatGrandParent = grandParentLi.parentNode; // さらに上のUL/OL
      if (!greatGrandParent) return;

      // liの後ろにある兄弟LIをliのサブリストに移す
      var siblingsAfter = [];
      var next = li.nextElementSibling;
      while (next) {
        siblingsAfter.push(next);
        next = next.nextElementSibling;
      }
      if (siblingsAfter.length > 0) {
        var newSubList = document.createElement(parentList.nodeName);
        siblingsAfter.forEach(function (s) {
          parentList.removeChild(s);
          newSubList.appendChild(s);
        });
        li.appendChild(newSubList);
      }

      // liをgrandParentLiの後ろに移動
      parentList.removeChild(li);
      greatGrandParent.insertBefore(li, grandParentLi.nextSibling);

      // 元のサブリストが空になったら削除
      if (parentList.children.length === 0) {
        grandParentLi.removeChild(parentList);
      }

      // カーソル復元
      restoreCursorToLi(li, sel);
    }

    function restoreCursorToLi(li, sel) {
      var textNode = getFirstTextNode(li);
      if (!textNode) {
        textNode = document.createTextNode("");
        if (
          li.firstChild &&
          (li.firstChild.nodeName === "UL" || li.firstChild.nodeName === "OL")
        ) {
          li.insertBefore(textNode, li.firstChild);
        } else {
          li.appendChild(textNode);
        }
      }
      var range = document.createRange();
      range.setStart(textNode, textNode.length);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    /* ---- ツールバー色インジケーター更新 ---- */

    function updateTextColorIndicator(color) {
      currentTextColor = color;
      if (textColorBtn) {
        var bar = textColorBtn.querySelector(".tb-color-bar");
        if (bar) bar.setAttribute("fill", color);
      }
    }

    function updateHighlightIndicator(color) {
      currentHighlightColor = color || "#fef08a";
      if (highlightBtn) {
        var bar = highlightBtn.querySelector(".tb-highlight-bar");
        if (bar) bar.setAttribute("fill", currentHighlightColor);
      }
    }

    function initImageEditing(root) {
      if (!root) return;
      cleanupOrphanImageFigures(root);
      var figures = root.querySelectorAll("figure.image-block");
      figures.forEach(function (figure) {
        ensureImageFigureUi(figure);
      });
      if (!root._imageCleanupBound) {
        root.addEventListener("input", function () {
          cleanupOrphanImageFigures(root);
        });
        root.addEventListener("keyup", function () {
          cleanupOrphanImageFigures(root);
        });
        root._imageCleanupBound = true;
      }
      if (root._imageResizeBound) return;
      root.addEventListener("mousedown", onImageResizeStart);
      root._imageResizeBound = true;
    }

    function cleanupOrphanImageFigures(root) {
      if (!root) return;
      var figures = root.querySelectorAll("figure.image-block");
      figures.forEach(function (figure) {
        var img = figure.querySelector("img");
        var src = img ? String(img.getAttribute("src") || "").trim() : "";
        if (img && src) return;

        var parent = figure.parentNode;
        if (!parent) return;

        var sel = window.getSelection();
        var needCaret = false;
        if (sel && sel.rangeCount && sel.anchorNode) {
          needCaret = figure.contains(sel.anchorNode);
        }

        var next = figure.nextSibling;
        var prev = figure.previousSibling;
        parent.removeChild(figure);

        if (!needCaret) return;
        var target = null;
        if (next && next.nodeType === 1) {
          target = next;
        } else if (prev && prev.nodeType === 1) {
          target = prev;
        } else {
          target = document.createElement("p");
          target.innerHTML = "<br>";
          parent.appendChild(target);
        }
        moveCaretToBlockStart(target, sel);
      });
    }

    function ensureImageFigureUi(figure) {
      if (!figure) return;
      figure.classList.add("image-block");
      var img = figure.querySelector("img");
      if (img) {
        img.setAttribute("contenteditable", "false");
        if (!img.getAttribute("alt")) {
          img.setAttribute("alt", DEFAULT_IMAGE_ALT);
        }
      }
      var caption = figure.querySelector("figcaption.image-caption");
      if (!caption) {
        caption = document.createElement("figcaption");
        caption.className = "image-caption";
        figure.appendChild(caption);
      }
      caption.setAttribute("data-placeholder", "キャプションを入力");
      caption.setAttribute("contenteditable", "true");

      var handle = figure.querySelector(".image-resize-handle");
      if (!handle) {
        handle = document.createElement("span");
        handle.className = "image-resize-handle";
        handle.setAttribute("contenteditable", "false");
        handle.setAttribute("aria-hidden", "true");
        figure.appendChild(handle);
      }
    }

    var imageResizeState = null;

    function onImageResizeStart(e) {
      var handle = e.target.closest(".image-resize-handle");
      if (!handle || !editArea.contains(handle)) return;
      var figure = handle.closest("figure.image-block");
      if (!figure) return;
      var img = figure.querySelector("img");
      if (!img) return;

      e.preventDefault();
      e.stopPropagation();

      var rect = figure.getBoundingClientRect();
      var startWidth = rect.width;
      var editorRect = editArea.getBoundingClientRect();
      var maxWidth = Math.max(120, editorRect.width - 24);
      var minWidth = 120;
      if (!figure.style.width) {
        figure.style.width = Math.round(startWidth) + "px";
      }
      figure.style.maxWidth = "100%";
      img.style.width = "100%";
      img.style.height = "auto";

      imageResizeState = {
        figure: figure,
        img: img,
        startX: e.clientX,
        startWidth: startWidth,
        minWidth: minWidth,
        maxWidth: maxWidth,
      };

      document.addEventListener("mousemove", onImageResizeMove, true);
      document.addEventListener("mouseup", onImageResizeEnd, true);
    }

    function onImageResizeMove(e) {
      if (!imageResizeState) return;
      var s = imageResizeState;
      var next = s.startWidth + (e.clientX - s.startX);
      next = Math.max(s.minWidth, Math.min(s.maxWidth, next));
      s.figure.style.width = Math.round(next) + "px";
      s.figure.style.height = "auto";
      s.img.style.width = "100%";
      s.img.style.height = "auto";
    }

    function onImageResizeEnd() {
      imageResizeState = null;
      document.removeEventListener("mousemove", onImageResizeMove, true);
      document.removeEventListener("mouseup", onImageResizeEnd, true);
    }

    function setToolTipText(btn, text) {
      if (!btn) return;
      btn.dataset.tip = text;
      btn.title = text;
      btn.setAttribute("aria-label", text);
    }

    function setToolActive(btn, active) {
      if (!btn) return;
      btn.classList.toggle("is-active", !!active);
    }

    function normalizeColorToHex(raw) {
      if (!raw) return "";
      var color = String(raw).trim().toLowerCase();
      if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)")
        return "";
      if (/^#[0-9a-f]{3}$/i.test(color)) {
        return (
          "#" +
          color.charAt(1) +
          color.charAt(1) +
          color.charAt(2) +
          color.charAt(2) +
          color.charAt(3) +
          color.charAt(3)
        ).toLowerCase();
      }
      if (/^#[0-9a-f]{6}$/i.test(color)) {
        return color.toLowerCase();
      }
      var rgb = color.match(
        /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([01]?\.?\d*))?\s*\)$/,
      );
      if (!rgb) return "";
      if (rgb[4] !== undefined && Number(rgb[4]) === 0) return "";

      function toHex(n) {
        var v = Math.max(0, Math.min(255, Number(n) || 0));
        return (v < 16 ? "0" : "") + v.toString(16);
      }
      return (
        "#" +
        toHex(rgb[1]) +
        toHex(rgb[2]) +
        toHex(rgb[3])
      ).toLowerCase();
    }

    function isSelectionInsideEditor(sel, root) {
      if (!sel || !sel.rangeCount) return false;
      var node = sel.anchorNode;
      if (!node) return false;
      return root.contains(node);
    }

    function detectSelectionTextColor(sel, root) {
      if (!isSelectionInsideEditor(sel, root)) return "";
      var node = sel.anchorNode;
      if (!node) return "";
      if (node.nodeType === 3) node = node.parentNode;

      while (node && node !== root) {
        if (node.nodeType === 1) {
          var color = normalizeColorToHex(node.style && node.style.color);
          if (!color && node.nodeName === "FONT") {
            color = normalizeColorToHex(node.getAttribute("color") || "");
          }
          if (color) return color;
        }
        node = node.parentNode;
      }
      return "";
    }

    function detectSelectionHighlightColor(sel, root) {
      if (!isSelectionInsideEditor(sel, root)) return "";
      var node = sel.anchorNode;
      if (!node) return "";
      if (node.nodeType === 3) node = node.parentNode;

      while (node && node !== root) {
        if (node.nodeType === 1 && node.nodeName === "MARK") {
          var c = normalizeColorToHex(
            node.style.backgroundColor ||
              (window.getComputedStyle
                ? window.getComputedStyle(node).backgroundColor
                : ""),
          );
          if (c) return c;
        }
        node = node.parentNode;
      }
      return "";
    }

    function hasInlineStyleInAncestors(node, root, kind) {
      var cur = node && node.nodeType === 3 ? node.parentNode : node;
      while (cur && cur !== root) {
        if (cur.nodeType === 1) {
          var tag = (cur.nodeName || "").toUpperCase();
          var style = cur.style || {};
          if (kind === "bold") {
            if (tag === "B" || tag === "STRONG") return true;
            var fw = String(style.fontWeight || "").toLowerCase();
            if (fw === "bold" || fw === "bolder") return true;
            var fwNum = parseInt(fw, 10);
            if (Number.isFinite(fwNum) && fwNum >= 600) return true;
          } else if (kind === "italic") {
            if (tag === "I" || tag === "EM") return true;
            var fs = String(style.fontStyle || "").toLowerCase();
            if (fs === "italic" || fs === "oblique") return true;
          } else if (kind === "strike") {
            if (tag === "S" || tag === "DEL" || tag === "STRIKE") return true;
            var td = String(
              style.textDecorationLine || style.textDecoration || "",
            ).toLowerCase();
            if (td.indexOf("line-through") !== -1) return true;
          }
        }
        cur = cur.parentNode;
      }
      return false;
    }

    function detectInlineState(sel, root, kind) {
      if (!isSelectionInsideEditor(sel, root)) return false;
      if (!sel || !sel.rangeCount) return false;
      var range = sel.getRangeAt(0);
      if (sel.isCollapsed) {
        return hasInlineStyleInAncestors(sel.anchorNode, root, kind);
      }

      var common = range.commonAncestorContainer;
      var scope = common.nodeType === 1 ? common : common.parentNode;
      if (!scope) return false;

      var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
      var n = null;
      while ((n = walker.nextNode())) {
        if (!root.contains(n)) continue;
        if (!n.nodeValue || !n.nodeValue.replace(/\u200B/g, "").trim())
          continue;
        try {
          if (!range.intersectsNode(n)) continue;
        } catch (_e) {
          continue;
        }
        if (hasInlineStyleInAncestors(n, root, kind)) return true;
      }
      return (
        hasInlineStyleInAncestors(range.startContainer, root, kind) ||
        hasInlineStyleInAncestors(range.endContainer, root, kind)
      );
    }

    function detectBlockTag(sel, root) {
      if (!isSelectionInsideEditor(sel, root)) return "";
      if (!sel || !sel.rangeCount) return "";
      var node = sel.anchorNode;
      if (!node) return "";
      if (node.nodeType === 3) node = node.parentNode;
      while (node && node !== root) {
        if (node.nodeType === 1 && isBlockElement(node)) {
          return (node.nodeName || "").toUpperCase();
        }
        node = node.parentNode;
      }
      return "";
    }

    function detectToggleLevel(sel, root) {
      if (!isSelectionInsideEditor(sel, root)) return "";
      if (!sel || !sel.rangeCount) return "";
      var node = sel.anchorNode;
      if (!node) return "";
      if (node.nodeType === 3) node = node.parentNode;
      while (node && node !== root) {
        if (
          node.nodeType === 1 &&
          node.nodeName === "DETAILS" &&
          node.classList &&
          node.classList.contains("toggle-block")
        ) {
          return normalizeToggleLevel(
            node.getAttribute("data-toggle-level") ||
              (node.classList.contains("toggle-h1")
                ? "h1"
                : node.classList.contains("toggle-h2")
                  ? "h2"
                  : node.classList.contains("toggle-h3")
                    ? "h3"
                    : "p"),
          );
        }
        node = node.parentNode;
      }
      return "";
    }

    function refreshDynamicToolTips() {
      var sel = window.getSelection();
      var inEditor = isSelectionInsideEditor(sel, editArea);
      var boldOn = inEditor ? detectInlineState(sel, editArea, "bold") : false;
      var italicOn = inEditor
        ? detectInlineState(sel, editArea, "italic")
        : false;
      var strikeOn = inEditor
        ? detectInlineState(sel, editArea, "strike")
        : false;
      var blockTag = inEditor ? detectBlockTag(sel, editArea) : "";
      var toggleLevel = inEditor ? detectToggleLevel(sel, editArea) : "";
      var textColor = inEditor ? detectSelectionTextColor(sel, editArea) : "";
      var highlightColor = inEditor
        ? detectSelectionHighlightColor(sel, editArea)
        : "";

      var boldBase =
        (toolButtons.bold && toolButtons.bold.dataset.baseTip) ||
        TOOL_TIPS.bold;
      var italicBase =
        (toolButtons.italic && toolButtons.italic.dataset.baseTip) ||
        TOOL_TIPS.italic;
      var strikeBase =
        (toolButtons.strikethrough &&
          toolButtons.strikethrough.dataset.baseTip) ||
        TOOL_TIPS.strikethrough;
      var textColorBase =
        (toolButtons.textColor && toolButtons.textColor.dataset.baseTip) ||
        TOOL_TIPS.textColor;
      var highlightBase =
        (toolButtons.highlight && toolButtons.highlight.dataset.baseTip) ||
        TOOL_TIPS.highlight;

      // tooltip 文言は固定し、視覚的なアクティブ表示で状態を伝える
      setToolTipText(toolButtons.bold, boldBase);
      setToolTipText(toolButtons.italic, italicBase);
      setToolTipText(toolButtons.strikethrough, strikeBase);
      setToolTipText(toolButtons.textColor, textColorBase);
      setToolTipText(toolButtons.highlight, highlightBase);

      setToolActive(toolButtons.bold, boldOn);
      setToolActive(toolButtons.italic, italicOn);
      setToolActive(toolButtons.strikethrough, strikeOn);
      setToolActive(toolButtons.h1, blockTag === "H1");
      setToolActive(toolButtons.h2, blockTag === "H2");
      setToolActive(toolButtons.h3, blockTag === "H3");
      setToolActive(toolButtons.toggleP, toggleLevel === "p");
      setToolActive(toolButtons.toggleH1, toggleLevel === "h1");
      setToolActive(toolButtons.toggleH2, toggleLevel === "h2");
      setToolActive(toolButtons.toggleH3, toggleLevel === "h3");
      setToolActive(
        toolButtons.paragraph,
        !toggleLevel && (blockTag === "P" || blockTag === "DIV"),
      );

      var textColorActive = !!textColor && textColor !== "#1e293b";
      setToolActive(toolButtons.textColor, textColorActive);
      if (toolButtons.textColor) {
        toolButtons.textColor.style.setProperty(
          "--tool-accent",
          textColorActive ? textColor : "#64748b",
        );
      }
      updateTextColorIndicator(textColor || "#1e293b");

      var highlightActive = !!highlightColor;
      setToolActive(toolButtons.highlight, highlightActive);
      if (toolButtons.highlight) {
        toolButtons.highlight.style.setProperty(
          "--tool-accent",
          highlightActive ? highlightColor : "#fef08a",
        );
      }
      updateHighlightIndicator(highlightColor || "#fef08a");
    }

    /* ---- カラーピッカーポップアップ ---- */

    var activePopup = null;

    function closePopup() {
      if (activePopup) {
        activePopup.remove();
        activePopup = null;
      }
    }

    document.addEventListener(
      "click",
      function (e) {
        if (activePopup && !activePopup.contains(e.target)) {
          closePopup();
        }
      },
      true,
    );

    function showColorPopup(btn, colors, callback) {
      closePopup();

      var popup = document.createElement("div");
      popup.className = "wysiwyg-color-popup";

      colors.forEach(function (c) {
        var swatch = document.createElement("button");
        swatch.type = "button";
        swatch.className = "wysiwyg-color-swatch";
        swatch.title = c.label;
        if (c.value) {
          swatch.style.background = c.value;
        } else {
          swatch.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="#999" stroke-width="1.5"/></svg>';
          swatch.style.background = "#fff";
          swatch.style.border = "1px solid #ddd";
        }
        swatch.addEventListener("mousedown", function (e) {
          e.preventDefault();
        });
        swatch.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          callback(c.value);
          closePopup();
        });
        popup.appendChild(swatch);
      });

      btn.style.position = "relative";
      btn.appendChild(popup);
      activePopup = popup;
    }

    /* ---- ツール実行 ---- */

    function execTool(tool, btn) {
      editArea.focus();
      if (tool.cmd) {
        if (tool.cmd.indexOf("justify") === 0) {
          applyAlignment(tool.cmd);
        } else {
          document.execCommand(tool.cmd, false, null);
        }
        refreshDynamicToolTips();
        return;
      }
      if (tool.block) {
        if (tool.block === "blockquote") {
          var sel = window.getSelection();
          if (sel && sel.rangeCount) {
            var block = sel.anchorNode;
            while (block && block !== editArea && !isBlockElement(block)) {
              block = block.parentNode;
            }
            if (block && block !== editArea) {
              var content = (block.textContent || "")
                .replace(/\u200B/g, "")
                .trim();
              convertBlockToQuote(block, content, sel);
              refreshDynamicToolTips();
              return;
            }
          }
        }
        document.execCommand("formatBlock", false, "<" + tool.block + ">");
        initQuoteEditing(editArea);
        refreshDynamicToolTips();
        return;
      }
      if (tool.custom) {
        execCustom(tool.custom, btn);
        refreshDynamicToolTips();
      }
    }

    function cloneSelectionRange() {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      return sel.getRangeAt(0).cloneRange();
    }

    function restoreSelectionRange(range) {
      if (!range) return false;
      var sel = window.getSelection();
      if (!sel) return false;
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    }

    function insertImageAtRange(src, alt, range) {
      if (!src) return;
      editArea.focus();
      restoreSelectionRange(range);
      var html = buildImageFigureHtml(src, alt || DEFAULT_IMAGE_ALT);
      document.execCommand("insertHTML", false, html);
      initImageEditing(editArea);
    }

    function buildImageFigureHtml(src, alt) {
      return (
        '<figure class="image-block">' +
        '<img src="' +
        escapeAttr(src) +
        '" alt="' +
        escapeAttr(alt || DEFAULT_IMAGE_ALT) +
        '" contenteditable="false">' +
        '<figcaption class="image-caption" data-placeholder="キャプションを入力"></figcaption>' +
        '<span class="image-resize-handle" contenteditable="false" aria-hidden="true"></span>' +
        "</figure><p><br></p>"
      );
    }

    function pickLocalImage(callback) {
      var picker = document.createElement("input");
      picker.type = "file";
      picker.accept = "image/*";
      picker.style.display = "none";
      document.body.appendChild(picker);

      picker.addEventListener("change", function () {
        var file = picker.files && picker.files[0];
        if (!file) {
          picker.remove();
          return;
        }
        uploadLocalImage(file)
          .then(function (src) {
            callback(src);
          })
          .catch(function (err) {
            alert((err && err.message) || "画像のアップロードに失敗しました。");
          })
          .finally(function () {
            picker.remove();
          });
      });

      picker.click();
    }

    function uploadLocalImage(file) {
      if (!file) return Promise.reject(new Error("画像ファイルがありません"));
      var form = new FormData();
      form.append("file", file);
      return fetch("/api/pages/images/upload", {
        method: "POST",
        body: form,
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              if (!res.ok || !data.ok || !data.url) {
                throw new Error(data.error || "画像のアップロードに失敗しました。");
              }
              return data.url;
            });
        });
    }

    var activeImageDialog = null;
    var imageDialogEscHandler = null;

    function closeImageDialog() {
      if (!activeImageDialog) return;
      activeImageDialog.remove();
      activeImageDialog = null;
      if (imageDialogEscHandler) {
        document.removeEventListener("keydown", imageDialogEscHandler, true);
        imageDialogEscHandler = null;
      }
    }

    function showImageInsertDialog(range) {
      closePopup();
      closeImageDialog();

      var overlay = document.createElement("div");
      overlay.className = "wysiwyg-image-dialog-overlay";

      var panel = document.createElement("div");
      panel.className = "wysiwyg-image-dialog";
      panel.innerHTML =
        '<div class="wysiwyg-image-tabs">' +
        '  <button type="button" class="wysiwyg-image-tab active" data-tab="upload">アップロード</button>' +
        '  <button type="button" class="wysiwyg-image-tab" data-tab="link">リンクを埋め込む</button>' +
        "</div>" +
        '<div class="wysiwyg-image-body"></div>';
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      activeImageDialog = overlay;

      function closeAndFocus() {
        closeImageDialog();
        editArea.focus();
      }

      function renderTab(name) {
        var body = panel.querySelector(".wysiwyg-image-body");
        var tabs = panel.querySelectorAll(".wysiwyg-image-tab");
        tabs.forEach(function (t) {
          t.classList.toggle("active", t.dataset.tab === name);
        });

        if (name === "upload") {
          body.innerHTML =
            '<div class="wysiwyg-image-pane">' +
            '  <button type="button" class="wysiwyg-image-upload-btn">ファイルをアップロード</button>' +
            '  <div class="wysiwyg-image-hint">ローカル画像を選択して挿入します。</div>' +
            "</div>";
          var uploadBtn = body.querySelector(".wysiwyg-image-upload-btn");
          uploadBtn.addEventListener("click", function () {
            pickLocalImage(function (src) {
              insertImageAtRange(src, DEFAULT_IMAGE_ALT, range);
              closeAndFocus();
            });
          });
          return;
        }

        if (name === "link") {
          body.innerHTML =
            '<div class="wysiwyg-image-pane">' +
            '  <label class="wysiwyg-image-field">' +
            "    <span>画像URL</span>" +
            '    <input type="url" class="wysiwyg-image-url-input" placeholder="https://example.com/image.png">' +
            "  </label>" +
            '  <button type="button" class="wysiwyg-image-insert-btn">挿入</button>' +
            "</div>";
          var urlInput = body.querySelector(".wysiwyg-image-url-input");
          var insertBtn = body.querySelector(".wysiwyg-image-insert-btn");
          urlInput.focus();
          insertBtn.addEventListener("click", function () {
            var src = (urlInput.value || "").trim();
            if (!src) {
              urlInput.focus();
              return;
            }
            if (/^data:image\//i.test(src)) {
              alert("base64画像は非対応です。アップロードを利用してください。");
              return;
            }
            insertImageAtRange(src, DEFAULT_IMAGE_ALT, range);
            closeAndFocus();
          });
          urlInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") insertBtn.click();
          });
          return;
        }
      }

      panel.querySelectorAll(".wysiwyg-image-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
          renderTab(tab.dataset.tab || "upload");
        });
      });

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          closeAndFocus();
        }
      });

      imageDialogEscHandler = function (e) {
        if (!activeImageDialog) return;
        if (e.key === "Escape") {
          e.preventDefault();
          closeAndFocus();
        }
      };
      document.addEventListener("keydown", imageDialogEscHandler, true);

      renderTab("upload");
    }

    var activeLinkDialog = null;
    var linkDialogEscHandler = null;

    function closeLinkDialog() {
      if (!activeLinkDialog) return;
      activeLinkDialog.remove();
      activeLinkDialog = null;
      if (linkDialogEscHandler) {
        document.removeEventListener("keydown", linkDialogEscHandler, true);
        linkDialogEscHandler = null;
      }
    }

    function encodeSlugForHref(slug) {
      return String(slug || "")
        .split("/")
        .map(function (p) {
          return encodeURIComponent(p);
        })
        .join("/");
    }

    function getSelectionTextFromRange(range) {
      if (!range) return "";
      return (range.toString() || "").trim();
    }

    function insertLinkAtRange(href, fallbackText, range, customText) {
      if (!href) return;
      editArea.focus();
      restoreSelectionRange(range);

      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      var activeRange = sel.getRangeAt(0);
      var selectedText = getSelectionTextFromRange(activeRange);

      if (selectedText) {
        document.execCommand("createLink", false, href);
        return;
      }

      var linkText = (customText || "").trim() || fallbackText || href;
      var html =
        '<a href="' + escapeAttr(href) + '">' + escapeHtml(linkText) + "</a>";
      document.execCommand("insertHTML", false, html);
    }

    function showLinkInsertDialog(range) {
      closePopup();
      closeImageDialog();
      closeLinkDialog();

      var overlay = document.createElement("div");
      overlay.className = "wysiwyg-link-dialog-overlay";
      var panel = document.createElement("div");
      panel.className = "wysiwyg-link-dialog";
      panel.innerHTML =
        '<div class="wysiwyg-link-tabs">' +
        '  <button type="button" class="wysiwyg-link-tab active" data-tab="page">ページを指定</button>' +
        '  <button type="button" class="wysiwyg-link-tab" data-tab="url">URLリンク</button>' +
        "</div>" +
        '<div class="wysiwyg-link-body"></div>';
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
      activeLinkDialog = overlay;

      function closeAndFocus() {
        closeLinkDialog();
        editArea.focus();
      }

      function renderPageTab() {
        var body = panel.querySelector(".wysiwyg-link-body");
        body.innerHTML =
          '<div class="wysiwyg-link-pane">' +
          '  <div class="wysiwyg-link-page-list wysiwyg-link-cascade"><div class="wysiwyg-link-hint">読み込み中...</div></div>' +
          "</div>";
        var list = body.querySelector(".wysiwyg-link-page-list");

        var timeoutMs = 8000;
        var controller =
          typeof AbortController !== "undefined" ? new AbortController() : null;
        var timeoutTimer = null;
        if (controller) {
          timeoutTimer = setTimeout(function () {
            try {
              controller.abort();
            } catch (_e) {}
          }, timeoutMs);
        }

        var treeReq = fetch(
          "/api/pages/tree",
          controller ? { signal: controller.signal } : {},
        ).then(function (r) {
          if (!r.ok) {
            throw new Error("HTTP " + r.status);
          }
          return r.json();
        });

        if (!controller) {
          treeReq = Promise.race([
            treeReq,
            new Promise(function (_resolve, reject) {
              setTimeout(function () {
                reject(new Error("timeout"));
              }, timeoutMs);
            }),
          ]);
        }

        treeReq
          .then(function (tree) {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            list.innerHTML = "";
            function toEntries(node) {
              var entries = [];
              var children = (node && node.children) || {};
              Object.keys(children).forEach(function (name) {
                entries.push({
                  kind: "dir",
                  name: name,
                  node: children[name],
                });
              });
              var pages = Array.isArray(node && node.pages) ? node.pages : [];
              pages.forEach(function (p) {
                if (!p || !p.slug) return;
                entries.push({
                  kind: "page",
                  slug: p.slug,
                  title: p.title || p.slug,
                });
              });
              return entries;
            }

            function clearColumnsAfter(depth) {
              list
                .querySelectorAll(".wysiwyg-link-menu-column")
                .forEach(function (col) {
                  var d = Number(col.dataset.depth || 0);
                  if (d > depth) col.remove();
                });
            }

            function mountColumn(depth, column) {
              var selector =
                '.wysiwyg-link-menu-column[data-depth="' + depth + '"]';
              var existing = list.querySelector(selector);
              if (existing) {
                existing.replaceWith(column);
              } else {
                list.appendChild(column);
              }
            }

            function markActive(dirBtn) {
              var col = dirBtn.closest(".wysiwyg-link-menu-column");
              if (!col) return;
              col
                .querySelectorAll(".wysiwyg-link-page-item.is-active")
                .forEach(function (btn) {
                  btn.classList.remove("is-active");
                });
              dirBtn.classList.add("is-active");
            }

            function renderColumn(node, depth, label) {
              clearColumnsAfter(depth);

              var col = document.createElement("div");
              col.className = "wysiwyg-link-menu-column";
              col.dataset.depth = String(depth);

              if (depth > 0 && label) {
                var head = document.createElement("div");
                head.className = "wysiwyg-link-menu-head";
                head.textContent = label;
                col.appendChild(head);
              }

              var entries = toEntries(node);
              if (!entries.length) {
                var hint = document.createElement("div");
                hint.className = "wysiwyg-link-hint";
                hint.textContent = "ページがありません";
                col.appendChild(hint);
                mountColumn(depth, col);
                return;
              }

              entries.forEach(function (entry) {
                if (entry.kind === "page") {
                  var pageBtn = document.createElement("button");
                  pageBtn.type = "button";
                  pageBtn.className = "wysiwyg-link-page-item is-page";
                  pageBtn.innerHTML =
                    '<span class="wysiwyg-link-page-title">' +
                    escapeHtml(entry.title || entry.slug) +
                    "</span>" +
                    '<span class="wysiwyg-link-page-slug">/' +
                    escapeHtml(entry.slug) +
                    "</span>";
                  pageBtn.addEventListener("click", function () {
                    var href = "/pages/" + encodeSlugForHref(entry.slug);
                    var pathText = "/" + entry.slug;
                    insertLinkAtRange(href, pathText, range);
                    closeAndFocus();
                  });
                  pageBtn.addEventListener("mouseenter", function () {
                    clearColumnsAfter(depth);
                  });
                  col.appendChild(pageBtn);
                  return;
                }

                var dirBtn = document.createElement("button");
                dirBtn.type = "button";
                dirBtn.className = "wysiwyg-link-page-item is-dir";
                dirBtn.innerHTML =
                  '<span class="wysiwyg-link-page-title">' +
                  escapeHtml(entry.name) +
                  "</span>" +
                  '<span class="wysiwyg-link-page-arrow">▶</span>';

                function openChild() {
                  markActive(dirBtn);
                  renderColumn(entry.node, depth + 1, entry.name);
                  list.scrollLeft = list.scrollWidth;
                }

                dirBtn.addEventListener("mouseenter", openChild);
                dirBtn.addEventListener("click", function (e) {
                  e.preventDefault();
                  openChild();
                });
                dirBtn.addEventListener("keydown", function (e) {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openChild();
                  }
                });

                col.appendChild(dirBtn);
              });

              mountColumn(depth, col);
            }

            renderColumn(tree || {}, 0, "");
          })
          .catch(function (err) {
            if (timeoutTimer) clearTimeout(timeoutTimer);
            console.error("ページツリー取得失敗", err);
            list.innerHTML =
              '<div class="wysiwyg-link-hint">ページ一覧の取得に失敗しました</div>';
          });
      }

      function renderUrlTab() {
        var body = panel.querySelector(".wysiwyg-link-body");
        body.innerHTML =
          '<div class="wysiwyg-link-pane">' +
          '  <label class="wysiwyg-link-field">' +
          "    <span>URL</span>" +
          '    <input type="url" class="wysiwyg-link-url-input" placeholder="https://example.com">' +
          "  </label>" +
          '  <button type="button" class="wysiwyg-link-insert-btn">挿入</button>' +
          "</div>";
        var urlInput = body.querySelector(".wysiwyg-link-url-input");
        var insertBtn = body.querySelector(".wysiwyg-link-insert-btn");
        urlInput.focus();

        insertBtn.addEventListener("click", function () {
          var href = (urlInput.value || "").trim();
          if (!href) {
            urlInput.focus();
            return;
          }
          insertLinkAtRange(href, href, range);
          closeAndFocus();
        });

        urlInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter") insertBtn.click();
        });
      }

      function switchTab(name) {
        panel.querySelectorAll(".wysiwyg-link-tab").forEach(function (t) {
          t.classList.toggle("active", t.dataset.tab === name);
        });
        if (name === "url") {
          renderUrlTab();
        } else {
          renderPageTab();
        }
      }

      panel.querySelectorAll(".wysiwyg-link-tab").forEach(function (tab) {
        tab.addEventListener("click", function () {
          switchTab(tab.dataset.tab || "page");
        });
      });

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeAndFocus();
      });

      linkDialogEscHandler = function (e) {
        if (!activeLinkDialog) return;
        if (e.key === "Escape") {
          e.preventDefault();
          closeAndFocus();
        }
      };
      document.addEventListener("keydown", linkDialogEscHandler, true);

      switchTab("page");
    }

    function execCustom(action, btn) {
      var sel = window.getSelection();

      switch (action) {
        case "code":
          if (sel.rangeCount > 0 && !sel.isCollapsed) {
            var range = sel.getRangeAt(0);
            var text = range.toString();
            var code = document.createElement("code");
            code.textContent = text;
            range.deleteContents();
            range.insertNode(code);
            sel.collapseToEnd();
          } else {
            document.execCommand("insertHTML", false, "<code>コード</code>");
          }
          break;

        case "codeblock":
          var codeText = "";
          if (sel.rangeCount > 0 && !sel.isCollapsed) {
            codeText = sel.getRangeAt(0).toString();
            sel.getRangeAt(0).deleteContents();
          }
          document.execCommand(
            "insertHTML",
            false,
            "<pre><code>" +
              escapeHtml(codeText || "コードを入力") +
              "</code></pre><p><br></p>",
          );
          break;

        case "link":
          var linkRange = cloneSelectionRange();
          showLinkInsertDialog(linkRange);
          break;

        case "image":
          var range = cloneSelectionRange();
          showImageInsertDialog(range);
          break;

        case "table":
          document.execCommand(
            "insertHTML",
            false,
            buildTableHtml(3, 3) + "<p><br></p>",
          );
          initTableEditing(editArea);
          break;

        case "checkbox":
          document.execCommand(
            "insertHTML",
            false,
            '<p><label class="check-item"><input type="checkbox" contenteditable="false" tabindex="-1"> <span class="check-text">チェック項目</span></label></p><p><br></p>',
          );
          break;

        case "hr":
          document.execCommand("insertHTML", false, "<hr><p><br></p>");
          refreshHrAccent();
          break;

        case "textColor":
          showColorPopup(btn, TEXT_COLORS, function (color) {
            editArea.focus();
            updateTextColorIndicator(color);
            if (color === "#1e293b") {
              document.execCommand("removeFormat", false);
            } else {
              document.execCommand("foreColor", false, color);
            }
            refreshDynamicToolTips();
          });
          break;

        case "highlight":
          showColorPopup(btn, HIGHLIGHT_COLORS, function (color) {
            editArea.focus();
            if (color) updateHighlightIndicator(color);
            if (!color) {
              if (sel.rangeCount > 0 && !sel.isCollapsed) {
                var r = sel.getRangeAt(0);
                var markParent = r.commonAncestorContainer;
                while (
                  markParent &&
                  markParent.nodeName !== "MARK" &&
                  markParent !== editArea
                ) {
                  markParent = markParent.parentNode;
                }
                if (markParent && markParent.nodeName === "MARK") {
                  var parent = markParent.parentNode;
                  while (markParent.firstChild)
                    parent.insertBefore(markParent.firstChild, markParent);
                  parent.removeChild(markParent);
                }
              }
            } else {
              if (sel.rangeCount > 0 && !sel.isCollapsed) {
                var rng = sel.getRangeAt(0);
                var selectedText = rng.toString();
                var mark = document.createElement("mark");
                mark.style.backgroundColor = color;
                mark.textContent = selectedText;
                rng.deleteContents();
                rng.insertNode(mark);
                sel.collapseToEnd();
              }
            }
            refreshDynamicToolTips();
          });
          break;

        case "noteInfo":
          insertNote("info");
          break;
        case "noteWarn":
          insertNote("warning");
          break;
        case "noteImportant":
          insertNote("important");
          break;
        case "noteTip":
          insertNote("tip");
          break;
        case "toggleP":
          insertToggle("p");
          initToggleEditing(editArea);
          break;
        case "toggleH1":
          insertToggle("h1");
          initToggleEditing(editArea);
          break;
        case "toggleH2":
          insertToggle("h2");
          initToggleEditing(editArea);
          break;
        case "toggleH3":
          insertToggle("h3");
          initToggleEditing(editArea);
          break;
      }
    }

    function insertNote(type) {
      var info = NOTE_TYPES[type];
      var noteContent = "";
      var sel = window.getSelection();
      if (!sel.rangeCount) return;

      var range = sel.getRangeAt(0);
      if (!sel.isCollapsed) {
        noteContent = range.toString();
      }
      range.deleteContents();

      var note = document.createElement("div");
      note.className = "note note-" + type;
      note.setAttribute("data-note-type", type);

      var title = document.createElement("div");
      title.className = "note-title";
      title.setAttribute("contenteditable", "false");
      title.textContent = info.label;
      note.appendChild(title);

      var body = document.createElement("div");
      body.className = "note-body";
      var line = document.createElement("p");
      if (noteContent) {
        line.innerHTML = escapeHtml(noteContent).replace(/\n/g, "<br>");
      } else {
        line.innerHTML = "<br>";
      }
      body.appendChild(line);
      note.appendChild(body);

      var after = document.createElement("p");
      after.innerHTML = "<br>";

      range.insertNode(after);
      range.insertNode(note);

      moveCaretToBlockStart(line, sel);
    }

    function insertToggle(level) {
      var sel = window.getSelection();
      if (!sel.rangeCount) return;

      var range = sel.getRangeAt(0);
      var selected = "";
      if (!sel.isCollapsed) {
        selected = range.toString();
      }
      range.deleteContents();

      var built = buildToggleBlock(level, selected);
      var details = built.details;
      var summaryText = built.summaryText;

      var after = document.createElement("p");
      after.innerHTML = "<br>";

      range.insertNode(after);
      range.insertNode(details);

      moveCaretToBlockStart(summaryText, sel);
    }

    refreshDynamicToolTips();
    return { editArea: editArea, toolbar: toolbar };
  };

  /* ---- ノートタイトルを編集不可に ---- */

  function makeNoteTitlesReadOnly(container) {
    var titles = container.querySelectorAll(".note-title");
    for (var i = 0; i < titles.length; i++) {
      titles[i].contentEditable = "false";
    }
  }

  /* ---- HTML → Markdown 変換 ---- */

  function htmlToMarkdown(html) {
    var container = document.createElement("div");
    container.innerHTML = html;
    container.querySelectorAll(".notion-table-ui").forEach(function (ui) {
      ui.parentNode.removeChild(ui);
    });
    var md = convertNode(container);
    return md.endsWith("\n") ? md : md + "\n";
  }

  function convertNode(node) {
    var result = "";

    for (var i = 0; i < node.childNodes.length; i++) {
      var child = node.childNodes[i];

      if (child.nodeType === 3) {
        result += (child.textContent || "").replace(/\u200B/g, "");
        continue;
      }
      if (child.nodeType !== 1) continue;

      var tag = child.nodeName;
      var inner = convertNode(child);

      switch (tag) {
        case "DETAILS":
          result += "\n" + serializeToggleDetails(child) + "\n";
          break;
        case "SUMMARY":
          break;

        case "P":
          var pAlign = child.style.textAlign || "";
          var pIndent = child.style.marginLeft || "";
          var pIndentLevel = getIndentLevelAttr(child);
          var pBody = preserveLeadingWhitespaceMarkdown(inner);
          var pIsEmpty = isVisualBlankMarkdown(pBody);
          if (pAlign && pAlign !== "left" && pAlign !== "start") {
            var pStyle = "text-align:" + pAlign;
            if (pIndent) pStyle += ";margin-left:" + pIndent;
            var pIndentAttr =
              pIndentLevel > 0
                ? ' data-indent-level="' + String(pIndentLevel) + '"'
                : "";
            result +=
              '\n<div style="' +
              pStyle +
              '" markdown="1"' +
              pIndentAttr +
              ">\n\n" +
              (pIsEmpty ? "<br>" : pBody) +
              "\n\n</div>\n";
          } else if (pIndent) {
            var pIndentOnlyAttr =
              pIndentLevel > 0
                ? ' data-indent-level="' + String(pIndentLevel) + '"'
                : "";
            result +=
              '\n<div style="margin-left:' +
              pIndent +
              '" markdown="1"' +
              pIndentOnlyAttr +
              ">\n\n" +
              (pIsEmpty ? "<br>" : pBody) +
              "\n\n</div>\n";
          } else {
            result += pIsEmpty ? "\n<br>\n" : "\n" + pBody + "\n";
          }
          break;

        case "H1":
          result += wrapIndent(child, "\n# " + inner.trim() + "\n");
          break;
        case "H2":
          result += wrapIndent(child, "\n## " + inner.trim() + "\n");
          break;
        case "H3":
          result += wrapIndent(child, "\n### " + inner.trim() + "\n");
          break;
        case "H4":
          result += wrapIndent(child, "\n#### " + inner.trim() + "\n");
          break;
        case "H5":
          result += wrapIndent(child, "\n##### " + inner.trim() + "\n");
          break;
        case "H6":
          result += wrapIndent(child, "\n###### " + inner.trim() + "\n");
          break;

        case "STRONG":
        case "B":
          result += "**" + inner + "**";
          break;
        case "EM":
        case "I":
          result += "*" + inner + "*";
          break;
        case "S":
        case "DEL":
        case "STRIKE":
          result += "~~" + inner + "~~";
          break;

        case "CODE":
          if (child.parentNode && child.parentNode.nodeName === "PRE") {
            result += inner;
          } else {
            result += "`" + inner + "`";
          }
          break;

        case "PRE":
          var codeEl = child.querySelector("code");
          var codeText = codeEl ? codeEl.textContent : child.textContent;
          result += "\n```\n" + codeText + "\n```\n";
          break;

        case "BLOCKQUOTE":
          var quoteBody = child.querySelector(".quote-body");
          var bqSource = quoteBody ? convertNode(quoteBody) : inner;
          var bqLines = bqSource ? bqSource.split("\n") : [""];
          result +=
            "\n" +
            bqLines
              .map(function (l) {
                return "> " + l;
              })
              .join("\n") +
            "\n";
          break;

        case "UL":
          result += "\n" + convertList(child, false) + "\n";
          break;
        case "OL":
          result += "\n" + convertList(child, true) + "\n";
          break;
        case "LI":
          result += inner;
          break;

        case "A":
          var href = child.getAttribute("href") || "";
          result += "[" + inner + "](" + href + ")";
          break;

        case "FIGURE":
          if (child.classList.contains("image-block")) {
            result += "\n" + serializeImageFigure(child) + "\n";
          } else {
            result += inner;
          }
          break;

        case "IMG":
          var src = child.getAttribute("src") || "";
          var altText = child.getAttribute("alt") || "";
          result += "![" + altText + "](" + src + ")";
          break;

        case "TABLE":
          result += "\n" + convertTable(child) + "\n";
          break;
        case "HR":
          result += "\n---\n";
          break;
        case "BR":
          result += "\n";
          break;
        case "LABEL":
          result += inner;
          break;
        case "INPUT":
          var inputType = (child.getAttribute("type") || "").toLowerCase();
          if (inputType === "checkbox") {
            result += child.checked ? "[x] " : "[ ] ";
          }
          break;

        case "MARK":
          var bgColor = child.style.backgroundColor || "";
          if (bgColor) {
            result +=
              '<mark style="background-color:' +
              bgColor +
              '">' +
              inner +
              "</mark>";
          } else {
            result += "<mark>" + inner + "</mark>";
          }
          break;

        case "FONT":
          var fontColor = child.getAttribute("color") || "";
          if (fontColor) {
            result +=
              '<span style="color:' + fontColor + '">' + inner + "</span>";
          } else {
            result += inner;
          }
          break;

        case "SPAN":
          var threadId = child.dataset ? child.dataset.threadId : "";
          if (threadId) {
            result += '<comment id="' + threadId + '">' + inner + "</comment>";
          } else {
            var spanColor = child.style.color || "";
            if (spanColor) {
              result +=
                '<span style="color:' + spanColor + '">' + inner + "</span>";
            } else {
              result += inner;
            }
          }
          break;

        case "DIV":
          if (child.classList && child.classList.contains("quote-body")) {
            result += inner;
            break;
          }
          var noteType = child.dataset ? child.dataset.noteType : "";
          if (noteType && NOTE_TYPES[noteType]) {
            // ノートブロック → > [!TAG] markdown 記法
            var noteBody = child.querySelector(".note-body");
            var bodyMd = noteBody ? convertNode(noteBody) : inner;
            var mdTag = NOTE_TYPES[noteType].mdTag;
            var bodyLines = bodyMd.split("\n");
            result +=
              "\n> [!" +
              mdTag +
              "]\n" +
              bodyLines
                .map(function (l) {
                  return "> " + l;
                })
                .join("\n") +
              "\n";
          } else {
            var divAlign = child.style.textAlign || "";
            var divIndent = child.style.marginLeft || "";
            var divIndentLevel = getIndentLevelAttr(child);
            var divBody = preserveLeadingWhitespaceMarkdown(inner);
            if (
              (divAlign && divAlign !== "left" && divAlign !== "start") ||
              divIndent
            ) {
              var divStyle = [];
              if (divAlign && divAlign !== "left" && divAlign !== "start") {
                divStyle.push("text-align:" + divAlign);
              }
              if (divIndent) {
                divStyle.push("margin-left:" + divIndent);
              }
              var divIndentAttr =
                divIndentLevel > 0
                  ? ' data-indent-level="' + String(divIndentLevel) + '"'
                  : "";
              result +=
                '\n<div style="' +
                divStyle.join(";") +
                '" markdown="1"' +
                divIndentAttr +
                ">\n\n" +
                divBody +
                "\n\n</div>\n";
            } else {
              result += "\n" + divBody + "\n";
            }
          }
          break;

        default:
          result += inner;
          break;
      }
    }

    return result;
  }

  function convertList(ulOrOl, ordered) {
    var items = [];
    var counter = 1;

    function indentNested(md) {
      return md
        .split("\n")
        .map(function (l) {
          return l ? "    " + l : l;
        })
        .join("\n");
    }

    for (var i = 0; i < ulOrOl.childNodes.length; i++) {
      var li = ulOrOl.childNodes[i];
      if (li.nodeName !== "LI") continue;
      var parts = [];
      var sublist = "";
      for (var j = 0; j < li.childNodes.length; j++) {
        var c = li.childNodes[j];
        if (c.nodeName === "UL") {
          sublist += indentNested(convertList(c, false));
        } else if (c.nodeName === "OL") {
          sublist += indentNested(convertList(c, true));
        } else {
          parts.push(c.nodeType === 3 ? c.textContent : convertNode(c));
        }
      }
      var prefix = ordered ? counter + ". " : "- ";
      items.push(prefix + parts.join("").trim());
      if (sublist) items.push(sublist);
      counter++;
    }
    return items.join("\n");
  }

  function convertTable(table) {
    return serializeTable(table);
  }

  function serializeImageFigure(figure) {
    var clone = figure.cloneNode(true);
    clone.querySelectorAll(".image-resize-handle").forEach(function (el) {
      el.parentNode.removeChild(el);
    });
    var img = clone.querySelector("img");
    if (img) {
      img.removeAttribute("contenteditable");
      if (!img.getAttribute("alt")) {
        img.setAttribute("alt", DEFAULT_IMAGE_ALT);
      }
      img.style.height = "auto";
    }
    var caption = clone.querySelector("figcaption.image-caption");
    if (caption) {
      caption.removeAttribute("contenteditable");
      caption.removeAttribute("data-placeholder");
      if (!caption.innerHTML.trim()) {
        caption.innerHTML = "";
      }
    }
    if (clone.style.width) {
      clone.style.maxWidth = "100%";
    }
    return clone.outerHTML;
  }

  function serializeToggleDetails(details) {
    var clone = details.cloneNode(true);
    clone.classList.add("toggle-block");

    function normalizeLevel(raw) {
      var level = String(raw || "p").toLowerCase();
      if (
        level !== "h1" &&
        level !== "h2" &&
        level !== "h3" &&
        level !== "p"
      ) {
        return "p";
      }
      return level;
    }

    function defaultTitle(level) {
      if (level === "h1") return "見出し1トグル";
      if (level === "h2") return "見出し2トグル";
      if (level === "h3") return "見出し3トグル";
      return "トグル";
    }

    function getSummary(el) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var child = el.childNodes[i];
        if (child.nodeType === 1 && child.nodeName === "SUMMARY") return child;
      }
      return null;
    }

    function getBody(el) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var child = el.childNodes[i];
        if (
          child.nodeType === 1 &&
          child.classList &&
          child.classList.contains("toggle-body")
        ) {
          return child;
        }
      }
      return null;
    }

    var level = normalizeLevel(
      clone.getAttribute("data-toggle-level") ||
        (clone.classList.contains("toggle-h1")
          ? "h1"
          : clone.classList.contains("toggle-h2")
            ? "h2"
            : clone.classList.contains("toggle-h3")
              ? "h3"
              : "p"),
    );
    clone.classList.remove("toggle-h1", "toggle-h2", "toggle-h3", "toggle-p");
    clone.classList.add("toggle-" + level);
    clone.setAttribute("data-toggle-level", level);
    clone
      .querySelectorAll("[contenteditable],[data-toggle-bind],[data-toggleBind]")
      .forEach(function (el) {
        el.removeAttribute("contenteditable");
        el.removeAttribute("data-toggle-bind");
        el.removeAttribute("data-toggleBind");
      });
    var summary = getSummary(clone);
    if (!summary) {
      summary = document.createElement("summary");
      summary.textContent = defaultTitle(level);
      clone.insertBefore(summary, clone.firstChild || null);
    } else {
      var title = summary.querySelector(".toggle-summary-text");
      var titleText = title
        ? (title.textContent || "")
        : (summary.textContent || "");
      summary.innerHTML =
        '<span class="toggle-summary-text">' +
        escapeHtml(titleText.trim() || defaultTitle(level)) +
        "</span>";
    }
    var body = getBody(clone);
    if (!body) {
      body = document.createElement("div");
      body.className = "toggle-body";
      clone.appendChild(body);
    }
    if (!body.childNodes.length) {
      body.innerHTML = "<p><br></p>";
    }
    return clone.outerHTML;
  }

  function closestTableCell(node, root) {
    var current = node;
    while (current && current !== root) {
      if (current.nodeName === "TD" || current.nodeName === "TH")
        return current;
      current = current.parentNode;
    }
    return null;
  }

  function closestTable(node, root) {
    var current = node;
    while (current && current !== root) {
      if (current.nodeName === "TABLE") return current;
      current = current.parentNode;
    }
    return null;
  }

  function closestImageFigure(node, root) {
    var current = node;
    while (current && current !== root) {
      if (
        current.nodeType === 1 &&
        current.nodeName === "FIGURE" &&
        current.classList &&
        current.classList.contains("image-block")
      ) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function closestImage(node, root) {
    var current = node;
    while (current && current !== root) {
      if (current.nodeType === 1 && current.nodeName === "IMG") return current;
      current = current.parentNode;
    }
    return null;
  }

  function applyImageAlignStyle(el, align) {
    if (!el || el.nodeType !== 1) return;
    el.style.display = "block";
    if (align === "center") {
      el.style.marginLeft = "auto";
      el.style.marginRight = "auto";
    } else if (align === "right") {
      el.style.marginLeft = "auto";
      el.style.marginRight = "0";
    } else {
      el.style.marginLeft = "0";
      el.style.marginRight = "auto";
    }
  }

  function applyAlignment(cmd) {
    var sel = window.getSelection();
    if (!sel.rangeCount) return;
    var align =
      cmd === "justifyCenter"
        ? "center"
        : cmd === "justifyRight"
          ? "right"
          : "left";
    var cell = closestTableCell(sel.anchorNode, document.body);
    if (cell) {
      var table = closestTable(cell, document.body);
      var applied = false;
      if (table) {
        var range = sel.getRangeAt(0);
        var cells = table.querySelectorAll("th, td");
        for (var i = 0; i < cells.length; i++) {
          try {
            if (range.intersectsNode(cells[i])) {
              cells[i].style.textAlign = align;
              applied = true;
            }
          } catch (_e) {}
        }
      }
      if (!applied) cell.style.textAlign = align;
      return;
    }

    var figure = closestImageFigure(sel.anchorNode, document.body);
    if (figure) {
      applyImageAlignStyle(figure, align);
      return;
    }
    var img = closestImage(sel.anchorNode, document.body);
    if (img) {
      applyImageAlignStyle(img, align);
      return;
    }

    document.execCommand(cmd, false, null);
  }

  function buildTableHtml(cols, rows) {
    var colCount = Math.max(1, cols || 1);
    var rowCount = Math.max(1, rows || 1);
    var colWidth = (100 / colCount).toFixed(2) + "%";
    var colHtml = "";
    for (var i = 0; i < colCount; i++) {
      colHtml += '<col style="width:' + colWidth + ';">';
    }
    var headCells = "";
    for (var j = 0; j < colCount; j++) {
      headCells += "<th>見出し" + (j + 1) + "</th>";
    }
    var bodyRows = "";
    for (var r = 0; r < rowCount; r++) {
      var cells = "";
      for (var c = 0; c < colCount; c++) {
        cells += "<td>データ" + (r * colCount + c + 1) + "</td>";
      }
      bodyRows += "<tr>" + cells + "</tr>";
    }
    return (
      '<table class="notion-table" style="table-layout:fixed;width:100%;position:relative;overflow:visible;">' +
      "<colgroup>" +
      colHtml +
      "</colgroup>" +
      "<thead><tr>" +
      headCells +
      "</tr></thead>" +
      "<tbody>" +
      bodyRows +
      "</tbody>" +
      "</table>"
    );
  }

  function initTableEditing(editArea) {
    var tables = editArea.querySelectorAll("table");
    for (var i = 0; i < tables.length; i++) {
      applyNotionTable(tables[i]);
    }
    if (!editArea._tableEditingBound) {
      ensureNotionTableUi(editArea);
      bindNotionTableEvents(editArea);
      editArea._tableEditingBound = true;
    }
  }

  function syncColgroup(table) {
    var firstRow = table.querySelector("tr");
    if (!firstRow) return;
    var cells = firstRow.querySelectorAll("th, td");
    var colCount = cells.length;
    var colgroup = table.querySelector("colgroup");
    if (!colgroup) {
      colgroup = document.createElement("colgroup");
      table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length < colCount) {
      var col = document.createElement("col");
      colgroup.appendChild(col);
    }
    while (colgroup.children.length > colCount) {
      colgroup.removeChild(colgroup.lastChild);
    }
    var width = (100 / colCount).toFixed(2) + "%";
    for (var i = 0; i < colgroup.children.length; i++) {
      var colEl = colgroup.children[i];
      if (!colEl.style.width) colEl.style.width = width;
    }
  }

  function applyNotionTable(table) {
    if (!table) return;
    table.classList.add("notion-table");
    table.style.tableLayout = "fixed";
    if (!table.style.width) table.style.width = "100%";
    syncColgroup(table);

    var rows = table.querySelectorAll("tr");
    rows.forEach(function (row) {
      row.classList.add("notion-table-row");
      var cells = row.querySelectorAll("th, td");
      cells.forEach(function (cell) {
        cell.style.position = "relative";
        cell
          .querySelectorAll(":scope > .notion-col-resizer")
          .forEach(function (r) {
            r.parentNode.removeChild(r);
          });
        var wrapper = cell.querySelector(".notion-table-cell");
        var content = "";
        if (wrapper) {
          var text = wrapper.querySelector(".notion-table-cell-text");
          if (text) {
            content = text.innerHTML;
          } else {
            content = wrapper.innerHTML;
          }
        } else {
          content = cell.innerHTML;
        }

        if (!wrapper) {
          cell.innerHTML = "";
          wrapper = document.createElement("div");
          wrapper.className = "notion-table-cell";
          cell.appendChild(wrapper);
        } else {
          wrapper.innerHTML = "";
        }

        var textDiv = document.createElement("div");
        textDiv.className = "notion-table-cell-text";
        textDiv.setAttribute("contenteditable", "true");
        textDiv.innerHTML = content && content.trim() ? content : "<br>";

        wrapper.appendChild(textDiv);

        var colIndex = Array.prototype.indexOf.call(row.children, cell);
        if (colIndex > 0) {
          var leftResizer = document.createElement("div");
          leftResizer.className = "notion-col-resizer notion-col-resizer-left";
          leftResizer.dataset.edge = "left";
          cell.appendChild(leftResizer);
        }
      });
    });
  }

  function ensureNotionTableUi(editArea) {
    if (editArea._notionTableUi) return;
    var ui = document.createElement("div");
    ui.className = "notion-table-ui";
    ui.setAttribute("contenteditable", "false");
    var dragIcon =
      '<svg aria-hidden="true" viewBox="0 0 20 20" class="notion-drag-icon">' +
      '<path d="M6.25 4a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0m5 0a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0m1.25 7.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5M6.25 10a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0m6.25 7.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5M6.25 16a1.25 1.25 0 1 0 2.5 0 1.25 1.25 0 0 0-2.5 0"></path>' +
      "</svg>";
    ui.innerHTML =
      '<div class="notion-ui-col-rail"><button type="button" class="notion-ui-btn notion-ui-add-col" data-action="add-col" aria-label="列追加">+</button></div>' +
      '<div class="notion-ui-row-rail"><button type="button" class="notion-ui-btn notion-ui-add-row" data-action="add-row" aria-label="行追加">+</button></div>' +
      '<button type="button" class="notion-ui-btn notion-ui-drag notion-ui-del-col" data-action="del-col" draggable="true" aria-label="列の操作" title="ドラッグで列の入れ替え / クリックで操作メニュー">' +
      dragIcon +
      "</button>" +
      '<button type="button" class="notion-ui-btn notion-ui-drag notion-ui-del-row" data-action="del-row" draggable="true" aria-label="行の操作" title="ドラッグで行の入れ替え / クリックで操作メニュー">' +
      dragIcon +
      "</button>";
    editArea.appendChild(ui);
    editArea._notionTableUi = ui;
  }

  function bindNotionTableEvents(editArea) {
    var ui = editArea._notionTableUi;
    var actionMenu = null;
    var actionMenuTrigger = null;

    function getRectInArea(el) {
      var er = el.getBoundingClientRect();
      var ar = editArea.getBoundingClientRect();
      return {
        left: er.left - ar.left + editArea.scrollLeft,
        top: er.top - ar.top + editArea.scrollTop,
        width: er.width,
        height: er.height,
      };
    }

    function getActiveCellFromSelection() {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      var node = sel.anchorNode;
      return closestTableCell(node, editArea);
    }

    function clearSelectedCell() {
      var prev = editArea._activeNotionCell;
      if (!prev) return;
      prev.classList.remove("notion-cell-selected");
      editArea._activeNotionCell = null;
    }

    function setSelectedCell(cell) {
      clearSelectedCell();
      if (!cell) {
        hideUi();
        return;
      }
      editArea._activeNotionCell = cell;
      cell.classList.add("notion-cell-selected");
      showUi();
    }

    function hideUi() {
      if (!ui) return;
      ui.classList.remove("visible");
      hideActionMenu();
    }

    function showUi() {
      if (!ui) return;
      var cell = editArea._activeNotionCell;
      if (!cell) {
        hideUi();
        return;
      }
      var table = closestTable(cell, editArea);
      if (!table) {
        hideUi();
        return;
      }
      var row = cell.parentNode;
      var colIndex = Array.prototype.indexOf.call(row.children, cell);
      var rows = table.querySelectorAll("tr");
      var rowIndex = Array.prototype.indexOf.call(rows, row);
      if (colIndex < 0 || rowIndex < 0) {
        hideUi();
        return;
      }
      if (!table.dataset.notionTableId) {
        table.dataset.notionTableId =
          "tbl_" + Math.random().toString(36).slice(2, 10);
      }

      var tableRect = getRectInArea(table);
      var cellRect = getRectInArea(cell);

      var addCol = ui.querySelector(".notion-ui-add-col");
      var addRow = ui.querySelector(".notion-ui-add-row");
      var colRail = ui.querySelector(".notion-ui-col-rail");
      var rowRail = ui.querySelector(".notion-ui-row-rail");
      var delCol = ui.querySelector(".notion-ui-del-col");
      var delRow = ui.querySelector(".notion-ui-del-row");
      if (colRail) {
        colRail.style.left = tableRect.left + tableRect.width + 1 + "px";
        colRail.style.top = tableRect.top + "px";
        colRail.style.height = tableRect.height + "px";
      }
      if (rowRail) {
        rowRail.style.left = tableRect.left + "px";
        rowRail.style.top = tableRect.top + tableRect.height - 7 + "px";
        rowRail.style.width = tableRect.width + "px";
      }
      if (addCol) {
        addCol.dataset.tableId = table.dataset.notionTableId;
      }
      if (addRow) {
        addRow.dataset.tableId = table.dataset.notionTableId;
      }
      if (delCol) {
        delCol.style.left = cellRect.left + cellRect.width / 2 - 11 + "px";
        delCol.style.top = tableRect.top - 22 + "px";
        delCol.dataset.tableId = table.dataset.notionTableId;
        delCol.dataset.rowIndex = String(rowIndex);
        delCol.dataset.colIndex = String(colIndex);
      }
      if (delRow) {
        delRow.style.left = tableRect.left - 24 + "px";
        delRow.style.top = cellRect.top + cellRect.height / 2 - 11 + "px";
        delRow.dataset.tableId = table.dataset.notionTableId;
        delRow.dataset.rowIndex = String(rowIndex);
        delRow.dataset.colIndex = String(colIndex);
      }

      ui.classList.add("visible");
      if (actionMenuTrigger) showActionMenu(actionMenuTrigger);
    }

    function findTableById(tableId) {
      if (!tableId) return null;
      return editArea.querySelector(
        'table[data-notion-table-id="' + tableId + '"]',
      );
    }

    function ensureActionMenu() {
      if (!ui || actionMenu) return;
      actionMenu = document.createElement("div");
      actionMenu.className = "notion-ui-action-menu";
      actionMenu.style.display = "none";
      actionMenu.addEventListener("mousedown", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      actionMenu.addEventListener("click", function (e) {
        var item = e.target.closest(".notion-ui-menu-btn");
        if (!item) return;
        if (item.disabled || item.getAttribute("aria-disabled") === "true") return;
        e.preventDefault();
        e.stopPropagation();
        applyMenuAction(item.dataset.cmd || "");
      });
      ui.appendChild(actionMenu);
    }

    function hideActionMenu() {
      if (!actionMenu) return;
      actionMenu.style.display = "none";
      actionMenu.classList.remove("visible");
      actionMenuTrigger = null;
    }

    function replaceCellTag(cell, tagName) {
      if (!cell || !tagName) return cell;
      if ((cell.nodeName || "").toUpperCase() === tagName.toUpperCase()) return cell;
      var next = document.createElement(tagName);
      Array.prototype.slice.call(cell.attributes || []).forEach(function (attr) {
        next.setAttribute(attr.name, attr.value);
      });
      next.innerHTML = cell.innerHTML;
      cell.parentNode.replaceChild(next, cell);
      return next;
    }

    function isColHeaderCell(cell) {
      if (!cell || cell.nodeName !== "TH") return false;
      var scope = (cell.getAttribute("scope") || "").toLowerCase();
      return scope === "" || scope === "col" || scope === "colgroup";
    }

    function isRowHeaderCell(cell) {
      if (!cell || cell.nodeName !== "TH") return false;
      var scope = (cell.getAttribute("scope") || "").toLowerCase();
      return scope === "row" || scope === "rowgroup";
    }

    function hasColHeader(table) {
      if (!table) return false;
      var ths = table.querySelectorAll("th");
      for (var i = 0; i < ths.length; i++) {
        if (isColHeaderCell(ths[i])) return true;
      }
      return false;
    }

    function hasRowHeader(table) {
      if (!table) return false;
      var ths = table.querySelectorAll("th");
      for (var i = 0; i < ths.length; i++) {
        if (isRowHeaderCell(ths[i])) return true;
      }
      return false;
    }

    function isHeaderRowIndex(table, rowIndex) {
      if (!table || rowIndex < 0) return false;
      var rows = table.querySelectorAll("tr");
      if (rowIndex >= rows.length) return false;
      var row = rows[rowIndex];
      if (!row) return false;
      var cells = row.querySelectorAll("th, td");
      for (var i = 0; i < cells.length; i++) {
        if (isColHeaderCell(cells[i])) return true;
      }
      return false;
    }

    function isHeaderColIndex(table, colIndex) {
      if (!table || colIndex < 0) return false;
      var rows = table.querySelectorAll("tr");
      for (var i = 0; i < rows.length; i++) {
        var cell = rows[i].children[colIndex];
        if (isRowHeaderCell(cell)) return true;
      }
      return false;
    }

    function addNotionRowHeader(table, colIndex) {
      if (!table) return;
      if (hasRowHeader(table)) return;
      var rows = table.querySelectorAll("tr");
      if (!rows.length) return;
      // 行見出しは第1列として新規追加する
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row) continue;
        var th = document.createElement("th");
        th.setAttribute("scope", "row");
        th.innerHTML = "<br>";
        row.insertBefore(th, row.firstChild || null);
      }
      // syncColgroup() は不足列を末尾に追加するので、行見出し用の新列を先頭へ移動する
      syncColgroup(table);
      var colgroup = table.querySelector("colgroup");
      if (colgroup && colgroup.children.length > 1) {
        var inserted = colgroup.lastElementChild;
        if (inserted) colgroup.insertBefore(inserted, colgroup.firstElementChild || null);
        var tableWidth = table.getBoundingClientRect().width || 0;
        var headerWidth = Math.max(72, Math.min(120, Math.round(tableWidth * 0.14)));
        if (colgroup.firstElementChild) {
          colgroup.firstElementChild.style.width = headerWidth + "px";
        }
      }
    }

    function addNotionColHeader(table, rowIndex) {
      if (!table) return;
      if (hasColHeader(table)) return;
      var rows = table.querySelectorAll("tr");
      if (!rows.length) return;
      // 列見出しは第1行として新規追加する
      var colCount = 0;
      for (var i = 0; i < rows.length; i++) {
        colCount = Math.max(colCount, rows[i].children.length);
      }
      if (!colCount) return;
      var headerRow = document.createElement("tr");
      for (var j = 0; j < colCount; j++) {
        var th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.innerHTML = "<br>";
        headerRow.appendChild(th);
      }
      var parent = rows[0].parentNode || table;
      parent.insertBefore(headerRow, rows[0]);
      syncColgroup(table);
    }

    function showActionMenu(triggerBtn) {
      if (!ui || !triggerBtn || !triggerBtn.classList.contains("notion-ui-drag")) return;
      ensureActionMenu();
      if (!actionMenu) return;

      var action = triggerBtn.getAttribute("data-action");
      if (action !== "del-col" && action !== "del-row") return;

      actionMenuTrigger = triggerBtn;
      var table = findTableById(triggerBtn.dataset.tableId || "");
      if (!table) return;
      var isCol = action === "del-col";
      var deleteLabel = isCol ? "この列を削除" : "この行を削除";
      var headerLabel = isCol ? "列見出しを追加" : "行見出しを追加";
      var headerExists = isCol ? hasColHeader(table) : hasRowHeader(table);
      var headerDisabledAttr = headerExists ? ' disabled aria-disabled="true"' : "";
      actionMenu.innerHTML =
        '<div class="notion-ui-menu-hint">ドラッグで入れ替え可能</div>' +
        '<button type="button" class="notion-ui-menu-btn" data-cmd="header"' +
        headerDisabledAttr +
        ">" +
        headerLabel +
        (headerExists ? "（追加済み）" : "") +
        "</button>" +
        '<button type="button" class="notion-ui-menu-btn notion-ui-menu-btn-danger" data-cmd="delete">' +
        deleteLabel +
        "</button>";

      actionMenu.style.display = "block";
      actionMenu.classList.add("visible");

      var btnRect = getRectInArea(triggerBtn);
      var menuRect = actionMenu.getBoundingClientRect();
      var left = btnRect.left + btnRect.width + 8;
      var top = btnRect.top - 2;
      var minLeft = editArea.scrollLeft + 8;
      var maxLeft =
        editArea.scrollLeft + editArea.clientWidth - menuRect.width - 8;
      if (left < minLeft) left = minLeft;
      if (left > maxLeft) left = maxLeft;
      var minTop = editArea.scrollTop + 8;
      var maxTop =
        editArea.scrollTop + editArea.clientHeight - menuRect.height - 8;
      if (top < minTop) top = minTop;
      if (top > maxTop) top = maxTop;
      actionMenu.style.left = left + "px";
      actionMenu.style.top = top + "px";
    }

    function applyMenuAction(cmd) {
      if (!actionMenuTrigger || !cmd) return;
      var table = findTableById(actionMenuTrigger.dataset.tableId || "");
      if (!table) return;
      var rowIndex = parseInt(actionMenuTrigger.dataset.rowIndex || "-1", 10);
      var colIndex = parseInt(actionMenuTrigger.dataset.colIndex || "-1", 10);
      var baseCell = getCellByPosition(table, rowIndex, colIndex);
      var action = actionMenuTrigger.getAttribute("data-action");

      if (cmd === "delete" && baseCell) {
        if (action === "del-col") {
          removeNotionCol(table, baseCell);
        } else if (action === "del-row") {
          removeNotionRow(table, baseCell);
        }
      } else if (cmd === "header") {
        if (action === "del-col") {
          addNotionColHeader(table, rowIndex);
        } else if (action === "del-row") {
          addNotionRowHeader(table, colIndex);
        }
      }
      applyAndRestore(table, rowIndex, colIndex);
      hideActionMenu();
    }

    function resolveDropCell(e, tableId) {
      var direct = closestTableCell(e.target, editArea);
      if (direct) return direct;
      var table = findTableById(tableId);
      if (!table) return null;
      var cells = table.querySelectorAll("th, td");
      if (!cells.length) return null;
      var best = null;
      var bestDist = Infinity;
      var x = e.clientX;
      var y = e.clientY;
      cells.forEach(function (c) {
        var r = c.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top + r.height / 2;
        var dx = cx - x;
        var dy = cy - y;
        var d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      });
      return best;
    }

    function clearDragPreview() {
      editArea
        .querySelectorAll(".notion-drag-source-row, .notion-drag-target-row")
        .forEach(function (row) {
          row.classList.remove("notion-drag-source-row");
          row.classList.remove("notion-drag-target-row");
        });
      editArea
        .querySelectorAll(".notion-drag-source-col, .notion-drag-target-col")
        .forEach(function (cell) {
          cell.classList.remove("notion-drag-source-col");
          cell.classList.remove("notion-drag-target-col");
        });
    }

    function showDragPreview(table, hoverCell, drag) {
      clearDragPreview();
      if (!table || !hoverCell || !drag) return;
      var pos = getSelectionPosition(hoverCell, table);
      var rows = Array.prototype.slice.call(table.querySelectorAll("tr"));

      if (drag.type === "row") {
        if (isHeaderRowIndex(table, drag.fromRow)) return;
        if (isHeaderRowIndex(table, pos.row)) return;
        if (drag.fromRow >= 0 && drag.fromRow < rows.length) {
          rows[drag.fromRow].classList.add("notion-drag-source-row");
        }
        if (pos.row >= 0 && pos.row < rows.length) {
          rows[pos.row].classList.add("notion-drag-target-row");
        }
        return;
      }

      if (drag.type === "col") {
        if (isHeaderColIndex(table, drag.fromCol)) return;
        if (isHeaderColIndex(table, pos.col)) return;
        rows.forEach(function (row) {
          if (drag.fromCol >= 0 && drag.fromCol < row.children.length) {
            row.children[drag.fromCol].classList.add("notion-drag-source-col");
          }
          if (pos.col >= 0 && pos.col < row.children.length) {
            row.children[pos.col].classList.add("notion-drag-target-col");
          }
        });
      }
    }

    function getSelectionPosition(cell, table) {
      var row = cell.parentNode;
      var rows = table.querySelectorAll("tr");
      return {
        row: Array.prototype.indexOf.call(rows, row),
        col: Array.prototype.indexOf.call(row.children, cell),
      };
    }

    function getCellByPosition(table, rowIdx, colIdx) {
      var rows = table.querySelectorAll("tr");
      if (!rows.length) return null;
      var safeRow = Math.max(0, Math.min(rowIdx, rows.length - 1));
      var row = rows[safeRow];
      if (!row || !row.children.length) return null;
      var safeCol = Math.max(0, Math.min(colIdx, row.children.length - 1));
      return row.children[safeCol];
    }

    function applyAndRestore(table, rowIdx, colIdx) {
      if (!table) return;
      applyNotionTable(table);
      var next = getCellByPosition(table, rowIdx, colIdx);
      setSelectedCell(next);
    }

    if (ui) {
      ui.addEventListener("dragstart", function (e) {
        var btn = e.target.closest(".notion-ui-drag");
        if (!btn) return;
        hideActionMenu();
        var action = btn.getAttribute("data-action");
        var table = findTableById(btn.dataset.tableId || "");
        var fromRow = parseInt(btn.dataset.rowIndex || "-1", 10);
        var fromCol = parseInt(btn.dataset.colIndex || "-1", 10);
        if (!table) return;
        if (action === "del-row" && isHeaderRowIndex(table, fromRow)) {
          e.preventDefault();
          return;
        }
        if (action === "del-col" && isHeaderColIndex(table, fromCol)) {
          e.preventDefault();
          return;
        }
        editArea._notionDrag = {
          type: action === "del-col" ? "col" : "row",
          tableId: btn.dataset.tableId || "",
          fromRow: fromRow,
          fromCol: fromCol,
        };
        try {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "move");
        } catch (_e) {}
        ui.classList.add("dragging");
        var activeCell = editArea._activeNotionCell;
        if (activeCell) {
          var activeTable = closestTable(activeCell, editArea);
          showDragPreview(activeTable, activeCell, editArea._notionDrag);
        }
      });
      ui.addEventListener("dragend", function () {
        editArea._notionDrag = null;
        ui.classList.remove("dragging");
        editArea._notionDragEndedAt = Date.now();
        clearDragPreview();
      });
      ui.addEventListener("mousedown", function (e) {
        var btn = e.target.closest(".notion-ui-btn");
        if (!btn) return;
        if (btn.classList.contains("notion-ui-drag")) {
          return;
        }
        e.preventDefault();
      });
      ui.addEventListener("click", function (e) {
        var btn = e.target.closest(".notion-ui-btn");
        if (!btn) return;
        if (
          editArea._notionDragEndedAt &&
          Date.now() - editArea._notionDragEndedAt < 160
        ) {
          return;
        }
        var cell = editArea._activeNotionCell;
        if (!cell) return;
        var table = closestTable(cell, editArea);
        if (!table) return;
        var pos = getSelectionPosition(cell, table);
        var action = btn.getAttribute("data-action");
        if (action === "add-col") addNotionCol(table);
        if (action === "add-row") addNotionRow(table);
        if (action === "del-col" || action === "del-row") {
          showActionMenu(btn);
          return;
        }
        applyAndRestore(table, pos.row, pos.col);
        hideActionMenu();
      });
      ui.addEventListener("mouseover", function (e) {
        if (editArea._notionDrag) return;
        var btn = e.target.closest(".notion-ui-drag");
        if (!btn || !ui.contains(btn)) return;
        showActionMenu(btn);
      });
    }

    editArea.addEventListener("click", function (e) {
      var target = e.target;
      if (!target) return;
      if (ui && ui.contains(target)) return;
      hideActionMenu();
      var cell = closestTableCell(target, editArea);
      setSelectedCell(cell);
    });

    editArea.addEventListener("keyup", function () {
      var cell = getActiveCellFromSelection();
      if (cell) setSelectedCell(cell);
    });

    editArea.addEventListener("focusin", function (e) {
      var target = e.target;
      if (!target) return;
      var cell = closestTableCell(target, editArea);
      if (cell) setSelectedCell(cell);
    });

    editArea.addEventListener("scroll", showUi);
    window.addEventListener("resize", showUi);

    editArea.addEventListener("dragover", function (e) {
      var drag = editArea._notionDrag;
      if (!drag) return;
      var cell = resolveDropCell(e, drag.tableId);
      if (!cell) return;
      var table = closestTable(cell, editArea);
      if (!table || table.dataset.notionTableId !== drag.tableId) return;
      var pos = getSelectionPosition(cell, table);
      if (drag.type === "row") {
        if (isHeaderRowIndex(table, drag.fromRow)) return;
        if (isHeaderRowIndex(table, pos.row)) return;
      } else if (drag.type === "col") {
        if (isHeaderColIndex(table, drag.fromCol)) return;
        if (isHeaderColIndex(table, pos.col)) return;
      }
      e.preventDefault();
      try {
        e.dataTransfer.dropEffect = "move";
      } catch (_e) {}
      showDragPreview(table, cell, drag);
    });

    editArea.addEventListener("drop", function (e) {
      var drag = editArea._notionDrag;
      if (!drag) return;
      var targetCell = resolveDropCell(e, drag.tableId);
      if (!targetCell) return;
      var table = closestTable(targetCell, editArea);
      if (!table || table.dataset.notionTableId !== drag.tableId) return;
      e.preventDefault();

      var pos = getSelectionPosition(targetCell, table);
      if (drag.type === "row") {
        if (isHeaderRowIndex(table, drag.fromRow) || isHeaderRowIndex(table, pos.row)) {
          clearDragPreview();
          editArea._notionDrag = null;
          if (ui) ui.classList.remove("dragging");
          return;
        }
        if (drag.fromRow >= 0 && pos.row >= 0 && drag.fromRow !== pos.row) {
          moveNotionRow(table, drag.fromRow, pos.row);
        }
      } else if (drag.type === "col") {
        if (isHeaderColIndex(table, drag.fromCol) || isHeaderColIndex(table, pos.col)) {
          clearDragPreview();
          editArea._notionDrag = null;
          if (ui) ui.classList.remove("dragging");
          return;
        }
        if (drag.fromCol >= 0 && pos.col >= 0 && drag.fromCol !== pos.col) {
          moveNotionCol(table, drag.fromCol, pos.col);
        }
      }
      applyAndRestore(table, pos.row, pos.col);
      editArea._notionDrag = null;
      if (ui) ui.classList.remove("dragging");
      clearDragPreview();
    });

    editArea.addEventListener("mousedown", function (e) {
      var target = e.target;
      if (target && target.classList.contains("notion-col-resizer")) {
        e.preventDefault();
        e.stopPropagation();
        startNotionResize(e, editArea);
        var cell = closestTableCell(target, editArea);
        if (cell) setSelectedCell(cell);
        return;
      }
      if (ui && ui.contains(target)) return;
      if (!closestTableCell(target, editArea)) {
        clearSelectedCell();
        hideUi();
      }
    });
  }

  function startNotionResize(e, root) {
    var handle = e.target;
    var cell = closestTableCell(handle, root);
    if (!cell) return;
    var table = closestTable(cell, root);
    if (!table) return;
    syncColgroup(table);

    var row = cell.parentNode;
    var colIndex = Array.prototype.indexOf.call(row.children, cell);
    var edge = handle.dataset.edge || "right";
    var boundaryIndex = edge === "left" ? colIndex - 1 : colIndex;
    if (boundaryIndex < 0) return;

    var cols = Array.prototype.slice.call(table.querySelectorAll("col"));
    if (boundaryIndex >= cols.length) return;

    var firstRow = table.querySelector("tr");
    if (!firstRow) return;
    var firstCells = Array.prototype.slice.call(
      firstRow.querySelectorAll("th, td"),
    );
    if (!firstCells.length) return;

    // Freeze current layout to pixels so only the grabbed boundary moves.
    var widths = firstCells.map(function (c) {
      return c.getBoundingClientRect().width;
    });
    var tableStartWidth = table.getBoundingClientRect().width;
    table.style.width = tableStartWidth + "px";
    table.style.maxWidth = "none";
    cols.forEach(function (c, idx) {
      var w = widths[idx] || 80;
      c.style.width = Math.max(40, w) + "px";
    });

    var curCol = cols[boundaryIndex];
    if (!curCol) return;
    var nextCol = cols[boundaryIndex + 1] || null;
    var startX = e.clientX;
    var startCurWidth =
      parseFloat(curCol.style.width) || widths[boundaryIndex] || 80;
    var startNextWidth = nextCol
      ? parseFloat(nextCol.style.width) || widths[boundaryIndex + 1] || 80
      : 0;
    var minWidth = 60;

    function onMove(ev) {
      var delta = ev.clientX - startX;
      if (nextCol) {
        var total = startCurWidth + startNextWidth;
        var nextMin = minWidth;
        var newCur = Math.max(
          minWidth,
          Math.min(total - nextMin, startCurWidth + delta),
        );
        var newNext = total - newCur;
        curCol.style.width = newCur + "px";
        nextCol.style.width = newNext + "px";
      } else {
        var newWidth = Math.max(minWidth, startCurWidth + delta);
        curCol.style.width = newWidth + "px";
        table.style.width =
          Math.max(200, tableStartWidth + (newWidth - startCurWidth)) + "px";
      }
      table.style.tableLayout = "fixed";
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function addNotionRow(table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll("tr"));
    if (!rows.length) return;
    var colCount = rows.reduce(function (max, r) {
      return Math.max(max, r.children.length);
    }, 0);
    if (!colCount) return;
    var hasRowHeader = rows.some(function (r) {
      var first = r.children[0];
      if (!first || first.nodeName !== "TH") return false;
      var scope = (first.getAttribute("scope") || "").toLowerCase();
      return scope === "row" || scope === "rowgroup";
    });
    var tbody = table.querySelector("tbody") || table;
    var newRow = document.createElement("tr");
    for (var i = 0; i < colCount; i++) {
      var isRowHeaderCell = hasRowHeader && i === 0;
      var cell = document.createElement(isRowHeaderCell ? "th" : "td");
      if (isRowHeaderCell) cell.setAttribute("scope", "row");
      cell.innerHTML = "<br>";
      newRow.appendChild(cell);
    }
    tbody.appendChild(newRow);
    syncColgroup(table);
  }

  function addNotionCol(table) {
    var rows = table.querySelectorAll("tr");
    rows.forEach(function (row) {
      var isHeaderRow = Array.prototype.slice
        .call(row.querySelectorAll("th, td"))
        .some(function (c) {
          if (!c || c.nodeName !== "TH") return false;
          var scope = (c.getAttribute("scope") || "").toLowerCase();
          return scope === "" || scope === "col" || scope === "colgroup";
        });
      var cell = document.createElement(isHeaderRow ? "th" : "td");
      if (isHeaderRow) cell.setAttribute("scope", "col");
      cell.innerHTML = "<br>";
      row.appendChild(cell);
    });
    syncColgroup(table);
  }

  function removeNotionRow(table, cell) {
    if (!table || !cell) return;
    var rows = table.querySelectorAll("tr");
    if (rows.length <= 1) return;
    var row = cell.parentNode;
    row.parentNode.removeChild(row);
    syncColgroup(table);
  }

  function removeNotionCol(table, cell) {
    if (!table || !cell) return;
    var row = cell.parentNode;
    var colIndex = Array.prototype.indexOf.call(row.children, cell);
    var firstRow = table.querySelector("tr");
    if (!firstRow || firstRow.children.length <= 1) return;
    var rows = table.querySelectorAll("tr");
    rows.forEach(function (r) {
      if (r.children[colIndex]) r.removeChild(r.children[colIndex]);
    });
    syncColgroup(table);
  }

  function moveNotionRow(table, fromIndex, toIndex) {
    var rows = Array.prototype.slice.call(table.querySelectorAll("tr"));
    if (!rows.length) return;
    if (fromIndex < 0 || fromIndex >= rows.length) return;
    if (toIndex < 0 || toIndex >= rows.length) return;
    if (fromIndex === toIndex) return;
    var fromRow = rows[fromIndex];
    var toRow = rows[toIndex];
    if (!fromRow || !toRow || fromRow === toRow) return;
    if (fromIndex < toIndex) {
      toRow.parentNode.insertBefore(fromRow, toRow.nextSibling);
    } else {
      toRow.parentNode.insertBefore(fromRow, toRow);
    }
  }

  function moveNotionCol(table, fromIndex, toIndex) {
    var rows = table.querySelectorAll("tr");
    if (!rows.length) return;
    if (fromIndex < 0 || toIndex < 0) return;
    rows.forEach(function (row) {
      var cells = Array.prototype.slice.call(row.children);
      if (fromIndex >= cells.length || toIndex >= cells.length) return;
      var fromCell = cells[fromIndex];
      var toCell = cells[toIndex];
      if (!fromCell || !toCell || fromCell === toCell) return;
      if (fromIndex < toIndex) {
        row.insertBefore(fromCell, toCell.nextSibling);
      } else {
        row.insertBefore(fromCell, toCell);
      }
    });

    var cols = table.querySelectorAll("colgroup col");
    if (cols.length > Math.max(fromIndex, toIndex)) {
      var colgroup = table.querySelector("colgroup");
      var fromCol = cols[fromIndex];
      var toCol = cols[toIndex];
      if (colgroup && fromCol && toCol) {
        if (fromIndex < toIndex) {
          colgroup.insertBefore(fromCol, toCol.nextSibling);
        } else {
          colgroup.insertBefore(fromCol, toCol);
        }
      }
    }
  }

  function serializeTable(table) {
    var clone = table.cloneNode(true);
    clone.removeAttribute("data-resizable");
    clone.removeAttribute("data-resizable-ready");
    clone.classList.remove("notion-table");
    clone.querySelectorAll(".notion-col-resizer").forEach(function (el) {
      el.parentNode.removeChild(el);
    });
    clone.querySelectorAll(".notion-table-cell").forEach(function (wrapper) {
      var cell = wrapper.closest("th, td");
      if (!cell) return;
      var text = wrapper.querySelector(".notion-table-cell-text");
      cell.innerHTML = text ? text.innerHTML : "";
    });
    var tableStyle = [];
    if (table.style.tableLayout)
      tableStyle.push("table-layout:" + table.style.tableLayout);
    if (table.style.width) tableStyle.push("width:" + table.style.width);
    if (tableStyle.length) {
      clone.setAttribute("style", tableStyle.join(";"));
    } else {
      clone.removeAttribute("style");
    }
    clone.querySelectorAll("th, td").forEach(function (cell) {
      var align = cell.style.textAlign || cell.getAttribute("align") || "";
      var width = cell.style.width || "";
      var styleParts = [];
      if (align) styleParts.push("text-align:" + align);
      if (width) styleParts.push("width:" + width);
      if (styleParts.length) {
        cell.setAttribute("style", styleParts.join(";"));
      } else {
        cell.removeAttribute("style");
      }
      cell.removeAttribute("align");
      cell.removeAttribute("class");
    });
    clone.querySelectorAll("col").forEach(function (col) {
      var width = col.style.width || "";
      if (width) {
        col.setAttribute("style", "width:" + width);
      } else {
        col.removeAttribute("style");
      }
      col.removeAttribute("class");
    });
    return "\n" + clone.outerHTML + "\n";
  }

  /* ---- HTMLサニタイズ（ペースト用）---- */

  function sanitizeHtml(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var allowed = [
      "P",
      "BR",
      "B",
      "STRONG",
      "I",
      "EM",
      "S",
      "DEL",
      "U",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "UL",
      "OL",
      "LI",
      "A",
      "IMG",
      "CODE",
      "PRE",
      "MARK",
      "SPAN",
      "LABEL",
      "INPUT",
      "TABLE",
      "THEAD",
      "TBODY",
      "TR",
      "TH",
      "TD",
      "COLGROUP",
      "COL",
      "FIGURE",
      "FIGCAPTION",
      "BLOCKQUOTE",
      "HR",
      "DIV",
      "FONT",
      "DETAILS",
      "SUMMARY",
    ];

    function clean(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (child) {
        if (child.nodeType === 1) {
          if (allowed.indexOf(child.nodeName) === -1) {
            while (child.firstChild) node.insertBefore(child.firstChild, child);
            node.removeChild(child);
          } else {
            if (child.nodeName === "INPUT") {
              var inputType = (child.getAttribute("type") || "").toLowerCase();
              if (inputType !== "checkbox") {
                node.removeChild(child);
                return;
              }
              child.setAttribute("type", "checkbox");
            }
            if (
              [
                "MARK",
                "SPAN",
                "FONT",
                "DIV",
                "P",
                "FIGURE",
                "FIGCAPTION",
                "BLOCKQUOTE",
              ].indexOf(child.nodeName) === -1
            ) {
              child.removeAttribute("style");
              child.removeAttribute("class");
            }
            clean(child);
          }
        }
      });
    }
    clean(div);
    return div.innerHTML;
  }

  /* ---- ユーティリティ ---- */

  function wrapIndent(el, md) {
    var indent = el.style ? el.style.marginLeft : "";
    var indentLevel = getIndentLevelAttr(el);
    if (indent) {
      return (
        '\n<div style="margin-left:' +
        indent +
        '" markdown="1"' +
        (indentLevel > 0
          ? ' data-indent-level="' + String(indentLevel) + '"'
          : "") +
        ">\n" +
        md +
        "\n\n</div>\n"
      );
    }
    return md;
  }

  function getIndentLevelAttr(el) {
    if (!el || !el.getAttribute) return 0;
    var raw = (el.getAttribute("data-indent-level") || "").trim();
    if (!raw) return 0;
    var n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function preserveLeadingWhitespaceMarkdown(text) {
    return String(text || "")
      .split("\n")
      .map(function (line) {
        var m = line.match(/^[ \t\u3000\u00A0]+/);
        if (!m) return line;
        var lead = m[0]
          .replace(/\u00A0/g, "&nbsp;")
          .replace(/ /g, "&nbsp;")
          .replace(/\t/g, "&nbsp;&nbsp;")
          .replace(/\u3000/g, "&#x3000;");
        return lead + line.slice(m[0].length);
      })
      .join("\n");
  }

  function isVisualBlankMarkdown(text) {
    if (!text) return true;
    var compact = String(text)
      .replace(/\n/g, "")
      .replace(/\u00A0/g, "")
      .replace(/&nbsp;/gi, "")
      .replace(/&#x3000;/gi, "")
      .replace(/\u3000/g, "")
      .trim();
    return compact === "";
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
