import os
import shutil
from pathlib import Path

import dulwich.porcelain as porcelain
from dulwich.repo import Repo

from src.common.logger import get_logger

logger = get_logger("wiki")
_COMMITTER = "LF リンローマニュアル <wiki@local>"


class RepoService:
    def __init__(self, repo_path: Path):
        self._repo_path = repo_path
        self._repo: Repo | None = None
        self._ensure_repo()

    def _ensure_repo(self) -> None:
        """リポジトリを開く。存在しなければ init する。
        破損している場合は再初期化を試みる。"""
        self._repo_path.mkdir(parents=True, exist_ok=True)
        git_dir = self._repo_path / ".git"
        if git_dir.exists():
            try:
                self._repo = Repo(str(self._repo_path))
            except Exception as e:
                logger.warning("Git リポジトリの読み込みに失敗、再初期化します: %s", e)
                self.reinit()
        else:
            self._repo = Repo.init(str(self._repo_path))
            logger.info("Git リポジトリを初期化: %s", self._repo_path)

    def reinit(self) -> None:
        """Gitリポジトリを強制的に再初期化する。"""
        git_dir = self._repo_path / ".git"
        if git_dir.exists():
            shutil.rmtree(git_dir)
            logger.info("既存の .git ディレクトリを削除: %s", git_dir)
        self._repo = Repo.init(str(self._repo_path))
        logger.info("Git リポジトリを再初期化: %s", self._repo_path)

    def commit(self, file_path: str, content: bytes, message: str) -> str:
        """ファイルをステージしてコミット。コミットIDを返す。
        ファイル自体は PageService が data/pages/ に書き込み済みの前提。"""
        full_path = self._repo_path / file_path

        porcelain.add(self._repo, paths=[str(full_path)])

        commit_id = porcelain.commit(
            self._repo,
            message=message.encode("utf-8"),
            committer=_COMMITTER.encode("utf-8"),
            author=_COMMITTER.encode("utf-8"),
        )
        commit_hex = commit_id.decode("ascii") if isinstance(commit_id, bytes) else str(commit_id)
        logger.info("コミット: %s - %s", commit_hex, message)
        return commit_hex

    def log_all(self, max_count: int = 30) -> list[dict]:
        """全ファイルのコミット履歴を返す。"""
        results = []
        try:
            walker = self._repo.get_walker(max_entries=max_count)
            for entry in walker:
                commit = entry.commit
                results.append({
                    "id": commit.id.decode("ascii"),
                    "message": commit.message.decode("utf-8"),
                    "author": commit.author.decode("utf-8"),
                    "timestamp": commit.author_time,
                })
        except KeyError:
            pass
        return results

    def log(self, file_path: str, max_count: int = 50) -> list[dict]:
        """指定ファイルのコミット履歴を返す。"""
        results = []
        try:
            walker = self._repo.get_walker(
                paths=[file_path.encode("utf-8")],
                max_entries=max_count,
            )
            for entry in walker:
                commit = entry.commit
                results.append({
                    "id": commit.id.decode("ascii"),
                    "message": commit.message.decode("utf-8"),
                    "author": commit.author.decode("utf-8"),
                    "timestamp": commit.author_time,
                })
        except KeyError:
            pass
        return results

    def show(self, commit_id: str, file_path: str) -> bytes:
        """特定コミット時点のファイル内容を返す"""
        commit = self._repo[commit_id.encode("ascii")]
        tree = self._repo[commit.tree]

        parts = file_path.split("/")
        current = tree
        for part in parts[:-1]:
            for item in current.items():
                if item.path.decode("utf-8") == part:
                    current = self._repo[item.sha]
                    break
            else:
                raise FileNotFoundError(f"{file_path} not found in commit {commit_id}")

        for item in current.items():
            if item.path.decode("utf-8") == parts[-1]:
                blob = self._repo[item.sha]
                return blob.data

        raise FileNotFoundError(f"{file_path} not found in commit {commit_id}")

    def diff(self, commit_a: str, commit_b: str, file_path: str) -> dict:
        """2つのコミット間の差分を返す（旧テキストと新テキストの辞書）"""
        try:
            old_content = self.show(commit_a, file_path).decode("utf-8")
        except (FileNotFoundError, KeyError):
            old_content = ""
        try:
            new_content = self.show(commit_b, file_path).decode("utf-8")
        except (FileNotFoundError, KeyError):
            new_content = ""

        return {"old": old_content, "new": new_content}

    def restore(self, commit_id: str, file_path: str) -> bytes:
        """特定コミットの内容を取得（復元用）"""
        return self.show(commit_id, file_path)

    def delete(self, file_path: str, message: str) -> str:
        """ファイルを削除してコミット。コミットIDを返す。"""
        full_path = self._repo_path / file_path
        if full_path.exists():
            porcelain.rm(self._repo, paths=[str(full_path)])
        else:
            porcelain.add(self._repo, paths=[str(full_path)])

        commit_id = porcelain.commit(
            self._repo,
            message=message.encode("utf-8"),
            committer=_COMMITTER.encode("utf-8"),
            author=_COMMITTER.encode("utf-8"),
        )
        commit_hex = commit_id.decode("ascii") if isinstance(commit_id, bytes) else str(commit_id)
        logger.info("削除コミット: %s - %s", commit_hex, message)
        return commit_hex
