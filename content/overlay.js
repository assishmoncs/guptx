// content/overlay.js
// GuptX overlay UI controller.
// Runs as a CONTENT SCRIPT (extension world) — chrome.* APIs and GuptXLLM
// are available directly. No page-world bridging required.
//
// Load order guaranteed by manifest.json:
//   utils/storage.js  →  api/llm.js  →  overlay.js  →  content.js

(async () => {
  // ── Guard: prevent double-initialisation ─────────────────────────
  if (window.__guptxOverlayReady) return;
  window.__guptxOverlayReady = true;

  // ── Load HTML template via extension URL ─────────────────────────
  const htmlUrl  = chrome.runtime.getURL("content/overlay.html");
  const htmlText = await fetch(htmlUrl).then((r) => r.text());

  const wrapper = document.createElement("div");
  wrapper.innerHTML = htmlText;
  document.body.appendChild(wrapper.firstElementChild); // mounts #guptx-root

  // ── Element references ───────────────────────────────────────────
  const root          = document.getElementById("guptx-root");
  const panel         = document.getElementById("guptx-panel");
  const header        = document.getElementById("guptx-header");
  const closeBtn      = document.getElementById("guptx-close-btn");
  const settingsBtn   = document.getElementById("guptx-settings-btn");
  const settingsEl    = document.getElementById("guptx-settings");
  const opacitySlider = document.getElementById("guptx-opacity-slider");
  const opacityValue  = document.getElementById("guptx-opacity-value");
  const messagesEl    = document.getElementById("guptx-messages");
  const inputEl       = document.getElementById("guptx-input");
  const sendBtn       = document.getElementById("guptx-send-btn");
  const clearBtn      = document.getElementById("guptx-clear-btn");
  // Feature 1 — theme elements
  const themeBtn      = document.getElementById("guptx-theme-btn");
  const iconSun       = document.getElementById("guptx-icon-sun");
  const iconMoon      = document.getElementById("guptx-icon-moon");

  // ── State ────────────────────────────────────────────────────────
  let isVisible    = false;
  let isAnimating  = false;
  let settingsOpen = false;
  let chatHistory  = []; // { role: "user"|"assistant", content: string }[]

  // ── Feature 1: Dark / Light Theme ───────────────────────────────
  // Theme class is toggled on <html> so CSS variables defined under
  // .guptx-light take effect globally for the overlay.
  const THEME_KEY   = "guptx_theme";
  const isLightPref = localStorage.getItem(THEME_KEY) === "light";

  // Auto-detect system preference on first run (no saved pref yet)
  const preferLight = localStorage.getItem(THEME_KEY) === null
    ? window.matchMedia("(prefers-color-scheme: light)").matches
    : isLightPref;

  function applyTheme(light) {
    document.documentElement.classList.toggle("guptx-light", light);
    // Swap sun/moon icon to reflect current mode
    iconSun.style.display  = light ? "none"  : "";
    iconMoon.style.display = light ? ""      : "none";
    localStorage.setItem(THEME_KEY, light ? "light" : "dark");
  }

  // Apply on boot
  applyTheme(preferLight);

  themeBtn.addEventListener("click", () => {
    const isNowLight = !document.documentElement.classList.contains("guptx-light");
    applyTheme(isNowLight);
  });

  // ── Opacity ──────────────────────────────────────────────────────
  function applyOpacity(val) {
    panel.style.opacity      = val / 100;
    opacitySlider.value      = val;
    opacityValue.textContent = `${val}%`;
  }

  // Load persisted opacity directly from chrome.storage via GuptXStorage
  try {
    const stored = await GuptXStorage.get(["opacity"]);
    applyOpacity(stored.opacity ?? 90);
  } catch (_) {
    applyOpacity(90);
  }

  // Live preview while dragging the slider
  opacitySlider.addEventListener("input", () => {
    applyOpacity(parseInt(opacitySlider.value, 10));
  });

  // Persist on pointer release
  opacitySlider.addEventListener("change", () => {
    GuptXStorage.set({ opacity: parseInt(opacitySlider.value, 10) }).catch(() => {});
  });

  // ── Chat history ─────────────────────────────────────────────────
  async function loadHistory() {
    try {
      const data = await GuptXStorage.get(["chatHistory"]);
      return Array.isArray(data.chatHistory) ? data.chatHistory : [];
    } catch (_) { return []; }
  }

  function persistHistory() {
    // Keep last 60 messages to stay within storage limits
    GuptXStorage.set({ chatHistory: chatHistory.slice(-60) }).catch(() => {});
  }

  function renderHistory(messages) {
    messages.forEach(({ role, content }) => {
      appendBubble(role === "user" ? "user" : "ai", content, false);
    });
    scrollToBottom();
  }

  // ── Bubble rendering ─────────────────────────────────────────────
  function appendBubble(type, text, save = true) {
    const div = document.createElement("div");
    div.className   = `guptx-msg guptx-msg-${type}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToBottom();

    if (save && (type === "user" || type === "ai")) {
      chatHistory.push({
        role:    type === "user" ? "user" : "assistant",
        content: text,
      });
      persistHistory();
    }

    return div;
  }

  function appendTypingIndicator() {
    const div = document.createElement("div");
    div.className = "guptx-typing";
    div.id        = "guptx-typing";
    div.innerHTML = `
      <div class="guptx-typing-dot"></div>
      <div class="guptx-typing-dot"></div>
      <div class="guptx-typing-dot"></div>`;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    document.getElementById("guptx-typing")?.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── Visibility ───────────────────────────────────────────────────
  function show() {
    if (isVisible || isAnimating) return;
    isVisible   = true;
    isAnimating = true;

    panel.classList.remove("guptx-hidden", "guptx-leaving");
    panel.classList.add("guptx-entering");

    panel.addEventListener("animationend", () => {
      panel.classList.remove("guptx-entering");
      isAnimating = false;
      inputEl.focus();
    }, { once: true });
  }

  function hide() {
    if (!isVisible || isAnimating) return;
    isVisible   = false;
    isAnimating = true;

    panel.classList.remove("guptx-entering");
    panel.classList.add("guptx-leaving");

    panel.addEventListener("animationend", () => {
      panel.classList.remove("guptx-leaving");
      panel.classList.add("guptx-hidden");
      isAnimating = false;
    }, { once: true });
  }

  // Exposed so content.js can call toggle without needing its own event system
  window.__guptxToggle = () => (isVisible ? hide() : show());

  // ── Settings drawer ───────────────────────────────────────────────
  settingsBtn.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    settingsEl.classList.toggle("guptx-open", settingsOpen);
  });

  clearBtn.addEventListener("click", () => {
    chatHistory = [];
    GuptXStorage.set({ chatHistory: [] }).catch(() => {});
    messagesEl.innerHTML = "";
    appendBubble("system", "Conversation cleared.", false);
  });

  closeBtn.addEventListener("click", hide);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    // Escape: hide overlay
    if (e.key === "Escape" && isVisible) {
      hide();
      return;
    }

    // Feature 2: Alt+ArrowUp / Alt+ArrowDown — opacity control
    // Only fires when overlay is visible and focus is NOT in the textarea
    if (e.altKey && isVisible && document.activeElement !== inputEl) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault(); // block browser scroll / zoom shortcuts

        const step    = 5;
        const current = parseInt(opacitySlider.value, 10);
        const next    = e.key === "ArrowUp"
          ? Math.min(100, current + step)
          : Math.max(30,  current - step);

        if (next === current) return; // already at limit, nothing to do

        // Update panel opacity, slider position, and label in one call
        applyOpacity(next);

        // Persist the new value via existing storage logic
        GuptXStorage.set({ opacity: next }).catch(() => {});
      }
    }
  }, true);

  // ── Dragging ──────────────────────────────────────────────────────
  let dragging = false;
  let dragOffX = 0;
  let dragOffY = 0;

  header.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;

    const rect = root.getBoundingClientRect();
    // Swap right/bottom origin to left/top so dragging math is straightforward
    root.style.right  = "auto";
    root.style.bottom = "auto";
    root.style.left   = `${rect.left}px`;
    root.style.top    = `${rect.top}px`;

    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    root.style.left = `${Math.max(0, e.clientX - dragOffX)}px`;
    root.style.top  = `${Math.max(0, e.clientY - dragOffY)}px`;
  });

  document.addEventListener("mouseup", () => { dragging = false; });

  // ── Auto-resize textarea ──────────────────────────────────────────
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = `${Math.min(inputEl.scrollHeight, 120)}px`;
  });

  // ── Send message ──────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;

    inputEl.value        = "";
    inputEl.style.height = "auto";
    sendBtn.disabled     = true;

    appendBubble("user", text);

    // Snapshot the full history (including the message just appended above)
    const historySnapshot = [...chatHistory];
    appendTypingIndicator();

    try {
      // Direct call to GuptXLLM — no relay, no events, no postMessage.
      const reply = await GuptXLLM.sendMessage(historySnapshot);
      removeTypingIndicator();
      appendBubble("ai", reply);
    } catch (err) {
      removeTypingIndicator();
      appendBubble("system", `⚠ ${err.message || "Request failed."}`);
    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ── Boot ──────────────────────────────────────────────────────────
  chatHistory = await loadHistory();
  renderHistory(chatHistory);

  if (chatHistory.length === 0) {
    appendBubble("system", "GuptX ready · Alt+X to toggle · Esc to hide", false);
  }
})();
