<div align="center">

```
██████╗  █████╗ ███╗   ██╗██████╗  ██████╗ ██████╗  █████╗
██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗
██████╔╝███████║██╔██╗ ██║██║  ██║██║   ██║██████╔╝███████║
██╔═══╝ ██╔══██║██║╚██╗██║██║  ██║██║   ██║██╔══██╗██╔══██║
██║     ██║  ██║██║ ╚████║██████╔╝╚██████╔╝██║  ██║██║  ██║
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
```

**A PIN-protected full-screen lock overlay for Chrome.**  
Lock any website until a PIN is entered. Designed for shared environments.

[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-818cf8.svg)](ext/version.json)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)]()
[![Browser](https://img.shields.io/badge/browser-Chrome-yellow.svg)]()

</div>

---

## What is Pandora?

Pandora injects a persistent, full-viewport lock screen on top of every website in Chrome — blocking interaction and obscuring content until the correct PIN is entered. It's built for shared computers, kiosks, parental control, and any environment where you want a lightweight privacy layer on the browser.

- **Glassmorphism UI** with an animated background, live clock, and clean PIN input
- **Session-aware unlocking** — unlock once and stay unlocked across all tabs, or require a PIN per tab
- **Auto-relock** by inactivity timeout, time duration, or tab switch
- **Theme system** — three built-in themes, extensible with community theme packs
- **Managed by a single CLI tool** — one `.bat` file handles install, updates, and (soon) themes
- **No external servers** — PIN stored locally in Chrome storage, never transmitted anywhere

---

## Quick start

**1. Download `pandora.bat`** from this repo.

**2. Run the installer:**
```
pandora install
```
It will ask where to put the extension files, then download everything from GitHub.

**3. Load in Chrome:**
- Go to `chrome://extensions`
- Enable **Developer mode** (top-right toggle)
- Click **Load unpacked** → select the `Pandora.ext` folder from your install location

**4. Set your PIN:**
- Click the Pandora icon in the Chrome toolbar
- Enter a 4–8 digit PIN and save

That's it. Every website is now locked behind your PIN.

---

## CLI commands

All commands are run from a terminal. Add `pandora.bat` to your PATH to use it from anywhere.

| Command | Description |
|---|---|
| `pandora install` | Fresh install — downloads all extension files, sets up the folder |
| `pandora update check` | Compare your version against GitHub, see the changelog |
| `pandora update install` | Smart update — only re-downloads files that actually changed |
| `pandora help` | Show the command list |

> More commands are coming — see the [Setup Guide](https://github.com/supernova0866/Pandora.ext/blob/main/SetupGuide.md) for full documentation.

---

## Repo structure

```
Pandora.ext/
├── pandora.bat        ← CLI tool (download this to get started)
├── index.html         ← coming soon: web installer + theme browser
│
├── ext/               ← Chrome extension files (loaded via "Load unpacked")
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── pandora.css
│   ├── themes.css     ← managed by CLI, stores installed theme packs
│   ├── themes.json    ← theme list for the settings dropdown
│   ├── popup.html
│   ├── popup.js
│   ├── version.json
│   └── icons/
│
└── themes/            ← community theme packs (coming soon)
    └── index.json
```

---

## Themes

Pandora has a variable-based theme system. Every color, blur, gradient, and glow is a CSS variable — theme packs only override the ones they want to change.

Three themes are built in: **Dark**, **Light**, and **Aurora**.  
Community packs will live in the `themes/` folder and install with a single command.

Want to make your own? Read the **[Theme Guide](https://github.com/supernova0866/Pandora.ext/blob/main/ThemeGuide.md)**.

---

## Documentation

| Document | Description |
|---|---|
| [Setup Guide](https://github.com/supernova0866/Pandora.ext/blob/main/SetupGuide.md) | Full install walkthrough, CLI reference, settings, troubleshooting |
| [Theme Guide](https://github.com/supernova0866/Pandora.ext/blob/main/ThemeGuide.md) | Every CSS variable, full examples, submission instructions |

---

## License

[MIT](LICENSE) — free to use, fork, and build on.  
Theme packs contributed to this repo are also MIT unless the author specifies otherwise.
