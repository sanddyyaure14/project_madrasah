"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("guru"); // "kepsek" or "guru"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login gagal, silakan coba lagi.");
      }

      // Simpan token ke sessionStorage atau cookies jika diperlukan
      if (data.accessToken) {
        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        
        // Simpan flag login ke cookie untuk dibaca oleh middleware Next.js
        document.cookie = `isLoggedIn=true; path=/`; // Session Cookie (terhapus saat browser ditutup)
      }

      // Redirect ke dashboard
      router.push("/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Panel (Green) */}
      <div className="hidden lg:flex w-1/2 bg-[#006747] text-white flex-col justify-center p-12 relative overflow-hidden">
        
        {/* Decorative Background Elements (Top, complete) */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-[180px] leading-none text-white/[0.04] font-serif select-none pointer-events-none w-full text-center">
          الله
        </div>

        {/* Header Section without Logo Box */}
        <div className="z-10 absolute top-12 left-12">
          <h1 className="text-xl font-bold font-serif tracking-wide">MadrasahAI</h1>
          <p className="text-[#ECA823] text-[10px] tracking-[0.2em] font-medium uppercase mt-0.5">
            GURU CERDAS · BERKAH
          </p>
        </div>

        {/* Middle Quotes Section */}
        <div className="z-10 mt-16 mb-8">
          <h2
            className="text-[44px] font-medium leading-[1.6] mb-6 text-[#ECA823] drop-shadow-md"
            dir="rtl"
            style={{ fontFamily: "Amiri, serif", wordSpacing: "0.1em" }}
          >
            طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ
          </h2>
          <p className="text-lg text-emerald-50 leading-relaxed max-w-[400px]">
            "Menuntut ilmu itu wajib bagi setiap muslim." — Satu platform, dua
            peran: Kepala Madrasah memantau, Guru berkarya.
          </p>
        </div>

        {/* Bottom Feature Cards */}
        <div className="flex gap-4 z-10 w-full max-w-[500px]">
          <div className="border border-emerald-500/30 bg-emerald-800/20 backdrop-blur-sm p-4 rounded-xl flex-1 hover:bg-emerald-800/30 transition">
            <svg
              className="w-5 h-5 text-[#ECA823] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h3 className="font-semibold text-white text-sm mb-1">Kepala Madrasah</h3>
            <p className="text-xs text-emerald-200/70 leading-snug">
              Statistik · Persetujuan · Manajemen guru
            </p>
          </div>
          <div className="border border-emerald-500/30 bg-emerald-800/20 backdrop-blur-sm p-4 rounded-xl flex-1 hover:bg-emerald-800/30 transition">
            <svg
              className="w-5 h-5 text-[#ECA823] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
              />
            </svg>
            <h3 className="font-semibold text-white text-sm mb-1">Guru</h3>
            <p className="text-xs text-emerald-200/70 leading-snug">
              8 alat AI siap pakai untuk persiapan ajar
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-[11px] text-emerald-400 mt-16 z-10">
          © MadrasahAI · Barakallahu fiikum
        </div>
      </div>

      {/* Right Panel (Beige) */}
      <div className="w-full lg:w-1/2 bg-[#FDFBF7] flex items-center justify-center p-8 relative">
        <div className="max-w-md w-full relative z-10">
          {/* Header Text */}
          <div className="mb-8">
            <h2
              className="text-[#D4AF37] text-3xl mb-1 font-serif text-right drop-shadow-sm"
              dir="rtl"
            >
              السلام عليكم
            </h2>
            <h1 className="text-3xl font-serif text-gray-900 mb-2">
              Masuk ke MadrasahAI
            </h1>
            <p className="text-gray-500 text-sm">
              Pilih peran Anda, lalu masukkan kredensial.
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6 shadow-inner">
            <button
              onClick={() => setRole("kepsek")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                role === "kepsek"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Kepala Madrasah
            </button>
            <button
              onClick={() => setRole("guru")}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                role === "guru"
                  ? "bg-[#EBA822] text-gray-900 shadow-md shadow-[#EBA822]/20"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                />
              </svg>
              Guru
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ustadz@madrasah.id"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EBA822]/50 focus:border-[#EBA822] transition-all outline-none text-sm placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1 relative">
              <label className="block text-[13px] font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EBA822]/50 focus:border-[#EBA822] transition-all outline-none text-sm placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[13px] pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded text-[#EBA822] focus:ring-[#EBA822] border-gray-300 accent-[#006747]"
                  defaultChecked
                />
                Ingat saya
              </label>
              <a href="#" className="text-[#006747] hover:text-[#006747]/80 font-medium">
                Lupa password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#EBA822] hover:bg-[#DCA020] text-gray-900 font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Masuk sebagai {role === "kepsek" ? "Kepala Madrasah" : "Guru"}
                </>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 border border-dashed border-[#EBA822]/30 bg-[#EBA822]/[0.02] p-4 rounded-xl text-[13px] text-gray-600">
            <h4 className="font-semibold text-gray-700 mb-2">Akun demo</h4>
            <div className="flex items-start gap-2 mb-1.5">
              <span className="text-base">👑</span>
              <div>
                <span className="font-medium text-gray-800">Kepala:</span>{" "}
                kepala@madrasah.id / admin1234
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-base">🧑‍🏫</span>
              <div>
                <span className="font-medium text-gray-800">Guru:</span>{" "}
                ustadz@madrasah.id / guru1234
              </div>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-8 text-center text-[13px] text-gray-500">
            Belum punya akun?{" "}
            <Link href="/register" className="text-[#006747] hover:text-[#006747]/80 font-medium">
              Daftar sebagai guru
            </Link>{" "}
            ·{" "}
            <Link href="/" className="text-[#006747] hover:text-[#006747]/80 font-medium">
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
