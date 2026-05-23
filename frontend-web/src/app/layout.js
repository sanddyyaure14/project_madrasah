import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "MadrasahAI",
  description: "Aplikasi Asesmen Cerdas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="flex h-screen bg-[#FAF9F5] text-gray-800 antialiased m-0 font-sans">
        
        {/* SIDEBAR NAVIGASI */}
        <aside className="w-64 bg-[#006747] text-white flex flex-col justify-between shadow-lg shrink-0">
          <div>
            {/* Header Logo */}
            <div className="p-5 border-b border-emerald-800 flex items-center gap-3">
              <div className="w-9 h-9 bg-[#f5d98b] text-[#006747] rounded-lg flex items-center justify-center font-bold text-xl">م</div>
              <div>
                <h1 className="font-bold text-sm tracking-wide m-0">MadrasahAI</h1>
                <p className="text-[9px] text-emerald-300 tracking-widest font-semibold m-0 mt-0.5">GURU CERDAS · BERKAH</p>
              </div>
            </div>

            {/* Menu Navigasi */}
            <nav className="px-2 py-4 space-y-1">
              <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-emerald-300/60 mb-2">Modul Asesmen</p>
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-100 hover:bg-white/5 no-underline">
                <span className="text-base">⊞</span> Dashboard
              </Link>
              <Link href="/tools/writing-feedback" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-100 hover:bg-white/5 no-underline">
                <span className="text-base">✍</span> Writing Feedback
              </Link>
              <Link href="/tools/worksheet-generator" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-100 hover:bg-white/5 no-underline">
                <span className="text-base">📄</span> Worksheet Generator
              </Link>
            </nav>
          </div>

          {/* Bagian Footer Sidebar (Nanti bisa diisi komponen Profile dinamis) */}
          <div className="p-4 border-t border-emerald-800 bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">M</div>
              <div className="truncate">
                <p className="text-xs font-semibold m-0 truncate">User Madrasah</p>
              </div>
            </div>
          </div>
        </aside>

        {/* AREA KONTEN UTAMA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar Polos */}
          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            <div className="text-xs text-gray-500">
              Selamat datang di Portal Web MadrasahAI
            </div>
          </header>

          {/* Konten Halaman */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}