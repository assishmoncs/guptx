(() => {
  if (window.__guptxContentLoaded) return;
  window.__guptxContentLoaded = true;

  
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "GUPTX_TOGGLE" && typeof window.__guptxToggle === "function") {
      window.__guptxToggle();
    }
  });
})();
