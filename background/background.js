// background/background.js
// Service worker: routes keyboard commands and toolbar clicks to the active tab.

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-overlay") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  // Inject content script on demand in case it wasn't loaded yet (e.g. extensions page)
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/content.js"]
    });
  } catch (_) {
    // Script likely already injected — that's fine
  }

  chrome.tabs.sendMessage(tab.id, { type: "GUPTX_TOGGLE" }).catch(() => {
    // Content script not ready on restricted pages — silently fail
  });
});

// Toolbar icon click also toggles the overlay
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/content.js"]
    });
  } catch (_) {}

  chrome.tabs.sendMessage(tab.id, { type: "GUPTX_TOGGLE" }).catch(() => {});
});
