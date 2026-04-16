const GUPTX_INJECT_FILES = [
  "utils/storage.js",
  "api/llm.js",
  "content/overlay.js",
  "content/content.js",
];

const TOGGLE_DEBOUNCE_MS = 250;
const MAX_TOGGLE_RETRIES = 6;
const TOGGLE_RETRY_DELAY_MS = 100;
const tabLastToggleAt = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRapidDuplicateToggle(tabId) {
  const now = Date.now();
  const last = tabLastToggleAt.get(tabId) ?? 0;
  tabLastToggleAt.set(tabId, now);
  return now - last < TOGGLE_DEBOUNCE_MS;
}

async function sendToggle(tabId) {
  await chrome.tabs.sendMessage(tabId, { type: "GUPTX_TOGGLE" });
}

async function injectOverlayScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: GUPTX_INJECT_FILES,
  });
}

async function toggleOverlayInTab(tabId) {
  if (!tabId || isRapidDuplicateToggle(tabId)) return;

  try {
    await sendToggle(tabId);
    return;
  } catch (_) {}

  try {
    await injectOverlayScripts(tabId);
  } catch (_) {
    return;
  }

  for (let retryAttempt = 0; retryAttempt < MAX_TOGGLE_RETRIES; retryAttempt += 1) {
    try {
      await sendToggle(tabId);
      return;
    } catch (_) {
      await delay(TOGGLE_RETRY_DELAY_MS);
    }
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-overlay") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await toggleOverlayInTab(tab?.id);
});

chrome.action.onClicked.addListener(async (tab) => {
  await toggleOverlayInTab(tab?.id);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabLastToggleAt.delete(tabId);
});
