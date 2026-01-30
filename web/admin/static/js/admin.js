document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".sidebar nav a");
  const sections = document.querySelectorAll(".section");
  const sectionTitle = document.getElementById("section-title");

  function switchSection(id) {
    sections.forEach((s) => s.classList.remove("active"));
    navLinks.forEach((a) => a.classList.remove("active"));

    const section = document.getElementById(id);
    const link = document.querySelector(`[data-section="${id}"]`);
    if (section) section.classList.add("active");
    if (link) {
      link.classList.add("active");
      sectionTitle.textContent = link.textContent;
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const id = link.dataset.section;
      switchSection(id);
      window.location.hash = id;
      loadSectionData(id);
    });
  });

  // Initial load
  const hash = window.location.hash.replace("#", "") || "sec-dashboard";
  switchSection(hash);
  loadSectionData(hash);

  function loadSectionData(id) {
    switch (id) {
      case "sec-dashboard":
        loadStats();
        break;
      case "sec-git":
        loadGitStatus();
        loadGitLog();
        break;
      case "sec-logs":
        loadLogsList();
        break;
      case "sec-config":
        loadConfigList();
        break;
      case "sec-comments":
        loadCommentsList();
        loadOrphans();
        break;
      case "sec-state":
        loadWatcherState();
        break;
    }
  }

  // --- Utility ---

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function showAlert(container, message, type) {
    const div = document.createElement("div");
    div.className = `alert-msg ${type}`;
    div.textContent = message;
    container.prepend(div);
    setTimeout(() => div.remove(), 5000);
  }

  function formatTimestamp(ts) {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    return d.toLocaleString("ja-JP");
  }

  // --- Dashboard ---

  function loadStats() {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        document.getElementById("stat-pages").textContent = data.page_count;
        document.getElementById("stat-comments").textContent =
          data.comment_count;
        document.getElementById("stat-disk").textContent = formatBytes(
          data.disk_usage_bytes
        );
        document.getElementById("stat-commits").textContent =
          data.commit_count;
        document.getElementById("stat-watcher").textContent =
          data.watcher_status;
      })
      .catch(() => {
        document.getElementById("stat-pages").textContent = "Error";
      });
  }

  // --- Git ---

  function loadGitStatus() {
    fetch("/api/git/status")
      .then((r) => r.json())
      .then((data) => {
        const el = document.getElementById("git-status-result");
        if (data.healthy) {
          el.innerHTML = '<span class="status-badge status-healthy">正常</span>';
        } else {
          el.innerHTML =
            '<span class="status-badge status-error">異常あり</span>';
        }
        const details = document.getElementById("git-status-details");
        details.textContent = JSON.stringify(data.checks, null, 2);
      });
  }

  function loadGitLog() {
    fetch("/api/git/log")
      .then((r) => r.json())
      .then((data) => {
        const tbody = document.getElementById("git-log-body");
        if (!Array.isArray(data)) {
          tbody.innerHTML = "<tr><td colspan='3'>取得失敗</td></tr>";
          return;
        }
        tbody.innerHTML = data
          .map(
            (c) => `
          <tr>
            <td><code>${c.id.substring(0, 8)}</code></td>
            <td>${c.message}</td>
            <td>${formatTimestamp(c.timestamp)}</td>
          </tr>`
          )
          .join("");
      });
  }

  document.getElementById("btn-git-reinit").addEventListener("click", () => {
    if (!confirm("Git リポジトリを再初期化しますか？\n既存の履歴構造がリセットされる可能性があります。")) return;
    fetch("/api/git/reinit", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        const container = document.getElementById("sec-git");
        if (data.ok) {
          showAlert(container, "再初期化しました", "success");
          loadGitStatus();
          loadGitLog();
        } else {
          showAlert(container, "失敗: " + data.error, "error");
        }
      });
  });

  // --- Logs ---

  function loadLogsList() {
    fetch("/api/logs/list")
      .then((r) => r.json())
      .then((files) => {
        const sel = document.getElementById("log-file-select");
        sel.innerHTML = '<option value="">-- ファイルを選択 --</option>';
        files.forEach((f) => {
          const opt = document.createElement("option");
          opt.value = f.name;
          opt.textContent = `${f.name} (${formatBytes(f.size_bytes)})`;
          sel.appendChild(opt);
        });
      });
  }

  document
    .getElementById("log-file-select")
    .addEventListener("change", (e) => {
      const filename = e.target.value;
      if (!filename) {
        document.getElementById("log-content").textContent = "";
        return;
      }
      fetch(`/api/logs/${filename}?lines=200`)
        .then((r) => r.json())
        .then((data) => {
          document.getElementById("log-content").textContent =
            data.lines.join("\n");
          const viewer = document.getElementById("log-content");
          viewer.scrollTop = viewer.scrollHeight;
        });
    });

  // --- Config ---

  let currentConfigName = null;

  function loadConfigList() {
    fetch("/api/config/list")
      .then((r) => r.json())
      .then((names) => {
        const sel = document.getElementById("config-file-select");
        sel.innerHTML = '<option value="">-- 設定ファイルを選択 --</option>';
        names.forEach((name) => {
          const opt = document.createElement("option");
          opt.value = name;
          opt.textContent = name + ".json";
          sel.appendChild(opt);
        });
      });
  }

  document
    .getElementById("config-file-select")
    .addEventListener("change", (e) => {
      const name = e.target.value;
      currentConfigName = name;
      if (!name) {
        document.getElementById("config-textarea").value = "";
        return;
      }
      fetch(`/api/config/${name}`)
        .then((r) => r.json())
        .then((data) => {
          document.getElementById("config-textarea").value = data.content;
        });
    });

  document.getElementById("btn-config-save").addEventListener("click", () => {
    if (!currentConfigName) return;
    const content = document.getElementById("config-textarea").value;
    fetch(`/api/config/${currentConfigName}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
      .then((r) => r.json())
      .then((data) => {
        const container = document.getElementById("sec-config");
        if (data.ok) {
          showAlert(container, "保存しました", "success");
        } else {
          showAlert(container, "エラー: " + data.error, "error");
        }
      });
  });

  // --- Export ---

  document.getElementById("btn-export-zip").addEventListener("click", () => {
    window.location.href = "/api/export/zip";
  });

  // --- Comments ---

  function loadCommentsList() {
    fetch("/api/comments/list")
      .then((r) => r.json())
      .then((data) => {
        const tbody = document.getElementById("comments-list-body");
        if (!data.length) {
          tbody.innerHTML =
            "<tr><td colspan='4'>コメントファイルなし</td></tr>";
          return;
        }
        tbody.innerHTML = data
          .map(
            (c) => `
          <tr>
            <td>${c.slug}</td>
            <td>${c.filename}</td>
            <td>${c.thread_count}</td>
            <td>${c.comment_count}</td>
          </tr>`
          )
          .join("");
      });
  }

  function loadOrphans() {
    fetch("/api/comments/orphans")
      .then((r) => r.json())
      .then((data) => {
        const el = document.getElementById("orphans-list");
        if (!data.length) {
          el.innerHTML = '<div class="loading">孤児コメントはありません</div>';
          document.getElementById("btn-delete-orphans").disabled = true;
          return;
        }
        document.getElementById("btn-delete-orphans").disabled = false;
        el.innerHTML = data
          .map(
            (o) => `
          <div class="orphan-item">
            <span>${o.slug} (${o.thread_count} スレッド / ${o.comment_count} コメント)</span>
            <span>${o.filename}</span>
          </div>`
          )
          .join("");
      });
  }

  document
    .getElementById("btn-delete-orphans")
    .addEventListener("click", () => {
      if (!confirm("孤児コメントをすべて削除しますか？")) return;
      fetch("/api/comments/orphans", { method: "DELETE" })
        .then((r) => r.json())
        .then((data) => {
          const container = document.getElementById("sec-comments");
          showAlert(
            container,
            `${data.count} 件の孤児コメントを削除しました`,
            "success"
          );
          loadOrphans();
          loadCommentsList();
        });
    });

  // --- State ---

  function loadWatcherState() {
    fetch("/api/state/watcher")
      .then((r) => r.json())
      .then((data) => {
        document.getElementById("state-snapshots-count").textContent =
          data.snapshots.file_count;
        document.getElementById("state-snapshots-size").textContent =
          formatBytes(data.snapshots.total_size_bytes);
        document.getElementById("state-events-count").textContent =
          data.events.file_count;
        document.getElementById("state-events-size").textContent = formatBytes(
          data.events.total_size_bytes
        );
      });
  }

  document
    .getElementById("btn-delete-snapshots")
    .addEventListener("click", () => {
      if (!confirm("すべてのスナップショットを削除しますか？\n次回チェック時に再取得されます。")) return;
      fetch("/api/state/watcher/snapshots", { method: "DELETE" })
        .then((r) => r.json())
        .then((data) => {
          const container = document.getElementById("sec-state");
          showAlert(
            container,
            `${data.deleted} 件のスナップショットを削除しました`,
            "success"
          );
          loadWatcherState();
        });
    });

  document
    .getElementById("btn-delete-events")
    .addEventListener("click", () => {
      if (!confirm("すべてのイベントを削除しますか？")) return;
      fetch("/api/state/watcher/events", { method: "DELETE" })
        .then((r) => r.json())
        .then((data) => {
          const container = document.getElementById("sec-state");
          showAlert(
            container,
            `${data.deleted} 件のイベントを削除しました`,
            "success"
          );
          loadWatcherState();
        });
    });
});
