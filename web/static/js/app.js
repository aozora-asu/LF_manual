/* WikiSuite JavaScript - 編集可能 */

document.addEventListener('DOMContentLoaded', function () {
    initComments();
    initSidebar();
    initLiveSearch();
});

/* ---- SVG テンプレート ---- */

var SVG = {
    folder: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5h4l1.5 1.5h5.5v8h-11z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    folderOpen: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 2.5h4l1.5 1.5H12v2H3L1 12V2.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M3 6h9.5l-2 6H1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    file: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 1.5h5.5L12 5v7.5H3z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M8.5 1.5V5H12" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>',
    arrow: '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    grip: '<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><circle cx="2" cy="3" r="1.2" fill="currentColor"/><circle cx="6" cy="3" r="1.2" fill="currentColor"/><circle cx="2" cy="7" r="1.2" fill="currentColor"/><circle cx="6" cy="7" r="1.2" fill="currentColor"/><circle cx="2" cy="11" r="1.2" fill="currentColor"/><circle cx="6" cy="11" r="1.2" fill="currentColor"/></svg>',
    check: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6.5l3 3L11 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    more: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1.3" fill="currentColor"/><circle cx="7" cy="7" r="1.3" fill="currentColor"/><circle cx="7" cy="11" r="1.3" fill="currentColor"/></svg>'
};

/* ---- ドラッグ＆ドロップ状態管理 ---- */

var dragState = {
    dragging: null,     // { slug, title, element }
    dropTarget: null    // 現在のドロップ先要素
};

/* ---- ハンバーガーメニュー / サイドバー ---- */

