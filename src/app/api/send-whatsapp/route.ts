import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const authKey = req.headers.get("x-admin-key");
  if (authKey !== "heraa2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to, message } = await req.json();

  if (!to || !message) {
    return NextResponse.json(
      { error: "Missing 'to' or 'message'" },
      { status: 400 }
    );
  }

  try {
    const result = await sendWhatsApp(to, message);
    return NextResponse.json({ success: true, sid: result.sid });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
