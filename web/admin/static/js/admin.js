document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_TARGET_INTERVAL = 30;
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

  // Admin タブが開いている間はハートビートを送る
  const sessionId = (() => {
    const key = "admin-session-id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id =
      window.crypto && crypto.randomUUID
        ? `admin:${crypto.randomUUID()}`
        : `admin:${Date.now().toString(36)}${Math.random()
            .toString(36)
            .slice(2)}`;
    sessionStorage.setItem(key, id);
    return id;
  })();

  function postHeartbeat(action) {
    fetch("/api/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, session_id: sessionId, client: "admin" }),
      keepalive: action === "close",
    }).catch(() => {});
  }

  function sendClose() {
    const payload = JSON.stringify({
      action: "close",
      session_id: sessionId,
      client: "admin",
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/heartbeat",
        new Blob([payload], { type: "application/json" })
      );
    } else {
      postHeartbeat("close");
    }
  }

  postHeartbeat("open");
  setInterval(() => postHeartbeat("ping"), 5000);
  window.addEventListener("pagehide", sendClose);
  window.addEventListener("beforeunload", sendClose);

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
      case "sec-watcher":
        loadWatcherOverview();
        loadWatcherEvents();
        loadWatcherEventsHistory();
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

  function formatIso(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ja-JP");
  }

  function formatInterval(seconds) {
    if (!seconds && seconds !== 0) return "-";
    const mins = Math.round(seconds / 60);
    if (seconds >= 60) {
      return `${seconds} 秒 (約 ${mins} 分)`;
    }
    return `${seconds} 秒`;
  }

  function formatNightStop(nightStop) {
    if (!nightStop || !nightStop.enabled) return "無効";
    const start = Number(nightStop.start_hour ?? 0);
    const end = Number(nightStop.end_hour ?? 0);
    return `${start}:00 - ${end}:00`;
  }

  function isNightStopActive(nightStop) {
    if (!nightStop || !nightStop.enabled) return false;
    const start = Number(nightStop.start_hour ?? 0);
    const end = Number(nightStop.end_hour ?? 0);
    const hour = new Date().getHours();
    if (start === end) return false;
    if (start < end) {
      return hour >= start && hour < end;
    }
    return hour >= start || hour < end;
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
  let configMode = "json";
  let watcherFormState = null;
  let watcherGuiOnly = false;
  let watcherAutoSaveBound = false;
  let watcherAutoSaveTimer = null;
  let isBuildingWatcherForm = false;

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
        if (!currentConfigName && names.includes("watcher")) {
          sel.value = "watcher";
          sel.dispatchEvent(new Event("change"));
        }
      });
  }

  document
    .getElementById("config-file-select")
    .addEventListener("change", (e) => {
      const name = e.target.value;
      currentConfigName = name;
      if (!name) {
        document.getElementById("config-textarea").value = "";
        setWatcherGuiOnly(false);
        showConfigMode("json");
        return;
      }
      fetch(`/api/config/${name}`)
        .then((r) => r.json())
        .then((data) => {
          document.getElementById("config-textarea").value = data.content;
          if (name === "watcher") {
            setWatcherGuiOnly(true);
            buildWatcherForm(data.content);
            showConfigMode("gui");
          } else {
            setWatcherGuiOnly(false);
            showConfigMode("json");
          }
        });
    });

  document.getElementById("btn-config-mode-gui").addEventListener("click", () => {
    if (currentConfigName === "watcher") {
      buildWatcherForm(document.getElementById("config-textarea").value);
      showConfigMode("gui");
    }
  });

  document.getElementById("btn-config-mode-json").addEventListener("click", () => {
    showConfigMode("json");
  });

  document.getElementById("btn-config-apply").addEventListener("click", () => {
    if (!watcherFormState) return;
    const config = buildWatcherConfigFromForm();
    document.getElementById("config-textarea").value = JSON.stringify(config, null, 2);
    showConfigMode("json");
  });

  function showConfigMode(mode) {
    configMode = mode;
    const gui = document.getElementById("config-gui");
    const textarea = document.getElementById("config-textarea");
    if (watcherGuiOnly) {
      gui.classList.remove("hidden");
      textarea.style.display = "none";
      return;
    }
    if (mode === "gui") {
      gui.classList.remove("hidden");
      textarea.style.display = "none";
    } else {
      gui.classList.add("hidden");
      textarea.style.display = "block";
    }
  }

  function buildWatcherForm(content) {
    isBuildingWatcherForm = true;
    watcherFormState = null;
    let config = {};
    try {
      config = JSON.parse(content);
    } catch {
      config = {};
    }
    const container = document.getElementById("watcher-form");
    container.innerHTML = "";

    const state = {
      nightEnabled: null,
      nightStart: null,
      nightEnd: null,
      targets: [],
    };

    const globals = document.createElement("div");
    globals.className = "config-global";

    const nightWrap = document.createElement("div");
    nightWrap.className = "config-inline-field";
    state.nightEnabled = createInlineCheckbox("夜間停止", config.night_stop?.enabled ?? false);
    nightWrap.appendChild(state.nightEnabled.wrapper);
    state.nightEnabled = state.nightEnabled.input;

    const nightFields = document.createElement("div");
    nightFields.className = "config-inline-night";
    nightFields.appendChild(createInlineLabel("停止"));
    state.nightStart = createInlineNumberInput(config.night_stop?.start_hour ?? 0);
    nightFields.appendChild(state.nightStart);
    nightFields.appendChild(createInlineLabel("再開"));
    state.nightEnd = createInlineNumberInput(config.night_stop?.end_hour ?? 4);
    nightFields.appendChild(state.nightEnd);
    nightWrap.appendChild(nightFields);

    const toggleNightFields = () => {
      const enabled = state.nightEnabled.checked;
      nightFields.style.display = enabled ? "flex" : "none";
      state.nightStart.disabled = !enabled;
      state.nightEnd.disabled = !enabled;
    };
    state.nightEnabled.addEventListener("change", toggleNightFields);
    toggleNightFields();

    globals.appendChild(nightWrap);
    container.appendChild(globals);

    const targets = Array.isArray(config.targets) ? config.targets : [];
    targets.forEach((t, idx) => {
      const card = document.createElement("div");
      card.className = "config-target-card";

      const header = document.createElement("div");
      header.className = "config-target-header";
      header.textContent = `ターゲット ${idx + 1}`;
      card.appendChild(header);

      const summary = document.createElement("div");
      summary.className = "config-target-summary";
      card.appendChild(summary);

      const details = document.createElement("details");
      details.className = "config-target-details";
      const detailsSummary = document.createElement("summary");
      detailsSummary.textContent = "詳しい設定";
      details.appendChild(detailsSummary);
      const grid = document.createElement("div");
      grid.className = "config-form-grid";
      details.appendChild(grid);
      card.appendChild(details);

      const targetState = {
        name: createTextField(summary, "名前", t.name ?? ""),
        enabled: createCheckboxField(summary, "有効", t.enabled ?? true),
        interval: createNumberField(summary, "間隔", t.interval_seconds ?? ""),
        alert_statuses: createTextField(
          summary,
          "alert_status",
          (t.alert_statuses || []).join(",")
        ),
        warning_codes: createTextField(
          summary,
          "warning_code",
          (t.warning_codes || []).join(",")
        ),
        threshold: createNumberField(summary, "threshold", t.threshold ?? ""),
        type: createSelectField(grid, "タイプ", t.type ?? "generic", [
          "train",
          "weather",
          "outage",
          "generic",
        ]),
        site_url: createTextField(
          grid,
          "site_url",
          t.site_url ?? defaultSiteUrlForType(t.type, t)
        ),
        url: maybeCreateTextField(grid, "URL", t.url),
        warning_url: maybeCreateTextField(grid, "warning_url", t.warning_url),
        area_url: maybeCreateTextField(grid, "area_url", t.area_url),
        base_url: maybeCreateTextField(grid, "base_url", t.base_url),
        detail_base_url: maybeCreateTextField(
          grid,
          "detail_base_url",
          t.detail_base_url
        ),
        selector: maybeCreateTextField(grid, "selector", t.selector),
        detail_selector: maybeCreateTextField(
          grid,
          "detail_selector",
          t.detail_selector
        ),
        area_code: maybeCreateTextField(grid, "area_code", t.area_code),
        auth_token: maybeCreateTextField(grid, "auth_token", t.auth_token),
      };

      targetState.name.parentElement.classList.add("config-field-wide");
      targetState.enabled.parentElement.classList.add("config-field-compact");
      targetState.interval.parentElement.classList.add("config-field-compact");
      targetState.site_url.parentElement.classList.add("config-field-wide");
      targetState.alert_statuses.parentElement.classList.add("config-field-wide");
      targetState.warning_codes.parentElement.classList.add("config-field-wide");
      targetState.threshold.parentElement.classList.add("config-field-wide");

      applyTargetVisibility(grid, t.type ?? "generic");
      applyTargetSummaryVisibility(targetState, t.type ?? "generic");
      targetState.type.addEventListener("change", () => {
        applyTargetVisibility(grid, targetState.type.value);
        applyTargetSummaryVisibility(targetState, targetState.type.value);
      });

      state.targets.push(targetState);
      container.appendChild(card);
    });

    watcherFormState = state;
    bindWatcherAutoSave(container);
    isBuildingWatcherForm = false;
  }

  function buildWatcherConfigFromForm() {
    const state = watcherFormState;
    const config = {
      night_stop: {
        enabled: state.nightEnabled.checked,
        start_hour: numberValue(state.nightStart, 0),
        end_hour: numberValue(state.nightEnd, 4),
      },
      targets: [],
    };

    state.targets.forEach((t) => {
      const target = {
        name: t.name.value.trim(),
        type: t.type.value,
        enabled: t.enabled.checked,
      };
      const interval = numberValue(t.interval, DEFAULT_TARGET_INTERVAL);
      target.interval_seconds = interval;

      if (t.site_url) setIfValue(target, "site_url", t.site_url.value);
      if (t.url) setIfValue(target, "url", t.url.value);
      if (t.warning_url) setIfValue(target, "warning_url", t.warning_url.value);
      if (t.area_url) setIfValue(target, "area_url", t.area_url.value);
      if (t.base_url) setIfValue(target, "base_url", t.base_url.value);
      if (t.detail_base_url) {
        setIfValue(target, "detail_base_url", t.detail_base_url.value);
      }
      if (t.selector) setIfValue(target, "selector", t.selector.value);
      if (t.detail_selector) {
        setIfValue(target, "detail_selector", t.detail_selector.value);
      }
      if (t.area_code) setIfValue(target, "area_code", t.area_code.value);
      if (t.auth_token) setIfValue(target, "auth_token", t.auth_token.value);

      if (t.alert_statuses && (t.type.value === "train" || t.type.value === "generic")) {
        const alertStatuses = listValue(t.alert_statuses.value);
        if (alertStatuses.length) target.alert_statuses = alertStatuses;
      }
      if (t.warning_codes && t.type.value === "weather") {
        const warningCodes = listValue(t.warning_codes.value);
        if (warningCodes.length) target.warning_codes = warningCodes;
      }
      if (t.threshold && t.type.value === "outage") {
        const threshold = numberValue(t.threshold, null);
        if (threshold !== null) target.threshold = threshold;
      }

      config.targets.push(target);
    });

    return config;
  }

  function bindWatcherAutoSave(container) {
    if (watcherAutoSaveBound) return;
    const handler = () => {
      if (!watcherGuiOnly || currentConfigName !== "watcher") return;
      if (isBuildingWatcherForm) return;
      scheduleWatcherAutoSave();
    };
    container.addEventListener("input", handler);
    container.addEventListener("change", handler);
    watcherAutoSaveBound = true;
  }

  function scheduleWatcherAutoSave() {
    if (watcherAutoSaveTimer) clearTimeout(watcherAutoSaveTimer);
    watcherAutoSaveTimer = setTimeout(saveWatcherConfig, 400);
  }

  function saveWatcherConfig() {
    if (!watcherFormState || currentConfigName !== "watcher") return;
    const config = buildWatcherConfigFromForm();
    const content = JSON.stringify(config, null, 2);
    fetch(`/api/config/${currentConfigName}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          const container = document.getElementById("sec-config");
          showAlert(container, "エラー: " + data.error, "error");
        }
      })
      .catch(() => {
        const container = document.getElementById("sec-config");
        showAlert(container, "保存に失敗しました", "error");
      });
  }

  function setWatcherGuiOnly(enabled) {
    watcherGuiOnly = enabled;
    const modes = document.querySelector(".config-modes");
    const applyBtn = document.getElementById("btn-config-apply");
    const saveBtn = document.getElementById("btn-config-save");
    const textarea = document.getElementById("config-textarea");
    if (modes) modes.style.display = enabled ? "none" : "flex";
    if (applyBtn) applyBtn.style.display = enabled ? "none" : "";
    if (saveBtn) saveBtn.style.display = enabled ? "none" : "";
    if (textarea) textarea.style.display = enabled ? "none" : "block";
  }

  function setIfValue(obj, key, value) {
    if (value && value.trim() !== "") obj[key] = value.trim();
  }

  function defaultSiteUrlForType(type, target) {
    if (target && hasValue(target.site_url)) return target.site_url;
    if (type === "train") {
      return "https://transit.yahoo.co.jp/diainfo/area/4";
    }
    if (type === "weather") {
      return "https://www.jma.go.jp/bosai/map.html#5/34.5/137/&elem=all&contents=warning";
    }
    if (type === "outage") {
      return "https://teideninfo.tepco.co.jp/";
    }
    return "";
  }

  function numberValue(input, fallback) {
    const raw = (input.value ?? "").toString().trim();
    if (raw === "") return fallback;
    const num = Number(raw);
    if (Number.isNaN(num)) return fallback;
    return num;
  }

  function listValue(raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  function hasValue(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === "string") return value.trim() !== "";
    return value !== "";
  }

  function createTextField(parent, label, value) {
    const wrap = document.createElement("label");
    wrap.className = "config-field";
    wrap.textContent = label;
    const input = document.createElement("input");
    input.type = "text";
    input.value = value ?? "";
    wrap.appendChild(input);
    parent.appendChild(wrap);
    return input;
  }

  function maybeCreateTextField(parent, label, value) {
    if (!hasValue(value)) return null;
    return createTextField(parent, label, value);
  }

  function createInlineLabel(text) {
    const span = document.createElement("span");
    span.className = "config-inline-label";
    span.textContent = text;
    return span;
  }

  function createInlineNumberInput(value) {
    const input = document.createElement("input");
    input.type = "number";
    input.value = value ?? "";
    input.className = "config-inline-input";
    return input;
  }

  function createInlineCheckbox(label, checked) {
    const wrap = document.createElement("label");
    wrap.className = "config-inline-check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!checked;
    const span = document.createElement("span");
    span.textContent = label;
    wrap.appendChild(input);
    wrap.appendChild(span);
    return { wrapper: wrap, input };
  }

  function applyTargetVisibility(grid, type) {
    const fields = grid.querySelectorAll(".config-field");
    fields.forEach((f) => (f.style.display = "flex"));

    const show = (labelText, visible) => {
      fields.forEach((f) => {
        if (f.firstChild && f.firstChild.nodeType === Node.TEXT_NODE) {
          if (f.firstChild.textContent.trim() === labelText) {
            f.style.display = visible ? "flex" : "none";
          }
        }
      });
    };

    if (type === "train") {
      show("warning_url", false);
      show("area_url", false);
      show("base_url", false);
      show("area_code", false);
      show("auth_token", false);
      show("warning_codes(カンマ)", false);
      show("threshold", false);
    } else if (type === "weather") {
      show("url", false);
      show("base_url", false);
      show("detail_base_url", false);
      show("selector", false);
      show("detail_selector", false);
      show("alert_statuses(カンマ)", false);
      show("threshold", false);
      show("area_code", false);
      show("auth_token", false);
    } else if (type === "outage") {
      show("url", false);
      show("warning_url", false);
      show("area_url", false);
      show("detail_base_url", false);
      show("selector", false);
      show("detail_selector", false);
      show("alert_statuses(カンマ)", false);
      show("warning_codes(カンマ)", false);
    } else {
      show("warning_url", false);
      show("area_url", false);
      show("base_url", false);
      show("detail_base_url", false);
      show("alert_statuses(カンマ)", false);
      show("warning_codes(カンマ)", false);
      show("threshold", false);
      show("area_code", false);
      show("auth_token", false);
    }
  }

  function applyTargetSummaryVisibility(state, type) {
    const showAlert = type === "train" || type === "generic";
    const showWarning = type === "weather";
    const showThreshold = type === "outage";
    toggleSummaryField(state.alert_statuses, showAlert);
    toggleSummaryField(state.warning_codes, showWarning);
    toggleSummaryField(state.threshold, showThreshold);
  }

  function toggleSummaryField(input, visible) {
    if (!input) return;
    const wrap = input.closest("label");
    if (wrap) wrap.style.display = visible ? "flex" : "none";
  }
  function createNumberField(parent, label, value) {
    const wrap = document.createElement("label");
    wrap.className = "config-field";
    wrap.textContent = label;
    const input = document.createElement("input");
    input.type = "number";
    input.value = value ?? "";
    wrap.appendChild(input);
    parent.appendChild(wrap);
    return input;
  }

  function maybeCreateNumberField(parent, label, value) {
    if (!hasValue(value)) return null;
    return createNumberField(parent, label, value);
  }

  function createCheckboxField(parent, label, checked) {
    const wrap = document.createElement("label");
    wrap.className = "config-field";
    wrap.textContent = label;
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!checked;
    wrap.appendChild(input);
    parent.appendChild(wrap);
    return input;
  }

  function createSelectField(parent, label, value, options) {
    const wrap = document.createElement("label");
    wrap.className = "config-field";
    wrap.textContent = label;
    const select = document.createElement("select");
    options.forEach((opt) => {
      const option = document.createElement("option");
      if (typeof opt === "object" && opt !== null) {
        option.value = opt.value;
        option.textContent = opt.label ?? opt.value;
        if (opt.value === value) option.selected = true;
      } else {
        option.value = opt;
        option.textContent = opt;
        if (opt === value) option.selected = true;
      }
      select.appendChild(option);
    });
    wrap.appendChild(select);
    parent.appendChild(wrap);
    return select;
  }

  document.getElementById("btn-config-save").addEventListener("click", () => {
    if (!currentConfigName) return;
    if (configMode === "gui" && watcherFormState) {
      const config = buildWatcherConfigFromForm();
      document.getElementById("config-textarea").value = JSON.stringify(
        config,
        null,
        2
      );
    }
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

  document.getElementById("btn-export-html").addEventListener("click", () => {
    window.location.href = "/api/export/html";
  });

  document.getElementById("btn-export-word").addEventListener("click", () => {
    fetch("/api/export/word")
      .then(async (res) => {
        if (!res.ok) {
          let message = "Wordエクスポートに失敗しました";
          try {
            const data = await res.json();
            if (data && data.error) message = data.error;
          } catch (_) {}
          throw new Error(message);
        }
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "wiki_pages_word.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        const container = document.getElementById("sec-export");
        showAlert(container, err.message || "Wordエクスポートに失敗しました", "error");
      });
  });

  document.getElementById("btn-export-pdf").addEventListener("click", () => {
    fetch("/api/config/app")
      .then((r) => r.json())
      .then((data) => {
        const config = JSON.parse(data.content || "{}");
        const host = config.host || "127.0.0.1";
        const port = config.port || 8080;
        const url = `http://${host}:${port}/pages/print/all?autoprint=1`;
        window.open(url, "_blank");
      })
      .catch(() => {
        window.open("http://127.0.0.1:8080/pages/print/all?autoprint=1", "_blank");
      });
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

  // --- Watcher ---

  function loadWatcherOverview() {
    fetch("/api/watcher/overview")
      .then((r) => r.json())
      .then((data) => {
        const statusEl = document.getElementById("watcher-overall-status");
        let statusText = data.running ? "稼働中" : "未稼働";
        let statusClass = data.running
          ? "status-badge status-healthy"
          : "status-badge status-error";
        if (isNightStopActive(data.night_stop)) {
          statusText = "夜間停止中";
          statusClass = "status-badge status-muted";
        }
        statusEl.textContent = statusText;
        statusEl.className = statusClass;

        document.getElementById("watcher-night-stop").textContent =
          formatNightStop(data.night_stop);
        document.getElementById("watcher-last-run").textContent =
          formatIso(data.last_run) || "未実行";

        renderWatcherTargets(data.targets || []);
      })
      .catch(() => {
        const statusEl = document.getElementById("watcher-overall-status");
        statusEl.textContent = "取得エラー";
        statusEl.className = "status-badge status-error";
      });
  }

  function renderWatcherTargets(targets) {
    const container = document.getElementById("watcher-targets");
    if (!targets.length) {
      container.innerHTML = '<div class="loading">ターゲットなし</div>';
      return;
    }
    container.innerHTML = targets
      .map((t) => {
        const enabled = t.enabled !== false;
        const status = enabled ? t.status : "disabled";
        const statusLabel = enabled
          ? t.status === "ok"
            ? "正常"
            : t.status === "error"
              ? "エラー"
              : "未実行"
          : "停止中";
        const dotClass =
          status === "ok"
            ? "status-ok"
            : status === "error"
              ? "status-error"
              : status === "disabled"
                ? "status-disabled"
                : "status-unknown";

        return `
          <div class="watcher-target-card">
            <div class="target-header">
              <span class="target-dot ${dotClass}"></span>
              <span class="target-name">${t.name}</span>
              <span class="target-type">${t.type}</span>
            </div>
            <div class="target-detail">
              <span>状態: ${statusLabel}</span>
              <span>最終チェック: ${formatIso(t.last_checked) || "-"}</span>
              <span>最終変化: ${formatIso(t.last_changed) || "-"}</span>
            </div>
            <div class="target-url">${t.url || ""}</div>
          </div>
        `;
      })
      .join("");
  }

  function loadWatcherEvents() {
    fetch("/api/watcher/events")
      .then((r) => r.json())
      .then((events) => {
        const tbody = document.getElementById("watcher-events-body");
        if (!Array.isArray(events) || events.length === 0) {
          tbody.innerHTML = "<tr><td colspan='3'>イベントなし</td></tr>";
          return;
        }
        tbody.innerHTML = events
          .map(
            (e) => `
          <tr>
            <td>${formatIso(e.detected_at)}</td>
            <td>${e.target_name || "-"}</td>
            <td class="watcher-event-summary">${e.summary || ""}</td>
          </tr>`
          )
          .join("");
      })
      .catch(() => {
        const tbody = document.getElementById("watcher-events-body");
        tbody.innerHTML = "<tr><td colspan='3'>取得失敗</td></tr>";
      });
  }

  function loadWatcherEventsHistory() {
    fetch("/api/watcher/events/history")
      .then((r) => r.json())
      .then((data) => {
        const totalEl = document.getElementById("watcher-event-total");
        if (typeof data.total_events === "number") {
          totalEl.textContent = `累計: ${data.total_events} 件`;
        } else {
          totalEl.textContent = "";
        }
      })
      .catch(() => {
        const totalEl = document.getElementById("watcher-event-total");
        totalEl.textContent = "";
      });
  }

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
