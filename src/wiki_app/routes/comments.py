from flask import Blueprint, request, jsonify

from src.wiki_app.services.comment_service import CommentService
from src.wiki_app.services.page_service import PageService

comments_bp = Blueprint("comments", __name__)

_comment_service: CommentService | None = None
_page_service: PageService | None = None


def init_comments(comment_service: CommentService, page_service: PageService) -> None:
    global _comment_service, _page_service
    _comment_service = comment_service
    _page_service = page_service


@comments_bp.route("/api/pages/<path:slug>/threads", methods=["GET"])
def get_threads(slug):
    """全スレッド取得"""
    data = _comment_service.get_threads(slug)
    return jsonify(data)


@comments_bp.route("/api/pages/<path:slug>/threads", methods=["POST"])
def create_thread(slug):
    """新スレッド作成（Markdownにcommentタグも挿入）"""
    data = request.get_json()
    selected_text = data.get("selected_text", "")
    body = data.get("body", "")
    thread_id = data.get("thread_id", "")
    context_before = data.get("context_before", "")
    context_after = data.get("context_after", "")

    if not selected_text or not body.strip():
        return jsonify({"error": "選択テキストとコメント本文は必須です"}), 400
    if not thread_id:
        import uuid
        thread_id = uuid.uuid4().hex[:8]

    # Markdownソースにタグ挿入
    _page_service.insert_comment_tag(slug, selected_text, thread_id, context_before, context_after)

    # スレッド作成
    thread = _comment_service.create_thread(slug, thread_id, selected_text, body)
    return jsonify(thread), 201


@comments_bp.route("/api/pages/<path:slug>/threads/<thread_id>/comments", methods=["POST"])
def add_reply(slug, thread_id):
    """スレッドに返信追加"""
    data = request.get_json()
    body = data.get("body", "")
    if not body.strip():
        return jsonify({"error": "本文は必須です"}), 400
    comment = _comment_service.add_reply(slug, thread_id, body)
    if not comment:
        return jsonify({"error": "スレッドが見つかりません"}), 404
    return jsonify(comment), 201


@comments_bp.route("/api/pages/<path:slug>/threads/<thread_id>/comments/<comment_id>", methods=["DELETE"])
def delete_comment(slug, thread_id, comment_id):
    """スレッド内の個別コメントを削除"""
    deleted = _comment_service.delete_comment(slug, thread_id, comment_id)
    if not deleted:
        return jsonify({"error": "削除できません（最後の1件は削除不可）"}), 400
    return jsonify({"ok": True})


@comments_bp.route("/api/pages/<path:slug>/threads/<thread_id>", methods=["PATCH"])
def update_thread(slug, thread_id):
    """スレッドの解決/再開"""
    data = request.get_json()
    action = data.get("action", "")
    if action == "resolve":
        ok = _comment_service.resolve_thread(slug, thread_id)
    elif action == "reopen":
        ok = _comment_service.reopen_thread(slug, thread_id)
    else:
        return jsonify({"error": "actionは resolve または reopen を指定してください"}), 400
    if not ok:
        return jsonify({"error": "スレッドが見つかりません"}), 404
    return jsonify({"ok": True})


@comments_bp.route("/api/pages/<path:slug>/threads/<thread_id>", methods=["DELETE"])
def delete_thread(slug, thread_id):
    """スレッド削除（Markdownからタグも除去）"""
    _page_service.remove_comment_tag(slug, thread_id)
    deleted = _comment_service.delete_thread(slug, thread_id)
    if not deleted:
        return jsonify({"error": "スレッドが見つかりません"}), 404
    return jsonify({"ok": True})
