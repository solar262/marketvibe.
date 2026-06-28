export type RedditRadarAction = "Reply" | "ManualOnly" | "Skip";

export type RedditRadarIntel = {
  action: RedditRadarAction;
  intent: string;
  reply: string;
};

const LOW_INTEL_REPLY = "LOW INTEL — SKIP THIS ONE...\n\nThere isn't enough context or engagement to write a useful reply.\n\nLook for posts with a real question, clear problem, or active comments.";
const PAIN_SIGNAL_PATTERN = /\b(help|problem|struggling|struggle|stuck|traffic|not converting|no traffic|no sales|need advice|advice|recommend|looking for|can't|cant|conversion|clients|customers|leads|sales)\b/i;
const RSS_METADATA_PATTERN = /\bsubmitted by\b|\/u\/|\[comments\]|\bcomments link\b|\bpermalink\b|\breddit metadata\b|\bto \/r\/|\bfrom \/r\/|reddit\.com\/comments/i;

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

  const lines = decoded
    .split(/\r?\n/)
    .map((line) => compactRedditText(line))
    .filter((line) => line && !RSS_METADATA_PATTERN.test(line));
  const body = compactRedditText(lines.join(" "));

  if (!body) return "";
  if (RSS_METADATA_PATTERN.test(body)) return "";
  if (body.length < 120) return "";

  return body;
}

export function isObviousRssJunk(title: string, body: string) {
  const combined = compactRedditText(`${title} ${body}`);
  if (!combined) return true;
  const metadataOnly = RSS_METADATA_PATTERN.test(combined) && !PAIN_SIGNAL_PATTERN.test(combined) && !combined.includes("?");
  return metadataOnly || /^(submitted by|comments|permalink|reddit metadata)$/i.test(combined);
}

export function hasUsablePostSignal(title: string, body: string, comments: number, ups: number) {
  const text = `${title} ${body}`;
  return title.includes("?") || PAIN_SIGNAL_PATTERN.test(text) || comments > 0 || ups > 0;
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
