import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { member_id, event_type, page, metadata } = body;

    if (!event_type) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.rpc("heraa_track_event", {
      p_member_id: member_id || null,
      p_event_type: event_type,
      p_page: page || null,
      p_metadata: metadata || {},
    });

    return NextResponse.json({ success: true });
  } catch {
    // silent failure - tracking must never break the app
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
