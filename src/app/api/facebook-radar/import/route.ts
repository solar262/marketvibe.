import { NextResponse } from "next/server";
import { scoreImportedFacebookPosts, type ImportedFacebookPost } from "@/lib/facebook-radar-import";

type ImportPayload = {
  posts?: ImportedFacebookPost[];
  searchPhrase?: string;
  targetBuyer?: string;
  painKeywords?: string;
};

type ImportResponse = {
  source: string;
  counts: {
    imported: number;
    scored: number;
    good: number;
    manualOnly: number;
    skipped: number;
  };
  results: ReturnType<typeof scoreImportedFacebookPosts>;
  skipped: ReturnType<typeof scoreImportedFacebookPosts>;
  importedAt: string;
};

let latestImport: ImportResponse | null = null;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  return NextResponse.json(
    latestImport || {
      source: "facebook-visible-import",
      counts: { imported: 0, scored: 0, good: 0, manualOnly: 0, skipped: 0 },
      results: [],
      skipped: [],
      importedAt: "",
    },
    { headers: CORS_HEADERS },
  );
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ImportPayload;
    const scored = scoreImportedFacebookPosts({
      posts: Array.isArray(payload.posts) ? payload.posts : [],
      searchPhrase: payload.searchPhrase,
      targetBuyer: payload.targetBuyer,
      painKeywords: payload.painKeywords,
    });

    const visible = scored.filter((post) => post.label === "Good" || post.label === "ManualOnly").slice(0, 5);
    const skipped = scored.filter((post) => post.label === "Skip" || post.label === "Bad fit");

    latestImport = {
      source: "facebook-visible-import",
      counts: {
        imported: Array.isArray(payload.posts) ? payload.posts.length : 0,
        scored: scored.length,
        good: scored.filter((post) => post.label === "Good").length,
        manualOnly: scored.filter((post) => post.label === "ManualOnly").length,
        skipped: skipped.length,
      },
      results: visible,
      skipped,
      importedAt: new Date().toISOString(),
    };

    return NextResponse.json(latestImport, { headers: CORS_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        source: "facebook-visible-import",
        error: error instanceof Error ? error.message : "Import failed",
        counts: { imported: 0, scored: 0, good: 0, manualOnly: 0, skipped: 0 },
        results: [],
        skipped: [],
        importedAt: new Date().toISOString(),
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
