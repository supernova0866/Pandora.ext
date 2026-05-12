// Pandora Content Script — runs at document_start
// Modern phone-style lock screen with clock + PIN text input

(function () {
  'use strict';

  if (window.__pandoraInjected) return;
  window.__pandoraInjected = true;

  // ── Right-click: only blocked while lock screen is active ─────────────────
  // Stored so we can add/remove it dynamically
  var _contextMenuHandler = function(e) { e.preventDefault(); e.stopPropagation(); };

  function enableRightClickBlock() {
    document.removeEventListener('contextmenu', _contextMenuHandler, true); // avoid duplicates
    document.addEventListener('contextmenu', _contextMenuHandler, true);
  }

  function disableRightClickBlock() {
    document.removeEventListener('contextmenu', _contextMenuHandler, true);
  }



  let config = {};
  let lockRoot = null;
  let pinInputEl = null;
  let errorEl = null;
  let timerBar = null;
  let timerBarWrap = null;
  let isUnlocked = false;
  let domObserver = null;
  let clockInterval = null;
  let inactivityInterval = null;
  let inactivityLastActivity = Date.now();

  // ─── Clock ───────────────────────────────────────────────────────────────────

  function formatClock() {
    const now = new Date();
    const fmt = config.clockFormat || '24hm';
    const use12 = fmt.startsWith('12');
    const showSec = fmt.endsWith('s');

    let h = now.getHours();
    let suffix = '';
    if (use12) {
      suffix = h >= 12 ? ' PM' : ' AM';
      h = h % 12 || 12;
    }
    const hStr = h.toString().padStart(2, '0');
    const mStr = now.getMinutes().toString().padStart(2, '0');
    const sStr = now.getSeconds().toString().padStart(2, '0');
    return hStr + ':' + mStr + (showSec ? ':' + sStr : '') + suffix;
  }

  function formatDate() {
    const now = new Date();
    return now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function applyClockFont() {
    const root = document.getElementById('pandora-root');
    if (!root) return;
    const font = config.clockFont || '';
    if (font) {
      root.style.setProperty('--lg-clock-font', font);
    } else {
      root.style.removeProperty('--lg-clock-font');
    }
  }

  function startClock() {
    applyClockFont();
    const fmt = config.clockFormat || '24hm';
    const showSec = fmt.endsWith('s');
    const tick = () => {
      const c = document.getElementById('pandora-clock');
      const d = document.getElementById('pandora-date');
      if (c) c.textContent = formatClock();
      if (d) d.textContent = formatDate();
    };
    tick();
    // tick every second if seconds are shown, else every 10s
    clockInterval = setInterval(tick, showSec ? 1000 : 60000);
  }

  function stopClock() {
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  }

  // ─── Build Lock UI ────────────────────────────────────────────────────────────

  function buildLockUI(cfg) {
    if (lockRoot) return;

    const theme = cfg.theme || 'dark';

    const root = document.createElement('div');
    root.id = 'pandora-root';
    root.className = 'lg-' + theme;
    root.setAttribute('data-pandora', 'true');

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'pandora-backdrop';

    // Orbs
    const orbs = document.createElement('div');
    orbs.id = 'pandora-orbs';
    orbs.innerHTML = '<div class="lg-orb lg-orb-1"></div><div class="lg-orb lg-orb-2"></div><div class="lg-orb lg-orb-3"></div>';

    // ── TOP: Clock ──
    const top = document.createElement('div');
    top.id = 'pandora-top';

    const clock = document.createElement('div');
    clock.id = 'pandora-clock';
    clock.textContent = formatClock();

    const dateEl = document.createElement('div');
    dateEl.id = 'pandora-date';
    dateEl.textContent = formatDate();

    top.append(clock, dateEl);

    // ── MIDDLE: Icon + label ──
    const middle = document.createElement('div');
    middle.id = 'pandora-middle';

    const icon = document.createElement('div');
    icon.id = 'pandora-icon';
    icon.textContent = '\uD83D\uDD12'; // 🔒

    const titleEl = document.createElement('div');
    titleEl.id = 'pandora-title';
    titleEl.textContent = cfg.lockTitle || 'This page is locked';

    const subtitle = document.createElement('div');
    subtitle.id = 'pandora-subtitle';
    subtitle.textContent = cfg.lockSubtitle || 'Enter your PIN to continue';

    middle.append(icon, titleEl, subtitle);

    // ── BOTTOM: PIN entry ──
    const bottom = document.createElement('div');
    bottom.id = 'pandora-bottom';

    if (!cfg.pin) {
      const notice = document.createElement('div');
      notice.id = 'pandora-nopin';
      notice.textContent = '\u26A0\uFE0F No PIN set \u2014 click the extension icon to configure Pandora.';
      bottom.appendChild(notice);
    } else {
      // Timer bar
      timerBarWrap = document.createElement('div');
      timerBarWrap.id = 'pandora-timer-bar-wrap';
      const timerBg = document.createElement('div');
      timerBg.id = 'pandora-timer-bar-bg';
      timerBar = document.createElement('div');
      timerBar.id = 'pandora-timer-bar';
      timerBg.appendChild(timerBar);
      timerBarWrap.appendChild(timerBg);

      // Input wrapper — real input is invisible, custom dot display sits on top
      const inputWrap = document.createElement('div');
      inputWrap.id = 'pandora-input-wrap';

      // Hidden real input — captures keystrokes only
      pinInputEl = document.createElement('input');
      pinInputEl.id = 'pandora-pin-input';
      pinInputEl.type = 'password';
      pinInputEl.inputMode = 'numeric';
      pinInputEl.autocomplete = 'off';
      pinInputEl.maxLength = 8;
      pinInputEl.spellcheck = false;

      // Custom visual display — shows dots or chars evenly spaced
      const pinDisplay = document.createElement('div');
      pinDisplay.id = 'pandora-pin-display';

      const pinPlaceholder = document.createElement('span');
      pinPlaceholder.id = 'pandora-pin-placeholder';
      pinPlaceholder.textContent = 'Enter PIN…';

      // Blinking cursor element — always lives inside pinDisplay
      const pinCursor = document.createElement('span');
      pinCursor.id = 'pandora-pin-cursor';

      pinDisplay.appendChild(pinPlaceholder);

      // Update dot display whenever input changes
      var showingPin = false;
      function updatePinDisplay() {
        var val = pinInputEl.value;
        pinDisplay.innerHTML = '';
        if (val.length === 0) {
          pinDisplay.appendChild(pinPlaceholder);
        } else {
          for (var i = 0; i < val.length; i++) {
            var ch = document.createElement('span');
            ch.className = 'lg-pin-char';
            ch.textContent = showingPin ? val[i] : '●'; // ● or actual char
            pinDisplay.appendChild(ch);
          }
        }
        // Cursor always appended last so it sits after the last dot
        pinDisplay.appendChild(pinCursor);
      }

      pinInputEl.addEventListener('input', function() {
        updatePinDisplay();
        clearError();
      });

      // Click on display focuses the hidden input
      pinDisplay.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        pinInputEl.focus();
      });

      // Eye toggle
      const eyeBtn = document.createElement('button');
      eyeBtn.id = 'pandora-eye-btn';
      eyeBtn.textContent = '\uD83D\uDC41'; // 👁
      eyeBtn.title = 'Show/hide PIN';
      eyeBtn.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        showingPin = !showingPin;
        eyeBtn.textContent = showingPin ? '\uD83D\uDE48' : '\uD83D\uDC41';
        updatePinDisplay();
        pinInputEl.focus();
      });

      inputWrap.append(pinInputEl, pinDisplay, eyeBtn);

      // Unlock button
      const unlockBtn = document.createElement('button');
      unlockBtn.id = 'pandora-unlock-btn';
      unlockBtn.textContent = 'Unlock';
      unlockBtn.addEventListener('pointerdown', function(e) {
        e.preventDefault();
        submitPin();
      });

      // Error
      errorEl = document.createElement('div');
      errorEl.id = 'pandora-error';

      // Watermark
      const watermark = document.createElement('div');
      watermark.id = 'pandora-watermark';
      watermark.textContent = 'Pandora';

      bottom.append(timerBarWrap, inputWrap, unlockBtn, errorEl, watermark);

      // keydown/keyup already handled by root capture listener above
    }

    // Block events leaking to page behind overlay.
    // Enter is intercepted here and routed to submitPin() since stopPropagation
    // in capture phase prevents pinInputEl's own keydown from ever firing.
    root.addEventListener('keydown', function(e) {
      e.stopPropagation();
      if (e.key === 'Enter') submitPin();
    }, true);
    root.addEventListener('keyup',   function(e) { e.stopPropagation(); }, true);
    root.addEventListener('click',   function(e) { e.stopPropagation(); }, true);

    root.append(backdrop, orbs, top, middle, bottom);

    lockRoot = root;
    document.documentElement.appendChild(root);

    // Block page scroll and right-click while locked
    document.documentElement.style.overflow = 'hidden';
    if (document.body) document.body.style.overflow = 'hidden';
    enableRightClickBlock();

    // Focus input after entrance animation
    if (cfg.pin) {
      setTimeout(function() { if (pinInputEl) pinInputEl.focus(); }, 420);
    }

    startClock();
    startDomObserver();
  }

  // ─── PIN Submit ───────────────────────────────────────────────────────────────

  function submitPin() {
    if (!pinInputEl) return;
    const pin = pinInputEl.value.trim();
    if (!pin) {
      shakeAndError('Please enter your PIN');
      return;
    }
    chrome.runtime.sendMessage({ type: 'ATTEMPT_UNLOCK', pin: pin }, function(res) {
      if (res && res.success) {
        onUnlockSuccess();
      } else {
        if (pinInputEl) pinInputEl.value = '';
        // Clear the visual dot display
        var disp = document.getElementById('pandora-pin-display');
        var ph   = document.getElementById('pandora-pin-placeholder');
        if (disp && ph) { disp.innerHTML = ''; disp.appendChild(ph); var cursor = document.getElementById('pandora-pin-cursor'); if (cursor) disp.appendChild(cursor); }
        shakeAndError(res && res.reason === 'no_pin_set' ? 'No PIN configured' : 'Incorrect PIN \u2014 try again');
      }
    });
  }

  function shakeAndError(msg) {
    const bottom = document.getElementById('pandora-bottom');
    if (bottom) {
      bottom.classList.remove('lg-shake');
      void bottom.offsetWidth; // force reflow
      bottom.classList.add('lg-shake');
      setTimeout(function() { bottom.classList.remove('lg-shake'); }, 480);
    }
    // Apply error ring to the visible display, not the hidden input
    var disp = document.getElementById('pandora-pin-display');
    if (disp) {
      disp.classList.add('lg-input-error');
      setTimeout(function() { disp.classList.remove('lg-input-error'); }, 700);
    }
    if (pinInputEl) setTimeout(function() { pinInputEl.focus(); }, 100);
    if (errorEl) errorEl.textContent = msg;
  }

  function clearError() {
    if (errorEl) errorEl.textContent = '';
  }

  // ─── Unlock / Lock ────────────────────────────────────────────────────────────

  function onUnlockSuccess() {
    isUnlocked = true;
    stopClock();

    if (lockRoot) {
      lockRoot.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      lockRoot.style.opacity = '0';
      lockRoot.style.transform = 'scale(1.04)';
      setTimeout(removeLock, 370);
    }

    // Restore page scroll and re-enable right-click
    document.documentElement.style.overflow = '';
    if (document.body) document.body.style.overflow = '';
    disableRightClickBlock();

    if (config.inactivityTimeout > 0) startInactivityTimer();
  }

  function removeLock() {
    stopDomObserver();
    stopClock();
    if (lockRoot && lockRoot.parentNode) lockRoot.parentNode.removeChild(lockRoot);
    lockRoot = null;
    pinInputEl = null;
    errorEl = null;
    timerBar = null;
    timerBarWrap = null;
  }

  function applyLock() {
    isUnlocked = false;
    stopInactivityTimer();
    if (!lockRoot) {
      buildLockUI(config); // buildLockUI calls enableRightClickBlock internally
    } else {
      lockRoot.className = 'lg-' + (config.theme || 'dark');
      if (pinInputEl) { pinInputEl.value = ''; }
      // Reset the visual dot display back to placeholder
      var disp   = document.getElementById('pandora-pin-display');
      var ph     = document.getElementById('pandora-pin-placeholder');
      var cursor = document.getElementById('pandora-pin-cursor');
      if (disp && ph) { disp.innerHTML = ''; disp.appendChild(ph); if (cursor) disp.appendChild(cursor); }
      clearError();
      if (pinInputEl) setTimeout(function() { pinInputEl.focus(); }, 100);
      enableRightClickBlock();
    }
    document.documentElement.style.overflow = 'hidden';
    if (document.body) document.body.style.overflow = 'hidden';
  }

  // ─── DOM Observer (anti-removal) ─────────────────────────────────────────────

  function startDomObserver() {
    if (domObserver) return;
    domObserver = new MutationObserver(function(mutations) {
      if (!lockRoot) return;
      var removed = false;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.removedNodes.length; j++) {
          var node = m.removedNodes[j];
          if (node === lockRoot || (node.contains && node.contains(lockRoot))) removed = true;
        }
      }
      if (removed && !isUnlocked) {
        lockRoot = null; pinInputEl = null; errorEl = null;
        setTimeout(function() { buildLockUI(config); }, 0);
      }
      if (lockRoot && lockRoot.parentNode !== document.documentElement) {
        document.documentElement.appendChild(lockRoot);
      }
    });
    domObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function stopDomObserver() {
    if (domObserver) { domObserver.disconnect(); domObserver = null; }
  }

  // ─── Inactivity Timer ─────────────────────────────────────────────────────────

  var _resetActivity = null; // stored so we can removeEventListener

  function startInactivityTimer() {
    stopInactivityTimer();
    inactivityLastActivity = Date.now();
    var timeoutMs = config.inactivityTimeout * 1000;

    if (timerBarWrap && lockRoot) timerBarWrap.classList.add('visible');

    _resetActivity = function() { inactivityLastActivity = Date.now(); };
    document.addEventListener('mousemove',  _resetActivity, { passive: true });
    document.addEventListener('keydown',    _resetActivity, { passive: true });
    document.addEventListener('click',      _resetActivity, { passive: true });
    document.addEventListener('touchstart', _resetActivity, { passive: true });

    inactivityInterval = setInterval(function() {
      var elapsed = Date.now() - inactivityLastActivity;
      var pct = Math.max(0, ((timeoutMs - elapsed) / timeoutMs) * 100);
      if (timerBar && lockRoot) timerBar.style.width = pct + '%';
      if (elapsed >= timeoutMs) {
        stopInactivityTimer();
        chrome.runtime.sendMessage({ type: 'LOCK_TAB' }, function() {
          void chrome.runtime.lastError;
          applyLock();
        });
      }
    }, 500);
  }

  function stopInactivityTimer() {
    if (inactivityInterval) { clearInterval(inactivityInterval); inactivityInterval = null; }
    if (_resetActivity) {
      document.removeEventListener('mousemove',  _resetActivity);
      document.removeEventListener('keydown',    _resetActivity);
      document.removeEventListener('click',      _resetActivity);
      document.removeEventListener('touchstart', _resetActivity);
      _resetActivity = null;
    }
    if (timerBarWrap && lockRoot) timerBarWrap.classList.remove('visible');
  }

  // ─── DevTools Deterrence ──────────────────────────────────────────────────────

  // DevTools deterrence — only active while locked
  var _debuggerInterval = setInterval(function() { // eslint-disable-line no-debugger
    if (!isUnlocked) { debugger; } // eslint-disable-line no-debugger
  }, 3000);

  // ─── Messages ─────────────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.type === 'FORCE_LOCK') {
      config = Object.assign(config, msg.config || {});
      applyLock();
    }
  });

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) return;
    chrome.runtime.sendMessage({ type: 'CHECK_LOCK' }, function(res) {
      if (chrome.runtime.lastError || !res) return;
      config = res.config || config;
      if (res.locked) {
        applyLock();
      } else {
        if (!isUnlocked) {
          // Was locked before tab switch, now unlocked (session mode)
          isUnlocked = true;
          disableRightClickBlock();
        }
        if (config.inactivityTimeout > 0) startInactivityTimer();
      }
    });
  });

  // ─── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    chrome.runtime.sendMessage({ type: 'CHECK_LOCK' }, function(res) {
      if (chrome.runtime.lastError) return;
      config = (res && res.config) || {};
      if (res && res.locked === false) {
        // Unlocked (or no PIN set) — don't show lock screen
        isUnlocked = true;
        disableRightClickBlock();
        if (config.inactivityTimeout > 0) startInactivityTimer();
      } else {
        // Locked — show lock screen (CHECK_LOCK already skips when no PIN)
        buildLockUI(config);
      }
    });
  }

  if (document.documentElement) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }

})();
