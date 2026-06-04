"use client";

import { useState } from "react";
import Link from "next/link";

const JENIS_KONTEN_OPTIONS = [
  { label: "Rangkuman Materi", value: "ringkasan" },
  { label: "Penjelasan Konsep", value: "penjelasan" },
  { label: "Contoh Soal & Jawaban", value: "contoh_soal" },
  { label: "Glosarium", value: "kamus" },
];

const KELAS_OPTIONS = ["VII", "VIII", "IX", "X", "XI", "XII"];
const MAPEL_SUGGESTIONS = [
  "Fiqih", "Akidah Akhlak", "Al-Qur'an Hadis", "Bahasa Arab",
  "SKI", "Matematika", "IPA Terpadu", "Bahasa Indonesia",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function AcademicContentPage() {
  const [topik, setTopik] = useState("");
  const [mapel, setMapel] = useState("");
  const [kelas, setKelas] = useState("VII");
  const [jenisKonten, setJenisKonten] = useState("ringkasan");
  const [panjang, setPanjang] = useState("sedang");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [contentId, setContentId] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topik.trim()) { setError("Topik wajib diisi."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    setContentId(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const response = await fetch(`${API_URL}/api/academic-content/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jenis_konten: jenisKonten,
          topik: topik.trim(),
          mapel: mapel.trim() || "Umum",
          kelas: kelas,
          panjang: panjang,
          bahasa: "Indonesia",
          gaya_bahasa: "Akademik dan Informatif",
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Gagal generate konten.");
      setResult(json.data?.content_json || json.data);
      setContentId(json.data?.id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPDF() {
    if (!contentId) return;
    setDownloading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/academic-content/download/${contentId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academic_content_${contentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setContentId(null);
    setError("");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      <Link href="/dashboard/guru" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700">
        ← Kembali ke Dashboard
      </Link>

      {/* HERO */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">🎓</div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Konten Akademik</p>
          <h2 className="text-xl font-bold text-gray-900">Academic Content</h2>
          <p className="text-xs text-gray-500 mt-0.5">Konten akademik custom — rangkuman, penjelasan materi, contoh soal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===== FORM ===== */}
        <form onSubmit={handleGenerate} className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 h-fit">

          {/* Topik */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Topik <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topik}
              onChange={(e) => { setTopik(e.target.value); if (error) setError(""); }}
              placeholder="cth. Thaharah dalam Islam"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
          </div>

          {/* Mata Pelajaran */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Mata Pelajaran</label>
            <input
              type="text"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              placeholder="cth. Fiqih"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MAPEL_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setMapel(s)}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-700 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Kelas <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {KELAS_OPTIONS.map((opt) => (
                <button key={opt} type="button" onClick={() => setKelas(opt)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium
                    ${kelas === opt ? "bg-[#006747] text-white border-[#006747]" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Jenis Konten */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Jenis Konten</label>
            <div className="flex flex-wrap gap-2">
              {JENIS_KONTEN_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setJenisKonten(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium
                    ${jenisKonten === opt.value ? "bg-[#006747] text-white border-[#006747]" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Panjang */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Panjang Konten</label>
            <div className="flex flex-wrap gap-2">
              {["singkat", "sedang", "panjang"].map((p) => (
                <button key={p} type="button" onClick={() => setPanjang(p)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium capitalize
                    ${panjang === p ? "bg-[#006747] text-white border-[#006747]" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"}`}>
                  {p}
                </button>
              ))}
            </div>
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
                Menyusun Konten via Groq AI...
              </>
            ) : <>✦ Generate Academic Content</>}
          </button>
        </form>

        {/* ===== PREVIEW ===== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {result ? (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600">Hasil Academic Content</p>
                <div className="flex gap-2">
                  {contentId && (
                    <button type="button" onClick={handleDownloadPDF} disabled={downloading}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition disabled:opacity-60">
                      {downloading ? "Mengunduh..." : "⬇️ Unduh PDF"}
                    </button>
                  )}
                  <button type="button" onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition">
                    ✕ Baru
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5 text-sm">
                {/* Judul */}
                <div className="text-center border-b-2 border-gray-800 pb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Konten Akademik</p>
                  <h3 className="font-bold text-base text-gray-900">{result.judul}</h3>
                </div>

                {/* Ringkasan */}
                {result.ringkasan && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="font-bold text-emerald-800 mb-1 text-xs uppercase tracking-wide">Ringkasan</p>
                    <p className="text-gray-700 leading-relaxed text-sm">{result.ringkasan}</p>
                  </div>
                )}

                {/* Konten Utama */}
                {result.konten && (
                  <div>
                    <p className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-wide">Konten</p>
                    <div className="text-gray-700 leading-relaxed text-sm space-y-2">
                      {result.konten.split("\n").map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kata Kunci */}
                {result.kata_kunci?.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-500 mb-2 text-xs uppercase tracking-wide">Kata Kunci</p>
                    <div className="flex flex-wrap gap-2">
                      {result.kata_kunci.map((k, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referensi */}
                {result.referensi?.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <p className="font-bold text-amber-800 mb-2 text-xs uppercase tracking-wide">Referensi</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.referensi.map((r, i) => (
                        <li key={i} className="text-gray-700 text-xs leading-relaxed">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-72 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 p-8">
              <span className="text-4xl">🎓</span>
              <p className="font-medium">Hasil konten akademik akan tampil di sini</p>
              <p className="text-gray-300">Isi form di sebelah kiri lalu klik Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
