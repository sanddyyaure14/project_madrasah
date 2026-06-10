"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const getFeatureLabel = (type) => {
  const map = {
    'multiple_choice': 'Soal Pilihan Ganda',
    'rubric': 'Rubrik Penilaian',
    'writing_feedback': 'Analisis Tulisan',
    'worksheet': 'Lembar Kerja Siswa',
    'presentation': 'Materi Presentasi',
    'syllabus': 'Silabus',
    'unit_plan': 'Modul Ajar / RPP',
    'academic_content': 'Materi Ajar'
  };
  return map[type] || type;
};

const getInitials = (name) => {
  if (!name) return "U";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const renderActivityText = (act) => {
  const name = act.nama_user || "Seseorang";
  const label = getFeatureLabel(act.feature_type);
  const topik = act.topik || "";
  const mapel = act.mata_pelajaran || "";
  
  let actionStr = `melakukan generate ${label}`;
  if (topik && mapel) {
    actionStr = `membuat ${label} dengan topik "${topik}" untuk mapel ${mapel}`;
  } else if (topik) {
    actionStr = `membuat ${label} dengan topik "${topik}"`;
  } else if (mapel) {
    actionStr = `membuat ${label} untuk mapel ${mapel}`;
  }

  return (
    <p className="text-[13px] text-gray-600 m-0">
      <strong className="text-gray-900">{name}</strong> {actionStr}
    </p>
  );
};

export default function KepsekDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [activeTeachers, setActiveTeachers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, pendingRes, teachersRes, activityRes] = await Promise.all([
        fetch(`${API_URL}/api/kepsek/dashboard/summary`, { headers }),
        fetch(`${API_URL}/api/kepsek/pending-teachers`, { headers }),
        fetch(`${API_URL}/api/kepsek/guru`, { headers }),
        fetch(`${API_URL}/api/kepsek/activity/recent`, { headers })
      ]);
      
      const summaryData = await summaryRes.json();
      const pendingData = await pendingRes.json();
      const teachersData = await teachersRes.json();
      const activityData = await activityRes.json();

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
      if (pendingData.success) {
        setPendingTeachers(pendingData.data);
      }
      if (teachersData.success) {
        setActiveTeachers(teachersData.data);
      }
      if (activityData.success) {
        setRecentActivities(activityData.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Summary & Pending Teachers on mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleReview = async (teacherId, action) => {
    setProcessingId(teacherId);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/kepsek/review-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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
        
        // Refresh semua data dashboard agar sinkron
        fetchData();
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
  const totalGuru = summary?.informasi_madrasah?.total_guru || 0;
  const generateBulanIni = summary?.informasi_madrasah?.total_generate_bulan_ini || 0;
  const menungguPersetujuan = pendingTeachers.length; // Uses dynamic array length
  const rataRataRating = summary?.informasi_madrasah?.rata_rata_rating || 0;
  const totalFeedbackRating = summary?.informasi_madrasah?.total_feedback_rating || 0;

  const myGenerate = summary?.informasi_saya?.dokumen_tersimpan || 0;
  const myMonthlyLimit = summary?.informasi_saya?.monthly_limit_saya || 100;
  const myDocs = summary?.informasi_saya?.dokumen_tersimpan || 0;
  const myRating = summary?.informasi_saya?.rata_rata_feedback || 0;
  const myTotalFeedback = summary?.informasi_saya?.total_feedback_saya || 0;

  const sortedTeachers = [...activeTeachers]
    .sort((a, b) => (b.total_generate_bulan_ini || 0) - (a.total_generate_bulan_ini || 0))
    .slice(0, 5);

  const renderMapel = (mapel) => {
    if (!mapel) return "-";
    if (Array.isArray(mapel)) return mapel.join(", ");
    return mapel;
  };

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

      {/* LABEL INFORMASI MADRASAH */}
      <div className="flex items-center gap-2 mb-4 mt-8">
        <svg className="w-5 h-5 text-emerald-600/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide m-0">INFORMASI MADRASAH</h3>
      </div>

      {/* KPI GRID MADRASAH (4 KARTU) */}
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

        {/* Kartu 2: Generate Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">GENERATE BULAN INI</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">{generateBulanIni}</h4>
          </div>
        </div>

        {/* Kartu 3: Menunggu Persetujuan */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">MENUNGGU PERSETUJUAN</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">{menungguPersetujuan}</h4>
          </div>
        </div>

        {/* Kartu 4: Feedback Rating */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">RATING MADRASAH</p>
            {rataRataRating === 0 || rataRataRating === "0" ? (
              <div>
                <h4 className="text-lg font-serif text-gray-400 m-0">Belum ada</h4>
                <p className="text-[11px] text-gray-400 m-0 mt-0.5">dari {totalFeedbackRating} feedback</p>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <h4 className="text-2xl font-serif text-gray-900 m-0">{rataRataRating}</h4>
                <span className="text-xs text-gray-500 font-medium">({totalFeedbackRating})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LABEL INFORMASI SAYA */}
      <div className="flex items-center gap-2 mb-4 mt-8">
        <svg className="w-5 h-5 text-emerald-600/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide m-0">INFORMASI SAYA (KEPALA MADRASAH)</h3>
      </div>

      {/* KPI GRID SAYA (3 KARTU) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kartu 1: Total Generate Saya */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">GENERATE SAYA</p>
            <div className="flex items-baseline gap-1">
              <h4 className="text-2xl font-serif text-gray-900 m-0">{myGenerate}</h4>
              <span className="text-lg text-gray-400 font-serif">/ ∞</span>
            </div>
          </div>
        </div>

        {/* Kartu 2: Dokumen Tersimpan */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">DOKUMEN TERSIMPAN</p>
            <h4 className="text-2xl font-serif text-gray-900 m-0">{myDocs}</h4>
          </div>
        </div>

        {/* Kartu 3: Feedback Saya */}
        <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">RATING SAYA</p>
            {myRating === 0 || myRating === "0" ? (
              <div>
                <h4 className="text-lg font-serif text-gray-400 m-0">Belum ada</h4>
                <p className="text-[11px] text-gray-400 m-0 mt-0.5">dari {myTotalFeedback} feedback</p>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <h4 className="text-2xl font-serif text-gray-900 m-0">{myRating}</h4>
                <span className="text-xs text-gray-500 font-medium">({myTotalFeedback})</span>
              </div>
            )}
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
                    <span className="font-medium text-gray-700">{teacher.email}</span> · {renderMapel(teacher.mata_pelajaran)}
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

      {/* GURU PALING AKTIF & AKTIVITAS TERBARU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Guru Paling Aktif */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
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
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">GENERATE</th>
                  <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">TERAKHIR AKTIF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-400">Belum ada data guru aktif.</td>
                  </tr>
                ) : (
                  sortedTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="py-4 text-[13px] text-gray-800 font-medium">{teacher.nama_lengkap}</td>
                      <td className="py-4 text-[13px] text-gray-500">{renderMapel(teacher.mata_pelajaran)}</td>
                      <td className="py-4 text-[14px] text-gray-900 font-serif text-center">{teacher.total_generate_bulan_ini || 0}</td>
                      <td className="py-4 text-[12px] text-gray-400 text-right">{teacher.last_login_at ? formatRelativeTime(teacher.last_login_at) : "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom Kanan: Aktivitas Terbaru */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <h3 className="text-lg font-serif text-gray-900 m-0 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Aktivitas Terbaru
          </h3>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Belum ada aktivitas terbaru.</p>
            ) : (
              recentActivities.slice(0, 5).map((act) => (
                <div key={act.request_id} className="relative flex items-center group">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 z-10 border-2 border-white">
                      {getInitials(act.nama_user)}
                    </div>
                    <div>
                      {renderActivityText(act)}
                      <p className="text-[11px] text-gray-400 m-0 mt-0.5">{formatRelativeTime(act.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
