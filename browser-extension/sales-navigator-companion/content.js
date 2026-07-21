(() => {
  const STORAGE_KEY = "marketvibe_sales_navigator_companion_v2";
  const PANEL_ID = "marketvibe-sales-navigator-companion";
  const IMPORT_PANEL_ID = "marketvibe-sales-navigator-import-panel";
  const MARKETVIBE_IMPORT_URL = "https://www.marketvibe1.com/admin/import";
  const MARKETVIBE_AUTO_IMPORT_PATH = "/admin/import?navigatorAutoImport=1&navigatorAutoReturn=1";
  const MARKETVIBE_AUTO_IMPORT_URL = `https://www.marketvibe1.com/login?next=${encodeURIComponent(MARKETVIBE_AUTO_IMPORT_PATH)}`;
  const DEFAULT_WORK_DURATION_MINUTES = 15;
  const DEFAULT_BREAK_DURATION_MINUTES = 5;
  const CSV_HEADERS = [
    "First Name",
    "Last Name",
    "Full Name",
    "Job Title",
    "Company Name",
    "Company Website",
    "Company Domain",
    "LinkedIn Profile URL",
    "Company LinkedIn URL",
    "Location",
    "Country",
    "City",
    "Industry",
    "Company Size",
    "Email",
    "Phone",
    "Public Signal URL",
    "Public Signal Text",
    "Source Note",
  ];
  const DEFAULT_STATE = {
    rows: [],
    finder: {
      active: false,
      runId: "",
      index: 0,
      page: 1,
      noGrowthPasses: 0,
      sessionStartRows: 0,
      cooldownUntil: "",
      maxRows: 150,
      workDurationMinutes: DEFAULT_WORK_DURATION_MINUTES,
      breakDurationMinutes: DEFAULT_BREAK_DURATION_MINUTES,
      workStartedAt: "",
      breakUntil: "",
      autoImport: true,
      autoImportInProgress: false,
      resumeUrl: "",
      lastImportAt: "",
      capturedCount: 0,
      sentCount: 0,
      rejectedCount: 0,
      totalSentCount: 0,
      totalRejectedCount: 0,
      seenKeys: [],
      location: "Use Sales Navigator geography filters manually",
      lastRunAt: "",
      status: "Idle",
    },
  };
  const FINDER_SEARCHES = [
    "owner custom home builder luxury homes",
    "founder construction company residential contractor",
    "CEO property developer real estate development",
    "managing director construction firm building contractor",
    "principal luxury real estate brokerage estate agent",
    "owner renovation contractor high end homes",
    "director property development real estate investment",
    "operations director home builder construction",
    "founder general contractor residential construction",
    "owner design build firm luxury residential",
    "ceo real estate brokerage luxury homes",
    "director estate agency prime property",
    "founder architecture construction residential",
    "owner commercial construction contractor",
    "managing partner property developer housing",
    "director luxury home renovation contractor",
    "owner roofing contractor construction company",
    "founder landscaping contractor luxury homes",
    "ceo home improvement company contractors",
    "principal real estate investment development",
    "owner building company residential projects",
    "director construction management firm",
    "founder property management real estate",
    "owner luxury estate agency broker",
    "operations manager construction contractor",
    "project manager property development construction",
    "managing director house builder",
    "owner kitchen bathroom renovation contractor",
    "founder interior design build luxury homes",
    "ceo commercial real estate brokerage",
    "owner construction company residential commercial",
    "founder building contractor home renovation",
    "ceo property investment development company",
    "director real estate development firm",
    "owner house renovation company",
    "principal construction project management",
    "founder luxury property agency",
    "ceo estate agency residential sales",
    "director property management company",
    "owner design and build contractor",
    "founder high end residential construction",
    "managing director luxury real estate",
    "owner commercial property brokerage",
    "director real estate investment firm",
    "founder land development property",
    "owner civil construction contractor",
    "director architecture firm residential",
    "owner home remodeling company",
    "founder construction services company",
    "ceo real estate agency",
    "principal property consultancy development",
    "owner luxury home builder",
    "director building services contractor",
    "founder residential property developer",
    "owner boutique real estate brokerage",
    "ceo construction group",
    "operations director property management",
    "partner commercial real estate",
    "principal architect luxury residential",
    "owner development company real estate",
    "founder contractor home improvement",
    "director new homes sales estate agency",
    "owner real estate brokerage luxury property",
    "managing director construction services",
    "founder real estate investment company",
    "owner property maintenance company commercial",
    "director facilities property management",
    "ceo residential construction company",
    "owner architecture design build",
    "founder prime property estate agency",
    "director luxury homes brokerage",
    "owner builder developer residential",
    "project director property development",
    "construction director home builder",
    "commercial director real estate brokerage",
  ];
  const MAX_PAGES_PER_SEARCH = 4;
  const MAX_NO_GROWTH_PASSES = 4;
  const LOW_YIELD_ROTATE_PASSES = 2;
  const SAFE_BATCH_SIZE = 30;
  const MAX_SEEN_KEYS = 5000;
  const AUTO_IMPORT_MIN_ROWS = 25;
  const RATE_LIMIT_COOLDOWN_MS = 2 * 60 * 60 * 1000;
  const PAGE_NAVIGATION_DELAY_MS = 60 * 1000;
  const SEARCH_NAVIGATION_DELAY_MS = 2 * 60 * 1000;
  const AUTO_IMPORT_RETURN_DELAY_MS = 5 * 1000;
  const TARGET_BUYER_KEYWORDS = [
    "builder",
    "builders",
    "home builder",
    "custom home",
    "luxury home",
    "construction",
    "construction company",
    "construction firm",
    "contractor",
    "contractors",
    "renovation contractor",
    "general contractor",
    "property",
    "property developer",
    "property development",
    "real estate developer",
    "real estate",
    "estate agent",
    "estate agency",
    "realtor",
    "brokerage",
    "luxury real estate",
    "renovation",
    "developer",
    "developers",
    "architect",
    "architects",
    "property management",
    "property maintenance",
    "facilities",
    "commercial property",
    "real estate investment",
    "land development",
    "design build",
    "remodeling",
    "home remodeling",
    "home improvement",
    "building services",
    "civil construction",
    "architecture firm",
    "new homes",
    "prime property",
  ];
  const BUYING_SIGNAL_KEYWORDS = [
    "expanding",
    "expansion",
    "hiring",
    "recruiting",
    "new project",
    "project launch",
    "planning",
    "planning application",
    "permit",
    "opening",
    "launching",
    "growth",
    "pipeline",
    "customers",
    "leads",
    "manual",
    "delay",
    "broken",
    "switching",
    "tender",
    "rfp",
    "procurement",
    "quote request",
    "looking for",
    "need",
    "needs",
    "seeking",
    "help with",
    "outsourcing",
    "contract awarded",
    "land acquired",
    "site acquired",
    "portfolio",
    "new homes",
  ];
  const SEARCH_SIGNAL_MODIFIERS = [
    "hiring",
    "expanding",
    "new project",
    "planning",
    "opening",
    "growth",
    "portfolio",
    "new homes",
    "site acquired",
    "contract awarded",
  ];
  const CUSTOMER_SIDE_EXCLUSION_PATTERN = /\b(marketing agency|lead generation|lead gen|growth agency|seo agency|advertising agency|paid ads|appointment setting|demand generation|sales development|outreach agency|digital marketing|web design|social media marketing|marketing consultant|growth consultant|consultant for builders|consultant to builders|consultant for construction|consultant to construction)\b/i;
  const DECISION_ROLE_PATTERN = /\b(founder|owner|ceo|chief|managing director|partner|principal|director|head|vp|operations|commercial|project manager|project director|construction manager|construction director|property developer|developer|broker|agent|realtor|architect)\b/i;
  const BUTTON_STYLE = [
    "border:1px solid rgba(255,255,255,.16)",
    "background:#151225",
    "color:#fff",
    "border-radius:8px",
    "padding:8px 10px",
    "font:700 12px Arial,sans-serif",
    "cursor:pointer",
  ].join(";");
  let breakResumeTimer = 0;
  let breakRenderTimer = 0;
  let cooldownResumeTimer = 0;
  let cooldownRenderTimer = 0;

  function isLinkedInSurface() {
    return /(^|\.)linkedin\.com$/i.test(location.hostname);
  }

  function isMarketVibeImportSurface() {
    return /(^|\.)marketvibe1\.com$/i.test(location.hostname) && location.pathname.startsWith("/admin/import")
      || location.hostname === "localhost" && location.pathname.startsWith("/admin/import");
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeKey(value) {
    return cleanText(value).toLowerCase();
  }

  function csvEscape(value) {
    const text = String(value || "");
    const escaped = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${escaped.replace(/"/g, '""')}"`;
  }

  function toAbsoluteUrl(value) {
    if (!value) return "";
    try {
      return new URL(value, location.origin).href.split("?")[0].replace(/\/+$/, "");
    } catch {
      return "";
    }
  }

  function visible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function rateLimitMessageVisible() {
    const text = normalizeKey(document.body && document.body.innerText);
    return text.includes("too many requests") || text.includes("you've made too many requests") || text.includes("please try again later");
  }

  function cooldownActive(finder) {
    return remainingCooldownMs(finder) > 0;
  }

  function cooldownLabel(finder) {
    const until = Date.parse(finder && finder.cooldownUntil || "");
    if (!Number.isFinite(until)) return "";
    return new Date(until).toLocaleTimeString();
  }

  function remainingCooldownMs(finder) {
    const until = Date.parse(finder && finder.cooldownUntil || "");
    if (!Number.isFinite(until)) return 0;
    return Math.max(0, until - Date.now());
  }

  function durationMinutes(value, fallback) {
    const minutes = Number(value);
    if (!Number.isFinite(minutes)) return fallback;
    return Math.max(1, Math.min(240, Math.round(minutes)));
  }

  function formatDuration(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return minutes > 0 ? `${minutes}m ${String(remainder).padStart(2, "0")}s` : `${remainder}s`;
  }

  function remainingBreakMs(finder) {
    const until = Date.parse(finder && finder.breakUntil || "");
    if (!Number.isFinite(until)) return 0;
    return Math.max(0, until - Date.now());
  }

  function breakActive(finder) {
    return remainingBreakMs(finder) > 0;
  }

  function finderWorkDurationMs(finder) {
    return durationMinutes(finder && finder.workDurationMinutes, DEFAULT_WORK_DURATION_MINUTES) * 60 * 1000;
  }

  function finderBreakDurationMs(finder) {
    return durationMinutes(finder && finder.breakDurationMinutes, DEFAULT_BREAK_DURATION_MINUTES) * 60 * 1000;
  }

  function finderAutoImportEnabled(finder) {
    return !(finder && finder.autoImport === false);
  }

  function workDurationReached(finder) {
    const startedAt = Date.parse(finder && finder.workStartedAt || "");
    return Number.isFinite(startedAt) && Date.now() - startedAt >= finderWorkDurationMs(finder);
  }

  function clearBreakTimers() {
    if (breakResumeTimer) window.clearTimeout(breakResumeTimer);
    if (breakRenderTimer) window.clearTimeout(breakRenderTimer);
    if (cooldownResumeTimer) window.clearTimeout(cooldownResumeTimer);
    if (cooldownRenderTimer) window.clearTimeout(cooldownRenderTimer);
    breakResumeTimer = 0;
    breakRenderTimer = 0;
    cooldownResumeTimer = 0;
    cooldownRenderTimer = 0;
  }

  function scheduleBreakResume(finder) {
    if (!isLinkedInSurface() || !breakActive(finder)) return;
    if (breakResumeTimer) window.clearTimeout(breakResumeTimer);
    breakResumeTimer = window.setTimeout(() => {
      breakResumeTimer = 0;
      void continueFinderIfActive();
    }, remainingBreakMs(finder));
  }

  function scheduleBreakStatusRefresh(finder) {
    if (!isLinkedInSurface() || !breakActive(finder)) return;
    if (breakRenderTimer) window.clearTimeout(breakRenderTimer);
    breakRenderTimer = window.setTimeout(async () => {
      breakRenderTimer = 0;
      const state = await chromeStorageGet();
      if (breakActive(state.finder)) renderLinkedInPanel(state);
    }, 1000);
  }

  function scheduleCooldownResume(finder) {
    if (!isLinkedInSurface() || !cooldownActive(finder) || !(finder && finder.active)) return;
    if (cooldownResumeTimer) window.clearTimeout(cooldownResumeTimer);
    cooldownResumeTimer = window.setTimeout(() => {
      cooldownResumeTimer = 0;
      void continueFinderIfActive();
    }, remainingCooldownMs(finder));
  }

  function scheduleCooldownStatusRefresh(finder) {
    if (!isLinkedInSurface() || !cooldownActive(finder)) return;
    if (cooldownRenderTimer) window.clearTimeout(cooldownRenderTimer);
    cooldownRenderTimer = window.setTimeout(async () => {
      cooldownRenderTimer = 0;
      const state = await chromeStorageGet();
      if (cooldownActive(state.finder)) renderLinkedInPanel(state);
    }, 1000);
  }

  async function pauseFinderForBreak(finder) {
    const breakMs = finderBreakDurationMs(finder);
    const breakUntil = new Date(Date.now() + breakMs).toISOString();
    const next = await patchState({
      finder: {
        ...finder,
        breakUntil,
        status: `Break active after ${durationMinutes(finder && finder.workDurationMinutes, DEFAULT_WORK_DURATION_MINUTES)} minutes of work.`,
      },
    });
    renderLinkedInPanel(next);
    scheduleBreakResume(next.finder);
  }

  async function pauseFinderForCooldown(finder, reason) {
    const cooldownUntil = new Date(Date.now() + RATE_LIMIT_COOLDOWN_MS).toISOString();
    const next = await patchState({
      finder: {
        ...finder,
        active: true,
        cooldownUntil,
        status: `${reason} Cooling down until ${new Date(cooldownUntil).toLocaleTimeString()}. Finder will resume automatically.`,
      },
    });
    renderLinkedInPanel(next);
    scheduleCooldownResume(next.finder);
  }

  function nextFinderSearchIndex(finder) {
    return (Number(finder && finder.index || 0) + 1) % FINDER_SEARCHES.length;
  }

  async function scheduleNextSearch(finder, nextIndex, status) {
    const scheduledRunId = finder && finder.runId;
    await patchState({
      finder: {
        ...finder,
        index: nextIndex,
        page: 1,
        noGrowthPasses: 0,
        status,
      },
    });
    setTimeout(async () => {
      const latest = await chromeStorageGet();
      if (!latest.finder || !latest.finder.active || latest.finder.runId !== scheduledRunId) return;
      location.href = buildSearchUrl(nextIndex);
    }, SEARCH_NAVIGATION_DELAY_MS);
  }

  async function startAutoImportAndResume(finder, reason) {
    const resumeUrl = location.href;
    const next = await patchState({
      finder: {
        ...finder,
        active: true,
        autoImportInProgress: true,
        resumeUrl,
        status: `${reason} Sending captured rows to MarketVibe automatically before cooldown.`,
      },
    });
    renderLinkedInPanel(next);
    location.href = MARKETVIBE_AUTO_IMPORT_URL;
  }

  function resultAnchors() {
    return Array.from(document.querySelectorAll("a[href*='/sales/lead/'], a[href*='/in/']"))
      .filter((anchor) => visible(anchor));
  }

  function chromeStorageGet() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ [STORAGE_KEY]: DEFAULT_STATE }, (result) => {
        const stored = result[STORAGE_KEY] || {};
        resolve({ ...DEFAULT_STATE, ...stored, finder: { ...DEFAULT_STATE.finder, ...(stored.finder || {}) } });
      });
    });
  }

  function chromeStorageSet(nextState) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: nextState }, resolve);
    });
  }

  async function patchState(patch) {
    const current = await chromeStorageGet();
    const next = { ...current, ...patch };
    await chromeStorageSet(next);
    return next;
  }

  function splitName(fullName) {
    const parts = cleanText(fullName).split(" ").filter(Boolean);
    if (parts.length < 2) return { firstName: "", lastName: "" };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  }

  function uniqueLines(text) {
    const seen = new Set();
    return String(text || "")
      .split(/\n|\r/)
      .map(cleanText)
      .filter((line) => line && line.length <= 180)
      .filter((line) => !/^(message|save|saved|connect|follow|view profile|add lead|more|open profile|premium)$/i.test(line))
      .filter((line) => {
        const key = normalizeKey(line);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function closestResultCard(anchor) {
    const preferred = anchor.closest("li, [data-view-name*='search'], [class*='result'], [class*='lead'], [class*='card']");
    if (preferred && cleanText(preferred.innerText).length > 60) return preferred;

    let current = anchor.parentElement;
    for (let depth = 0; current && depth < 8; depth += 1) {
      const textLength = cleanText(current.innerText).length;
      if (textLength >= 80 && textLength <= 3500) return current;
      current = current.parentElement;
    }
    return anchor.parentElement || anchor;
  }

  function firstKeyword(text, keywords) {
    const lower = normalizeKey(text);
    return keywords.find((keyword) => lower.includes(keyword));
  }

  function looksLikeLocation(value) {
    return /\b(united states|united kingdom|canada|australia|ireland|new zealand|uae|dubai|london|dublin|sydney|melbourne|brisbane|perth|auckland|new york|los angeles|san francisco|toronto|vancouver|miami|texas|florida|california|manchester|birmingham|austin|dallas|chicago|atlanta)\b/i.test(value)
      || /^[A-Z][A-Za-z .'-]+,\s*[A-Z][A-Za-z .'-]+$/.test(value);
  }

  function inferCompanyName(card, headline, lines = [], fullName = "") {
    const companyLink = Array.from(card.querySelectorAll("a[href*='/sales/company/'], a[href*='/company/']"))
      .find((link) => visible(link) && cleanText(link.innerText).length > 1);
    if (companyLink) return cleanText(companyLink.innerText);

    const atMatch = cleanText(headline).match(/\b(?:at|@|with|for|of)\s+([^|,]+)$/i);
    if (atMatch) return cleanText(atMatch[1]).slice(0, 120);

    const nameKey = normalizeKey(fullName);
    const headlineKey = normalizeKey(headline);
    const fallback = lines.find((line) => {
      const normalized = normalizeKey(line);
      if (!normalized || normalized === nameKey || normalized === headlineKey) return false;
      if (looksLikeLocation(line)) return false;
      if (/^(1st|2nd|3rd|\d+\+? connections?|message|save|connect|follow|view profile|add lead)$/i.test(line)) return false;
      if (DECISION_ROLE_PATTERN.test(line) && !firstKeyword(line, TARGET_BUYER_KEYWORDS)) return false;
      return firstKeyword(line, TARGET_BUYER_KEYWORDS) || /\b(ltd|llc|inc|group|homes|properties|construction|builders|contractors|realty|estates|developments|brokerage|company|co\.|plc)\b/i.test(line);
    });
    if (fallback) return cleanText(fallback).slice(0, 120);
    return "";
  }

  function inferCompanyUrl(card) {
    const companyLink = Array.from(card.querySelectorAll("a[href*='/sales/company/'], a[href*='/company/']"))
      .find((link) => visible(link));
    return companyLink ? toAbsoluteUrl(companyLink.getAttribute("href")) : "";
  }

  function inferHeadline(lines, fullName) {
    const normalizedName = normalizeKey(fullName);
    return lines.find((line) => {
      const normalized = normalizeKey(line);
      if (normalized === normalizedName) return false;
      return /\b(founder|owner|ceo|director|partner|principal|marketing|growth|lead|sales|consultant|agency|construction|property|real estate)\b/i.test(line);
    }) || "";
  }

  function inferLocation(lines) {
    return lines.find((line) => {
      if (line.length > 100) return false;
      return looksLikeLocation(line);
    }) || "";
  }

  function countryFromLocation(value) {
    if (/\bunited kingdom|london|manchester|birmingham\b/i.test(value)) return "United Kingdom";
    if (/\bcanada|toronto|vancouver\b/i.test(value)) return "Canada";
    if (/\baustralia|sydney|melbourne|brisbane|perth\b/i.test(value)) return "Australia";
    if (/\bireland|dublin\b/i.test(value)) return "Ireland";
    if (/\bnew zealand|auckland\b/i.test(value)) return "New Zealand";
    if (/\buae|dubai\b/i.test(value)) return "United Arab Emirates";
    if (value) return "United States";
    return "";
  }

  function inferIndustry(text) {
    if (/\b(construction|builder|contractor|renovation|home improvement)\b/i.test(text)) return "Construction and builder services";
    if (/\b(real estate|property|estate agent|realtor|luxury home)\b/i.test(text)) return "Real estate and property services";
    return "";
  }

  function scoreVisibleResult(text, headline) {
    const haystack = `${text} ${headline}`;
    const excluded = CUSTOMER_SIDE_EXCLUSION_PATTERN.test(haystack);
    const targetHit = firstKeyword(haystack, TARGET_BUYER_KEYWORDS);
    const signalHit = firstKeyword(haystack, BUYING_SIGNAL_KEYWORDS);
    const roleHit = DECISION_ROLE_PATTERN.test(haystack);
    let score = 25;
    if (targetHit) score += 40;
    if (roleHit) score += 20;
    if (signalHit) score += 10;
    const reasons = [
      targetHit ? `target buyer category: ${targetHit}` : "",
      roleHit ? "decision-maker role visible" : "",
      signalHit ? `visible buying/context signal: ${signalHit}` : "",
    ].filter(Boolean);
    return {
      score: Math.min(100, score),
      qualified: Boolean(!excluded && targetHit && roleHit && signalHit),
      reasons,
      excluded,
    };
  }

  function rowFromAnchor(anchor) {
    const fullName = cleanText(anchor.innerText || anchor.getAttribute("aria-label") || "");
    if (!fullName || fullName.length < 3 || fullName.length > 90) return null;
    if (/^(view profile|linkedin member|profile|open|message|save)$/i.test(fullName)) return null;

    const profileUrl = toAbsoluteUrl(anchor.getAttribute("href"));
    if (!/linkedin\.com\/(sales\/lead|in)\//i.test(profileUrl)) return null;

    const card = closestResultCard(anchor);
    const lines = uniqueLines(card.innerText);
    const headline = inferHeadline(lines, fullName);
    const companyName = inferCompanyName(card, headline, lines, fullName);
    const companyLinkedInUrl = inferCompanyUrl(card);
    const locationText = inferLocation(lines);
    const cardText = cleanText(lines.join(" | "));
    const resultScore = scoreVisibleResult(cardText, headline);

    const names = splitName(fullName);
    const publicSignalText = [
      resultScore.qualified
        ? `Visible Sales Navigator result matched MarketVibe supply profile: property, construction, builder, or luxury real-estate decision-maker (${resultScore.score}/100).`
        : "Visible Sales Navigator result captured for MarketVibe importer validation and owner review.",
      resultScore.reasons.length ? `Reasons: ${resultScore.reasons.join("; ")}.` : "",
      `Visible text: ${cardText.slice(0, 700)}`,
    ].filter(Boolean).join(" ");

    return {
      "First Name": names.firstName,
      "Last Name": names.lastName,
      "Full Name": fullName,
      "Job Title": headline,
      "Company Name": companyName,
      "Company Website": "",
      "Company Domain": "",
      "LinkedIn Profile URL": profileUrl,
      "Company LinkedIn URL": companyLinkedInUrl,
      "Location": locationText,
      "Country": countryFromLocation(locationText),
      "City": "",
      "Industry": inferIndustry(cardText),
      "Company Size": "",
      "Email": "",
      "Phone": "",
      "Public Signal URL": profileUrl,
      "Public Signal Text": publicSignalText,
      "Source Note": "Captured as MarketVibe supply lead: builder, construction, property developer, luxury real estate, or estate-agent decision-maker. Visible Sales Navigator card only; no cookies, hidden page requests, private APIs, or login credentials were collected.",
    };
  }

  function rowDedupeKey(row) {
    return normalizeKey(row["LinkedIn Profile URL"] || `${row["Full Name"]}|${row["Company Name"]}`);
  }

  function mergeRows(existing, incoming) {
    const map = new Map();
    [...existing, ...incoming].forEach((row) => {
      const key = rowDedupeKey(row);
      if (!key || map.has(key)) return;
      map.set(key, row);
    });
    return Array.from(map.values());
  }

  function mergeSeenKeys(existing, rows) {
    const ordered = Array.isArray(existing) ? existing.filter(Boolean) : [];
    rows.forEach((row) => {
      const key = rowDedupeKey(row);
      if (key && !ordered.includes(key)) ordered.push(key);
    });
    return ordered.slice(-MAX_SEEN_KEYS);
  }

  function captureVisibleLeadCards(limit = SAFE_BATCH_SIZE, excludedKeys = []) {
    const excluded = new Set(Array.isArray(excludedKeys) ? excludedKeys : []);
    const anchors = resultAnchors();
    const rows = anchors.map(rowFromAnchor).filter(Boolean)
      .filter((row) => !excluded.has(rowDedupeKey(row)));
    return mergeRows([], rows).slice(0, Math.max(0, limit));
  }

  function rowsToCsv(rows) {
    return [
      CSV_HEADERS.map(csvEscape).join(","),
      ...rows.map((row) => CSV_HEADERS.map((header) => csvEscape(row[header] || "")).join(",")),
    ].join("\n");
  }

  function downloadCsv(rows) {
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marketvibe-sales-navigator-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyCsv(rows) {
    await navigator.clipboard.writeText(rowsToCsv(rows));
  }

  function buildSearchUrl(index) {
    const base = FINDER_SEARCHES[index] || FINDER_SEARCHES[0];
    const signal = SEARCH_SIGNAL_MODIFIERS[index % SEARCH_SIGNAL_MODIFIERS.length];
    const query = `${base} ${signal}`;
    return `https://www.linkedin.com/sales/search/people?keywords=${encodeURIComponent(query)}`;
  }

  function disabledControl(element) {
    return !element
      || element.disabled
      || element.getAttribute("aria-disabled") === "true"
      || /\bdisabled\b/i.test(element.className || "");
  }

  function findNextPageControl() {
    const selectors = [
      "button[aria-label*='Next']",
      "a[aria-label*='Next']",
      "button[aria-label*='next']",
      "a[aria-label*='next']",
      "button[data-test-pagination-page-btn='next']",
      "li.artdeco-pagination__indicator--number + li button",
    ];
    for (const selector of selectors) {
      const control = Array.from(document.querySelectorAll(selector)).find((element) => visible(element) && !disabledControl(element));
      if (control) return control;
    }
    const textControl = Array.from(document.querySelectorAll("button, a")).find((element) => {
      const text = cleanText(element.innerText || element.getAttribute("aria-label") || "");
      return /^(next|next page|›|>)$/i.test(text) && visible(element) && !disabledControl(element);
    });
    return textControl || null;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function autoScrollVisibleResults(requireActiveFinder = false) {
    const scrollContainers = Array.from(document.querySelectorAll("[role='main'], main, body"))
      .filter((element) => element.scrollHeight > element.clientHeight);
    const target = scrollContainers[0] || document.scrollingElement || document.documentElement;
    for (let index = 0; index < 4; index += 1) {
      const state = await chromeStorageGet();
      if (requireActiveFinder && (!state.finder || !state.finder.active)) return false;
      target.scrollBy({ top: Math.max(250, Math.floor(window.innerHeight * 0.55)), behavior: "smooth" });
      for (let wait = 0; wait < 20; wait += 1) {
        await sleep(100);
        const latest = await chromeStorageGet();
        if (requireActiveFinder && (!latest.finder || !latest.finder.active)) return false;
      }
    }
    return true;
  }

  async function waitForVisibleResults(maxWaitMs = 18000, requireActiveFinder = false) {
    const startedAt = Date.now();
    let lastCount = 0;
    while (Date.now() - startedAt < maxWaitMs) {
      if (requireActiveFinder) {
        const state = await chromeStorageGet();
        if (!state.finder || !state.finder.active) return 0;
      }
      const count = resultAnchors().length;
      if (count >= 6) return count;
      if (count > lastCount) {
        lastCount = count;
        await sleep(2500);
        continue;
      }
      const bodyText = cleanText(document.body.innerText).toLowerCase();
      if (count > 0 && !/loading|searching|fetching/.test(bodyText)) return count;
      await sleep(1200);
    }
    return resultAnchors().length;
  }

  async function captureAndStore(statusPrefix) {
    const current = await chromeStorageGet();
    const runStart = Number(current.finder.sessionStartRows || 0);
    const remaining = Math.max(0, SAFE_BATCH_SIZE - Math.max(0, (current.rows || []).length - runStart));
    const captured = captureVisibleLeadCards(remaining, current.finder.seenKeys);
    const rows = mergeRows(current.rows || [], captured).slice(0, runStart + SAFE_BATCH_SIZE);
    const capturedCount = Math.max(0, rows.length - runStart);
    const status = `${statusPrefix}: captured ${capturedCount}/${SAFE_BATCH_SIZE}, stored ${rows.length}.`;
    const next = await patchState({ rows, finder: { ...current.finder, capturedCount, status, lastRunAt: new Date().toISOString() } });
    renderLinkedInPanel(next);
    return next;
  }

  async function startFinder() {
    const maxRowsInput = document.getElementById("marketvibe-sn-max-rows");
    const locationInput = document.getElementById("marketvibe-sn-location");
    const workDurationInput = document.getElementById("marketvibe-sn-work-duration");
    const breakDurationInput = document.getElementById("marketvibe-sn-break-duration");
    const maxRows = Math.max(10, Math.min(500, Number(maxRowsInput && maxRowsInput.value || 150)));
    const targetLocation = cleanText(locationInput && locationInput.value) || DEFAULT_STATE.finder.location;
    const workDurationMinutes = durationMinutes(workDurationInput && workDurationInput.value, DEFAULT_WORK_DURATION_MINUTES);
    const breakDurationMinutes = durationMinutes(breakDurationInput && breakDurationInput.value, DEFAULT_BREAK_DURATION_MINUTES);
    const current = await chromeStorageGet();
    const autoImport = true;
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    if (cooldownActive(current.finder)) {
      const next = await patchState({
        finder: {
          ...current.finder,
          active: true,
          runId,
          maxRows,
          workDurationMinutes,
          breakDurationMinutes,
          autoImport,
          status: `Cooldown active until ${cooldownLabel(current.finder)}. Finder will resume automatically.`,
        },
      });
      renderLinkedInPanel(next);
      scheduleCooldownResume(next.finder);
      return;
    }
    const finder = {
      active: true,
      runId,
      index: 0,
      page: 1,
      noGrowthPasses: 0,
      sessionStartRows: (current.rows || []).length,
      cooldownUntil: "",
      maxRows,
      workDurationMinutes,
      breakDurationMinutes,
      autoImport,
      autoImportInProgress: false,
      resumeUrl: "",
      capturedCount: 0,
      sentCount: 0,
      rejectedCount: 0,
      totalSentCount: Number(current.finder.totalSentCount || 0),
      totalRejectedCount: Number(current.finder.totalRejectedCount || 0),
      seenKeys: Array.isArray(current.finder.seenKeys) ? current.finder.seenKeys : [],
      workStartedAt: new Date().toISOString(),
      breakUntil: "",
      location: targetLocation,
      lastRunAt: new Date().toISOString(),
      status: `Scanning currently loaded Sales Navigator results. Captured 0/${SAFE_BATCH_SIZE}.`,
    };
    const next = await patchState({ finder });
    renderLinkedInPanel(next);
    await continueFinderIfActive();
  }

  async function stopFinder() {
    clearBreakTimers();
    const current = await chromeStorageGet();
    const next = await patchState({ finder: { ...current.finder, active: false, runId: "", autoImportInProgress: false, breakUntil: "", status: "Stopped immediately." } });
    renderLinkedInPanel(next);
  }

  async function continueFinderIfActive() {
    if (!isLinkedInSurface()) return;
    let current = await chromeStorageGet();
    if (!current.finder || !current.finder.active) return;
    renderLinkedInPanel(current);
    if (cooldownActive(current.finder)) {
      scheduleCooldownResume(current.finder);
      return;
    }
    if (current.finder.cooldownUntil) {
      current = await patchState({
        finder: {
          ...current.finder,
          cooldownUntil: "",
          workStartedAt: new Date().toISOString(),
          status: "Cooldown complete. Resuming finder.",
        },
      });
      renderLinkedInPanel(current);
    }
    if (breakActive(current.finder)) {
      scheduleBreakResume(current.finder);
      return;
    }
    if (current.finder.breakUntil) {
      current = await patchState({
        finder: {
          ...current.finder,
          breakUntil: "",
          workStartedAt: new Date().toISOString(),
          status: "Break complete. Resuming finder.",
        },
      });
      renderLinkedInPanel(current);
    }
    if (!current.finder.workStartedAt) {
      current = await patchState({ finder: { ...current.finder, workStartedAt: new Date().toISOString() } });
    }
    if (workDurationReached(current.finder)) {
      await pauseFinderForBreak(current.finder);
      return;
    }
    if (rateLimitMessageVisible()) {
      await pauseFinderForCooldown(current.finder, "Sales Navigator showed Too Many Requests.");
      return;
    }
    await waitForVisibleResults(18000, true);
    current = await chromeStorageGet();
    if (!current.finder || !current.finder.active) return;
    if (rateLimitMessageVisible()) {
      await pauseFinderForCooldown(current.finder, "Sales Navigator showed Too Many Requests.");
      return;
    }
    current = await patchState({ finder: { ...current.finder, status: `Scanning currently loaded results. Captured ${Number(current.finder.capturedCount || 0)}/${SAFE_BATCH_SIZE}.` } });
    renderLinkedInPanel(current);
    const completedScroll = await autoScrollVisibleResults(true);
    if (!completedScroll) return;
    current = await chromeStorageGet();
    if (!current.finder || !current.finder.active) return;
    const beforeCount = (current.rows || []).length;
    const afterCapture = await captureAndStore("Finder");
    const afterCount = (afterCapture.rows || []).length;
    const currentPage = Number(afterCapture.finder.page || 1);
    const noGrowthPasses = afterCount > beforeCount ? 0 : Number(afterCapture.finder.noGrowthPasses || 0) + 1;
    const runCapturedCount = Math.max(0, afterCount - Number(afterCapture.finder.sessionStartRows || 0));
    if (runCapturedCount > 0 && finderAutoImportEnabled(afterCapture.finder)) {
      await startAutoImportAndResume(
        { ...afterCapture.finder, capturedCount: runCapturedCount, sessionStartRows: afterCount, noGrowthPasses },
        `Scanning completed: captured ${runCapturedCount}/${SAFE_BATCH_SIZE}.`,
      );
      return;
    }
    const safeBatchTarget = Math.min(
      Number(afterCapture.finder.maxRows || 150),
      Number(afterCapture.finder.sessionStartRows || 0) + SAFE_BATCH_SIZE,
    );
    if ((afterCapture.rows || []).length >= Number(afterCapture.finder.maxRows || 150)) {
      if (finderAutoImportEnabled(afterCapture.finder) && (afterCapture.rows || []).length > 0) {
        await startAutoImportAndResume(
          { ...afterCapture.finder, sessionStartRows: afterCount, noGrowthPasses },
          `Max stored rows reached (${afterCapture.rows.length}).`,
        );
        return;
      }
      await patchState({ finder: { ...afterCapture.finder, active: false, status: `Complete: max rows reached (${afterCapture.rows.length}).` } });
      renderLinkedInPanel(await chromeStorageGet());
      return;
    }
    if (afterCount >= safeBatchTarget) {
      const reason = `Safe batch complete: ${afterCount - Number(afterCapture.finder.sessionStartRows || 0)} new rows captured.`;
      if (finderAutoImportEnabled(afterCapture.finder) && (afterCapture.rows || []).length >= AUTO_IMPORT_MIN_ROWS) {
        await startAutoImportAndResume({ ...afterCapture.finder, sessionStartRows: afterCount, noGrowthPasses }, reason);
      } else {
        await pauseFinderForCooldown({ ...afterCapture.finder, sessionStartRows: afterCount, noGrowthPasses }, reason);
      }
      return;
    }

    if (noGrowthPasses >= LOW_YIELD_ROTATE_PASSES) {
      const nextIndex = nextFinderSearchIndex(afterCapture.finder);
      await scheduleNextSearch(
        { ...afterCapture.finder, sessionStartRows: afterCount },
        nextIndex,
        `Low-yield search skipped after ${noGrowthPasses} passes without new qualified rows. Waiting ${Math.round(SEARCH_NAVIGATION_DELAY_MS / 1000)}s before search ${nextIndex + 1} of ${FINDER_SEARCHES.length}.`,
      );
      return;
    }

    const nextPageControl = currentPage < MAX_PAGES_PER_SEARCH ? findNextPageControl() : null;
    if (nextPageControl) {
      const scheduledRunId = afterCapture.finder.runId;
      await patchState({
        finder: {
          ...afterCapture.finder,
          page: currentPage + 1,
          noGrowthPasses,
          status: `Captured ${afterCount}/${afterCapture.finder.maxRows}. Waiting ${Math.round(PAGE_NAVIGATION_DELAY_MS / 1000)}s before page ${currentPage + 1}.`,
        },
      });
      setTimeout(async () => {
        const latest = await chromeStorageGet();
        if (!latest.finder || !latest.finder.active || latest.finder.runId !== scheduledRunId) return;
        nextPageControl.click();
        setTimeout(async () => {
          const afterNavigation = await chromeStorageGet();
          if (afterNavigation.finder && afterNavigation.finder.active
            && afterNavigation.finder.runId === scheduledRunId) {
            void continueFinderIfActive();
          }
        }, 8000);
      }, PAGE_NAVIGATION_DELAY_MS);
      return;
    }

    if (noGrowthPasses >= MAX_NO_GROWTH_PASSES) {
      const nextIndex = nextFinderSearchIndex(afterCapture.finder);
      await scheduleNextSearch(
        { ...afterCapture.finder, sessionStartRows: afterCount },
        nextIndex,
        `No qualified rows found after ${noGrowthPasses} passes. Continuing automatically with search ${nextIndex + 1} of ${FINDER_SEARCHES.length}.`,
      );
      return;
    }

    const nextIndex = nextFinderSearchIndex(afterCapture.finder);
    await scheduleNextSearch(
      { ...afterCapture.finder, noGrowthPasses },
      nextIndex,
      `Captured ${afterCount}/${afterCapture.finder.maxRows}. Waiting ${Math.round(SEARCH_NAVIGATION_DELAY_MS / 1000)}s before search ${nextIndex + 1} of ${FINDER_SEARCHES.length}.`,
    );
  }

  function panelShell(id, title) {
    let panel = document.getElementById(id);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = id;
      panel.style.cssText = [
        "position:fixed",
        "right:16px",
        "bottom:16px",
        "z-index:2147483647",
        "width:360px",
        "max-width:calc(100vw - 32px)",
        "background:#08030f",
        "color:#fff",
        "border:1px solid rgba(168,85,247,.45)",
        "border-radius:12px",
        "box-shadow:0 18px 50px rgba(0,0,0,.45)",
        "font:13px Arial,sans-serif",
        "overflow:hidden",
      ].join(";");
      document.documentElement.appendChild(panel);
    }
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;background:rgba(168,85,247,.18);">
        <div style="font-weight:900;color:#f5f3ff;">${title}</div>
        <button type="button" data-mv-close style="${BUTTON_STYLE};padding:5px 8px;">Hide</button>
      </div>
      <div data-mv-body style="padding:12px;"></div>
    `;
    panel.querySelector("[data-mv-close]").addEventListener("click", () => {
      panel.remove();
    });
    return panel.querySelector("[data-mv-body]");
  }

  function renderLinkedInPanel(state) {
    if (!isLinkedInSurface()) return;
    const body = panelShell(PANEL_ID, "MarketVibe Navigator Companion");
    const rows = state.rows || [];
    const finder = state.finder || DEFAULT_STATE.finder;
    const finderIsBreakActive = breakActive(finder);
    const finderIsCooldownActive = cooldownActive(finder);
    const finderStatus = finderIsCooldownActive
      ? `${finder.status || "Cooldown active."}<br />Remaining cooldown: ${formatDuration(remainingCooldownMs(finder))}.`
      : finderIsBreakActive
      ? `${finder.status || "Break active."}<br />Remaining break: ${formatDuration(remainingBreakMs(finder))}.`
      : finder.status || "Idle";
    const finderLabel = finderIsCooldownActive ? "Cooldown" : finderIsBreakActive ? "Break" : finder.active ? "Running" : "Ready";
    const finderColor = finderIsCooldownActive || finderIsBreakActive ? "#fde68a" : finder.active ? "#86efac" : "#e9d5ff";
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;background:rgba(255,255,255,.04);">
          <div style="font-size:11px;color:#c4b5fd;font-weight:800;">Stored CSV rows</div>
          <div style="font-size:24px;font-weight:900;">${rows.length}</div>
        </div>
        <div style="border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;background:rgba(255,255,255,.04);">
          <div style="font-size:11px;color:#c4b5fd;font-weight:800;">Finder</div>
          <div style="font-size:12px;font-weight:800;color:${finderColor};">${finderLabel}</div>
        </div>
      </div>
      <label style="display:grid;gap:4px;margin-bottom:8px;font-weight:800;color:#ddd6fe;font-size:12px;">
        Geography note
        <input id="marketvibe-sn-location" value="${String(finder.location || DEFAULT_STATE.finder.location).replace(/"/g, "&quot;")}" style="border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#10071d;color:white;padding:8px;" />
      </label>
      <label style="display:grid;gap:4px;margin-bottom:10px;font-weight:800;color:#ddd6fe;font-size:12px;">
        Max stored rows
        <input id="marketvibe-sn-max-rows" type="number" min="10" max="500" value="${Number(finder.maxRows || 150)}" style="border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#10071d;color:white;padding:8px;" />
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <label style="display:grid;gap:4px;font-weight:800;color:#ddd6fe;font-size:12px;">
          Work minutes
          <input id="marketvibe-sn-work-duration" type="number" min="1" max="240" value="${durationMinutes(finder.workDurationMinutes, DEFAULT_WORK_DURATION_MINUTES)}" style="border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#10071d;color:white;padding:8px;" />
        </label>
        <label style="display:grid;gap:4px;font-weight:800;color:#ddd6fe;font-size:12px;">
          Break minutes
          <input id="marketvibe-sn-break-duration" type="number" min="1" max="240" value="${durationMinutes(finder.breakDurationMinutes, DEFAULT_BREAK_DURATION_MINUTES)}" style="border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#10071d;color:white;padding:8px;" />
        </label>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-weight:800;color:#ddd6fe;font-size:12px;">
        <input id="marketvibe-sn-auto-import" type="checkbox" checked disabled />
        Auto-import safe batches (required)
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" data-mv-start style="${BUTTON_STYLE};background:#7c3aed;">Start finder</button>
        <button type="button" data-mv-stop style="${BUTTON_STYLE};">Stop finder</button>
        <button type="button" data-mv-capture style="${BUTTON_STYLE};">Capture visible</button>
        <button type="button" data-mv-scroll-capture style="${BUTTON_STYLE};">Scroll + capture</button>
        <button type="button" data-mv-send style="${BUTTON_STYLE};background:#16a34a;">Send to MarketVibe</button>
        <button type="button" data-mv-download style="${BUTTON_STYLE};">Download CSV</button>
        <button type="button" data-mv-portal style="${BUTTON_STYLE};">Open import portal</button>
        <button type="button" data-mv-copy style="${BUTTON_STYLE};">Copy CSV</button>
        <button type="button" data-mv-clear style="${BUTTON_STYLE};">Clear rows</button>
      </div>
      <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,.1);padding-top:8px;color:#c4b5fd;font-size:12px;line-height:1.45;">
        ${finderStatus}<br />
        Captured: ${Number(finder.capturedCount || 0)}. Sent: ${Number(finder.sentCount || 0)}. Rejected: ${Number(finder.rejectedCount || 0)}.<br />
        Safe batch cap: ${SAFE_BATCH_SIZE} new rows per run. Auto-import: ${finderAutoImportEnabled(finder) ? "on" : "off"}. Stop if Sales Navigator warns or rate-limits.<br />
        Visible-card capture only. No cookies, hidden requests, private APIs, or credential collection.
      </div>
    `;
    scheduleBreakStatusRefresh(finder);
    scheduleCooldownStatusRefresh(finder);

    body.querySelector("[data-mv-start]").addEventListener("click", () => void startFinder());
    body.querySelector("[data-mv-stop]").addEventListener("click", () => void stopFinder());
    body.querySelector("[data-mv-capture]").addEventListener("click", () => void captureAndStore("Manual capture"));
    body.querySelector("[data-mv-scroll-capture]").addEventListener("click", async () => {
      await autoScrollVisibleResults();
      await captureAndStore("Scroll capture");
    });
    body.querySelector("[data-mv-send]").addEventListener("click", () => window.open(MARKETVIBE_AUTO_IMPORT_URL, "_blank", "noopener,noreferrer"));
    body.querySelector("[data-mv-download]").addEventListener("click", () => downloadCsv(rows));
    body.querySelector("[data-mv-copy]").addEventListener("click", () => void copyCsv(rows));
    body.querySelector("[data-mv-portal]").addEventListener("click", () => window.open(MARKETVIBE_IMPORT_URL, "_blank", "noopener,noreferrer"));
    body.querySelector("[data-mv-clear]").addEventListener("click", async () => {
      const next = await patchState({ rows: [] });
      renderLinkedInPanel(next);
    });
  }

  async function importCapturedCsvIntoMarketVibe(options = {}) {
    const current = await chromeStorageGet();
    if (options.resumeFinderAfterSuccess
      && (!current.finder || !current.finder.active || !current.finder.autoImportInProgress)) {
      throw new Error("Finder was stopped before automatic import.");
    }
    const rows = current.rows || [];
    if (rows.length === 0) throw new Error("No captured Navigator rows are stored.");
    const csv = rowsToCsv(rows);
    const formData = new FormData();
    formData.set("file", new File([csv], `marketvibe-sales-navigator-${new Date().toISOString().slice(0, 10)}.csv`, { type: "text/csv" }));

    const previewResponse = await fetch("/api/admin/import/preview", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const previewData = await previewResponse.json().catch(() => ({}));
    if (!previewResponse.ok) throw new Error(previewData.error || "MarketVibe preview failed. Log in to /admin/import first.");
    const preview = previewData.preview;
    if (!preview || !Array.isArray(preview.rows) || preview.rows.length === 0) throw new Error("MarketVibe returned an empty preview.");
    if (options.resumeFinderAfterSuccess) {
      const latest = await chromeStorageGet();
      if (!latest.finder || !latest.finder.active || !latest.finder.autoImportInProgress) {
        throw new Error("Finder was stopped before import confirmation.");
      }
    }

    const confirmResponse = await fetch("/api/admin/import/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        filename: preview.filename,
        rows: preview.rows,
        mapping: preview.mapping,
        sourceFormat: preview.sourceFormat,
        worksheetName: preview.worksheetName,
        fileChecksum: preview.fileChecksum,
        rowFingerprints: preview.rowFingerprints,
        approveValidRows: true,
      }),
    });
    const confirmData = await confirmResponse.json().catch(() => ({}));
    if (!confirmResponse.ok) throw new Error(confirmData.error || "MarketVibe import failed.");
    const result = confirmData.result || {};
    if (options.clearAfterSuccess) {
      const latest = await chromeStorageGet();
      await patchState({
        rows: [],
        finder: {
          ...latest.finder,
          seenKeys: mergeSeenKeys(latest.finder && latest.finder.seenKeys, rows),
        },
      });
      result.clearedRows = rows.length;
    }
    return result;
  }

  async function runMarketVibeImport(status, rowCount, options = {}) {
    status.textContent = "Importing captured CSV through MarketVibe...";
    try {
      const result = await importCapturedCsvIntoMarketVibe(options);
      if (rowCount && options.clearAfterSuccess) rowCount.textContent = "0";
      status.textContent = `Import saved: ${result.importedRows || 0} new, ${result.duplicateRows || 0} duplicate, ${result.rejectedRows || 0} rejected, ${result.approvedRows || 0} approved, ${result.opportunitiesAddedToInventory || 0} opportunity inventory.${options.clearAfterSuccess ? " Local captured batch cleared." : ""}`;
      if (options.resumeFinderAfterSuccess) {
        const current = await chromeStorageGet();
        if (current.finder && current.finder.active && current.finder.autoImportInProgress) {
          const resumeUrl = current.finder.resumeUrl || buildSearchUrl(Number(current.finder.index || 0));
          const sentThisRun = Number(result.importedRows || 0) + Number(result.duplicateRows || 0);
          const rejectedThisRun = Number(result.rejectedRows || 0);
          const breakUntil = new Date(Date.now() + finderBreakDurationMs(current.finder)).toISOString();
          await patchState({
            finder: {
              ...current.finder,
              active: true,
              autoImportInProgress: false,
              resumeUrl: "",
              cooldownUntil: "",
              sessionStartRows: 0,
              workStartedAt: "",
              breakUntil,
              lastImportAt: new Date().toISOString(),
              sentCount: sentThisRun,
              rejectedCount: rejectedThisRun,
              totalSentCount: Number(current.finder.totalSentCount || 0) + sentThisRun,
              totalRejectedCount: Number(current.finder.totalRejectedCount || 0) + rejectedThisRun,
              status: `Completed: captured ${Number(current.finder.capturedCount || result.clearedRows || 0)}, sent ${sentThisRun}, rejected ${rejectedThisRun}. Safe break active; finder will resume automatically.`,
            },
          });
          status.textContent += " Returning to Sales Navigator; the next safe run will resume automatically after its break.";
          window.setTimeout(() => {
            location.href = resumeUrl;
          }, AUTO_IMPORT_RETURN_DELAY_MS);
        }
      }
    } catch (error) {
      const message = error && error.message ? error.message : "Import failed.";
      status.textContent = message;
      if (options.resumeFinderAfterSuccess) {
        const current = await chromeStorageGet();
        await patchState({
          finder: {
            ...current.finder,
            active: false,
            autoImportInProgress: false,
            status: `Auto-import failed: ${message} Finder paused for review.`,
          },
        });
      }
    }
  }

  function renderMarketVibeImportPanel(state) {
    if (!isMarketVibeImportSurface()) return;
    const body = panelShell(IMPORT_PANEL_ID, "Navigator CSV Import");
    const rows = state.rows || [];
    body.innerHTML = `
      <div style="border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px;background:rgba(255,255,255,.04);margin-bottom:10px;">
        <div style="font-size:11px;color:#c4b5fd;font-weight:800;">Captured Navigator rows</div>
        <div data-mv-row-count style="font-size:28px;font-weight:900;">${rows.length}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" data-mv-import style="${BUTTON_STYLE};background:#7c3aed;">Import captured rows</button>
        <button type="button" data-mv-download style="${BUTTON_STYLE};">Download CSV</button>
        <button type="button" data-mv-copy style="${BUTTON_STYLE};">Copy CSV</button>
        <button type="button" data-mv-clear style="${BUTTON_STYLE};">Clear rows</button>
      </div>
      <div data-mv-status style="margin-top:10px;border-top:1px solid rgba(255,255,255,.1);padding-top:8px;color:#c4b5fd;font-size:12px;line-height:1.45;">
        Open this page while logged in as MarketVibe admin. Import uses the existing CSV preview, dedupe, validation, and auto-approval rules.
      </div>
    `;
    const status = body.querySelector("[data-mv-status]");
    const rowCount = body.querySelector("[data-mv-row-count]");
    body.querySelector("[data-mv-import]").addEventListener("click", async () => {
      await runMarketVibeImport(status, rowCount, { clearAfterSuccess: false });
    });
    body.querySelector("[data-mv-download]").addEventListener("click", () => downloadCsv(rows));
    body.querySelector("[data-mv-copy]").addEventListener("click", () => void copyCsv(rows));
    body.querySelector("[data-mv-clear]").addEventListener("click", async () => {
      const next = await patchState({ rows: [] });
      renderMarketVibeImportPanel(next);
    });
    const importParams = new URLSearchParams(location.search);
    if (importParams.get("navigatorAutoImport") === "1") {
      window.history.replaceState({}, document.title, location.pathname);
      window.setTimeout(() => void runMarketVibeImport(status, rowCount, {
        clearAfterSuccess: true,
        resumeFinderAfterSuccess: importParams.get("navigatorAutoReturn") === "1",
      }), 500);
    }
  }

  async function init() {
    const state = await chromeStorageGet();
    if (isLinkedInSurface()) {
      renderLinkedInPanel(state);
      await continueFinderIfActive();
    }
    if (isMarketVibeImportSurface()) {
      renderMarketVibeImportPanel(state);
    }
  }

  void init();
})();
