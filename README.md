# GuptX

**GuptX** is a stealth AI assistant Chrome extension that works as a hidden intelligent layer over the web.
It provides instant AI assistance through a floating overlay without interrupting your browsing workflow.

Press **Alt + X** anytime to summon your private AI assistant.

---

## 🚀 Version 2.0.0

GuptX v2 introduces major usability and workflow improvements focused on speed, control, and accessibility.

### New in v2.0.0

* 🎨 Dark / Light theme toggle (keyboard shortcut)
* 👻 Opacity control shortcuts
* 🔧 Minimum opacity reduced to **0%**
* 🧹 Clear conversation option (button + shortcut)
* ⌨️ Improved keyboard interaction while typing
* ⚡ Better focus handling and smoother UX

---

## ✨ Features

* ⚡ Keyboard-triggered AI overlay
* 🧠 Powered by Groq LLM API
* 🎨 Dark & Light themes
* 👻 Adjustable transparency (0%–100%)
* 💬 Persistent chat history
* 🧹 Clear conversation anytime
* 🪟 Draggable floating panel
* 🔒 Local preference storage
* 🌐 Works on any website

---

## ⌨️ Keyboard Shortcuts

| Shortcut    | Action                    |
| ----------- | ------------------------- |
| **Alt + X** | Toggle GuptX              |
| **Alt + T** | Toggle Dark / Light theme |
| **Alt + ]** | Increase opacity          |
| **Alt + [** | Decrease opacity          |
| **Alt + C** | Clear conversation        |
| **Alt + I** | Focus / unfocus input box |
| **Esc**     | Hide overlay              |

Shortcuts can be customized at:

```
chrome://extensions/shortcuts
```

---

## 🧱 Tech Stack

* Chrome Extension (Manifest V3)
* HTML, CSS, Vanilla JavaScript
* Groq API (LLM inference)
* chrome.storage.local

---

## 📦 Installation (Developer Mode)

1. Download the latest ZIP from **Releases**.

2. Extract the archive.

3. Open Chrome and navigate to:

   ```
   chrome://extensions
   ```

4. Enable **Developer Mode** (top-right).

5. Click **Load unpacked**.

6. Select the extracted folder.

GuptX will now be available in your browser.

---

## 🔑 API Setup

1. Create a free API key at:
   https://console.groq.com

2. Add your API key inside the extension when prompted.

⚠️ API keys are stored locally and are never included in this repository.

---

## 📁 Project Structure

```
guptx/
├── manifest.json
├── background/
├── content/
├── api/
├── utils/
└── assets/
```

---

## 🎯 Project Vision

GuptX explores the concept of an **AI layer integrated directly into browsing**, enabling fast interaction with AI without opening new tabs or disrupting workflow.

---

## ⚠️ Disclaimer

GuptX is intended for learning, productivity, and experimentation purposes.

---

## 📜 License

MIT License © 2026 ASSISHMON C S