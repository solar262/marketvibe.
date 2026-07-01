(() => {
  const LEAD_HUNT_KEY = "marketvibe_lead_hunt_autopilot";
  const AUTO_HELPER_KEY = "marketvibe_auto_import_helper_last_click";
  const QUERY_FIX_KEY = "marketvibe_auto_import_helper_query_fix";
  const BROAD_BUYER_QUERIES = [
    "need clients",
    "need leads",
    "looking for clients",
    "looking for leads",
    "how do I get clients",
    "how do I find customers",
    "need more customers",
    "need sales",
    "ads not working",
    "lead generation help",
    "cold outreach not working",
    "no one replies to my outreach",
    "struggling to generate leads",
    "where do I find prospects",
  ];

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LEAD_HUNT_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(LEAD_HUNT_KEY, JSON.stringify(state));
      window.dispatchEvent(new StorageEvent("storage", { key: LEAD_HUNT_KEY, newValue: JSON.stringify(state) }));
    } catch {
      // Ignore browser storage edge cases. Main content script still handles the run.
    }
  }

  function buildSearches(state) {
    const existingSources = new Set((state.searches || []).map((item) => item.source).filter(Boolean));
    const useFacebook = !existingSources.size || existingSources.has("Facebook Search");
    const useGoogle = existingSources.has("Google indexed Facebook results");
    const useBing = existingSources.has("Bing indexed Facebook results");
    const searches = [];

    for (const query of BROAD_BUYER_QUERIES) {
      if (useFacebook) {
        searches.push({
          source: "Facebook Search",
          query,
          url: `https://www.facebook.com/search/posts/?q=${encodeURIComponent(query)}`,
        });
      }
      if (useGoogle) {
        searches.push({
          source: "Google indexed Facebook results",
          query,
          url: `https://www.google.com/search?q=${encodeURIComponent(`site:facebook.com/groups ${query}`)}`,
        });
      }
      if (useBing) {
        searches.push({
          source: "Bing indexed Facebook results",
          query,
          url: `https://www.bing.com/search?q=${encodeURIComponent(`site:facebook.com/groups ${query}`)}`,
        });
      }
    }

    return searches;
  }

  function hasOldNarrowQueries(state) {
    const combined = (state.searches || []).map((item) => `${item.query || ""} ${item.url || ""}`).join("\n").toLowerCase();
    return /web design clients|seo clients|sell websites|sell seo|web designer struggling|seo freelancer struggling|agency owner client acquisition/.test(combined);
  }

  function replaceOldQueueIfNeeded() {
    const state = readState();
    if (!state?.active || !Array.isArray(state.searches) || !hasOldNarrowQueries(state)) return;
    const now = Date.now();
    const lastFix = Number(localStorage.getItem(QUERY_FIX_KEY) || 0);
    if (now - lastFix < 3000) return;
    localStorage.setItem(QUERY_FIX_KEY, String(now));

    const searches = buildSearches(state);
    if (!searches.length) return;
    const nextState = {
      ...state,
      searches,
      currentSearchIndex: 0,
      currentResultIndex: 0,
      currentResultUrls: [],
      status: "Auto-corrected Buyer Radar to broad buyer-intent pain searches.",
      nextActionAt: Date.now() + 250,
    };
    saveState(nextState);

    if (/facebook\.com\/search\/posts/i.test(location.href) && /web%20design%20clients|seo%20clients|sell%20websites|sell%20seo/i.test(location.href)) {
      window.location.assign(searches[0].url);
    }
  }

  function findSendButton() {
    return Array.from(document.querySelectorAll("button, a"))
      .filter((item) => item instanceof HTMLElement)
      .find((item) => /send visible posts to marketvibe/i.test(item.textContent || ""));
  }

  function shouldAutoClickSend() {
    const state = readState();
    if (state?.active && !state.paused) return true;
    const panelText = document.body?.innerText || "";
    return /MarketVibe Buyer Radar/i.test(panelText) && /high-intent|buyer item|Recent MarketVibe imports/i.test(panelText);
  }

  function autoClickSendVisiblePosts() {
    if (!/facebook\.com/i.test(location.hostname)) return;
    if (!shouldAutoClickSend()) return;
    const button = findSendButton();
    if (!(button instanceof HTMLElement)) return;

    const now = Date.now();
    const lastClick = Number(localStorage.getItem(AUTO_HELPER_KEY) || 0);
    if (now - lastClick < 12000) return;
    localStorage.setItem(AUTO_HELPER_KEY, String(now));
    button.click();
  }

  function tick() {
    replaceOldQueueIfNeeded();
    autoClickSendVisiblePosts();
  }

  window.setInterval(tick, 2500);
  window.setTimeout(tick, 800);
})();
