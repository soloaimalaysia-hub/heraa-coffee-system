"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionToken } from "@/lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getSessionToken();
    router.replace(token ? "/home" : "/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div
        className="animate-pulse font-bold text-lg"
        style={{ color: "#C8111A" }}
      >
        HERAA COFFEE
      </div>
    </div>
  );
}
