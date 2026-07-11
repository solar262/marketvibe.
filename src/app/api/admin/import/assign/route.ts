import { NextResponse } from "next/server";
import { requireAdminJson, safeApiError } from "@/lib/admin-api";
import { assignProspects, removeAssignments } from "@/lib/sales-navigator-persistence";
import { isPremiumProductCode } from "@/lib/premium-products";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminJson();
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
    if (payload.action === "remove") {
      return NextResponse.json({ ok: true, result: await removeAssignments(ids) });
    }
    if (!isPremiumProductCode(payload.productCode)) {
      return NextResponse.json({ error: "Choose a valid product." }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      result: await assignProspects({
        ids,
        customerEmail: String(payload.customerEmail || ""),
        productCode: payload.productCode,
        adminConfirmedCustomer: Boolean(payload.adminConfirmedCustomer),
        adminNotes: String(payload.adminNotes || ""),
      }),
    });
  } catch (error) {
    return safeApiError(error, "Assignment failed.");
  }
}
