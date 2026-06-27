import type { AdminLeadSettings, BusinessLead, LeadAudit, LeadSearchInput, ScanFinding } from "./types";

export const countries = ["United Kingdom", "Ireland", "Germany", "France", "Spain", "United States"];

export const businessTypes = [
  "salons",
  "barbers",
  "cafes",
  "restaurants",
  "cleaners",
  "plumbers",
  "roofers",
  "dentists",
  "gyms",
  "local shops",
  "ecommerce stores",
];

export const serviceCategories = [
  "Web design",
  "SEO",
  "Social media",
  "Booking systems",
  "Google profile",
  "Reviews",
  "Local presence",
];

export const leadSettings: AdminLeadSettings = {
  dailySendLimit: 35,
  emailSendingEnabled: false,
  freeLeadLimit: 3,
  starterPrice: 19,
  proPrice: 49,
  reportPrice: 19,
  allowedCountries: countries,
  allowedCategories: businessTypes,
};

const baseNames = [
  "Northline",
  "Cedar & Co",
  "Bright Corner",
  "Urban Bloom",
  "Harbour House",
  "Oak Street",
  "Fresh Point",
  "Blue Lantern",
  "Riverside",
  "Luna Works",
];

export const leadCache = new Map<string, BusinessLead>();

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function hash(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function categorySingular(category: string) {
  return category.replace(/s$/, "");
}

function buildAudit(seed: number, name: string, input: LeadSearchInput): LeadAudit {
  const missingCta = seed % 2 === 0;
  const missingBooking = seed % 3 !== 0;
  const slow = seed % 4 === 0;
  const weakMeta = seed % 5 !== 0;
  const noReviews = seed % 3 === 1;
  const noSocial = seed % 4 === 1;
  const weakMobile = seed % 5 === 2;
  const oldYear = seed % 6 === 0 ? 2019 : undefined;

  const findings: ScanFinding[] = [
    { label: "No clear call-to-action", found: missingCta, weight: 20, detail: "The homepage does not make the next step obvious above the fold." },
    { label: "No booking/contact button", found: missingBooking, weight: 15, detail: "Visitors need to hunt for a booking or contact route." },
    { label: "Slow website estimate", found: slow, weight: 15, detail: "The page appears asset-heavy and likely needs performance work." },
    { label: "Missing or weak meta data", found: weakMeta, weight: 10, detail: "Search snippets are unlikely to communicate the service clearly." },
    { label: "No visible reviews", found: noReviews, weight: 10, detail: "Trust proof is weak or hidden on the first page." },
    { label: "No social links", found: noSocial, weight: 10, detail: "Social profiles are not easy for customers to verify." },
    { label: "Weak mobile layout", found: weakMobile, weight: 10, detail: "The layout likely needs mobile spacing, tap target, or speed improvements." },
    { label: "Outdated website signals", found: Boolean(oldYear), weight: 10, detail: "The visible copyright year suggests the site may not be maintained." },
  ];

  const score = Math.min(100, findings.filter((finding) => finding.found).reduce((total, finding) => total + finding.weight, 0));
  const issues = findings.filter((finding) => finding.found).slice(0, 5).map((finding) => `${finding.label}: ${finding.detail}`);
  const firstIssue = issues[0]?.split(":")[0].toLowerCase() || "online presence gaps";
  const priority = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const service = input.serviceCategory.toLowerCase();

  return {
    pageTitle: weakMeta ? "" : `${name} | ${categorySingular(input.businessType)} in ${input.city}`,
    metaDescription: weakMeta ? "" : `Local ${input.businessType} serving customers in ${input.city}.`,
    mobileFriendly: !weakMobile,
    pageSpeed: slow ? "slow" : seed % 2 === 0 ? "average" : "fast",
    sslPresent: seed % 7 !== 0,
    contactFormPresent: seed % 3 === 0,
    bookingButtonPresent: !missingBooking,
    phoneVisible: seed % 2 !== 1,
    emailVisible: seed % 3 !== 2,
    socialLinksVisible: !noSocial,
    reviewsVisible: !noReviews,
    clearCallToActionVisible: !missingCta,
    brokenLinks: seed % 5 === 0 ? 2 : seed % 4 === 0 ? 1 : 0,
    oldCopyrightYear: oldYear,
    score,
    findings,
    summary: `${name} looks like a ${priority}-priority opportunity because its site shows ${firstIssue} and could convert more local visitors with focused ${service} improvements.`,
    issues,
    serviceAngle: `Position a practical ${input.serviceCategory.toLowerCase()} improvement around clearer conversion paths, local trust signals, and easier customer contact.`,
    outreachMessage: `Hi ${name} team,\n\nI was checking ${input.businessType} in ${input.city} and noticed a few small website improvements that could make it easier for customers to contact or book with you. The main thing I spotted was ${firstIssue}.\n\nI put together a short, plain-English audit with the highest-impact fixes. Would you like me to send it over?\n\nBest,\n[Your name]\n\nYou are receiving this because your business contact details appear publicly listed. Reply "unsubscribe" and I will not contact you again.`,
    subjectLine: `Quick website audit for ${name}`,
    priority,
    suggestedOffer: `Offer a fixed-price ${input.serviceCategory.toLowerCase()} tune-up with clearer calls-to-action, contact visibility, local SEO basics, and review/social proof placement.`,
    fixChecklist: [
      "Add one prominent call-to-action above the fold.",
      "Make phone, email, and booking/contact routes visible on mobile.",
      "Write a specific page title and meta description for local search.",
      "Add reviews or testimonials near the main service offer.",
      "Compress large media and remove obvious broken links.",
    ],
  };
}

type OsmElement = {
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};

type WebsiteScan = {
  html: string;
  finalUrl: string;
  contactPageUrl: string;
  elapsedMs: number;
  brokenLinks: number;
};

function normalizeWebsite(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function stripHtml(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string, base: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

function extractFirst(pattern: RegExp, html: string) {
  return html.match(pattern)?.[1]?.trim() || "";
}

function extractEmails(text: string) {
  return Array.from(new Set(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []));
}

function extractPhones(text: string) {
  return Array.from(new Set(text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?){2,5}\d{2,5}/g) || [])).filter((phone) => phone.replace(/\D/g, "").length >= 8);
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function scanWebsite(website: string): Promise<WebsiteScan> {
  const started = Date.now();
  const response = await fetchWithTimeout(website, {
    headers: { "user-agent": "MarketVibeLeadEngine/1.0 (+https://marketvibe1.com)" },
    redirect: "follow",
  });
  const html = await response.text();
  const finalUrl = response.url || website;
  const contactHref = html.match(/href=["']([^"']*(?:contact|kontakt|book|booking|appointment|get-in-touch)[^"']*)["']/i)?.[1];
  const contactPageUrl = contactHref ? absoluteUrl(contactHref, finalUrl) : "";
  const internalLinks = Array.from(html.matchAll(/href=["']([^"'#]+)["']/gi)).slice(0, 8).map((match) => absoluteUrl(match[1], finalUrl)).filter(Boolean);
  let brokenLinks = 0;
  await Promise.all(internalLinks.map(async (link) => {
    try {
      const check = await fetchWithTimeout(link, { method: "HEAD", redirect: "follow" }, 3000);
      if (check.status >= 400) brokenLinks += 1;
    } catch {
      brokenLinks += 1;
    }
  }));
  return { html, finalUrl, contactPageUrl, elapsedMs: Date.now() - started, brokenLinks };
}

function buildLiveAudit(scan: WebsiteScan, name: string, input: LeadSearchInput, email?: string, phone?: string, socialLinks: string[] = []): LeadAudit {
  const html = scan.html;
  const text = stripHtml(html);
  const title = extractFirst(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const meta = extractFirst(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, html) || extractFirst(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, html);
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const cta = /\b(book|call now|get quote|request quote|contact us|schedule|reserve|start|buy|enquire|inquire)\b/i.test(text);
  const booking = /\b(book|booking|appointment|reserve|calendly|acuity|setmore|treatwell|fresha)\b/i.test(text + " " + html);
  const reviews = /\b(review|reviews|testimonial|testimonials|rated|stars|trustpilot|google reviews)\b/i.test(text);
  const contactForm = /<form[\s\S]*?(contact|message|email|name|submit)[\s\S]*?<\/form>/i.test(html);
  const visibleEmail = Boolean(email) || extractEmails(text).length > 0 || /mailto:/i.test(html);
  const visiblePhone = Boolean(phone) || extractPhones(text).length > 0 || /tel:/i.test(html);
  const copyright = Array.from(text.matchAll(/(?:copyright|©)\s*(20\d{2}|19\d{2})/gi)).map((match) => Number(match[1])).sort((a, b) => a - b)[0];
  const oldYear = copyright && copyright < new Date().getFullYear() - 2 ? copyright : undefined;
  const slow = scan.elapsedMs > 3500 || html.length > 450000;
  const weakMeta = !title || !meta;
  const weakMobile = !viewport;

  const findings: ScanFinding[] = [
    { label: "No clear call-to-action", found: !cta, weight: 20, detail: "The homepage does not make the next step obvious in the visible copy." },
    { label: "No booking/contact button", found: !booking && !contactForm, weight: 15, detail: "A booking, appointment, quote, or contact flow was not clearly detected." },
    { label: "Slow website estimate", found: slow, weight: 15, detail: `Homepage response and page size suggest performance work may be needed (${scan.elapsedMs}ms fetch).` },
    { label: "Missing or weak meta data", found: weakMeta, weight: 10, detail: "The page title or meta description was missing or hard to detect." },
    { label: "No visible reviews", found: !reviews, weight: 10, detail: "Review or testimonial proof was not detected on the scanned page." },
    { label: "No social links", found: socialLinks.length === 0 && !/(instagram|facebook|linkedin|tiktok|x\.com|twitter)\.com/i.test(html), weight: 10, detail: "Social profile links were not visible in the public data or scanned page." },
    { label: "Weak mobile layout", found: weakMobile, weight: 10, detail: "A viewport meta tag was not detected, which can indicate weak mobile support." },
    { label: "Outdated website signals", found: Boolean(oldYear), weight: 10, detail: oldYear ? `The visible copyright year appears to be ${oldYear}.` : "No outdated year detected." },
  ];

  const score = Math.min(100, findings.filter((finding) => finding.found).reduce((total, finding) => total + finding.weight, 0));
  const priority = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const issues = findings.filter((finding) => finding.found).slice(0, 5).map((finding) => `${finding.label}: ${finding.detail}`);
  const firstIssue = issues[0]?.split(":")[0].toLowerCase() || "online presence gaps";

  return {
    pageTitle: title,
    metaDescription: meta,
    mobileFriendly: viewport,
    pageSpeed: slow ? "slow" : scan.elapsedMs > 1800 ? "average" : "fast",
    sslPresent: scan.finalUrl.startsWith("https://"),
    contactFormPresent: contactForm,
    bookingButtonPresent: booking,
    phoneVisible: visiblePhone,
    emailVisible: visibleEmail,
    socialLinksVisible: socialLinks.length > 0 || /(instagram|facebook|linkedin|tiktok|x\.com|twitter)\.com/i.test(html),
    reviewsVisible: reviews,
    clearCallToActionVisible: cta,
    brokenLinks: scan.brokenLinks,
    oldCopyrightYear: oldYear,
    score,
    findings,
    summary: `${name} is a ${priority}-priority live opportunity from public business data because the scanned site shows ${firstIssue}.`,
    issues,
    serviceAngle: `Pitch a practical ${input.serviceCategory.toLowerCase()} improvement focused on conversion, contact visibility, local search basics, and trust signals.`,
    outreachMessage: `Hi ${name} team,\n\nI found your business through publicly available business listing data while checking ${input.businessType} in ${input.city}. I noticed a few website items that may make it harder for customers to contact or book with you, especially ${firstIssue}.\n\nI put together a short, plain-English audit with the main fixes. Would you like me to send it over?\n\nBest,\n[Your name]\n\nYou are receiving this because your business contact details appear publicly listed. Reply "unsubscribe" and I will not contact you again.`,
    subjectLine: `Quick website audit for ${name}`,
    priority,
    suggestedOffer: `Offer a fixed-price ${input.serviceCategory.toLowerCase()} tune-up covering CTA clarity, contact/booking visibility, local SEO metadata, mobile basics, and trust proof.`,
    fixChecklist: [
      "Make the primary contact or booking action visible near the top of the page.",
      "Confirm title and meta description are specific to the business and city.",
      "Add reviews or testimonials near the main service offer.",
      "Make phone, email, and contact form easy to use on mobile.",
      "Fix broken links and compress large homepage assets.",
    ],
  };
}

function overpassFilter(type: string) {
  const map: Record<string, string[]> = {
    salons: ['["shop"="hairdresser"]', '["shop"="beauty"]'],
    barbers: ['["shop"="hairdresser"]'],
    cafes: ['["amenity"="cafe"]'],
    restaurants: ['["amenity"="restaurant"]'],
    cleaners: ['["shop"="dry_cleaning"]', '["craft"="cleaner"]'],
    plumbers: ['["craft"="plumber"]'],
    roofers: ['["craft"="roofer"]'],
    dentists: ['["amenity"="dentist"]'],
    gyms: ['["leisure"="fitness_centre"]'],
    "local shops": ['["shop"]'],
    "ecommerce stores": ['["shop"]'],
  };
  return map[type] || ['["shop"]'];
}

async function geocodeCity(input: LeadSearchInput) {
  const params = new URLSearchParams({
    q: `${input.city}, ${input.country}`,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
  });
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "user-agent": "MarketVibeLeadEngine/1.0 (+https://marketvibe1.com)",
      "accept-language": "en",
    },
  }, 9000);
  if (!response.ok) throw new Error(`Nominatim geocode failed: ${response.status}`);
  const data = await response.json() as Array<{ boundingbox?: string[] }>;
  const bbox = data[0]?.boundingbox;
  if (!bbox) throw new Error("City was not found in Nominatim.");
  return bbox;
}

function buildOverpassQuery(bbox: string[], input: LeadSearchInput) {
  const [south, north, west, east] = bbox;
  const area = `${south},${west},${north},${east}`;
  const filters = overpassFilter(input.businessType);
  const selectors = filters.flatMap((filter) => [
    `node${filter}["name"]["website"](${area});`,
    `way${filter}["name"]["website"](${area});`,
    `relation${filter}["name"]["website"](${area});`,
    `node${filter}["name"]["contact:website"](${area});`,
    `way${filter}["name"]["contact:website"](${area});`,
    `relation${filter}["name"]["contact:website"](${area});`,
  ]).join("\n");
  return `[out:json][timeout:25];(${selectors});out center tags 25;`;
}

export async function searchLiveLeads(input: LeadSearchInput, limit = 8): Promise<{ leads: BusinessLead[]; sourceNote: string; sourceStatus: "live" | "demo"; sourceUrl?: string }> {
  const normalized: LeadSearchInput = {
    country: input.country || "United Kingdom",
    city: input.city || "Manchester",
    businessType: input.businessType || "salons",
    serviceCategory: input.serviceCategory || "Web design",
  };
  const bbox = await geocodeCity(normalized);
  const query = buildOverpassQuery(bbox, normalized);
  const sourceUrl = "https://overpass-api.de/api/interpreter";
  const response = await fetchWithTimeout(sourceUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "user-agent": "MarketVibeLeadEngine/1.0 (+https://marketvibe1.com)",
    },
    body: new URLSearchParams({ data: query }).toString(),
  }, 30000);
  if (!response.ok) throw new Error(`Overpass query failed: ${response.status}`);
  const data = await response.json() as { elements?: OsmElement[] };
  const elements = (data.elements || []).filter((element) => element.tags?.name).slice(0, limit * 2);
  const leads: BusinessLead[] = [];

  for (const element of elements) {
    if (leads.length >= limit) break;
    const tags = element.tags || {};
    const website = normalizeWebsite(tags.website || tags["contact:website"] || tags.url);
    if (!website) continue;
    try {
      const scan = await scanWebsite(website);
      const text = stripHtml(scan.html);
      const emails = [tags.email, tags["contact:email"], ...extractEmails(text)].filter(Boolean) as string[];
      const phones = [tags.phone, tags["contact:phone"], ...extractPhones(text)].filter(Boolean) as string[];
      if (!emails[0] && !phones[0]) continue;
      const socialLinks = [tags["contact:facebook"], tags["contact:instagram"], tags.facebook, tags.instagram].filter(Boolean) as string[];
      const name = tags.name;
      const slug = slugify(`${name}-${normalized.city}-${element.id}`);
      const lead: BusinessLead = {
        id: String(element.id),
        slug,
        businessName: name,
        website: scan.finalUrl,
        contactPageUrl: scan.contactPageUrl,
        publicEmail: emails[0],
        phone: phones[0],
        city: normalized.city,
        country: normalized.country,
        businessCategory: normalized.businessType,
        googleProfileUrl: `https://www.google.com/search?q=${encodeURIComponent(`${name} ${normalized.city}`)}`,
        socialLinks,
        source: "LIVE public OpenStreetMap business data via Nominatim geocoding and Overpass API. Website/contact details are only shown when publicly listed or visible on the public business website.",
        sourceStatus: "live",
        sourceUrl,
        audit: buildLiveAudit(scan, name, normalized, emails[0], phones[0], socialLinks),
      };
      leads.push(lead);
      leadCache.set(slug, lead);
    } catch {
      continue;
    }
  }

  return {
    leads: leads.sort((a, b) => b.audit.score - a.audit.score),
    sourceNote: "LIVE: Results come from public OpenStreetMap data via Nominatim and Overpass, then each listed website is scanned server-side.",
    sourceStatus: "live",
    sourceUrl,
  };
}

