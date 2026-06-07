"use client";

import { useState } from "react";
import Link from "next/link";

const JENIS_KONTEN_OPTIONS = [
  { label: "Rangkuman Materi", value: "ringkasan", icon: "📋", desc: "Poin-poin terstruktur" },
  { label: "Penjelasan Konsep", value: "penjelasan", icon: "💡", desc: "Paragraf mendalam" },
  { label: "Contoh Soal & Jawaban", value: "contoh_soal", icon: "✏️", desc: "Soal + pembahasan" },
  { label: "Glosarium", value: "kamus", icon: "📖", desc: "Daftar istilah" },
];

const KELAS_OPTIONS = ["VII", "VIII", "IX", "X", "XI", "XII"];
const MAPEL_SUGGESTIONS = [
  "Fiqih", "Akidah Akhlak", "Al-Qur'an Hadis", "Bahasa Arab",
  "SKI", "Matematika", "IPA Terpadu", "Bahasa Indonesia",
];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Komponen render tiap tipe ──────────────────────────────────────────────

function RenderRingkasan({ data }) {
  return (
    <div className="space-y-5 text-sm">
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Ringkasan Keseluruhan</p>
        <p className="text-gray-700 leading-relaxed">{data.ringkasan}</p>
      </div>

      {data.poin_penting?.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Poin-Poin Penting</p>
          {data.poin_penting.map((poin, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#006747] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <h4 className="font-bold text-gray-900 text-sm">{poin.subjudul}</h4>
              </div>
              <p className="text-gray-600 leading-relaxed pl-8">{poin.isi}</p>
            </div>
          ))}
        </div>
      )}

      {data.kesimpulan && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Kesimpulan</p>
          <p className="text-gray-700 leading-relaxed">{data.kesimpulan}</p>
        </div>
      )}
    </div>
  );
}

function RenderPenjelasan({ data }) {
  return (
    <div className="space-y-5 text-sm">
      {data.ringkasan && (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Ringkasan</p>
          <p className="text-gray-700 leading-relaxed">{data.ringkasan}</p>
        </div>
      )}

      {data.pendahuluan && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Pendahuluan</p>
          <p className="text-gray-700 leading-relaxed">{data.pendahuluan}</p>
        </div>
      )}

      {data.konten && (
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Penjelasan Lengkap</p>
          <div className="text-gray-700 leading-relaxed space-y-3">
            {data.konten.split(/\n\n|\n/).filter(p => p.trim()).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
        </div>
      )}

      {data.contoh_penerapan && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Contoh Penerapan</p>
          <p className="text-gray-700 leading-relaxed">{data.contoh_penerapan}</p>
        </div>
      )}
    </div>
  );
}

