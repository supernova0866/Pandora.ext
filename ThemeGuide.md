# Pandora Theme Authoring Guide

A complete reference for creating and submitting theme packs for the Pandora lock screen extension.

---

## How the theme system works

Pandora loads two CSS files on every page:

1. **`pandora.css`** — the base stylesheet. Contains layout, structure, animations, and the three built-in themes (Dark, Light, Aurora). Never edit this file.
2. **`themes.css`** — managed by the Pandora CLI. Your theme pack is appended here as a self-contained block. This file loads *after* `pandora.css`, so your variables always win.

Every visual property in Pandora is a CSS variable prefixed with `--p-`. To make a theme, you create a new class on `#pandora-root` and define only the variables you want to change. Everything else inherits from the base.

The theme dropdown in settings is populated from **`themes.json`** — the CLI updates this automatically when you install or remove a pack.

---

## File structure of a theme pack

```
themes/
  themepack-N/
    theme.json      ← required: metadata
    addon.css       ← required: your variable overrides
    preview.png     ← recommended: 1280×720 screenshot
```

Submit your pack folder to the repo and open a pull request. The maintainer handles everything else.

---

## theme.json

```json
{
  "id": "pack-1",
  "name": "Cherry Blossom",
  "author": "yourname",
  "description": "Soft pinks and deep plum on a dark canvas.",
  "version": "1.0.0",
  "pandoraMinVersion": "1.1.0"
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | Yes | Must be `pack-N` where N matches the folder number. Unique across all packs. |
| `name` | Yes | Shown in the settings dropdown. Keep it short. |
| `author` | Yes | Your name or handle. |
| `description` | Yes | One sentence shown on the preview page. |
| `version` | Yes | Semver. Bump when you update the theme. |
| `pandoraMinVersion` | No | Minimum Pandora version required. |

---

## addon.css — the only file you write

Your `addon.css` is wrapped in delimiters by the CLI when installed:

```css
/* ═══ PANDORA THEME: Cherry Blossom [id:pack-1] ═══ */

#pandora-root.lg-pack-1 {
  /* your variables here */
}

/* ═══ END THEME: Cherry Blossom [id:pack-1] ═══ */
```

The class `lg-pack-1` is applied to `#pandora-root` when your theme is selected. You only need to write the variables block — the CLI adds the delimiters.

---

## Full variable reference

These are every variable you can override. All are optional — only define what you want to change.

### Background & backdrop

```css
#pandora-root.lg-pack-N {
  /* Main background gradient (bottom layer) */
  --p-bg-base:      linear-gradient(160deg, #05050f 0%, #0a0820 50%, #060f1e 100%);

  /* Radial overlay gradients on top of bg-base */
  --p-bg-grad-1:    rgba(79,70,229,0.38);   /* top-left ellipse */
  --p-bg-grad-2:    rgba(124,58,237,0.32);  /* bottom-right ellipse */
  --p-bg-grad-3:    rgba(37,99,235,0.18);   /* center ellipse */
}
```

### Ambient orbs

The three floating blurred circles that drift slowly in the background.

```css
#pandora-root.lg-pack-N {
  --p-orb-1:        rgba(99,102,241,0.16);  /* top-left orb color */
  --p-orb-2:        rgba(139,92,246,0.14);  /* bottom-right orb color */
  --p-orb-3:        rgba(37,99,235,0.1);    /* center-right orb color */
  --p-orb-blur:     60px;                   /* blur radius on all orbs */
}
```

### Glassmorphism

Controls the frosted-glass effect on the PIN input field.

```css
#pandora-root.lg-pack-N {
  --p-glass-blur:   12px;   /* blur radius behind the input */
  --p-glass-sat:    150%;   /* saturation boost behind the input */
  --p-backdrop-blur: 24px;  /* reserved for future backdrop elements */
}
```

> **Tip:** Higher `--p-glass-blur` (16–24px) looks great on light themes. Lower (8–10px) works better on very dark or low-contrast backgrounds.

### Clock

```css
#pandora-root.lg-pack-N {
  --p-clock-color:  rgba(255,255,255,0.95);  /* clock digits color */
  --p-clock-font:   inherit;                  /* font family for the clock */
  --p-date-color:   rgba(255,255,255,0.5);   /* date line below clock */
}
```

> **Note:** `--p-clock-font` is overridden by the user's Clock Font setting in the popup. If you want your theme to enforce a font, you can set it here, but the user's preference takes priority.

