"use client";

import { useState } from "react";
import Link from "next/link";
import RatingFeedback from "@/components/RatingFeedback";

const AUDIENS_OPTIONS = ["Siswa MI", "Siswa MTs", "Siswa MA", "Guru", "Orang Tua", "Umum"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function PresentationGeneratorPage() {
  const [topik, setTopik] = useState("");
  const [jumlahSlide, setJumlahSlide] = useState(8);
  const [tujuan, setTujuan] = useState("");
  const [audiens, setAudiens] = useState("Siswa MTs");
  const [includeCatatan, setIncludeCatatan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [presentationId, setPresentationId] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topik.trim()) { setError("Topik wajib diisi."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    setPresentationId(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const response = await fetch(`${API_URL}/api/presentation/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topik: topik.trim(),
          jumlah_slide: jumlahSlide,
          tujuan: tujuan.trim() || "Edukasi / Penjelasan Materi",
          audiens: audiens,
          include_catatan: includeCatatan,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Gagal generate presentasi.");
      setResult(json.data?.slides_json || json.data);
      setPresentationId(json.data?.request_id || json.request_id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [dlPPT, setDlPPT] = useState(false);

  async function handleDownloadPPT() {
    if (!presentationId) return;
    setDlPPT(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/presentation/download/${presentationId}/ppt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh PPT");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presentation_${presentationId}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh PPT: " + err.message);
    } finally {
      setDlPPT(false);
    }
  }

  function handleReset() {
    setResult(null);
    setPresentationId(null);
    setError("");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      <Link href="/dashboard/guru" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700">
        ← Kembali ke Dashboard
      </Link>

      {/* HERO */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🖥️</div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Konten Akademik</p>
          <h2 className="text-xl font-bold text-gray-900">Presentation Generator</h2>
          <p className="text-xs text-gray-500 mt-0.5">Generate outline dan konten presentasi slide siap pakai.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===== FORM ===== */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleGenerate} className="p-6 space-y-5">

          {/* Topik */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Topik Presentasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topik}
              onChange={(e) => { setTopik(e.target.value); if (error) setError(""); }}
              placeholder="cth. Akhlak Mulia dalam Kehidupan Sehari-hari"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
          </div>

          {/* Tujuan */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Tujuan Presentasi <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="cth. Siswa memahami pentingnya akhlak mulia"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 resize-none bg-gray-50"
            />
          </div>

          {/* Target Audiens */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Target Audiens</label>
            <div className="flex flex-wrap gap-2">
              {AUDIENS_OPTIONS.map((a) => (
                <button key={a} type="button" onClick={() => setAudiens(a)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition font-medium
                    ${audiens === a ? "bg-[#006747] text-white border-[#006747]" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Jumlah Slide */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Jumlah Slide: <span className="text-emerald-700">{jumlahSlide} slide</span>
            </label>
            <input
              type="range" min={4} max={20} step={1}
              value={jumlahSlide}
              onChange={(e) => setJumlahSlide(parseInt(e.target.value))}
              className="w-full accent-[#006747]"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>4</span><span>12</span><span>20</span>
            </div>
          </div>

          {/* Catatan Presenter */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              id="catatan"
              checked={includeCatatan}
              onChange={(e) => setIncludeCatatan(e.target.checked)}
              className="w-4 h-4 accent-[#006747] cursor-pointer"
            />
            <label htmlFor="catatan" className="text-sm font-medium text-gray-700 cursor-pointer">
              Sertakan catatan presenter
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <span className="text-red-500 text-sm">⚠</span>
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#006747] hover:bg-emerald-800 text-white font-bold py-4 rounded-xl text-sm transition disabled:opacity-70">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyusun Presentasi via Groq AI...
              </>
            ) : <>🖥️ Generate Presentasi</>}
          </button>
            </form>
          </div>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {result ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600">
                  Pratinjau Presentasi — {Array.isArray(result) ? result.length : result?.slides_json?.length || 0} slide
                </p>
                <div className="flex gap-2">
                  {presentationId && (
                    <button type="button" onClick={handleDownloadPPT} disabled={dlPPT}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition disabled:opacity-60">
                      {dlPPT ? "Mengunduh..." : "⬇️ Unduh PPT"}
                    </button>
                  )}
                  <button type="button" onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition">
                    ✕ Baru
                  </button>
                </div>
              </div>

              {/* Slides */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
                {(Array.isArray(result) ? result : result?.slides_json || []).map((slide, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Slide Header */}
                    <div className="bg-[#006747] text-white px-4 py-2.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Slide {slide.slide_number || i + 1}</span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 text-sm mb-3">{slide.title}</h4>
                      {Array.isArray(slide.content) ? (
                        <ul className="space-y-1.5">
                          {slide.content.map((point, j) => (
                            <li key={j} className="flex items-start gap-2 text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-700 leading-relaxed">{slide.content}</p>
                      )}
                      {slide.catatan && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Catatan Presenter</p>
                          <p className="text-gray-600 leading-relaxed">{slide.catatan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 p-8">
              <span className="text-4xl">🖥️</span>
              <p className="font-medium">Pratinjau slide presentasi akan tampil di sini</p>
              <p className="text-gray-300">Isi form di sebelah kiri lalu klik Generate</p>
            </div>
          )}
        </div>

        {/* Rating & Feedback — di bawah panel, muncul setelah generate */}
        {result && presentationId && (
          <RatingFeedback requestId={presentationId} featureLabel="presentasi" />
        )}
        </div>
      </div>
    </div>
  );
}