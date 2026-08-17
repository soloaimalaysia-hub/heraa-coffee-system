import { NextRequest, NextResponse } from "next/server";

// Meta calls this on webhook setup + periodically to verify ownership.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Meta posts inbound message/status events here. Skeleton only — just
// acknowledge receipt for now, real handling logic comes later.
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("WhatsApp webhook event:", JSON.stringify(body));

  return NextResponse.json({ status: "received" }, { status: 200 });
}
