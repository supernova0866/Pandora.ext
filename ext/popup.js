// Pandora Popup Script

// ── Disable right-click everywhere in popup ───────────────────
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ── Toast ─────────────────────────────────────────────────────
function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (isError ? ' error' : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = '', 2400);
}

// ══════════════════════════════════════════════════════════════
//  PIN GATE — shown before settings if a PIN is set
// ══════════════════════════════════════════════════════════════

const gateEl      = document.getElementById('pin-gate');
const settingsEl  = document.getElementById('main-settings');
const gateInput   = document.getElementById('gate-pin-input');
const gateError   = document.getElementById('gate-error');
const gateSubmit  = document.getElementById('gate-submit');
const gateEyeBtn  = document.getElementById('gate-eye-btn');
const gateSub     = document.getElementById('pin-gate-sub');

// Eye toggle on gate input
gateEyeBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const show = gateInput.classList.toggle('show-pin');
  gateEyeBtn.textContent = show ? '🙈' : '👁';
  gateInput.type = show ? 'text' : 'password';
  gateInput.focus();
});

// Submit gate PIN
function submitGatePin() {
  const pin = gateInput.value.trim();
  if (!pin) { shakeGate('Enter your PIN'); return; }

  chrome.runtime.sendMessage({ type: 'ATTEMPT_GATE_AUTH', pin }, (res) => {
    if (chrome.runtime.lastError) return;
    if (res && res.success) {
      showSettings();
    } else {
      gateInput.value = '';
      shakeGate('Incorrect PIN');
    }
  });
}

function shakeGate(msg) {
  gateError.textContent = msg;
  const wrap = document.getElementById('gate-input-wrap');
  wrap.classList.remove('gate-shake');
  void wrap.offsetWidth;
  wrap.classList.add('gate-shake');
  setTimeout(() => wrap.classList.remove('gate-shake'), 400);
  setTimeout(() => gateInput.focus(), 50);
}

gateSubmit.addEventListener('click', submitGatePin);
gateInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitGatePin(); });
gateInput.addEventListener('input', () => { gateError.textContent = ''; });

// Show the settings panel, hide gate
function showSettings() {
  gateEl.style.display = 'none';
  settingsEl.style.display = 'block';
  loadConfig();
  checkForUpdate();
}

// ── Theme dropdown — loaded dynamically from themes.json ─────
let _loadedThemes = [];

async function loadThemeDropdown() {
  try {
    const url = chrome.runtime.getURL('themes.json');
    const res = await fetch(url);
    _loadedThemes = await res.json();
  } catch (e) {
    // Fallback to built-ins if fetch fails
    _loadedThemes = [
      { id: 'dark',   name: 'Dark',   type: 'builtin' },
      { id: 'light',  name: 'Light',  type: 'builtin' },
      { id: 'aurora', name: 'Aurora', type: 'builtin' },
    ];
  }

  const sel = document.getElementById('select-theme');
  sel.innerHTML = '';
  _loadedThemes.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name + (t.type === 'builtin' ? '' : ' ✦');
    sel.appendChild(opt);
  });
}

function setThemeDropdown(value) {
  const sel = document.getElementById('select-theme');
  // Only set if the option exists
  if ([...sel.options].some(o => o.value === value)) {
    sel.value = value;
  }
}

// Load themes immediately so dropdown is ready before settings show
loadThemeDropdown();

// ── Init: decide whether to show gate or go straight to settings
chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (res) => {
  if (chrome.runtime.lastError) return;
  const cfg = res?.config || {};

  if (!cfg.pin) {
    // No PIN set — skip the gate entirely
    gateSub.textContent = 'No PIN set yet — configure one below.';
    gateSubmit.style.display = 'none';
    document.getElementById('gate-input-wrap').style.display = 'none';
    gateError.style.display = 'none';
    // Show settings after a brief moment so UI doesn't flash
    showSettings();
  } else {
    // PIN is set — show the gate
    gateEl.style.display = 'flex';
    settingsEl.style.display = 'none';
    setTimeout(() => gateInput.focus(), 100);
  }
});

// ══════════════════════════════════════════════════════════════
//  SETTINGS LOGIC
// ══════════════════════════════════════════════════════════════

function updateStatus(config) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (!dot || !text) return;

  if (!config.pin) {
    dot.className = 'status-dot';
    dot.style.background = '#fbbf24';
    text.textContent = 'No PIN configured';
  } else if (config.locked !== false) {
    dot.className = 'status-dot locked';
    text.textContent = 'Locked';
  } else {
    dot.className = 'status-dot unlocked';
    text.textContent = 'Unlocked';
  }
}

