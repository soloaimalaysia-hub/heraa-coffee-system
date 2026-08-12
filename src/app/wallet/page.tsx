"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchMe, clearSession, Member, Wallet, Transaction } from "@/lib/session";
import { track } from "@/lib/track";
import { useLang } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

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
    <div className="min-h-screen flex flex-col bg-white pb-20 md:pb-0 md:pl-[84px]">
      {/* Header */}
      <div
        className="pt-12 pb-6 text-center relative"
        style={{ background: "var(--heraa-red)" }}
      >
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="text-white text-sm font-medium rounded px-3 py-1.5 border"
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
          className="absolute top-3 right-3 text-white/70 text-sm px-3 py-1.5"
        >
          {t.walletLogout}
        </button>
        <div className="text-white font-bold text-lg tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">{t.walletTitle}</div>
        <div className="w-14 h-14 rounded-full bg-white/20 mx-auto mt-4 flex items-center justify-center text-white font-bold text-xl">
          {member?.name?.charAt(0) || "?"}
        </div>
        <div className="text-white text-base font-semibold mt-2">
          {member?.name} · {member?.company} {t.walletEmployee}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5">
        {/* Balance Card */}
        <div
          className="rounded-xl p-6 text-center mb-4"
          style={{
            background: "var(--heraa-light)",
            border: "1px solid var(--heraa-border)",
          }}
        >
          <div
            className="text-xs font-semibold tracking-wide"
            style={{ color: "var(--heraa-red)" }}
          >
            {t.walletBalance}
          </div>
          <div
            className="font-bold leading-tight my-2"
            style={{ color: "var(--heraa-red)", fontSize: 36 }}
          >
            RM {Number(wallet?.balance ?? 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">
            {t.walletUsed} RM {used.toFixed(2)} {t.walletTotal} RM{" "}
            {Number(wallet?.monthly_allowance ?? 20).toFixed(2)}
          </div>
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: "var(--heraa-red)" }}
            />
          </div>
        </div>

        {/* Redeem Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={redeeming || !wallet || wallet.balance <= 0}
          className="w-full text-white font-bold rounded-xl text-lg mb-4 disabled:opacity-50 transition-opacity"
          style={{ background: "var(--heraa-red)", height: 58 }}
        >
          {redeeming ? t.walletProcessing : t.walletRedeem}
        </button>

        {/* Drink Menu */}
        {showMenu && (
          <div
            className="rounded-xl mb-4 overflow-hidden"
            style={{ border: "1px solid var(--heraa-border)" }}
          >
            {DRINKS.map((drink) => (
              <button
                key={drink.name}
                onClick={() => handleRedeem(drink.name, drink.price)}
                disabled={!wallet || wallet.balance < drink.price || redeeming}
                className="w-full flex justify-between items-center px-4 py-4 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 disabled:opacity-40 transition-colors text-left"
              >
                <span className="font-medium text-gray-700 text-sm">{drink.name}</span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: "var(--heraa-red)" }}
                >
                  RM {drink.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Transaction History */}
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          {t.walletHistory}
        </div>
        {transactions.length === 0 ? (
          <div className="text-sm text-gray-300 text-center py-8">
            {t.walletHistoryEmpty}
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex justify-between items-center py-3 border-b border-gray-100"
            >
              <div>
                <div className="text-sm font-medium text-gray-700">
                  {tx.description}
                </div>
                <div className="text-xs text-gray-400">
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
                className="text-sm font-bold"
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
      <BottomNav />
    </div>
  );
}