function initSidebar() {
    var btn = document.getElementById('hamburger-btn');
    var sidebar = document.getElementById('sidebar');
    if (!btn || !sidebar) return;

    var loaded = false;
    var sidebarOpen = false;

    if (sessionStorage.getItem('sidebar-open') === 'true') {
        openSidebar();
    }

    btn.addEventListener('click', function () {
        if (sidebarOpen) { closeSidebar(); } else { openSidebar(); }
    });

    function openSidebar() {
        sidebarOpen = true;
        sidebar.classList.add('active');
        btn.classList.add('active');
        sessionStorage.setItem('sidebar-open', 'true');
        if (!loaded) {
            loadTree();
            loadHistory();
            loaded = true;
        }
    }

    function closeSidebar() {
        sidebarOpen = false;
        sidebar.classList.remove('active');
        btn.classList.remove('active');
        sessionStorage.setItem('sidebar-open', 'false');
    }

    /* ---- ツリー読み込み ---- */

    function loadTree() {
        var container = document.getElementById('sidebar-tree');
        fetch('/api/pages/tree')
            .then(function (res) { return res.json(); })
            .then(function (tree) {
                container.innerHTML = '';
                renderNode(tree, container, true, '');
                // ルートにも追加ボタンを配置
                container.appendChild(createAddRow(''));
            });
    }

    // ツリー再読み込み（ドラッグ後など）
    window._reloadTree = loadTree;

    /* ---- ノード描画 ---- */

    function renderNode(node, parent, isRoot, currentPath) {
        // ディレクトリ描画（先にディレクトリを表示）
        var keys = Object.keys(node.children || {});
        keys.forEach(function (key) {
            var child = node.children[key];
            var dirPath = currentPath ? currentPath + '/' + key : key;
            renderDirectory(child, parent, dirPath);
        });

        // ページ描画
        if (node.pages && node.pages.length > 0) {
            node.pages.forEach(function (p) {
                parent.appendChild(createPageRow(p, currentPath));
            });
        }
    }

    function renderDirectory(node, parent, dirPath) {
        // dirPathの親パスとディレクトリ名を算出
        var dirParts = dirPath.split('/');
        var dirName = dirParts[dirParts.length - 1];
        var parentPath = dirParts.slice(0, -1).join('/');

        var dirDiv = document.createElement('div');
        dirDiv.className = 'tree-dir';
        dirDiv.dataset.dirPath = dirPath;
        dirDiv.dataset.dirName = dirName;
        dirDiv.dataset.parentPath = parentPath;
        dirDiv.draggable = true;

        var label = document.createElement('div');
        label.className = 'tree-dir-label';

        // ディレクトリ用グリップハンドル
        var grip = document.createElement('span');
        grip.className = 'tree-grip tree-dir-grip';
        grip.innerHTML = SVG.grip;
        grip.title = 'ドラッグして並び替え';

        var arrow = document.createElement('span');
        arrow.className = 'tree-arrow';
        arrow.innerHTML = SVG.arrow;

        var folderIcon = document.createElement('span');
        folderIcon.className = 'tree-icon';
        folderIcon.innerHTML = SVG.folder;

        var nameSpan = document.createElement('span');
        nameSpan.className = 'tree-dir-name';
        nameSpan.textContent = node.name;

        // ディレクトリ内追加ボタン（ホバーで表示）
        var addBtn = document.createElement('button');
        addBtn.className = 'icon-btn icon-btn-sm tree-inline-action';
        addBtn.title = node.name + ' にページを追加';
        addBtn.innerHTML = SVG.plus;
        addBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!arrow.classList.contains('open')) {
                arrow.classList.add('open');
                childrenDiv.classList.add('open');
                folderIcon.innerHTML = SVG.folderOpen;
            }
            showInlineAdd(childrenDiv, dirPath);
        });

        label.appendChild(grip);
        label.appendChild(arrow);
        label.appendChild(folderIcon);
        label.appendChild(nameSpan);
        label.appendChild(addBtn);

        var childrenDiv = document.createElement('div');
        childrenDiv.className = 'tree-dir-children';

        // ドロップゾーン：ディレクトリラベルへのドロップ（ページ移動用）
        setupDropZone(label, dirPath);

        // 現在のページがこのディレクトリ内なら自動展開
        var currentSlug = getCurrentSlug();
        if (currentSlug && currentSlug.indexOf(dirPath + '/') === 0) {
            arrow.classList.add('open');
            childrenDiv.classList.add('open');
            folderIcon.innerHTML = SVG.folderOpen;
        }

        label.addEventListener('click', function (e) {
            if (e.target.closest('.icon-btn') || e.target.closest('.tree-grip')) return;
            arrow.classList.toggle('open');
            childrenDiv.classList.toggle('open');
            folderIcon.innerHTML = arrow.classList.contains('open') ? SVG.folderOpen : SVG.folder;
        });

        // ディレクトリD&D: dragstart
        dirDiv.addEventListener('dragstart', function (e) {
            // グリップハンドルからのドラッグのみ許可
            if (!e.target.closest || !e.target.closest('.tree-dir')) {
                e.preventDefault();
                return;
            }
            dragState.dragging = {
                type: 'dir',
                dirName: dirName,
                dirPath: dirPath,
                parentPath: parentPath,
                element: dirDiv
            };
            dirDiv.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', dirPath);
            e.stopPropagation();
        });

        dirDiv.addEventListener('dragend', function () {
            dirDiv.classList.remove('dragging');
            clearAllDropHighlights();
            removeDropIndicators();
            dragState.dragging = null;
        });

        // ディレクトリD&D: 同階層の他ディレクトリの上にdragover
        dirDiv.addEventListener('dragover', function (e) {
            if (!dragState.dragging || dragState.dragging.type !== 'dir') return;
            if (dragState.dragging.parentPath !== parentPath) return;
            if (dragState.dragging.dirName === dirName) return;

            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';

            removeDropIndicators();
            var rect = dirDiv.getBoundingClientRect();
            var midY = rect.top + rect.height / 2;
            var indicator = document.createElement('div');
            indicator.className = 'tree-drop-indicator';
            if (e.clientY < midY) {
                dirDiv.parentNode.insertBefore(indicator, dirDiv);
                dirDiv.dataset.dropPosition = 'before';
            } else {
                if (dirDiv.nextSibling) {
                    dirDiv.parentNode.insertBefore(indicator, dirDiv.nextSibling);
                } else {
                    dirDiv.parentNode.appendChild(indicator);
                }
                dirDiv.dataset.dropPosition = 'after';
            }
        });

        dirDiv.addEventListener('dragleave', function () {
            delete dirDiv.dataset.dropPosition;
        });

        dirDiv.addEventListener('drop', function (e) {
            if (!dragState.dragging || dragState.dragging.type !== 'dir') return;
            if (dragState.dragging.parentPath !== parentPath) return;
            if (dragState.dragging.dirName === dirName) return;

            e.preventDefault();
            e.stopPropagation();
            removeDropIndicators();

            var position = dirDiv.dataset.dropPosition || 'after';
            delete dirDiv.dataset.dropPosition;
            reorderDirsInParent(parent, parentPath, dragState.dragging.dirName, dirName, position);
        });

        dirDiv.appendChild(label);
        dirDiv.appendChild(childrenDiv);
        parent.appendChild(dirDiv);

        renderNode(node, childrenDiv, false, dirPath);
        childrenDiv.appendChild(createAddRow(dirPath));
    }

    /* ---- ディレクトリ同階層並び替え ---- */

    function reorderDirsInParent(container, parentPath, draggedName, targetName, position) {
        var dirDivs = container.querySelectorAll(':scope > .tree-dir');
        var names = [];
        dirDivs.forEach(function (d) { names.push(d.dataset.dirName); });

        var filtered = names.filter(function (n) { return n !== draggedName; });
        var idx = filtered.indexOf(targetName);
        if (idx === -1) return;
        if (position === 'after') idx++;
        filtered.splice(idx, 0, draggedName);

        fetch('/api/pages/reorder-dirs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent: parentPath, dirs: filtered })
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.ok) {
                loadTree();
            }
        });
    }

    /* ---- ページ行の生成 ---- */

    function createPageRow(p, dirPath) {
        var row = document.createElement('div');
        row.className = 'tree-page-row';
        row.draggable = true;
        row.dataset.slug = p.slug;
        row.dataset.title = p.title;
        row.dataset.dirPath = dirPath;

        // グリップハンドル
        var grip = document.createElement('span');
        grip.className = 'tree-grip';
        grip.innerHTML = SVG.grip;
        grip.title = 'ドラッグして移動';

        var icon = document.createElement('span');
        icon.className = 'tree-page-icon';
        icon.innerHTML = SVG.file;

        var a = document.createElement('a');
        a.className = 'tree-page-link';
        a.href = '/pages/' + encodeSlug(p.slug);
        a.textContent = p.title;
        if (decodeURIComponent(window.location.pathname) === '/pages/' + p.slug) {
            a.classList.add('active');
        }

        // 「...」メニューボタン
        var moreBtn = document.createElement('button');
        moreBtn.className = 'tree-more-btn';
        moreBtn.innerHTML = SVG.more;
        moreBtn.title = 'メニュー';
        moreBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            showTreeDropdown(row, p, a, dirPath);
        });

        row.appendChild(grip);
        row.appendChild(icon);
        row.appendChild(a);
        row.appendChild(moreBtn);

        // ドラッグイベント
        row.addEventListener('dragstart', function (e) {
            dragState.dragging = { slug: p.slug, title: p.title, element: row, dirPath: dirPath };
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', p.slug);
        });

        row.addEventListener('dragend', function () {
            row.classList.remove('dragging');
            clearAllDropHighlights();
            removeDropIndicators();
            dragState.dragging = null;
        });

        // 同階層並び替え用のdragoverイベント
        row.addEventListener('dragover', function (e) {
            if (!dragState.dragging) return;
            var draggingDir = dragState.dragging.dirPath;
            // 同一ディレクトリ内の並び替え
            if (draggingDir === dirPath && dragState.dragging.slug !== p.slug) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                e.stopPropagation();
                var rect = row.getBoundingClientRect();
                var midY = rect.top + rect.height / 2;
                removeDropIndicators();
                var indicator = document.createElement('div');
                indicator.className = 'tree-drop-indicator';
                if (e.clientY < midY) {
                    row.parentNode.insertBefore(indicator, row);
                    row.dataset.dropPosition = 'before';
                } else {
                    if (row.nextSibling) {
                        row.parentNode.insertBefore(indicator, row.nextSibling);
                    } else {
                        row.parentNode.appendChild(indicator);
                    }
                    row.dataset.dropPosition = 'after';
                }
            }
        });

        row.addEventListener('dragleave', function () {
            delete row.dataset.dropPosition;
        });

        row.addEventListener('drop', function (e) {
            if (!dragState.dragging) return;
            var draggingDir = dragState.dragging.dirPath;
            if (draggingDir === dirPath && dragState.dragging.slug !== p.slug) {
                e.preventDefault();
                e.stopPropagation();
                removeDropIndicators();
                reorderInDirectory(row.parentNode, dirPath, dragState.dragging.slug, p.slug, row.dataset.dropPosition || 'after');
                delete row.dataset.dropPosition;
            }
        });

        return row;
    }

    /* ---- 同階層並び替え ---- */

    function removeDropIndicators() {
        document.querySelectorAll('.tree-drop-indicator').forEach(function (el) {
            el.remove();
        });
    }

    function reorderInDirectory(container, dirPath, draggedSlug, targetSlug, position) {
        // コンテナ内のページ行からslugリストを取得
        var rows = container.querySelectorAll(':scope > .tree-page-row');
        var slugs = [];
        rows.forEach(function (r) { slugs.push(r.dataset.slug); });

        // draggedSlugを現在の位置から除去
        var filtered = slugs.filter(function (s) { return s !== draggedSlug; });

        // targetSlugの位置を見つけて挿入
        var idx = filtered.indexOf(targetSlug);
        if (idx === -1) return;
        if (position === 'after') idx++;
        filtered.splice(idx, 0, draggedSlug);

        fetch('/api/pages/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directory: dirPath, slugs: filtered })
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.ok) {
                loadTree();
            }
        });
    }

    /* ---- 「...」ドロップダウンメニュー ---- */

    function closeAllDropdowns() {
        document.querySelectorAll('.tree-dropdown').forEach(function (el) {
            el.remove();
        });
    }

    function showTreeDropdown(row, p, linkEl, dirPath) {
        closeAllDropdowns();

        var dropdown = document.createElement('div');
        dropdown.className = 'tree-dropdown';

        var editItem = document.createElement('div');
        editItem.className = 'tree-dropdown-item';
        editItem.textContent = 'タイトル編集';
        editItem.addEventListener('click', function (e) {
            e.stopPropagation();
            closeAllDropdowns();
            startInlineEdit(row, p, linkEl, dirPath);
        });

        var deleteItem = document.createElement('div');
        deleteItem.className = 'tree-dropdown-item tree-dropdown-item-danger';
        deleteItem.textContent = '削除';
        deleteItem.addEventListener('click', function (e) {
            e.stopPropagation();
            closeAllDropdowns();
            if (!confirm('「' + p.title + '」を削除しますか？')) return;
            fetch('/api/pages/' + encodeSlug(p.slug), { method: 'DELETE' })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.ok) {
                        loadTree();
                        loadHistory();
                        if (decodeURIComponent(window.location.pathname) === '/pages/' + p.slug) {
                            window.location.href = '/pages/list';
                        }
                    }
                });
        });

        dropdown.appendChild(editItem);
        dropdown.appendChild(deleteItem);
        row.appendChild(dropdown);

        // 外側クリックで閉じる
        function onClickOutside(e) {
            if (!dropdown.contains(e.target) && e.target !== row.querySelector('.tree-more-btn')) {
                closeAllDropdowns();
                document.removeEventListener('click', onClickOutside, true);
            }
        }
        setTimeout(function () {
            document.addEventListener('click', onClickOutside, true);
        }, 0);
    }

    /* ---- インラインタイトル編集 ---- */

    function startInlineEdit(row, p, linkEl, dirPath) {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'tree-inline-edit';
        input.value = p.title;

        linkEl.style.display = 'none';
        row.insertBefore(input, linkEl.nextSibling);
        input.focus();
        input.select();

        var composing = false;
        input.addEventListener('compositionstart', function () { composing = true; });
        input.addEventListener('compositionend', function () { composing = false; });

        var finished = false;
        function finish(save) {
            if (finished) return;
            finished = true;
            if (save) {
                var newTitle = input.value.trim();
                if (newTitle && newTitle !== p.title) {
                    var oldSlug = p.slug;
                    fetch('/api/pages/' + encodeSlug(p.slug) + '/title', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title: newTitle })
                    })
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        if (data.ok) {
                            p.title = data.title;
                            p.slug = data.slug;
                            linkEl.textContent = data.title;
                            linkEl.href = '/pages/' + encodeSlug(data.slug);
                            row.dataset.title = data.title;
                            row.dataset.slug = data.slug;

                            // 表示中のページならメインエリアのタイトルとURLも更新
                            var currentPath = decodeURIComponent(window.location.pathname);
                            if (currentPath === '/pages/' + oldSlug || currentPath === '/') {
                                var pageH2 = document.querySelector('.page-header h2');
                                if (pageH2) pageH2.textContent = data.title;
                                document.title = data.title + ' - ' + document.title.split(' - ').slice(1).join(' - ');
                                if (currentPath !== '/') {
                                    window.history.replaceState(null, '', '/pages/' + encodeSlug(data.slug));
                                }
                            }

                            loadTree();
                            loadHistory();
                        }
                    });
                }
            }
            input.remove();
            linkEl.style.display = '';
        }

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                if (composing || e.isComposing) return;
                e.preventDefault();
                finish(true);
            }
            if (e.key === 'Escape') {
                finish(false);
            }
        });

        input.addEventListener('blur', function () {
            finish(true);
        });
    }

    /* ---- インライン追加行 ---- */

    function createAddRow(dirPath) {
        var row = document.createElement('div');
        row.className = 'tree-add-row';

        var btn = document.createElement('button');
        btn.className = 'tree-add-btn';
        btn.innerHTML = SVG.plus + ' <span>ページを追加</span>';
        btn.addEventListener('click', function () {
            showInlineAdd(row.parentNode, dirPath);
        });

        // ドロップゾーン: ルートに戻す場合
        if (dirPath === '') {
            setupDropZone(row, '');
        }

        row.appendChild(btn);
        return row;
    }

    function showInlineAdd(container, dirPath) {
        // 既存のインライン入力を削除
        var existing = container.querySelector('.tree-inline-input');
        if (existing) { existing.remove(); return; }

        var wrapper = document.createElement('div');
        wrapper.className = 'tree-inline-input';

        // パスプレビュー
        var preview = document.createElement('div');
        preview.className = 'tree-inline-preview';

        var inputRow = document.createElement('div');
        inputRow.className = 'tree-inline-row';

        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '例: 手順書/詳細/新ページ';
        input.className = 'tree-inline-text';

        var okBtn = document.createElement('button');
        okBtn.className = 'icon-btn icon-btn-sm icon-btn-primary';
        okBtn.title = '作成';
        okBtn.innerHTML = SVG.check;

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'icon-btn icon-btn-sm';
        cancelBtn.title = 'キャンセル';
        cancelBtn.innerHTML = SVG.cross;

        function updatePreview() {
            var val = input.value.trim();
            if (!val) {
                preview.textContent = '';
                preview.style.display = 'none';
                return;
            }
            var parsed = parsePathInput(dirPath, val);
            var fullPath = parsed.directory ? parsed.directory + '/' + parsed.title : parsed.title;
            preview.innerHTML = '<span class="tree-inline-preview-icon">' + SVG.file + '</span> ' + escapeHtml(fullPath);
            preview.style.display = 'flex';
        }

        input.addEventListener('input', updatePreview);

        function doCreate() {
            var val = input.value.trim();
            if (!val) return;
            var parsed = parsePathInput(dirPath, val);
            submitQuickAdd(parsed.directory, parsed.title);
        }

        var composing = false;
        input.addEventListener('compositionstart', function () { composing = true; });
        input.addEventListener('compositionend', function () { composing = false; });

        okBtn.addEventListener('click', doCreate);
        cancelBtn.addEventListener('click', function () { wrapper.remove(); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                if (composing || e.isComposing) return;
                e.preventDefault();
                doCreate();
            }
            if (e.key === 'Escape') { wrapper.remove(); }
        });

        inputRow.appendChild(input);
        inputRow.appendChild(okBtn);
        inputRow.appendChild(cancelBtn);

        wrapper.appendChild(preview);
        wrapper.appendChild(inputRow);

        // 追加行の直前に挿入
        var addRow = container.querySelector(':scope > .tree-add-row');
        if (addRow) {
            container.insertBefore(wrapper, addRow);
        } else {
            container.appendChild(wrapper);
        }
        input.focus();
    }

    function parsePathInput(baseDirPath, value) {
        // "/" で区切って、最後のセグメントをタイトル、それ以前を追加ディレクトリとする
        var parts = value.split('/').map(function (s) { return s.trim(); }).filter(Boolean);
        if (parts.length === 0) return { directory: baseDirPath, title: '' };

        var title = parts.pop();
        var extraDir = parts.join('/');

        var fullDir = baseDirPath;
        if (extraDir) {
            fullDir = baseDirPath ? baseDirPath + '/' + extraDir : extraDir;
        }
        return { directory: fullDir, title: title };
    }

    function submitQuickAdd(dirPath, title) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = '/pages/new';
        form.style.display = 'none';
        var fields = { title: title, directory: dirPath, body: '' };
        Object.keys(fields).forEach(function (name) {
            var inp = document.createElement('input');
            inp.type = 'hidden';
            inp.name = name;
            inp.value = fields[name];
            form.appendChild(inp);
        });
        document.body.appendChild(form);
        form.submit();
    }

    /* ---- ドロップゾーン設定 ---- */

    function setupDropZone(element, targetDirPath) {
        element.addEventListener('dragover', function (e) {
            if (!dragState.dragging) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            element.classList.add('drop-target');
        });

        element.addEventListener('dragleave', function (e) {
            if (!element.contains(e.relatedTarget)) {
                element.classList.remove('drop-target');
            }
        });

        element.addEventListener('drop', function (e) {
            e.preventDefault();
            element.classList.remove('drop-target');
            if (!dragState.dragging) return;

            var oldSlug = dragState.dragging.slug;
            var fileName = oldSlug.split('/').pop();
            var newSlug = targetDirPath ? targetDirPath + '/' + fileName : fileName;

            if (oldSlug === newSlug) return;

            fetch('/api/pages/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ old_slug: oldSlug, new_slug: newSlug })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.ok) {
                    loadTree();
                    loadHistory();
                    // 現在表示中のページが移動されたらリダイレクト
                    if (decodeURIComponent(window.location.pathname) === '/pages/' + oldSlug) {
                        window.location.href = '/pages/' + encodeSlug(data.new_slug);
                    }
                } else {
                    alert('移動に失敗しました: ' + (data.error || ''));
                }
            });
        });
    }

    function clearAllDropHighlights() {
        document.querySelectorAll('.drop-target').forEach(function (el) {
            el.classList.remove('drop-target');
        });
    }

    /* ---- ユーティリティ ---- */

    function getCurrentSlug() {
        var path = decodeURIComponent(window.location.pathname);
        if (path.indexOf('/pages/') === 0) {
            var rest = path.substring(7);
            rest = rest.replace(/\/(edit|delete|print|history|diff).*$/, '');
            return rest;
        }
        return '';
    }

    function encodeSlug(slug) {
        return slug.split('/').map(encodeURIComponent).join('/');
    }

    /* ---- 更新履歴 ---- */

    function loadHistory() {
        var container = document.getElementById('sidebar-history');
        fetch('/api/history')
            .then(function (res) { return res.json(); })
            .then(function (commits) {
                container.innerHTML = '';
                if (commits.length === 0) {
                    container.innerHTML = '<div class="history-item"><span class="history-item-message">履歴がありません</span></div>';
                    return;
                }
                commits.forEach(function (c) {
                    var div = document.createElement('div');
                    div.className = 'history-item';
                    div.innerHTML =
                        '<div class="history-item-message">' + escapeHtml(c.message) + '</div>' +
                        '<div class="history-item-time">' + escapeHtml(c.timestamp_str) + '</div>';
                    container.appendChild(div);
                });
            });
    }
}