### Text

```css
#pandora-root.lg-pack-N {
  --p-text-primary: rgba(255,255,255,0.95);  /* title, main labels */
  --p-text-muted:   rgba(255,255,255,0.38);  /* subtitle, secondary text */
  --p-text-subtle:  rgba(255,255,255,0.1);   /* watermark */
}
```

### Lock icon

```css
#pandora-root.lg-pack-N {
  --p-icon-bg:      rgba(255,255,255,0.08);
  --p-icon-border:  rgba(255,255,255,0.14);
  --p-icon-shadow:  0 0 28px rgba(99,102,241,0.22), inset 0 1px 0 rgba(255,255,255,0.1);
}
```

### PIN input field

```css
#pandora-root.lg-pack-N {
  --p-input-bg:     rgba(255,255,255,0.07);   /* glass background of the input */
  --p-input-text:   rgba(255,255,255,0.95);   /* dot and text color */
  --p-placeholder:  rgba(255,255,255,0.22);   /* placeholder text color */
  --p-eye-color:    rgba(255,255,255,0.38);   /* eye toggle icon color */

  /* box-shadow shorthand — border + depth + inner highlight */
  --p-input-border: 0 0 0 1px rgba(255,255,255,0.1),
                    0 8px 28px rgba(0,0,0,0.4),
                    inset 0 1px 0 rgba(255,255,255,0.07);

  /* box-shadow when input is focused */
  --p-input-focus:  0 0 0 2px rgba(129,140,248,0.65),
                    0 8px 32px rgba(99,102,241,0.22),
                    inset 0 1px 0 rgba(255,255,255,0.09);
}
```

### Unlock button

```css
#pandora-root.lg-pack-N {
  --p-btn-from:     #5b5fc7;   /* gradient start and end color */
  --p-btn-mid:      #818cf8;   /* gradient midpoint color */

  /* box-shadow at rest */
  --p-btn-shadow:   0 4px 22px rgba(99,102,241,0.45),
                    inset 0 1px 0 rgba(255,255,255,0.15);

  /* box-shadow on hover */
  --p-btn-hover:    0 8px 30px rgba(99,102,241,0.6),
                    inset 0 1px 0 rgba(255,255,255,0.15);
}
```

> **Note:** Button text is always white (`#fff`). Make sure your `--p-btn-mid` has enough contrast.

### Error & status

```css
#pandora-root.lg-pack-N {
  --p-error-color:  #fca5a5;   /* wrong PIN message color */
}
```

### Watermark

```css
#pandora-root.lg-pack-N {
  --p-watermark:    rgba(255,255,255,0.1);   /* the PANDORA text at the bottom */
}
```

### No-PIN notice

Shown when the extension has no PIN configured.

```css
#pandora-root.lg-pack-N {
  --p-nopin-bg:     rgba(251,191,36,0.1);
  --p-nopin-border: rgba(251,191,36,0.24);
  --p-nopin-color:  rgba(251,191,36,0.9);
}
```

### Inactivity timer bar

```css
#pandora-root.lg-pack-N {
  --p-timer-bg:     rgba(255,255,255,0.1);                      /* track */
  --p-timer-bar:    linear-gradient(90deg, #818cf8, #6366f1);   /* fill */
}
```

---

## Minimal example — just change the accent color

```css
#pandora-root.lg-pack-1 {
  --p-orb-1:        rgba(244,63,94,0.18);
  --p-orb-2:        rgba(251,113,133,0.14);
  --p-bg-grad-1:    rgba(190,24,93,0.3);
  --p-bg-grad-2:    rgba(244,63,94,0.25);
  --p-icon-shadow:  0 0 28px rgba(244,63,94,0.25), inset 0 1px 0 rgba(255,255,255,0.1);
  --p-input-focus:  0 0 0 2px rgba(244,63,94,0.6),
                    0 8px 32px rgba(244,63,94,0.2),
                    inset 0 1px 0 rgba(255,255,255,0.09);
  --p-btn-from:     #be185d;
  --p-btn-mid:      #f43f5e;
  --p-btn-shadow:   0 4px 22px rgba(244,63,94,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
  --p-btn-hover:    0 8px 30px rgba(244,63,94,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
  --p-timer-bar:    linear-gradient(90deg, #f43f5e, #be185d);
}
```

---

## Full example — Cherry Blossom

