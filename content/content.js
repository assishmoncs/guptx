// content/content.js
// GuptX content script — minimal coordinator.
// Runs AFTER overlay.js in the extension world (manifest load order).
//
// Sole responsibility: relay the toggle command from background.js to the
// overlay, which is already initialised by the time this file executes.
//
// All chrome.* calls, LLM requests, and storage I/O happen directly in
// overlay.js and the modules it uses. No bridging or event gymnastics needed.

(() => {
  if (window.__guptxContentLoaded) return;
  window.__guptxContentLoaded = true;

  // Receive toggle from background.js (keyboard shortcut or toolbar click)
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "GUPTX_TOGGLE" && typeof window.__guptxToggle === "function") {
      window.__guptxToggle();
    }
  });
})();
