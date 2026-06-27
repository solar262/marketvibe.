import { NextResponse } from "next/server";
import { addSuppression, verifyUnsubscribeToken } from "@/lib/outreach";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "";
  const token = url.searchParams.get("token") || "";

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  const result = await addSuppression(email, "unsubscribe", "unsubscribe_link");
  if (!result.ok) return new NextResponse("Unable to unsubscribe this address right now.", { status: 500 });

  return new NextResponse("This address has been unsubscribed and added to the suppression list.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