export function generateLeads(input: LeadSearchInput, limit = 8): BusinessLead[] {
  const normalized: LeadSearchInput = {
    country: input.country || "United Kingdom",
    city: input.city || "Manchester",
    businessType: input.businessType || "salons",
    serviceCategory: input.serviceCategory || "Web design",
  };

  return baseNames.slice(0, limit).map((name, index): BusinessLead => {
    const seed = hash(`${name}-${normalized.city}-${normalized.businessType}`) + index;
    const brand = `${name} ${categorySingular(normalized.businessType)}`;
    const domain = `${slugify(brand)}.${index % 3 === 0 ? "co.uk" : "com"}`;
    const slug = slugify(`${brand}-${normalized.city}`);

    return {
      id: slug,
      slug,
      businessName: brand,
      website: `https://${domain}`,
      contactPageUrl: `https://${domain}/contact`,
      publicEmail: seed % 4 === 0 ? `info@${domain}` : seed % 5 === 0 ? `contact@${domain}` : undefined,
      phone: seed % 3 !== 1 ? `+44 20 ${1000 + seed} ${2000 + index}` : undefined,
      city: normalized.city,
      country: normalized.country,
      businessCategory: normalized.businessType,
      googleProfileUrl: `https://www.google.com/search?q=${encodeURIComponent(`${brand} ${normalized.city}`)}`,
      socialLinks: seed % 4 === 1 ? [] : [`https://instagram.com/${slugify(brand)}`, `https://facebook.com/${slugify(brand)}`],
      source: "Demo public-source connector. Replace with Google Places, Yelp Fusion, DataForSEO, SerpAPI, or an approved local business data provider.",
      sourceStatus: "demo",
      audit: buildAudit(seed, brand, normalized),
    };
  }).sort((a, b) => b.audit.score - a.audit.score);
}

export const sampleLeads = generateLeads({
  country: "United Kingdom",
  city: "Manchester",
  businessType: "salons",
  serviceCategory: "Web design",
}, 10);

export function findLeadBySlug(slug: string) {
  return leadCache.get(slug) || sampleLeads.find((lead) => lead.slug === slug) || sampleLeads[0];
}
