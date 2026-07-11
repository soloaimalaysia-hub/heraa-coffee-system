import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/twilio";

const STAGE_EMOJI: Record<string, string> = {
  seed: "🌰",
  sprout: "🌱",
  flower: "🌿",
  ready: "☕",
};

async function runReminder() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: targets } = await supabase.rpc("heraa_get_reminder_targets");

  if (!targets || targets.length === 0) {
    return { sent: 0, total: 0, errors: [], message: "No members need reminding" };
  }

  let sent = 0;
  const errors: string[] = [];

  for (const t of targets) {
    const daysLeft = 30 - t.day_count;
    const emoji = STAGE_EMOJI[t.stage] || "🌱";

    const msg =
      `☕ Heraa Coffee 早安！\n\n` +
      `${t.name}，你的咖啡豆 ${emoji} 等你来浇水！\n\n` +
      `📊 目前进度：第 ${t.day_count} 天 / 30 天\n` +
      `🎯 还差 ${daysLeft} 天就能换免费咖啡！\n\n` +
      `👉 立刻浇水：https://heraa-coffee-system.vercel.app/garden`;

    try {
      const result = await sendWhatsApp(t.phone, msg);

      await supabase.rpc("heraa_log_whatsapp", {
        p_member_id: t.member_id,
        p_phone: t.phone,
        p_message_type: "daily_reminder",
        p_message_body: msg,
        p_twilio_sid: result.sid,
        p_status: "sent",
      });

      sent++;
    } catch (err: unknown) {
      const errMsg = (err as Error).message;
      errors.push(`${t.name}: ${errMsg}`);

      await supabase.rpc("heraa_log_whatsapp", {
        p_member_id: t.member_id,
        p_phone: t.phone,
        p_message_type: "daily_reminder",
        p_message_body: msg,
        p_twilio_sid: null,
        p_status: "failed",
        p_error: errMsg,
      });
    }
  }

  return { sent, total: targets.length, errors };
}

// Vercel Cron hits GET
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runReminder();
  return NextResponse.json(result);
}

// Admin manual trigger hits POST
export async function POST(req: NextRequest) {
  const authKey = req.headers.get("x-admin-key");
  if (authKey !== "heraa2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runReminder();
  return NextResponse.json(result);
}