/* ---- インラインコメント（スレッド）---- */

function encodeSlugForAPI(slug) {
    return slug.split('/').map(encodeURIComponent).join('/');
}

function initComments() {
    var panel = document.getElementById('thread-panel');
    if (!panel) return;

    var slug = panel.dataset.slug;
    var panelBody = document.getElementById('thread-panel-body');
    var panelTitle = document.getElementById('thread-panel-title');
    var closeBtn = document.getElementById('thread-panel-close');
    var floatBtn = document.getElementById('comment-float-btn');
    var pageBody = document.querySelector('.page-body');

    var threadsData = {};
    var activeThreadId = null;

    // パネル閉じる
    closeBtn.addEventListener('click', function () {
        closePanel();
    });

    // テキスト選択 → フローティングボタン表示
    if (pageBody) {
        document.addEventListener('mouseup', function (e) {
            // フローティングボタンやスレッドフォーム内のクリックは無視
            if (e.target.closest('.comment-float-btn') || e.target.closest('.new-thread-form')) return;

            setTimeout(function () {
                var sel = window.getSelection();
                if (!sel || sel.isCollapsed || !sel.toString().trim()) {
                    floatBtn.style.display = 'none';
                    return;
                }
                // 選択がpage-body内かチェック
                var range = sel.getRangeAt(0);
                if (!pageBody.contains(range.commonAncestorContainer)) {
                    floatBtn.style.display = 'none';
                    return;
                }
                // ボタン位置を選択の近くに表示
                var rect = range.getBoundingClientRect();
                floatBtn.style.display = 'flex';
                floatBtn.style.top = (rect.bottom + window.scrollY + 6) + 'px';
                floatBtn.style.left = (rect.left + window.scrollX) + 'px';
            }, 10);
        });

        // フローティングボタンクリック → 新スレッドフォーム表示
        floatBtn.addEventListener('click', function () {
            var sel = window.getSelection();
            if (!sel || sel.isCollapsed) return;
            var selectedText = sel.toString().trim();
            if (!selectedText) return;

            // コンテキスト取得（前後の文字）
            var range = sel.getRangeAt(0);
            var context = getSelectionContext(range, pageBody);

            floatBtn.style.display = 'none';
            showNewThreadForm(selectedText, context);
        });

        // ハイライトクリック → スレッドパネル表示
        pageBody.addEventListener('click', function (e) {
            var highlight = e.target.closest('.comment-highlight');
            if (!highlight) return;
            var tid = highlight.dataset.threadId;
            if (tid) {
                openPanel(tid);
            }
        });
    }

    // 初期読み込み: ハイライトのステータス反映
    loadThreads();

    function loadThreads(openTid) {
        fetch('/api/pages/' + encodeSlugForAPI(slug) + '/threads')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                threadsData = data.threads || {};
                updateHighlightStyles();
                if (openTid) {
                    openPanel(openTid);
                } else if (activeThreadId) {
                    renderPanel();
                }
            });
    }

    function updateHighlightStyles() {
        var highlights = document.querySelectorAll('.comment-highlight');
        highlights.forEach(function (el) {
            var tid = el.dataset.threadId;
            var thread = threadsData[tid];
            if (thread && thread.status === 'resolved') {
                el.classList.add('resolved');
            } else {
                el.classList.remove('resolved');
            }
        });
    }

    function getSelectionContext(range, container) {
        // テキストノードから前後のコンテキストを取得
        var textContent = container.textContent || '';
        var selectedText = range.toString();

        // range のテキスト位置を推定
        var preRange = document.createRange();
        preRange.setStart(container, 0);
        preRange.setEnd(range.startContainer, range.startOffset);
        var beforeText = preRange.toString();

        var contextLen = 30;
        var before = beforeText.slice(-contextLen);
        var afterStart = beforeText.length + selectedText.length;
        var after = textContent.slice(afterStart, afterStart + contextLen);

        return { before: before, after: after };
    }

    function showNewThreadForm(selectedText, context) {
        // 既存フォームを閉じる
        var existing = document.querySelector('.new-thread-form');
        if (existing) existing.remove();

        var form = document.createElement('div');
        form.className = 'new-thread-form';

        var rect = floatBtn.getBoundingClientRect
            ? { top: parseInt(floatBtn.style.top), left: parseInt(floatBtn.style.left) }
            : { top: 200, left: 200 };

        form.style.top = rect.top + 'px';
        form.style.left = Math.min(rect.left, window.innerWidth - 340) + 'px';

        var h4 = document.createElement('h4');
        h4.textContent = 'コメントを追加';

        var quote = document.createElement('div');
        quote.className = 'thread-selected-text';
        quote.textContent = selectedText.length > 80 ? selectedText.substring(0, 80) + '...' : selectedText;

        var bodyTextarea = document.createElement('textarea');
        bodyTextarea.placeholder = 'コメントを入力...';
        bodyTextarea.required = true;

        var actions = document.createElement('div');
        actions.className = 'new-thread-form-actions';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary btn-small';
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.type = 'button';
        cancelBtn.addEventListener('click', function () { form.remove(); });

        var submitBtn = document.createElement('button');
        submitBtn.className = 'btn btn-small';
        submitBtn.textContent = '投稿';
        submitBtn.type = 'button';
        submitBtn.addEventListener('click', function () {
            var body = bodyTextarea.value.trim();
            if (!body) return;
            var threadId = generateId();
            fetch('/api/pages/' + encodeSlugForAPI(slug) + '/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_text: selectedText,
                    body: body,
                    thread_id: threadId,
                    context_before: context.before,
                    context_after: context.after
                })
            })
            .then(function (res) { return res.json(); })
            .then(function () {
                form.remove();
                // ページをリロードしてcommentタグ反映
                window.location.reload();
            });
        });

        actions.appendChild(cancelBtn);
        actions.appendChild(submitBtn);

        form.appendChild(h4);
        form.appendChild(quote);
        form.appendChild(bodyTextarea);
        form.appendChild(actions);

        document.body.appendChild(form);
        bodyTextarea.focus();

        // 外側クリックで閉じる
        setTimeout(function () {
            document.addEventListener('mousedown', function handler(e) {
                if (!form.contains(e.target)) {
                    form.remove();
                    document.removeEventListener('mousedown', handler);
                }
            });
        }, 100);
    }

    function openPanel(tid) {
        activeThreadId = tid;
        panel.classList.add('open');
        // ハイライトをアクティブに
        document.querySelectorAll('.comment-highlight.active').forEach(function (el) {
            el.classList.remove('active');
        });
        var el = document.querySelector('.comment-highlight[data-thread-id="' + tid + '"]');
        if (el) el.classList.add('active');
        renderPanel();
    }

    function closePanel() {
        panel.classList.remove('open');
        document.querySelectorAll('.comment-highlight.active').forEach(function (el) {
            el.classList.remove('active');
        });
        activeThreadId = null;
    }

    function renderPanel() {
        panelBody.innerHTML = '';
        if (!activeThreadId) return;

        var thread = threadsData[activeThreadId];
        if (!thread) {
            panelBody.innerHTML = '<div class="empty-message">スレッドが見つかりません</div>';
            return;
        }

        panelTitle.textContent = thread.status === 'resolved' ? 'スレッド（解決済み）' : 'スレッド';

        var card = document.createElement('div');
        card.className = 'thread-card' + (thread.status === 'resolved' ? ' resolved' : '');

        // 選択テキスト
        var quote = document.createElement('div');
        quote.className = 'thread-selected-text';
        quote.textContent = thread.selected_text;
        card.appendChild(quote);

        // コメント一覧
        var commentCount = thread.comments.length;
        thread.comments.forEach(function (c) {
            var commentDiv = document.createElement('div');
            commentDiv.className = 'thread-comment';

            var header = document.createElement('div');
            header.className = 'thread-comment-header';
            var timeSpan = document.createElement('span');
            timeSpan.textContent = c.created;
            header.appendChild(timeSpan);

            // コメント単位の削除ボタン（最後の1件は削除不可）
            if (commentCount > 1) {
                var cDelBtn = document.createElement('button');
                cDelBtn.className = 'icon-btn icon-btn-sm icon-btn-danger';
                cDelBtn.title = '削除';
                cDelBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M9.5 3l-.5 7.5a1 1 0 01-1 .5h-4a1 1 0 01-1-.5L2.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                (function (commentId) {
                    cDelBtn.addEventListener('click', function () {
                        if (!confirm('このコメントを削除しますか？')) return;
                        fetch('/api/pages/' + encodeSlugForAPI(slug) + '/threads/' + thread.id + '/comments/' + commentId, { method: 'DELETE' })
                            .then(function (res) { return res.json(); })
                            .then(function () {
                                loadThreads(activeThreadId);
                            });
                    });
                })(c.id);
                header.appendChild(cDelBtn);
            }

            var body = document.createElement('div');
            body.className = 'thread-comment-body';
            body.textContent = c.body;

            commentDiv.appendChild(header);
            commentDiv.appendChild(body);
            card.appendChild(commentDiv);
        });

        // 返信フォーム（アクションボタンより上）
        var replyForm = document.createElement('div');
        replyForm.className = 'thread-reply-form';

        var replyBody = document.createElement('textarea');
        replyBody.placeholder = '返信を入力...';

        var replyBtn = document.createElement('button');
        replyBtn.className = 'btn btn-small';
        replyBtn.textContent = '返信';
        replyBtn.addEventListener('click', function () {
            var body = replyBody.value.trim();
            if (!body) return;
            fetch('/api/pages/' + encodeSlugForAPI(slug) + '/threads/' + thread.id + '/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: body })
            })
            .then(function (res) { return res.json(); })
            .then(function () {
                replyBody.value = '';
                loadThreads(activeThreadId);
            });
        });

        replyForm.appendChild(replyBody);
        replyForm.appendChild(replyBtn);
        card.appendChild(replyForm);

        // スレッド操作ボタン（返信フォームより下）
        var actions = document.createElement('div');
        actions.className = 'thread-actions';

        if (thread.status === 'open') {
            var resolveBtn = document.createElement('button');
            resolveBtn.className = 'btn btn-small btn-secondary';
            resolveBtn.textContent = '解決済みにする';
            resolveBtn.addEventListener('click', function () {
                patchThread(thread.id, 'resolve', true);
            });
            actions.appendChild(resolveBtn);
        } else {
            var reopenBtn = document.createElement('button');
            reopenBtn.className = 'btn btn-small';
            reopenBtn.textContent = '再開する';
            reopenBtn.addEventListener('click', function () {
                patchThread(thread.id, 'reopen');
            });
            actions.appendChild(reopenBtn);
        }

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-small btn-danger';
        deleteBtn.textContent = 'スレッド削除';
        deleteBtn.addEventListener('click', function () {
            if (!confirm('このスレッドを削除しますか？')) return;
            fetch('/api/pages/' + encodeSlugForAPI(slug) + '/threads/' + thread.id, { method: 'DELETE' })
                .then(function (res) { return res.json(); })
                .then(function () {
                    closePanel();
                    window.location.reload();
                });
        });
        actions.appendChild(deleteBtn);

        card.appendChild(actions);

        panelBody.appendChild(card);
    }

    function patchThread(tid, action, shouldClose) {
        fetch('/api/pages/' + encodeSlugForAPI(slug) + '/threads/' + tid, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action })
        })
        .then(function (res) { return res.json(); })
        .then(function () {
            if (shouldClose) {
                closePanel();
                loadThreads();
            } else {
                loadThreads(tid);
            }
        });
    }

    function generateId() {
        var chars = 'abcdef0123456789';
        var id = '';
        for (var i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ---- インクリメンタルサーチ ---- */

function initLiveSearch() {
    var input = document.getElementById('search-input');
    var dropdown = document.getElementById('search-dropdown');
    if (!input || !dropdown) return;

    var timer = null;
    var lastQuery = '';
    var selectedIndex = -1;

    input.addEventListener('input', function () {
        var query = input.value.trim();
        if (query === lastQuery) return;
        lastQuery = query;
        selectedIndex = -1;

        if (timer) clearTimeout(timer);

        if (!query) {
            closeDropdown();
            return;
        }

        timer = setTimeout(function () {
            fetch('/api/search?q=' + encodeURIComponent(query))
                .then(function (res) { return res.json(); })
                .then(function (results) {
                    if (input.value.trim() !== query) return;
                    renderDropdown(results, query);
                });
        }, 200);
    });

    // キーボードナビゲーション
    input.addEventListener('keydown', function (e) {
        var items = dropdown.querySelectorAll('.search-dropdown-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            var link = items[selectedIndex].querySelector('a');
            if (link) window.location.href = link.href;
        } else if (e.key === 'Escape') {
            closeDropdown();
        }
    });

    function updateSelection(items) {
        items.forEach(function (el, i) {
            if (i === selectedIndex) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    }

    function renderDropdown(results, query) {
        dropdown.innerHTML = '';

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-dropdown-empty">一致するページがありません</div>';
            dropdown.classList.add('open');
            return;
        }

        var max = Math.min(results.length, 8);
        for (var i = 0; i < max; i++) {
            var r = results[i];
            var item = document.createElement('div');
            item.className = 'search-dropdown-item';

            var link = document.createElement('a');
            link.href = '/pages/' + encodeSlugForAPI(r.slug);

            var title = document.createElement('div');
            title.className = 'search-dropdown-title';
            title.innerHTML = highlightMatch(r.title, query);

            // ディレクトリパスがある場合表示
            if (r.slug.indexOf('/') !== -1) {
                var dir = r.slug.split('/').slice(0, -1).join('/');
                var dirSpan = document.createElement('span');
                dirSpan.className = 'search-dropdown-dir';
                dirSpan.textContent = dir;
                title.appendChild(dirSpan);
            }

            link.appendChild(title);

            if (r.snippet) {
                var snippet = document.createElement('div');
                snippet.className = 'search-dropdown-snippet';
                snippet.innerHTML = highlightMatch(r.snippet, query);
                link.appendChild(snippet);
            }

            item.appendChild(link);
            dropdown.appendChild(item);
        }

        if (results.length > max) {
            var more = document.createElement('div');
            more.className = 'search-dropdown-more';
            more.innerHTML = '<a href="/search?q=' + encodeURIComponent(query) + '">すべての結果を表示 (' + results.length + '件)</a>';
            dropdown.appendChild(more);
        }

        dropdown.classList.add('open');
    }

    function highlightMatch(text, query) {
        if (!query) return escapeHtml(text);
        var escaped = escapeHtml(text);
        var queryEscaped = escapeHtml(query);
        var regex = new RegExp('(' + queryEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
    }

    function closeDropdown() {
        dropdown.classList.remove('open');
        dropdown.innerHTML = '';
        selectedIndex = -1;
    }

    // 外側クリックで閉じる
    document.addEventListener('click', function (e) {
        var wrapper = input.closest('.search-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            closeDropdown();
        }
    });

    // フォーカスで再表示
    input.addEventListener('focus', function () {
        if (input.value.trim() && dropdown.children.length > 0) {
            dropdown.classList.add('open');
        }
    });
}
