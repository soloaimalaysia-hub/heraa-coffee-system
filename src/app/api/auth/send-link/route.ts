import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/twilio";
import { formatPhone, toWhatsApp } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const rawPhone = (body.phone || "").trim();
  const name = (body.name || "").trim();
  const staffId = (body.staff_id || "").trim();

  if (!rawPhone) {
    return NextResponse.json({ error: "手机号必填" }, { status: 400 });
  }

  const phone = formatPhone(rawPhone);
  if (!phone.match(/^\+60\d{8,11}$/)) {
    return NextResponse.json(
      { error: "手机号格式错误（例：011-1234 5678）" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: upsertResult, error: upsertErr } = await supabase.rpc(
    "heraa_auth_upsert_member",
    { p_phone: phone, p_name: name, p_staff_id: staffId }
  );

  if (upsertErr) {
    return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  if (upsertResult.needs_info) {
    return NextResponse.json({
      needs_info: true,
      message: "首次使用，请填写姓名和工号",
    });
  }

  const { data: token, error: tokenErr } = await supabase.rpc(
    "heraa_auth_create_token",
    { p_phone: phone, p_member_id: upsertResult.member_id }
  );

  if (tokenErr) {
    return NextResponse.json({ error: tokenErr.message }, { status: 500 });
  }

  const displayName = upsertResult.name || name || "会员";
  const link = `https://heraa-coffee-system.vercel.app/auth?token=${token}`;
  const msg =
    `☕ *Heraa Coffee* · Member Wallet\n\n` +
    `你好 ${displayName}！\n\n` +
    `点击以下链接登入你的会员账户：\n${link}\n\n` +
    `⏰ 此链接 *5分钟* 内有效\n` +
    `🔒 只能使用一次\n\n` +
    `如非本人操作，请忽略此消息。`;

  try {
    const result = await sendWhatsApp(toWhatsApp(phone), msg);

    await supabase.rpc("heraa_log_whatsapp", {
      p_member_id: upsertResult.member_id,
      p_phone: phone,
      p_message_type: "auth_link",
      p_message_body: msg,
      p_twilio_sid: result.sid,
      p_status: "sent",
    });

    return NextResponse.json({
      success: true,
      is_new: upsertResult.is_new,
      message: "登入链接已发送到你的 WhatsApp",
    });
  } catch (err: unknown) {
    const errMsg = (err as Error).message;
    await supabase.rpc("heraa_log_whatsapp", {
      p_member_id: upsertResult.member_id,
      p_phone: phone,
      p_message_type: "auth_link",
      p_message_body: msg,
      p_twilio_sid: null,
      p_status: "failed",
      p_error: errMsg,
    });
    return NextResponse.json(
      { error: "WhatsApp 发送失败：" + errMsg },
      { status: 500 }
    );
  }
}