function loadConfig() {
  chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (res) => {
    if (chrome.runtime.lastError || !res?.config) return;
    const c = res.config;
    updateStatus(c);
    document.getElementById('input-duration').value   = c.unlockDuration || 0;
    document.getElementById('input-inactivity').value = c.inactivityTimeout || 0;
    document.getElementById('toggle-lock-each-tab').checked = !!c.lockEachTab;
    document.getElementById('toggle-tabswitch').checked = !!c.autoRelockOnTabSwitch;
    setThemeDropdown(c.theme || 'dark');
    document.getElementById('select-clock-format').value = c.clockFormat || '24hm';
    document.getElementById('select-clock-font').value   = c.clockFont || '';
    document.getElementById('input-title').value         = c.lockTitle || '';
    document.getElementById('input-subtitle').value      = c.lockSubtitle || '';
  });
}

// Save PIN
document.getElementById('btn-save-pin').addEventListener('click', () => {
  const pin     = document.getElementById('input-pin').value.trim();
  const confirm = document.getElementById('input-pin-confirm').value.trim();
  if (!pin)                    { toast('PIN cannot be empty', true); return; }
  if (!/^\d{4,8}$/.test(pin)) { toast('PIN must be 4–8 digits', true); return; }
  if (pin !== confirm)         { toast('PINs do not match', true); return; }

  chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', config: { pin } }, () => {
    if (chrome.runtime.lastError) { toast('Save failed — try again', true); return; }
    document.getElementById('input-pin').value = '';
    document.getElementById('input-pin-confirm').value = '';
    toast('PIN saved ✓');
    loadConfig();
  });
});

// Clear PIN
document.getElementById('btn-clear-pin').addEventListener('click', () => {
  if (!confirm('Clear the PIN? The lock screen will show a warning until a new PIN is set.')) return;
  chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', config: { pin: null } }, () => {
    if (chrome.runtime.lastError) { toast('Save failed — try again', true); return; }
    toast('PIN cleared');
    loadConfig();
  });
});

// Save relock rules
document.getElementById('btn-save-relock').addEventListener('click', () => {
  const duration    = parseInt(document.getElementById('input-duration').value) || 0;
  const inactivity  = parseInt(document.getElementById('input-inactivity').value) || 0;
  const tabswitch   = document.getElementById('toggle-tabswitch').checked;
  const lockEachTab = document.getElementById('toggle-lock-each-tab').checked;
  chrome.runtime.sendMessage({
    type: 'SAVE_CONFIG',
    config: { unlockDuration: duration, inactivityTimeout: inactivity, autoRelockOnTabSwitch: tabswitch, lockEachTab }
  }, () => { if (chrome.runtime.lastError) { toast('Save failed — try again', true); return; } toast('Relock rules saved ✓'); loadConfig(); });
});

// Save appearance
document.getElementById('btn-save-appearance').addEventListener('click', () => {
  const theme       = document.getElementById('select-theme').value;
  const clockFormat = document.getElementById('select-clock-format').value;
  const clockFont   = document.getElementById('select-clock-font').value;
  const title       = document.getElementById('input-title').value.trim();
  const subtitle    = document.getElementById('input-subtitle').value.trim();
  chrome.runtime.sendMessage({
    type: 'SAVE_CONFIG',
    config: {
      theme,
      clockFormat,
      clockFont,
      lockTitle:    title    || 'This page is locked',
      lockSubtitle: subtitle || 'Enter your PIN to continue'
    }
  }, () => { if (chrome.runtime.lastError) { toast('Save failed — try again', true); return; } toast('Appearance saved ✓'); loadConfig(); });
});

// Lock all tabs
document.getElementById('btn-lock-all').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'LOCK_ALL' }, () => {
    toast('All tabs locked');
    loadConfig();
  });
});

// Bell / update banner
document.getElementById('bell-btn').addEventListener('click', () => {
  const banner = document.getElementById('update-banner');
  if (banner) banner.classList.toggle('visible');
  checkForUpdate();
});

document.getElementById('update-banner-close').addEventListener('click', () => {
  document.getElementById('update-banner').classList.remove('visible');
});

// ── Update check ──────────────────────────────────────────────
const CURRENT_VERSION = '1.1.0';
const VERSION_URL = 'https://raw.githubusercontent.com/supernova0866/Pandora.ext/main/ext/version.json';

async function checkForUpdate() {
  try {
    const res = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const latest = (data.version || '').trim();
    if (latest && latest !== CURRENT_VERSION) {
      const bell   = document.getElementById('bell-btn');
      const banner = document.getElementById('update-banner');
      const body   = document.getElementById('update-banner-body');
      if (bell)   bell.classList.add('has-update');
      if (banner) banner.classList.add('visible');
      if (body && data.changelog) {
        body.textContent = 'v' + latest + ': ' + data.changelog + ' — Run pandora update install to upgrade, then reload the extension.';
      }
    }
  } catch (e) { /* offline */ }
}
