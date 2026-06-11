"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function ApprovalsPage() {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchPendingTeachers = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/api/kepsek/pending-teachers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setPendingTeachers(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch pending teachers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingTeachers();
  }, []);

  const handleReviewTeacher = async (teacherId, action) => {
    setProcessingId(teacherId);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/kepsek/review-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: teacherId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingTeachers(prev => prev.filter(t => t.id !== teacherId));
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-gray-900 m-0">Persetujuan Guru Baru</h1>
        <p className="text-[13px] text-gray-500 m-0 mt-2">
          Setujui agar guru dapat login dengan email & password yang mereka daftarkan.
        </p>
      </div>

      {/* Badge count */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span className="text-[13px] font-semibold text-gray-700">Akun Guru Menunggu</span>
          <span className="text-[11px] font-bold bg-[#006747] text-white px-2 py-0.5 rounded-full">
            {pendingTeachers.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : pendingTeachers.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <h2
              className="text-3xl font-serif text-[#ECA823] drop-shadow-sm mb-3"
              dir="rtl"
              style={{ fontFamily: "Amiri, serif", wordSpacing: "0.1em" }}
            >
              لا توجد طلبات
            </h2>
            <p className="text-[14px] text-gray-500 m-0">
              Tidak ada pendaftaran guru yang menunggu persetujuan.
            </p>
          </div>
        ) : (
          pendingTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-900 m-0 mb-1">
                    {teacher.nama_lengkap}
                  </h4>
                  <p className="text-[13px] text-gray-500 m-0 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-700">{teacher.email}</span>
                    {teacher.mata_pelajaran && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>{teacher.mata_pelajaran}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleReviewTeacher(teacher.id, "reject")}
                  disabled={processingId === teacher.id}
                  className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tolak
                </button>
                <button
                  onClick={() => handleReviewTeacher(teacher.id, "approve")}
                  disabled={processingId === teacher.id}
                  className="px-5 py-2.5 bg-[#006747] text-white rounded-xl text-[13px] font-semibold hover:bg-[#005238] shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {processingId === teacher.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Setujui
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
