"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";
import { fetchMe } from "@/lib/session";
import BottomNav from "@/components/BottomNav";

interface Product {
  id: string;
  name_zh: string;
  name_en: string;
  image_url: string | null;
  credits_cost: number;
  category: string;
}

type Category = "all" | "coffee" | "matcha";

export default function MachineOrderPage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useParams();
  const code = String(params.code || "").toUpperCase();

  const [machine, setMachine] = useState<{ id: string; name: string; address: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.push("/login");
      return;
    }
    setMemberId(me.member.id);

    const [{ data: mv }, { data: creditsData }, { data: productsData }] = await Promise.all([
      supabase.rpc("heraa_verify_machine", { p_code: code }),
      supabase.rpc("heraa_get_member_credits", { p_member_id: me.member.id }),
      supabase.from("heraa_products").select("*").eq("is_available", true).order("sort_order"),
    ]);

    if (!mv?.success) {
      setError(mv?.error || t.scanMachineNotFound);
      setLoading(false);
      return;
    }
    setMachine({ id: mv.machine_id, name: mv.name, address: mv.address });
    setCreditsRemaining(creditsData?.credits_remaining ?? 0);
    setProducts(productsData || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, router]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter((p) => category === "all" || p.category === category);

  async function handleConfirmOrder() {
    if (!selected || !machine || !memberId) return;
    setSubmitting(true);
    setError("");
    const { data } = await supabase.rpc("heraa_redeem_credit", {
      p_member_id: memberId,
      p_machine_id: machine.id,
      p_product_id: selected.id,
    });
    setSubmitting(false);
    if (data?.success) {
      const name = lang === "zh" ? selected.name_zh : selected.name_en;
      router.push(
        `/order/success?drink=${encodeURIComponent(name)}&machine=${code}&used=${data.credits_used}&left=${data.credits_remaining_total}`
      );
    } else {
      setError(data?.error || t.confirmOrderInsufficientCredits);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
          HERAA COFFEE
        </div>
      </div>
    );
  }

  if (error && !machine) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white pb-20 md:pb-0 md:pl-[84px]">
        <span className="text-4xl mb-3">📷</span>
        <span className="text-sm text-gray-400 mb-4">{error}</span>
        <button onClick={() => router.push("/scan")} className="text-sm font-medium" style={{ color: "#C8111A" }}>
          {t.packagesBack}
        </button>
        <BottomNav />
      </div>
    );
  }

  // ===== Confirm Order step (design 06) =====
  if (step === "confirm" && selected && machine) {
    const name = lang === "zh" ? selected.name_zh : selected.name_en;
    const after = creditsRemaining - selected.credits_cost;
    return (
      <div className="min-h-screen flex flex-col bg-white pb-20 md:pb-0 md:pl-[84px]">
        <div className="py-6 text-center relative" style={{ background: "#C8111A" }}>
          <button onClick={() => setStep("select")} className="absolute top-3 left-3 text-white text-sm px-3 py-1">
            ←
          </button>
          <div className="text-white font-bold text-base">{t.confirmOrderTitle}</div>
        </div>

        <div className="flex-1 px-5 py-6">
          <div className="flex flex-col items-center mb-6">
            <div
              className="rounded-2xl mb-3 flex items-center justify-center overflow-hidden"
              style={{ width: 140, height: 140, background: "#8BC34A" }}
            >
              {selected.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.image_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 48 }}>🥤</span>
              )}
            </div>
            <div className="text-lg font-bold text-gray-800">{name}</div>
            <div className="text-sm text-gray-400">{selected.credits_cost} Credit{selected.credits_cost > 1 ? "s" : ""}</div>
          </div>

          <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
            <Row label={t.confirmOrderMachineCode} value={code} />
            <Row label={t.confirmOrderMachineLocation} value={machine.name} />
            <Row label={t.confirmOrderCurrentBalance} value={`${creditsRemaining} Credits`} />
            <Row label={t.confirmOrderThisOrder} value={`-${selected.credits_cost} Credit`} valueColor="#C8111A" />
            <Row label={t.confirmOrderRemaining} value={`${after} Credits`} bold />
          </div>

          {error && (
            <p className="text-sm text-center mt-4" style={{ color: "#C8111A" }}>
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pb-4">
          <button
            onClick={handleConfirmOrder}
            disabled={submitting}
            className="w-full text-white font-bold rounded-xl py-3.5 disabled:opacity-60"
            style={{ background: "#C8111A" }}
          >
            {submitting ? "..." : t.confirmOrderBtn}
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  // ===== Select Drink step (design 05) =====
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 md:pl-[84px]">
      <div className="py-6 text-center relative" style={{ background: "#C8111A" }}>
        <button onClick={() => router.push("/home")} className="absolute top-3 left-3 text-white text-sm px-3 py-1">
          ←
        </button>
        <div className="text-white font-bold text-base">{t.selectDrinkTitle}</div>
        {machine && (
          <div className="text-white/70 text-xs mt-1">
            📍 {code} · {machine.name}
          </div>
        )}
      </div>

      <div className="flex bg-white border-b border-gray-100">
        {(["all", "coffee", "matcha"] as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="flex-1 py-3 text-sm font-medium"
            style={{
              color: category === c ? "#C8111A" : "#888",
              borderBottom: category === c ? "2px solid #C8111A" : "2px solid transparent",
            }}
          >
            {c === "all" ? t.selectDrinkAll : c === "coffee" ? "Coffee" : "Matcha"}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 py-4 space-y-2">
        {filtered.map((p) => {
          const name = lang === "zh" ? p.name_zh : p.name_en;
          const isSel = selected?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full bg-white rounded-xl p-3 flex items-center gap-3 text-left"
              style={{ border: isSel ? "2px solid #C8111A" : "1px solid #F0F0F0" }}
            >
              <div
                className="rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                style={{ width: 44, height: 44, background: p.category === "matcha" ? "#8BC34A" : "#6B4226" }}
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 20 }}>🥤</span>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{name}</div>
                <div className="text-xs text-green-600">{p.credits_cost} Credit{p.credits_cost > 1 ? "s" : ""}</div>
              </div>
              {isSel && <span style={{ color: "#C8111A" }}>›</span>}
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-4">
        {selected && (
          <div className="text-xs text-gray-400 mb-2">
            {t.selectDrinkSelected}: {lang === "zh" ? selected.name_zh : selected.name_en}
          </div>
        )}
        <button
          onClick={() => setStep("confirm")}
          disabled={!selected}
          className="w-full text-white font-bold rounded-xl py-3.5 disabled:opacity-40"
          style={{ background: "#C8111A" }}
        >
          {t.selectDrinkNext}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function Row({ label, value, bold, valueColor }: { label: string; value: string; bold?: boolean; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "font-medium"}`} style={{ color: valueColor || "#333" }}>
        {value}
      </span>
    </div>
  );
}
