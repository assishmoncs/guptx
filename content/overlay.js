(async () => {
  
  if (window.__guptxOverlayReady) return;
  window.__guptxOverlayReady = true;

  
  const htmlUrl  = chrome.runtime.getURL("content/overlay.html");
  const htmlText = await fetch(htmlUrl).then((r) => r.text());

  const wrapper = document.createElement("div");
  wrapper.innerHTML = htmlText;
  document.body.appendChild(wrapper.firstElementChild); 

  
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
  const clearChatBtn  = document.getElementById("guptx-clear-chat-btn");
  
  const themeBtn      = document.getElementById("guptx-theme-btn");
  const iconSun       = document.getElementById("guptx-icon-sun");
  const iconMoon      = document.getElementById("guptx-icon-moon");

  
  let isVisible    = false;
  let isAnimating  = false;
  let settingsOpen = false;
  let chatHistory  = []; 

  
  
  
  const THEME_KEY   = "guptx_theme";
  const isLightPref = localStorage.getItem(THEME_KEY) === "light";

  
  const preferLight = localStorage.getItem(THEME_KEY) === null
    ? window.matchMedia("(prefers-color-scheme: light)").matches
    : isLightPref;

  function applyTheme(light) {
    document.documentElement.classList.toggle("guptx-light", light);
    
    iconSun.style.display  = light ? "none"  : "";
    iconMoon.style.display = light ? ""      : "none";
    localStorage.setItem(THEME_KEY, light ? "light" : "dark");
  }

  
  applyTheme(preferLight);

  themeBtn.addEventListener("click", () => {
    const isNowLight = !document.documentElement.classList.contains("guptx-light");
    applyTheme(isNowLight);
  });

  
  function applyOpacity(val) {
    panel.style.opacity      = val / 100;
    opacitySlider.value      = val;
    opacityValue.textContent = `${val}%`;
  }

  
  try {
    const stored = await GuptXStorage.get(["opacity"]);
    applyOpacity(stored.opacity ?? 90);
  } catch (_) {
    applyOpacity(90);
  }

  
  opacitySlider.addEventListener("input", () => {
    applyOpacity(parseInt(opacitySlider.value, 10));
  });

  
  opacitySlider.addEventListener("change", () => {
    GuptXStorage.set({ opacity: parseInt(opacitySlider.value, 10) }).catch(() => {});
  });

  
  async function loadHistory() {
    try {
      const data = await GuptXStorage.get(["chatHistory"]);
      return Array.isArray(data.chatHistory) ? data.chatHistory : [];
    } catch (_) { return []; }
  }

  function persistHistory() {
    
    GuptXStorage.set({ chatHistory: chatHistory.slice(-60) }).catch(() => {});
  }

  function renderHistory(messages) {
    messages.forEach(({ role, content }) => {
      appendBubble(role === "user" ? "user" : "ai", content, false);
    });
    scrollToBottom();
  }

  
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

  
  window.__guptxToggle = () => (isVisible ? hide() : show());

  
  settingsBtn.addEventListener("click", () => {
    settingsOpen = !settingsOpen;
    settingsEl.classList.toggle("guptx-open", settingsOpen);
  });

  
  function clearConversation() {
    chatHistory = [];
    GuptXStorage.set({ chatHistory: [] }).catch(() => {});
    messagesEl.innerHTML = "";
    appendBubble("system", "Conversation cleared.", false);
  }

  clearChatBtn.addEventListener("click", clearConversation);

  closeBtn.addEventListener("click", hide);

  
  
  function toggleInputFocus() {
    if (document.activeElement === inputEl) {
      inputEl.blur();
    } else {
      inputEl.focus();
    }
  }

  document.addEventListener("keydown", (e) => {
    
    if (e.key === "Escape" && isVisible) {
      hide();
      return;
    }

    
    
    
    if (e.altKey && isVisible) {
      
      if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        toggleInputFocus();
        return;
      }

      
      
      
      
      
      if (document.activeElement === inputEl) return;

      
      if (e.key === "]" || e.key === "[") {
        e.preventDefault();

        const step    = 5;
        const current = parseInt(opacitySlider.value, 10);
        const next    = e.key === "]"
          ? Math.min(100, current + step)
          : Math.max(20,  current - step);

        if (next === current) return;

        applyOpacity(next);
        GuptXStorage.set({ opacity: next }).catch(() => {});
        return;
      }

      
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        const isNowLight = !document.documentElement.classList.contains("guptx-light");
        applyTheme(isNowLight);
        return;
      }

      
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        clearConversation();
        return;
      }
    }
  }, true);

  
  let dragging = false;
  let dragOffX = 0;
  let dragOffY = 0;

  header.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;

    const rect = root.getBoundingClientRect();
    
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

  
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = `${Math.min(inputEl.scrollHeight, 120)}px`;
  });

  
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sendBtn.disabled) return;

    inputEl.value        = "";
    inputEl.style.height = "auto";
    sendBtn.disabled     = true;

    appendBubble("user", text);

    
    const historySnapshot = [...chatHistory];
    appendTypingIndicator();

    try {
      
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

  
  chatHistory = await loadHistory();
  renderHistory(chatHistory);

  if (chatHistory.length === 0) {
    appendBubble("system", "GuptX ready · Alt+X to toggle · Esc to hide", false);
  }
})();
