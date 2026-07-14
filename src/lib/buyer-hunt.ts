import { persistLeadSearch } from "./lead-persistence";
import type { BusinessLead, LeadSearchInput, LeadAudit, ScanFinding } from "./types";

export const buyerMarkets: LeadSearchInput[] = [
  { country: "United Kingdom", city: "Manchester", businessType: "web designers and SEO agencies", serviceCategory: "MarketVibe buyers" },
  { country: "United Kingdom", city: "London", businessType: "digital marketing agencies", serviceCategory: "MarketVibe buyers" },
  { country: "United Kingdom", city: "Birmingham", businessType: "social media agencies", serviceCategory: "MarketVibe buyers" },
  { country: "Ireland", city: "Dublin", businessType: "web design agencies", serviceCategory: "MarketVibe buyers" },
  { country: "Germany", city: "Berlin", businessType: "SEO and web design agencies", serviceCategory: "MarketVibe buyers" },
];

type OsmElement = {
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};

type BuyerWebsiteScan = {
  finalUrl: string;
  contactPageUrl: string;
  email?: string;
  phone?: string;
  pageText?: string;
};

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const buyerIcpKeywords = [
  "ai consultant",
  "artificial intelligence",
  "automation",
  "workflow automation",
  "data analytics",
  "business intelligence",
  "revops",
  "revenue operations",
  "crm consultant",
  "hubspot",
  "salesforce",
  "cybersecurity",
  "digital transformation",
  "executive recruitment",
  "lead generation",
  "demand generation",
  "b2b marketing",
  "digital marketing",
  "marketing agency",
  "growth consultant",
  "growth agency",
  "web development",
  "web design",
  "seo",
  "consultancy",
  "consultant",
  "agency",
];

const buyerIcpPattern = new RegExp(`\\b(${buyerIcpKeywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");

const nonBuyerPattern = /\b(restaurant|takeaway|cafe|bar|hotel|salon|hair|beauty|spa|dentist|clinic|doctor|plumber|electrician|roofer|builder|construction firm|estate agent|real estate agent|lettings|nursery|school|charity shop|garage|mechanic|retail store|florist|gym|fitness studio)\b/i;

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeWebsite(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmails(text: string) {
  return Array.from(new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []));
}

function extractPhones(text: string) {
  return Array.from(new Set(text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?){2,5}\d{2,5}/g) || []))
    .filter((phone) => phone.replace(/\D/g, "").length >= 8);
}

function buyerIcpText(tags: Record<string, string>, scan?: BuyerWebsiteScan) {
  return [
    tags.name,
    tags.office,
    tags.description,
    tags.brand,
    tags.operator,
    tags["contact:website"],
    tags.website,
    scan?.finalUrl,
    scan?.pageText?.slice(0, 6000),
  ].filter(Boolean).join(" ").toLowerCase();
}

function buyerIcpEvidence(tags: Record<string, string>, scan?: BuyerWebsiteScan) {
  const text = buyerIcpText(tags, scan);
  const match = text.match(buyerIcpPattern);
  return match?.[0] || "";
}

function passesBuyerIcpGate(tags: Record<string, string>, scan?: BuyerWebsiteScan) {
  const text = buyerIcpText(tags, scan);
  if (!text || nonBuyerPattern.test(text)) return false;
  return buyerIcpPattern.test(text);
}

function absoluteUrl(href: string, base: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function geocodeCity(input: LeadSearchInput) {
  const params = new URLSearchParams({
    q: `${input.city}, ${input.country}`,
    format: "jsonv2",
    limit: "1",
  });
  const response = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      "user-agent": "MarketVibeBuyerHunter/1.0 (+https://marketvibe.vercel.app)",
      "accept-language": "en",
    },
  });
  if (!response.ok) throw new Error(`Nominatim geocode failed: ${response.status}`);
  const data = await response.json() as Array<{ boundingbox?: string[] }>;
  const bbox = data[0]?.boundingbox;
  if (!bbox) throw new Error("Buyer market city was not found in Nominatim.");
  return bbox;
}

function buyerOverpassQuery(bbox: string[]) {
  const [south, north, west, east] = bbox;
  const area = `${south},${west},${north},${east}`;
  const keywordRegex = [
    "ai consultant",
    "artificial intelligence",
    "automation",
    "workflow automation",
    "data analytics",
    "business intelligence",
    "revops",
    "revenue operations",
    "crm consultant",
    "hubspot",
    "salesforce",
    "cybersecurity",
    "digital transformation",
    "executive recruitment",
    "lead generation",
    "demand generation",
    "b2b marketing",
    "digital marketing",
    "marketing agency",
    "growth consultant",
    "web development",
    "web design",
    "seo",
  ].join("|");
  const selectors = [
    `node["name"~"${keywordRegex}",i]["website"](${area});`,
    `way["name"~"${keywordRegex}",i]["website"](${area});`,
    `relation["name"~"${keywordRegex}",i]["website"](${area});`,
    `node["name"~"${keywordRegex}",i]["contact:website"](${area});`,
    `way["name"~"${keywordRegex}",i]["contact:website"](${area});`,
    `relation["name"~"${keywordRegex}",i]["contact:website"](${area});`,
    `node["office"~"advertising_agency|company|it|consulting|recruitment",i]["website"](${area});`,
    `way["office"~"advertising_agency|company|it|consulting|recruitment",i]["website"](${area});`,
    `relation["office"~"advertising_agency|company|it|consulting|recruitment",i]["website"](${area});`,
  ].join("\n");
  return `[out:json][timeout:25];(${selectors});out center tags 30;`;
}

async function fetchOverpass(query: string) {
  const errors: string[] = [];

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "user-agent": "MarketVibeBuyerHunter/1.0 (+https://marketvibe1.com)",
        },
        body: new URLSearchParams({ data: query }).toString(),
      }, 30000);

      if (!response.ok) {
        errors.push(`${endpoint} returned ${response.status}`);
        continue;
      }

      const data = await response.json() as { elements?: OsmElement[] };
      return { data, sourceUrl: endpoint };
    } catch (error) {
      errors.push(`${endpoint} failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  throw new Error(`Overpass buyer query failed on all endpoints: ${errors.join("; ")}`);
}

