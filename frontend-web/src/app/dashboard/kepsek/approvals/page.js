"use client";

import { useState, useEffect } from "react";

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("dokumen"); // 'akun' or 'dokumen'
  
  // State for Akun Guru (from API)
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Fetch pending teachers on mount
  useEffect(() => {
    const fetchPendingTeachers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:3000/api/kepsek/pending-teachers?instansi_id=b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a");
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
      const res = await fetch("http://127.0.0.1:3000/api/kepsek/review-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: teacherId, action: action })
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

  // Mock data for Dokumen (moved to state to allow clicking)
  const [pendingDocuments, setPendingDocuments] = useState([
    { id: 1, type: "RPP", title: "RPP Fiqih Bab Thaharah - Kelas VII", author: "Ust. Ahmad Fauzi", time: "Hari ini, 09:12", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
    { id: 2, type: "SOAL", title: "Soal PG Bahasa Arab — Mufrodat Tema Keluarga", author: "Ustz. Aisyah Nurhaliza", time: "Hari ini, 08:45", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
    { id: 3, type: "SILABUS", title: "Silabus SKI Semester Ganjil Kelas VIII", author: "Ust. Hamzah Ibrahim", time: "Kemarin, 16:20", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
    { id: 4, type: "LKS", title: "LKS Matematika — Bilangan Bulat", author: "Ustz. Maryam Zahra", time: "Kemarin, 11:03", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
  ]);

  const handleReviewDocument = (id, action) => {
    // Simulasi API call dengan menghapus item dari list
    setPendingDocuments(prev => prev.filter(doc => doc.id !== id));
    // Tampilkan notifikasi sederhana
    alert(`Dokumen berhasil di${action === 'approve' ? 'setujui' : 'tolak'}!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif text-gray-900 m-0">Pusat Persetujuan</h1>
        <p className="text-[13px] text-gray-500 m-0 mt-2">Verifikasi akun guru baru dan tinjau dokumen sebelum dipublikasikan.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-[#F6F4EE] p-1.5 rounded-xl w-max border border-gray-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setActiveTab("akun")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
            activeTab === "akun" ? "bg-white text-gray-900 shadow-sm border border-gray-200/60" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Akun Guru
          <span className={`text-[10px] px-2 py-0.5 rounded-full ml-1 ${activeTab === 'akun' ? 'bg-[#006747] text-white' : 'bg-gray-200 text-gray-600'}`}>
            {pendingTeachers.length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab("dokumen")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
            activeTab === "dokumen" ? "bg-white text-gray-900 shadow-sm border border-gray-200/60" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Dokumen
          <span className={`text-[10px] px-2 py-0.5 rounded-full ml-1 ${activeTab === 'dokumen' ? 'bg-[#006747] text-white' : 'bg-gray-200 text-gray-600'}`}>
            {pendingDocuments.length}
          </span>
        </button>
      </div>

      {/* Tab Content: Akun Guru */}
      {activeTab === "akun" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {loading ? (
             <div className="bg-white border border-gray-100 rounded-2xl p-12 flex items-center justify-center shadow-sm">
                <div className="w-6 h-6 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin"></div>
             </div>
          ) : pendingTeachers.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <h2 className="text-3xl font-serif text-[#ECA823] drop-shadow-sm mb-3" dir="rtl" style={{ fontFamily: "Amiri, serif", wordSpacing: "0.1em" }}>
                لا توجد طلبات
              </h2>
              <p className="text-[14px] text-gray-500 m-0">Tidak ada pendaftaran guru yang menunggu verifikasi.</p>
            </div>
          ) : (
            pendingTeachers.map((teacher) => (
              <div key={teacher.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-gray-900 m-0 mb-1">{teacher.nama_lengkap}</h4>
                    <p className="text-[13px] text-gray-500 m-0 flex items-center gap-2">
                      <span className="font-medium text-gray-700">{teacher.email}</span>
                      <span className="text-gray-300">•</span>
                      <span>{teacher.mata_pelajaran}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleReviewTeacher(teacher.id, "reject")}
                    disabled={processingId === teacher.id}
                    className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Tolak
                  </button>
                  <button 
                    onClick={() => handleReviewTeacher(teacher.id, "approve")}
                    disabled={processingId === teacher.id}
                    className="px-5 py-2.5 bg-[#006747] text-white rounded-xl text-[13px] font-semibold hover:bg-[#005238] shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingId === teacher.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                    Setujui
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Dokumen */}
      {activeTab === "dokumen" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {pendingDocuments.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <h2 className="text-3xl font-serif text-[#ECA823] drop-shadow-sm mb-3" dir="rtl" style={{ fontFamily: "Amiri, serif", wordSpacing: "0.1em" }}>
                لا توجد طلبات
              </h2>
              <p className="text-[14px] text-gray-500 m-0">Tidak ada pengajuan dokumen yang menunggu verifikasi.</p>
            </div>
          ) : (
            pendingDocuments.map((doc) => (
              <div key={doc.id} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-md">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${doc.bg} ${doc.color} border ${doc.border}`}>
                        {doc.type}
                      </span>
                      <span className="text-[12px] text-gray-400 font-medium">
                        {doc.author} <span className="mx-1">•</span> {doc.time}
                      </span>
                    </div>
                    <h4 className="text-[16px] font-medium text-gray-900 m-0">{doc.title}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleReviewDocument(doc.id, "reject")}
                    className="px-5 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl text-[13px] font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Tolak
                  </button>
                  <button 
                    onClick={() => handleReviewDocument(doc.id, "approve")}
                    className="px-5 py-2.5 bg-[#006747] text-white rounded-xl text-[13px] font-semibold hover:bg-[#005238] shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Setujui
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
