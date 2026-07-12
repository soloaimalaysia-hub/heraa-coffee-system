"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMe, clearSession, Member, Wallet, Transaction } from "@/lib/session";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";

const DRINKS = [
  { name: "Heraa Americano", price: 6.5 },
  { name: "Heraa Latte", price: 6.5 },
  { name: "Heraa Signature Latte", price: 8.0 },
  { name: "Heraa Mocha", price: 7.5 },
  { name: "Iced Latte", price: 7.0 },
];

export default function WalletPage() {
  const { t, lang, toggleLang } = useLang();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const loadData = useCallback(async () => {
    const me = await fetchMe();
    if (!me) {
      router.replace("/login");
      return;
    }
    setMember(me.member);
    setWallet(me.wallet);
    setTransactions(me.transactions);
    setLoading(false);
    track("wallet_viewed", me.member.id);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRedeem(drinkName: string, price: number) {
    if (!member || !wallet || wallet.balance < price) return;
    track("redeem_clicked", member.id, { drink: drinkName, price });
    setRedeeming(true);

    const { data, error } = await supabase.rpc("heraa_generate_redemption", {
      p_member_id: member.id,
      p_drink_name: drinkName,
      p_amount: price,
    });

    if (error) {
      track("redeem_failed", member.id, { reason: error.message, drink: drinkName });
      alert(error.message);
      setRedeeming(false);
      return;
    }

    track("redeem_success", member.id, { drink: drinkName, amount: price });
    router.push(
      `/redeem?id=${data.id}&qr=${data.qr_code}&drink=${drinkName}&amount=${price}`
    );
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-pulse font-bold text-lg"
          style={{ color: "var(--heraa-red)" }}
        >
          HERAA COFFEE
        </div>
      </div>
    );
  }

  const used = wallet ? wallet.monthly_allowance - wallet.balance : 0;
  const pct = wallet ? (wallet.balance / wallet.monthly_allowance) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div
        className="pt-10 pb-5 text-center relative"
        style={{ background: "var(--heraa-red)" }}
      >
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="text-white text-xs font-medium rounded px-2 py-1 border"
            style={{
              background: "rgba(255,255,255,0.15)",
              borderColor: "rgba(255,255,255,0.3)",
            }}
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="absolute top-3 right-3 text-white/70 text-xs px-2 py-1"
        >
          {t.walletLogout}
        </button>
        <div className="text-white font-bold text-base tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-[10px] mt-0.5">{t.walletTitle}</div>
        <div className="w-11 h-11 rounded-full bg-white/20 mx-auto mt-3 flex items-center justify-center text-white font-bold text-base">
          {member?.name?.charAt(0) || "?"}
        </div>
        <div className="text-white text-sm font-semibold mt-1.5">
          {member?.name} · {member?.company} {t.walletEmployee}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        <div
          className="rounded-xl p-4 text-center mb-3"
          style={{
            background: "var(--heraa-light)",
            border: "1px solid var(--heraa-border)",
          }}
        >
          <div
            className="text-[10px] font-semibold tracking-wide"
            style={{ color: "var(--heraa-red)" }}
          >
            {t.walletBalance}
          </div>
          <div
            className="text-3xl font-bold leading-tight my-1"
            style={{ color: "var(--heraa-red)" }}
          >
            RM {Number(wallet?.balance ?? 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-400">
            {t.walletUsed} RM {used.toFixed(2)} {t.walletTotal} RM{" "}
            {Number(wallet?.monthly_allowance ?? 20).toFixed(2)}
          </div>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--heraa-red)" }}
            />
          </div>
        </div>

        <button
          onClick={() => router.push("/garden")}
          className="w-full rounded-xl p-3 mb-3 flex items-center gap-3 text-left transition-colors hover:bg-green-50"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <div className="text-2xl">🌱</div>
          <div>
            <div className="text-xs font-semibold text-green-700">
              {t.walletGarden}
            </div>
            <div className="text-[10px] text-green-500">
              {t.walletGardenSub}
            </div>
          </div>
          <div className="ml-auto text-green-400 text-sm">→</div>
        </button>

        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={redeeming || !wallet || wallet.balance <= 0}
          className="w-full text-white font-semibold rounded-xl py-3 text-sm mb-3 disabled:opacity-50 transition-opacity"
          style={{ background: "var(--heraa-red)" }}
        >
          {redeeming ? t.walletProcessing : t.walletRedeem}
        </button>

        {showMenu && (
          <div
            className="rounded-xl mb-3 overflow-hidden"
            style={{ border: "1px solid var(--heraa-border)" }}
          >
            {DRINKS.map((drink) => (
              <button
                key={drink.name}
                onClick={() => handleRedeem(drink.name, drink.price)}
                disabled={!wallet || wallet.balance < drink.price || redeeming}
                className="w-full flex justify-between items-center px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 disabled:opacity-40 transition-colors text-left"
              >
                <span className="font-medium text-gray-700">{drink.name}</span>
                <span
                  className="font-semibold text-xs"
                  style={{ color: "var(--heraa-red)" }}
                >
                  RM {drink.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          {t.walletHistory}
        </div>
        {transactions.length === 0 ? (
          <div className="text-xs text-gray-300 text-center py-6">
            {t.walletHistoryEmpty}
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center py-2 border-b border-gray-100"
            >
              <div>
                <div className="text-xs font-medium text-gray-700">
                  {tx.description}
                </div>
                <div className="text-[10px] text-gray-400">
                  {new Date(tx.created_at).toLocaleDateString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                  })}{" "}
                  {new Date(tx.created_at).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div
                className="text-xs font-semibold"
                style={{
                  color: tx.type === "credit" ? "#1a8a3a" : "var(--heraa-red)",
                }}
              >
                {tx.type === "credit" ? "+" : "-"}RM {Number(tx.amount).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
