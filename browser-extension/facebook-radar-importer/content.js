(() => {
  const API_URL = "https://www.marketvibe1.com/api/facebook-radar/import";
  const STATUS_API_URL = "https://www.marketvibe1.com/api/facebook-radar/hunt-status";
  const CACHE_KEY = "marketvibe_recent_facebook_imports";
  const MAX_RECENT_IMPORTS = 20;
  const SCAN_INTERVAL_MS = 1500;
  const SCAN_CLEANUP_MS = 3000;
  const HANDLED_KEY = "marketvibe_facebook_handled_posts";
  const MAX_HANDLED_POSTS = 500;
  const LEAD_HUNT_KEY = "marketvibe_lead_hunt_autopilot";
  const MAX_SCROLL_ATTEMPTS = 4;
  const HIGH_INTENT_IMPORT_THRESHOLD = 55;
  const OUTREACH_MODES = ["off", "draft-only", "manual-approval", "allowed-adapters"];
  const LEAD_HUNT_PRESETS = [
    "I need leads",
    "how do I get clients",
    "struggling to get clients",
    "need more customers",
    "looking for leads",
    "need clients fast",
    "my outreach is not working",
    "web designer need leads",
    "SEO freelancer need clients",
    "agency owner need leads",
  ];
  let leadHuntIntervalId = 0;
  let leadHuntTickRunning = false;
  if (document.getElementById("marketvibe-import-button")) return;

  function logLeadHunt(event, details = {}) {
    console.log(`[MarketVibe Lead Hunt] ${event}`, details);
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
    return candidates[0] || cleanLeadText(clone.textContent || "", 900) || "Facebook post imported";
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
    /where do i find customers?/i,
    /how do i get leads?/i,
    /struggling (?:on |with |to )?(?:generat(?:e|ing)|get(?:ting)?) (?:more )?leads?/i,
    /struggling to get clients?/i,
    /need more leads?/i,
    /need more customers?/i,
    /looking for leads?/i,
    /looking for alternatives? to cold calling/i,
    /no clients? this month/i,
    /need appointments?/i,
    /agency owner struggling/i,
    /web designers? need clients?/i,
    /seo freelancers? need leads?/i,
    /need help getting customers/i,
    /looking for (?:a )?tool to find leads/i,
    /cold outreach.*not working/i,
    /cold calling.*time consuming/i,
    /no one replies/i,
    /prospecting.*not working/i,
    /my website gets no traffic/i,
    /my business has no leads/i,
    /my shopify store has no sales/i,
    /store not converting/i,
    /launched my business.*(?:don't|dont|do not).*market/i,
    /first few clients/i,
    /client acquisition/i,
    /lead generation help/i,
    /struggling to get/i,
    /how do i get bookings/i,
  ];

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
    /setter/i,
    /closer/i,
    /proposal writer/i,
    /we are expanding/i,
    /we operate across/i,
    /professional web developer/i,
    /i help businesses/i,
    /my services/i,
    /we provide/i,
    /our agency/i,
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
    /i build/i,
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

  function scorePost(text) {
    let score = 0;
    let strongMatches = 0;

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
      if (pattern.test(text)) score -= 35;
    }

    if (/\?/.test(text)) score += 8;
    if (/\b(i|my|we|our)\b/i.test(text) && /\b(struggling|stuck|need|looking|can't|cannot|no|help|advice)\b/i.test(text)) score += 15;
    if (/\b(agency|web designer|seo freelancer|freelancer)\b/i.test(text) && /\b(leads|clients|appointments|outreach|cold calling)\b/i.test(text)) score += 12;
    if (!strongMatches) score -= 28;
    if (text.length < 80) score -= 20;

    return score;
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
    return {
      text,
      score,
      sourceName: extractGroupName(),
      author: extractAuthorName(node),
      dateText: extractTimestamp(node),
      reactions: "",
      comments: "",
      url: extractPostUrl(node),
      queryUsed: meta.queryUsed || "",
      sourceUsed: meta.sourceUsed || "",
      painPoint,
      replyDraft: meta.outreachMode === "off" ? "" : draft,
      outreachMode: meta.outreachMode || "draft-only",
    };
  }

  function detectPainPoint(text) {
    if (/\b(outreach|no one replies)\b/i.test(text)) return "outreach not working";
    if (/\b(leads?|clients?|customers?)\b/i.test(text)) return "customer acquisition";
    if (/\b(website|web design)\b/i.test(text)) return "website help";
    if (/\b(seo|google)\b/i.test(text)) return "SEO help";
    if (/\b(ads?|advertising)\b/i.test(text)) return "ads help";
    if (/\b(ecommerce|shopify|sales|store)\b/i.test(text)) return "ecommerce or sales growth";
    return "buyer-intent problem";
  }

  function createReply(post) {
    const opening = post.text.length > 130 ? `${post.text.slice(0, 130)}...` : post.text;
    return `This looks like a useful MarketVibe lead to review: "${opening}"\n\nMarketVibe helps spot public business signals and lead opportunities without scraping private data: https://www.marketvibe1.com`;
  }

  function createContextualReply(post) {
    const text = clean(post.text || "");
    const pain = clean(post.painPoint || detectPainPoint(text));
    const variants = {
      "outreach not working": [
        "I would tighten the reason for reaching out before changing channels. Replies usually improve when the first message points to one specific visible problem instead of a broad service pitch.",
        "If outreach is not getting replies, I would check the targeting and opener first. A short note about one real issue you noticed usually lands better than a general offer.",
      ],
      "customer acquisition": [
        "I would start by narrowing the buyer and the trigger. It is easier to find leads when you look for businesses showing one clear problem, like weak visibility, no clear CTA, or poor follow-up.",
        "This sounds like a positioning and prospecting issue before a tools issue. Pick one customer type, then look for visible signs they may need help.",
      ],
      "website help": [
        "I would look at the basics first: mobile layout, clear CTA, trust signals, and whether visitors can quickly understand what to do next.",
        "For a website issue, I would start with the conversion path. If the offer, CTA, or contact path is fuzzy, more traffic may not fix it.",
      ],
      "SEO help": [
        "I would check whether the local/service pages match what people actually search for. Missing service pages and weak titles can make good businesses hard to find.",
        "For SEO, I would begin with the obvious visibility gaps: page titles, service pages, local terms, and whether competitors explain the offer more clearly.",
      ],
      "ecommerce or sales growth": [
        "I would separate traffic from conversion. If people are visiting but not buying, product page trust, offer clarity, checkout friction, and abandoned carts are worth checking first.",
        "For store growth, I would look at the product page and trust signals before adding more ads. Traffic helps only if the page makes the next step obvious.",
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
      const score = scorePost(text);
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

  function skipCurrentQualifiedPost() {
    const current = getCurrentQualifiedNode();
    if (!current) {
      moveToNextQualifiedPost();
      return;
    }
    markNodeHandled(current.node, current.score);
    showStatus("Skipped this post. Moving to the next match.");
    window.setTimeout(() => moveToNextQualifiedPost(current.node), 250);
  }

  function renderQueueControls() {
    let panel = document.getElementById("marketvibe-queue-controls");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "marketvibe-queue-controls";
      panel.style.cssText = "position:fixed;right:16px;bottom:82px;z-index:2147483647;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;max-width:min(420px,calc(100vw - 32px));font:12px Arial,sans-serif;";
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
      panel.append(next, skip);
      document.body.appendChild(panel);
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
        maxSearches: 10,
        maxImportedLeads: 10,
        delayMs: 3500,
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

  function syncLeadHuntStatus(nextState) {
    const search = currentLeadHuntSearch(nextState);
    fetch(STATUS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        active: Boolean(nextState.active),
        paused: Boolean(nextState.paused),
        query: search?.query || "Not started",
        source: search?.source || "Not started",
        currentUrl: location.href,
        imported: Number(nextState.importedCount || 0),
        skipped: Number(nextState.skippedCount || 0),
        duplicates: Number(nextState.duplicateCount || 0),
        failed: Number(nextState.failedCount || 0),
        status: nextState.status || "",
        errors: Array.isArray(nextState.errors) ? nextState.errors.slice(0, 8) : [],
        updatedAt: new Date().toISOString(),
      }),
    }).catch((error) => logLeadHunt("status sync failed", { message: error?.message || "unknown" }));
  }

  function ensureLeadHuntRunner(reason = "runner ensure") {
    if (!leadHuntIntervalId) {
      leadHuntIntervalId = window.setInterval(() => {
        void runLeadHuntTick("interval");
      }, SCAN_INTERVAL_MS);
      logLeadHunt("runner interval started", { reason });
    }
    window.setTimeout(() => void runLeadHuntTick(reason), 250);
    window.setTimeout(() => void runLeadHuntTick(`${reason}:followup`), 1250);
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

  function stopLeadHunt(message = "Lead Hunt stopped.") {
    const state = getLeadHuntState();
    if (state) {
      saveLeadHuntState({ ...state, active: false, paused: false, status: message });
    }
    if (leadHuntIntervalId) {
      window.clearInterval(leadHuntIntervalId);
      leadHuntIntervalId = 0;
    }
    logLeadHunt("hunt completed", { message });
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
    window.setTimeout(() => {
      const latest = getLeadHuntState();
      if (latest?.active && !latest.paused) window.location.assign(withLeadHuntStateHash(url, latest));
    }, Math.max(300, nextState.nextActionAt - Date.now()));
  }

  function startLeadHunt(config = defaultLeadHuntConfig()) {
    const searches = buildLeadHuntSearches(config);
    const state = {
      active: true,
      paused: false,
      currentSearchIndex: 0,
      currentResultIndex: 0,
      currentResultUrls: [],
      importedCount: 0,
      skippedCount: 0,
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
      status: "Lead Hunt starting.",
    };
    saveLeadHuntState(state);
    logLeadHunt("LEAD_HUNT_START", { searches: searches.length, caps: state.caps });
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
        showStatus("Lead Hunt state could not be restored on this page.");
      }
    }

    const match = location.hash.match(/marketvibeLeadHunt=([^&]+)/);
    if (!match) return;
    try {
      const config = JSON.parse(decodeURIComponent(match[1]));
      history.replaceState(null, document.title, location.pathname + location.search);
      startLeadHunt(config);
    } catch {
      showStatus("Lead Hunt launch settings could not be read.");
    }
  }

  function pauseLeadHunt() {
    const state = getLeadHuntState();
    if (state) saveLeadHuntState({ ...state, paused: true, status: "Paused. Resume when ready." });
  }

  function resumeLeadHunt() {
    const state = getLeadHuntState();
    if (state) {
      saveLeadHuntState({ ...state, active: true, paused: false, status: "Resuming Lead Hunt.", nextActionAt: Date.now() + 250 });
      logLeadHunt("hunt resumed");
      ensureLeadHuntRunner("resume");
    }
  }

  function nextLeadHuntSearch(state, reason) {
    const nextIndex = (state.currentSearchIndex || 0) + 1;
    if (nextIndex >= (state.searches || []).length || nextIndex >= Number(state.caps?.maxSearches || 10)) {
      stopLeadHunt(`Lead Hunt complete. Imported ${state.importedCount || 0} lead(s).`);
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
      duplicates: 0,
      scanned: 0,
    };
    const seenThisTick = new Set();

    for (const node of getVisibleCandidateNodes()) {
      const text = getPostText(node);
      const score = scorePost(text);
      const post = buildPostFromNode(node, score, { queryUsed: search?.query || "", sourceUsed: search?.source || "", outreachMode: state.outreach?.mode || "draft-only" });
      const key = getPostKey(post);
      if (!key || seenThisTick.has(key)) continue;
      seenThisTick.add(key);
      decisions.scanned += 1;

      if (isHandledPostKey(key) || (state.seen || []).includes(key)) {
        decisions.duplicates += 1;
        logLeadHunt("LEAD_HUNT_SKIP", { reason: "duplicate", score, key });
        continue;
      }

      if (score >= HIGH_INTENT_IMPORT_THRESHOLD) {
        decisions.importItems.push({ node, score, post, key });
        logLeadHunt("score decision", { decision: "import", score, text: text.slice(0, 80) });
        continue;
      }

      decisions.skipped += 1;
      saveHandledPostKey(key);
      logLeadHunt("LEAD_HUNT_SKIP", { reason: "low-intent", score, text: text.slice(0, 80) });
    }

    return decisions;
  }

  function scrollAndRescan(state, message) {
    const attempts = Number(state.scrollAttempts || 0) + 1;
    if (attempts > MAX_SCROLL_ATTEMPTS) return false;
    window.scrollBy({ top: Math.round(window.innerHeight * 0.9), behavior: "smooth" });
    logLeadHunt("next match", { action: "auto-scroll", attempts, message });
    saveLeadHuntState({
      ...state,
      scrollAttempts: attempts,
      status: `${message} Scrolling visible results (${attempts}/${MAX_SCROLL_ATTEMPTS}).`,
      nextActionAt: Date.now() + leadHuntDelay(state),
    });
    return true;
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
        visitedUrls: Array.from(new Set([...(state.visitedUrls || []), location.href])).slice(-50),
      }, `${reason} Opening result ${nextResultIndex + 1}.`);
      return;
    }
    nextLeadHuntSearch({
      ...state,
      scrollAttempts: 0,
      skippedCount: (state.skippedCount || 0) + 1,
      visitedUrls: Array.from(new Set([...(state.visitedUrls || []), location.href])).slice(-50),
    }, reason);
  }

  async function runLeadHuntTick(trigger = "manual") {
    if (leadHuntTickRunning) return;
    const state = getLeadHuntState();
    if (!state?.active || state.paused) return;
    if (Date.now() < Number(state.nextActionAt || 0)) return;
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

      if (!search) {
        stopLeadHunt("Lead Hunt complete. No searches left.");
        return;
      }
      if (Number(state.importedCount || 0) >= Number(state.caps?.maxImportedLeads || 10)) {
        stopLeadHunt(`Daily import cap reached. Imported ${state.importedCount} lead(s).`);
        return;
      }

      if (/google\.com|bing\.com/i.test(location.hostname)) {
        const resultUrls = collectIndexedFacebookResultUrls();
        logLeadHunt("score decision", { source: search.source, resultUrls: resultUrls.length });
        if (!resultUrls.length) {
          if (scrollAndRescan(state, "No indexed Facebook results found yet.")) return;
          nextLeadHuntSearch({ ...state, skippedCount: (state.skippedCount || 0) + 1 }, "No indexed Facebook results found.");
          return;
        }
        const nextState = { ...state, currentResultUrls: resultUrls, currentResultIndex: 0, resultNumber: 1, scrollAttempts: 0 };
        navigateWithDelay(resultUrls[0], nextState, `Opening indexed Facebook result 1 of ${resultUrls.length}.`);
        return;
      }

      if (/facebook\.com/i.test(location.hostname)) {
        markFeed();
        const decisions = scanVisibleLeadHuntCards(state, search);
        const duplicateCount = Number(state.duplicateCount || 0) + decisions.duplicates;
        const skippedCount = Number(state.skippedCount || 0) + decisions.skipped;
        logLeadHunt("score decision", { source: search.source, query: search.query, scanned: decisions.scanned, matches: decisions.importItems.length, skipped: decisions.skipped, duplicateCount });
        if (decisions.importItems.length) {
          const sentPosts = decisions.importItems.map(({ post }) => post);
          const data = await sendPosts(sentPosts, search.query);
          decisions.importItems.forEach(({ node, score, post }) => {
            saveRecentImport(post);
            saveHandledPostKey(getPostKey(post));
            markNodeHandled(node, score);
          });
          const importedCount = Number(state.importedCount || 0) + sentPosts.length;
          const seen = Array.from(new Set([...(state.seen || []), ...sentPosts.map(getPostKey)]));
          saveLeadHuntState({
            ...state,
            importedCount,
            duplicateCount,
            skippedCount,
            seen,
            scrollAttempts: 0,
            importedLeads: [...sentPosts, ...(state.importedLeads || [])].slice(0, 30),
            status: `Imported ${sentPosts.length} high-intent lead(s). Good: ${data.counts?.good || 0}.`,
            nextActionAt: Date.now() + Math.min(900, leadHuntDelay(state)),
          });
          logLeadHunt("LEAD_HUNT_IMPORT", { count: sentPosts.length, importedCount, query: search.query });
          if (importedCount >= Number(state.caps?.maxImportedLeads || 10)) {
            stopLeadHunt(`Daily import cap reached. Imported ${importedCount} lead(s).`);
          }
          return;
        }

        const stateWithDuplicates = { ...state, duplicateCount, skippedCount };
        if (scrollAndRescan(stateWithDuplicates, "No high-intent match on loaded posts yet.")) return;
        logLeadHunt("next match", { reason: "no match after scroll attempts" });
        advanceAfterFacebookPage(stateWithDuplicates, "No high-intent match after scanning visible page.");
      }
    } catch (error) {
      const failedCount = Number(state.failedCount || 0) + 1;
      const failedState = {
        ...state,
        errors: [`${new Date().toLocaleTimeString()} ${error && error.message ? error.message : "Unknown Lead Hunt error"}`, ...(state.errors || [])].slice(0, 8),
        failedCount,
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
    panel.innerHTML = `
      <div style="font-weight:900;color:#a7f3d0;margin-bottom:6px;">MarketVibe Lead Hunt</div>
      <div style="line-height:1.45;color:#e5eef9;margin-bottom:8px;">${state?.status || "Ready. Automated public-source discovery. No auto-DM or auto-comment."}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;color:#cbd5e1;">
        <div>Query: ${search?.query || "not started"}</div>
        <div>Source: ${search?.source || "none"}</div>
        <div>Current URL: ${clean(state?.currentUrl || location.href).slice(0, 72)}</div>
        <div>Runtime: ${state?.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : 0}s</div>
        <div>Result: ${state?.resultNumber || 0}</div>
        <div>Imported: ${state?.importedCount || 0}</div>
        <div>Skipped: ${state?.skippedCount || 0}</div>
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
    start.textContent = "Start Lead Hunt";
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
    controls.append(start, pause, stop);
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
      panel.style.cssText = "position:fixed;left:16px;bottom:20px;z-index:2147483647;width:min(360px,calc(100vw - 32px));border-radius:16px;background:#07111f;color:white;border:1px solid rgba(103,232,249,.35);box-shadow:0 16px 42px rgba(0,0,0,.38);padding:12px;font:12px Arial,sans-serif;";
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
      markNodeHandled(node, score);
      window.setTimeout(() => moveToNextQualifiedPost(node), 250);
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
      const nodes = Array.from(document.querySelectorAll('[role="article"], div[aria-posinset]'));
      for (const node of nodes) {
        const text = getPostText(node);
        const score = scorePost(text);
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
      const score = scorePost(text);
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
      box.style.cssText = "position:fixed;right:16px;bottom:82px;z-index:2147483647;max-width:360px;border-radius:14px;background:#07111f;color:white;border:1px solid rgba(103,232,249,.45);box-shadow:0 14px 40px rgba(0,0,0,.35);padding:12px 14px;font:13px Arial,sans-serif;";
      document.body.appendChild(box);
    }
    box.textContent = message;
    window.setTimeout(() => box.remove(), 4500);
  }

  async function sendPosts(posts, searchPhrase = new URLSearchParams(location.search).get("q") || "") {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts, searchPhrase }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
      showStatus(`MarketVibe import failed: ${error && error.message ? error.message : "unknown error"}`);
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
      showStatus(`MarketVibe import failed: ${error && error.message ? error.message : "unknown error"}`);
    } finally {
      button.disabled = false;
      button.textContent = "Send visible posts to MarketVibe";
    }
  }

  const button = document.createElement("button");
  button.id = "marketvibe-import-button";
  button.type = "button";
  button.textContent = "Send visible posts to MarketVibe";
  button.style.cssText = "position:fixed;right:18px;bottom:24px;z-index:2147483647;border:0;border-radius:999px;background:linear-gradient(90deg,#10b981,#67e8f9);color:#03131f;font:800 14px Arial,sans-serif;padding:13px 17px;box-shadow:0 12px 34px rgba(0,0,0,.32);cursor:pointer;";
  button.addEventListener("click", sendVisible);
  document.body.appendChild(button);
  parseLeadHuntLaunch();
  if (getLeadHuntState()?.active) {
    ensureLeadHuntRunner("active state detected");
  }
  renderRecentImports();
  renderQueueControls();
  renderLeadHuntPanel();
  markFeed();
  setInterval(markFeed, SCAN_INTERVAL_MS);
})();
