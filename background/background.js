chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-overlay") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/content.js"]
    });
  } catch (_) {
    
  }

  chrome.tabs.sendMessage(tab.id, { type: "GUPTX_TOGGLE" }).catch(() => {
    
  });
});

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
