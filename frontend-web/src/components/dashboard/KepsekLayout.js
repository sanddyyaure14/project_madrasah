"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function KepsekLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState({ nama_lengkap: "Bapak Kepala" });

  useEffect(() => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      if (userData) {
        setUser(userData);
      }
    } catch (e) {}
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.replace("/login");
  };

  const menuManajemen = [
    {
      label: "Dashboard", href: "/dashboard/kepsek", exact: true,
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    {
      label: "Daftar Guru", href: "/dashboard/kepsek/teachers",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
    {
      label: "Persetujuan", href: "/dashboard/kepsek/approvals",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    {
      label: "Laporan & Statistik", href: "/dashboard/kepsek/reports",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    },
  ];

  const menuAsesmen = [
    {
      label: "Multiple Choice", href: "/dashboard/kepsek/tools/multiple-choice",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    },
    {
      label: "Rubric Generator", href: "/dashboard/kepsek/tools/rubric-generator",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M3 14h18M10 3v18M6 3v18" /></svg>
    },
    {
      label: "Writing Feedback", href: "/dashboard/kepsek/tools/writing-feedback",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
    },
    {
      label: "Worksheet Generator", href: "/dashboard/kepsek/tools/worksheet-generator",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
  ];

  const menuKonten = [
    {
      label: "Presentation Generator", href: "/dashboard/kepsek/tools/presentation-generator",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
    },
    {
      label: "Syllabus Generator", href: "/dashboard/kepsek/tools/syllabus-generator",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    {
      label: "Unit Plan / RPP", href: "/dashboard/kepsek/tools/unit-plan",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    {
      label: "Academic Content", href: "/dashboard/kepsek/tools/academic-content",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
    },
  ];

  const menuSaya = [
    {
      label: "Dokumen Saya", href: "/dashboard/kepsek/dokumen",
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
    },
  ];

  // Helper to get initials
  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "KA";
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7] text-gray-800 antialiased m-0 font-sans w-full">
      {/* SIDEBAR NAVIGASI KEPSEK */}
      <aside className="w-64 bg-[#0A261D] text-white flex flex-col justify-between shadow-xl shrink-0 overflow-y-auto hidden-scrollbar">
        <div>
          {/* Header Logo */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-[#ECA823] rounded-lg flex items-center justify-center text-black font-bold text-xl font-serif">م</div>
              <div>
                <h1 className="font-bold text-[15px] tracking-wide m-0 text-white">MadrasahAI</h1>
                <p className="text-[9px] text-[#ECA823] tracking-widest font-semibold m-0 mt-0.5">GURU CERDAS · BERKAH</p>
              </div>
            </div>
            {/* Role Badge */}
            <div className="inline-flex items-center gap-2 bg-[#ECA823] text-black text-[10px] font-bold px-3 py-1.5 rounded-full mt-2">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              KEPALA MADRASAH
            </div>
          </div>

          <div className="px-3 pb-6 space-y-6">
            {/* Manajemen */}
            <div>
              <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-emerald-400/50 mb-2">Manajemen</p>
              <div className="space-y-0.5">
                {menuManajemen.map((item, i) => {
                  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link key={i} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${isActive ? 'bg-[#153428] text-[#ECA823] shadow-inner border border-white/5' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}>
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span> {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Asesmen */}
            <div>
              <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-emerald-400/50 mb-2">Asesmen</p>
              <div className="space-y-0.5">
                {menuAsesmen.map((item, i) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link key={i} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${isActive ? 'bg-[#153428] text-[#ECA823] shadow-inner border border-white/5' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}>
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span> {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Konten */}
            <div>
              <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-emerald-400/50 mb-2">Konten & Kurikulum</p>
              <div className="space-y-0.5">
                {menuKonten.map((item, i) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link key={i} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${isActive ? 'bg-[#153428] text-[#ECA823] shadow-inner border border-white/5' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}>
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span> {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Saya */}
            <div>
              <p className="px-3 text-[10px] uppercase font-bold tracking-widest text-emerald-400/50 mb-2">Saya</p>
              <div className="space-y-0.5">
                {menuSaya.map((item, i) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link key={i} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${isActive ? 'bg-[#153428] text-[#ECA823] shadow-inner border border-white/5' : 'text-emerald-100/70 hover:bg-white/5 hover:text-white'}`}>
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span> {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Profile */}
        <div className="p-5 border-t border-white/10 mt-auto">
          <div className="mb-4">
            <h4 className="text-[13px] font-bold text-white m-0 truncate">{user.nama_lengkap}</h4>
            <p className="text-[11px] text-emerald-300/70 m-0 mt-0.5">Kepala Madrasah</p>
          </div>
          <div className="space-y-2">
            <Link href="/dashboard/kepsek/settings" className="flex items-center gap-3 text-[13px] text-emerald-100/70 hover:text-white w-full text-left transition-colors no-underline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Pengaturan
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-3 text-[13px] text-red-400 hover:text-red-300 w-full text-left transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar Beige */}
        <header className="h-16 bg-[#FDFBF7] flex items-center justify-between px-8 shrink-0 z-10 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <span className="text-xl text-[#ECA823]" dir="rtl" style={{ fontFamily: "Amiri, serif" }}>السلام عليكم</span>
            <span className="text-gray-400">—</span>
            <span className="text-sm text-gray-500 font-medium">Selamat datang, {user.nama_lengkap.split(',')[0]}.</span>
          </div>
          <Link href="/dashboard/kepsek/settings" className="flex items-center gap-3 cursor-pointer group no-underline">
            <div className="text-right hidden md:block">
              <h4 className="text-[13px] font-bold text-gray-900 m-0 group-hover:text-[#006747] transition-colors">{user.nama_lengkap}</h4>
              <p className="text-[11px] text-gray-500 m-0">{user.role === 'kepala_sekolah' ? 'Kepala Madrasah' : 'Guru'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ECA823] text-black font-bold flex items-center justify-center text-sm shadow-sm border border-amber-200">
              {getInitials(user.nama_lengkap)}
            </div>
          </Link>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>

      <style jsx global>{`
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
