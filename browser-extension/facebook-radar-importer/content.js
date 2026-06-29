(() => {
  const API_URL = "https://www.marketvibe1.com/api/facebook-radar/import";
  if (document.getElementById("marketvibe-import-button")) return;

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function looksUseful(text) {
    if (text.length < 40) return false;
    return /\b(client|clients|lead|leads|traffic|sales|outreach|marketing|website|seo|shopify|customers|business|prospecting|not working|no one replies|hiring|job|guaranteed leads|dm me)\b/i.test(text);
  }

  function collectVisibleCards() {
    const nodes = Array.from(document.querySelectorAll('[role="article"], div[aria-posinset]'));
    const seen = new Set();
    const posts = [];

    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight * 2) continue;

      const text = clean(node.innerText).slice(0, 1600);
      if (!looksUseful(text)) continue;

      const key = text.toLowerCase().slice(0, 180);
      if (seen.has(key)) continue;
      seen.add(key);

      const link = node.querySelector('a[href*="/posts/"], a[href*="/groups/"], a[href*="story_fbid"], a[href*="permalink"]');
      const url = link ? new URL(link.getAttribute("href"), location.origin).toString() : location.href;

      posts.push({
        text,
        sourceName: clean(document.title.replace(/\| Facebook$/i, "")),
        author: text.split(" ").slice(0, 8).join(" "),
        dateText: "",
        reactions: "",
        comments: "",
        url,
      });

      if (posts.length >= 10) break;
    }

    return posts;
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
    button.disabled = true;
    button.textContent = "Sending to MarketVibe...";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts,
          searchPhrase: new URLSearchParams(location.search).get("q") || "",
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      showStatus(
        `Imported ${posts.length} visible posts. Good: ${data.counts?.good || 0}. Skipped: ${data.counts?.skipped || 0}. Open MarketVibe Facebook Radar to review.`
      );
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
})();