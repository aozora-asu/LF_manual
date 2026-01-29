/* WikiSuite JavaScript - 編集可能 */

document.addEventListener('DOMContentLoaded', function () {
    initComments();
});

function initComments() {
    var section = document.querySelector('.comments-section');
    if (!section) return;

    var slug = section.dataset.slug;
    var list = document.getElementById('comments-list');
    var form = document.getElementById('comment-form');

    loadComments();

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var author = document.getElementById('comment-author').value;
        var body = document.getElementById('comment-body').value;

        fetch('/api/pages/' + slug + '/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author: author, body: body })
        })
        .then(function (res) { return res.json(); })
        .then(function () {
            document.getElementById('comment-body').value = '';
            loadComments();
        });
    });

    function loadComments() {
        fetch('/api/pages/' + slug + '/comments')
            .then(function (res) { return res.json(); })
            .then(function (comments) {
                list.innerHTML = '';
                comments.forEach(function (c) {
                    var div = document.createElement('div');
                    div.className = 'comment';
                    div.innerHTML =
                        '<div class="comment-header">' +
                        '<span>' + escapeHtml(c.author) + '</span>' +
                        '<span>' + escapeHtml(c.created) +
                        ' <button class="btn btn-small btn-danger" onclick="deleteComment(\'' + slug + '\', \'' + c.id + '\')">削除</button>' +
                        '</span></div>' +
                        '<div class="comment-body">' + escapeHtml(c.body) + '</div>';
                    list.appendChild(div);
                });
            });
    }
}

function deleteComment(slug, commentId) {
    if (!confirm('このコメントを削除しますか？')) return;
    fetch('/api/pages/' + slug + '/comments/' + commentId, { method: 'DELETE' })
        .then(function () {
            initComments();
        });
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
