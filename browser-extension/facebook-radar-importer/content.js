(() => {
  const API_URL = "https://www.marketvibe1.com/api/internal-marketing-leads";
  const STATUS_API_URL = "https://www.marketvibe1.com/api/internal-marketing-leads/hunt-status";
  const EVENT_API_URL = "https://www.marketvibe1.com/api/internal-marketing-leads/events";
  const PROCESSED_URL_API_URL = "https://www.marketvibe1.com/api/internal-marketing-leads/processed-url";
  const EXTENSION_VERSION = "0.1.5";
  const CACHE_KEY = "marketvibe_recent_facebook_imports";
  const MAX_RECENT_IMPORTS = 20;
  const SCAN_INTERVAL_MS = 1500;
  const SCAN_CLEANUP_MS = 3000;
  const HANDLED_KEY = "marketvibe_facebook_handled_posts";
  const MAX_HANDLED_POSTS = 500;
  const LEAD_HUNT_KEY = "marketvibe_lead_hunt_autopilot";
  const MAX_SCROLL_ATTEMPTS = 25;
  const HIGH_INTENT_IMPORT_THRESHOLD = 78;
  const STUCK_RECOVERY_MS = 60000;
  const LOADING_RECOVERY_MS = 30000;
  const ACTION_TIMEOUT_MS = 15000;
  const CONTROL_POLL_MS = 2000;
  const OUTREACH_MODES = ["off", "draft-only", "manual-approval", "allowed-adapters"];
  const LEAD_HUNT_PRESETS = [
    "how do I get web design clients",
    "how do I get SEO clients",
    "where can I find local business leads",
    "how to sell websites to local businesses",
    "how to sell SEO to local businesses",
    "web designer struggling to get clients",
    "SEO freelancer struggling to get clients",
    "agency owner client acquisition",
    "cold outreach not working for agency",
    "where do marketers find prospects",
  ];
  let leadHuntIntervalId = 0;
  let leadHuntControlPollId = 0;
  let leadHuntTickRunning = false;
  let extensionReloadRequired = false;
  const leadHuntTimeoutIds = new Set();
  if (document.getElementById("marketvibe-import-button")) return;

  function logLeadHunt(event, details = {}) {
    console.log(`[MarketVibe Buyer Radar] ${event}`, details);
  }

  function newRunId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `hunt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function isMarketVibeHost() {
    return /(^|\.)marketvibe1\.com$/i.test(location.hostname);
  }

  function extensionStorageAvailable() {
    try {
      return Boolean(globalThis.chrome?.storage?.local && globalThis.chrome?.runtime?.id);
    } catch (error) {
      handleExtensionContextInvalidated(error, "storage availability check");
      return false;
    }
  }

  function isExtensionContextError(error) {
    return /extension context invalidated|context invalidated|extension context was invalidated|extension (?:has been )?reloaded/i.test(String(error?.message || error || ""));
  }

  function stopLeadHuntControlPoller() {
    if (leadHuntControlPollId) {
      window.clearInterval(leadHuntControlPollId);
      leadHuntControlPollId = 0;
    }
  }

  function handleExtensionContextInvalidated(error, source = "extension api") {
    if (!isExtensionContextError(error)) return false;
    const message = "Extension reloaded. Please refresh the Facebook page.";
    extensionReloadRequired = true;
    clearLeadHuntTimers();
    stopLeadHuntControlPoller();
    leadHuntTickRunning = false;
    const state = getLeadHuntState();
    if (state) {
      localStorage.setItem(LEAD_HUNT_KEY, JSON.stringify({
        ...state,
        active: false,
        paused: false,
        currentLock: "",
        extensionReloadRequired: true,
        stoppedAt: Date.now(),
        status: message,
        nextActionAt: 0,
        errors: [`${new Date().toLocaleTimeString()} Extension Reload Required`, ...(state.errors || [])].slice(0, 8),
      }));
      renderLeadHuntPanel();
    }
    logLeadHunt("Extension Reload Required", { source, message: error?.message || "context invalidated" });
    showStatus(message);
    return true;
  }

  async function internalApiKey() {
    if (!extensionStorageAvailable()) return "";
    try {
      const stored = await chrome.storage.local.get("marketvibe_internal_key");
      return clean(stored.marketvibe_internal_key || "");
    } catch (error) {
      if (handleExtensionContextInvalidated(error, "read internal key")) return "";
      throw error;
    }
  }

  async function setInternalApiKey(key) {
    if (!extensionStorageAvailable()) return false;
    try {
      await chrome.storage.local.set({ marketvibe_internal_key: clean(key) });
      return true;
    } catch (error) {
      if (handleExtensionContextInvalidated(error, "save internal key")) return false;
      throw error;
    }
  }

  async function internalHeaders(extra = {}) {
    const headers = { "Content-Type": "application/json", ...extra };
    const key = await internalApiKey();
    if (key) headers["X-MarketVibe-Internal-Key"] = key;
    return headers;
  }

  function installMarketVibeDashboardBridge() {
    window.addEventListener("message", async (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      const data = event.data || {};
      if (data.type !== "MARKETVIBE_BUYER_RADAR_SAVE_KEY") return;
      const key = clean(data.key || "");
      const saved = key ? await setInternalApiKey(key) : false;
      window.postMessage({
        type: "MARKETVIBE_BUYER_RADAR_KEY_SAVE_RESULT",
        status: saved ? "Connected" : "Missing key",
      }, location.origin);
    });
  }

  function installStoredKeyResumeListener() {
    if (!extensionStorageAvailable()) return;
    try {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local" || !changes.marketvibe_internal_key?.newValue) return;
        const state = getLeadHuntState();
        if (state?.active && state.paused && /key|auth/i.test(`${state.importAuthStatus || ""} ${state.status || ""}`)) {
          resumeLeadHunt("Internal API key connected. Resuming Buyer Radar.");
        }
      });
    } catch (error) {
      handleExtensionContextInvalidated(error, "storage change listener");
    }
  }

  if (isMarketVibeHost()) {
    installMarketVibeDashboardBridge();
    return;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = ACTION_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  }

  function clearLeadHuntTimers() {
    for (const timerId of leadHuntTimeoutIds) window.clearTimeout(timerId);
    leadHuntTimeoutIds.clear();
    if (leadHuntIntervalId) {
      window.clearInterval(leadHuntIntervalId);
      leadHuntIntervalId = 0;
    }
    leadHuntTickRunning = false;
  }

  function scheduleLeadHuntAction(callback, delay, reason = "scheduled action") {
    const timerId = window.setTimeout(() => {
      leadHuntTimeoutIds.delete(timerId);
      if (extensionReloadRequired) return;
      const state = getLeadHuntState();
      if (!state?.active || state.paused) {
        logLeadHunt("scheduled action blocked", { reason, active: Boolean(state?.active), paused: Boolean(state?.paused) });
        return;
      }
      callback(state);
    }, Math.max(0, delay));
    leadHuntTimeoutIds.add(timerId);
    return timerId;
  }

  function leadHuntIsRunnable(state = getLeadHuntState()) {
    return Boolean(!extensionReloadRequired && state?.active && !state.paused);
  }

  async function postLeadHuntEvent(eventType, payload = {}) {
    const state = getLeadHuntState();
    fetchWithTimeout(EVENT_API_URL, {
      method: "POST",
      headers: await internalHeaders(),
      body: JSON.stringify({
        runId: state?.runId || "",
        eventType,
        ...payload,
      }),
    }).catch((error) => logLeadHunt("event sync failed", { eventType, message: error?.message || "unknown" }));
  }

  async function recordProcessedUrl(sourceUrl, status, payload = {}) {
    const state = getLeadHuntState();
    if (!sourceUrl) return;
    fetchWithTimeout(PROCESSED_URL_API_URL, {
      method: "POST",
      headers: await internalHeaders(),
      body: JSON.stringify({
        runId: state?.runId || "",
        sourceUrl,
        status,
        ...payload,
      }),
    }).catch((error) => logLeadHunt("processed-url sync failed", { status, message: error?.message || "unknown" }));
  }

  function confidenceThreshold(state = getLeadHuntState()) {
    const configured = Number(state?.caps?.confidenceThreshold || HIGH_INTENT_IMPORT_THRESHOLD);
    if (!Number.isFinite(configured)) return HIGH_INTENT_IMPORT_THRESHOLD;
    return Math.max(50, Math.min(95, configured));
  }

  function isImportAuthError(error) {
    return /\bHTTP (401|403)\b|auth required|unauthorized|forbidden/i.test(String(error?.message || error || ""));
  }

  async function handleImportAuthError(error, fallbackState = getLeadHuntState()) {
    if (!isImportAuthError(error)) return false;
    const state = getLeadHuntState() || fallbackState;
    const authStatus = await internalApiKey() ? "Invalid key" : "Missing key";
    const message = `${authStatus}. Add/update the internal API key in the Buyer Radar dashboard, then resume.`;
    if (state) {
      saveLeadHuntState({
        ...state,
        active: true,
        paused: true,
        currentLock: "",
        importAuthStatus: authStatus,
        status: message,
        errors: [],
        nextActionAt: Date.now() + 3600000,
      });
      ensureLeadHuntControlPoller();
    }
    showStatus(message);
    logLeadHunt("import auth needed", { authStatus, message: error?.message || "HTTP 401" });
    return true;
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function trimRepeatedWords(text) {
    const words = clean(text).split(" ");
    const output = [];
    let previous = "";
    let repeatCount = 0;

    for (const word of words) {
      const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!normalized) continue;
      if (normalized === previous) {
        repeatCount += 1;
        if (repeatCount <= 1 && normalized !== "facebook") output.push(word);
        continue;
      }
      previous = normalized;
      repeatCount = 0;
      if (normalized === "facebook") continue;
      output.push(word);
    }

    return output.join(" ").replace(/\bFacebook\b(?:\s*\bFacebook\b)+/gi, " ").replace(/\s+/g, " ").trim();
  }

  function isVisibleElement(element) {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || "1") !== 0 && rect.width > 0 && rect.height > 0;
  }

  function cleanLeadText(value, limit = 700) {
    let text = trimRepeatedWords(value)
      .replace(/(?:Facebook){2,}/gi, " ")
      .replace(/\b(Home|Watch|Marketplace|Groups|Gaming|Notifications|Menu|Search|Filters|All|People|Reels|Pages|Events)\b/gi, " ")
      .replace(/\b(Like|Comment|Share|Send|Follow|Join|Write a comment|Add a comment|View more comments|See more|See less)\b/gi, " ")
      .replace(/\b\d+\s*(likes?|comments?|shares?)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const usefulStart = text.search(/\b(most|how|i need|i want|i have|i own|my|we|our|looking|need|no leads|no sales|no traffic|client|customer|website|seo|ads|marketing|ecommerce|business)\b/i);
    if (usefulStart > 0 && usefulStart < 360) text = text.slice(usefulStart);
    return clean(text).slice(0, limit);
  }

  function getPostText(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll(".marketvibe-intent-badge, .marketvibe-card-actions, [aria-hidden='true'], [role='navigation'], [role='banner'], [role='button']").forEach((item) => item.remove());
    const candidates = Array.from(clone.querySelectorAll("[data-ad-preview='message'], [dir='auto'], span, div"))
      .map((item) => cleanLeadText(item.textContent || "", 900))
      .filter((text) => text.length >= 30 && !/^facebook$/i.test(text))
      .sort((a, b) => b.length - a.length);
    const combined = Array.from(new Set(candidates.slice(0, 5))).join(" ");
    return cleanLeadText(combined || candidates[0] || clone.textContent || "", 900) || "Facebook post imported";
  }

  function getBestVisibleText(node, selectors, fallback = "") {
    for (const selector of selectors) {
      const items = Array.from(node.querySelectorAll(selector));
      for (const item of items) {
        if (item instanceof HTMLElement && !isVisibleElement(item)) continue;
        const text = cleanLeadText(item.textContent || item.getAttribute("aria-label") || "", 120);
        if (text && text.length <= 120 && !/^facebook$/i.test(text)) return text;
      }
    }
    return fallback;
  }

  function extractGroupName() {
    return cleanLeadText(document.title.replace(/\| Facebook$/i, ""), 120) || "Facebook source";
  }

  function extractAuthorName(node) {
    return getBestVisibleText(node, ["h2 strong a", "h3 strong a", "strong a[role='link']", "h2 a[role='link']", "h3 a[role='link']", "a[role='link']"], "Unknown author");
  }

  function extractTimestamp(node) {
    const abbr = node.querySelector("abbr");
    if (abbr) return clean(abbr.getAttribute("aria-label") || abbr.textContent || "", 80);
    const timeLink = Array.from(node.querySelectorAll("a[role='link'], span"))
      .map((item) => clean(item.getAttribute("aria-label") || item.textContent || "", 80))
      .find((text) => /\b(\d+\s*(m|h|d|w)|just now|yesterday|mon|tue|wed|thu|fri|sat|sun)\b/i.test(text));
    return timeLink || "";
  }

  const STRONG_BUYER_SIGNALS = [
    /how do i get clients?/i,
    /where (?:do|can) i find (?:prospects|local business leads|business leads)/i,
    /how do i get leads?/i,
    /struggling (?:on |with |to )?(?:generat(?:e|ing)|get(?:ting)?) (?:more )?leads?/i,
    /struggling to find clients?/i,
    /struggling to get clients?/i,
    /need help (?:getting|finding|generating) (?:more )?(?:leads?|clients?|customers?)/i,
    /need more leads?/i,
    /need more (?:customers?)/i,
    /looking for leads?/i,
    /looking for marketing help/i,
    /how to market websites?/i,
    /how do i grow my business/i,
    /looking for alternatives? to cold calling/i,
    /no clients? this month/i,
    /need appointments?/i,
    /agency owner struggling/i,
    /web designers? need clients?/i,
    /seo freelancers? need leads?/i,
    /client acquisition/i,
    /looking for (?:a )?tool to find leads/i,
    /cold outreach.*not working/i,
    /cold calling.*time consuming/i,
    /no one replies/i,
    /prospecting.*not working/i,
    /how (?:do|can) i sell websites? to (?:local|small) businesses/i,
    /how (?:do|can) i sell seo to (?:local|small) businesses/i,
    /booking system clients/i,
    /social media management clients/i,
    /automation consultant.*clients/i,
    /first few clients/i,
    /client acquisition/i,
    /lead generation help/i,
    /struggling to get/i,
    /how do i get booking system clients/i,
  ];

  const WEBSITE_SERVICE_PATTERN = /\b(helping people with (?:their )?websites?|help people with (?:their )?websites?|websites?|web design|website designers?|web designers?|website services?|web design services?|i build websites?|i make websites?|build websites?|make websites?)\b/i;
  const CLIENT_ACQUISITION_PAIN_PATTERN = /\b(how to get clients?|how do i get clients?|get clients?|need clients?|find clients?|finding clients?|terrible at marketing|bad at marketing|struggling (?:with|to do)? marketing|marketing is hard|need leads?|find leads?|client acquisition|prospecting|prospects?)\b/i;
  const SERVICE_CONTEXT_PATTERN = /\b(web designers?|website designers?|web design(?:ers?| agencies| services?)?|website services?|seo freelancers?|seo agencies?|seo consultants?|seo services?|local marketers?|local marketing agencies?|marketing agencies?|agenc(?:y|ies)|agency owners?|freelancers?|freelance services?|booking system sellers?|booking systems?|automation consultants?|social media managers?|social media marketing agencies?|smma|service providers?|lead gen agencies?|lead generation agencies?|web design agency|website agency|appointment setting|appointment-setting|shopify stores?|shopify services?|shopify setup services?|coaches?|consultants?|local services?)\b/i;
  const SPECIFIC_INTENT_PATTERN = /\b(web design clients?|website clients?|seo clients?|marketing clients?|agency leads?|agency clients?|local marketing clients?|local business prospecting|local business leads?|finding clients?|find clients?|how to get clients?|how do i get clients?|client acquisition|smma clients?|lead generation|appointment setting leads?|appointment-setting leads?|selling websites?|sell websites?|selling seo|sell seo|selling services to local businesses|prospecting|prospects?|outreach)\b/i;
  const EXACT_BUYER_INTENT_PATTERN = /\b(web design clients?|website clients?|seo clients?|agency leads?|local business leads?|local business prospecting|selling websites?|sell websites?|selling seo|sell seo|marketing clients?|smma clients?|client acquisition|appointment setting leads?|appointment-setting leads?|lead generation)\b/i;
  const GROWTH_PAIN_PATTERN = /\b(struggling to find clients?|need help (?:getting|finding|generating) (?:more )?(?:leads?|clients?|customers?)|need more (?:customers?)|need more leads?|looking for marketing help|how to market websites?|how do i grow my business|visibility|traffic|sales|growth)\b/i;
  const HELP_REQUEST_PATTERN = /\b(how do i|how can i|where do i|where can i|need help|looking for help|any advice|what should i|struggling|stuck|not working|recommendations?)\b|\?/i;
  const WEAK_GENERIC_CLIENT_PATTERN = /\b(need clients|get clients|more clients|new clients|general clients|closing clients|close clients|sales calls?|business growth)\b/i;
  const OFF_TOPIC_PATTERN = /\b(real estate|realtor|realtors|realty|mortgage|escrow|closing costs?|property closing|insurance|life insurance|policy|policies|mlm|multi level|network marketing|dating|tinder|relationship advice|single moms?|sports?|football|nba|nfl|soccer|fan page|motivation|motivational|mindset|inspirational|side hustles?|passive income|dropshipping|affiliate|marketplace|for sale|selling my|garage sale|job seeker|resume|cv|looking for work|open to work)\b/i;
  const QUESTION_OR_DISCUSSION_PATTERN = /\b(how do i|how can i|where do i|where can i|any advice|what should i|struggling|not working|no one replies|comments?|thoughts|recommendations?)\b|\?/i;
  const IMAGE_OR_MEME_PATTERN = /\b(meme|funny|photo dump|caption this|image only|reel|watch this|viral)\b/i;

  const SUPPORTING_BUYER_SIGNALS = [
    /any advice/i,
    /would love advice/i,
    /can someone help/i,
    /what should i do/i,
    /where do i find/i,
    /i hate cold emails/i,
    /running a .*agency/i,
    /web development agency/i,
    /alternatives? to cold calling/i,
  ];

  const HARD_SKIP_SIGNALS = [
    /hiring/i,
    /job/i,
    /roles? open/i,
    /looking for (?:a )?(?:web )?developer/i,
    /need (?:a )?(?:web )?developer/i,
    /cheap website/i,
    /pay per website/i,
    /\$ ?50 per website/i,
    /commission only/i,
    /commission based/i,
    /closer/i,
    /proposal writer/i,
    /we are expanding/i,
    /we operate across/i,
    /professional web developer/i,
    /my services/i,
    /we provide/i,
    /lead generation service/i,
    /need more clients for your business/i,
    /stop wasting time searching/i,
    /verified leads/i,
    /100% targeted/i,
    /dm me/i,
    /guaranteed leads/i,
    /guaranteed clients/i,
    /buy leads/i,
    /sell leads/i,
    /pay per lead/i,
    /for hire/i,
    /book a call/i,
    /appointment setter/i,
    /vacancy/i,
    /upwork/i,
    /fiverr/i,
    /crypto/i,
    /forex/i,
    /group directory/i,
  ];

  const SELLER_PHRASES = [
    /i can help/i,
    /i offer/i,
    /we offer/i,
    /i provide/i,
    /we provide/i,
    /grow your business/i,
    /convert visitors into customers/i,
    /my services/i,
    /7 days free/i,
  ];

  function countPatternMatches(text, patterns) {
    return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
  }

  function detectMatchReason(text, score, meta = {}) {
    const reasons = [];
    if (WEBSITE_SERVICE_PATTERN.test(text) && CLIENT_ACQUISITION_PAIN_PATTERN.test(text)) return "Website service seller asking how to get clients.";
    if (SERVICE_CONTEXT_PATTERN.test(text) || (WEBSITE_SERVICE_PATTERN.test(text) && CLIENT_ACQUISITION_PAIN_PATTERN.test(text))) reasons.push("service-seller context");
    if (EXACT_BUYER_INTENT_PATTERN.test(text)) reasons.push("specific client-acquisition phrase");
    else if (SPECIFIC_INTENT_PATTERN.test(text)) reasons.push("prospecting/client-acquisition context");
    if (GROWTH_PAIN_PATTERN.test(text) && HELP_REQUEST_PATTERN.test(text)) reasons.push("growth or lead pain request");
    if (QUESTION_OR_DISCUSSION_PATTERN.test(text)) reasons.push("discussion/question signal");
    if (Number(meta.commentCount || 0) >= 2) reasons.push(`${meta.commentCount} comments`);
    if (OFF_TOPIC_PATTERN.test(text)) reasons.push("off-topic category penalty");
    if (WEAK_GENERIC_CLIENT_PATTERN.test(text) && !EXACT_BUYER_INTENT_PATTERN.test(text)) reasons.push("generic client language only");
    return reasons.length ? `${score}/100 confidence: ${reasons.join(", ")}` : `${score}/100 confidence: no strong buyer-radar reason`;
  }

  function extractCommentCount(node) {
    const text = clean(node?.innerText || node?.textContent || "");
    const matches = Array.from(text.matchAll(/\b(\d{1,4})\s+comments?\b/gi));
    const values = matches.map((match) => Number(match[1])).filter(Number.isFinite);
    return values.length ? Math.max(...values) : 0;
  }

  function scorePost(text, meta = {}) {
    let score = 0;
    let strongMatches = 0;
    const websiteServiceSeller = WEBSITE_SERVICE_PATTERN.test(text);
    const clientAcquisitionPain = CLIENT_ACQUISITION_PAIN_PATTERN.test(text);
    const serviceIntentCombination = websiteServiceSeller && clientAcquisitionPain;
    const serviceSeller = SERVICE_CONTEXT_PATTERN.test(text) || serviceIntentCombination;
    const specificIntent = SPECIFIC_INTENT_PATTERN.test(text) || serviceIntentCombination;
    const exactBuyerIntent = EXACT_BUYER_INTENT_PATTERN.test(text) || serviceIntentCombination;
    const growthPainRequest = GROWTH_PAIN_PATTERN.test(text) && HELP_REQUEST_PATTERN.test(text);
    const genericLocalBusiness = /\b(my business|our business|business owner|small business owner|restaurant|cafe|clinic|salon|contractor|roofer|plumber|law firm|gym|dentist|shopify store|ecommerce store|online store|my website gets no traffic|my business has no leads|store not converting)\b/i.test(text);
    const offTopicMatches = countPatternMatches(text, [OFF_TOPIC_PATTERN]);

    for (const pattern of HARD_SKIP_SIGNALS) {
      if (pattern.test(text)) return -999;
    }

    for (const pattern of STRONG_BUYER_SIGNALS) {
      if (pattern.test(text)) {
        score += 25;
        strongMatches += 1;
      }
    }

    for (const pattern of SUPPORTING_BUYER_SIGNALS) {
      if (pattern.test(text)) score += 8;
    }

    for (const pattern of SELLER_PHRASES) {
      if (pattern.test(text) && !/\b(clients?|leads?|prospects?|outreach|prospecting|client acquisition)\b/i.test(text)) score -= 35;
    }

    if (/\?/.test(text)) score += 8;
    if (/\b(i|my|we|our)\b/i.test(text) && /\b(struggling|stuck|need|looking|can't|cannot|no|help|advice)\b/i.test(text)) score += 15;
    if (websiteServiceSeller) score += 28;
    if (clientAcquisitionPain) score += 22;
    if (serviceIntentCombination) score += 48;
    if (growthPainRequest) score += 32;
    if (growthPainRequest && /\b(leads?|clients?|customers?|marketing help|visibility|traffic|sales|growth)\b/i.test(text)) score += 18;
    if (specificIntent) score += 30;
    if (exactBuyerIntent) score += 24;
    if (serviceSeller && /\b(leads|clients|prospects|outreach|prospecting|cold calling|client acquisition)\b/i.test(text)) score += 24;
    if (QUESTION_OR_DISCUSSION_PATTERN.test(text)) score += 10;
    if (Number(meta.commentCount || 0) >= 2) score += Math.min(12, Number(meta.commentCount || 0) * 2);
    if (IMAGE_OR_MEME_PATTERN.test(text) || (!QUESTION_OR_DISCUSSION_PATTERN.test(text) && text.length < 160)) score -= 20;
    if (WEAK_GENERIC_CLIENT_PATTERN.test(text) && !exactBuyerIntent && !serviceSeller) score -= 45;
    if (WEAK_GENERIC_CLIENT_PATTERN.test(text) && !exactBuyerIntent) score -= 20;
    score -= offTopicMatches * 70;
    if (genericLocalBusiness && !serviceSeller && !growthPainRequest) score -= 80;
    if (genericLocalBusiness && !serviceSeller && growthPainRequest) score -= 25;
    if (!serviceSeller && !growthPainRequest) score -= 35;
    if (!specificIntent && !growthPainRequest) score -= 45;
    if (!serviceSeller && !specificIntent && !growthPainRequest) score -= 60;
    if (!strongMatches && !growthPainRequest) score -= 28;
    if (text.length < 80) score -= 20;

    return Math.max(-999, Math.min(100, score));
  }

  function scoreFacebookUrl(url) {
    const href = clean(url);
    if (!href) return -999;
    let score = 0;
    if (/\/posts\/\d+/i.test(href)) score += 120;
    if (/story_fbid=\d+/i.test(href)) score += 115;
    if (/\/permalink\/\d+/i.test(href) || /\/groups\/[^/?#]+\/permalink\/\d+/i.test(href)) score += 110;
    if (/comment_id=\d+/i.test(href)) score += 105;
    if (/\/photo/i.test(href) || /fbid=\d+/i.test(href)) score += 90;
    if (/\/groups\/[^/?#]+\/posts\/\d+/i.test(href)) score += 120;
    if (/facebook\.com\/groups\/[^/?#]+\/?$/i.test(href)) score -= 220;
    if (/facebook\.com\/pages\/[^/?#]+\/?$/i.test(href)) score -= 220;
    return score;
  }

  function isExactPostUrl(url) {
    return scoreFacebookUrl(url) > 0;
  }

  function isGenericFacebookUrl(url) {
    try {
      const parsed = new URL(url, location.origin);
      const path = parsed.pathname.replace(/\/+$/g, "");
      return /^\/groups\/[^/]+$/i.test(path) ||
        /^\/pages\/[^/]+$/i.test(path) ||
        /^\/profile\.php$/i.test(path) && !parsed.searchParams.get("story_fbid");
    } catch {
      return true;
    }
  }

  function normalizeFacebookUrl(rawUrl) {
    try {
      const url = new URL(rawUrl, location.origin);
      ["__cft__", "__tn__", "comment_id", "reply_comment_id", "mibextid", "refid"].forEach((key) => url.searchParams.delete(key));
      return url.toString();
    } catch {
      return location.href;
    }
  }

  function extractPostUrl(node) {
    const candidates = Array.from(node.querySelectorAll("a[href]"))
      .map((link) => normalizeFacebookUrl(link.getAttribute("href")))
      .filter((url) => url.includes("facebook.com") || url.startsWith(location.origin))
      .map((url) => ({ url, score: scoreFacebookUrl(url) }))
      .sort((a, b) => b.score - a.score);

    const exact = candidates.find((candidate) => isExactPostUrl(candidate.url) && candidate.score > 0);
    if (exact) return exact.url;

    const nonGeneric = candidates.find((candidate) => !isGenericFacebookUrl(candidate.url) && !/\/groups\/?$|\/pages\/?$/i.test(candidate.url));
    if (nonGeneric) return nonGeneric.url;
    return nonGeneric || location.href;
  }

  function buildPostFromNode(node, score, meta = {}) {
    const text = getPostText(node);
    const painPoint = meta.painPoint || detectPainPoint(text);
    const draft = createContextualReply({ text, painPoint, score });
    const commentCount = Number(meta.commentCount ?? extractCommentCount(node) ?? 0);
    const matchReason = meta.matchReason || detectMatchReason(text, score, { commentCount });
    return {
      text,
      score,
      confidenceScore: score,
      matchReason,
      sourceName: extractGroupName(),
      author: extractAuthorName(node),
      dateText: extractTimestamp(node),
      reactions: "",
      comments: commentCount || "",
      url: extractPostUrl(node),
      queryUsed: meta.queryUsed || "",
      sourceUsed: meta.sourceUsed || "",
      painPoint,
      replyDraft: meta.outreachMode === "off" ? "" : draft,
      outreachMode: meta.outreachMode || "draft-only",
    };
  }

  function detectPainPoint(text) {
    if (WEBSITE_SERVICE_PATTERN.test(text) && CLIENT_ACQUISITION_PAIN_PATTERN.test(text)) return "Website service seller asking how to get clients.";
    if (/\b(outreach|no one replies)\b/i.test(text)) return "outreach not working";
    if (/\b(website clients?|web design clients?|sell websites?)\b/i.test(text)) return "web design client acquisition";
    if (/\b(seo clients?|sell seo|local seo clients?)\b/i.test(text)) return "SEO client acquisition";
    if (/\b(booking system clients?|social media management clients?|automation consultant.*clients?)\b/i.test(text)) return "service niche client acquisition";
    if (/\b(prospects?|local business leads|client acquisition|clients?)\b/i.test(text)) return "client acquisition";
    return "service-seller buyer intent";
  }

  function createReply(post) {
    const opening = post.text.length > 130 ? `${post.text.slice(0, 130)}...` : post.text;
    return `This looks like a useful MarketVibe buyer-intent item to review: "${opening}"\n\nMarketVibe stores researched opportunity inventory for service sellers without scraping private data or auto-contacting businesses: https://www.marketvibe1.com`;
  }

  function createContextualReply(post) {
    const text = clean(post.text || "");
    const pain = clean(post.painPoint || detectPainPoint(text));
    const variants = {
      "outreach not working": [
        "I would tighten the reason for reaching out before changing channels. Replies usually improve when the first message points to one specific visible problem instead of a broad service pitch.",
        "If outreach is not getting replies, I would check the targeting and opener first. A short note about one real issue you noticed usually lands better than a general offer.",
      ],
      "client acquisition": [
        "I would start by narrowing the buyer and the trigger. It is easier to find leads when you look for businesses showing one clear problem, like weak visibility, no clear CTA, or poor follow-up.",
        "This sounds like a positioning and prospecting issue before a tools issue. Pick one customer type, then look for visible signs they may need help.",
      ],
      "web design client acquisition": [
        "I would look for local businesses where the website problem is visible before pitching. Outdated design, unclear CTA, weak mobile layout, or missing trust signals gives you a specific opener.",
        "For web design clients, I would start with proof of a real website gap. A specific issue makes the conversation feel less random than a broad redesign pitch.",
      ],
      "SEO client acquisition": [
        "For SEO clients, I would look for visible local search gaps first: thin service pages, weak titles, missing location pages, or competitors clearly outranking them.",
        "I would avoid generic SEO outreach. Find one visible ranking or content gap, then use that as the reason to start the conversation.",
      ],
      "service niche client acquisition": [
        "I would narrow the niche and the trigger. Booking, automation, and social media services are easier to sell when the business already shows a visible operational gap.",
        "For niche services, build the list around businesses with a clear symptom first. The offer lands better when it connects to a real missing system or follow-up problem.",
      ],
    };
    const options = variants[pain] || [
      "I would start by finding the clearest visible problem, then build outreach or marketing around that. It keeps the conversation specific instead of sounding like a pitch.",
      "This is easier to solve when you narrow the audience and the trigger. Look for people already showing the problem you help with, then reply to that specific context.",
    ];
    return options[simpleHash(text || pain) % options.length];
  }

  function getRecentImports() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveRecentImport(post) {
    const nextPost = {
      text: post.text,
      score: post.score,
      url: post.url,
      sourceName: post.sourceName,
      author: post.author,
      dateText: post.dateText,
      importedAt: new Date().toISOString(),
    };
    const recent = getRecentImports().filter((item) => item.url !== nextPost.url && item.text !== nextPost.text);
    localStorage.setItem(CACHE_KEY, JSON.stringify([nextPost, ...recent].slice(0, MAX_RECENT_IMPORTS)));
    renderRecentImports();
  }
  function simpleHash(value) {
    const text = clean(value).toLowerCase();
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    }
    return String(Math.abs(hash));
  }

  function getHandledPosts() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HANDLED_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHandledPostKey(key) {
    if (!key) return;
    const handled = getHandledPosts().filter((item) => item !== key);
    localStorage.setItem(HANDLED_KEY, JSON.stringify([key, ...handled].slice(0, MAX_HANDLED_POSTS)));
  }

  function getPostKey(post) {
    const url = clean(post && post.url ? post.url : "");
    if (url && !isGenericFacebookUrl(url)) return `url:${url}`;
    return `text:${simpleHash(post && post.text ? post.text.slice(0, 500) : "")}`;
  }

  function getNodeKey(node, score) {
    return getPostKey(buildPostFromNode(node, score));
  }

  function isHandledPostKey(key) {
    return Boolean(key && getHandledPosts().includes(key));
  }

  function getVisibleCandidateNodes() {
    const selectors = [
      '[role="dialog"] [role="article"]',
      '[role="dialog"]',
      '[aria-modal="true"] [role="article"]',
      '[aria-modal="true"]',
      '[role="article"]',
      "div[aria-posinset]",
      "div[data-pagelet*='FeedUnit']",
      "div[data-pagelet*='SearchResults'] div[role='article']",
      "div[aria-describedby]",
      "article",
    ];
    const seen = new Set();
    return selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter((node) => {
        if (!(node instanceof HTMLElement)) return false;
        if (seen.has(node)) return false;
        seen.add(node);
        const box = node.getBoundingClientRect();
        const text = getPostText(node);
        return box.bottom >= -80 && box.top <= window.innerHeight + 700 && text.length >= 35;
      });
  }

  function markNodeHandled(node, score) {
    const key = getNodeKey(node, score);
    saveHandledPostKey(key);
    node.setAttribute("data-marketvibe-handled", "true");
    node.style.outline = "2px solid rgba(148,163,184,.55)";
    node.style.background = "rgba(148,163,184,.06)";
    node.querySelectorAll(":scope > .marketvibe-intent-badge, :scope > .marketvibe-card-actions").forEach((item) => item.remove());
  }

  function getQualifiedNodes(includeHandled = false) {
    const nodes = getVisibleCandidateNodes();
    const seen = new Set();
    const qualified = [];
    for (const node of nodes) {
      const text = getPostText(node);
      const score = scorePost(text, { commentCount: extractCommentCount(node) });
      if (score < 25) continue;
      const key = getNodeKey(node, score);
      if (!includeHandled && isHandledPostKey(key)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      qualified.push({ node, score, key, top: node.getBoundingClientRect().top });
    }
    return qualified;
  }

  function getCurrentQualifiedNode() {
    const qualified = getQualifiedNodes(false)
      .map((item) => ({ ...item, distance: Math.abs(item.node.getBoundingClientRect().top - window.innerHeight * 0.28) }))
      .sort((a, b) => a.distance - b.distance);
    return qualified[0] || null;
  }

  function scrollToQualifiedNode(item, message = "Moved to next MarketVibe match.") {
    if (!item || !item.node) {
      showStatus("No unhandled high-intent post found yet. Scroll a little or try another search.");
      return false;
    }
    item.node.scrollIntoView({ behavior: "smooth", block: "center" });
    item.node.style.boxShadow = "0 0 0 5px rgba(16,185,129,.28)";
    window.setTimeout(() => {
      item.node.style.boxShadow = "";
    }, 1800);
    showStatus(message);
    return true;
  }

  function moveToNextQualifiedPost(afterNode = null) {
    const qualified = getQualifiedNodes(false);
    if (!qualified.length) {
      window.scrollBy({ top: Math.round(window.innerHeight * 0.85), behavior: "smooth" });
      window.setTimeout(() => {
        markFeed();
        const next = getQualifiedNodes(false)[0];
        scrollToQualifiedNode(next, next ? "Found next MarketVibe match." : "No next match found on loaded posts.");
      }, 900);
      return;
    }

    if (!afterNode) {
      scrollToQualifiedNode(qualified[0]);
      return;
    }

    const afterTop = afterNode.getBoundingClientRect().top;
    const below = qualified.find((item) => item.node !== afterNode && item.node.getBoundingClientRect().top > afterTop + 20);
    scrollToQualifiedNode(below || qualified.find((item) => item.node !== afterNode) || qualified[0]);
  }

  function hasOpenFacebookModal() {
    return Boolean(document.querySelector('[role="dialog"], [aria-modal="true"]'));
  }

  function dispatchEscape() {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
  }

  function clickModalCloseButton() {
    const dialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
    if (!dialog) return false;
    const closeButton = Array.from(dialog.querySelectorAll('[aria-label], [role="button"], button'))
      .find((item) => {
        const label = clean(item.getAttribute("aria-label") || item.textContent || "");
        return /^(close|dismiss|back|done)$/i.test(label) || /\b(close|dismiss|back|done)\b/i.test(label);
      });
    if (closeButton instanceof HTMLElement) {
      closeButton.click();
      return true;
    }
    return false;
  }

  function forceCloseModalOrBack(reason = "recovery") {
    dispatchEscape();
    window.setTimeout(() => {
      if (hasOpenFacebookModal()) clickModalCloseButton();
    }, 500);
    window.setTimeout(() => {
      if (hasOpenFacebookModal()) {
        logLeadHunt("STUCK_RECOVERY", { action: "history.back", reason });
        history.back();
      }
    }, 3000);
  }

  function activeLeadHuntSignature() {
    const dialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
    const node = dialog || getCurrentQualifiedNode()?.node || document.body;
    return `${location.href}|${cleanLeadText(node.textContent || "", 220)}`;
  }

  function isFacebookLoadingScreen() {
    if (!/facebook\.com/i.test(location.hostname)) return false;
    const text = clean(document.body?.innerText || "").slice(0, 500);
    const articleCount = document.querySelectorAll('[role="article"], div[aria-posinset]').length;
    return articleCount === 0 && /\b(loading|please wait|temporarily unavailable|this content isn't available)\b/i.test(text);
  }

  function recoverCurrentLeadHuntItem(reason = "Skip current") {
    const state = getLeadHuntState();
    const current = getCurrentQualifiedNode();
    const key = current ? getNodeKey(current.node, current.score) : location.href;
    if (current) markNodeHandled(current.node, current.score);
    if (key) saveHandledPostKey(key);
    recordProcessedUrl(location.href, "skipped", { reason, query: currentLeadHuntSearch(state || {})?.query || "", score: current?.score || 0 });
    postLeadHuntEvent("STUCK_RECOVERY", { message: reason, reason, sourceUrl: location.href, score: current?.score || 0 });
    if (state) {
      saveLeadHuntState({
        ...state,
        skippedCount: Number(state.skippedCount || 0) + 1,
        status: `${reason}. Closing current post and continuing.`,
        lastProgressAt: Date.now(),
        nextActionAt: Date.now() + 1200,
      });
    }
    showStatus(`${reason}. Moving to the next result.`);
    forceCloseModalOrBack(reason);
    const timerId = window.setTimeout(() => {
      leadHuntTimeoutIds.delete(timerId);
      const latest = getLeadHuntState();
      if (!latest?.active) return;
      if (!latest.paused) ensureLeadHuntRunner("skip current recovery");
      moveToNextQualifiedPost(current?.node || null);
    }, 3600);
    leadHuntTimeoutIds.add(timerId);
  }

  function skipCurrentQualifiedPost() {
    recoverCurrentLeadHuntItem("Skip current");
  }

  function savedOverlayPosition(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "null");
      return parsed && Number.isFinite(parsed.left) && Number.isFinite(parsed.top) ? parsed : null;
    } catch {
      return null;
    }
  }

  function clampOverlayPosition(element, left, top) {
    const rect = element.getBoundingClientRect();
    return {
      left: Math.max(8, Math.min(left, window.innerWidth - rect.width - 8)),
      top: Math.max(8, Math.min(top, window.innerHeight - rect.height - 8)),
    };
  }

  function applyOverlayPosition(element, key, fallback = { left: 18, bottom: 92 }) {
    const saved = savedOverlayPosition(key);
    element.style.right = "auto";
    if (saved) {
      const position = clampOverlayPosition(element, saved.left, saved.top);
      element.style.left = `${position.left}px`;
      element.style.top = `${position.top}px`;
      element.style.bottom = "auto";
      return;
    }
    element.style.left = `${fallback.left}px`;
    element.style.top = "auto";
    element.style.bottom = `${fallback.bottom}px`;
  }

  function makeOverlayDraggable(element, handle, key) {
    if (element.dataset.marketvibeDraggable === "true") return;
    element.dataset.marketvibeDraggable = "true";
    handle.style.cursor = "move";
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      handle.setPointerCapture?.(event.pointerId);
      const onMove = (moveEvent) => {
        const position = clampOverlayPosition(element, moveEvent.clientX - offsetX, moveEvent.clientY - offsetY);
        element.style.left = `${position.left}px`;
        element.style.top = `${position.top}px`;
        element.style.right = "auto";
        element.style.bottom = "auto";
        localStorage.setItem(key, JSON.stringify(position));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    });
  }

  function renderQueueControls() {
    let panel = document.getElementById("marketvibe-queue-controls");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "marketvibe-queue-controls";
      panel.style.cssText = "position:fixed;left:18px;bottom:92px;z-index:2147483647;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-start;align-items:center;max-width:min(420px,calc(100vw - 32px));font:12px Arial,sans-serif;";
      const handle = document.createElement("button");
      handle.type = "button";
      handle.textContent = "Move";
      handle.title = "Drag Buyer Radar controls";
      handle.style.cssText = "border:1px solid rgba(148,163,184,.42);border-radius:999px;background:rgba(7,17,31,.88);color:#cbd5e1;font-weight:800;padding:9px 10px;box-shadow:0 10px 28px rgba(0,0,0,.28);cursor:move;";
      const next = document.createElement("button");
      next.type = "button";
      next.textContent = "Next match";
      next.style.cssText = "border:1px solid rgba(103,232,249,.55);border-radius:999px;background:#07111f;color:white;font-weight:800;padding:9px 11px;box-shadow:0 10px 28px rgba(0,0,0,.28);cursor:pointer;";
      next.addEventListener("click", () => moveToNextQualifiedPost());
      const skip = document.createElement("button");
      skip.type = "button";
      skip.textContent = "Skip current";
      skip.style.cssText = "border:1px solid rgba(251,191,36,.55);border-radius:999px;background:#07111f;color:white;font-weight:800;padding:9px 11px;box-shadow:0 10px 28px rgba(0,0,0,.28);cursor:pointer;";
      skip.addEventListener("click", skipCurrentQualifiedPost);
      panel.append(handle, next, skip);
      document.body.appendChild(panel);
      applyOverlayPosition(panel, "marketvibe_queue_controls_position", { left: 18, bottom: 92 });
      makeOverlayDraggable(panel, handle, "marketvibe_queue_controls_position");
    } else {
      applyOverlayPosition(panel, "marketvibe_queue_controls_position", { left: 18, bottom: 92 });
    }
  }

  function defaultLeadHuntConfig() {
    return {
      queries: LEAD_HUNT_PRESETS,
      sources: {
        facebook: true,
        google: true,
        bing: true,
      },
      caps: {
        maxSearches: 300,
        maxImportedLeads: 250,
        delayMs: 3000,
        confidenceThreshold: HIGH_INTENT_IMPORT_THRESHOLD,
      },
      outreach: {
        mode: OUTREACH_MODES[1],
        adapters: [],
      },
    };
  }

  function buildLeadHuntSearches(config) {
    const searches = [];
    const queries = Array.isArray(config.queries) && config.queries.length ? config.queries : LEAD_HUNT_PRESETS;
    const sources = config.sources || {};
    for (const query of queries) {
      const cleanedQuery = clean(query);
      if (!cleanedQuery) continue;
      if (sources.facebook !== false) {
        searches.push({
          source: "Facebook Search",
          query: cleanedQuery,
          url: `https://www.facebook.com/search/posts/?q=${encodeURIComponent(cleanedQuery)}`,
        });
      }
      if (sources.google !== false) {
        searches.push({
          source: "Google indexed Facebook results",
          query: cleanedQuery,
          url: `https://www.google.com/search?q=${encodeURIComponent(`site:facebook.com/groups ${cleanedQuery}`)}`,
        });
      }
      if (sources.bing !== false) {
        searches.push({
          source: "Bing indexed Facebook results",
          query: cleanedQuery,
          url: `https://www.bing.com/search?q=${encodeURIComponent(`site:facebook.com/groups ${cleanedQuery}`)}`,
        });
      }
    }
    return searches.slice(0, Math.max(1, Number(config.caps?.maxSearches || 10)));
  }

  function getLeadHuntState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LEAD_HUNT_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function saveLeadHuntState(nextState) {
    localStorage.setItem(LEAD_HUNT_KEY, JSON.stringify(nextState));
    renderLeadHuntPanel();
    syncLeadHuntStatus(nextState);
  }

  async function syncLeadHuntStatus(nextState) {
    const search = currentLeadHuntSearch(nextState);
    fetchWithTimeout(STATUS_API_URL, {
      method: "POST",
        headers: await internalHeaders(),
      body: JSON.stringify({
        runId: nextState.runId || "",
        active: Boolean(nextState.active),
        paused: Boolean(nextState.paused),
        query: search?.query || "Not started",
        source: search?.source || "Not started",
        currentUrl: location.href,
        currentItem: Number(nextState.currentSearchIndex || 0) + 1,
        totalQueued: Math.min((nextState.searches || []).length, Number(nextState.caps?.maxSearches || 10)),
        completed: Number(nextState.importedCount || 0) + Number(nextState.skippedCount || 0) + Number(nextState.ignoredLowConfidenceCount || 0) + Number(nextState.duplicateCount || 0) + Number(nextState.failedCount || 0),
        imported: Number(nextState.importedCount || 0),
        skipped: Number(nextState.skippedCount || 0),
        ignoredLowConfidence: Number(nextState.ignoredLowConfidenceCount || 0),
        duplicates: Number(nextState.duplicateCount || 0),
        failed: Number(nextState.failedCount || 0),
        status: nextState.status || "",
        lastError: Array.isArray(nextState.errors) ? nextState.errors[0] || "" : "",
        errors: Array.isArray(nextState.errors) ? nextState.errors.slice(0, 8) : [],
        updatedAt: new Date().toISOString(),
        extensionVersion: EXTENSION_VERSION,
      }),
    }).catch((error) => logLeadHunt("status sync failed", { message: error?.message || "unknown" }));
  }

  async function pollLeadHuntControl(reason = "poll") {
    if (extensionReloadRequired) return true;
    const state = getLeadHuntState();
    if (!state?.runId) return false;
    try {
      const response = await fetchWithTimeout(STATUS_API_URL, { headers: await internalHeaders({ "Content-Type": "application/json" }) }, 8000);
      if (!response.ok) return false;
      const remote = await response.json();
      if (!remote || remote.runId !== state.runId) return false;
      if (remote.active === false && state.active) {
        stopLeadHunt(remote.status || "Stopped from MarketVibe dashboard.", { sync: false });
        return true;
      }
      if (remote.paused && !state.paused) {
        pauseLeadHunt(remote.status || "Paused from MarketVibe dashboard.", { sync: false });
        return true;
      }
      if (/skip current requested/i.test(remote.status || "") && state.status !== remote.status) {
        saveLeadHuntState({ ...state, status: remote.status, nextActionAt: Date.now() + 250 });
        recoverCurrentLeadHuntItem("Skip current");
        return true;
      }
      if (remote.active && !remote.paused && state.paused) {
        resumeLeadHunt(remote.status || "Resumed from MarketVibe dashboard.", { sync: false });
        return true;
      }
      if (remote.active && !state.active) {
        saveLeadHuntState({ ...state, active: true, paused: false, status: remote.status || "Resuming from MarketVibe dashboard.", nextActionAt: Date.now() + 250 });
        ensureLeadHuntRunner(`dashboard resume:${reason}`);
        return true;
      }
    } catch (error) {
      logLeadHunt("control poll failed", { reason, message: error?.message || "unknown" });
    }
    return false;
  }

  function ensureLeadHuntControlPoller() {
    if (extensionReloadRequired) return;
    if (leadHuntControlPollId) return;
    leadHuntControlPollId = window.setInterval(() => {
      void pollLeadHuntControl("interval");
    }, CONTROL_POLL_MS);
  }

  function ensureLeadHuntRunner(reason = "runner ensure") {
    if (extensionReloadRequired) {
      showStatus("Extension reloaded. Please refresh the Facebook page.");
      return;
    }
    ensureLeadHuntControlPoller();
    if (!leadHuntIntervalId) {
      leadHuntIntervalId = window.setInterval(() => {
        void runLeadHuntTick("interval");
      }, SCAN_INTERVAL_MS);
      logLeadHunt("runner interval started", { reason });
    }
    scheduleLeadHuntAction(() => void runLeadHuntTick(reason), 250, reason);
    scheduleLeadHuntAction(() => void runLeadHuntTick(`${reason}:followup`), 1250, `${reason}:followup`);
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

  function stopLeadHunt(message = "Buyer Radar stopped.", options = {}) {
    const state = getLeadHuntState();
    clearLeadHuntTimers();
    stopLeadHuntControlPoller();
    if (state) {
      const stoppedState = { ...state, active: false, paused: false, currentLock: "", status: message, stoppedAt: Date.now(), nextActionAt: 0 };
      if (options.sync === false) {
        localStorage.setItem(LEAD_HUNT_KEY, JSON.stringify(stoppedState));
        renderLeadHuntPanel();
      } else {
        saveLeadHuntState(stoppedState);
      }
    }
    logLeadHunt("hunt completed", { message });
    postLeadHuntEvent("LEAD_HUNT_STOP", { message, sourceUrl: location.href });
    showStatus(message);
  }

  function leadHuntDelay(state) {
    const base = Math.max(1500, Number(state.caps?.delayMs || 3500));
    return base + Math.floor(Math.random() * 900);
  }

  function currentLeadHuntSearch(state) {
    return state.searches?.[state.currentSearchIndex || 0] || null;
  }

  function navigateWithDelay(url, state, reason) {
    const nextState = { ...state, status: reason, currentUrl: url, nextActionAt: Date.now() + leadHuntDelay(state) };
    saveLeadHuntState(nextState);
    logLeadHunt("next query/result scheduled", { reason, url, query: currentLeadHuntSearch(state)?.query });
    scheduleLeadHuntAction(async (latest) => {
      if (await pollLeadHuntControl("before navigation")) return;
      if (leadHuntIsRunnable(latest)) window.location.assign(withLeadHuntStateHash(url, latest));
    }, Math.max(300, nextState.nextActionAt - Date.now()), "navigate");
  }

  function startLeadHunt(config = defaultLeadHuntConfig()) {
    if (extensionReloadRequired) {
      showStatus("Extension reloaded. Please refresh the Facebook page.");
      renderLeadHuntPanel();
      return;
    }
    const searches = buildLeadHuntSearches(config);
    const state = {
      runId: config.runId || newRunId(),
      active: true,
      paused: false,
      currentSearchIndex: 0,
      currentResultIndex: 0,
      currentResultUrls: [],
      importedCount: 0,
      skippedCount: 0,
      ignoredLowConfidenceCount: 0,
      duplicateCount: 0,
      failedCount: 0,
      resultNumber: 0,
      caps: config.caps || defaultLeadHuntConfig().caps,
      outreach: config.outreach || defaultLeadHuntConfig().outreach,
      searches,
      seen: getHandledPosts(),
      errors: [],
      startedAt: Date.now(),
      currentUrl: location.href,
      scrollAttempts: 0,
      visitedUrls: [],
      lastProgressAt: Date.now(),
      lastActiveSignature: "",
      loadingSince: 0,
      loadingReloaded: false,
      importAuthStatus: "",
      status: "Buyer Radar starting.",
    };
    saveLeadHuntState(state);
    logLeadHunt("LEAD_HUNT_START", { searches: searches.length, caps: state.caps });
    postLeadHuntEvent("LEAD_HUNT_START", { message: "Buyer Radar started", metadata: { searches: searches.length, caps: state.caps, extensionVersion: EXTENSION_VERSION } });
    ensureLeadHuntRunner("hunt started");
    const first = currentLeadHuntSearch(state);
    if (first && location.href !== first.url) navigateWithDelay(first.url, { ...state, nextActionAt: Date.now() + 250 }, "Opening first buyer-intent search.");
  }

  function parseLeadHuntLaunch() {
    const stateMatch = location.hash.match(/marketvibeLeadHuntState=([^&]+)/);
    if (stateMatch) {
      try {
        const state = JSON.parse(decodeURIComponent(stateMatch[1]));
        history.replaceState(null, document.title, location.pathname + location.search);
        saveLeadHuntState({ ...state, nextActionAt: Date.now() + 250 });
        logLeadHunt("hunt state restored", { query: currentLeadHuntSearch(state)?.query, source: currentLeadHuntSearch(state)?.source });
        ensureLeadHuntRunner("state restored");
        return;
      } catch {
        showStatus("Buyer Radar state could not be restored on this page.");
      }
    }

    const match = location.hash.match(/marketvibeLeadHunt=([^&]+)/);
    if (!match) return;
    try {
      const config = JSON.parse(decodeURIComponent(match[1]));
      history.replaceState(null, document.title, location.pathname + location.search);
      startLeadHunt(config);
    } catch {
      showStatus("Buyer Radar launch settings could not be read.");
    }
  }

  function pauseLeadHunt(message = "Paused. Resume when ready.", options = {}) {
    const state = getLeadHuntState();
    if (state) {
      clearLeadHuntTimers();
      const pausedState = { ...state, active: true, paused: true, status: message, nextActionAt: Date.now() + 3600000 };
      if (options.sync === false) {
        localStorage.setItem(LEAD_HUNT_KEY, JSON.stringify(pausedState));
        renderLeadHuntPanel();
      } else {
        saveLeadHuntState(pausedState);
      }
      postLeadHuntEvent("LEAD_HUNT_PAUSE", { message: "Buyer Radar paused", sourceUrl: location.href });
      ensureLeadHuntControlPoller();
      showStatus("Paused. No new browser actions will start.");
    }
  }

  function resumeLeadHunt(message = "Resuming Buyer Radar.", options = {}) {
    if (extensionReloadRequired) {
      showStatus("Extension reloaded. Please refresh the Facebook page.");
      renderLeadHuntPanel();
      return;
    }
    const state = getLeadHuntState();
    if (state) {
      const resumedState = { ...state, active: true, paused: false, currentLock: "", importAuthStatus: /key connected|internal api key/i.test(message) ? "Connected" : state.importAuthStatus || "", status: message, nextActionAt: Date.now() + 250 };
      if (options.sync === false) {
        localStorage.setItem(LEAD_HUNT_KEY, JSON.stringify(resumedState));
        renderLeadHuntPanel();
      } else {
        saveLeadHuntState(resumedState);
      }
      logLeadHunt("hunt resumed");
      postLeadHuntEvent("LEAD_HUNT_RESUME", { message: "Buyer Radar resumed", sourceUrl: location.href });
      ensureLeadHuntRunner("resume");
    }
  }

  function nextLeadHuntSearch(state, reason) {
    const nextIndex = (state.currentSearchIndex || 0) + 1;
    if (nextIndex >= (state.searches || []).length || nextIndex >= Number(state.caps?.maxSearches || 10)) {
      stopLeadHunt(`Buyer Radar complete. Imported ${state.importedCount || 0} buyer-intent item(s).`);
      return;
    }
    const nextState = {
      ...state,
      currentSearchIndex: nextIndex,
      currentResultIndex: 0,
      currentResultUrls: [],
      resultNumber: 0,
      scrollAttempts: 0,
      visitedUrls: [],
      status: reason,
    };
    const search = currentLeadHuntSearch(nextState);
    if (search) {
      logLeadHunt("LEAD_HUNT_NEXT_QUERY", { query: search.query, source: search.source, index: nextIndex });
      navigateWithDelay(search.url, nextState, `Opening next search: ${search.query}`);
    }
  }

  function collectIndexedFacebookResultUrls() {
    const urls = Array.from(document.querySelectorAll("a[href]"))
      .map((link) => {
        try {
          const raw = link.getAttribute("href") || "";
          const parsed = new URL(raw, location.origin);
          const redirected = parsed.searchParams.get("q") || parsed.searchParams.get("url") || raw;
          return normalizeFacebookUrl(redirected);
        } catch {
          return "";
        }
      })
      .filter((url) => /https:\/\/(www\.)?facebook\.com\//i.test(url))
      .filter((url) => !/\/login|\/share|\/plugins|\/privacy|\/help/i.test(url));
    return Array.from(new Set(urls)).slice(0, 12);
  }

  function scanVisibleLeadHuntCards(state, search) {
    const decisions = {
      importItems: [],
      skipped: 0,
      ignoredLowConfidence: 0,
      duplicates: 0,
      scanned: 0,
    };
    const seenThisTick = new Set();

    for (const node of getVisibleCandidateNodes()) {
      if (node.getAttribute("data-marketvibe-auto-importing") === "true") continue;
      const text = getPostText(node);
      const commentCount = extractCommentCount(node);
      const score = scorePost(text, { commentCount });
      const matchReason = detectMatchReason(text, score, { commentCount });
      const post = buildPostFromNode(node, score, { queryUsed: search?.query || "", sourceUsed: search?.source || "", outreachMode: state.outreach?.mode || "draft-only", commentCount, matchReason });
      const key = getPostKey(post);
      if (!key || seenThisTick.has(key)) continue;
      seenThisTick.add(key);
      decisions.scanned += 1;

      if (isHandledPostKey(key) || (state.seen || []).includes(key)) {
        decisions.duplicates += 1;
        recordProcessedUrl(post.url || key, "duplicate", { reason: "duplicate", query: search?.query || "", score });
        logLeadHunt("LEAD_HUNT_SKIP", { reason: "duplicate", score, key });
        continue;
      }

      if (score >= confidenceThreshold(state)) {
        decisions.importItems.push({ node, score, post, key });
        logLeadHunt("score decision", { decision: "import", score, threshold: confidenceThreshold(state), reason: matchReason, text: text.slice(0, 80) });
        continue;
      }

      decisions.skipped += 1;
      decisions.ignoredLowConfidence += 1;
      saveHandledPostKey(key);
      recordProcessedUrl(post.url || key, "skipped", { reason: `ignored low-confidence below ${confidenceThreshold(state)}: ${matchReason}`, query: search?.query || "", score });
      postLeadHuntEvent("LEAD_HUNT_SKIP", { message: `Ignored low-confidence (${score}/${confidenceThreshold(state)})`, reason: matchReason, sourceUrl: post.url || key, query: search?.query || "", score });
      logLeadHunt("LEAD_HUNT_SKIP", { reason: "ignored-low-confidence", score, threshold: confidenceThreshold(state), matchReason, text: text.slice(0, 80) });
    }

    return decisions;
  }

  function scrollAndRescan(state, message) {
    if (!leadHuntIsRunnable(state)) return false;
    const attempts = Number(state.scrollAttempts || 0) + 1;
    if (attempts > MAX_SCROLL_ATTEMPTS) return false;
    window.scrollBy({ top: Math.round(window.innerHeight * 0.9), behavior: "smooth" });
    logLeadHunt("next match", { action: "auto-scroll", attempts, message });
    saveLeadHuntState({
      ...state,
      scrollAttempts: attempts,
      status: `${message} Scrolling visible results (${attempts}/${MAX_SCROLL_ATTEMPTS}).`,
      lastProgressAt: Date.now(),
      nextActionAt: Date.now() + leadHuntDelay(state),
    });
    return true;
  }

  function closeOpenFacebookModal() {
    const dialog = document.querySelector('[role="dialog"], [aria-modal="true"]');
    if (!dialog) return false;
    const closeButton = Array.from(dialog.querySelectorAll('[aria-label], [role="button"], button'))
      .find((item) => {
        const label = clean(item.getAttribute("aria-label") || item.textContent || "");
        return /^(close|dismiss|back)$/i.test(label) || /\b(close|dismiss)\b/i.test(label);
      });
    if (closeButton instanceof HTMLElement) {
      closeButton.click();
      logLeadHunt("next match", { action: "close-modal-after-import" });
      return true;
    }
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    logLeadHunt("next match", { action: "escape-modal-after-import" });
    return true;
  }

  async function autoImportLeadHuntNode(node, score, reason = "highlighted-modal") {
    const state = getLeadHuntState();
    if (!state?.active || state.paused || score < confidenceThreshold(state)) return false;
    if (await pollLeadHuntControl("before auto import")) return false;
    const search = currentLeadHuntSearch(state);
    const commentCount = extractCommentCount(node);
    const matchReason = detectMatchReason(getPostText(node), score, { commentCount });
    const post = buildPostFromNode(node, score, { queryUsed: search?.query || "", sourceUsed: search?.source || "", outreachMode: state.outreach?.mode || "draft-only", commentCount, matchReason });
    const key = getPostKey(post);
    if (!key || isHandledPostKey(key) || (state.seen || []).includes(key) || node.getAttribute("data-marketvibe-auto-importing") === "true") return false;
    if (state.currentLock && state.currentLock !== key) return false;
    saveLeadHuntState({ ...state, currentLock: key, status: `Saving high-confidence buyer item. ${matchReason}` });

    node.setAttribute("data-marketvibe-auto-importing", "true");
    try {
      const data = await sendPosts([post], search?.query || "");
      const latest = getLeadHuntState();
      if (!latest?.active || latest.paused) {
        recordProcessedUrl(post.url || key, "imported", { reason: "import-finished-after-cancel", query: search?.query || "", score });
        showStatus("Import finished, but run is paused or stopped. No continuation started.");
        return true;
      }
      saveRecentImport(post);
      saveHandledPostKey(key);
      recordProcessedUrl(post.url || key, "imported", { reason, query: search?.query || "", score });
      markNodeHandled(node, score);

      const importedCount = Number(latest.importedCount || 0) + 1;
      const seen = Array.from(new Set([...(latest.seen || []), key]));
      const continuationDelay = leadHuntDelay(latest);
      saveLeadHuntState({
        ...latest,
        importedCount,
        seen,
        currentLock: "",
        scrollAttempts: 0,
        importedLeads: [post, ...(state.importedLeads || [])].slice(0, 30),
        status: `Auto-imported high-intent buyer item. Good: ${data.counts?.good || 0}. Continuing Buyer Radar.`,
        lastProgressAt: Date.now(),
        lastActiveSignature: "",
        nextActionAt: Date.now() + continuationDelay,
      });
      postLeadHuntEvent("LEAD_HUNT_IMPORT", { message: `Imported buyer item (${score}/${confidenceThreshold(latest)})`, reason: matchReason, sourceUrl: post.url || key, query: search?.query || "", score });
      logLeadHunt("LEAD_HUNT_IMPORT", { count: 1, importedCount, query: search?.query || "", reason, matchReason });
      if (importedCount >= Number(latest.caps?.maxImportedLeads || 10)) {
        stopLeadHunt(`Daily import cap reached. Imported ${importedCount} buyer-intent item(s).`);
      } else {
        closeOpenFacebookModal();
        scheduleLeadHuntAction(() => ensureLeadHuntRunner("post-import continuation"), continuationDelay + 150, "post-import continuation");
      }
      return true;
    } catch (error) {
      if (handleExtensionContextInvalidated(error, "auto import")) return false;
      if (await handleImportAuthError(error, state)) return false;
      const failedCount = Number(state.failedCount || 0) + 1;
      saveLeadHuntState({
        ...state,
        failedCount,
        errors: [`${new Date().toLocaleTimeString()} ${error && error.message ? error.message : "Auto-import failed"}`, ...(state.errors || [])].slice(0, 8),
        currentLock: "",
        status: "Auto-import failed. Continuing Buyer Radar.",
        lastProgressAt: Date.now(),
        nextActionAt: Date.now() + leadHuntDelay(state),
      });
      logLeadHunt("auto import failed", { message: error?.message || "unknown", score });
      return false;
    } finally {
      const latest = getLeadHuntState();
      if (latest?.currentLock === key) saveLeadHuntState({ ...latest, currentLock: "" });
      node.removeAttribute("data-marketvibe-auto-importing");
    }
  }

  function advanceAfterFacebookPage(state, reason) {
    const urls = state.currentResultUrls || [];
    const nextResultIndex = Number(state.currentResultIndex || 0) + 1;
    if (urls[nextResultIndex]) {
      navigateWithDelay(urls[nextResultIndex], {
        ...state,
        currentResultIndex: nextResultIndex,
        resultNumber: nextResultIndex + 1,
        scrollAttempts: 0,
        skippedCount: (state.skippedCount || 0) + 1,
        ignoredLowConfidenceCount: Number(state.ignoredLowConfidenceCount || 0),
        visitedUrls: Array.from(new Set([...(state.visitedUrls || []), location.href])).slice(-50),
        lastProgressAt: Date.now(),
      }, `${reason} Opening result ${nextResultIndex + 1}.`);
      return;
    }
    nextLeadHuntSearch({
      ...state,
      scrollAttempts: 0,
      skippedCount: (state.skippedCount || 0) + 1,
      ignoredLowConfidenceCount: Number(state.ignoredLowConfidenceCount || 0),
      visitedUrls: Array.from(new Set([...(state.visitedUrls || []), location.href])).slice(-50),
      lastProgressAt: Date.now(),
    }, reason);
  }

  async function runLeadHuntTick(trigger = "manual") {
    if (extensionReloadRequired) return;
    if (leadHuntTickRunning) return;
    const state = getLeadHuntState();
    if (!state?.active || state.paused) return;
    if (Date.now() < Number(state.nextActionAt || 0)) return;
    if (await pollLeadHuntControl(`before tick:${trigger}`)) return;
    leadHuntTickRunning = true;

    const search = currentLeadHuntSearch(state);
    try {
      logLeadHunt("LEAD_HUNT_SCAN_TICK", {
        trigger,
        href: location.href,
        searchIndex: state.currentSearchIndex || 0,
        resultIndex: state.currentResultIndex || 0,
        imported: state.importedCount || 0,
      });
      postLeadHuntEvent("LEAD_HUNT_SCAN_TICK", { message: "Scan tick", sourceUrl: location.href, query: search?.query || "", metadata: { trigger } });

      if (!search) {
        stopLeadHunt("Buyer Radar complete. No searches left.");
        return;
      }
      if (Number(state.importedCount || 0) >= Number(state.caps?.maxImportedLeads || 10)) {
        stopLeadHunt(`Daily import cap reached. Imported ${state.importedCount} buyer-intent item(s).`);
        return;
      }

      if (isFacebookLoadingScreen()) {
        const loadingSince = Number(state.loadingSince || Date.now());
        const loadingState = { ...state, loadingSince, status: "Facebook is still loading. Watchdog is active.", nextActionAt: Date.now() + 2500 };
        if (Date.now() - loadingSince > LOADING_RECOVERY_MS) {
          if (!state.loadingReloaded) {
            saveLeadHuntState({ ...loadingState, loadingReloaded: true, status: "Facebook loading watchdog reloading once." });
            logLeadHunt("STUCK_RECOVERY", { reason: "loading watchdog reload" });
            postLeadHuntEvent("STUCK_RECOVERY", { message: "Loading watchdog reload", reason: "loading-timeout", sourceUrl: location.href });
            if (await pollLeadHuntControl("before loading reload")) return;
            location.reload();
            return;
          }
          nextLeadHuntSearch({ ...state, failedCount: Number(state.failedCount || 0) + 1, loadingSince: 0, loadingReloaded: false }, "Facebook loading watchdog skipped a stuck page.");
          return;
        }
        saveLeadHuntState(loadingState);
        return;
      }

      const signature = activeLeadHuntSignature();
      if (signature !== state.lastActiveSignature) {
        saveLeadHuntState({ ...state, lastActiveSignature: signature, lastProgressAt: Date.now(), loadingSince: 0, loadingReloaded: false });
      } else if (Date.now() - Number(state.lastProgressAt || state.startedAt || Date.now()) > STUCK_RECOVERY_MS) {
        logLeadHunt("STUCK_RECOVERY", { reason: "same modal/url for 60 seconds", href: location.href });
        recoverCurrentLeadHuntItem("Stuck watchdog recovered current post");
        return;
      }

      if (/google\.com|bing\.com/i.test(location.hostname)) {
        const visited = new Set([...(state.visitedUrls || []), ...(state.currentResultUrls || []).slice(0, Number(state.currentResultIndex || 0) + 1)].map((url) => normalizeFacebookUrl(url)));
        const resultUrls = collectIndexedFacebookResultUrls().filter((url) => !visited.has(normalizeFacebookUrl(url)));
        logLeadHunt("score decision", { source: search.source, resultUrls: resultUrls.length });
        if (!resultUrls.length) {
          if (scrollAndRescan(state, "No indexed Facebook results found yet.")) return;
          nextLeadHuntSearch({ ...state, skippedCount: (state.skippedCount || 0) + 1 }, "No indexed Facebook results found.");
          return;
        }
        const nextState = { ...state, currentResultUrls: resultUrls, currentResultIndex: 0, resultNumber: 1, scrollAttempts: 0, visitedUrls: Array.from(new Set([...(state.visitedUrls || []), location.href])).slice(-75) };
        navigateWithDelay(resultUrls[0], nextState, `Opening indexed Facebook result 1 of ${resultUrls.length}.`);
        return;
      }

      if (/facebook\.com/i.test(location.hostname)) {
        markFeed();
        const decisions = scanVisibleLeadHuntCards(state, search);
        const duplicateCount = Number(state.duplicateCount || 0) + decisions.duplicates;
        const skippedCount = Number(state.skippedCount || 0) + decisions.skipped;
        const ignoredLowConfidenceCount = Number(state.ignoredLowConfidenceCount || 0) + decisions.ignoredLowConfidence;
        logLeadHunt("score decision", { source: search.source, query: search.query, scanned: decisions.scanned, matches: decisions.importItems.length, skipped: decisions.skipped, ignoredLowConfidence: decisions.ignoredLowConfidence, duplicateCount, threshold: confidenceThreshold(state) });
        if (decisions.importItems.length) {
          if (state.currentLock) return;
          const sentPosts = decisions.importItems.map(({ post }) => post);
          const batchLock = `batch:${sentPosts.map(getPostKey).join("|").slice(0, 180)}`;
          saveLeadHuntState({ ...state, currentLock: batchLock, status: `Saving ${sentPosts.length} high-intent buyer item(s).` });
          const data = await sendPosts(sentPosts, search.query);
          const latest = getLeadHuntState();
          if (!latest?.active || latest.paused) {
            sentPosts.forEach((post) => recordProcessedUrl(post.url || getPostKey(post), "imported", { reason: "batch-import-finished-after-cancel", query: search.query, score: post.score || 0 }));
            if (latest?.currentLock === batchLock) saveLeadHuntState({ ...latest, currentLock: "" });
            showStatus("Import finished, but run is paused or stopped. No continuation started.");
            return;
          }
          decisions.importItems.forEach(({ node, score, post }) => {
            saveRecentImport(post);
            saveHandledPostKey(getPostKey(post));
            recordProcessedUrl(post.url || getPostKey(post), "imported", { reason: "auto-import", query: search.query, score });
            markNodeHandled(node, score);
          });
          const importedCount = Number(latest.importedCount || 0) + sentPosts.length;
          const seen = Array.from(new Set([...(latest.seen || []), ...sentPosts.map(getPostKey)]));
          const continuationDelay = leadHuntDelay(latest);
          const nextState = {
            ...latest,
            importedCount,
            duplicateCount,
            skippedCount,
            ignoredLowConfidenceCount,
            seen,
            currentLock: "",
            scrollAttempts: 0,
            importedLeads: [...sentPosts, ...(state.importedLeads || [])].slice(0, 30),
            status: `Imported ${sentPosts.length} high-intent buyer item(s). Good: ${data.counts?.good || 0}. Continuing Buyer Radar.`,
            lastProgressAt: Date.now(),
            lastActiveSignature: "",
            nextActionAt: Date.now() + continuationDelay,
          };
          saveLeadHuntState(nextState);
          logLeadHunt("LEAD_HUNT_IMPORT", { count: sentPosts.length, importedCount, query: search.query });
          if (importedCount >= Number(latest.caps?.maxImportedLeads || 10)) {
            stopLeadHunt(`Daily import cap reached. Imported ${importedCount} buyer-intent item(s).`);
          } else {
            closeOpenFacebookModal();
            scheduleLeadHuntAction(() => ensureLeadHuntRunner("post-import continuation"), continuationDelay + 150, "post-import continuation");
          }
          return;
        }

        const stateWithDuplicates = { ...state, duplicateCount, skippedCount, ignoredLowConfidenceCount };
        if (scrollAndRescan(stateWithDuplicates, "No high-intent match on loaded posts yet.")) return;
        logLeadHunt("next match", { reason: "no match after scroll attempts" });
        advanceAfterFacebookPage(stateWithDuplicates, "No high-intent match after scanning visible page.");
      }
    } catch (error) {
      if (handleExtensionContextInvalidated(error, `scan tick:${trigger}`)) return;
      if (await handleImportAuthError(error, state)) return;
      const failedCount = Number(state.failedCount || 0) + 1;
      const failedState = {
        ...state,
        errors: [`${new Date().toLocaleTimeString()} ${error && error.message ? error.message : "Unknown Buyer Radar error"}`, ...(state.errors || [])].slice(0, 8),
        failedCount,
        currentLock: "",
        status: "Recovered from a blocked, blank, or unavailable page.",
        nextActionAt: Date.now() + leadHuntDelay(state),
      };
      if (failedCount >= 3) {
        advanceAfterFacebookPage(failedState, "Repeated failures on this page.");
        return;
      }
      saveLeadHuntState(failedState);
    } finally {
      leadHuntTickRunning = false;
    }
  }

  function renderLeadHuntPanel() {
    let panel = document.getElementById("marketvibe-lead-hunt-panel");
    const state = getLeadHuntState();
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "marketvibe-lead-hunt-panel";
      panel.style.cssText = "position:fixed;left:16px;top:76px;z-index:2147483647;width:min(360px,calc(100vw - 32px));border-radius:16px;background:#07111f;color:white;border:1px solid rgba(16,185,129,.45);box-shadow:0 16px 42px rgba(0,0,0,.34);padding:12px;font:12px Arial,sans-serif;";
      document.body.appendChild(panel);
    }
    const search = state ? currentLeadHuntSearch(state) : null;
    const statusText = state?.status || "";
    const runLabel = state?.extensionReloadRequired || extensionReloadRequired
      ? "Extension Reload Required"
      : state?.paused
        ? "Paused"
        : state?.active && /recover/i.test(statusText)
          ? "Recovering"
          : state?.active
            ? "Running"
            : /complete|cap reached/i.test(statusText)
              ? "Scan Complete"
              : state
                ? "Stopped"
                : "Ready";
    const runtimeEnd = state?.active && !state?.extensionReloadRequired && !extensionReloadRequired ? Date.now() : Number(state?.stoppedAt || Date.now());
    const runtimeSeconds = state?.startedAt ? Math.max(0, Math.round((runtimeEnd - state.startedAt) / 1000)) : 0;
    const badgeColor = runLabel === "Extension Reload Required"
      ? "rgba(251,113,133,.22)"
      : runLabel === "Paused"
        ? "rgba(103,232,249,.18)"
        : runLabel === "Recovering"
          ? "rgba(251,191,36,.20)"
          : runLabel === "Running"
            ? "rgba(16,185,129,.18)"
            : "rgba(148,163,184,.18)";
    panel.innerHTML = `
      <div style="font-weight:900;color:#a7f3d0;margin-bottom:6px;">MarketVibe Buyer Radar</div>
      <div style="display:inline-block;border-radius:999px;background:${badgeColor};color:white;padding:4px 8px;font-weight:900;margin-bottom:8px;">${runLabel}</div>
      <div style="line-height:1.45;color:#e5eef9;margin-bottom:8px;">${state?.status || "Ready. Internal buyer discovery only. No auto-DM or auto-comment."}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;color:#cbd5e1;">
        <div>Query: ${search?.query || "not started"}</div>
        <div>Source: ${search?.source || "none"}</div>
        <div>Current URL: ${clean(state?.currentUrl || location.href).slice(0, 72)}</div>
        <div>Runtime: ${runtimeSeconds}s</div>
        <div>Current item: ${Number(state?.currentSearchIndex || 0) + (state ? 1 : 0)} / ${Math.min((state?.searches || []).length || 0, Number(state?.caps?.maxSearches || 10))}</div>
        <div>Completed: ${Number(state?.importedCount || 0) + Number(state?.skippedCount || 0) + Number(state?.ignoredLowConfidenceCount || 0) + Number(state?.duplicateCount || 0) + Number(state?.failedCount || 0)}</div>
        <div>Buyer items: ${state?.importedCount || 0}</div>
        <div>Skipped: ${state?.skippedCount || 0}</div>
        <div>Ignored low-confidence: ${state?.ignoredLowConfidenceCount || 0}</div>
        <div>Min confidence: ${confidenceThreshold(state)}</div>
        <div>Import auth: ${state?.importAuthStatus || "Not checked"}</div>
        <div>Duplicates: ${state?.duplicateCount || 0}</div>
        <div>Failed: ${state?.failedCount || 0}</div>
      </div>
    `;
    if (state?.errors?.length) {
      const errors = document.createElement("div");
      errors.style.cssText = "border-top:1px solid rgba(255,255,255,.12);padding-top:7px;margin-bottom:8px;color:#fecaca;line-height:1.35;";
      errors.textContent = `Errors: ${state.errors.slice(0, 2).join(" | ")}`;
      panel.appendChild(errors);
    }
    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;gap:7px;flex-wrap:wrap;";
    const start = document.createElement("button");
    start.type = "button";
    start.textContent = "Start Buyer Radar";
    start.style.cssText = "border:0;border-radius:999px;background:#10b981;color:#03131f;font-weight:900;padding:8px 10px;cursor:pointer;";
    start.addEventListener("click", () => startLeadHunt(defaultLeadHuntConfig()));
    const pause = document.createElement("button");
    pause.type = "button";
    pause.textContent = state?.paused ? "Resume" : "Pause";
    pause.style.cssText = "border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.08);color:white;font-weight:800;padding:8px 10px;cursor:pointer;";
    pause.addEventListener("click", () => state?.paused ? resumeLeadHunt() : pauseLeadHunt());
    const stop = document.createElement("button");
    stop.type = "button";
    stop.textContent = "Stop";
    stop.style.cssText = "border:1px solid rgba(251,113,133,.55);border-radius:999px;background:rgba(255,255,255,.08);color:white;font-weight:800;padding:8px 10px;cursor:pointer;";
    stop.addEventListener("click", () => stopLeadHunt());
    const skip = document.createElement("button");
    skip.type = "button";
    skip.textContent = "Skip current";
    skip.style.cssText = "border:1px solid rgba(251,191,36,.55);border-radius:999px;background:rgba(255,255,255,.08);color:white;font-weight:800;padding:8px 10px;cursor:pointer;";
    skip.addEventListener("click", () => recoverCurrentLeadHuntItem("Skip current"));
    controls.append(start, pause, skip, stop);
    panel.appendChild(controls);
  }


  async function copyReply(post) {
    await navigator.clipboard.writeText(createReply(post));
    showStatus("MarketVibe reply copied.");
  }

  function renderRecentImports() {
    let panel = document.getElementById("marketvibe-recent-imports");
    const recent = getRecentImports().slice(0, 3);

    if (!recent.length) {
      if (panel) panel.remove();
      return;
    }

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "marketvibe-recent-imports";
      panel.style.cssText = "position:fixed;left:16px;bottom:150px;z-index:2147483647;width:min(360px,calc(100vw - 32px));border-radius:16px;background:#07111f;color:white;border:1px solid rgba(103,232,249,.35);box-shadow:0 16px 42px rgba(0,0,0,.38);padding:12px;font:12px Arial,sans-serif;";
      document.body.appendChild(panel);
    }

    panel.innerHTML = `<div style="font-weight:800;margin-bottom:8px;color:#a7f3d0;">Recent MarketVibe imports</div>`;
    for (const post of recent) {
      const row = document.createElement("div");
      row.style.cssText = "border-top:1px solid rgba(255,255,255,.1);padding-top:8px;margin-top:8px;";
      const title = document.createElement("div");
      title.textContent = `Group: ${post.sourceName || "Facebook source"} · Author: ${post.author || "Unknown"} · Post: ${cleanLeadText(post.text || "", 140) || "Facebook post imported"} · Score: ${post.score || 0}`;
      title.style.cssText = "line-height:1.35;color:#e5eef9;margin-bottom:7px;";
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:7px;flex-wrap:wrap;";
      const open = document.createElement("a");
      open.textContent = "Open";
      open.href = post.url || "https://www.facebook.com";
      open.target = "_blank";
      open.rel = "noreferrer";
      open.style.cssText = "border-radius:999px;background:#10b981;color:#03131f;text-decoration:none;font-weight:800;padding:6px 9px;";
      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copy reply";
      copy.style.cssText = "border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.08);color:white;font-weight:800;padding:6px 9px;cursor:pointer;";
      copy.addEventListener("click", () => void copyReply(post));
      actions.append(open, copy);
      row.append(title, actions);
      panel.appendChild(row);
    }
  }

  function cleanupScanUi() {
    document.querySelectorAll(".marketvibe-scan-overlay, #marketvibe-scan-overlay").forEach((item) => item.remove());
  }

  function showScanStatus(message) {
    cleanupScanUi();
    let badge = document.getElementById("marketvibe-scan-status");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "marketvibe-scan-status";
      badge.style.cssText = "position:fixed;right:16px;top:76px;z-index:2147483647;max-width:min(340px,calc(100vw - 32px));border-radius:999px;background:#07111f;color:white;border:1px solid rgba(16,185,129,.45);box-shadow:0 12px 32px rgba(0,0,0,.28);padding:9px 12px;font:700 12px Arial,sans-serif;pointer-events:none;";
      document.body.appendChild(badge);
    }
    badge.textContent = message;
    window.clearTimeout(showScanStatus.hideTimer);
    showScanStatus.hideTimer = window.setTimeout(() => {
      badge.remove();
    }, 3500);
  }

  showScanStatus.hideTimer = 0;

  function injectSingleImportButton(node, score) {
    if (node.querySelector(":scope > .marketvibe-card-actions")) return;

    const actions = document.createElement("div");
    actions.className = "marketvibe-card-actions";
    actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px;padding:8px;border-radius:12px;background:rgba(7,17,31,.92);border:1px solid rgba(16,185,129,.45);";
    const sendButton = document.createElement("button");
    sendButton.type = "button";
    sendButton.textContent = "Send this post to MarketVibe";
    sendButton.style.cssText = "border:0;border-radius:999px;background:linear-gradient(90deg,#10b981,#67e8f9);color:#03131f;font:800 12px Arial,sans-serif;padding:8px 11px;cursor:pointer;";
    sendButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void sendSinglePost(node, score, sendButton);
    });
    const sendNextButton = document.createElement("button");
    sendNextButton.type = "button";
    sendNextButton.textContent = "Send + next";
    sendNextButton.style.cssText = "border:1px solid rgba(103,232,249,.55);border-radius:999px;background:#07111f;color:white;font:800 12px Arial,sans-serif;padding:8px 11px;cursor:pointer;";
    sendNextButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const sent = await sendSinglePost(node, score, sendNextButton);
      if (sent) {
        window.setTimeout(() => moveToNextQualifiedPost(node), 350);
      }
    });

    const skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.textContent = "Skip";
    skipButton.style.cssText = "border:1px solid rgba(251,191,36,.55);border-radius:999px;background:rgba(255,255,255,.08);color:white;font:800 12px Arial,sans-serif;padding:8px 11px;cursor:pointer;";
    skipButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      recoverCurrentLeadHuntItem("Skip current");
    });

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.textContent = "Next match";
    nextButton.style.cssText = "border:1px solid rgba(103,232,249,.55);border-radius:999px;background:rgba(255,255,255,.08);color:white;font:800 12px Arial,sans-serif;padding:8px 11px;cursor:pointer;";
    nextButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      moveToNextQualifiedPost(node);
    });

    actions.append(sendButton, sendNextButton, skipButton, nextButton);
    node.prepend(actions);
  }

  function markFeed() {
    let highlighted = 0;
    const cleanupTimer = window.setTimeout(cleanupScanUi, SCAN_CLEANUP_MS);

    try {
      cleanupScanUi();
      const nodes = getVisibleCandidateNodes();
      for (const node of nodes) {
        const text = getPostText(node);
        const score = scorePost(text, { commentCount: extractCommentCount(node) });
        node.style.opacity = "";
        node.style.filter = "";

        const key = score >= 25 ? getNodeKey(node, score) : "";
        const handled = key ? isHandledPostKey(key) : false;

        if (score >= 25 && !handled) {
          highlighted += 1;
          node.removeAttribute("data-marketvibe-handled");
          node.style.outline = "3px solid #10b981";
          node.style.background = "rgba(16,185,129,0.06)";
          if (!node.querySelector(":scope > .marketvibe-intent-badge")) {
            const badge = document.createElement("div");
            badge.className = "marketvibe-intent-badge";
            badge.textContent = `MarketVibe Buyer Intent ${score}`;
            badge.style.cssText = "position:sticky;top:0;z-index:9999;background:#10b981;color:#041018;font:700 12px Arial;padding:6px 10px;border-radius:8px;margin:6px;display:inline-block;";
            node.prepend(badge);
          }
          injectSingleImportButton(node, score);
          if (score >= confidenceThreshold() && getLeadHuntState()?.active) {
            void autoImportLeadHuntNode(node, score, "buyer-intent-badge");
          }
        } else {
          if (score >= 25 && handled) {
            node.setAttribute("data-marketvibe-handled", "true");
            node.style.outline = "2px solid rgba(148,163,184,.45)";
            node.style.background = "rgba(148,163,184,.05)";
          } else {
            node.style.outline = "";
            node.style.background = "";
          }
          node.querySelectorAll(":scope > .marketvibe-intent-badge, :scope > .marketvibe-card-actions").forEach((item) => item.remove());
        }
      }

      showScanStatus(highlighted ? `${highlighted} high-intent post${highlighted === 1 ? "" : "s"} found on visible page` : "No high-intent posts found on visible page");
    } catch (error) {
      showScanStatus(`MarketVibe scan failed: ${error && error.message ? error.message : "unknown error"}`);
    } finally {
      window.clearTimeout(cleanupTimer);
      cleanupScanUi();
    }
  }

  function collectVisibleCards() {
    const nodes = Array.from(document.querySelectorAll('[role="article"], div[aria-posinset]'));
    const seen = new Set();
    const posts = [];
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight * 2) continue;
      const text = getPostText(node);
      const score = scorePost(text, { commentCount: extractCommentCount(node) });
      if (score < 25) continue;
      const post = buildPostFromNode(node, score);
      const key = getPostKey(post);
      if (isHandledPostKey(key) || seen.has(key)) continue;
      seen.add(key);
      posts.push(post);
      if (posts.length >= 10) break;
    }
    return posts.sort((a, b) => b.score - a.score);
  }

  function showStatus(message) {
    let box = document.getElementById("marketvibe-import-status");
    if (!box) {
      box = document.createElement("div");
      box.id = "marketvibe-import-status";
      box.style.cssText = "position:fixed;right:16px;top:76px;z-index:2147483647;max-width:min(360px,calc(100vw - 32px));border-radius:14px;background:#07111f;color:white;border:1px solid rgba(103,232,249,.45);box-shadow:0 14px 40px rgba(0,0,0,.35);padding:12px 14px;font:13px Arial,sans-serif;";
      document.body.appendChild(box);
    }
    box.textContent = message;
    window.setTimeout(() => box.remove(), 4500);
  }

  async function sendPosts(posts, searchPhrase = new URLSearchParams(location.search).get("q") || "") {
    if (extensionReloadRequired) throw new Error("Extension reloaded. Please refresh the Facebook page.");
    const state = getLeadHuntState();
    if (state?.active && state.paused) throw new Error("Buyer Radar is paused");
    if (state && !state.active) throw new Error("Buyer Radar is stopped");
    const response = await fetchWithTimeout(API_URL, {
      method: "POST",
      headers: await internalHeaders(),
      body: JSON.stringify({ posts, searchPhrase, runId: state?.runId || "" }),
    });
    if (!response.ok) {
      const message = response.status === 401 || response.status === 403 ? `MarketVibe import auth required (HTTP ${response.status})` : `HTTP ${response.status}`;
      throw new Error(`${message} ${await response.text()}`);
    }
    return response.json();
  }

  async function sendSinglePost(node, score, sendButton) {
    const post = buildPostFromNode(node, score);
    const originalText = sendButton.textContent;
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
    try {
      const data = await sendPosts([post]);
      saveRecentImport(post);
      saveHandledPostKey(getPostKey(post));
      markNodeHandled(node, score);
      showStatus(`Sent this post to MarketVibe. Good: ${data.counts?.good || 0}.`);
      sendButton.textContent = "Sent to MarketVibe";
      return true;
    } catch (error) {
      if (handleExtensionContextInvalidated(error, "send single post")) return false;
      if (!(await handleImportAuthError(error))) showStatus(`MarketVibe import failed: ${error && error.message ? error.message : "unknown error"}`);
      sendButton.disabled = false;
      sendButton.textContent = originalText || "Send this post to MarketVibe";
      return false;
    }
  }

  async function sendVisible() {
    const posts = collectVisibleCards();
    if (!posts.length) {
      showStatus("No strong buyer-intent posts detected on screen.");
      return;
    }
    button.disabled = true;
    button.textContent = "Sending to MarketVibe...";
    try {
      const data = await sendPosts(posts);
      posts.forEach(saveRecentImport);
      showStatus(`Imported ${posts.length} buyer-intent posts. Good: ${data.counts?.good || 0}.`);
    } catch (error) {
      if (handleExtensionContextInvalidated(error, "send visible posts")) return;
      if (!(await handleImportAuthError(error))) showStatus(`MarketVibe import failed: ${error && error.message ? error.message : "unknown error"}`);
    } finally {
      button.disabled = false;
      button.textContent = "Send visible posts to MarketVibe";
    }
  }

  const button = document.createElement("button");
  button.id = "marketvibe-import-button";
  button.type = "button";
  button.textContent = "Send visible posts to MarketVibe";
  button.style.cssText = "position:fixed;left:18px;bottom:24px;z-index:2147483647;border:0;border-radius:999px;background:linear-gradient(90deg,#10b981,#67e8f9);color:#03131f;font:800 14px Arial,sans-serif;padding:13px 17px;box-shadow:0 12px 34px rgba(0,0,0,.32);cursor:pointer;";
  button.addEventListener("click", sendVisible);
  document.body.appendChild(button);
  installStoredKeyResumeListener();
  parseLeadHuntLaunch();
  ensureLeadHuntControlPoller();
  if (getLeadHuntState()?.active) {
    ensureLeadHuntRunner("active state detected");
  }
  renderRecentImports();
  renderQueueControls();
  renderLeadHuntPanel();
  markFeed();
  setInterval(markFeed, SCAN_INTERVAL_MS);
})();







