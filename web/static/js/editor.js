/* LF リンローマニュアル WYSIWYG エディタ - 編集可能 */

(function () {
    'use strict';

    /* ---- ツールバーアイコン (SVG) ---- */

    var ICONS = {
        bold: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2.5h5a3 3 0 010 6H4V2.5z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/><path d="M4 8.5h5.5a3 3 0 010 6H4V8.5z" fill="currentColor" stroke="currentColor" stroke-width="0.5" stroke-linejoin="round"/></svg>',
        italic: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14l4-12M5 14h4M7 2h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        strikethrough: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10.5 4.5c0-1.5-1.3-2.5-3-2.5S4.5 3 4.5 4.5c0 1 .6 1.8 1.5 2.2M5.5 11.5c0 1.5 1.3 2.5 3 2.5s3-1 3-2.5c0-1-.6-1.8-1.5-2.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        h1: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 3v10M1.5 8h5.5M7 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="9.5" y="13" font-size="8" font-weight="bold" fill="currentColor">1</text></svg>',
        h2: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 3v10M1.5 8h5.5M7 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="9.5" y="13" font-size="8" font-weight="bold" fill="currentColor">2</text></svg>',
        h3: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 3v10M1.5 8h5.5M7 3v10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><text x="9.5" y="13" font-size="8" font-weight="bold" fill="currentColor">3</text></svg>',
        paragraph: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 13.5V2.5h2m0 11V2.5m0 0h2.5M6.5 2.5a3.5 3.5 0 100 7h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        ul: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="4" r="1.2" fill="currentColor"/><circle cx="3" cy="8" r="1.2" fill="currentColor"/><circle cx="3" cy="12" r="1.2" fill="currentColor"/><path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        ol: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><text x="1.5" y="5.5" font-size="5.5" font-weight="bold" fill="currentColor">1</text><text x="1.5" y="9.5" font-size="5.5" font-weight="bold" fill="currentColor">2</text><text x="1.5" y="13.5" font-size="5.5" font-weight="bold" fill="currentColor">3</text><path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        blockquote: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3v10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/><path d="M6.5 5h7M6.5 8h5M6.5 11h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        code: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 4L1.5 8 5 12M11 4l3.5 4L11 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        codeblock: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M5 6L3 8l2 2M11 6l2 2-2 2M7.5 5.5l1 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        link: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 9.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M9.5 6.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        image: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><circle cx="5" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11l3-3 2.5 2.5L10 7.5l4.5 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        table: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 6h13M1.5 10h13M6 6v8M10.5 6v8" stroke="currentColor" stroke-width="1.2"/></svg>',
        hr: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
        textColor: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 12L8 2.5 12.5 12M5 9h6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><rect class="tb-color-bar" x="2" y="13.5" width="12" height="2" rx="0.5" fill="currentColor"/></svg>',
        highlight: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect class="tb-highlight-bar" x="1" y="13" width="14" height="2.5" rx="0.5" fill="#fef08a"/><path d="M10.5 2.5l3 3-7 7H3.5v-3l7-7z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
        noteInfo: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#3b82f6" stroke-width="1.3"/><path d="M8 7v4.5M8 5v.5" stroke="#3b82f6" stroke-width="1.6" stroke-linecap="round"/></svg>',
        noteWarn: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L1 14h14L8 1.5z" stroke="#d97706" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6v4M8 11.5v.5" stroke="#d97706" stroke-width="1.5" stroke-linecap="round"/></svg>',
        noteImportant: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#7c3aed" stroke-width="1.3"/><path d="M8 4.5v5M8 11v.5" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round"/></svg>',
        noteTip: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6.5" r="4.5" stroke="#059669" stroke-width="1.3"/><path d="M6 11v1.5a2 2 0 004 0V11" stroke="#059669" stroke-width="1.3"/><path d="M6 13.5h4" stroke="#059669" stroke-width="1.2" stroke-linecap="round"/></svg>',
        checkbox: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 8.5l2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        alignLeft: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 6.5h8M2 10h10M2 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
        alignCenter: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M4 6.5h8M3 10h10M5 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
        alignRight: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M6 6.5h8M4 10h10M8 13.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
    };

    /* ---- ツールバー定義 ---- */

    var TOOLS = [
        { id: 'paragraph', title: '本文', icon: 'paragraph', block: 'p' },
        '|',
        { id: 'bold', title: '太字', icon: 'bold', cmd: 'bold' },
        { id: 'italic', title: '斜体', icon: 'italic', cmd: 'italic' },
        { id: 'strikethrough', title: '取り消し線', icon: 'strikethrough', cmd: 'strikeThrough' },
        '|',
        { id: 'h1', title: '見出し1', icon: 'h1', block: 'h1' },
        { id: 'h2', title: '見出し2', icon: 'h2', block: 'h2' },
        { id: 'h3', title: '見出し3', icon: 'h3', block: 'h3' },
        '|',
        { id: 'ul', title: '箇条書きリスト', icon: 'ul', cmd: 'insertUnorderedList' },
        { id: 'ol', title: '番号付きリスト', icon: 'ol', cmd: 'insertOrderedList' },
        { id: 'checkbox', title: 'チェックボックス', icon: 'checkbox', custom: 'checkbox' },
        '|',
        { id: 'alignLeft', title: '左揃え', icon: 'alignLeft', cmd: 'justifyLeft' },
        { id: 'alignCenter', title: '中央揃え', icon: 'alignCenter', cmd: 'justifyCenter' },
        { id: 'alignRight', title: '右揃え', icon: 'alignRight', cmd: 'justifyRight' },
        '|',
        { id: 'blockquote', title: '引用ブロック', icon: 'blockquote', block: 'blockquote' },
        { id: 'code', title: 'インラインコード', icon: 'code', custom: 'code' },
        { id: 'codeblock', title: 'コードブロック', icon: 'codeblock', custom: 'codeblock' },
        '|',
        { id: 'textColor', title: '文字色', icon: 'textColor', custom: 'textColor' },
        { id: 'highlight', title: 'ハイライト', icon: 'highlight', custom: 'highlight' },
        '|',
        { id: 'noteInfo', title: 'ノート（情報）', icon: 'noteInfo', custom: 'noteInfo' },
        { id: 'noteWarn', title: 'ノート（警告）', icon: 'noteWarn', custom: 'noteWarn' },
        { id: 'noteImportant', title: 'ノート（重要）', icon: 'noteImportant', custom: 'noteImportant' },
        { id: 'noteTip', title: 'ノート（ヒント）', icon: 'noteTip', custom: 'noteTip' },
        '|',
        { id: 'link', title: 'リンク挿入', icon: 'link', custom: 'link' },
        { id: 'image', title: '画像挿入', icon: 'image', custom: 'image' },
        { id: 'table', title: 'テーブル挿入', icon: 'table', custom: 'table' },
        '|',
        { id: 'hr', title: '水平線', icon: 'hr', custom: 'hr' }
    ];

    var TOOL_TIPS = {
        paragraph: '本文を挿入',
        bold: '太字のテキストを挿入',
        italic: '斜体のテキストを挿入',
        strikethrough: '取り消し線のテキストを挿入',
        h1: '見出し1を挿入',
        h2: '見出し2を挿入',
        h3: '見出し3を挿入',
        ul: '箇条書きリストを挿入',
        ol: '番号付きリストを挿入',
        checkbox: 'チェックボックスを挿入',
        alignLeft: '左揃えの段落を作成',
        alignCenter: '中央揃えの段落を作成',
        alignRight: '右揃えの段落を作成',
        blockquote: '引用ブロックを挿入',
        code: 'インラインコードを挿入',
        codeblock: 'コードブロックを挿入',
        textColor: '文字色を指定して挿入',
        highlight: 'ハイライトを挿入',
        noteInfo: 'ノート（情報）を挿入',
        noteWarn: 'ノート（警告）を挿入',
        noteImportant: 'ノート（重要）を挿入',
        noteTip: 'ノート（ヒント）を挿入',
        link: 'リンクを挿入',
        image: '画像を挿入',
        table: 'テーブルを挿入',
        hr: '水平線を挿入'
    };

    /* ---- カラーパレット ---- */

    var TEXT_COLORS = [
        { label: '黒', value: '#1e293b' },
        { label: '赤', value: '#dc2626' },
        { label: '青', value: '#2563eb' },
        { label: '緑', value: '#16a34a' },
        { label: '紫', value: '#7c3aed' },
        { label: 'オレンジ', value: '#ea580c' },
        { label: 'ピンク', value: '#db2777' },
        { label: 'グレー', value: '#6b7280' }
    ];

    var HIGHLIGHT_COLORS = [
        { label: '黄色', value: '#fef08a' },
        { label: '緑', value: '#bbf7d0' },
        { label: '青', value: '#bfdbfe' },
        { label: 'ピンク', value: '#fecdd3' },
        { label: '紫', value: '#e9d5ff' },
        { label: 'オレンジ', value: '#fed7aa' },
        { label: 'なし', value: '' }
    ];

    /* ---- ノートタイプ定義 ---- */

    var NOTE_TYPES = {
        info:      { label: '情報', mdTag: 'NOTE' },
        warning:   { label: '注意', mdTag: 'WARNING' },
        important: { label: '重要', mdTag: 'IMPORTANT' },
        tip:       { label: 'ヒント', mdTag: 'TIP' }
    };

    /* ---- エディタ初期化 ---- */

    window.initWysiwygEditor = function (textareaId, initialHtml) {
        var textarea = document.getElementById(textareaId);
        if (!textarea) return;

        textarea.style.display = 'none';

        var currentTextColor = '#1e293b';
        var currentHighlightColor = '#fef08a';

        var editorWrap = document.createElement('div');
        editorWrap.className = 'wysiwyg-editor';

        // ツールバー
        var toolbar = document.createElement('div');
        toolbar.className = 'wysiwyg-toolbar';

        var textColorBtn = null;
        var highlightBtn = null;

        TOOLS.forEach(function (tool) {
            if (tool === '|') {
                var sep = document.createElement('span');
                sep.className = 'wysiwyg-toolbar-sep';
                toolbar.appendChild(sep);
                return;
            }

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'wysiwyg-toolbar-btn';
            var tipText = TOOL_TIPS[tool.id] || tool.title;
            btn.title = tipText;
            btn.setAttribute('aria-label', tipText);
            btn.dataset.tip = tipText;
            btn.dataset.toolId = tool.id;

            if (tool.icon && ICONS[tool.icon]) {
                btn.innerHTML = ICONS[tool.icon];
            }

            if (tool.id === 'textColor') textColorBtn = btn;
            if (tool.id === 'highlight') highlightBtn = btn;

            btn.addEventListener('mousedown', function (e) {
                e.preventDefault();
            });

            btn.addEventListener('click', function (e) {
                e.preventDefault();
                execTool(tool, btn);
            });

            toolbar.appendChild(btn);
        });

        // contentEditable 本文エリア
        var editArea = document.createElement('div');
        editArea.className = 'wysiwyg-content page-body';
        editArea.contentEditable = 'true';
        editArea.innerHTML = initialHtml || '';

        if (!editArea.innerHTML.trim()) {
            editArea.innerHTML = '<p><br></p>';
        }

        // 既存ノートタイトルを編集不可にする
        makeNoteTitlesReadOnly(editArea);

        editorWrap.appendChild(toolbar);
        editorWrap.appendChild(editArea);
        textarea.parentNode.insertBefore(editorWrap, textarea);

        // フォーム送信時にHTMLをMarkdownに変換
        var form = textarea.closest('form');
        if (form) {
            form.addEventListener('submit', function () {
                textarea.value = htmlToMarkdown(editArea.innerHTML);
            });
        }

        // ペースト: サニタイズ
        editArea.addEventListener('paste', function (e) {
            e.preventDefault();
            var html = e.clipboardData.getData('text/html');
            var text = e.clipboardData.getData('text/plain');
            if (html) {
                var cleaned = sanitizeHtml(html);
                document.execCommand('insertHTML', false, cleaned);
                makeNoteTitlesReadOnly(editArea);
            } else if (text) {
                document.execCommand('insertText', false, text);
            }
        });

        // Backspace: ブロック先頭でインデントがあれば先にインデントを解除
        editArea.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace') {
                var sel = window.getSelection();
                if (!sel.rangeCount || !sel.isCollapsed) return;

                // カーソルがブロック先頭にあるか判定
                var block = sel.anchorNode;
                while (block && block !== editArea && !isBlockElement(block)) {
                    block = block.parentNode;
                }
                if (!block || block === editArea) return;

                var indent = parseInt(block.style.marginLeft, 10) || 0;
                if (indent <= 0) return;

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
                    var newIndent = Math.max(0, indent - 32);
                    block.style.marginLeft = newIndent ? newIndent + 'px' : '';
                    return;
                }
            }
        });

        // Enterキー制御
        editArea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                var sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    var node = sel.anchorNode;
                    while (node && node !== editArea) {
                        if (node.nodeName === 'LI' || node.nodeName === 'UL' || node.nodeName === 'OL') return;
                        if (node.nodeName === 'PRE') return;
                        node = node.parentNode;
                    }
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
                if (block && block.nodeName !== 'P') {
                    var content = block.textContent || '';
                    if (content.trim() === '') {
                        e.preventDefault();
                        var p = document.createElement('p');
                        p.innerHTML = '<br>';
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
            if (e.key === 'Tab') {
                e.preventDefault();
                var sel = window.getSelection();
                if (!sel.rangeCount) return;

                // LI内かチェック
                var li = null;
                var node = sel.anchorNode;
                while (node && node !== editArea) {
                    if (node.nodeName === 'LI') { li = node; break; }
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
                    var current = parseInt(block.style.marginLeft, 10) || 0;
                    if (e.shiftKey) {
                        block.style.marginLeft = Math.max(0, current - 32) ? Math.max(0, current - 32) + 'px' : '';
                    } else {
                        block.style.marginLeft = (current + 32) + 'px';
                    }
                }
            }
        });

        /* ---- Markdown記法の自動変換 ---- */

        editArea.addEventListener('input', function () {
            var sel = window.getSelection();
            if (!sel.rangeCount || !sel.isCollapsed) return;

            var anchorNode = sel.anchorNode;
            if (!anchorNode || anchorNode.nodeType !== 3) return;

            var text = anchorNode.textContent;
            var offset = sel.anchorOffset;

            // 現在のブロック要素を取得
            var block = anchorNode.parentNode;
            while (block && block !== editArea && !isBlockElement(block)) {
                block = block.parentNode;
            }
            if (!block || block === editArea) return;
            // リスト内やPRE内では変換しない
            if (isInsideTag(block, editArea, ['LI', 'PRE', 'CODE'])) return;

            // テキストノードがブロックの最初のテキストかチェック
            var firstText = getFirstTextNode(block);
            if (firstText !== anchorNode) return;

            var converted = false;

            // # + スペース → H1〜H6
            var headingMatch = text.match(/^(#{1,6})\s/);
            if (headingMatch) {
                var level = headingMatch[1].length;
                var rest = text.substring(headingMatch[0].length);
                converted = convertBlock(block, 'H' + level, rest, sel);
            }

            // - + スペース または * + スペース → 箇条書きリスト
            if (!converted && /^[-*]\s/.test(text)) {
                var rest = text.substring(2);
                converted = convertBlockToList(block, 'UL', rest, sel);
            }

            // 1. + スペース → 番号付きリスト
            if (!converted && /^\d+\.\s/.test(text)) {
                var match = text.match(/^\d+\.\s/);
                var rest = text.substring(match[0].length);
                converted = convertBlockToList(block, 'OL', rest, sel);
            }

            // > + スペース → 引用ブロック
            if (!converted && /^>\s/.test(text)) {
                var rest = text.substring(2);
                converted = convertBlock(block, 'BLOCKQUOTE', rest, sel);
            }

            // ``` → コードブロック
            if (!converted && /^```$/.test(text.trim())) {
                block.innerHTML = '<pre><code>コードを入力</code></pre>';
                // PRE内のcodeにカーソルを移動
                var codeEl = block.querySelector('code');
                if (codeEl) {
                    var range = document.createRange();
                    range.selectNodeContents(codeEl);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                // blockがP等ならPREに置き換える
                if (block.nodeName !== 'PRE') {
                    var pre = block.querySelector('pre');
                    if (pre) {
                        block.parentNode.replaceChild(pre, block);
                        // 後続に空pを追加
                        var newP = document.createElement('p');
                        newP.innerHTML = '<br>';
                        pre.parentNode.insertBefore(newP, pre.nextSibling);
                    }
                }
                converted = true;
            }

            // --- → 水平線
            if (!converted && /^---$/.test(text.trim())) {
                var hr = document.createElement('hr');
                var newP = document.createElement('p');
                newP.innerHTML = '<br>';
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
        });

        function isBlockElement(el) {
            var blocks = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
                          'BLOCKQUOTE', 'PRE', 'LI', 'UL', 'OL'];
            return blocks.indexOf(el.nodeName) !== -1;
        }

        function isInsideTag(el, root, tags) {
            var node = el;
            while (node && node !== root) {
                if (tags.indexOf(node.nodeName) !== -1) return true;
                node = node.parentNode;
            }
            return false;
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
            newEl.textContent = content;
            block.parentNode.replaceChild(newEl, block);
            // カーソルを末尾に
            var textNode = newEl.firstChild || newEl.appendChild(document.createTextNode(''));
            var range = document.createRange();
            range.setStart(textNode, textNode.length);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return true;
        }

        function convertBlockToList(block, listTag, content, sel) {
            var list = document.createElement(listTag);
            var li = document.createElement('li');
            li.textContent = content;
            list.appendChild(li);
            block.parentNode.replaceChild(list, block);
            // カーソルを末尾に
            var textNode = li.firstChild || li.appendChild(document.createTextNode(''));
            var range = document.createRange();
            range.setStart(textNode, textNode.length);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return true;
        }

        function replaceBlockContent(block, content, sel) {
            block.textContent = content;
            var textNode = block.firstChild || block.appendChild(document.createTextNode(''));
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
            if (!prevLi || prevLi.nodeName !== 'LI') return;

            // 親のリストタイプ(UL/OL)を継承
            var parentList = li.parentNode;
            var listTag = parentList.nodeName; // 'UL' or 'OL'

            // 前のLI内に既にサブリストがあればそこに追加、なければ新規作成
            var subList = null;
            for (var i = prevLi.childNodes.length - 1; i >= 0; i--) {
                var child = prevLi.childNodes[i];
                if (child.nodeType === 1 && (child.nodeName === 'UL' || child.nodeName === 'OL')) {
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
            if (!parentList || (parentList.nodeName !== 'UL' && parentList.nodeName !== 'OL')) return;

            var grandParentLi = parentList.parentNode; // 親のLI
            if (!grandParentLi || grandParentLi.nodeName !== 'LI') return;

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
                textNode = document.createTextNode('');
                if (li.firstChild && (li.firstChild.nodeName === 'UL' || li.firstChild.nodeName === 'OL')) {
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
                var bar = textColorBtn.querySelector('.tb-color-bar');
                if (bar) bar.setAttribute('fill', color);
            }
        }

        function updateHighlightIndicator(color) {
            currentHighlightColor = color || '#fef08a';
            if (highlightBtn) {
                var bar = highlightBtn.querySelector('.tb-highlight-bar');
                if (bar) bar.setAttribute('fill', currentHighlightColor);
            }
        }

        /* ---- カラーピッカーポップアップ ---- */

        var activePopup = null;

        function closePopup() {
            if (activePopup) {
                activePopup.remove();
                activePopup = null;
            }
        }

        document.addEventListener('click', function (e) {
            if (activePopup && !activePopup.contains(e.target)) {
                closePopup();
            }
        }, true);

        function showColorPopup(btn, colors, callback) {
            closePopup();

            var popup = document.createElement('div');
            popup.className = 'wysiwyg-color-popup';

            colors.forEach(function (c) {
                var swatch = document.createElement('button');
                swatch.type = 'button';
                swatch.className = 'wysiwyg-color-swatch';
                swatch.title = c.label;
                if (c.value) {
                    swatch.style.background = c.value;
                } else {
                    swatch.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="#999" stroke-width="1.5"/></svg>';
                    swatch.style.background = '#fff';
                    swatch.style.border = '1px solid #ddd';
                }
                swatch.addEventListener('mousedown', function (e) { e.preventDefault(); });
                swatch.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    callback(c.value);
                    closePopup();
                });
                popup.appendChild(swatch);
            });

            btn.style.position = 'relative';
            btn.appendChild(popup);
            activePopup = popup;
        }

        /* ---- ツール実行 ---- */

        function execTool(tool, btn) {
            editArea.focus();
            if (tool.cmd) { document.execCommand(tool.cmd, false, null); return; }
            if (tool.block) { document.execCommand('formatBlock', false, '<' + tool.block + '>'); return; }
            if (tool.custom) { execCustom(tool.custom, btn); }
        }

        function execCustom(action, btn) {
            var sel = window.getSelection();

            switch (action) {
                case 'code':
                    if (sel.rangeCount > 0 && !sel.isCollapsed) {
                        var range = sel.getRangeAt(0);
                        var text = range.toString();
                        var code = document.createElement('code');
                        code.textContent = text;
                        range.deleteContents();
                        range.insertNode(code);
                        sel.collapseToEnd();
                    } else {
                        document.execCommand('insertHTML', false, '<code>コード</code>');
                    }
                    break;

                case 'codeblock':
                    var codeText = '';
                    if (sel.rangeCount > 0 && !sel.isCollapsed) {
                        codeText = sel.getRangeAt(0).toString();
                        sel.getRangeAt(0).deleteContents();
                    }
                    document.execCommand('insertHTML', false,
                        '<pre><code>' + escapeHtml(codeText || 'コードを入力') + '</code></pre><p><br></p>');
                    break;

                case 'link':
                    var url = prompt('URLを入力してください:', 'https://');
                    if (!url) return;
                    if (sel.rangeCount > 0 && !sel.isCollapsed) {
                        document.execCommand('createLink', false, url);
                    } else {
                        var linkText = prompt('リンクテキスト:', url);
                        document.execCommand('insertHTML', false,
                            '<a href="' + escapeAttr(url) + '">' + escapeHtml(linkText || url) + '</a>');
                    }
                    break;

                case 'image':
                    var imgUrl = prompt('画像URLを入力してください:');
                    if (!imgUrl) return;
                    var alt = prompt('代替テキスト（任意）:', '');
                    document.execCommand('insertHTML', false,
                        '<img src="' + escapeAttr(imgUrl) + '" alt="' + escapeAttr(alt || '') + '">');
                    break;

                case 'table':
                    document.execCommand('insertHTML', false,
                        '<table><thead><tr><th>見出し1</th><th>見出し2</th><th>見出し3</th></tr></thead>' +
                        '<tbody><tr><td>データ1</td><td>データ2</td><td>データ3</td></tr>' +
                        '<tr><td>データ4</td><td>データ5</td><td>データ6</td></tr></tbody></table><p><br></p>');
                    break;

                case 'checkbox':
                    document.execCommand('insertHTML', false,
                        '<p><label class="check-item"><input type="checkbox"> チェック項目</label></p><p><br></p>');
                    break;

                case 'hr':
                    document.execCommand('insertHTML', false, '<hr><p><br></p>');
                    break;

                case 'textColor':
                    showColorPopup(btn, TEXT_COLORS, function (color) {
                        editArea.focus();
                        updateTextColorIndicator(color);
                        if (color === '#1e293b') {
                            document.execCommand('removeFormat', false);
                        } else {
                            document.execCommand('foreColor', false, color);
                        }
                    });
                    break;

                case 'highlight':
                    showColorPopup(btn, HIGHLIGHT_COLORS, function (color) {
                        editArea.focus();
                        if (color) updateHighlightIndicator(color);
                        if (!color) {
                            if (sel.rangeCount > 0 && !sel.isCollapsed) {
                                var r = sel.getRangeAt(0);
                                var markParent = r.commonAncestorContainer;
                                while (markParent && markParent.nodeName !== 'MARK' && markParent !== editArea) {
                                    markParent = markParent.parentNode;
                                }
                                if (markParent && markParent.nodeName === 'MARK') {
                                    var parent = markParent.parentNode;
                                    while (markParent.firstChild) parent.insertBefore(markParent.firstChild, markParent);
                                    parent.removeChild(markParent);
                                }
                            }
                        } else {
                            if (sel.rangeCount > 0 && !sel.isCollapsed) {
                                var rng = sel.getRangeAt(0);
                                var selectedText = rng.toString();
                                var mark = document.createElement('mark');
                                mark.style.backgroundColor = color;
                                mark.textContent = selectedText;
                                rng.deleteContents();
                                rng.insertNode(mark);
                                sel.collapseToEnd();
                            }
                        }
                    });
                    break;

                case 'noteInfo':      insertNote('info');      break;
                case 'noteWarn':      insertNote('warning');   break;
                case 'noteImportant': insertNote('important'); break;
                case 'noteTip':       insertNote('tip');       break;
            }
        }

        function insertNote(type) {
            var info = NOTE_TYPES[type];
            var noteContent = '';
            var sel = window.getSelection();
            if (sel.rangeCount > 0 && !sel.isCollapsed) {
                noteContent = sel.getRangeAt(0).toString();
                sel.getRangeAt(0).deleteContents();
            }
            var noteHtml = '<div class="note note-' + type + '" data-note-type="' + type + '">' +
                '<div class="note-title" contenteditable="false">' + escapeHtml(info.label) + '</div>' +
                '<div class="note-body">' + escapeHtml(noteContent || 'ここにテキストを入力') + '</div>' +
                '</div><p><br></p>';
            document.execCommand('insertHTML', false, noteHtml);
        }

        return { editArea: editArea, toolbar: toolbar };
    };

    /* ---- ノートタイトルを編集不可に ---- */

    function makeNoteTitlesReadOnly(container) {
        var titles = container.querySelectorAll('.note-title');
        for (var i = 0; i < titles.length; i++) {
            titles[i].contentEditable = 'false';
        }
    }

    /* ---- HTML → Markdown 変換 ---- */

    function htmlToMarkdown(html) {
        var container = document.createElement('div');
        container.innerHTML = html;
        return convertNode(container).trim() + '\n';
    }

    function convertNode(node) {
        var result = '';

        for (var i = 0; i < node.childNodes.length; i++) {
            var child = node.childNodes[i];

            if (child.nodeType === 3) {
                result += child.textContent;
                continue;
            }
            if (child.nodeType !== 1) continue;

            var tag = child.nodeName;
            var inner = convertNode(child);

            switch (tag) {
                case 'P':
                    var pAlign = child.style.textAlign || '';
                    var pIndent = child.style.marginLeft || '';
                    if (pAlign && pAlign !== 'left' && pAlign !== 'start') {
                        var pStyle = 'text-align:' + pAlign;
                        if (pIndent) pStyle += ';margin-left:' + pIndent;
                        result += '\n<div style="' + pStyle + '" markdown="1">\n\n' + inner.trim() + '\n\n</div>\n';
                    } else if (pIndent) {
                        result += '\n<div style="margin-left:' + pIndent + '" markdown="1">\n\n' + inner.trim() + '\n\n</div>\n';
                    } else {
                        result += '\n' + inner.trim() + '\n';
                    }
                    break;

                case 'H1': result += wrapIndent(child, '\n# ' + inner.trim() + '\n'); break;
                case 'H2': result += wrapIndent(child, '\n## ' + inner.trim() + '\n'); break;
                case 'H3': result += wrapIndent(child, '\n### ' + inner.trim() + '\n'); break;
                case 'H4': result += wrapIndent(child, '\n#### ' + inner.trim() + '\n'); break;
                case 'H5': result += wrapIndent(child, '\n##### ' + inner.trim() + '\n'); break;
                case 'H6': result += wrapIndent(child, '\n###### ' + inner.trim() + '\n'); break;

                case 'STRONG': case 'B':
                    result += '**' + inner + '**'; break;
                case 'EM': case 'I':
                    result += '*' + inner + '*'; break;
                case 'S': case 'DEL': case 'STRIKE':
                    result += '~~' + inner + '~~'; break;

                case 'CODE':
                    if (child.parentNode && child.parentNode.nodeName === 'PRE') {
                        result += inner;
                    } else {
                        result += '`' + inner + '`';
                    }
                    break;

                case 'PRE':
                    var codeEl = child.querySelector('code');
                    var codeText = codeEl ? codeEl.textContent : child.textContent;
                    result += '\n```\n' + codeText + '\n```\n';
                    break;

                case 'BLOCKQUOTE':
                    var bqLines = inner.trim().split('\n');
                    result += '\n' + bqLines.map(function (l) { return '> ' + l; }).join('\n') + '\n';
                    break;

                case 'UL': result += '\n' + convertList(child, false) + '\n'; break;
                case 'OL': result += '\n' + convertList(child, true) + '\n'; break;
                case 'LI': result += inner; break;

                case 'A':
                    var href = child.getAttribute('href') || '';
                    result += '[' + inner + '](' + href + ')';
                    break;

                case 'IMG':
                    var src = child.getAttribute('src') || '';
                    var altText = child.getAttribute('alt') || '';
                    result += '![' + altText + '](' + src + ')';
                    break;

                case 'TABLE': result += '\n' + convertTable(child) + '\n'; break;
                case 'HR': result += '\n---\n'; break;
                case 'BR': result += '\n'; break;
                case 'LABEL':
                    result += inner;
                    break;
                case 'INPUT':
                    var inputType = (child.getAttribute('type') || '').toLowerCase();
                    if (inputType === 'checkbox') {
                        result += child.checked ? '[x] ' : '[ ] ';
                    }
                    break;

                case 'MARK':
                    var bgColor = child.style.backgroundColor || '';
                    if (bgColor) {
                        result += '<mark style="background-color:' + bgColor + '">' + inner + '</mark>';
                    } else {
                        result += '<mark>' + inner + '</mark>';
                    }
                    break;

                case 'FONT':
                    var fontColor = child.getAttribute('color') || '';
                    if (fontColor) {
                        result += '<span style="color:' + fontColor + '">' + inner + '</span>';
                    } else {
                        result += inner;
                    }
                    break;

                case 'SPAN':
                    var threadId = child.dataset ? child.dataset.threadId : '';
                    if (threadId) {
                        result += '<comment id="' + threadId + '">' + inner + '</comment>';
                    } else {
                        var spanColor = child.style.color || '';
                        if (spanColor) {
                            result += '<span style="color:' + spanColor + '">' + inner + '</span>';
                        } else {
                            result += inner;
                        }
                    }
                    break;

                case 'DIV':
                    var noteType = child.dataset ? child.dataset.noteType : '';
                    if (noteType && NOTE_TYPES[noteType]) {
                        // ノートブロック → > [!TAG] markdown 記法
                        var noteBody = child.querySelector('.note-body');
                        var bodyMd = noteBody ? convertNode(noteBody).trim() : inner.trim();
                        var mdTag = NOTE_TYPES[noteType].mdTag;
                        var bodyLines = bodyMd.split('\n');
                        result += '\n> [!' + mdTag + ']\n' + bodyLines.map(function (l) { return '> ' + l; }).join('\n') + '\n';
                    } else {
                        var divAlign = child.style.textAlign || '';
                        if (divAlign && divAlign !== 'left' && divAlign !== 'start') {
                            result += '\n<div style="text-align:' + divAlign + '" markdown="1">\n\n' + inner.trim() + '\n\n</div>\n';
                        } else {
                            result += '\n' + inner.trim() + '\n';
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
        for (var i = 0; i < ulOrOl.childNodes.length; i++) {
            var li = ulOrOl.childNodes[i];
            if (li.nodeName !== 'LI') continue;
            var parts = [];
            var sublist = '';
            for (var j = 0; j < li.childNodes.length; j++) {
                var c = li.childNodes[j];
                if (c.nodeName === 'UL') {
                    sublist += convertList(c, false).split('\n').map(function (l) { return '  ' + l; }).join('\n');
                } else if (c.nodeName === 'OL') {
                    sublist += convertList(c, true).split('\n').map(function (l) { return '  ' + l; }).join('\n');
                } else {
                    parts.push(c.nodeType === 3 ? c.textContent : convertNode(c));
                }
            }
            var prefix = ordered ? (counter + '. ') : '- ';
            items.push(prefix + parts.join('').trim());
            if (sublist) items.push(sublist);
            counter++;
        }
        return items.join('\n');
    }

    function convertTable(table) {
        var rows = table.querySelectorAll('tr');
        if (rows.length === 0) return '';
        var lines = [];
        var isFirst = true;
        rows.forEach(function (tr) {
            var cells = [];
            tr.querySelectorAll('th, td').forEach(function (td) {
                cells.push(convertNode(td).trim().replace(/\|/g, '\\|'));
            });
            lines.push('| ' + cells.join(' | ') + ' |');
            if (isFirst) {
                lines.push('| ' + cells.map(function () { return '---'; }).join(' | ') + ' |');
                isFirst = false;
            }
        });
        return lines.join('\n');
    }

    /* ---- HTMLサニタイズ（ペースト用）---- */

    function sanitizeHtml(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        var allowed = ['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'S', 'DEL', 'U',
            'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
            'UL', 'OL', 'LI',
            'A', 'IMG', 'CODE', 'PRE', 'MARK', 'SPAN', 'LABEL', 'INPUT',
            'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
            'BLOCKQUOTE', 'HR', 'DIV', 'FONT'];

        function clean(node) {
            var children = Array.prototype.slice.call(node.childNodes);
            children.forEach(function (child) {
                if (child.nodeType === 1) {
                    if (allowed.indexOf(child.nodeName) === -1) {
                        while (child.firstChild) node.insertBefore(child.firstChild, child);
                        node.removeChild(child);
                    } else {
                        if (child.nodeName === 'INPUT') {
                            var inputType = (child.getAttribute('type') || '').toLowerCase();
                            if (inputType !== 'checkbox') {
                                node.removeChild(child);
                                return;
                            }
                            child.setAttribute('type', 'checkbox');
                        }
                        if (['MARK', 'SPAN', 'FONT', 'DIV', 'P'].indexOf(child.nodeName) === -1) {
                            child.removeAttribute('style');
                            child.removeAttribute('class');
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
        var indent = el.style ? el.style.marginLeft : '';
        if (indent) {
            return '\n<div style="margin-left:' + indent + '" markdown="1">\n' + md.trim() + '\n\n</div>\n';
        }
        return md;
    }

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeAttr(text) {
        return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

})();
