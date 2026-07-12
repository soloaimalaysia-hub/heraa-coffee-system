export async function track(
  event_type: string,
  member_id?: string | null,
  metadata?: Record<string, unknown>
) {
  try {
    const page = typeof window !== "undefined" ? window.location.pathname : null;
    // fire and forget - do not await
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: member_id || null,
        event_type,
        page,
        metadata: metadata || {},
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // silent failure - never affects main functionality
  }
}
