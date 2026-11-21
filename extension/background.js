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

const MAX_KEYWORDS = 200;

function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const value = String(raw || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 80);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

chrome.runtime.onInstalled.addListener(async (details) => {
  const current = await chrome.storage.sync.get([
    "enabled",
    "keywords",
    "onboarded"
  ]);
  const updates = {};

  if (typeof current.enabled !== "boolean") updates.enabled = true;

  const keywords = normalizeList(current.keywords);
  if (!keywords.length) {
    updates.keywords = DEFAULT_KEYWORDS;
  } else if (keywords.length !== (current.keywords || []).length) {
    updates.keywords = keywords;
  }

  if (details.reason === "install") {
    if (current.onboarded !== true) updates.onboarded = false;
    await chrome.storage.sync.set(updates);
    try {
      await chrome.runtime.openOptionsPage();
    } catch {
      /* options may fail in rare install contexts */
    }
    return;
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
        keywords: normalizeList(data.keywords).length
          ? normalizeList(data.keywords)
          : DEFAULT_KEYWORDS
      });
    });
    return true;
  }
  return false;
});