function buyerFitAudit(name: string, website: string, city: string, email?: string, phone?: string, contactPageUrl?: string, icpEvidence = "specialist B2B service keyword"): LeadAudit {
  const findings: ScanFinding[] = [
    { label: "Likely specialist B2B service seller", found: Boolean(icpEvidence), weight: 30, detail: `The public listing or website matched MarketVibe buyer evidence: ${icpEvidence}.` },
    { label: "Has business website", found: Boolean(website), weight: 20, detail: "A public website is available for manual review before contact." },
    { label: "Contact route detected", found: Boolean(email || phone || contactPageUrl), weight: 20, detail: "A public contact path was detected from the listing or website scan." },
    { label: "Relevant MarketVibe pitch angle", found: true, weight: 20, detail: "This prospect may benefit from evidence-backed company opportunities rather than generic contact lists." },
    { label: "Autonomous compliance gate", found: Boolean(email), weight: 10, detail: "The prospect can enter the automated UK/US B2B outbound gate only when a business email, source URL, and evidence are present." },
  ];
  const score = findings.filter((finding) => finding.found).reduce((total, finding) => total + finding.weight, 0);
  const issues = [
    `Buyer fit: likely specialist consultant or boutique agency prospect; matched ${icpEvidence}.`,
    "Pitch angle: MarketVibe can save them prospecting time by providing source-backed opportunities and outreach angles.",
    "Autonomous gate: proceed only if the public source, business email, and UK/US B2B status pass.",
  ];

  return {
    pageTitle: `${name} buyer prospect`,
    metaDescription: `Potential MarketVibe buyer in ${city}`,
    mobileFriendly: true,
    pageSpeed: "average",
    sslPresent: website.startsWith("https://"),
    contactFormPresent: Boolean(contactPageUrl),
    bookingButtonPresent: false,
    phoneVisible: Boolean(phone),
    emailVisible: Boolean(email),
    socialLinksVisible: false,
    reviewsVisible: false,
    clearCallToActionVisible: true,
    brokenLinks: 0,
    score,
    findings,
    summary: `${name} looks like a potential MarketVibe buyer because it appears to sell specialist B2B services that need a recurring flow of evidence-backed opportunities.`,
    issues,
    serviceAngle: "MarketVibe buyer prospect: sell a Proof Pack first, then Radar if they need recurring source-backed opportunity flow.",
    outreachMessage: `Hi ${name} team,\n\nI noticed a public signal suggesting your business may sell specialist B2B services: ${icpEvidence}.\n\nMarketVibe helps consultants and boutique agencies find companies with a documented reason to engage, rather than another contact database.\n\nWould it be useful if I sent a redacted opportunity example for your market?\n\nBest,\nMarketVibe\n\nYou are receiving this because your business contact details appear publicly listed. Reply "unsubscribe" and I will not contact you again.`,
    subjectLine: "Source-backed opportunities for your market",
    priority: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
    suggestedOffer: "Offer a redacted opportunity example, then point qualified buyers to the 99 euro Proof Pack.",
    fixChecklist: [
      "Confirm the prospect is a UK/US B2B service seller from the public source.",
      "Use the original public source URL and signal in the outbound record.",
      "Send only through the suppression-aware cold outbound sequence.",
      "Point them to the Proof Pack before pitching a recurring subscription.",
    ],
  };
}

