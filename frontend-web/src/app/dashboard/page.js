"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirector() {
  const router = useRouter();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && (user.role === "kepala_sekolah" || user.role === "kepsek")) {
        router.replace("/dashboard/kepsek");
      } else {
        router.replace("/dashboard/guru");
      }
    } catch (e) {
      router.replace("/dashboard/guru");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
      <div className="w-8 h-8 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );
}