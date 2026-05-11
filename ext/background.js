// Pandora Background Service Worker
// Handles: global lock state, alarms, tab tracking, config fetching

// Safely send a message to a tab — swallows "Receiving end does not exist"
// and any other errors from chrome://, extension, PDF, or pre-extension tabs.
function safeSendToTab(tabId, msg) {
  // Skip tabs that can never have a content script
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return; // tab no longer exists
    const url = tab?.url || '';
    if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
        url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('data:')) {
      return;
    }
    chrome.tabs.sendMessage(tabId, msg, () => {
      // Reading lastError suppresses the uncaught promise/callback error
      void chrome.runtime.lastError;
    });
  });
}

const DEFAULT_CONFIG = {
  pin: null,
  locked: true,
  lockEachTab: false,        // false = session-wide unlock; true = each tab asks for PIN
  unlockDuration: 0,         // 0 = until browser closes; >0 = minutes
  autoRelockOnTabSwitch: false,
  inactivityTimeout: 0,
  theme: "dark",
  clockFormat: "24hm",
  clockFont: "",
  lockTitle: "This page is locked",
  lockSubtitle: "Enter your PIN to continue",
  lastUnlockTime: null,
  sessionUnlocked: false,    // true = session-wide unlock active
  unlockedTabs: {}
};

// Initialize storage with defaults on install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(null);
  const merged = Object.assign({}, DEFAULT_CONFIG, existing);
  await chrome.storage.local.set(merged);
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const data = await chrome.storage.local.get(null);

    if (msg.type === "CHECK_LOCK") {
      // No PIN set — never lock
      if (!data.pin) {
        sendResponse({ locked: false, config: data });
        return;
      }

      const tabId = sender.tab?.id;
      const now = Date.now();

      // Check if unlock duration has expired (applies to both modes)
      if (data.lastUnlockTime && data.unlockDuration > 0) {
        const elapsedMin = (now - data.lastUnlockTime) / 1000 / 60;
        if (elapsedMin >= data.unlockDuration) {
          // Session expired — lock everything
          await chrome.storage.local.set({
            unlockedTabs: {},
            sessionUnlocked: false,
            locked: true
          });
          sendResponse({ locked: true, config: data });
          return;
        }
      }

      let isUnlocked = false;

      if (data.lockEachTab) {
        // Per-tab mode — check tab's own unlock record
        isUnlocked = data.unlockedTabs?.[String(tabId)] === true;
      } else {
        // Session mode — any unlock counts for all tabs
        isUnlocked = data.sessionUnlocked === true;
      }

      sendResponse({ locked: !isUnlocked, config: data });
    }

    else if (msg.type === "ATTEMPT_UNLOCK") {
      if (!data.pin) {
        sendResponse({ success: false, reason: "no_pin_set" });
        return;
      }
      if (msg.pin === data.pin) {
        const tabId = sender.tab?.id;
        const tabs = data.unlockedTabs || {};
        tabs[String(tabId)] = true;

        const update = {
          unlockedTabs: tabs,
          locked: false,
          lastUnlockTime: Date.now()
        };

        if (!data.lockEachTab) {
          // Session mode — mark session as unlocked for all tabs
          update.sessionUnlocked = true;
        }

        await chrome.storage.local.set(update);

        // Set alarm if duration is set — one alarm covers the whole session
        if (data.unlockDuration > 0) {
          chrome.alarms.clearAll(); // clear any previous relock alarms
          chrome.alarms.create("relock_session", {
            delayInMinutes: data.unlockDuration
          });
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, reason: "wrong_pin" });
      }
    }

    else if (msg.type === "LOCK_TAB") {
      const tabId = String(sender.tab?.id || msg.tabId);
      const tabs = data.unlockedTabs || {};
      delete tabs[tabId];
      // In session mode, locking one tab locks the whole session
      const update = { unlockedTabs: tabs, locked: true };
      if (!data.lockEachTab) update.sessionUnlocked = false;
      await chrome.storage.local.set(update);
      sendResponse({ success: true });
    }

    else if (msg.type === "LOCK_ALL") {
      await chrome.storage.local.set({ unlockedTabs: {}, sessionUnlocked: false, locked: true });
      // Notify all tabs
      const allTabs = await chrome.tabs.query({});
      for (const tab of allTabs) {
        safeSendToTab(tab.id, { type: "FORCE_LOCK" });
      }
      sendResponse({ success: true });
    }

    else if (msg.type === "ATTEMPT_GATE_AUTH") {
      // Verifies PIN for popup access only — does NOT unlock any tabs
      if (!data.pin) {
        sendResponse({ success: true }); // no PIN set, open freely
      } else if (msg.pin === data.pin) {
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    }

    else if (msg.type === "GET_CONFIG") {
      sendResponse({ config: data });
    }

    else if (msg.type === "SAVE_CONFIG") {
      await chrome.storage.local.set(msg.config);
      sendResponse({ success: true });
    }

  })();
  return true; // Keep channel open for async
});

// Handle alarms (auto-relock after duration)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "relock_session") {
    // Session-wide relock — lock all tabs
    await chrome.storage.local.set({ unlockedTabs: {}, sessionUnlocked: false, locked: true });
    const allTabs = await chrome.tabs.query({});
    for (const tab of allTabs) {
      safeSendToTab(tab.id, { type: "FORCE_LOCK" });
    }
  } else if (alarm.name.startsWith("relock_")) {
    // Per-tab relock (lockEachTab mode)
    const tabId = parseInt(alarm.name.replace("relock_", ""));
    const data = await chrome.storage.local.get(null);
    const tabs = data.unlockedTabs || {};
    delete tabs[String(tabId)];
    await chrome.storage.local.set({ unlockedTabs: tabs, locked: true });
    safeSendToTab(tabId, { type: "FORCE_LOCK" });
  }
});

// Auto-relock on tab switch if enabled
chrome.tabs.onActivated.addListener(async (info) => {
  const data = await chrome.storage.local.get(["autoRelockOnTabSwitch", "unlockedTabs"]);
  if (data.autoRelockOnTabSwitch) {
    const tabs = data.unlockedTabs || {};
    // Lock all OTHER tabs when switching
    for (const tabId in tabs) {
      if (parseInt(tabId) !== info.tabId) {
        delete tabs[String(tabId)];
        safeSendToTab(parseInt(tabId), { type: "FORCE_LOCK" });
      }
    }
    await chrome.storage.local.set({ unlockedTabs: tabs });
  }
});
