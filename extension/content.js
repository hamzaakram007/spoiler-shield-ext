(() => {
  const STATE = {
    enabled: true,
    keywords: [],
    patterns: []
  };

  const ATTR = "data-ss-shield";
  const REVEALED = "data-ss-revealed";
  let observer = null;
  let scanTimer = null;
  let lastUrl = location.href;

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function rebuildPatterns(keywords) {
    STATE.keywords = (keywords || [])
      .map((k) => String(k).trim().replace(/\s+/g, " "))
      .filter(Boolean);
    STATE.patterns = STATE.keywords.map((k) => {
      const escaped = escapeRegExp(k);
      // Prefer whole-phrase / word-ish boundaries so short words don't overfire.
      return new RegExp(`(?:^|[^\\p{L}\\p{N}_])${escaped}(?:$|[^\\p{L}\\p{N}_])`, "iu");
    });
  }

  function textMatches(text) {
    if (!text || !STATE.patterns.length) return false;
    const normalized = text.replace(/\s+/g, " ").trim();
    if (!normalized) return false;
    // Pad so boundary regex works at string edges.
    const padded = ` ${normalized} `;
    return STATE.patterns.some((re) => re.test(padded));
  }

  function nodeText(node) {
    if (!node || node.nodeType !== 1) return "";
    const parts = [
      node.innerText,
      node.textContent,
      node.getAttribute?.("aria-label"),
      node.getAttribute?.("title"),
      node.getAttribute?.("alt")
    ];
    return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
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
    if (
      node.closest?.(`[${ATTR}]`) ||
      node.closest?.(`[${REVEALED}]`) ||
      node.closest?.(".ss-reveal-btn")
    ) {
      return null;
    }
    if (isEditable(node)) return null;

    const host = location.hostname;

    if (host.includes("youtube.com")) {
      return (
        node.closest(
          [
            "ytd-rich-item-renderer",
            "ytd-video-renderer",
            "ytd-grid-video-renderer",
            "ytd-compact-video-renderer",
            "ytd-playlist-panel-video-renderer",
            "ytd-reel-item-renderer",
            "ytd-reel-video-renderer",
            "ytd-rich-grid-media",
            "ytd-search-pyv-renderer",
            "ytd-radio-renderer",
            "ytm-rich-item-renderer",
            "ytm-video-with-context-renderer",
            "ytm-compact-video-renderer"
          ].join(", ")
        ) ||
        node.closest("#dismissible") ||
        node.closest("ytd-thumbnail")?.parentElement ||
        node
      );
    }

    if (host.includes("reddit.com")) {
      return (
        node.closest(
          "article, shreddit-post, faceplate-tracker, .Post, [data-testid='post-container'], [data-scroller-item]"
        ) || node
      );
    }

    if (host.includes("x.com") || host.includes("twitter.com")) {
      return (
        node.closest('article[data-testid="tweet"], article[role="article"], article') ||
        node
      );
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
      "a#video-title",
      "yt-formatted-string",
      "[data-testid='tweetText']",
      "[slot='title']",
      "a[slot='full-post-link']",
      "a[aria-label]",
      "img[alt]",
      "#video-title yt-formatted-string",
      "ytd-rich-grid-media #video-title",
      "faceplate-tracker a",
      "[data-ad-preview='title']"
    ];
    const set = new Set();
    for (const sel of selectors) {
      try {
        root.querySelectorAll?.(sel)?.forEach((el) => set.add(el));
      } catch {
        /* ignore invalid selector in odd roots */
      }
    }
    return [...set];
  }

  function collectBlurables(target) {
    const blurables = new Set();
    const media = target.querySelectorAll(
      [
        "img",
        "video",
        "ytd-thumbnail",
        "#thumbnail",
        "#thumbnail-container",
        ".yt-core-image",
        "[data-testid='tweetPhoto']",
        "[data-testid='videoComponent']",
        "[data-testid='card.layoutLarge.media']",
        "shreddit-aspect-ratio",
        "[slot='thumbnail']",
        "faceplate-img"
      ].join(", ")
    );
    media.forEach((m) => blurables.add(m));

    const titleLike = target.querySelectorAll(
      [
        "#video-title",
        "#video-title-link",
        "a#video-title",
        "h1",
        "h2",
        "h3",
        "[slot='title']",
        "[data-testid='tweetText']",
        "a[slot='full-post-link']",
        "[data-ad-preview='title']",
        "a[aria-label]"
      ].join(", ")
    );
    titleLike.forEach((t) => blurables.add(t));

    if (!blurables.size) blurables.add(target);
    return [...blurables];
  }

  function ensureRevealButton(target, matchedText) {
    if (target.querySelector(":scope > .ss-reveal-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ss-reveal-btn";
    btn.textContent = "Reveal spoiler";
    btn.setAttribute("aria-label", "Reveal spoiler");
    btn.title = matchedText
      ? `Matched: ${matchedText.slice(0, 80)}`
      : "Reveal blurred content";
    btn.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        revealTarget(target);
      },
      true
    );

    const style = getComputedStyle(target);
    if (style.position === "static") {
      target.style.position = "relative";
    }
    target.appendChild(btn);
  }

  function revealTarget(target) {
    target.setAttribute(REVEALED, "1");
    target.setAttribute(ATTR, "1");
    target.classList.add("ss-revealed");
    target.classList.remove("ss-blur-host");
    target.querySelectorAll(".ss-blurred").forEach((el) => {
      el.classList.remove("ss-blurred");
    });
    target.querySelectorAll(".ss-reveal-btn").forEach((b) => b.remove());
    target.querySelectorAll(".ss-blur-veil").forEach((v) => v.remove());
  }

  function ensureVeil(target) {
    if (target.querySelector(":scope > .ss-blur-veil")) return;
    const veil = document.createElement("div");
    veil.className = "ss-blur-veil";
    veil.setAttribute("aria-hidden", "true");
    target.appendChild(veil);
  }

  function shieldElement(target, matchedText) {
    if (!target) return;
    if (target.getAttribute(REVEALED) === "1" || target.classList.contains("ss-revealed")) {
      return;
    }

    target.setAttribute(ATTR, "1");
    target.classList.add("ss-blur-host");

    collectBlurables(target).forEach((el) => el.classList.add("ss-blurred"));
    ensureVeil(target);
    ensureRevealButton(target, matchedText);
  }

  function repairShields(root = document) {
    root.querySelectorAll?.(`[${ATTR}="1"]:not([${REVEALED}])`)?.forEach((target) => {
      if (target.classList.contains("ss-revealed")) return;
      target.classList.add("ss-blur-host");
      collectBlurables(target).forEach((el) => el.classList.add("ss-blurred"));
      ensureVeil(target);
      ensureRevealButton(target, "");
    });
  }

  function scan(root = document) {
    if (!STATE.enabled || !STATE.patterns.length) return;
    repairShields(root);
    const nodes = collectCandidateNodes(root);
    for (const node of nodes) {
      const text = nodeText(node);
      if (!textMatches(text)) continue;
      const target = findBlurTarget(node);
      if (target) shieldElement(target, text);
    }
  }

  function scheduleScan(delay = 80) {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanTimer = null;
      const run = () => scan(document);
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(run, { timeout: 200 });
      } else {
        run();
      }
    }, delay);
  }

  function clearShields({ keepRevealed = false } = {}) {
    document.querySelectorAll(`[${ATTR}]`).forEach((el) => {
      const wasRevealed =
        el.getAttribute(REVEALED) === "1" || el.classList.contains("ss-revealed");
      if (keepRevealed && wasRevealed) return;

      el.removeAttribute(ATTR);
      el.removeAttribute(REVEALED);
      el.classList.remove("ss-blur-host", "ss-revealed");
      el.querySelectorAll(".ss-blurred").forEach((b) =>
        b.classList.remove("ss-blurred")
      );
      el.querySelectorAll(".ss-reveal-btn, .ss-blur-veil").forEach((b) => b.remove());
    });
  }

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      let needsScan = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length)) {
          needsScan = true;
          break;
        }
        if (mutation.type === "characterData") {
          needsScan = true;
          break;
        }
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "aria-label" ||
            mutation.attributeName === "title" ||
            mutation.attributeName === "alt")
        ) {
          needsScan = true;
          break;
        }
      }
      if (needsScan) scheduleScan();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "title", "alt"]
    });
  }

  function watchSpaNavigation() {
    const checkUrl = () => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      scheduleScan(40);
    };

    window.addEventListener("popstate", checkUrl);
    window.addEventListener("yt-navigate-finish", () => scheduleScan(40));
    window.addEventListener("yt-page-data-updated", () => scheduleScan(40));

    const wrapHistory = (method) => {
      const original = history[method];
      if (typeof original !== "function") return;
      history[method] = function wrappedHistory(...args) {
        const result = original.apply(this, args);
        queueMicrotask(checkUrl);
        return result;
      };
    };
    wrapHistory("pushState");
    wrapHistory("replaceState");

    setInterval(checkUrl, 1000);
  }

  async function loadSettings() {
    const data = await chrome.storage.sync.get(["enabled", "keywords"]);
    STATE.enabled = data.enabled !== false;
    rebuildPatterns(data.keywords || []);
  }

  async function applySettings({ preserveRevealed = true } = {}) {
    await loadSettings();
    clearShields({ keepRevealed: preserveRevealed });
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
    if (changes.enabled || changes.keywords) {
      applySettings({ preserveRevealed: !changes.keywords });
    }
  });

  watchSpaNavigation();
  applySettings();
  // Catch late-hydrated feed cards after idle inject.
  scheduleScan(250);
  scheduleScan(1000);
})();
