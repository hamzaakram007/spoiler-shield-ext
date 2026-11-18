const enabledEl = document.getElementById("enabled");
const statusLabel = document.getElementById("status-label");
const keywordCount = document.getElementById("keyword-count");
const openOptions = document.getElementById("open-options");

function render(enabled, keywords) {
  enabledEl.checked = enabled;
  statusLabel.textContent = enabled ? "Protection on" : "Protection off";
  keywordCount.textContent = String((keywords || []).length);
}

async function load() {
  const data = await chrome.storage.sync.get(["enabled", "keywords"]);
  render(data.enabled !== false, data.keywords || []);
}

enabledEl.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: enabledEl.checked });
  statusLabel.textContent = enabledEl.checked
    ? "Protection on"
    : "Protection off";
});

openOptions.addEventListener("click", (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});

load();
