(() => {
  const API_URL = "https://www.marketvibe1.com/api/facebook-radar/import";
  const CACHE_KEY = "marketvibe_recent_facebook_imports";
  const MAX_RECENT_IMPORTS = 20;
  const SCAN_INTERVAL_MS = 1500;
  const SCAN_CLEANUP_MS = 3000;
  if (document.getElementById("marketvibe-import-button")) return;

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function getPostText(node) {
    const clone = node.cloneNode(true);
    clone.querySelectorAll(".marketvibe-intent-badge, .marketvibe-card-actions").forEach((item) => item.remove());
    return clean(clone.innerText).slice(0, 2200);
  }

  const STRONG_BUYER_SIGNALS = [
    /how do i get clients?/i,
    /where do i find customers?/i,
    /how do i get leads?/i,
    /need help getting customers/i,
    /looking for (?:a )?tool to find leads/i,
    /cold outreach.*not working/i,
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

  function buildPostFromNode(node, score) {
    const text = getPostText(node);
    return {
      text,
      score,
      sourceName: clean(document.title.replace(/\| Facebook$/i, "")),
      author: text.split(" ").slice(0, 8).join(" "),
      dateText: "",
      reactions: "",
      comments: "",
      url: extractPostUrl(node),
    };
  }

  function createReply(post) {
    const opening = post.text.length > 130 ? `${post.text.slice(0, 130)}...` : post.text;
    return `This looks like a useful MarketVibe lead to review: "${opening}"\n\nMarketVibe helps spot public business signals and lead opportunities without scraping private data: https://www.marketvibe1.com`;
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
      importedAt: new Date().toISOString(),
    };
    const recent = getRecentImports().filter((item) => item.url !== nextPost.url && item.text !== nextPost.text);
    localStorage.setItem(CACHE_KEY, JSON.stringify([nextPost, ...recent].slice(0, MAX_RECENT_IMPORTS)));
    renderRecentImports();
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
      title.textContent = clean(post.text).slice(0, 92) || "Imported Facebook post";
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
    actions.appendChild(sendButton);
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

        if (score >= 25) {
          highlighted += 1;
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
          node.style.outline = "";
          node.style.background = "";
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
      const key = text.toLowerCase().slice(0, 180);
      if (seen.has(key)) continue;
      seen.add(key);
      posts.push(buildPostFromNode(node, score));
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

  async function sendPosts(posts) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts, searchPhrase: new URLSearchParams(location.search).get("q") || "" }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function sendSinglePost(node, score, sendButton) {
    const post = buildPostFromNode(node, score);
    sendButton.disabled = true;
    sendButton.textContent = "Sending...";
    try {
      const data = await sendPosts([post]);
      saveRecentImport(post);
      showStatus(`Sent this post to MarketVibe. Good: ${data.counts?.good || 0}.`);
      sendButton.textContent = "Sent to MarketVibe";
    } catch (error) {
      showStatus(`MarketVibe import failed: ${error && error.message ? error.message : "unknown error"}`);
      sendButton.disabled = false;
      sendButton.textContent = "Send this post to MarketVibe";
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
  renderRecentImports();
  markFeed();
  setInterval(markFeed, SCAN_INTERVAL_MS);
})();
