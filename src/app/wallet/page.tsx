"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Member {
  id: string;
  name: string;
  company: string;
  staff_id: string;
}

interface Wallet {
  balance: number;
  monthly_allowance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

const DRINKS = [
  { name: "Heraa Americano", price: 6.5 },
  { name: "Heraa Latte", price: 6.5 },
  { name: "Heraa Signature Latte", price: 8.0 },
  { name: "Heraa Mocha", price: 7.5 },
  { name: "Iced Latte", price: 7.0 },
];

export default function WalletPage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const loadData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const userId = session.user.id;
    const userName =
      session.user.user_metadata?.name || session.user.email || "Member";
    const userStaffId = session.user.user_metadata?.staff_id || "";

    let { data: memberData } = await supabase
      .from("heraa_members")
      .select("*")
      .eq("id", userId)
      .single();

    if (!memberData) {
      const { data: newMember } = await supabase
        .from("heraa_members")
        .insert({
          id: userId,
          name: userName,
          company: "Genting",
          staff_id: userStaffId,
          phone: session.user.phone || null,
        })
        .select()
        .single();

      if (newMember) {
        await supabase.from("heraa_wallets").insert({ member_id: userId });

        await supabase.from("heraa_transactions").insert({
          member_id: userId,
          amount: 20,
          type: "credit",
          description: "Genting 津贴",
        });

        memberData = newMember;
      }
    }

    if (memberData) setMember(memberData);

    const { data: walletData } = await supabase
      .from("heraa_wallets")
      .select("balance, monthly_allowance")
      .eq("member_id", userId)
      .single();

    if (walletData) setWallet(walletData);

    const { data: txns } = await supabase
      .from("heraa_transactions")
      .select("*")
      .eq("member_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (txns) setTransactions(txns);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRedeem(drinkName: string, price: number) {
    if (!member || !wallet || wallet.balance < price) return;
    setRedeeming(true);

    const { data, error } = await supabase.rpc("heraa_generate_redemption", {
      p_member_id: member.id,
      p_drink_name: drinkName,
      p_amount: price,
    });

    if (error) {
      alert(error.message);
      setRedeeming(false);
      return;
    }

    router.push(`/redeem?id=${data.id}&qr=${data.qr_code}&drink=${drinkName}&amount=${price}`);
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

  const used = wallet
    ? wallet.monthly_allowance - wallet.balance
    : 0;
  const pct = wallet
    ? (wallet.balance / wallet.monthly_allowance) * 100
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div
        className="pt-10 pb-5 text-center"
        style={{ background: "var(--heraa-red)" }}
      >
        <div className="text-white font-bold text-base tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-[10px] mt-0.5">Member Wallet</div>
        <div className="w-11 h-11 rounded-full bg-white/20 mx-auto mt-3 flex items-center justify-center text-white font-bold text-base">
          {member?.name?.charAt(0) || "?"}
        </div>
        <div className="text-white text-sm font-semibold mt-1.5">
          {member?.name} · {member?.company}员工
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-4">
        {/* Balance Card */}
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
            本月余额
          </div>
          <div
            className="text-3xl font-bold leading-tight my-1"
            style={{ color: "var(--heraa-red)" }}
          >
            RM {wallet?.balance?.toFixed(2) || "0.00"}
          </div>
          <div className="text-[10px] text-gray-400">
            已用 RM {used.toFixed(2)} / 共 RM{" "}
            {wallet?.monthly_allowance?.toFixed(2) || "20.00"}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: "var(--heraa-red)",
              }}
            />
          </div>
        </div>

        {/* Redeem Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={redeeming || !wallet || wallet.balance <= 0}
          className="w-full text-white font-semibold rounded-xl py-3 text-sm mb-3 disabled:opacity-50 transition-opacity"
          style={{ background: "var(--heraa-red)" }}
        >
          {redeeming ? "处理中..." : "☕ 立即兑换咖啡"}
        </button>

        {/* Drink Menu */}
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

        {/* Transactions */}
        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">
          消费记录
        </div>
        {transactions.length === 0 ? (
          <div className="text-xs text-gray-300 text-center py-6">
            暂无记录
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
                {tx.type === "credit" ? "+" : "-"}RM {tx.amount.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
