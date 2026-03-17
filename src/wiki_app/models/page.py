from dataclasses import dataclass, field
from datetime import datetime

import frontmatter


@dataclass
class Page:
    slug: str
    title: str
    body: str
    created: str = ""
    updated: str = ""

    def to_markdown(self) -> str:
        """front matter + body の Markdown テキストを生成する"""
        post = frontmatter.Post(self.body)
        post["title"] = self.title
        post["created"] = self.created or datetime.now().isoformat(timespec="seconds")
        post["updated"] = datetime.now().isoformat(timespec="seconds")
        return frontmatter.dumps(post)

    @classmethod
    def from_markdown(cls, slug: str, text: str) -> "Page":
        """Markdown テキストから Page を生成する"""
        post = frontmatter.loads(text)
        fallback_title = str(slug or "").strip("/").split("/")[-1] if slug else ""
        return cls(
            slug=slug,
            title=post.get("title", fallback_title or slug),
            body=post.content,
            created=post.get("created", ""),
            updated=post.get("updated", ""),
        )
