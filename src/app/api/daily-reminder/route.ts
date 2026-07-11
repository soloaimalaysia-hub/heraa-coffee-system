import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const authKey = req.headers.get("x-admin-key");
  if (authKey !== "heraa2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: gardens } = await supabase
    .rpc("heraa_screen_feed", { p_limit: 0 });

  const { data: members } = await supabase
    .from("heraa_members")
    .select("id, name, phone")
    .not("phone", "is", null)
    .not("phone", "like", "demo-%");

  if (!members || members.length === 0) {
    return NextResponse.json({ sent: 0, message: "No members with phone" });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const member of members) {
    const phone = member.phone;
    if (!phone || phone.startsWith("demo-")) continue;

    const msg = `☕ Heraa Coffee 早安！\n\n${member.name}，别忘了今天给你的咖啡豆浇水 🌱\n\n连续30天 = 免费咖啡一杯！\n\n👉 https://heraa-coffee-system.vercel.app/garden`;

    try {
      await sendWhatsApp(phone, msg);
      sent++;
    } catch (err: unknown) {
      errors.push(`${member.name}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json({ sent, errors });
}
