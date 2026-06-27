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
  const keywordRegex = "web design|webdesign|seo|digital marketing|marketing agency|creative agency|social media|branding agency|advertising agency|lead generation";
  const selectors = [
    `node["name"~"${keywordRegex}",i]["website"](${area});`,
    `way["name"~"${keywordRegex}",i]["website"](${area});`,
    `relation["name"~"${keywordRegex}",i]["website"](${area});`,
    `node["name"~"${keywordRegex}",i]["contact:website"](${area});`,
    `way["name"~"${keywordRegex}",i]["contact:website"](${area});`,
    `relation["name"~"${keywordRegex}",i]["contact:website"](${area});`,
    `node["office"~"advertising_agency|company|it|consulting",i]["website"](${area});`,
    `way["office"~"advertising_agency|company|it|consulting",i]["website"](${area});`,
    `relation["office"~"advertising_agency|company|it|consulting",i]["website"](${area});`,
  ].join("\n");
  return `[out:json][timeout:25];(${selectors});out center tags 30;`;
}

function buyerFitAudit(name: string, website: string, city: string, email?: string, phone?: string, contactPageUrl?: string): LeadAudit {
  const findings: ScanFinding[] = [
    { label: "Likely service seller", found: true, weight: 30, detail: "The public listing/website appears to match web, SEO, marketing, social, branding, or agency keywords." },
    { label: "Has business website", found: Boolean(website), weight: 20, detail: "A public website is available for manual review before contact." },
    { label: "Contact route detected", found: Boolean(email || phone || contactPageUrl), weight: 20, detail: "A public contact path was detected from the listing or website scan." },
    { label: "Relevant MarketVibe pitch angle", found: true, weight: 20, detail: "This prospect may benefit from pre-built local business audits and ranked opportunity packs." },
    { label: "Manual outreach required", found: true, weight: 10, detail: "Automatic email sending is not enabled; this buyer should be reviewed before any message is sent." },
  ];
  const score = findings.filter((finding) => finding.found).reduce((total, finding) => total + finding.weight, 0);
  const issues = [
    "Buyer fit: likely web, SEO, marketing, social media, branding, or agency prospect.",
    "Pitch angle: MarketVibe can save them prospecting time by giving them ranked local business opportunities.",
    "Manual review required before contact; no automated email sending is enabled.",
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
    summary: `${name} looks like a potential MarketVibe buyer because it appears to sell web, SEO, marketing, social, branding, or local business services.`,
    issues,
    serviceAngle: "MarketVibe buyer prospect: sell time-saving local lead packs and audit reports to this agency/freelancer.",
    outreachMessage: `Hi ${name} team,\n\nI built MarketVibe, a lead engine that finds local businesses with weak website, SEO, booking, and trust signals, then turns them into ranked audit leads.\n\nIt is designed for web designers, SEO freelancers, social media managers, and agencies who want faster prospecting without manually searching business after business.\n\nWould you like to try a few free lead previews?\n\nBest,\n[Your name]\n\nYou are receiving this because your business contact details appear publicly listed. Reply "unsubscribe" and I will not contact you again.`,
    subjectLine: "Local audit leads for your agency",
    priority: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
    suggestedOffer: "Offer 3 free MarketVibe lead previews, then point them to Starter or Pro if they want monthly lead packs.",
    fixChecklist: [
      "Manually review the buyer website before contacting.",
      "Check whether they sell web design, SEO, social media, branding, or local marketing services.",
      "Send a short, honest message with a clear opt-out.",
      "Point them to /lead-packs or /pricing, not a generic homepage.",
    ],
  };
}

async function scanBuyerWebsite(website: string) {
  try {
    const response = await fetchWithTimeout(website, {
      headers: { "user-agent": "MarketVibeBuyerHunter/1.0 (+https://marketvibe.vercel.app)" },
      redirect: "follow",
    }, 8000);
    const html = await response.text();
    const text = stripHtml(html);
    const contactHref = html.match(/href=["']([^"']*(?:contact|kontakt|get-in-touch|about)[^"']*)["']/i)?.[1];
    return {
      finalUrl: response.url || website,
      contactPageUrl: contactHref ? absoluteUrl(contactHref, response.url || website) : "",
      email: extractEmails(text)[0],
      phone: extractPhones(text)[0],
    };
  } catch {
    return { finalUrl: website, contactPageUrl: "", email: undefined, phone: undefined };
  }
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
      const sourceUrl = "https://overpass-api.de/api/interpreter";
      const response = await fetchWithTimeout(sourceUrl, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "user-agent": "MarketVibeBuyerHunter/1.0 (+https://marketvibe.vercel.app)",
        },
        body: new URLSearchParams({ data: query }).toString(),
      }, 30000);

      if (!response.ok) throw new Error(`Overpass buyer query failed: ${response.status}`);
      const data = await response.json() as { elements?: OsmElement[] };
      const elements = (data.elements || []).filter((element) => element.tags?.name).slice(0, leadLimit * 3);
      const buyers: BusinessLead[] = [];

      for (const element of elements) {
        if (buyers.length >= leadLimit) break;
        const tags = element.tags || {};
        const website = normalizeWebsite(tags.website || tags["contact:website"] || tags.url);
        if (!website) continue;
        const scanned = await scanBuyerWebsite(website);
        const email = tags.email || tags["contact:email"] || scanned.email;
        const phone = tags.phone || tags["contact:phone"] || scanned.phone;
        const name = tags.name || "Unknown buyer prospect";
        const slug = slugify(`buyer-${name}-${market.city}-${element.id}`);

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
          audit: buyerFitAudit(name, scanned.finalUrl, market.city, email, phone, scanned.contactPageUrl),
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
