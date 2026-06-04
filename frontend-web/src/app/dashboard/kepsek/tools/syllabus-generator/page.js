"use client";

import { useState, useRef } from "react";

const MATA_PELAJARAN_OPTIONS = [
  "Fiqih", "Akidah Akhlak", "Al-Qur'an Hadis", "Bahasa Arab",
  "SKI", "Matematika", "IPA Terpadu", "Bahasa Indonesia",
  "Bahasa Inggris", "PPKn",
];
const KELAS_OPTIONS = ["VII", "VIII", "IX", "X", "XI", "XII"];
const KURIKULUM_OPTIONS = [
  { label: "Merdeka Belajar", value: "Merdeka" },
  { label: "Kurikulum 2013", value: "K13" },
];
const SEMESTER_OPTIONS = [
  { label: "Ganjil", value: "ganjil" },
  { label: "Genap", value: "genap" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function KepsekSyllabusGeneratorPage() {
  const [mataPelajaran, setMataPelajaran] = useState("Fiqih");
  const [kelas, setKelas] = useState("VII");
  const [kurikulum, setKurikulum] = useState("Merdeka");
  const [semester, setSemester] = useState("ganjil");
  const [tahunAjaran, setTahunAjaran] = useState("2025/2026");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [syllabusId, setSyllabusId] = useState(null);
  const [error, setError] = useState("");
  const [dlPDF, setDlPDF] = useState(false);
  const [dlDocx, setDlDocx] = useState(false);
  const [savingPDF, setSavingPDF] = useState(false);
  const previewRef = useRef(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);
    setSyllabusId(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const jenjang = ["VII", "VIII", "IX"].includes(kelas) ? "MTs" : "MA";

      const response = await fetch(`${API_URL}/api/syllabus/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mata_pelajaran: mataPelajaran,
          kurikulum: kurikulum,
          jenjang: jenjang,
          tingkat_kelas: kelas,
          semester: semester,
          tahun_ajaran: tahunAjaran,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Gagal generate silabus.");
      setResult(json.data?.silabus_json || json.data);
      setSyllabusId(json.data?.id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download via backend (jika ID tersedia)
  async function handleDownload(type) {
    if (!syllabusId) return;
    const setDl = type === "pdf" ? setDlPDF : setDlDocx;
    setDl(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/api/syllabus/download/${syllabusId}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Gagal mengunduh ${type.toUpperCase()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syllabus_${syllabusId}.${type}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Gagal unduh ${type.toUpperCase()}: ` + err.message);
    } finally {
      setDl(false);
    }
  }

  // Client-side PDF: buka print dialog dengan konten yang diformat
  function handleSavePDF() {
    if (!result) return;
    setSavingPDF(true);

    const tableRows = (result.tabel_silabus || []).map((row, i) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
        <td style="padding:8px;text-align:center;font-weight:bold;color:#006747;border:1px solid #e5e7eb">${row.minggu_ke}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${row.kompetensi_dasar}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${row.materi_pokok}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${row.kegiatan_pembelajaran}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${row.penilaian}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px;white-space:nowrap">${row.alokasi_waktu}</td>
        <td style="padding:8px;border:1px solid #e5e7eb;font-size:11px">${row.sumber_belajar}</td>
      </tr>`).join("");

    const kiList = (result.kompetensi_inti || []).map(ki => `<li style="margin-bottom:4px">${ki}</li>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Silabus — ${mataPelajaran} Kelas ${kelas}</title>
  <style>
    @page { size: A4 landscape; margin: 15mm; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1f2937; margin: 0; padding: 0; }
    .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 12px; margin-bottom: 16px; }
    .badge { font-size: 10px; font-weight: bold; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; }
    h1 { font-size: 16px; margin: 4px 0; text-transform: uppercase; }
    .meta { display: flex; justify-content: center; gap: 16px; margin-top: 6px; font-size: 10px; color: #6b7280; }
    .section-title { font-size: 10px; font-weight: bold; color: #6b7280; letter-spacing: 2px; text-transform: uppercase; margin: 16px 0 8px; }
    .ki-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
    .ki-box ul { margin: 4px 0 0; padding-left: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead tr { background: #006747; color: white; }
    thead th { padding: 8px; text-align: left; font-size: 11px; border: 1px solid #005a3c; }
    .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: right; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="badge">Silabus Pembelajaran — MadrasahAI</p>
    <h1>${result.judul_silabus || "Silabus"}</h1>
    <div class="meta">
      <span>Mapel: <strong>${mataPelajaran}</strong></span>
      <span>|</span>
      <span>Kelas: <strong>${kelas}</strong></span>
      <span>|</span>
      <span>Kurikulum: <strong>${kurikulum}</strong></span>
      <span>|</span>
      <span>Semester: <strong>${semester}</strong></span>
      <span>|</span>
      <span>T.A: <strong>${tahunAjaran}</strong></span>
    </div>
  </div>

  ${kiList ? `
  <p class="section-title">Kompetensi Inti</p>
  <div class="ki-box"><ul>${kiList}</ul></div>
  ` : ""}

  ${tableRows ? `
  <p class="section-title">Tabel Silabus</p>
  <table>
    <thead>
      <tr>
        <th>Minggu</th>
        <th>Kompetensi Dasar</th>
        <th>Materi Pokok</th>
        <th>Kegiatan Pembelajaran</th>
        <th>Penilaian</th>
        <th>Waktu</th>
        <th>Sumber</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  ` : ""}

  <div class="footer">Dibuat dengan MadrasahAI · ${new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" })}</div>
</body>
</html>`;

    const printWin = window.open("", "_blank", "width=1200,height=800");
    printWin.document.write(html);
    printWin.document.close();
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
      setSavingPDF(false);
    };
    // fallback jika onload tidak terpanggil
    setTimeout(() => setSavingPDF(false), 3000);
  }

  function handleReset() {
    setResult(null);
    setSyllabusId(null);
    setError("");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* PAGE HEADER */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shrink-0">
          📋
        </div>
        <div>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
            Silabus Kurikulum
          </p>
          <h2 className="text-xl font-bold text-gray-900">Syllabus Generator</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Buat silabus lengkap sesuai kurikulum (Merdeka/K13) dan jenjang madrasah via AI.
          </p>
        </div>
      </div>

      {/* Info Banner untuk Kepsek */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <span className="text-lg shrink-0">🏫</span>
        <p className="text-xs text-amber-800 font-medium">
          Sebagai Kepala Madrasah, Anda dapat membuat dan mengunduh silabus sebagai referensi
          pengawasan kurikulum.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ===== FORM ===== */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 h-fit"
        >
          {/* Mata Pelajaran */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MATA_PELAJARAN_OPTIONS.map((mp) => (
                <button
                  key={mp}
                  type="button"
                  onClick={() => setMataPelajaran(mp)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition font-medium
                    ${
                      mataPelajaran === mp
                        ? "bg-[#006747] text-white border-[#006747]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
                    }`}
                >
                  {mp}
                </button>
              ))}
            </div>
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Kelas <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {KELAS_OPTIONS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKelas(k)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium
                    ${
                      kelas === k
                        ? "bg-[#006747] text-white border-[#006747]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
                    }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Kurikulum */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Kurikulum</label>
            <div className="flex flex-wrap gap-2">
              {KURIKULUM_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKurikulum(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium
                    ${
                      kurikulum === opt.value
                        ? "bg-[#006747] text-white border-[#006747]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Semester</label>
            <div className="flex flex-wrap gap-2">
              {SEMESTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSemester(opt.value)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium
                    ${
                      semester === opt.value
                        ? "bg-[#006747] text-white border-[#006747]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-400"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tahun Ajaran */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Tahun Ajaran</label>
            <input
              type="text"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              placeholder="cth. 2025/2026"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <span className="text-red-500 text-sm">⚠</span>
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#006747] hover:bg-emerald-800 text-white font-bold py-4 rounded-xl text-sm transition disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyusun Silabus via Groq AI...
              </>
            ) : (
              <>✦ Generate Silabus</>
            )}
          </button>
        </form>

        {/* ===== PREVIEW ===== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {result ? (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
                <p className="text-xs font-semibold text-gray-600">Pratinjau Silabus</p>
                <div className="flex gap-2 flex-wrap">
                  {/* Simpan PDF — client-side (selalu tersedia) */}
                  <button
                    type="button"
                    onClick={handleSavePDF}
                    disabled={savingPDF}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                  >
                    {savingPDF ? (
                      <>
                        <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        Menyiapkan...
                      </>
                    ) : (
                      "🖨️ Simpan PDF"
                    )}
                  </button>

                  {/* Download DOCX via backend */}
                  {syllabusId && (
                    <button
                      type="button"
                      onClick={() => handleDownload("docx")}
                      disabled={dlDocx}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                    >
                      {dlDocx ? "Mengunduh..." : "⬇️ Unduh DOCX"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition"
                  >
                    ✕ Baru
                  </button>
                </div>
              </div>

              {/* Content */}
              <div ref={previewRef} className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Silabus Pembelajaran
                  </p>
                  <h3 className="font-bold text-sm text-gray-900 uppercase">
                    {result.judul_silabus}
                  </h3>
                  <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-gray-500 font-mono">Mapel: {mataPelajaran}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] text-gray-500 font-mono">Kelas: {kelas}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] text-gray-500 font-mono">Semester: {semester}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-[10px] text-gray-500 font-mono">T.A: {tahunAjaran}</span>
                  </div>
                </div>

                {/* Kompetensi Inti */}
                {result.kompetensi_inti?.length > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                    <p className="font-bold text-emerald-800 mb-2">Kompetensi Inti:</p>
                    <ul className="space-y-1">
                      {result.kompetensi_inti.map((ki, i) => (
                        <li key={i} className="text-gray-700 leading-relaxed">• {ki}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tabel Silabus */}
                {result.tabel_silabus?.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-500 mb-2 uppercase tracking-wide">Tabel Silabus</p>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full border-collapse text-[11px]" style={{ minWidth: 640 }}>
                        <thead>
                          <tr className="bg-[#006747] text-white">
                            <th className="p-2 text-left font-semibold">Minggu</th>
                            <th className="p-2 text-left font-semibold">Kompetensi Dasar</th>
                            <th className="p-2 text-left font-semibold">Materi Pokok</th>
                            <th className="p-2 text-left font-semibold">Kegiatan Pembelajaran</th>
                            <th className="p-2 text-left font-semibold">Penilaian</th>
                            <th className="p-2 text-left font-semibold">Waktu</th>
                            <th className="p-2 text-left font-semibold">Sumber</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.tabel_silabus.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              <td className="p-2 text-center font-bold text-emerald-700">{row.minggu_ke}</td>
                              <td className="p-2 text-gray-700 leading-relaxed">{row.kompetensi_dasar}</td>
                              <td className="p-2 text-gray-700 leading-relaxed">{row.materi_pokok}</td>
                              <td className="p-2 text-gray-700 leading-relaxed">{row.kegiatan_pembelajaran}</td>
                              <td className="p-2 text-gray-700 leading-relaxed">{row.penilaian}</td>
                              <td className="p-2 text-gray-700 whitespace-nowrap">{row.alokasi_waktu}</td>
                              <td className="p-2 text-gray-700 leading-relaxed">{row.sumber_belajar}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer info */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">
                    Dibuat dengan MadrasahAI · {new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" })}
                  </p>
                  {!syllabusId && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                      Klik &ldquo;Simpan PDF&rdquo; untuk menyimpan dokumen ini
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-72 flex flex-col items-center justify-center text-gray-400 text-xs gap-2 p-8">
              <span className="text-4xl">📋</span>
              <p className="font-medium">Pratinjau silabus akan tampil di sini</p>
              <p className="text-gray-300">Isi form di sebelah kiri lalu klik Generate Silabus</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
