"use client";

import { useState } from "react";
import Link from "next/link";
import RatingFeedback from "@/components/RatingFeedback";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function KepsekMultipleChoicePage() {
  const [formData, setFormData] = useState({
    mata_pelajaran: "",
    topik: "",
    tingkat_kelas: "VII",
    jumlah_soal: 10,
    tingkat_kesulitan: "Sedang",
    kd: "",
    include_kunci: true,
  });

  const [loading, setLoading]           = useState(false);
  const [questions, setQuestions]       = useState([]);
  const [mcId, setMcId]                 = useState(null);
  const [mcDocId, setMcDocId]           = useState(null);
  const [printLoading, setPrintLoading] = useState(false);
  const [error, setError]               = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQuestions([]);
    setMcId(null);
    setMcDocId(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Token login tidak ditemukan");

      const response = await fetch(`${API_URL}/api/generate-mc`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mata_pelajaran: formData.mata_pelajaran,
          topik: formData.topik,
          tingkat_kelas: formData.tingkat_kelas,
          jumlah_soal: Number(formData.jumlah_soal),
          tingkat_kesulitan: formData.tingkat_kesulitan,
          kd: formData.kd,
          include_kunci: formData.include_kunci,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal generate soal");

      setQuestions(result.data.questions || []);
      setMcId(result.request_id || result.data?.request_id || null);
      setMcDocId(result.mc_id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!mcDocId) return;
    setPrintLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/assessment/print/${mcDocId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Soal_${formData.topik || "pilihan_ganda"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh PDF: " + err.message);
    } finally {
      setPrintLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <Link href="/dashboard/kepsek" className="block -mt-4 text-xs font-medium text-gray-500 hover:text-emerald-700">
        ← Kembali ke Dashboard
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-2xl p-2 bg-emerald-50 rounded-xl">📝</span>
        <div>
          <h2 className="text-xl font-bold">Multiple Choice Assessment</h2>
          <p className="text-xs text-gray-500">Generate soal pilihan ganda otomatis untuk pembelajaran madrasah.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-start">
        {/* FORM */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mata Pelajaran <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["Akidah Akhlak", "Al-Qur'an Hadis", "Fiqih", "SKI", "Bahasa Arab", "Matematika", "IPA", "IPS", "Bahasa Indonesia"].map((m) => (
                    <button key={m} type="button" onClick={() => setFormData({...formData, mata_pelajaran: m})}
                      className={`px-3 py-1 text-xs rounded-full border transition ${formData.mata_pelajaran === m ? 'bg-[#006747] text-white border-[#006747]' : 'bg-white border-gray-200 text-gray-700'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kelas <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["VII","VIII","IX","X","XI","XII"].map((k) => (
                    <button key={k} type="button" onClick={() => setFormData({...formData, tingkat_kelas: k})}
                      className={`px-4 py-1 text-xs rounded-full border transition ${formData.tingkat_kelas === k ? 'bg-[#006747] text-white border-[#006747]' : 'bg-white border-gray-200 text-gray-700'}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Topik / Materi <span className="text-red-500">*</span></label>
                <textarea rows="3" required placeholder="cth. Thaharah, Wudhu..." className="w-full text-sm p-3 border border-gray-200 rounded-lg"
                  onChange={(e) => setFormData({ ...formData, topik: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jumlah Soal <span className="text-red-500">*</span></label>
                  <input type="number" value={formData.jumlah_soal} className="w-full text-sm p-2 border border-gray-200 rounded-lg"
                    onChange={(e) => setFormData({ ...formData, jumlah_soal: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kesulitan <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {["mudah","sedang","sulit"].map((lvl) => (
                      <button key={lvl} type="button" onClick={() => setFormData({...formData, tingkat_kesulitan: lvl})}
                        className={`flex-1 py-2 rounded-full text-xs capitalize border ${formData.tingkat_kesulitan.toLowerCase() === lvl ? 'bg-[#006747] text-white' : 'bg-white border-gray-200'}`}>
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kompetensi Dasar (KD)</label>
                <textarea rows="2" placeholder="cth. 3.1 Memahami ketentuan..." className="w-full text-sm p-3 border border-gray-200 rounded-lg"
                  onChange={(e) => setFormData({ ...formData, kd: e.target.value })} />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase">Sertakan Kunci Jawaban</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.include_kunci}
                    onChange={(e) => setFormData({ ...formData, include_kunci: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006747]"></div>
                </label>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#006747] hover:bg-emerald-800 text-white font-medium py-2 rounded-lg text-sm transition">
                {loading ? "Generating Questions..." : "🛠️ Generate Soal"}
              </button>
            </form>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            {questions.length > 0 ? (
              <>
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                  <p className="text-xs font-semibold text-gray-600">{questions.length} Soal Berhasil Dibuat</p>
                  <div className="flex gap-2">
                    {mcDocId && (
                      <button type="button" onClick={handlePrintPDF} disabled={printLoading}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition disabled:opacity-60">
                        {printLoading ? "Mengunduh..." : "🖨️ Print PDF"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="border-b pb-3">
                    <h3 className="text-lg font-bold text-gray-800">Hasil Generate Soal</h3>
                    <p className="text-xs text-gray-500 mt-1">Soal otomatis berhasil dibuat.</p>
                  </div>
                  {questions.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-800 mb-4">{index + 1}. {item.soal}</h4>
                      <div className="space-y-2">
                        {Object.entries(item.pilihan || {}).map(([key, value]) => (
                          <p key={key} className="text-sm text-gray-700">{key}. {value}</p>
                        ))}
                      </div>
                      {item.kunci && (
                        <div className="mt-4 text-sm font-semibold text-emerald-700">Jawaban: {item.kunci}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 p-8">
                <span className="text-4xl">📝</span>
                <p className="font-medium">Hasil Generate akan tampil di sini</p>
                <p className="text-gray-300">Isi form di sebelah kiri lalu klik Generate Soal</p>
              </div>
            )}
          </div>

          {questions.length > 0 && mcId && (
            <RatingFeedback requestId={mcId} featureLabel="soal pilihan ganda" endpoint="mc" />
          )}
        </div>
      </div>
    </div>
  );
}
