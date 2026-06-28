export type RedditRadarAction = "Reply" | "ManualOnly" | "Skip";

export type RedditRadarIntel = {
  action: RedditRadarAction;
  intent: string;
  reply: string;
};

const LOW_INTEL_REPLY = "LOW INTEL — SKIP THIS ONE...\n\nThere isn't enough context or engagement to write a useful reply.\n\nLook for posts with a real question, clear problem, or active comments.";

export function compactRedditText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 900);
}

export function hasAnyTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function hasAiIntent(text: string) {
  return /(^|[^a-z0-9])(?:ai|a\.i\.|artificial intelligence|chatgpt|automation|automated|agent|agents)(?=$|[^a-z0-9])/i.test(text);
}

export function cleanRssBody(value: string) {
  const decoded = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
  const metadataPattern = /\bsubmitted by\b|\/u\/|\[comments\]|\bcomments link\b|\bpermalink\b|\breddit metadata\b|\bto \/r\/|\bfrom \/r\/|reddit\.com\/comments/i;
  if (metadataPattern.test(decoded)) return "";

  const lines = decoded
    .split(/\r?\n/)
    .map((line) => compactRedditText(line))
    .filter((line) => line && !metadataPattern.test(line));
  const body = compactRedditText(lines.join(" "));

  if (!body) return "";
  if (metadataPattern.test(body)) return "";
  if (body.length < 120) return "";

  return body;
}

export function usefulBodyLength(body: string) {
  return compactRedditText(body).length;
}

export function isLowIntelPost(body: string, comments: number, ups: number) {
  return usefulBodyLength(body) < 120 && comments === 0 && ups === 0;
}

export function lowIntelIntel(): RedditRadarIntel {
  return {
    action: "Skip",
    intent: "low-intel",
    reply: LOW_INTEL_REPLY,
  };
}
