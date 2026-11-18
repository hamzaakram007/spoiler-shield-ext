(() => {
  const STATE = {
    enabled: true,
    keywords: [],
    patterns: []
  };

  const ATTR = "data-ss-shield";
  let observer = null;
  let scanTimer = null;

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function rebuildPatterns(keywords) {
    STATE.keywords = (keywords || [])
      .map((k) => String(k).trim())
      .filter(Boolean);
    STATE.patterns = STATE.keywords.map(
      (k) => new RegExp(`\\b${escapeRegExp(k)}\\b`, "i")
    );
  }

  function textMatches(text) {
    if (!text || !STATE.patterns.length) return false;
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return false;
    return STATE.patterns.some((re) => re.test(normalized));
  }

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    );
  }

  function findBlurTarget(node) {
    if (!node || node.nodeType !== 1) return null;
    if (node.closest?.(`[${ATTR}]`) || node.closest?.(".ss-reveal-btn")) {
      return null;
    }
    if (isEditable(node)) return null;

    const host = location.hostname;

    if (host.includes("youtube.com")) {
      return (
        node.closest(
          "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-playlist-panel-video-renderer, ytd-reel-item-renderer"
        ) || node.closest("#dismissible") || node
      );
    }

    if (host.includes("reddit.com")) {
      return (
        node.closest("article, shreddit-post, .Post, [data-testid='post-container']") ||
        node
      );
    }

    if (host.includes("x.com") || host.includes("twitter.com")) {
      return node.closest('article[data-testid="tweet"], article') || node;
    }

    return node;
  }

  function collectCandidateNodes(root) {
    const selectors = [
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "[role='heading']",
      "#video-title",
      "#video-title-link",
      "yt-formatted-string",
      "[data-testid='tweetText']",
      "[slot='title']",
      "a[slot='full-post-link']"
    ];
    const set = new Set();
    for (const sel of selectors) {
      root.querySelectorAll?.(sel)?.forEach((el) => set.add(el));
    }
    return [...set];
  }

  function shieldElement(target, matchedText) {
    if (!target || target.getAttribute(ATTR) === "1") return;

    target.setAttribute(ATTR, "1");
    target.classList.add("ss-blur-host");

    const blurables = [];
    const media = target.querySelectorAll(
      "img, video, ytd-thumbnail, #thumbnail, [data-testid='tweetPhoto'], [data-testid='videoComponent']"
    );
    media.forEach((m) => blurables.push(m));

    const titleLike = target.querySelectorAll(
      "#video-title, #video-title-link, a#video-title, h1, h2, h3, [slot='title'], [data-testid='tweetText'], a[slot='full-post-link']"
    );
    titleLike.forEach((t) => blurables.push(t));

    if (!blurables.length) blurables.push(target);

    blurables.forEach((el) => el.classList.add("ss-blurred"));

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ss-reveal-btn";
    btn.textContent = "Reveal spoiler";
    btn.title = matchedText
      ? `Matched: ${matchedText.slice(0, 80)}`
      : "Reveal blurred content";
    btn.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        target.classList.add("ss-revealed");
        target.querySelectorAll(".ss-blurred").forEach((el) => {
          el.classList.remove("ss-blurred");
        });
        btn.remove();
      },
      true
    );

    const style = getComputedStyle(target);
    if (style.position === "static") {
      target.style.position = "relative";
    }
    target.appendChild(btn);
  }

  function scan(root = document) {
    if (!STATE.enabled || !STATE.patterns.length) return;
    const nodes = collectCandidateNodes(root);
    for (const node of nodes) {
      const text = (node.innerText || node.textContent || "").trim();
      if (!textMatches(text)) continue;
      const target = findBlurTarget(node);
      if (target) shieldElement(target, text);
    }
  }

  function scheduleScan() {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => scan(document), 120);
  }

  function clearShields() {
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => {
      el.removeAttribute(ATTR);
      el.classList.remove("ss-blur-host", "ss-revealed");
      el.querySelectorAll(".ss-blurred").forEach((b) =>
        b.classList.remove("ss-blurred")
      );
      el.querySelectorAll(".ss-reveal-btn").forEach((b) => b.remove());
    });
  }

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => scheduleScan());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  async function loadSettings() {
    const data = await chrome.storage.sync.get(["enabled", "keywords"]);
    STATE.enabled = data.enabled !== false;
    rebuildPatterns(data.keywords || []);
  }

  async function applySettings() {
    await loadSettings();
    clearShields();
    if (STATE.enabled) {
      scan(document);
      startObserver();
    } else if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.enabled || changes.keywords) applySettings();
  });

  applySettings();
})();
