import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const authKey = req.headers.get("x-admin-key");
  if (authKey !== "heraa2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, target } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from("heraa_members")
    .select("id, name, phone")
    .not("phone", "is", null)
    .not("phone", "like", "demo-%");

  if (target === "low_balance") {
    const { data: wallets } = await supabase
      .from("heraa_wallets")
      .select("member_id")
      .lt("balance", 10);

    if (wallets && wallets.length > 0) {
      const ids = wallets.map((w) => w.member_id);
      query = query.in("id", ids);
    }
  }

  const { data: members } = await query;

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0, message: "No matching members" });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const member of members) {
    if (!member.phone || member.phone.startsWith("demo-")) continue;

    const personalMsg = `☕ Heraa Coffee\n\nHi ${member.name}！\n\n${message}`;

    try {
      await sendWhatsApp(member.phone, personalMsg);
      sent++;
    } catch (err: unknown) {
      errors.push(`${member.name}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ sent, total: members.length, errors });
}
