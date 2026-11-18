const DEFAULT_KEYWORDS = [
  "ending",
  "final mission",
  "story spoilers",
  "boss fight",
  "character death",
  "secret ending",
  "post credits",
  "true ending"
];

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(["enabled", "keywords"]);
  const updates = {};
  if (typeof current.enabled !== "boolean") updates.enabled = true;
  if (!Array.isArray(current.keywords) || current.keywords.length === 0) {
    updates.keywords = DEFAULT_KEYWORDS;
  }
  if (Object.keys(updates).length) {
    await chrome.storage.sync.set(updates);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_SETTINGS") {
    chrome.storage.sync.get(["enabled", "keywords"]).then((data) => {
      sendResponse({
        enabled: data.enabled !== false,
        keywords: Array.isArray(data.keywords) ? data.keywords : DEFAULT_KEYWORDS
      });
    });
    return true;
  }
  return false;
});
