"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      // Sudah login → arahkan ke dashboard
      router.replace("/dashboard");
    } else {
      // Hapus cookie lama yang mungkin masih tersisa agar tidak terjadi redirect loop
      document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // Belum login → arahkan ke login
      router.replace("/login");
    }
  }, [router]);

  // Tampilkan loading sementara redirect
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p style={{ color: "#999" }}>Memuat...</p>
    </div>
  );
}
