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
    userId: "99999999-9999-9999-9999-999999999999"
  });

  const [loading, setLoading] = useState(false);
  const [worksheet, setWorksheet] = useState(null);
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

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/assessment/generate-worksheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Gagal membuat worksheet.");
      
      // Mengambil data worksheet hasil generator dari backend
      setWorksheet(resData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          {worksheet ? (
            <div className="border-2 border-emerald-900 p-5 rounded-lg space-y-4">
              <div className="text-center border-b-2 border-gray-800 pb-2">
                <h3 className="font-bold text-base uppercase text-gray-900">Lembar Kerja Siswa (LKS)</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  Mapel: {worksheet.mata_pelajaran} | Kelas: {worksheet.tingkat_kelas} | Waktu: {worksheet.durasi_menit} Menit
                </p>
              </div>
              
              {/* Render soal dari struktur data JSON backend Anda */}
              <div className="space-y-4 text-xs whitespace-pre-wrap text-gray-800 leading-relaxed">
                {/* Fallback jika backend mengembalikan bentuk teks string/objek */}
                {typeof worksheet.questions_json === 'string' ? (
                  <p>{worksheet.questions_json}</p>
                ) : (
                  <p>{JSON.stringify(worksheet.questions_json, null, 2)}</p>
                )}
              </div>
              
              <button onClick={() => window.print()} className="mt-4 text-[10px] bg-gray-800 text-white px-3 py-1 rounded hover:bg-black transition print:hidden">
                🖨️ Cetak / Print LKS
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