# Spoiler Shield by NeonGulf

Chrome extension that **blurs spoiler titles and thumbnails** matching your keyword list on **YouTube**, **Reddit**, and **X**. Popup on/off + quick-add, options page, and a marketing landing under `/web`.

A **NeonGulf** product by Hamza Akram. Independent tool — not affiliated with YouTube, Reddit, X, or any game publisher.

**Landing:** https://shield.neongulf.com  
**Repo:** https://github.com/hamzaakram007/spoiler-shield-ext

## Repo layout

```
extension/     ← load this folder in Chrome (unpacked) — ALSO the Chrome Web Store zip root
  manifest.json
  background.js
  content.js / content.css
  popup.* / options.*
  icons/
web/           ← marketing landing + install guide (Vercel → shield.neongulf.com)
```

## Install (unpacked)

1. Download the [ZIP](https://github.com/hamzaakram007/spoiler-shield-ext/archive/refs/heads/main.zip) or clone:
   ```bash
   git clone https://github.com/hamzaakram007/spoiler-shield-ext.git
   cd spoiler-shield-ext
   ```
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `extension/` folder inside this repo (not the repo root, not `web/`)
6. Pin **Spoiler Shield** from the extensions menu

After pulling updates, hit the refresh icon on the extension card so the new content script loads.

## Use

- **Popup:** toggle protection; quick-add a keyword; open settings
- **Settings:** enable/disable; add / bulk-paste / filter / sort / export / import / remove keywords; reset defaults (with confirm); first-run welcome
- On matching feed items, titles + nearby thumbnails blur until you click **Reveal spoiler**
- Content script re-scans SPA navigations and late-loaded cards

Default keywords are generic story-spoiler phrases. Customize them for whatever you are avoiding.

## Privacy

Keywords stay in your browser (`chrome.storage.sync` if Chrome sync is on). NeonGulf never receives your list, history, or feed content. Permissions: `storage` + content scripts only on YouTube, Reddit, and X.

## Chrome Web Store (for Hamza)

Store listing is **not** set up in this repo. Until it is, ship via sideload + landing.

### Zip path for store upload

From the repo root, package **only** the extension folder contents (or the folder itself — Chrome expects `manifest.json` at the zip root):

```bash
cd extension
zip -r ../spoiler-shield-extension.zip .
# → spoiler-shield-extension.zip next to extension/ and web/
```

Upload that zip in the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).  
Required for listing: privacy policy URL → `https://shield.neongulf.com/#privacy`, screenshots, and a single-purpose description focused on spoiler blur (not affiliates).

## Landing page

Live: https://shield.neongulf.com (`#install` has the step-by-step guide)

Locally:

```bash
python3 -m http.server 8080 --directory web
# → http://127.0.0.1:8080
```

## Scope

Blur-first MVP: YouTube + Reddit + X, keyword management, install landing, privacy note, share loop. Progressive chapter unlock / Pro sync are out of scope for this version.

## License

MIT
