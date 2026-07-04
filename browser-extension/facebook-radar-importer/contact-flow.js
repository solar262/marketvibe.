(() => {
  const SITE_URL = "https://www.marketvibe1.com";
  const CONTACTED_KEY = "marketvibe_buyer_radar_contacted_manual_queue";
  const PANEL_ID = "marketvibe-contact-flow-toast";

  if (!/facebook\.com$/i.test(location.hostname)) return;

  function clean(value, limit = 900) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function contactedSet() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONTACTED_KEY) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function saveContacted(key) {
    if (!key) return;
    const next = Array.from(contactedSet());
    if (!next.includes(key)) next.unshift(key);
    localStorage.setItem(CONTACTED_KEY, JSON.stringify(next.slice(0, 500)));
  }

  function getPostText(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll(".marketvibe-card-actions,.marketvibe-contact-actions,.marketvibe-intent-badge,[aria-hidden='true'],[role='button'],button").forEach((item) => item.remove());
    const candidates = Array.from(clone.querySelectorAll("[data-ad-preview='message'], [dir='auto'], span, div"))
      .map((item) => clean(item.textContent || "", 900))
      .filter((text) => text.length > 35 && !/^(like|comment|share|send|follow|join|most relevant)$/i.test(text));
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0] || clean(clone.textContent || "", 900);
  }

  function getPostKey(node) {
    const link = getPostUrl(node);
    const text = getPostText(node).toLowerCase().slice(0, 180);
    return `${link || location.href}|${text}`;
  }

  function normalizeFacebookUrl(raw) {
    try {
      const url = new URL(raw, location.origin);
      ["__cft__", "__tn__", "comment_id", "reply_comment_id", "mibextid", "refid"].forEach((key) => url.searchParams.delete(key));
      return url.toString();
    } catch {
      return "";
    }
  }

  function getPostUrl(node) {
    const links = Array.from(node.querySelectorAll("a[href]"))
      .map((link) => normalizeFacebookUrl(link.getAttribute("href") || ""))
      .filter(Boolean);
    return links.find((url) => /\/posts\/\d+|\/permalink\/\d+|story_fbid=\d+/i.test(url)) || location.href;
  }

  function getProfileUrl(node) {
    const links = Array.from(node.querySelectorAll("a[href]"))
      .map((link) => ({ href: normalizeFacebookUrl(link.getAttribute("href") || ""), text: clean(link.textContent || "", 120) }))
      .filter((item) => item.href);

    const profile = links.find((item) => {
      const url = item.href;
      if (/\/groups\/|\/posts\/|\/permalink\/|\/photo|\/story\.php|\/reel\//i.test(url)) return false;
      if (/facebook\.com\/(profile\.php\?id=\d+|people\/|[^/?#]+\/?$)/i.test(url) && item.text.length > 1) return true;
      return false;
    });
    return profile?.href || getPostUrl(node);
  }

  function getAuthor(node) {
    const links = Array.from(node.querySelectorAll("a[href]"))
      .map((link) => clean(link.textContent || "", 80))
      .filter((text) => text && !/^(like|comment|share|send|follow|join|see more|reply)$/i.test(text));
    return links.find((text) => /[A-Za-z]/.test(text) && text.length <= 60) || "there";
  }

  function detectPain(text) {
    if (/cold outreach|no one replies|outreach/i.test(text)) return "trying to get replies from outreach";
    if (/web design|website|web developer|web agency/i.test(text) && /client|lead|customer/i.test(text)) return "getting web design clients";
    if (/seo/i.test(text) && /client|lead|customer/i.test(text)) return "getting SEO clients";
    if (/lead/i.test(text)) return "getting more leads";
    if (/client/i.test(text)) return "getting more clients";
    return "getting more clients";
  }

  function createInboxMessage(node) {
    const text = getPostText(node);
    const pain = detectPain(text);
    return `Hey, I saw your post about ${pain}.\n\nI built MarketVibe for exactly that purpose — it finds local businesses with visible website issues and gives you a ready-to-use lead report plus outreach angle.\n\nGive it a try and see if it’s what you’re looking for:\n${SITE_URL}`;
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      toast("Inbox message copied. Open the profile/post, paste it, then press Send manually.");
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      toast("Inbox message copied.");
      return true;
    }
  }

  function toast(message) {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = PANEL_ID;
      panel.style.cssText = "position:fixed;right:18px;bottom:90px;z-index:2147483647;max-width:min(360px,calc(100vw - 32px));border-radius:14px;background:#07111f;color:white;border:1px solid rgba(16,185,129,.45);box-shadow:0 16px 42px rgba(0,0,0,.34);padding:12px;font:800 13px Arial,sans-serif;";
      document.body.appendChild(panel);
    }
    panel.textContent = message;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => panel.remove(), 2800);
  }
  toast.timer = 0;

  function button(label, style, onClick) {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = label;
    item.style.cssText = `border-radius:999px;font:900 12px Arial,sans-serif;padding:8px 11px;cursor:pointer;${style}`;
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick(event);
    });
    return item;
  }

  function nextMatch(fromNode) {
    const matches = Array.from(document.querySelectorAll(".marketvibe-card-actions"))
      .map((actions) => actions.closest('[role="article"], div[aria-posinset]'))
      .filter((node) => node instanceof HTMLElement && !contactedSet().has(getPostKey(node)));
    if (!matches.length) {
      window.scrollBy({ top: Math.round(window.innerHeight * 0.85), behavior: "smooth" });
      toast("No loaded pending match. Scrolling for more.");
      return;
    }
    const currentTop = fromNode?.getBoundingClientRect?.().top || -9999;
    const below = matches.find((node) => node !== fromNode && node.getBoundingClientRect().top > currentTop + 20);
    const next = below || matches.find((node) => node !== fromNode) || matches[0];
    next.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Moved to next pending match.");
  }

  function enhanceActionBar(actions) {
    if (actions.querySelector(".marketvibe-contact-actions")) return;
    const node = actions.closest('[role="article"], div[aria-posinset]');
    if (!(node instanceof HTMLElement)) return;

    const key = getPostKey(node);
    const contacted = contactedSet().has(key);
    if (contacted) {
      node.style.outline = "2px solid rgba(148,163,184,.5)";
      node.style.opacity = "0.72";
    }

    const row = document.createElement("div");
    row.className = "marketvibe-contact-actions";
    row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;align-items:center;width:100%;border-top:1px solid rgba(255,255,255,.12);margin-top:8px;padding-top:8px;";

    const copyInbox = button("Copy inbox message", "border:0;background:#f8fafc;color:#03131f;", () => void copyText(createInboxMessage(node)));
    const openProfile = button("Open profile/post", "border:1px solid rgba(103,232,249,.55);background:#07111f;color:white;", () => window.open(getProfileUrl(node), "_blank", "noopener,noreferrer"));
    const markContacted = button(contacted ? "Contacted" : "Mark contacted", "border:1px solid rgba(16,185,129,.55);background:rgba(16,185,129,.12);color:#d1fae5;", () => {
      saveContacted(key);
      node.style.outline = "2px solid rgba(16,185,129,.75)";
      node.style.opacity = "0.7";
      markContacted.textContent = "Contacted";
      toast("Marked contacted locally.");
    });
    const next = button("Next", "border:1px solid rgba(251,191,36,.55);background:rgba(255,255,255,.08);color:white;", () => nextMatch(node));

    row.append(copyInbox, openProfile, markContacted, next);
    actions.appendChild(row);
  }

  function enhance() {
    document.querySelectorAll(".marketvibe-card-actions").forEach((actions) => enhanceActionBar(actions));
  }

  const observer = new MutationObserver(() => enhance());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setInterval(enhance, 1400);
  enhance();
})();
