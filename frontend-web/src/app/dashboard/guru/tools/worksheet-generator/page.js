"use client";
import { useState } from "react";
import Link from "next/link";
import RatingFeedback from "@/components/RatingFeedback";

const KELAS_OPTIONS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const TIPE_OPTIONS = ['pilihan ganda', 'isian', 'esai', 'praktik', 'observasi'];
const MAPEL_SUGGESTIONS = ['Akidah Akhlak', 'Al-Qur\'an Hadis', 'Fiqih', 'SKI', 'Bahasa Arab', 'Matematika', 'IPA', 'IPS', 'Bahasa Indonesia'];

export default function WorksheetGeneratorPage() {
  const [mapel, setMapel] = useState('');
  const [topik, setTopik] = useState('');
  const [kelas, setKelas] = useState('VII');
  const [durasi, setDurasi] = useState(45);
  const [tujuan, setTujuan] = useState('');
  const [tipeSelected, setTipeSelected] = useState(['isian']);
  const [loading, setLoading] = useState(false);
  const [lks, setLks] = useState(null);
  const [worksheetId, setWorksheetId] = useState(null);
  const [error, setError] = useState('');

  function toggleTipe(opt) {
    setTipeSelected(prev =>
      prev.includes(opt)
        ? prev.length > 1 ? prev.filter(t => t !== opt) : prev
        : [...prev, opt]
    );
  }

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!mapel.trim()) { setError('Mata pelajaran wajib diisi.'); return; }
    if (!topik.trim()) { setError('Topik bahasan wajib diisi.'); return; }
    setError('');
    setLoading(true);
    setLks(null);
    setWorksheetId(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/worksheet/generate-worksheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          mata_pelajaran: mapel.trim(),
          topik: topik.trim(),
          tingkat_kelas: kelas,
          durasi_menit: durasi,
          tipe_aktivitas: tipeSelected,
          tujuan_pembelajaran: tujuan.trim(),
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Gagal membuat worksheet.");
      setLks(resData.data?.worksheet);
      setWorksheetId(resData.data?.request_id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCetakPDF = async () => {
    if (!worksheetId) return;
    const token = sessionStorage.getItem("accessToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    try {
      const res = await fetch(`${apiUrl}/api/worksheet/worksheets/${worksheetId}/cetak-pdf`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LKS_${lks?.judul || 'worksheet'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh PDF: " + err.message);
    }
  };

  function handleReset() {
    setLks(null);
    setWorksheetId(null);
    setError('');
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700">
        ← Kembali ke Dashboard
      </Link>

      {/* HERO */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">📄</div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asesmen</p>
          <h2 className="text-xl font-bold text-gray-900">Worksheet Generator</h2>
          <p className="text-xs text-gray-500 mt-0.5">Buat Lembar Kerja Siswa (LKS) Madrasah instan dan siap cetak</p>
        </div>
      </div>

      {/* ===== GRID: FORM + PREVIEW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ===== FORM (fixed height sama dengan preview, tidak scroll) ===== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleGenerate} className="p-6 space-y-5">

              {/* Mata pelajaran */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={mapel}
                  onChange={e => { setMapel(e.target.value); if (error) setError(''); }}
                  placeholder="cth. Akidah Akhlak"
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MAPEL_SUGGESTIONS.map(s => (
                    <button key={s} type="button" onClick={() => setMapel(s)}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-700 transition">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topik */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Topik Bahasan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" value={topik}
                  onChange={e => { setTopik(e.target.value); if (error) setError(''); }}
                  placeholder="cth. Akhlak Terpuji kepada Orang Tua"
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
                />
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Kelas <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {KELAS_OPTIONS.map(opt => (
                    <button key={opt} type="button" onClick={() => setKelas(opt)}
                      className={`px-4 py-2 rounded-full text-sm border transition font-medium
                        ${kelas === opt ? 'bg-[#006747] text-white border-[#006747]' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durasi */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Durasi (Menit)</label>
                <input
                  type="number" value={durasi}
                  onChange={e => setDurasi(parseInt(e.target.value) || 0)}
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
                />
              </div>

              {/* Tipe aktivitas */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Tipe Aktivitas <span className="text-xs text-gray-400">(bisa lebih dari satu)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIPE_OPTIONS.map(opt => (
                    <button key={opt} type="button" onClick={() => toggleTipe(opt)}
                      className={`px-4 py-2 rounded-full text-sm border transition font-medium capitalize
                        ${tipeSelected.includes(opt) ? 'bg-[#006747] text-white border-[#006747]' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-emerald-600 italic mt-1.5">Terpilih: {tipeSelected.join(', ')}</p>
              </div>

              {/* Tujuan pembelajaran */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Tujuan Pembelajaran <span className="text-xs text-gray-400">(opsional)</span></label>
                <textarea
                  rows={2} value={tujuan}
                  onChange={e => setTujuan(e.target.value)}
                  placeholder="cth. Siswa mampu menjelaskan pengertian akhlak terpuji..."
                  className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 resize-none bg-gray-50"
                />
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
                    Menyusun LKS via Groq AI...
                  </>
                ) : <>🛠️ Generate LKS</>}
              </button>
            </form>
          </div>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {lks ? (
            <>
              {/* Toolbar — fixed, tidak ikut scroll */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                <p className="text-xs font-semibold text-gray-600">Pratinjau LKS</p>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCetakPDF}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition">
                    ⬇️ Unduh PDF
                  </button>
                  <button type="button" onClick={() => window.print()}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition print:hidden">
                    🖨️ Print
                  </button>
                  <button type="button" onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition">
                    ✕ Baru
                  </button>
                </div>
              </div>

              {/* LKS Content — scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* Header LKS */}
                <div className="text-center border-b-2 border-gray-800 pb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lembar Kerja Siswa (LKS)</p>
                  <h3 className="font-bold text-sm text-gray-900 uppercase">{lks.judul}</h3>
                  <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-gray-500 font-mono">Mapel: {lks.info?.mata_pelajaran}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] text-gray-500 font-mono">Kelas: {lks.info?.kelas}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] text-gray-500 font-mono">Waktu: {lks.info?.durasi}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">Topik: {lks.info?.topik}</p>
                </div>

                {/* Tujuan */}
                {lks.tujuan && (
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="font-bold text-emerald-800 mb-1">Tujuan Pembelajaran:</p>
                    <p className="text-gray-700 leading-relaxed">{lks.tujuan}</p>
                  </div>
                )}

                {/* Petunjuk */}
                {lks.petunjuk && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <p className="font-bold text-amber-800 mb-1">Petunjuk Pengerjaan:</p>
                    <p className="text-gray-700 leading-relaxed">{lks.petunjuk}</p>
                  </div>
                )}

                {/* Aktivitas */}
                {lks.aktivitas?.map((akt, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-emerald-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <p className="font-bold text-emerald-900 uppercase tracking-wide text-[11px]">Aktivitas {i + 1} — {akt.tipe}</p>
                    </div>
                    <p className="text-gray-500 italic leading-relaxed">{akt.instruksi}</p>
                    <div className="space-y-4">
                      {akt.soal?.map((s) => (
                        <div key={s.no}>
                          <p className="text-gray-800 font-medium">{s.no}. {s.pertanyaan}</p>
                          {Array.isArray(s.opsi) && s.opsi.length > 0 ? (
                            <ul className="mt-1.5 ml-4 space-y-1">
                              {s.opsi.map((opsi, j) => (
                                <li key={j} className="text-gray-600">{String.fromCharCode(65 + j)}. {opsi}</li>
                              ))}
                            </ul>
                          ) : (
                            <div className="mt-2 border-b border-gray-300 w-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 p-8">
              <span className="text-4xl">📋</span>
              <p className="font-medium">Pratinjau LKS akan tampil di sini</p>
              <p className="text-gray-300">Isi form di sebelah kiri lalu klik Generate LKS</p>
            </div>
          )}
        </div>

        {/* Rating & Feedback — di bawah panel, muncul setelah generate */}
        {lks && worksheetId && (
          <RatingFeedback requestId={worksheetId} featureLabel="worksheet" />
        )}
        </div>
      </div>
    </div>
  );
}