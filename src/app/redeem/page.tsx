"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

function RedeemContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrCode = searchParams.get("qr") || "";
  const drinkName = searchParams.get("drink") || "";
  const amount = searchParams.get("amount") || "0";

  const [timeLeft, setTimeLeft] = useState(300);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div
        className="py-6 text-center"
        style={{ background: "var(--heraa-red)" }}
      >
        <div className="text-white font-bold text-base tracking-widest">
          HERAA COFFEE
        </div>
        <div className="text-white/70 text-[10px] mt-0.5">兑换码</div>
      </div>

      {/* QR Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div
          className={`rounded-2xl p-6 mb-4 transition-opacity ${
            expired ? "opacity-40" : ""
          }`}
          style={{
            background: "var(--heraa-light)",
            border: "1px solid var(--heraa-border)",
          }}
        >
          <QRCodeSVG
            value={qrCode}
            size={200}
            level="H"
            fgColor={expired ? "#ccc" : "#1a1a1a"}
            bgColor="transparent"
          />
        </div>

        {/* Drink info */}
        <div className="text-center mb-4">
          <div className="text-base font-bold text-gray-800">{drinkName}</div>
          <div
            className="text-lg font-bold mt-0.5"
            style={{ color: "var(--heraa-red)" }}
          >
            RM {parseFloat(amount).toFixed(2)}
          </div>
        </div>

        {/* Countdown */}
        {expired ? (
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-400 mb-1">
              ⏰ 兑换码已过期
            </div>
            <div className="text-[10px] text-gray-300">
              请返回钱包重新兑换
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">有效时间</div>
            <div
              className="text-2xl font-bold font-mono"
              style={{ color: "var(--heraa-red)" }}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
            <div className="mt-2 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
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

        {/* Back button */}
        <button
          onClick={() => router.push("/wallet")}
          className="mt-8 px-8 py-3 rounded-xl text-sm font-semibold border transition-colors"
          style={{
            borderColor: "var(--heraa-red)",
            color: "var(--heraa-red)",
          }}
        >
          ← 返回钱包
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
            className="animate-pulse font-bold"
            style={{ color: "var(--heraa-red)" }}
          >
            加载中...
          </div>
        </div>
      }
    >
      <RedeemContent />
    </Suspense>
  );
}
