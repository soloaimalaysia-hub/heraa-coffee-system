"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/lib/LanguageContext";

function RedeemContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redemptionId = searchParams.get("id") || "";
  const qrCode = searchParams.get("qr") || "";
  const drinkName = searchParams.get("drink") || "";
  const amount = searchParams.get("amount") || "0";

  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);
  const [refunded, setRefunded] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0 && !expired) {
      setExpired(true);
      if (redemptionId && parseFloat(amount) > 0) {
        supabase
          .rpc("heraa_expire_redemption", { p_redemption_id: redemptionId })
          .then(({ data }) => {
            if (data?.refunded) {
              setRefunded(true);
              setRefundAmount(data.amount || 0);
            }
          });
      }
      return;
    }
    if (expired) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, expired, redemptionId, amount]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div
        className="py-8 text-center"
        style={{ background: "var(--heraa-red)" }}
      >
        <div className="text-white font-bold text-lg tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-xs mt-1">{t.redeemTitle}</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div
          className={`rounded-2xl p-8 mb-5 transition-opacity ${
            expired ? "opacity-40" : ""
          }`}
          style={{
            background: "var(--heraa-light)",
            border: "1px solid var(--heraa-border)",
          }}
        >
          <QRCodeSVG
            value={qrCode}
            size={220}
            level="H"
            fgColor={expired ? "#ccc" : "#1a1a1a"}
            bgColor="transparent"
          />
        </div>

        <div className="text-center mb-5">
          <div className="text-lg font-bold text-gray-800">{drinkName}</div>
          <div
            className="text-xl font-bold mt-1"
            style={{ color: "var(--heraa-red)" }}
          >
            RM {parseFloat(amount).toFixed(2)}
          </div>
        </div>

        {expired ? (
          <div className="text-center">
            <div className="text-base font-semibold text-gray-400 mb-1">
              {t.redeemExpired}
            </div>
            {refunded ? (
              <div className="rounded-xl px-5 py-4 mt-3 text-center bg-green-50 border border-green-200">
                <div className="text-base font-bold text-green-700">
                  {t.redeemRefunded}
                </div>
                <div className="text-sm text-green-500 mt-1">
                  RM {refundAmount.toFixed(2)} {t.redeemRefundedSub}
                </div>
              </div>
            ) : parseFloat(amount) === 0 ? (
              <div className="text-xs text-gray-300">
                {t.redeemExpiredSub}
              </div>
            ) : (
              <div className="text-xs text-gray-300">
                {t.redeemExpiredSub}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">{t.redeemValidTime}</div>
            <div
              className="font-bold font-mono"
              style={{ color: "var(--heraa-red)", fontSize: 36 }}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
            <div className="mt-3 w-52 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(timeLeft / 300) * 100}%`,
                  background:
                    timeLeft < 60 ? "#ef4444" : "var(--heraa-red)",
                }}
              />
            </div>
          </div>
        )}

        <button
          onClick={() => router.push("/wallet")}
          className="mt-8 px-10 rounded-xl text-base font-bold border transition-colors"
          style={{
            borderColor: "var(--heraa-red)",
            color: "var(--heraa-red)",
            height: 52,
          }}
        >
          {t.redeemBack}
        </button>
      </div>
    </div>
  );
}

export default function RedeemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="animate-pulse font-bold text-lg"
            style={{ color: "var(--heraa-red)" }}
          >
            HERAA COFFEE
          </div>
        </div>
      }
    >
      <RedeemContent />
    </Suspense>
  );
}
