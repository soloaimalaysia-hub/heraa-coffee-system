import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/twilio";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const authKey = req.headers.get("x-admin-key");
  if (authKey !== "heraa2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testTo = process.env.TWILIO_WHATSAPP_TO!;

  const msg =
    `☕ Heraa Coffee 早安！\n\n` +
    `Captain K，你的咖啡豆 🌱 等你来浇水！\n\n` +
    `📊 目前进度：第 5 天 / 30 天\n` +
    `🎯 还差 25 天就能换免费咖啡！\n\n` +
    `👉 立刻浇水：https://heraa-coffee-system.vercel.app/garden\n\n` +
    `---\n🧪 这是自动提醒测试消息`;

  try {
    const result = await sendWhatsApp(testTo, msg);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.rpc("heraa_log_whatsapp", {
      p_member_id: null,
      p_phone: testTo,
      p_message_type: "test_reminder",
      p_message_body: msg,
      p_twilio_sid: result.sid,
      p_status: "sent",
    });

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
