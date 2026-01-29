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
    tags: list[str] = field(default_factory=list)

    def to_markdown(self) -> str:
        """front matter + body の Markdown テキストを生成する"""
        post = frontmatter.Post(self.body)
        post["title"] = self.title
        post["created"] = self.created or datetime.now().isoformat(timespec="seconds")
        post["updated"] = datetime.now().isoformat(timespec="seconds")
        if self.tags:
            post["tags"] = self.tags
        return frontmatter.dumps(post)

    @classmethod
    def from_markdown(cls, slug: str, text: str) -> "Page":
        """Markdown テキストから Page を生成する"""
        post = frontmatter.loads(text)
        return cls(
            slug=slug,
            title=post.get("title", slug),
            body=post.content,
            created=post.get("created", ""),
            updated=post.get("updated", ""),
            tags=post.get("tags", []),
        )
