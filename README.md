# Spoiler Shield by NeonGulf

Chrome extension that blurs spoiler titles and thumbnails matching a configurable keyword list on **YouTube**, **Reddit**, and **X**. Includes a popup on/off toggle, options page, and a marketing landing page under `/web`.

A **NeonGulf** product by Hamza Akram. Independent tool — not affiliated with YouTube, Reddit, X, or any game publisher.

**Landing:** https://shield.neongulf.com  
**Repo:** https://github.com/hamzaakram007/spoiler-shield-ext

## Repo layout

```
extension/     ← load this folder in Chrome (unpacked)
  manifest.json
  background.js
  content.js / content.css
  popup.* / options.*
  icons/
web/           ← marketing landing + install guide
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

- **Popup:** toggle protection on/off; open settings
- **Settings:** enable/disable, add / bulk-paste / filter / sort / remove keywords; reset defaults (with confirm)
- On matching feed items, titles + nearby thumbnails blur until you click **Reveal spoiler**
- Content script re-scans SPA navigations and late-loaded cards

Default keywords are generic story-spoiler phrases. Customize them for whatever you are avoiding.

## Landing page

Live: https://shield.neongulf.com (`#install` has the step-by-step guide)

Locally:

```bash
python3 -m http.server 8080 --directory web
# → http://127.0.0.1:8080
```

## Scope

Production-ready blur flow, options UX, install guide, and icons. Sideload via unpacked install today.

## License

MIT
