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
      icon: "📝",
      href: "/dashboard/guru/tools/multiple-choice",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "rubric-generator",
      title: "Rubric Generator",
      category: "RUBRIK PENILAIAN",
      desc: "Buat rubrik penilaian yang detail untuk berbagai jenis tugas dan aktivitas pembelajaran.",
      icon: "📚",
      href: "/dashboard/guru/tools/rubric-generator",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "writing-feedback",
      title: "Writing Feedback",
      category: "UMPAN BALIK KARANGAN",
      desc: "Berikan umpan balik konstruktif untuk karangan/tulisan siswa secara otomatis.",
      icon: "✍",
      href: "/dashboard/guru/tools/writing-feedback",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "worksheet-generator",
      title: "Worksheet Generator",
      category: "LEMBAR KERJA SISWA",
      desc: "Buat lembar kerja siswa (LKS) yang terstruktur dan siap cetak.",
      icon: "📄",
      href: "/dashboard/guru/tools/worksheet-generator",
      bg: "bg-emerald-50 text-emerald-600"
    },
    {
      id: "presentation-generator",
      title: "Presentation Generator",
      category: "SLIDE PRESENTASI",
      desc: "Generate outline dan konten presentasi slide PowerPoint-ready.",
      icon: "🖥️",
      href: "/dashboard/guru/tools/presentation-generator",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      id: "syllabus-generator",
      title: "Syllabus Generator",
      category: "SILABUS KURIKULUM",
      desc: "Buat silabus lengkap sesuai kurikulum (Merdeka/K13) dan jenjang madrasah.",
      icon: "📋",
      href: "/dashboard/guru/tools/syllabus-generator",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      id: "unit-plan",
      title: "Unit Plan / RPP",
      category: "MODUL AJAR",
      desc: "Rencana pembelajaran unit (RPP/Modul Ajar) lengkap siap pakai.",
      icon: "📖",
      href: "/dashboard/guru/tools/unit-plan",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      id: "academic-content",
      title: "Academic Content",
      category: "KONTEN AKADEMIK",
      desc: "Konten akademik custom — rangkuman, penjelasan materi, contoh soal.",
      icon: "🎓",
      href: "/dashboard/guru/tools/academic-content",
      bg: "bg-amber-50 text-amber-600"
    }
  ];

  const digunakan = summary?.kuota?.digunakan ?? 0;
  const limitBulanan = summary?.kuota?.limit_bulanan ?? 20;
  const dokumenTersimpan = summary?.dokumen_tersimpan ?? 0;
  const waktuDihemat = Math.round(dokumenTersimpan * 11.5 / 60) || 0;

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
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">WAKTU DIHEMAT</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-gray-100 animate-pulse rounded align-middle"></span>
              ) : (
                `≈ ${waktuDihemat}`
              )}
              <span className="text-gray-400 text-lg"> jam</span>
            </h4>
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
              <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center text-lg mb-4`}>
                <span className="grayscale opacity-80">{tool.icon}</span>
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
