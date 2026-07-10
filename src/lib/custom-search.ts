export type SearchMode = "preset" | "custom";

export const CUSTOM_SEARCH_TERM_MAX_LENGTH = 180;

export function normalizeCustomSearchTerm(value: unknown, limit = CUSTOM_SEARCH_TERM_MAX_LENGTH) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function searchModeFromCustomTerm(value: unknown): SearchMode {
  return normalizeCustomSearchTerm(value) ? "custom" : "preset";
}

export function searchModeLabel(mode: SearchMode) {
  return mode === "custom" ? "Custom search mode" : "Preset mode";
}
