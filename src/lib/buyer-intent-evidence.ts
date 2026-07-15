import {
  calculateOpportunityScores,
  normalizeText,
  type CustomerSearchProfile,
  type OpportunityInput,
} from "@/lib/opportunity-quality";

const STOPWORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "into", "their", "your", "our", "business",
  "businesses", "service", "services", "company", "companies", "solution", "solutions", "provider", "providers",
  "buyer", "buyers", "market", "markets", "high", "value", "ideal", "target", "support", "managed",
]);

function normalizedPhrases(profile: CustomerSearchProfile) {
  return Array.from(new Set([
    profile.niche,
    profile.target_service,
    ...profile.target_industries,
  ].map(normalizeText).filter((value) => value.length >= 2)));
}

function significantTokens(profile: CustomerSearchProfile) {
  return Array.from(new Set(normalizedPhrases(profile)
    .join(" ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 3 && !STOPWORDS.has(value))));
}

function locationEvidence(evidence: string, profile: CustomerSearchProfile) {
  for (const rawLocation of profile.target_locations) {
    const location = normalizeText(rawLocation);
    if (location && evidence.includes(location)) return rawLocation;
    const parts = rawLocation
      .split(",")
      .map((part) => normalizeText(part))
      .filter((part) => part.length >= 3);
    if (parts.some((part) => evidence.includes(part))) return rawLocation;
  }
  return "";
}

export function groundOpportunityInEvidence(input: OpportunityInput, profile: CustomerSearchProfile) {
  const evidence = normalizeText([
    input.source_title,
    input.source_text,
    input.company_description,
  ].filter(Boolean).join(" "));
  const phrases = normalizedPhrases(profile);
  const tokens = significantTokens(profile);
  const exactPhrases = phrases.filter((phrase) => evidence.includes(phrase));
  const matchedTokens = tokens.filter((token) => evidence.includes(token));
  const requiredTokenMatches = Math.min(2, Math.max(1, tokens.length));
  const profileRelevant = exactPhrases.length > 0
    || matchedTokens.length >= requiredTokenMatches
    || matchedTokens.some((token) => token.length >= 8);
  const matchedLocation = locationEvidence(evidence, profile);

  const grounded: OpportunityInput = {
    ...input,
    company_industry: profileRelevant ? profile.niche : null,
    niche: profileRelevant ? profile.niche : null,
    company_location: matchedLocation || null,
    target_location: matchedLocation || null,
  };

  return {
    grounded,
    profileRelevant,
    matchedLocation,
    exactPhrases,
    matchedTokens,
    evidence,
  };
}

export function calculateEvidenceGroundedScores(input: OpportunityInput, profile: CustomerSearchProfile) {
  const grounding = groundOpportunityInEvidence(input, profile);
  return {
    grounding,
    scores: calculateOpportunityScores(grounding.grounded, profile),
  };
}
