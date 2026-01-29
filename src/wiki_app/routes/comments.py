from flask import Blueprint, request, jsonify

from src.wiki_app.services.comment_service import CommentService

comments_bp = Blueprint("comments", __name__)

_comment_service: CommentService | None = None


def init_comments(comment_service: CommentService) -> None:
    global _comment_service
    _comment_service = comment_service


@comments_bp.route("/api/pages/<slug>/comments", methods=["GET"])
def get_comments(slug):
    comments = _comment_service.get_comments(slug)
    return jsonify(comments)


@comments_bp.route("/api/pages/<slug>/comments", methods=["POST"])
def add_comment(slug):
    data = request.get_json()
    author = data.get("author", "")
    body = data.get("body", "")
    if not body.strip():
        return jsonify({"error": "本文は必須です"}), 400
    comment = _comment_service.add_comment(slug, author, body)
    return jsonify(comment), 201


@comments_bp.route("/api/pages/<slug>/comments/<comment_id>", methods=["DELETE"])
def delete_comment(slug, comment_id):
    deleted = _comment_service.delete_comment(slug, comment_id)
    if not deleted:
        return jsonify({"error": "コメントが見つかりません"}), 404
    return jsonify({"ok": True})
