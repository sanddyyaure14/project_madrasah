"use client";
import { useState } from "react";
import Link from "next/link";

export default function WritingFeedbackPage() {
  const [formData, setFormData] = useState({
    tingkat_kelas: "8",
    jenis_tulisan: "Karangan Bebas",
    fokus_feedback: "Tata Bahasa",
    tulisan_siswa: "",
    nama_siswa: "",
    bahasa_output: "Indonesia",
    userId: "99999999-9999-9999-9999-999999999999" // Sesuaikan auth state jika sudah ada
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/assessment/generate/writing-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Gagal memproses feedback.");
      
      // Ambil data output hasil generasi dari backend Anda
      setResult(resData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link href="/" className="text-xs font-medium text-gray-500 hover:text-emerald-700">← Kembali ke Dashboard</Link>
      
      <div className="flex items-center gap-3">
        <span className="text-2xl p-2 bg-emerald-50 rounded-xl">✍</span>
        <div>
          <h2 className="text-xl font-bold">Writing Feedback</h2>
          <p className="text-xs text-gray-500">Berikan umpan balik konstruktif otomatis sesuai arsitektur backend MadrasahAI.</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* FORM INPUT */}
        <form onSubmit={handleGenerate} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 h-fit">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nama Siswa *</label>
            <input 
              type="text" required placeholder="Contoh: Ahmad Fauzi"
              className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-600"
              onChange={(e) => setFormData({...formData, nama_siswa: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Jenis Tulisan</label>
              <select className="w-full text-sm p-2 border border-gray-200 rounded-lg" onChange={(e) => setFormData({...formData, jenis_tulisan: e.target.value})}>
                <option>Karangan Bebas</option>
                <option>Esai Pendek</option>
                <option>Narasi Dakwah</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tingkat Kelas</label>
              <input type="text" className="w-full text-sm p-2 border border-gray-200 rounded-lg" value={formData.tingkat_kelas} onChange={(e) => setFormData({...formData, tingkat_kelas: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fokus Evaluasi</label>
            <select className="w-full text-sm p-2 border border-gray-200 rounded-lg" onChange={(e) => setFormData({...formData, fokus_feedback: e.target.value})}>
              <option>Tata Bahasa</option>
              <option>Struktur Argumen</option>
              <option>Kekayaan Kosa Kata</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teks Tulisan Siswa *</label>
            <textarea 
              required rows="5" placeholder="Tempel tulisan siswa di sini..."
              className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-600"
              onChange={(e) => setFormData({...formData, tulisan_siswa: e.target.value})}
            ></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#006747] hover:bg-emerald-800 text-white font-medium py-2 rounded-lg text-sm transition">
            {loading ? "Menghubungi AI di Backend..." : "✨ Generate Feedback"}
          </button>
        </form>

        {/* COMPONENT HASIL */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">Hasil Evaluasi AI</h3>
            {result ? (
              <div className="space-y-4 text-xs">
                <div className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center">
                  <span className="font-bold text-emerald-900">Skor Hasil Akhir:</span>
                  <span className="text-xl font-black text-[#006747]">{result.skor_total || 0} / 100</span>
                </div>
                <div>
                  <p className="font-bold text-gray-700">Ringkasan Konstruktif:</p>
                  <p className="bg-gray-50 p-2 rounded border mt-1 text-gray-600 leading-relaxed">{result.ringkasan}</p>
                </div>
                {result.aspek && (
                  <div className="space-y-2">
                    <p className="font-bold text-gray-700">Rincian Komponen Nilai:</p>
                    {result.aspek.map((asp, i) => (
                      <div key={i} className="bg-amber-50/40 p-2 rounded border border-amber-100">
                        <div className="flex justify-between font-semibold text-emerald-800">
                          <span>{asp.nama || asp.nama_aspek}</span>
                          <span>Skor: {asp.skor}</span>
                        </div>
                        <p className="text-gray-500 mt-1">💬 {asp.komentar}</p>
                        <p className="text-amber-800 font-medium mt-0.5">💡 Saran: {asp.saran || asp.rekomendasi}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs border border-dashed rounded-lg">
                <span>Data siap diproses. Klik generate di sebelah kiri.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}