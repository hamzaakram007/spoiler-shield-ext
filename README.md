# Spoiler Shield

Chrome extension (Manifest V3) that blurs spoiler titles and thumbnails matching a configurable keyword list on **YouTube**, **Reddit**, and **X**. Includes a popup on/off toggle, options page, and a minimal marketing landing page under `/web`.

Built by **Hamza Akram**. Independent fan utility — not affiliated with any game publisher.

## Repo layout

```
extension/     ← load this folder in Chrome (unpacked)
  manifest.json
  background.js
  content.js / content.css
  popup.* / options.*
  icons/
web/           ← simple marketing landing page
```

## Install (unpacked)

1. Clone this repo:
   ```bash
   git clone https://github.com/hamzaakram007/spoiler-shield-ext.git
   cd spoiler-shield-ext
   ```
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `extension/` folder inside this repo
6. Pin **Spoiler Shield** from the extensions menu

## Use

- **Popup:** toggle protection on/off; open keyword editor
- **Options:** add / remove keywords; reset to defaults
- On matching feed items, titles + nearby thumbnails blur until you click **Reveal spoiler**

Default keywords are generic story-spoiler phrases. Customize them for whatever you are avoiding.

## Landing page

Open `web/index.html` locally in a browser, or serve the folder:

```bash
python3 -m http.server 8080 --directory web
# → http://127.0.0.1:8080
```

## MVP scope

Working UI + core blur flow + placeholder/default keywords + README. Not Chrome Web Store–published yet (sideload first).

## License

MIT
