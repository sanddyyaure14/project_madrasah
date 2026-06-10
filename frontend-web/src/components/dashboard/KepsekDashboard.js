"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function KepsekDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  // Fetch Summary & Pending Teachers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, pendingRes] = await Promise.all([
          fetch("http://20.5.27.127:3000/api/kepsek/dashboard/summary"),
          // Menggunakan dummy instansi_id untuk demo. Pada sistem nyata, ambil dari token JWT / session.
          fetch("http://20.5.27.127:3000/api/kepsek/pending-teachers?instansi_id=b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a")
        ]);
        
        const summaryData = await summaryRes.json();
        const pendingData = await pendingRes.json();

        if (summaryData.success) {
          setSummary(summaryData.data);
        }
        if (pendingData.success) {
          setPendingTeachers(pendingData.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReview = async (teacherId, action) => {
    setProcessingId(teacherId);
    try {
      const res = await fetch("http://20.5.27.127:3000/api/kepsek/review-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: teacherId,
          action: action
        })
      });
      const data = await res.json();
      if (data.success) {
        // Hapus guru yang sudah diapprove/direject dari list
        setPendingTeachers(prev => prev.filter(t => t.id !== teacherId));
        
        // Update angka summary "Total Guru" jika approve
        if (action === "approve") {
          setSummary(prev => ({
            ...prev,
            card_total_guru: {
              ...prev.card_total_guru,
              total: Number(prev.card_total_guru.total) + 1
            }
          }));
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(`Error processing ${action}:`, error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#006747]/30 border-t-[#006747] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Fallbacks if data fails to load
  const totalGuru = summary?.card_total_guru?.total || 0;
  const generateBulanIni = summary?.card_total_generate?.total || 0;
  const menungguPersetujuan = pendingTeachers.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* BANNER UTAMA */}
      <div className="bg-[#106A43] text-white p-8 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="inline-flex items-center gap-2 border border-emerald-500/50 bg-emerald-800/30 text-emerald-100 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full mb-6 relative z-10">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          PANEL KEPALA MADRASAH
        </div>
        
        <h2 className="text-3xl font-serif leading-snug mb-2 relative z-10">
          Ringkasan kinerja madrasah hari ini.
        </h2>
        <p className="text-sm text-emerald-100/80 max-w-lg m-0 relative z-10">
          Pantau aktivitas guru, persetujuan dokumen, dan statistik penggunaan AI.
        </p>
        
        {/* Kaligrafi Latar Belakang */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-4 text-[250px] leading-none text-white/[0.04] font-serif select-none pointer-events-none">
          الله
        </div>
      </div>

      {/* KPI GRID (8 KARTU) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kartu 1: Total Guru */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">TOTAL GURU</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">{totalGuru}</h4>
          </div>
        </div>

        {/* Kartu 2: Total Siswa (Mock) */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">TOTAL SISWA</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">612</h4>
          </div>
        </div>

        {/* Kartu 3: Kelas Aktif (Mock) */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">KELAS AKTIF</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">21</h4>
          </div>
        </div>

        {/* Kartu 4: Dokumen Dibuat (Mock) */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">DOKUMEN DIBUAT</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">1284</h4>
          </div>
        </div>

        {/* Kartu 5: Generate Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">GENERATE BULAN INI</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">{generateBulanIni}</h4>
          </div>
        </div>

        {/* Kartu 6: Total Jam Dihemat (Mock) */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">TOTAL JAM DIHEMAT</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">184j</h4>
          </div>
        </div>

        {/* Kartu 7: Menunggu Persetujuan (Guru Baru) */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">MENUNGGU PERSETUJUAN</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">{menungguPersetujuan}</h4>
          </div>
        </div>

        {/* Kartu 8: Tingkat Aktif (Mock) */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">TINGKAT AKTIF</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">92%</h4>
          </div>
        </div>

      </div>

      {/* GURU BARU (MENUNGGU PERSETUJUAN) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-400 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-serif text-gray-900 m-0">Akun Guru Baru — Menunggu Persetujuan</h3>
              <p className="text-[13px] text-gray-500 m-0 mt-1">
                Setujui agar guru dapat login dengan email & password yang mereka daftarkan.
              </p>
            </div>
          </div>
          <Link href="/dashboard/kepsek/approvals" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors">
            Kelola semua <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        {pendingTeachers.length === 0 ? (
          <div className="bg-[#FAF9F5] border border-gray-100 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-serif text-[#ECA823] drop-shadow-sm mb-2" dir="rtl" style={{ fontFamily: "Amiri, serif", wordSpacing: "0.1em" }}>
              لا توجد طلبات
            </h2>
            <p className="text-sm text-gray-500 m-0">Belum ada pendaftaran guru baru.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTeachers.map((teacher) => (
              <div key={teacher.id} className="border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF9F5]/30 hover:bg-[#FAF9F5] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">NEW</span>
                    <h4 className="text-[15px] font-semibold text-gray-900 m-0">{teacher.nama_lengkap}</h4>
                  </div>
                  <p className="text-[13px] text-gray-500 m-0">
                    <span className="font-medium text-gray-700">{teacher.email}</span> · {teacher.mata_pelajaran}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleReview(teacher.id, "reject")}
                    disabled={processingId === teacher.id}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button 
                    onClick={() => handleReview(teacher.id, "approve")}
                    disabled={processingId === teacher.id}
                    className="px-4 py-2 bg-[#106A43] text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingId === teacher.id && (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                    Setujui
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DOKUMEN & AKTIVITAS (MOCKUP) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Dokumen */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-serif text-gray-900 m-0">Menunggu Persetujuan</h3>
              <p className="text-[13px] text-gray-500 m-0 mt-1">Dokumen yang diajukan guru untuk disetujui.</p>
            </div>
            <Link href="/dashboard/kepsek/approvals" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors">
              Lihat semua <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
          
          <div className="space-y-0">
            {/* Mock Item 1 */}
            <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">RPP</span>
                  <span className="text-xs text-gray-400">Ust. Ahmad Fauzi · Hari ini, 09:12</span>
                </div>
                <h4 className="text-[15px] font-medium text-gray-900 m-0">RPP Fiqih Bab Thaharah - Kelas VII</h4>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">Tolak</button>
                <button className="px-4 py-2 bg-[#106A43] text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-sm transition-colors">Setujui</button>
              </div>
            </div>

            {/* Mock Item 2 */}
            <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">SOAL</span>
                  <span className="text-xs text-gray-400">Ustz. Aisyah Nurhaliza · Hari ini, 08:45</span>
                </div>
                <h4 className="text-[15px] font-medium text-gray-900 m-0">Soal PG Bahasa Arab — Mufrodat Tema Keluarga</h4>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">Tolak</button>
                <button className="px-4 py-2 bg-[#106A43] text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-sm transition-colors">Setujui</button>
              </div>
            </div>

             {/* Mock Item 3 */}
             <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">SILABUS</span>
                  <span className="text-xs text-gray-400">Ust. Hamzah Ibrahim · Kemarin, 16:20</span>
                </div>
                <h4 className="text-[15px] font-medium text-gray-900 m-0">Silabus SKI Semester Ganjil Kelas VIII</h4>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">Tolak</button>
                <button className="px-4 py-2 bg-[#106A43] text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-sm transition-colors">Setujui</button>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Aktivitas Terbaru */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <h3 className="text-lg font-serif text-gray-900 m-0 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Aktivitas Terbaru
          </h3>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
            {/* Mock Item 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-white">UA</div>
                <div>
                  <p className="text-[13px] text-gray-600 m-0"><strong className="text-gray-900">Ustz. Aisyah</strong> membuat 20 soal PG Bahasa Arab</p>
                  <p className="text-[11px] text-gray-400 m-0 mt-0.5">12 menit lalu</p>
                </div>
              </div>
            </div>

            {/* Mock Item 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-white">UA</div>
                <div>
                  <p className="text-[13px] text-gray-600 m-0"><strong className="text-gray-900">Ust. Ahmad</strong> menyelesaikan RPP Thaharah</p>
                  <p className="text-[11px] text-gray-400 m-0 mt-0.5">2 jam lalu</p>
                </div>
              </div>
            </div>

            {/* Mock Item 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-white">UY</div>
                <div>
                  <p className="text-[13px] text-gray-600 m-0"><strong className="text-gray-900">Ust. Yusuf</strong> generate Silabus Al-Qur'an Hadis</p>
                  <p className="text-[11px] text-gray-400 m-0 mt-0.5">Kemarin</p>
                </div>
              </div>
            </div>

            {/* Mock Item 4 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-white">UM</div>
                <div>
                  <p className="text-[13px] text-gray-600 m-0"><strong className="text-gray-900">Ustz. Maryam</strong> menambah LKS Matematika</p>
                  <p className="text-[11px] text-gray-400 m-0 mt-0.5">Kemarin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GURU PALING AKTIF (MOCKUP) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-serif text-gray-900 m-0">Guru Paling Aktif</h3>
            <p className="text-[13px] text-gray-500 m-0 mt-1">Berdasarkan jumlah dokumen yang dihasilkan bulan ini.</p>
          </div>
          <Link href="/dashboard/kepsek/teachers" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors">
            Kelola guru <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">NAMA</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">MAPEL</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">STATUS</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">GENERATE</th>
                <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">TERAKHIR AKTIF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-4 text-[13px] text-gray-800 font-medium">Ustz. Aisyah Nurhaliza, S.Pd.</td>
                <td className="py-4 text-[13px] text-gray-500">Bahasa Arab</td>
                <td className="py-4"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-semibold">Aktif</span></td>
                <td className="py-4 text-[14px] text-gray-900 font-serif text-center">51</td>
                <td className="py-4 text-[12px] text-gray-400 text-right">12 menit lalu</td>
              </tr>
              <tr>
                <td className="py-4 text-[13px] text-gray-800 font-medium">Ust. Ahmad Fauzi, S.Pd.I.</td>
                <td className="py-4 text-[13px] text-gray-500">Fiqih</td>
                <td className="py-4"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-semibold">Aktif</span></td>
                <td className="py-4 text-[14px] text-gray-900 font-serif text-center">38</td>
                <td className="py-4 text-[12px] text-gray-400 text-right">2 jam lalu</td>
              </tr>
              <tr>
                <td className="py-4 text-[13px] text-gray-800 font-medium">Ustz. Maryam Zahra, S.Pd.</td>
                <td className="py-4 text-[13px] text-gray-500">Matematika</td>
                <td className="py-4"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-semibold">Aktif</span></td>
                <td className="py-4 text-[14px] text-gray-900 font-serif text-center">33</td>
                <td className="py-4 text-[12px] text-gray-400 text-right">3 jam lalu</td>
              </tr>
              <tr>
                <td className="py-4 text-[13px] text-gray-800 font-medium">Ust. Yusuf Maulana, M.Pd.</td>
                <td className="py-4 text-[13px] text-gray-500">Al-Qur'an Hadis</td>
                <td className="py-4"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-semibold">Aktif</span></td>
                <td className="py-4 text-[14px] text-gray-900 font-serif text-center">27</td>
                <td className="py-4 text-[12px] text-gray-400 text-right">1 hari lalu</td>
              </tr>
              <tr>
                <td className="py-4 text-[13px] text-gray-800 font-medium">Ust. Hamzah Ibrahim, S.Pd.</td>
                <td className="py-4 text-[13px] text-gray-500">Sejarah Kebudayaan Islam</td>
                <td className="py-4"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-semibold">Aktif</span></td>
                <td className="py-4 text-[14px] text-gray-900 font-serif text-center">19</td>
                <td className="py-4 text-[12px] text-gray-400 text-right">Kemarin</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
