import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import {
  classifyMarketVibeCommand,
  executeMarketVibeCommand,
  supportedMarketVibeCommands,
} from "@/lib/allrounder-marketvibe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function unauthorized() {
  if (await requireAdminApi()) return null;
  return NextResponse.json({ ok: false, error: "Admin authentication required." }, { status: 401 });
}

export async function GET() {
  const denied = await unauthorized();
  if (denied) return denied;

  const result = await executeMarketVibeCommand("Show live health");
  return NextResponse.json({
    ...result,
    supportedCommands: supportedMarketVibeCommands,
  });
}

export async function POST(request: Request) {
  const denied = await unauthorized();
  if (denied) return denied;

  let body: { command?: string; approved?: boolean };
  try {
    body = await request.json() as { command?: string; approved?: boolean };
  } catch {
    return NextResponse.json({ ok: false, error: "A JSON request body is required." }, { status: 400 });
  }

  const command = String(body.command || "").trim();
  if (!command) {
    return NextResponse.json({ ok: false, error: "Enter a command first." }, { status: 400 });
  }

  const plan = classifyMarketVibeCommand(command);
  if (plan.action === "unsupported") {
    return NextResponse.json({
      ok: false,
      executed: false,
      action: plan.action,
      message: "This command is not connected to a real MarketVibe operation. Nothing was executed.",
      supportedCommands: supportedMarketVibeCommands,
    }, { status: 422 });
  }

  if (plan.requiresApproval && body.approved !== true) {
    return NextResponse.json({
      ok: true,
      executed: false,
      requiresApproval: true,
      plan,
      command,
      message: plan.sendsEmail
        ? "Approval is required because this command can publish data or send delivery emails."
        : "Approval is required because this command changes live MarketVibe data.",
    });
  }

  try {
    const result = await executeMarketVibeCommand(command);
    return NextResponse.json({
      ...result,
      approved: plan.requiresApproval,
      verification: "The response contains the direct result returned by the existing MarketVibe operation.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MarketVibe operation failed.";
    return NextResponse.json({
      ok: false,
      executed: false,
      action: plan.action,
      message,
    }, { status: 500 });
  }
}