function RenderContohSoal({ data }) {
  const [showJawaban, setShowJawaban] = useState({});
  const soalList = data.soal || [];

  function toggleJawaban(i) {
    setShowJawaban(prev => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <div className="space-y-5 text-sm">
      {data.ringkasan && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">Informasi Set Soal</p>
          <p className="text-gray-700 leading-relaxed">{data.ringkasan}</p>
        </div>
      )}

      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        {soalList.length} Soal
      </p>

      {soalList.map((soal, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Nomor + Pertanyaan */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-[#006747] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {soal.nomor || i + 1}
              </span>
              <p className="text-gray-900 font-medium leading-relaxed">{soal.pertanyaan}</p>
            </div>

            {/* Pilihan Ganda */}
            {soal.pilihan && typeof soal.pilihan === 'object' && (
              <div className="mt-3 ml-10 space-y-2">
                {Object.entries(soal.pilihan).map(([key, val]) => (
                  <div key={key}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                      showJawaban[i] && soal.jawaban === key
                        ? "bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold"
                        : "bg-gray-50 border border-gray-200 text-gray-700"
                    }`}>
                    <span className="font-bold shrink-0">{key}.</span>
                    <span>{val}</span>
                    {showJawaban[i] && soal.jawaban === key && (
                      <span className="ml-auto shrink-0 text-emerald-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggle Jawaban */}
          <div className="border-t border-gray-100">
            <button
              type="button"
              onClick={() => toggleJawaban(i)}
              className="w-full text-xs font-semibold text-[#006747] hover:bg-emerald-50 px-4 py-2.5 text-left transition flex items-center justify-between">
              <span>{showJawaban[i] ? "▲ Sembunyikan Jawaban" : "▼ Lihat Jawaban & Pembahasan"}</span>
              {!showJawaban[i] && soal.jawaban && (
                <span className="text-gray-400 font-normal">Jawaban: {soal.jawaban}</span>
              )}
            </button>

            {showJawaban[i] && (
              <div className="px-4 pb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <span>✓ Jawaban Benar: {soal.jawaban}</span>
                </div>
                {soal.pembahasan && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide mb-1">Pembahasan</p>
                    <p className="text-gray-700 leading-relaxed text-sm">{soal.pembahasan}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderKamus({ data }) {
  const [search, setSearch] = useState("");
  const istilahList = (data.istilah || []).filter(item =>
    item.kata?.toLowerCase().includes(search.toLowerCase()) ||
    item.definisi?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 text-sm">
      {data.ringkasan && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-1">Tentang Glosarium Ini</p>
          <p className="text-gray-700 leading-relaxed">{data.ringkasan}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari istilah..."
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-purple-400 bg-gray-50"
        />
      </div>

      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
        {istilahList.length} Istilah
      </p>

      {istilahList.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 hover:border-purple-200 transition">
          <div className="flex items-start gap-3">
            <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded shrink-0 mt-0.5">
              {item.kata}
            </span>
            <div className="flex-1">
              <p className="text-gray-800 leading-relaxed">{item.definisi}</p>
              {item.contoh && item.contoh.trim() && (
                <p className="text-gray-500 italic text-xs mt-1.5 border-l-2 border-purple-200 pl-2">
                  Contoh: {item.contoh}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {istilahList.length === 0 && (
        <div className="text-center text-gray-400 text-xs py-6">
          Tidak ada istilah yang cocok dengan "{search}"
        </div>
      )}
    </div>
  );
}

// ── Komponen preview label per tipe ──────────────────────────────────────
const JENIS_META = {
  ringkasan:   { label: "Rangkuman Materi", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "📋" },
  penjelasan:  { label: "Penjelasan Konsep", color: "bg-blue-100 text-blue-800 border-blue-200", icon: "💡" },
  contoh_soal: { label: "Contoh Soal & Jawaban", color: "bg-amber-100 text-amber-800 border-amber-200", icon: "✏️" },
  kamus:       { label: "Glosarium Istilah", color: "bg-purple-100 text-purple-800 border-purple-200", icon: "📖" },
};

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AcademicContentPage() {
  const [topik, setTopik] = useState("");
  const [mapel, setMapel] = useState("");
  const [kelas, setKelas] = useState("VII");
  const [jenisKonten, setJenisKonten] = useState("ringkasan");
  const [panjang, setPanjang] = useState("sedang");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeJenis, setActiveJenis] = useState(null); // tipe saat generate dilakukan
  const [contentId, setContentId] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topik.trim()) { setError("Topik wajib diisi."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    setContentId(null);
    setActiveJenis(jenisKonten); // simpan tipe yang dipilih

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const response = await fetch(`${API_URL}/api/academic-content/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_konten: jenisKonten,
          topik: topik.trim(),
          mapel: mapel.trim() || "Umum",
          kelas,
          panjang,
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
      a.href = url; a.download = `konten_${contentId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert("Gagal unduh PDF: " + err.message); }
    finally { setDownloading(false); }
  }

  function handleReset() { setResult(null); setContentId(null); setError(""); }

  const meta = JENIS_META[activeJenis] || JENIS_META.penjelasan;

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
          <p className="text-xs text-gray-500 mt-0.5">Konten akademik custom — rangkuman, penjelasan materi, contoh soal, glosarium.</p>
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
              Topik <span className="text-red-500">*</span>
            </label>
            <input type="text" value={topik}
              onChange={(e) => { setTopik(e.target.value); if (error) setError(""); }}
              placeholder="cth. Thaharah dalam Islam"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
          </div>

          {/* Mata Pelajaran */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Mata Pelajaran</label>
            <input type="text" value={mapel} onChange={(e) => setMapel(e.target.value)}
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">Kelas</label>
            <div className="flex flex-wrap gap-2">
              {KELAS_OPTIONS.map((opt) => (
                <button key={opt} type="button" onClick={() => setKelas(opt)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium ${kelas === opt ? "bg-[#006747] text-white border-[#006747]" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Jenis Konten */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Jenis Konten</label>
            <div className="grid grid-cols-2 gap-2">
              {JENIS_KONTEN_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setJenisKonten(opt.value)}
                  className={`flex items-start gap-2 p-3 rounded-xl text-left border transition ${jenisKonten === opt.value ? "bg-[#006747] text-white border-[#006747]" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"}`}>
                  <span className="text-base shrink-0">{opt.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${jenisKonten === opt.value ? "text-white" : "text-gray-800"}`}>{opt.label}</p>
                    <p className={`text-[10px] mt-0.5 ${jenisKonten === opt.value ? "text-emerald-100" : "text-gray-400"}`}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Panjang */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Panjang Konten</label>
            <div className="flex gap-2">
              {["singkat", "sedang", "panjang"].map((p) => (
                <button key={p} type="button" onClick={() => setPanjang(p)}
                  className={`flex-1 py-2 rounded-full text-sm border transition font-medium capitalize text-center ${panjang === p ? "bg-[#006747] text-white border-[#006747]" : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"}`}>
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
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyusun via Groq AI...</>
            ) : <>✦ Generate {JENIS_KONTEN_OPTIONS.find(o => o.value === jenisKonten)?.label}</>}
          </button>
            </form>
          </div>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {result ? (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>
                </div>
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
              <div className="overflow-y-auto flex-1 p-6">
                {/* Judul */}
                <div className="text-center border-b pb-4 mb-5">
                  <h3 className="font-bold text-base text-gray-900 leading-snug">{result.judul}</h3>
                </div>

                {/* Render berdasarkan tipe */}
                {activeJenis === "ringkasan"   && <RenderRingkasan data={result} />}
                {activeJenis === "penjelasan"  && <RenderPenjelasan data={result} />}
                {activeJenis === "contoh_soal" && <RenderContohSoal data={result} />}
                {activeJenis === "kamus"       && <RenderKamus data={result} />}

                {/* Kata Kunci — selalu tampil */}
                {result.kata_kunci?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kata Kunci</p>
                    <div className="flex flex-wrap gap-2">
                      {result.kata_kunci.map((k, i) => (
                        <span key={i} className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referensi — selalu tampil */}
                {result.referensi?.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Referensi</p>
                    <ul className="list-disc list-inside space-y-1">
                      {result.referensi.map((r, i) => (
                        <li key={i} className="text-gray-600 text-xs leading-relaxed">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs gap-3 p-8">
              <span className="text-5xl">{JENIS_KONTEN_OPTIONS.find(o => o.value === jenisKonten)?.icon || "🎓"}</span>
              <p className="font-medium text-gray-500">
                {JENIS_KONTEN_OPTIONS.find(o => o.value === jenisKonten)?.label} akan tampil di sini
              </p>
              <p className="text-gray-300 text-center">Isi form di sebelah kiri lalu klik Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
