"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

function EventSuccessContent() {
  const params = useParams();
  const eventId = params.eventId as string;
  const searchParams = useSearchParams();
  const qrCode = searchParams.get("qr") || "";
  const drinkName = searchParams.get("drink") || "免费咖啡";
  const expiresAt = searchParams.get("expires") || "";
  const memberName = searchParams.get("name") || "";

  const [timeLeft, setTimeLeft] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowCheck(true), 100);

    if (expiresAt) {
      const update = () => {
        const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
        setTimeLeft(diff);
      };
      update();
      const timer = setInterval(update, 1000);
      return () => clearInterval(timer);
    }
  }, [expiresAt]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Animated Check */}
      <div className="py-8 flex flex-col items-center justify-center">
        <div
          className="text-7xl transition-all duration-500"
          style={{
            transform: showCheck ? "scale(1)" : "scale(0.3)",
            opacity: showCheck ? 1 : 0,
          }}
        >
          ✅
        </div>
        <h1 className="text-xl font-bold text-gray-800 mt-4 text-center px-4">
          🎉 恭喜！你的免费咖啡等你了！
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Congrats! Your free coffee is ready!
        </p>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center px-6">
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: "#FFF5F5", border: "2px solid #FEE2E2" }}
        >
          <QRCodeSVG
            value={qrCode}
            size={250}
            level="H"
            fgColor="#1a1a1a"
            bgColor="transparent"
          />
        </div>

        <div className="text-center mb-4">
          <div className="text-base font-bold text-gray-800">{drinkName}</div>
          <p className="text-sm text-gray-500 mt-1">
            把这个 QR Code 对准咖啡机扫描
          </p>
          <p className="text-xs text-gray-400">
            Scan this QR code at the coffee machine
          </p>
        </div>

        {/* Countdown */}
        {timeLeft > 0 && (
          <div className="text-center mb-4">
            <div className="text-xs text-gray-400 mb-1">有效时间 Valid for</div>
            <div
              className="text-2xl font-bold font-mono"
              style={{ color: "#C8111A" }}
            >
              {hours > 0 && `${hours}:`}
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>
        )}

        {timeLeft === 0 && expiresAt && (
          <div className="text-center mb-4">
            <div className="text-sm font-semibold text-gray-400">⏰ QR 已过期</div>
            <div className="text-xs text-gray-300">QR code has expired</div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-6 my-4 border-t border-gray-100" />

      {/* Member Welcome */}
      <div className="px-6 pb-8">
        <div className="bg-green-50 rounded-2xl p-5 border border-green-200">
          <div className="text-base font-bold text-green-700 mb-2">
            🎉 {memberName ? `${memberName}，你` : "你"}已成为 Heraa Coffee 会员！
          </div>
          <div className="text-sm text-green-600 mb-1">
            我们会通过 WhatsApp 发送优惠给你
          </div>
          <div className="text-sm text-green-600">
            We&apos;ll send you promotions via WhatsApp
          </div>
        </div>

        {/* CTA */}
        <a
          href="/home"
          className="mt-4 block w-full text-center text-white font-bold rounded-xl text-base py-4"
          style={{ background: "#C8111A" }}
        >
          📱 打开 App 查看账户 Open App
        </a>
      </div>
    </div>
  );
}

export default function EventSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse font-bold text-lg" style={{ color: "#C8111A" }}>
            HERAA COFFEE
          </div>
        </div>
      }
    >
      <EventSuccessContent />
    </Suspense>
  );
}
