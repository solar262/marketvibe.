(() => {
  const LEAD_HUNT_KEY = "marketvibe_lead_hunt_autopilot";
  const WATCHDOG_KEY = "marketvibe_lead_hunt_watchdog_snapshot";
  const CHECK_MS = 20000;
  const STALE_MS = 90000;
  const MAX_RECOVERIES_PER_QUERY = 2;

  if (!/facebook\.com$|google\.com$|bing\.com$/i.test(location.hostname)) return;

  function now() {
    return Date.now();
  }

  function clean(value, limit = 500) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LEAD_HUNT_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveState(state) {
    localStorage.setItem(LEAD_HUNT_KEY, JSON.stringify(state));
  }

  function readSnapshot() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WATCHDOG_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveSnapshot(snapshot) {
    localStorage.setItem(WATCHDOG_KEY, JSON.stringify(snapshot));
  }

  function progressSignature(state) {
    return [
      state?.runId || "",
      state?.currentSearchIndex || 0,
      state?.currentResultIndex || 0,
      state?.importedCount || 0,
      state?.skippedCount || 0,
      state?.ignoredLowConfidenceCount || 0,
      state?.duplicateCount || 0,
      state?.failedCount || 0,
      state?.currentLock || "",
      clean(state?.status || "", 140),
      clean(location.href, 240),
    ].join("|");
  }

  function showToast(message) {
    let panel = document.getElementById("marketvibe-watchdog-toast");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "marketvibe-watchdog-toast";
      panel.style.cssText = "position:fixed;right:18px;top:122px;z-index:2147483647;max-width:min(380px,calc(100vw - 32px));border-radius:14px;background:#07111f;color:white;border:1px solid rgba(251,191,36,.55);box-shadow:0 16px 42px rgba(0,0,0,.34);padding:12px;font:800 12px Arial,sans-serif;";
      document.body.appendChild(panel);
    }
    panel.textContent = message;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => panel.remove(), 5000);
  }
  showToast.timer = 0;

  function closeFacebookPopups() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    const close = Array.from(document.querySelectorAll('[aria-label], [role="button"], button')).find((item) => {
      const label = clean(item.getAttribute?.("aria-label") || item.textContent || "", 80);
      return /^(close|dismiss|back|done)$/i.test(label) || /\b(close|dismiss|back|done)\b/i.test(label);
    });
    if (close instanceof HTMLElement) close.click();
  }

  function currentSearch(state) {
    return Array.isArray(state?.searches) ? state.searches[Number(state.currentSearchIndex || 0)] : null;
  }

  function nextSearch(state) {
    const searches = Array.isArray(state?.searches) ? state.searches : [];
    const currentIndex = Number(state.currentSearchIndex || 0);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= searches.length || nextIndex >= Number(state.caps?.maxSearches || 10)) return null;
    return { index: nextIndex, search: searches[nextIndex] };
  }

  function withLeadHuntStateHash(url, state) {
    try {
      const nextUrl = new URL(url, location.href);
      nextUrl.hash = `marketvibeLeadHuntState=${encodeURIComponent(JSON.stringify(state))}`;
      return nextUrl.toString();
    } catch {
      return url;
    }
  }

  function looksLikeFacebookLoadingOrBroken() {
    const text = clean(document.body?.innerText || "", 700);
    return /\b(this page is having a problem|result_code_hung|loading|please wait|temporarily unavailable|this content isn't available|content isn't available)\b/i.test(text);
  }

  function recover(state, snapshot) {
    const recoveries = Number(snapshot?.recoveriesForQuery || 0) + 1;
    const base = {
      ...state,
      currentLock: "",
      scrollAttempts: 0,
      loadingSince: 0,
      loadingReloaded: false,
      watchdogRecoveries: Number(state.watchdogRecoveries || 0) + 1,
      errors: [`${new Date().toLocaleTimeString()} Watchdog recovered a stuck Buyer Radar page`, ...(state.errors || [])].slice(0, 8),
      status: "Watchdog recovered a stuck page. Continuing Buyer Radar automatically.",
      lastProgressAt: now(),
      nextActionAt: now() + 750,
    };

    closeFacebookPopups();

    if (/facebook\.com/i.test(location.hostname)) {
      window.scrollBy({ top: Math.round(window.innerHeight * 0.9), behavior: "smooth" });
    }

    if (recoveries >= MAX_RECOVERIES_PER_QUERY) {
      const next = nextSearch(base);
      if (next?.search?.url) {
        const advanced = {
          ...base,
          currentSearchIndex: next.index,
          currentResultIndex: 0,
          currentResultUrls: [],
          currentQueryIgnoredLowConfidence: 0,
          currentQueryImportedCount: 0,
          skippedCount: Number(base.skippedCount || 0) + 1,
          status: "Watchdog skipped a stuck/duplicate-heavy query and opened the next buyer-intent search.",
          nextActionAt: now() + 1500,
        };
        saveState(advanced);
        saveSnapshot({ signature: progressSignature(advanced), changedAt: now(), recoveriesForQuery: 0, queryIndex: next.index });
        showToast("Buyer Radar watchdog skipped a stuck query and opened the next one.");
        window.setTimeout(() => window.location.assign(withLeadHuntStateHash(next.search.url, advanced)), 900);
        return;
      }
    }

    saveState(base);
    saveSnapshot({ signature: progressSignature(base), changedAt: now(), recoveriesForQuery: recoveries, queryIndex: Number(base.currentSearchIndex || 0) });
    showToast("Buyer Radar watchdog cleared a stuck page and nudged the run forward.");

    if (looksLikeFacebookLoadingOrBroken()) {
      window.setTimeout(() => location.reload(), 1200);
    }
  }

  function tick() {
    if (document.hidden) return;
    const state = readState();
    if (!state?.active || state.paused || state.extensionReloadRequired) return;

    const signature = progressSignature(state);
    const snapshot = readSnapshot();
    const queryIndex = Number(state.currentSearchIndex || 0);

    if (!snapshot || snapshot.signature !== signature || snapshot.queryIndex !== queryIndex) {
      saveSnapshot({ signature, changedAt: now(), recoveriesForQuery: 0, queryIndex });
      return;
    }

    const staleFor = now() - Number(snapshot.changedAt || now());
    const status = clean(state.status || "", 300);
    const duplicateHeavy = Number(state.duplicateCount || 0) >= 20 && /duplicate|fresh pass|handled/i.test(status);
    const weakQuery = Number(state.currentQueryIgnoredLowConfidence || 0) >= 12 && Number(state.currentQueryImportedCount || 0) === 0;
    const lockedTooLong = Boolean(state.currentLock) && staleFor > 45000;
    const brokenPage = looksLikeFacebookLoadingOrBroken();

    if (staleFor > STALE_MS || duplicateHeavy || weakQuery || lockedTooLong || brokenPage) {
      recover(state, snapshot);
    }
  }

  window.setInterval(tick, CHECK_MS);
  window.addEventListener("focus", () => window.setTimeout(tick, 1500));
  window.addEventListener("pageshow", () => window.setTimeout(tick, 1500));
})();