async function scanBuyerWebsite(website: string) {
  try {
    const response = await fetchWithTimeout(website, {
      headers: { "user-agent": "MarketVibeBuyerHunter/1.0 (+https://marketvibe.vercel.app)" },
      redirect: "follow",
    }, 5000);
    const html = await response.text();
    const text = stripHtml(html);
    const contactHref = html.match(/href=["']([^"']*(?:contact|kontakt|get-in-touch|about)[^"']*)["']/i)?.[1];
    return {
      finalUrl: response.url || website,
      contactPageUrl: contactHref ? absoluteUrl(contactHref, response.url || website) : "",
      email: extractEmails(text)[0],
      phone: extractPhones(text)[0],
      pageText: text,
    };
  } catch {
    return { finalUrl: website, contactPageUrl: "", email: undefined, phone: undefined, pageText: "" };
  }
}

async function buyerFromElement(element: OsmElement, market: LeadSearchInput, sourceUrl: string) {
  const tags = element.tags || {};
  const website = normalizeWebsite(tags.website || tags["contact:website"] || tags.url);
  if (!website) return null;

  const scanned = await scanBuyerWebsite(website);
  if (!passesBuyerIcpGate(tags, scanned)) return null;

  const email = tags.email || tags["contact:email"] || scanned.email;
  if (!email) return null;

  const phone = tags.phone || tags["contact:phone"] || scanned.phone;
  const name = tags.name || "Unknown buyer prospect";
  const slug = slugify(`buyer-${name}-${market.city}-${element.id}`);
  const icpEvidence = buyerIcpEvidence(tags, scanned) || market.businessType;

  return {
    id: `buyer-${element.id}`,
    slug,
    businessName: name,
    website: scanned.finalUrl,
    contactPageUrl: scanned.contactPageUrl,
    publicEmail: email,
    phone,
    city: market.city,
    country: market.country,
    businessCategory: "MarketVibe buyer prospect",
    googleProfileUrl: `https://www.google.com/search?q=${encodeURIComponent(`${name} ${market.city}`)}`,
    socialLinks: [tags.facebook, tags.instagram, tags.linkedin].filter(Boolean) as string[],
    source: "LIVE public buyer prospect data from OpenStreetMap via Nominatim and Overpass, with business website contact details scanned server-side.",
    sourceStatus: "live" as const,
    sourceUrl: scanned.contactPageUrl || scanned.finalUrl || sourceUrl,
    audit: buyerFitAudit(name, scanned.finalUrl, market.city, email, phone, scanned.contactPageUrl, icpEvidence),
  };
}

export async function runBuyerHunt({ markets = 1, leads = 5 }: { markets?: number; leads?: number }) {
  const selectedMarkets = buyerMarkets.slice(0, Math.max(1, Math.min(markets, buyerMarkets.length)));
  const leadLimit = Math.max(1, Math.min(leads, 10));
  const results = [] as Array<{
    market: LeadSearchInput;
    saved: boolean;
    savedSearchRunId?: string;
    error?: string;
    leadCount: number;
    buyerSlugs: string[];
  }>;

  for (const market of selectedMarkets) {
    try {
      const bbox = await geocodeCity(market);
      const query = buyerOverpassQuery(bbox);
      const { data, sourceUrl } = await fetchOverpass(query);
      const elements = (data.elements || []).filter((element) => element.tags?.name).slice(0, leadLimit * 3);
      const buyers: BusinessLead[] = [];

      for (const element of elements) {
        if (buyers.length >= leadLimit) break;
        const tags = element.tags || {};
        const website = normalizeWebsite(tags.website || tags["contact:website"] || tags.url);
        if (!website) continue;
        const scanned = await scanBuyerWebsite(website);
        if (!passesBuyerIcpGate(tags, scanned)) continue;
        const email = tags.email || tags["contact:email"] || scanned.email;
        if (!email) continue;
        const phone = tags.phone || tags["contact:phone"] || scanned.phone;
        const name = tags.name || "Unknown buyer prospect";
        const slug = slugify(`buyer-${name}-${market.city}-${element.id}`);
        const icpEvidence = buyerIcpEvidence(tags, scanned) || market.businessType;

        buyers.push({
          id: `buyer-${element.id}`,
          slug,
          businessName: name,
          website: scanned.finalUrl,
          contactPageUrl: scanned.contactPageUrl,
          publicEmail: email,
          phone,
          city: market.city,
          country: market.country,
          businessCategory: "MarketVibe buyer prospect",
          googleProfileUrl: `https://www.google.com/search?q=${encodeURIComponent(`${name} ${market.city}`)}`,
          socialLinks: [tags.facebook, tags.instagram, tags.linkedin].filter(Boolean) as string[],
          source: "LIVE public buyer prospect data from OpenStreetMap via Nominatim and Overpass. This route looks for agencies, web designers, SEO providers, marketing companies, and related service sellers that may buy MarketVibe.",
          sourceStatus: "live",
          sourceUrl,
          audit: buyerFitAudit(name, scanned.finalUrl, market.city, email, phone, scanned.contactPageUrl, icpEvidence),
        });
      }

      const persistence = await persistLeadSearch({
        input: market,
        leads: buyers,
        sourceStatus: buyers.length ? "live" : "demo",
        sourceNote: buyers.length
          ? "LIVE BUYER HUNT: Potential MarketVibe buyers found from public business data. Review before outreach."
          : "No buyer prospects found for this market in this run.",
        sourceUrl,
      });

      results.push({
        market,
        saved: persistence.saved,
        savedSearchRunId: persistence.searchRunId,
        error: persistence.error,
        leadCount: buyers.length,
        buyerSlugs: buyers.map((buyer) => buyer.slug),
      });
    } catch (error) {
      results.push({
        market,
        saved: false,
        error: error instanceof Error ? error.message : "Unknown buyer hunt error.",
        leadCount: 0,
        buyerSlugs: [],
      });
    }
  }

  return results;
}

export async function discoverBuyerProspects({
  markets = buyerMarkets,
  leadsPerMarket = 5,
}: {
  markets?: LeadSearchInput[];
  leadsPerMarket?: number;
}) {
  const selectedMarkets = markets.slice(0, Math.max(1, Math.min(markets.length, 12)));
  const leadLimit = Math.max(1, Math.min(leadsPerMarket, 10));
  const discovered: BusinessLead[] = [];
  const errors: Array<{ market: LeadSearchInput; error: string }> = [];

  for (const market of selectedMarkets) {
    try {
      const bbox = await geocodeCity(market);
      const query = buyerOverpassQuery(bbox);
      const { data, sourceUrl } = await fetchOverpass(query);
      const elements = (data.elements || []).filter((element) => element.tags?.name).slice(0, leadLimit * 5);
      const buyers: BusinessLead[] = [];

      const scannedBuyers = (await Promise.all(elements.map((element) => buyerFromElement(element, market, sourceUrl))))
        .filter(Boolean) as BusinessLead[];

      for (const buyer of scannedBuyers) {
        if (buyers.length >= leadLimit) break;
        const normalizedEmail = buyer.publicEmail?.toLowerCase();
        if (!normalizedEmail) continue;
        if (discovered.some((existing) => existing.publicEmail?.toLowerCase() === normalizedEmail)) continue;
        if (buyers.some((existing) => existing.publicEmail?.toLowerCase() === normalizedEmail)) continue;
        buyers.push(buyer);
      }

      discovered.push(...buyers);
    } catch (error) {
      errors.push({
        market,
        error: error instanceof Error ? error.message : "Unknown buyer discovery error.",
      });
    }
  }

  return { discovered, errors };
}
