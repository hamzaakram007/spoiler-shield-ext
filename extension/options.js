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

const listEl = document.getElementById("keyword-list");
const inputEl = document.getElementById("new-keyword");
const addBtn = document.getElementById("add-btn");
const resetBtn = document.getElementById("reset-btn");
const sortBtn = document.getElementById("sort-btn");
const saveStatus = document.getElementById("save-status");
const enabledEl = document.getElementById("enabled");
const enabledLabel = document.getElementById("enabled-label");
const keywordCount = document.getElementById("keyword-count");
const filterEl = document.getElementById("filter-keywords");
const bulkEl = document.getElementById("bulk-keywords");
const bulkBtn = document.getElementById("bulk-btn");

let keywords = [];
let statusTimer = null;

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function showStatus(message, isError = false) {
  saveStatus.hidden = false;
  saveStatus.textContent = message;
  saveStatus.classList.toggle("error", isError);
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saveStatus.hidden = true;
    saveStatus.classList.remove("error");
  }, 1600);
}

async function persist(message = "Saved") {
  await chrome.storage.sync.set({ keywords });
  showStatus(message);
  render();
}

function renderEnabled(enabled) {
  enabledEl.checked = enabled;
  enabledLabel.textContent = enabled ? "On" : "Off";
}

function render() {
  keywordCount.textContent = String(keywords.length);
  const query = normalize(filterEl.value).toLowerCase();
  listEl.innerHTML = "";

  const visible = keywords
    .map((word, index) => ({ word, index }))
    .filter(({ word }) => !query || word.toLowerCase().includes(query));

  if (!keywords.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No keywords yet — add one above.";
    listEl.appendChild(empty);
    return;
  }

  if (!visible.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No keywords match that filter.";
    listEl.appendChild(empty);
    return;
  }

  visible.forEach(({ word, index }) => {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = word;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${word}`);
    remove.addEventListener("click", async () => {
      keywords = keywords.filter((_, i) => i !== index);
      await persist("Removed");
    });
    li.append(code, remove);
    listEl.appendChild(li);
  });
}

async function addKeyword() {
  const value = normalize(inputEl.value);
  if (!value) {
    showStatus("Enter a keyword first", true);
    inputEl.focus();
    return;
  }
  const exists = keywords.some((k) => k.toLowerCase() === value.toLowerCase());
  if (exists) {
    showStatus("Already in the list", true);
    inputEl.select();
    return;
  }
  keywords = [...keywords, value];
  await persist("Added");
  inputEl.value = "";
  inputEl.focus();
}

async function addBulk() {
  const raw = bulkEl.value || "";
  const parts = raw
    .split(/[\n,;]+/)
    .map(normalize)
    .filter(Boolean);
  if (!parts.length) {
    showStatus("Paste keywords first", true);
    bulkEl.focus();
    return;
  }

  const existing = new Set(keywords.map((k) => k.toLowerCase()));
  const next = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (existing.has(key)) continue;
    existing.add(key);
    next.push(part);
  }

  if (!next.length) {
    showStatus("All were duplicates", true);
    return;
  }

  keywords = [...keywords, ...next];
  bulkEl.value = "";
  await persist(`Added ${next.length}`);
}

addBtn.addEventListener("click", addKeyword);
inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addKeyword();
  }
});

bulkBtn.addEventListener("click", addBulk);
filterEl.addEventListener("input", render);

sortBtn.addEventListener("click", async () => {
  keywords = [...keywords].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  await persist("Sorted");
});

resetBtn.addEventListener("click", async () => {
  const ok = window.confirm(
    "Replace your keyword list with the default spoiler phrases?"
  );
  if (!ok) return;
  keywords = [...DEFAULT_KEYWORDS];
  filterEl.value = "";
  await persist("Defaults restored");
});

enabledEl.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: enabledEl.checked });
  renderEnabled(enabledEl.checked);
  showStatus(enabledEl.checked ? "Protection on" : "Protection off");
});

(async () => {
  const data = await chrome.storage.sync.get(["keywords", "enabled"]);
  keywords =
    Array.isArray(data.keywords) && data.keywords.length
      ? data.keywords.map(normalize).filter(Boolean)
      : [...DEFAULT_KEYWORDS];
  if (!Array.isArray(data.keywords) || !data.keywords.length) {
    await chrome.storage.sync.set({ keywords });
  }
  renderEnabled(data.enabled !== false);
  render();
})();