```css
#pandora-root.lg-pack-1 {
  /* Background */
  --p-bg-base:      linear-gradient(160deg, #1a0018 0%, #2d0030 50%, #120010 100%);
  --p-bg-grad-1:    rgba(244,63,94,0.28);
  --p-bg-grad-2:    rgba(190,24,93,0.22);
  --p-bg-grad-3:    rgba(251,113,133,0.12);

  /* Orbs */
  --p-orb-1:        rgba(251,113,133,0.2);
  --p-orb-2:        rgba(190,24,93,0.16);
  --p-orb-3:        rgba(244,63,94,0.12);
  --p-orb-blur:     70px;

  /* Glassmorphism */
  --p-glass-blur:   14px;
  --p-glass-sat:    160%;

  /* Clock */
  --p-clock-color:  #ffb7c5;
  --p-date-color:   rgba(255,183,197,0.55);

  /* Text */
  --p-text-primary: rgba(255,230,235,0.95);
  --p-text-muted:   rgba(255,183,197,0.5);
  --p-text-subtle:  rgba(255,183,197,0.12);

  /* Icon */
  --p-icon-bg:      rgba(244,63,94,0.12);
  --p-icon-border:  rgba(244,63,94,0.28);
  --p-icon-shadow:  0 0 28px rgba(244,63,94,0.22), inset 0 1px 0 rgba(255,183,197,0.15);

  /* Input */
  --p-input-bg:     rgba(255,183,197,0.06);
  --p-input-text:   rgba(255,230,235,0.95);
  --p-placeholder:  rgba(255,183,197,0.28);
  --p-eye-color:    rgba(255,183,197,0.4);
  --p-input-border: 0 0 0 1px rgba(244,63,94,0.18),
                    0 8px 28px rgba(0,0,0,0.45),
                    inset 0 1px 0 rgba(255,183,197,0.08);
  --p-input-focus:  0 0 0 2px rgba(244,63,94,0.55),
                    0 8px 32px rgba(244,63,94,0.2),
                    inset 0 1px 0 rgba(255,183,197,0.1);

  /* Button */
  --p-btn-from:     #9d174d;
  --p-btn-mid:      #f43f5e;
  --p-btn-shadow:   0 4px 22px rgba(244,63,94,0.42), inset 0 1px 0 rgba(255,255,255,0.12);
  --p-btn-hover:    0 8px 30px rgba(244,63,94,0.58), inset 0 1px 0 rgba(255,255,255,0.12);

  /* Timer */
  --p-timer-bg:     rgba(255,183,197,0.1);
  --p-timer-bar:    linear-gradient(90deg, #f43f5e, #fb7185);

  /* Watermark */
  --p-watermark:    rgba(255,183,197,0.1);
}
```

---

## Rules and guidelines

- **Only define variables you change.** Unset variables inherit from `pandora.css` automatically.
- **Do not use `!important`** in your `addon.css`. The cascade order handles priority for you.
- **Do not target IDs or classes directly** (e.g. `#pandora-clock { color: red }`). Only override `--p-*` variables. This ensures your theme survives future Pandora updates.
- **Button text is always white.** Ensure `--p-btn-mid` has sufficient contrast against white.
- **Test on all three built-in themes first** — your pack inherits Dark by default if no `lg-pack-N` class is applied.
- **preview.png should be 1280×720** — screenshot the lock screen with your theme active.

---

## Installing a theme pack locally for testing

1. Copy your `addon.css` content into `pandora-extension/themes.css`, wrapped in the delimiters:

```css
/* ═══ PANDORA THEME: Your Theme Name [id:pack-N] ═══ */
#pandora-root.lg-pack-N {
  /* your variables */
}
/* ═══ END THEME: Your Theme Name [id:pack-N] ═══ */
```

2. Add your theme to `themes.json`:

```json
{
  "id": "pack-N",
  "name": "Your Theme Name",
  "author": "yourname",
  "description": "One sentence.",
  "type": "pack"
}
```

3. Reload the extension in `chrome://extensions` (click the ↺ button).
4. Open the extension popup → Appearance → Theme dropdown — your theme appears at the bottom.

---

## Submitting your theme

1. Fork the repo at `https://github.com/supernova0866/Pandora.ext`
2. Create a folder: `themes/themepack-N/` (use the next available number)
3. Add `theme.json`, `addon.css`, and `preview.png`
4. Open a pull request with the title: `Theme: Your Theme Name`

The maintainer will review, assign an official ID, and add it to `themes/index.json` so it appears on the preview page and becomes installable via `pandora theme install N`.
