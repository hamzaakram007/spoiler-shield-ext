const enabledEl = document.getElementById("enabled");
const statusLabel = document.getElementById("status-label");
const keywordCount = document.getElementById("keyword-count");
const openOptions = document.getElementById("open-options");
const onboardTip = document.getElementById("onboard-tip");
const onboardLink = document.getElementById("onboard-link");
const quickInput = document.getElementById("quick-keyword");
const quickBtn = document.getElementById("quick-add-btn");
const quickStatus = document.getElementById("quick-status");

const MAX_KEYWORDS = 200;
let keywords = [];
let statusTimer = null;

function normalize(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function showQuickStatus(message, isError = false) {
  quickStatus.hidden = false;
  quickStatus.textContent = message;
  quickStatus.classList.toggle("error", isError);
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    quickStatus.hidden = true;
    quickStatus.classList.remove("error");
  }, 1600);
}

function render(enabled) {
  enabledEl.checked = enabled;
  statusLabel.textContent = enabled ? "Protection on" : "Protection off";
  keywordCount.textContent = String(keywords.length);
}

async function load() {
  const data = await chrome.storage.sync.get([
    "enabled",
    "keywords",
    "onboarded"
  ]);
  keywords = Array.isArray(data.keywords)
    ? data.keywords.map(normalize).filter(Boolean)
    : [];
  render(data.enabled !== false);

  const needsOnboard = data.onboarded !== true;
  onboardTip.hidden = !needsOnboard;
  if (needsOnboard) {
    await chrome.storage.sync.set({ onboarded: true });
  }
}

async function addQuickKeyword() {
  const value = normalize(quickInput.value);
  if (!value) {
    showQuickStatus("Type a keyword first", true);
    quickInput.focus();
    return;
  }
  if (keywords.length >= MAX_KEYWORDS) {
    showQuickStatus("Keyword limit reached", true);
    return;
  }
  const exists = keywords.some((k) => k.toLowerCase() === value.toLowerCase());
  if (exists) {
    showQuickStatus("Already in the list", true);
    quickInput.select();
    return;
  }
  keywords = [...keywords, value];
  await chrome.storage.sync.set({ keywords });
  keywordCount.textContent = String(keywords.length);
  quickInput.value = "";
  showQuickStatus("Added");
  quickInput.focus();
}

enabledEl.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: enabledEl.checked });
  statusLabel.textContent = enabledEl.checked
    ? "Protection on"
    : "Protection off";
});

quickBtn.addEventListener("click", addQuickKeyword);
quickInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addQuickKeyword();
  }
});

function openSettings(event) {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
}

openOptions.addEventListener("click", openSettings);
onboardLink.addEventListener("click", openSettings);

load();
