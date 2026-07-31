import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/twilio";
import { formatPhone, toWhatsApp } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type || "public";
  const rawPhone = (body.phone || "").trim();
  const name = (body.name || "").trim();
  const staffId = (body.staff_id || "").trim();
  const companyCode = (body.company_code || "").trim();

  if (!rawPhone || !name) {
    return NextResponse.json({ error: "姓名和手机号必填" }, { status: 400 });
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

  let result;

  if (type === "corporate") {
    const { data, error } = await supabase.rpc("heraa_register_corporate", {
      p_name: name,
      p_phone: phone,
      p_staff_id: staffId,
      p_company_code: companyCode,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase.rpc("heraa_register_public", {
      p_name: name,
      p_phone: phone,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const memberId = result.member_id;

  const { data: token, error: tokenErr } = await supabase.rpc(
    "heraa_auth_create_token",
    { p_phone: phone, p_member_id: memberId }
  );

  if (tokenErr) {
    return NextResponse.json({ error: tokenErr.message }, { status: 500 });
  }

  const link = `https://heraa-coffee-system.vercel.app/activate?token=${token}`;
  const companyName = result.company_name || "";
  const allowance = result.allowance ? `RM${result.allowance}` : "";

  const msg = type === "corporate"
    ? `☕ *Heraa Coffee* · Member Wallet\n\n` +
      `你好 ${name}！欢迎加入 ${companyName} 咖啡福利计划 🎉\n\n` +
      `点击以下链接设置密码激活账户：\n${link}\n\n` +
      `💰 激活后每月自动获得 ${allowance} 咖啡津贴\n` +
      `⏰ 此链接 *5分钟* 内有效\n` +
      `🔒 只能使用一次`
    : `☕ *Heraa Coffee* · Member Wallet\n\n` +
      `你好 ${name}！\n\n` +
      `点击以下链接设置密码激活账户：\n${link}\n\n` +
      `🎁 激活即送 RM2 欢迎优惠券\n` +
      `⏰ 此链接 *5分钟* 内有效\n` +
      `🔒 只能使用一次`;

  try {
    const smsResult = await sendWhatsApp(toWhatsApp(phone), msg);

    await supabase.rpc("heraa_log_whatsapp", {
      p_member_id: memberId,
      p_phone: phone,
      p_message_type: "register_activation",
      p_message_body: msg,
      p_twilio_sid: smsResult.sid,
      p_status: "sent",
    });

    return NextResponse.json({
      success: true,
      company_name: companyName,
      allowance: result.allowance || 0,
    });
  } catch (err: unknown) {
    const errMsg = (err as Error).message;
    await supabase.rpc("heraa_log_whatsapp", {
      p_member_id: memberId,
      p_phone: phone,
      p_message_type: "register_activation",
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
