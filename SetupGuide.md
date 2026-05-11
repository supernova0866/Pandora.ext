# Pandora — Setup Guide

Pandora is a Chrome extension that locks every website behind a PIN screen. It's managed through a single command-line tool — `pandora.bat` — which handles installing, updating, and (soon) theme management.

---

## Requirements

- **Windows** 7 or later
- **PowerShell** (built into Windows, no install needed)
- **Google Chrome**
- An internet connection for install and updates

---

## First time setup

### Step 1 — Download `pandora.bat`

Download `pandora.bat` from the repo and save it somewhere permanent, like your Desktop or `C:\Tools\`. This one file is all you need to get started.

> **Tip:** If you want to run `pandora` from any folder without typing the full path, add the folder containing `pandora.bat` to your system PATH.
>
> 1. Search **"Environment Variables"** in the Start menu
> 2. Under **User variables** → select `Path` → click **Edit**
> 3. Click **New** and paste the folder path (e.g. `C:\Tools`)
> 4. Click OK, then open a new terminal — `pandora help` will now work from anywhere

---

### Step 2 — Install the extension

Open a terminal (Command Prompt or PowerShell) in the folder containing `pandora.bat` and run:

```
pandora install
```

Pandora will ask where to install the extension files. Press **Enter** to use the default location (`%USERPROFILE%\Pandora`), or type a custom path.

It will then download all extension files from GitHub and save them to a folder called `Pandora.ext` inside your chosen location.

---

### Step 3 — Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** ON — top-right corner
3. Click **Load unpacked**
4. Navigate to your install folder and select the `Pandora.ext` subfolder
   - Default path: `C:\Users\YourName\Pandora\Pandora.ext`
5. Click **Select Folder**

Pandora will appear in your extensions list. Click the puzzle piece icon in the Chrome toolbar and pin it for easy access.

---

### Step 4 — Set your PIN

Click the Pandora extension icon in the toolbar. Since no PIN is set yet, it will open the settings panel directly.

1. Enter a **4–8 digit PIN** in both fields and click **Save PIN**
2. The lock screen will now appear on every new tab and website

> Your PIN is stored locally on your device using Chrome's built-in storage. It never leaves your machine.

---

## Commands

All commands are run from a terminal in the same folder as `pandora.bat`, or from anywhere if you added it to your PATH.

---

### `pandora help`

Displays the help screen with a list of all available commands.

```
pandora help
```

---

### `pandora install`

Downloads all extension files from GitHub and sets up the extension folder. Run this once when setting up Pandora for the first time.

```
pandora install
```

**What it does:**
- Asks where to create the extension folder
- Creates the folder structure (`Pandora.ext\`, `icons\`)
- Downloads all 13 extension files from GitHub
- Saves the install location to `pandora_path.txt` so future commands know where to find the extension
- Offers to open the extension folder in Explorer

**Files downloaded:**
```
ext/manifest.json
ext/background.js
ext/content.js
ext/pandora.css
ext/themes.css       ← starts empty, stores your installed theme packs
ext/themes.json      ← list of available themes for the dropdown
ext/popup.html
ext/popup.js
ext/version.json
ext/icons/icon16.png
ext/icons/icon48.png
ext/icons/icon128.png
```

---

### `pandora update check`

Compares your installed version against the latest version on GitHub and reports whether an update is available. Does not download anything.

```
pandora update check
```

**Example output:**
```
  Installed  :  v1.1.0
  Available  :  v1.2.0

  Update available!
  Run:  pandora update install
  What's new: New clock format options and theme system.
```

---

### `pandora update install`

Downloads the latest extension files from GitHub and applies only what has changed, using SHA-256 file comparison. Files that haven't changed are skipped. Your PIN, settings, and installed theme packs are never touched.

```
pandora update install
```

**What it does:**
- Fetches `version.json` from GitHub to compare versions
- If already up to date, asks whether to force-check all files anyway
- For each file: downloads to a temp location, compares hash with local copy
  - `[NEW]` — file didn't exist locally, created
  - `[UPD]` — file changed, local copy overwritten
  - `[---]` — file unchanged, skipped
  - `[ERR]` — download failed, local copy untouched
- **`themes.css` is never overwritten** — only created if missing, preserving any theme packs you've installed
- Updates `pandora.bat` itself if a newer version is available (applied after the script exits)
- Prompts to open `chrome://extensions` so you can reload the extension

**After updating:** Go to `chrome://extensions` and click the **↺ reload** button on Pandora to apply the new files.

---

## Settings reference

Click the Pandora extension icon to open settings. If a PIN is set, you'll need to enter it first.

| Setting | Description |
|---|---|
| **PIN** | 4–8 digit number. Required for the lock screen to activate. |
| **Unlock duration** | How many minutes an unlock lasts. `0` means until the browser is closed. |
| **Inactivity timeout** | Seconds of no mouse/keyboard activity before re-locking. `0` = disabled. |
| **Lock each tab separately** | When off, unlocking once covers all tabs in the session. When on, each tab asks for the PIN individually. |
| **Relock on tab switch** | When on, switching away from a tab locks it immediately. |
| **Theme** | Visual theme for the lock screen. Built-in: Dark, Light, Aurora. Installed theme packs appear below. |
| **Clock Format** | `24h HH:MM`, `24h HH:MM:SS`, `12h HH:MM AM/PM`, or `12h HH:MM:SS AM/PM`. |
| **Clock Font** | Font used for the large clock on the lock screen. |
| **Lock screen title** | The heading shown on the lock overlay. Default: *This page is locked*. |
| **Lock screen subtitle** | The subtext shown below the title. Default: *Enter your PIN to continue*. |
| **Lock All Tabs** | Instantly locks every open tab. |
| **🔔 Bell icon** | Shows a pulsing badge when a Pandora update is available. Click to see details. |

---

## Troubleshooting

**The lock screen doesn't appear**
- Make sure a PIN is set. Open the extension popup → if you see the settings panel directly, no PIN is configured.
- Check that the extension is enabled at `chrome://extensions`.
- Try reloading the extension (click ↺ on the Pandora card).

**`pandora install` fails with a download error**
- Check your internet connection.
- Make sure PowerShell is available — run `powershell -version` in the terminal.
- If you're behind a corporate proxy, PowerShell's `WebClient` may need proxy settings configured.

**I forgot my PIN**
- Open `chrome://extensions` → find Pandora → click **Details** → scroll down to **Extension storage** → Clear storage.
- This wipes your PIN and all settings. You'll need to set a new PIN.
- Alternatively, disable and re-enable the extension — storage persists, so you'll need the storage clear approach above.

**The extension popup asks for a PIN but I don't remember it**
- Same as above — clear extension storage via `chrome://extensions`.

**`pandora update install` says everything is unchanged but the extension seems broken**
- Force a re-check: when prompted *"Already on the latest version. Force re-check all files anyway?"*, type `Y`.
- Then reload the extension in Chrome.

**Themes aren't showing in the dropdown**
- The dropdown is populated from `themes.json` inside the extension folder.
- After a `pandora update install`, reload the extension in Chrome.

---

## Uninstalling

1. Go to `chrome://extensions` → find Pandora → click **Remove**
2. Delete the install folder (default: `C:\Users\YourName\Pandora\`)
3. Delete `pandora.bat` from wherever you saved it

---

## Coming soon

```
pandora theme list              Show all available theme packs from GitHub
pandora theme install <id>      Download and install a theme pack
pandora theme remove <id>       Remove an installed theme pack
pandora theme update --all      Update all installed theme packs
pandora theme info              Show currently installed theme packs
```
