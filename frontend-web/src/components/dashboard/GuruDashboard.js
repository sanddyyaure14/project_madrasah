"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function GuruDashboard() {
  const [user, setUser] = useState({ nama_lengkap: "Ust. Ahmad Fauzi" });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user"));
      if (userData) {
        setUser(userData);
      }
    } catch (e) {}

    const fetchSummary = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        if (!token) return;

        const res = await fetch(`${API_URL}/api/guru/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setSummary(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const tools = [
    {
      id: "multiple-choice",
      title: "Multiple Choice",
      category: "SOAL PILIHAN GANDA",
      desc: "Generate soal pilihan ganda otomatis berdasarkan materi, tingkat kelas, dan jumlah soal.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      href: "/dashboard/guru/tools/multiple-choice",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "rubric-generator",
      title: "Rubric Generator",
      category: "RUBRIK PENILAIAN",
      desc: "Buat rubrik penilaian yang detail untuk berbagai jenis tugas dan aktivitas pembelajaran.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M3 14h18M10 3v18M6 3v18" />
        </svg>
      ),
      href: "/dashboard/guru/tools/rubric-generator",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "writing-feedback",
      title: "Writing Feedback",
      category: "UMPAN BALIK KARANGAN",
      desc: "Berikan umpan balik konstruktif untuk karangan/tulisan siswa secara otomatis.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      href: "/dashboard/guru/tools/writing-feedback",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "worksheet-generator",
      title: "Worksheet Generator",
      category: "LEMBAR KERJA SISWA",
      desc: "Buat lembar kerja siswa (LKS) yang terstruktur dan siap cetak.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/dashboard/guru/tools/worksheet-generator",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "presentation-generator",
      title: "Presentation Generator",
      category: "SLIDE PRESENTASI",
      desc: "Generate outline dan konten presentasi slide PowerPoint-ready.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      href: "/dashboard/guru/tools/presentation-generator",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      id: "syllabus-generator",
      title: "Syllabus Generator",
      category: "SILABUS KURIKULUM",
      desc: "Buat silabus lengkap sesuai kurikulum (Merdeka/K13) dan jenjang madrasah.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: "/dashboard/guru/tools/syllabus-generator",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      id: "unit-plan",
      title: "Unit Plan / RPP",
      category: "MODUL AJAR",
      desc: "Rencana pembelajaran unit (RPP/Modul Ajar) lengkap siap pakai.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: "/dashboard/guru/tools/unit-plan",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      id: "academic-content",
      title: "Academic Content",
      category: "KONTEN AKADEMIK",
      desc: "Konten akademik custom — rangkuman, penjelasan materi, contoh soal.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      href: "/dashboard/guru/tools/academic-content",
      bg: "bg-amber-50 text-amber-600"
    }
  ];

  const digunakan = summary?.kuota?.digunakan ?? 0;
  const limitBulanan = summary?.kuota?.limit_bulanan ?? 20;
  const dokumenTersimpan = summary?.dokumen_tersimpan ?? 0;
  const totalFeedback = summary?.feedback?.total ?? 0;
  const rataRataRating = summary?.feedback?.rata_rata ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Banner */}
      <div className="bg-[#115E41] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-lg border border-emerald-800">
        <div className="absolute top-0 right-0 opacity-10 w-64 h-64 translate-x-10 -translate-y-10" style={{ fontFamily: "Amiri, serif", fontSize: "200px" }}>
          الله
        </div>
        <div className="absolute top-6 left-8 opacity-40 text-2xl" style={{ fontFamily: "Amiri, serif" }}>
          بسم الله
        </div>
        
        <div className="relative z-10 mt-6 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-serif mb-3 leading-tight text-white">
            Mari mulai mempersiapkan pelajaran hari ini, <br/>{user.nama_lengkap.split(',')[0]}.
          </h2>
          <p className="text-emerald-100/80 text-sm md:text-[15px] leading-relaxed">
            Pilih salah satu dari 8 alat di bawah, isi parameter, lalu biarkan MadrasahAI menyusunnya untuk Anda.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">GENERATE BULAN INI</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded align-middle"></span>
              ) : (
                digunakan
              )}
              <span className="text-gray-400 text-lg"> / {limitBulanan}</span>
            </h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">DOKUMEN TERSIMPAN</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded align-middle"></span>
              ) : (
                dokumenTersimpan
              )}
            </h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">RATING SAYA</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded align-middle"></span>
              ) : rataRataRating !== null ? (
                <>
                  {rataRataRating.toFixed(1)}
                  <span className="text-amber-400 text-xl ml-1">★</span>
                </>
              ) : (
                <span className="text-gray-300 text-base font-normal">Belum ada</span>
              )}
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {loading ? "" : `dari ${totalFeedback} feedback`}
            </p>
          </div>
        </div>
      </div>

      {/* Tools Section */}
      <div className="pt-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h3 className="text-xl font-serif text-gray-900 m-0">Teacher Tools</h3>
            <p className="text-[13px] text-gray-500 m-0 mt-1">8 alat untuk mempercepat persiapan Anda.</p>
          </div>
          <div className="text-[11px] text-gray-400 font-medium italic flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Paling sering: Multiple Choice
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col h-full group hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-4`}>
                {tool.icon}
              </div>
              <h4 className="text-[15px] font-serif text-gray-900 m-0">{tool.title}</h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-2.5">{tool.category}</p>
              <p className="text-[12px] text-gray-500 leading-relaxed m-0 flex-1">{tool.desc}</p>
              <Link href={tool.href} className="text-[12px] font-semibold text-[#006747] mt-4 inline-flex items-center gap-1 no-underline group-hover:text-emerald-800 transition-colors">
                Buka <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
