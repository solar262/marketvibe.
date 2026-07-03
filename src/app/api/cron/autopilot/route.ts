import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AutopilotJobResult = {
  job: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
};

async function runScheduledBackendJob(startedAt: string): Promise<AutopilotJobResult> {
  // Safe placeholder for the scheduled backend job.
  // Add project-specific server-side work here later.
  const finishedAt = new Date().toISOString();
  const durationMs = Date.parse(finishedAt) - Date.parse(startedAt);

  return {
    job: "autopilot-placeholder",
    startedAt,
    finishedAt,
    durationMs,
  };
}

export async function GET() {
  const startedAt = new Date().toISOString();
  console.log(`[autopilot] started at ${startedAt}`);

  try {
    const result = await runScheduledBackendJob(startedAt);
    console.log(`[autopilot] completed at ${result.finishedAt} in ${result.durationMs}ms`);

    return NextResponse.json({
      ok: true,
      message: "Autopilot completed",
      result,
    });
  } catch (error) {
    const failedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : "Autopilot failed";
    console.error("[autopilot] failed", { startedAt, failedAt, error });

    return NextResponse.json(
      {
        ok: false,
        message,
        startedAt,
        failedAt,
      },
      { status: 500 },
    );
  }
}
