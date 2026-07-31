"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      router.replace(`/activate?token=${token}`);
    } else {
      router.replace("/login");
    }
  }, [token, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="text-5xl mb-4 animate-pulse">☕</div>
      <div className="font-bold text-lg mb-1" style={{ color: "#C8111A" }}>
        HERAA COFFEE
      </div>
      <div className="text-sm text-gray-500">Redirecting...</div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse font-bold" style={{ color: "#C8111A" }}>
            加载中...
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
