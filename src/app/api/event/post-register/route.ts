import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/twilio";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { name, phone, member_id } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const formatted = phone.startsWith("+") ? phone : `+6${phone.replace(/[^0-9]/g, "")}`;

    let activateLink = "";
    if (member_id) {
      const { data: token } = await supabase.rpc("heraa_auth_create_token", {
        p_phone: formatted,
        p_member_id: member_id,
      });
      if (token) {
        activateLink = `https://heraa-coffee-system.vercel.app/activate?token=${token}`;
      }
    }

    const message = `☕ 欢迎加入 Heraa Coffee！${name}

你今天领取的免费咖啡 QR 已经发到你的账户了！

🌱 你已经开始咖啡豆成长之旅
每天打开App浇水，30天后再送你一杯！

${activateLink ? `🔐 想查看会员账户？点这里设置密码激活：
👉 ${activateLink}

` : ""}👉 heraa-coffee-system.vercel.app/home`;

    const result = await sendWhatsApp(formatted, message);

    if (member_id) {
      await supabase.rpc("heraa_log_whatsapp", {
        p_member_id: member_id,
        p_phone: formatted,
        p_message_type: "event_welcome",
        p_message_body: message,
        p_twilio_sid: result.sid,
        p_status: "sent",
      });
    }

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
