(() => {
  const API_URL = "https://www.marketvibe1.com/api/facebook-radar/import";
  if (document.getElementById("marketvibe-import-button")) return;

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
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

  function isExactPostUrl(url) {
    const href = clean(url);
    if (!href) return false;
    return /\/posts\/\d+/i.test(href) ||
      /\/groups\/[^/?#]+\/posts\/\d+/i.test(href) ||
      /\/groups\/[^/?#]+\/permalink\/\d+/i.test(href) ||
      /story_fbid=\d+/i.test(href) ||
      /\/permalink\/\d+/i.test(href);
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
    const links = Array.from(node.querySelectorAll("a[href]"))
      .map((link) => normalizeFacebookUrl(link.getAttribute("href")))
      .filter((url) => url.includes("facebook.com") || url.startsWith(location.origin));

    const exact = links.find((url) => isExactPostUrl(url));
    if (exact) return exact;

    const nonGeneric = links.find((url) => !isGenericFacebookUrl(url) && !/\/groups\/?$|\/pages\/?$/i.test(url));
    return nonGeneric || location.href;
  }

  function markFeed() {
    const nodes = Array.from(document.querySelectorAll('[role="article"], div[aria-posinset]'));
    for (const node of nodes) {
      if (node.dataset.marketvibeProcessed === "1") continue;
      node.dataset.marketvibeProcessed = "1";
      const text = clean(node.innerText).slice(0, 2200);
      const score = scorePost(text);
      if (score >= 25) {
        node.style.outline = "3px solid #10b981";
        node.style.background = "rgba(16,185,129,0.06)";
        const badge = document.createElement("div");
        badge.textContent = `MarketVibe Buyer Intent ${score}`;
        badge.style.cssText = "position:sticky;top:0;z-index:9999;background:#10b981;color:#041018;font:700 12px Arial;padding:6px 10px;border-radius:8px;margin:6px;display:inline-block;";
        node.prepend(badge);
      } else {
        node.style.opacity = "0.12";
        node.style.filter = "grayscale(1)";
      }
    }
  }

  function collectVisibleCards() {
    const nodes = Array.from(document.querySelectorAll('[role="article"], div[aria-posinset]'));
    const seen = new Set();
    const posts = [];
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight * 2) continue;
      const text = clean(node.innerText).slice(0, 2200);
      const score = scorePost(text);
      if (score < 25) continue;
      const key = text.toLowerCase().slice(0, 180);
      if (seen.has(key)) continue;
      seen.add(key);
      posts.push({
        text,
        score,
        sourceName: clean(document.title.replace(/\| Facebook$/i, "")),
        author: text.split(" ").slice(0, 8).join(" "),
        dateText: "",
        reactions: "",
        comments: "",
        url: extractPostUrl(node),
      });
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

  async function sendVisible() {
    const posts = collectVisibleCards();
    if (!posts.length) {
      showStatus("No strong buyer-intent posts detected on screen.");
      return;
    }
    button.disabled = true;
    button.textContent = "Sending to MarketVibe...";
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts, searchPhrase: new URLSearchParams(location.search).get("q") || "" }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
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
  markFeed();
  setInterval(markFeed, 2500);
})();
