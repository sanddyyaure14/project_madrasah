"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      // Sudah login → arahkan ke dashboard
      router.replace("/dashboard");
    } else {
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
