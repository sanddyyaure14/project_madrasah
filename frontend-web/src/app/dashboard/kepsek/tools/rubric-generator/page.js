"use client";

import { useState } from "react";
import Link from "next/link";
import RatingFeedback from "@/components/RatingFeedback";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function KepsekRubricGeneratorPage() {
  const [formData, setFormData] = useState({
    jenis_tugas: "",
    tujuan_pembelajaran: "",
    aspek_penilaian: "",
    skala_nilai: "1-4",
    tp_kd: "",
    deskripsi_tugas: "",
  });

  const [loading, setLoading]           = useState(false);
  const [rubric, setRubric]             = useState(null);
  const [rubricId, setRubricId]         = useState(null);
  const [rubicDocId, setRubicDocId]     = useState(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [error, setError]               = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRubric(null);
    setRubricId(null);
    setRubicDocId(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Token login tidak ditemukan");

      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_tugas: formData.jenis_tugas,
          tujuan_pembelajaran: formData.tujuan_pembelajaran,
          aspek_penilaian: formData.aspek_penilaian.split(",").map((item) => item.trim()).filter(Boolean),
          skala_nilai: formData.skala_nilai,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal generate rubrik");

      setRubric(result.data.rubric);
      setRubricId(result.data?.request_id || null);
      setRubicDocId(result.data?.rubic_id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!rubicDocId) return;
    setExcelLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/rubrics/${rubicDocId}/export-excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh Excel");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rubrik_${formData.jenis_tugas || "penilaian"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh Excel: " + err.message);
    } finally {
      setExcelLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-4">
      <Link href="/dashboard/kepsek" className="block -mt-4 text-xs font-medium text-gray-500 hover:text-emerald-700">
        ← Kembali ke Dashboard
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-2xl p-2 bg-amber-50 rounded-xl">📚</span>
        <div>
          <h2 className="text-xl font-bold">Rubric Generator</h2>
          <p className="text-xs text-gray-500">Generate rubric penilaian otomatis sesuai kebutuhan pembelajaran.</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-start">
        {/* FORM */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Tugas / Aktivitas *</label>
                <input className="w-full text-sm p-3 border border-gray-200 rounded-lg" placeholder="Contoh: Presentasi Kelompok"
                  value={formData.jenis_tugas} onChange={(e) => setFormData({...formData, jenis_tugas: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tujuan Pembelajaran *</label>
                <input className="w-full text-sm p-3 border border-gray-200 rounded-lg" placeholder="Masukkan Tujuan Pembelajaran"
                  value={formData.tujuan_pembelajaran} onChange={(e) => setFormData({...formData, tujuan_pembelajaran: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aspek Penilaian * (Pisahkan dengan koma)</label>
                <textarea rows="3" className="w-full text-sm p-3 border border-gray-200 rounded-lg" placeholder="Contoh: Isi Materi, Penyampaian, Kerja Sama"
                  value={formData.aspek_penilaian} onChange={(e) => setFormData({...formData, aspek_penilaian: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Skala Nilai *</label>
                <div className="flex gap-2">
                  {["1-4","1-10","1-100"].map(s => (
                    <button key={s} type="button" onClick={() => setFormData({...formData, skala_nilai: s})}
                      className={`px-4 py-2 text-xs rounded-full border transition ${formData.skala_nilai === s ? "bg-[#006747] text-white border-[#006747]" : "bg-white border-gray-200 text-gray-700"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">TP / KD (Opsional)</label>
                <input className="w-full text-sm p-3 border border-gray-200 rounded-lg" placeholder="Contoh: 3.1 Memahami ketentuan..."
                  value={formData.tp_kd} onChange={(e) => setFormData({...formData, tp_kd: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi Tugas (Opsional)</label>
                <textarea rows="3" className="w-full text-sm p-3 border border-gray-200 rounded-lg" placeholder="Contoh: Siswa diminta untuk..."
                  value={formData.deskripsi_tugas} onChange={(e) => setFormData({...formData, deskripsi_tugas: e.target.value})} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#006747] hover:bg-emerald-800 text-white font-medium py-2 rounded-lg text-sm transition">
                {loading ? "Generating Rubric..." : "📚 Generate Rubrik"}
              </button>
            </form>
          </div>
        </div>

        {/* HASIL */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            {rubric ? (
              <div className="flex-1 overflow-y-auto overflow-x-auto p-6 space-y-5">
                <div className="border-b pb-3 mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{rubric.judul}</h3>
                    <p className="text-xs text-gray-500 mt-1">{rubric.tujuan_pembelajaran}</p>
                  </div>
                  {rubicDocId && (
                    <button type="button" onClick={handleExportExcel} disabled={excelLoading}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition disabled:opacity-60">
                      {excelLoading ? "Mengunduh..." : "📊 Export Excel"}
                    </button>
                  )}
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#006747] text-white">
                      <th className="p-3 text-left">Aspek</th>
                      <th className="p-3 text-left">Bobot</th>
                      {rubric.aspek?.[0]?.level?.map((lvl, idx) => (
                        <th key={idx} className="p-3 text-left">{lvl.nama}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rubric.aspek?.map((aspek, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-3 font-medium">{aspek.nama}</td>
                        <td className="p-3">{aspek.bobot}%</td>
                        {aspek.level?.map((level, idx) => (
                          <td key={idx} className="p-3">
                            <div className="font-medium">{level.skor}</div>
                            <div className="text-xs text-gray-600 mt-1">{level.deskripsi}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 p-8">
                <span className="text-4xl">📚</span>
                <p className="font-medium">Hasil Rubric akan tampil di sini</p>
                <p className="text-gray-300">Isi form di sebelah kiri lalu klik Generate Rubric</p>
              </div>
            )}
          </div>

          {rubric && rubricId && (
            <RatingFeedback requestId={rubricId} featureLabel="rubrik penilaian" endpoint="rubric" />
          )}
        </div>
      </div>
    </div>
  );
}
