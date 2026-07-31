import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing session" }, { status: 401 });
  }

  const sessionToken = authHeader.replace("Bearer ", "").trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc("heraa_auth_get_me", {
    p_session_token: sessionToken,
  });

  if (error || !data.success) {
    return NextResponse.json(
      { error: error?.message || data?.error || "Invalid session" },
      { status: 401 }
    );
  }

  const { data: txData } = await supabase.rpc("heraa_auth_get_transactions", {
    p_session_token: sessionToken,
    p_limit: 5,
  });

  return NextResponse.json({
    member: data.member,
    wallet: data.wallet,
    transactions: txData?.transactions || [],
    company_info: data.company_info || null,
  });
}
