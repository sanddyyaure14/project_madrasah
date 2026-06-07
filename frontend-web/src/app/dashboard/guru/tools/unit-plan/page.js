"use client";

import { useState } from "react";
import Link from "next/link";
import RatingFeedback from "@/components/RatingFeedback";

const KELAS_OPTIONS = ["VII", "VIII", "IX", "X", "XI", "XII"];
const MAPEL_SUGGESTIONS = [
  "Fiqih", "Akidah Akhlak", "Al-Qur'an Hadis", "Bahasa Arab",
  "SKI", "Matematika", "IPA Terpadu", "Bahasa Indonesia",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function UnitPlanPage() {
  const [judulUnit, setJudulUnit] = useState("");
  const [mataPelajaran, setMataPelajaran] = useState("");
  const [kelas, setKelas] = useState("VII");
  const [tujuan, setTujuan] = useState("");
  const [jumlahPertemuan, setJumlahPertemuan] = useState(2);
  const [durasiJP, setDurasiJP] = useState(40);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [unitPlanId, setUnitPlanId] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!judulUnit.trim()) { setError("Judul Unit wajib diisi."); return; }
    if (!mataPelajaran.trim()) { setError("Mata Pelajaran wajib diisi."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    setUnitPlanId(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const response = await fetch(`${API_URL}/api/unit-plan/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          judul_unit: judulUnit.trim(),
          mata_pelajaran: mataPelajaran.trim(),
          tingkat_kelas: kelas,
          tujuan_pembelajaran: tujuan.trim(),
          jumlah_pertemuan: jumlahPertemuan,
          durasi_per_jp: durasiJP,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Gagal generate Unit Plan.");
      setResult(json.data?.unit_plan_json || json.data);
      setUnitPlanId(json.data?.request_id || json.request_id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [dlDocx, setDlDocx] = useState(false);

  async function handleDownloadDocx() {
    if (!unitPlanId) return;
    setDlDocx(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/unit-plan/download/${unitPlanId}/docx`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh DOCX");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unit_plan_${unitPlanId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh DOCX: " + err.message);
    } finally {
      setDlDocx(false);
    }
  }

  function handleReset() {
    setResult(null);
    setUnitPlanId(null);
    setError("");
  }

  const info = result?.informasi_umum;
  const inti = result?.komponen_inti;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      <Link href="/dashboard/guru" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700">
        ← Kembali ke Dashboard
      </Link>

      {/* HERO */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">📖</div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modul Ajar</p>
          <h2 className="text-xl font-bold text-gray-900">Unit Plan / RPP</h2>
          <p className="text-xs text-gray-500 mt-0.5">Rencana pembelajaran unit (RPP/Modul Ajar) lengkap siap pakai.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===== FORM ===== */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleGenerate} className="p-6 space-y-5">

          {/* Judul Unit */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Judul Materi / Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={judulUnit}
              onChange={(e) => { setJudulUnit(e.target.value); if (error) setError(""); }}
              placeholder="cth. Thaharah — Bersuci dalam Islam"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
          </div>

          {/* Mata Pelajaran */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mataPelajaran}
              onChange={(e) => { setMataPelajaran(e.target.value); if (error) setError(""); }}
              placeholder="cth. Fiqih"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {MAPEL_SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setMataPelajaran(s)}
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

          {/* Tujuan */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Tujuan Pembelajaran <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={tujuan}
              onChange={(e) => setTujuan(e.target.value)}
              placeholder="cth. Siswa mampu menjelaskan dan mempraktikkan thaharah"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 resize-none bg-gray-50"
            />
          </div>

          {/* Jumlah Pertemuan & Durasi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Jumlah Pertemuan</label>
              <input
                type="number" min={1} max={12}
                value={jumlahPertemuan}
                onChange={(e) => setJumlahPertemuan(parseInt(e.target.value) || 1)}
                className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Durasi per JP (menit)</label>
              <input
                type="number" min={30} max={90} step={5}
                value={durasiJP}
                onChange={(e) => setDurasiJP(parseInt(e.target.value) || 40)}
                className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
              />
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
                Menyusun Modul Ajar via Groq AI...
              </>
            ) : <>📖 Generate Modul Ajar / RPP</>}
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
                <p className="text-xs font-semibold text-gray-600">Pratinjau Modul Ajar / RPP</p>
                <div className="flex gap-2">
                  {unitPlanId && (
                    <button type="button" onClick={handleDownloadDocx} disabled={dlDocx}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition disabled:opacity-60">
                      {dlDocx ? "Mengunduh..." : "⬇️ Unduh DOCX"}
                    </button>
                  )}
                  <button type="button" onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition">
                    ✕ Baru
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Modul Ajar / RPP</p>
                  <h3 className="font-bold text-sm text-gray-900 uppercase">{info?.judul_unit || judulUnit}</h3>
                  <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-gray-500 font-mono">Mapel: {info?.mata_pelajaran || mataPelajaran}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] text-gray-500 font-mono">Kelas: {info?.kelas || kelas}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] text-gray-500 font-mono">{info?.alokasi_waktu}</span>
                  </div>
                </div>

                {/* Informasi Umum */}
                {info && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100 space-y-2">
                    <p className="font-bold text-emerald-800">Informasi Umum</p>
                    {info.target_peserta_didik && (
                      <p className="text-gray-700"><span className="font-semibold">Target:</span> {info.target_peserta_didik}</p>
                    )}
                    {info.profil_pelajar_pancasila?.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700">Profil Pelajar Pancasila:</p>
                        <p className="text-gray-600">{info.profil_pelajar_pancasila.join(", ")}</p>
                      </div>
                    )}
                    {info.sarana_prasarana?.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700">Sarana:</p>
                        <p className="text-gray-600">{info.sarana_prasarana.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tujuan Pembelajaran */}
                {inti?.tujuan_pembelajaran?.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-700 mb-2 uppercase tracking-wide">Tujuan Pembelajaran</p>
                    <ul className="space-y-1">
                      {inti.tujuan_pembelajaran.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pertanyaan Pemantik */}
                {inti?.pertanyaan_pemantik?.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <p className="font-bold text-amber-800 mb-2">Pertanyaan Pemantik</p>
                    <ul className="space-y-1">
                      {inti.pertanyaan_pemantik.map((q, i) => (
                        <li key={i} className="text-gray-700">💬 {q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Kegiatan Pembelajaran */}
                {inti?.kegiatan_pembelajaran?.map((prt, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-[#006747] text-white px-4 py-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Pertemuan ke-{prt.pertemuan_ke || i + 1}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {prt.pendahuluan?.length > 0 && (
                        <div>
                          <p className="font-semibold text-emerald-700 mb-1">Pendahuluan</p>
                          <ul className="space-y-1">
                            {prt.pendahuluan.map((item, j) => (
                              <li key={j} className="text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {prt.kegiatan_inti?.length > 0 && (
                        <div>
                          <p className="font-semibold text-blue-700 mb-1">Kegiatan Inti</p>
                          <ul className="space-y-1">
                            {prt.kegiatan_inti.map((item, j) => (
                              <li key={j} className="text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {prt.penutup?.length > 0 && (
                        <div>
                          <p className="font-semibold text-amber-700 mb-1">Penutup</p>
                          <ul className="space-y-1">
                            {prt.penutup.map((item, j) => (
                              <li key={j} className="text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Asesmen */}
                {inti?.asesmen?.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-700 mb-2 uppercase tracking-wide">Asesmen</p>
                    <ul className="space-y-1">
                      {inti.asesmen.map((a, i) => (
                        <li key={i} className="text-gray-700">• {a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 p-8">
              <span className="text-4xl">📖</span>
              <p className="font-medium">Pratinjau Modul Ajar akan tampil di sini</p>
              <p className="text-gray-300">Isi form di sebelah kiri lalu klik Generate</p>
            </div>
          )}
        </div>

        {/* Rating & Feedback — di bawah panel, muncul setelah generate */}
        {result && unitPlanId && (
          <RatingFeedback requestId={unitPlanId} featureLabel="modul ajar / RPP" />
        )}
        </div>
      </div>
    </div>
  );
}
