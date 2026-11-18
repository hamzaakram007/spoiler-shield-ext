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
const saveStatus = document.getElementById("save-status");

let keywords = [];
let statusTimer = null;

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function showSaved() {
  saveStatus.hidden = false;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saveStatus.hidden = true;
  }, 1200);
}

async function persist() {
  await chrome.storage.sync.set({ keywords });
  showSaved();
  render();
}

function render() {
  listEl.innerHTML = "";
  if (!keywords.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No keywords yet — add one above.";
    listEl.appendChild(empty);
    return;
  }

  keywords.forEach((word, index) => {
    const li = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = word;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Remove";
    remove.addEventListener("click", async () => {
      keywords = keywords.filter((_, i) => i !== index);
      await persist();
    });
    li.append(code, remove);
    listEl.appendChild(li);
  });
}

async function addKeyword() {
  const value = normalize(inputEl.value);
  if (!value) return;
  const exists = keywords.some((k) => k.toLowerCase() === value.toLowerCase());
  if (!exists) {
    keywords = [...keywords, value];
    await persist();
  }
  inputEl.value = "";
  inputEl.focus();
}

addBtn.addEventListener("click", addKeyword);
inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addKeyword();
  }
});

resetBtn.addEventListener("click", async () => {
  keywords = [...DEFAULT_KEYWORDS];
  await persist();
});

(async () => {
  const data = await chrome.storage.sync.get(["keywords"]);
  keywords = Array.isArray(data.keywords) && data.keywords.length
    ? data.keywords.map(normalize).filter(Boolean)
    : [...DEFAULT_KEYWORDS];
  if (!Array.isArray(data.keywords) || !data.keywords.length) {
    await chrome.storage.sync.set({ keywords });
  }
  render();
})();
