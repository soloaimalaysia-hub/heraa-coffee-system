"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPhone } from "@/lib/phone";

const FLAVORS = [
  { emoji: "☕", name: "Americano" },
  { emoji: "🥛", name: "Latte" },
  { emoji: "🍵", name: "Matcha Latte" },
  { emoji: "🍫", name: "Mocha" },
  { emoji: "☕", name: "Cappuccino" },
  { emoji: "🧋", name: "Caramel Latte" },
  { emoji: "🌸", name: "Rose Latte" },
  { emoji: "🍦", name: "Vanilla Latte" },
  { emoji: "🥤", name: "Iced Milo" },
  { emoji: "🍊", name: "Orange Latte" },
  { emoji: "☕", name: "White Coffee" },
];

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [eventName, setEventName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [flavors, setFlavors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("heraa_events_list")
        .select("*")
        .eq("id", eventId)
        .eq("is_active", true)
        .single();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setEventName(data.name);
      setEventLocation(data.location || "");
      setLoading(false);
    })();
  }, [eventId]);

  function toggleFlavor(f: string) {
    if (flavors.includes(f)) {
      setFlavors(flavors.filter((x) => x !== f));
    } else if (flavors.length < 3) {
      setFlavors([...flavors, f]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (flavors.length === 0) {
      setError("请至少选择 1 个口味");
      return;
    }
    setSubmitting(true);
    setError("");

    const normalizedPhone = formatPhone(phone.trim());
    const { data, error: rpcErr } = await supabase.rpc("heraa_event_register", {
      p_event_id: eventId,
      p_name: name.trim(),
      p_phone: normalizedPhone,
      p_area: area.trim(),
      p_flavors: flavors,
    });

    if (rpcErr) {
      setError(rpcErr.message);
      setSubmitting(false);
      return;
    }

    if (data && !data.success) {
      setError(data.error);
      setSubmitting(false);
      return;
    }

    // Fire WhatsApp welcome (fire-and-forget)
    fetch("/api/event/post-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        phone: normalizedPhone,
        member_id: data.member_id,
      }),
    }).catch(() => {});

    const params = new URLSearchParams({
      qr: data.qr_code,
      drink: data.drink_name,
      expires: data.expires_at,
      name: name.trim(),
    });
    router.push(`/event/${eventId}/success?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <div className="text-5xl mb-4">😔</div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">活动不存在或已结束</h2>
        <p className="text-sm text-gray-400">Event not found or has ended</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="py-10 text-center relative" style={{ background: "#C8111A" }}>
        <div className="text-white font-bold text-xl tracking-widest mb-2">
          HERAA COFFEE
        </div>
        <div className="text-white text-lg font-bold">
          🎉 领取你的免费咖啡！
        </div>
        <div className="text-white/70 text-sm mt-1">
          Claim your FREE coffee now!
        </div>
        {eventLocation && (
          <div className="text-white/50 text-xs mt-2">
            📍 {eventLocation}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              姓名 Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的名字 Your name"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              手机号码 Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="011-XXXX XXXX"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
            {phone.trim().length >= 4 && (
              <p className="text-xs mt-1.5 font-medium" style={{ color: "#C8111A" }}>
                将识别为 Recognized as: <span className="font-bold">{formatPhone(phone.trim())}</span>
              </p>
            )}
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              你在哪一区？ Your area?
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="例如：Petaling Jaya、Subang Jaya、KL City"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2"
              style={{ "--tw-ring-color": "#C8111A" } as React.CSSProperties}
            />
            <p className="text-xs text-gray-400 mt-1">
              只需填写你的居住/工作区域即可 Just your living/working area
            </p>
          </div>

          {/* Flavors */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              你最喜欢哪几款？（最多选3个）
              <br />
              <span className="text-xs font-normal text-gray-400">
                Pick your favorites (max 3)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FLAVORS.map((f) => {
                const selected = flavors.includes(f.name);
                const disabled = !selected && flavors.length >= 3;
                return (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => toggleFlavor(f.name)}
                    disabled={disabled}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
                    style={{
                      borderColor: selected ? "#C8111A" : "#e5e7eb",
                      background: selected ? "#FEF2F2" : "white",
                      color: selected ? "#C8111A" : "#374151",
                    }}
                  >
                    <span className="text-lg">{f.emoji}</span>
                    {f.name}
                  </button>
                );
              })}
            </div>
            {flavors.length > 0 && (
              <p className="text-xs mt-2" style={{ color: "#C8111A" }}>
                已选 {flavors.length}/3: {flavors.join(", ")}
              </p>
            )}
            {flavors.length >= 3 && (
              <p className="text-xs mt-1 text-gray-400">
                已选满 3 个 · Max 3 selected
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-bold rounded-xl text-lg disabled:opacity-50 transition-opacity"
            style={{ background: "#C8111A", height: 58 }}
          >
            {submitting ? "正在生成你的兑换码..." : "☕ 领取免费咖啡 Claim Free Coffee"}
          </button>

          {/* Disclaimer */}
          <p className="text-xs text-center text-gray-400 mt-2">
            注册即表示你同意接收 Heraa Coffee 的优惠信息
            <br />
            By registering you agree to receive promotions from Heraa Coffee
          </p>
        </form>
      </div>
    </div>
  );
}
