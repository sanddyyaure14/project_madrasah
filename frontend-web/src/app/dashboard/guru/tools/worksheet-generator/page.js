"use client";
import { useState } from "react";
import Link from "next/link";

export default function WorksheetGeneratorPage() {
  const [formData, setFormData] = useState({
    mata_pelajaran: "",
    topik: "",
    tipe_aktivitas: ["Pilihan Ganda"],
    tingkat_kelas: "8",
    durasi_menit: 45,
    tujuan_pembelajaran: "",
  });

  const [loading, setLoading] = useState(false);
  const [lks, setLks] = useState(null);
  const [worksheetId, setWorksheetId] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({ ...formData, tipe_aktivitas: [...formData.tipe_aktivitas, value] });
    } else {
      setFormData({ ...formData, tipe_aktivitas: formData.tipe_aktivitas.filter((t) => t !== value) });
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLks(null);
    setWorksheetId(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/assessment/generate-worksheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Gagal membuat worksheet.");

      setLks(resData.data?.worksheet);
      setWorksheetId(resData.data?.worksheet_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCetak = () => {
    if (!worksheetId) return;
    const token = localStorage.getItem("accessToken");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    // Buka PDF di tab baru — backend stream PDF langsung
    window.open(`${apiUrl}/api/assessment/worksheet/${worksheetId}/pdf?token=${token}`, "_blank");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link href="/" className="text-xs font-medium text-gray-500 hover:text-emerald-700">← Kembali ke Dashboard</Link>

      <div className="flex items-center gap-3">
        <span className="text-2xl p-2 bg-amber-50 text-amber-600 rounded-xl">📄</span>
        <div>
          <h2 className="text-xl font-bold">Worksheet Generator</h2>
          <p className="text-xs text-gray-500">Buat Lembar Kerja Siswa (LKS) Madrasah instan yang sinkron dengan database.</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        {/* INPUT PARAMS */}
        <form onSubmit={handleGenerate} className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 h-fit">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mata Pelajaran (Mapel) *</label>
            <input type="text" required placeholder="Contoh: Akidah Akhlak" className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-600" onChange={(e) => setFormData({...formData, mata_pelajaran: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Topik Bahasan *</label>
            <input type="text" required placeholder="Contoh: Akhlak Terpuji kepada Orang Tua" className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-600" onChange={(e) => setFormData({...formData, topik: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tingkat Kelas</label>
              <input type="text" className="w-full text-sm p-2 border border-gray-200 rounded-lg" value={formData.tingkat_kelas} onChange={(e) => setFormData({...formData, tingkat_kelas: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Durasi (Menit)</label>
              <input type="number" className="w-full text-sm p-2 border border-gray-200 rounded-lg" value={formData.durasi_menit} onChange={(e) => setFormData({...formData, durasi_menit: parseInt(e.target.value) || 0})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipe Aktivitas (Dapat Memilih Banyak)</label>
            <div className="mt-2 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" value="Pilihan Ganda" defaultChecked onChange={handleCheckboxChange} /> Pilihan Ganda
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" value="Isian Esai" onChange={handleCheckboxChange} /> Isian / Esai Pendek
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#006747] hover:bg-emerald-800 text-white font-medium py-2 rounded-lg text-sm transition">
            {loading ? "Menyusun Soal via Groq AI..." : "🛠️ Generate LKS"}
          </button>
        </form>

        {/* PRATINJAU HASIL */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {lks ? (
            <div className="border-2 border-emerald-900 p-5 rounded-lg space-y-4">
              <div className="text-center border-b-2 border-gray-800 pb-2">
                <h3 className="font-bold text-base uppercase text-gray-900">Lembar Kerja Siswa (LKS)</h3>
                <p className="font-semibold text-sm mt-1">{lks.judul}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  Mapel: {lks.info?.mata_pelajaran} | Kelas: {lks.info?.kelas} | Waktu: {lks.info?.durasi}
                </p>
              </div>

              {lks.tujuan && (
                <div className="text-xs">
                  <span className="font-bold">Tujuan: </span>{lks.tujuan}
                </div>
              )}

              {lks.petunjuk && (
                <div className="text-xs">
                  <span className="font-bold">Petunjuk: </span>{lks.petunjuk}
                </div>
              )}

              {Array.isArray(lks.aktivitas) && lks.aktivitas.map((akt, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-xs font-bold uppercase text-emerald-900 border-b pb-1">
                    Aktivitas {i + 1} — {akt.tipe}
                  </p>
                  <p className="text-xs italic text-gray-600">{akt.instruksi}</p>
                  <ol className="space-y-3">
                    {Array.isArray(akt.soal) && akt.soal.map((s) => {
                      const isPG = akt.tipe?.toLowerCase().includes("pilihan");
                      return (
                        <li key={s.no} className="text-xs">
                          <span>{s.no}. {s.pertanyaan}</span>
                          {isPG ? (
                            // Pilihan ganda: tampil opsi jika ada, fallback ke A-D kosong
                            <ul className="mt-1 ml-4 space-y-0.5 text-gray-700">
                              {Array.isArray(s.opsi) && s.opsi.length > 0
                                ? s.opsi.map((opsi, j) => (
                                    <li key={j}>{String.fromCharCode(65 + j)}. {opsi}</li>
                                  ))
                                : ["A. ...", "B. ...", "C. ...", "D. ..."].map((ph, j) => (
                                    <li key={j} className="text-gray-300">{ph}</li>
                                  ))
                              }
                            </ul>
                          ) : (
                            // Esai/isian: garis jawaban
                            <div className="mt-1 border-b border-gray-400 w-full" />
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}

              <button
                type="button"
                onClick={handleCetak}
                className="mt-4 text-[10px] bg-gray-800 text-white px-3 py-1 rounded hover:bg-black transition"
              >
                🖨️ Unduh PDF LKS
              </button>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-xs border border-dashed rounded-lg">
              Pratinjau lembar kerja instan siap cetak akan tampil di sini setelah digenerate.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}