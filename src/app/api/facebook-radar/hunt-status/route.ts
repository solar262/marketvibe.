import { NextResponse } from "next/server";

type LeadHuntStatus = {
  active: boolean;
  paused: boolean;
  query: string;
  source: string;
  currentUrl: string;
  imported: number;
  skipped: number;
  duplicates: number;
  failed: number;
  status: string;
  errors: string[];
  updatedAt: string;
};

let latestStatus: LeadHuntStatus = {
  active: false,
  paused: false,
  query: "Not started",
  source: "Not started",
  currentUrl: "",
  imported: 0,
  skipped: 0,
  duplicates: 0,
  failed: 0,
  status: "Ready.",
  errors: [],
  updatedAt: "",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function asNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clean(value: unknown, limit = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(latestStatus, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<LeadHuntStatus>;
    latestStatus = {
      active: Boolean(payload.active),
      paused: Boolean(payload.paused),
      query: clean(payload.query || "Not started", 180),
      source: clean(payload.source || "Not started", 120),
      currentUrl: clean(payload.currentUrl, 700),
      imported: asNumber(payload.imported),
      skipped: asNumber(payload.skipped),
      duplicates: asNumber(payload.duplicates),
      failed: asNumber(payload.failed),
      status: clean(payload.status, 300),
      errors: Array.isArray(payload.errors) ? payload.errors.map((item) => clean(item, 180)).slice(0, 8) : [],
      updatedAt: clean(payload.updatedAt || new Date().toISOString(), 80),
    };
    return NextResponse.json(latestStatus, { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { ...latestStatus, error: error instanceof Error ? error.message : "Status update failed" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
