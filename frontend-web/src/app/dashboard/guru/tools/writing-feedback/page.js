"use client";
import { useState } from "react";
import Link from "next/link";

const KELAS_OPTIONS = ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const JENIS_OPTIONS = ['narasi', 'deskripsi', 'eksposisi', 'argumentasi'];
const FOKUS_OPTIONS = ['Isi & Ide', 'Struktur', 'Kosakata', 'Tata Bahasa', 'Ejaan (EYD)', 'Kohesi & Koherensi'];
const BAHASA_OPTIONS = ['Indonesia', 'English', 'Arab'];

function scoreColor(n) {
  const v = parseFloat(n) || 0;
  if (v >= 80) return { text: 'text-emerald-600', border: 'border-emerald-500', bg: 'bg-emerald-500' };
  if (v >= 65) return { text: 'text-amber-500', border: 'border-amber-400', bg: 'bg-amber-400' };
  return { text: 'text-red-500', border: 'border-red-400', bg: 'bg-red-400' };
}

function ScoreCircle({ score }) {
  const num = parseFloat(score) || 0;
  const c = scoreColor(num);
  return (
    <div className={`w-20 h-20 rounded-full border-4 ${c.border} flex flex-col items-center justify-center bg-white shrink-0`}>
      <span className={`text-2xl font-black leading-none ${c.text}`}>{num.toFixed(0)}</span>
      <span className={`text-[10px] font-semibold ${c.text}`}>/100</span>
    </div>
  );
}

function AspekCard({ aspek, index }) {
  const [open, setOpen] = useState(true);
  const num = parseFloat(aspek.skor) || 0;
  const c = scoreColor(num);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition text-left"
      >
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-emerald-700">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{aspek.nama_aspek || aspek.nama}</p>
          <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full w-full">
            <div className={`h-1.5 rounded-full ${c.bg}`} style={{ width: `${Math.min(num, 100)}%` }} />
          </div>
        </div>
        <span className={`text-lg font-bold shrink-0 ${c.text}`}>{num.toFixed(0)}</span>
        <span className="text-gray-400 text-xs ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-3 space-y-3">
          {aspek.komentar && (
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">💬 Komentar</p>
              <p className="text-xs text-gray-700 leading-relaxed">{aspek.komentar}</p>
            </div>
          )}
          {(aspek.saran || aspek.rekomendasi) && (
            <div className="bg-amber-50 rounded-lg p-2.5">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">💡 Saran Perbaikan</p>
              <p className="text-xs text-amber-900 leading-relaxed">{aspek.saran || aspek.rekomendasi}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildShareText(data) {
  let text = `LAPORAN UMPAN BALIK TULISAN SISWA\n`;
  text += `=====================================\n`;
  text += `Nama   : ${data.nama_siswa || 'Siswa Anonim'}\n`;
  text += `Kelas  : ${data.tingkat_kelas}\n`;
  text += `Jenis  : Teks ${data.jenis_tulisan}\n`;
  text += `Skor   : ${parseFloat(data.skor_total).toFixed(0)} / 100\n`;
  text += `=====================================\n\n`;
  if (data.aspek?.length) {
    text += `DETAIL PER ASPEK:\n\n`;
    data.aspek.forEach((asp, i) => {
      const nama = asp.nama_aspek || asp.nama;
      text += `${i + 1}. ${nama} — Skor: ${parseFloat(asp.skor).toFixed(0)}\n`;
      if (asp.komentar) text += `   Komentar: ${asp.komentar}\n`;
      if (asp.saran) text += `   Saran: ${asp.saran}\n\n`;
    });
  }
  if (data.ringkasan) text += `KESIMPULAN:\n"${data.ringkasan}"\n`;
  return text;
}

export default function WritingFeedbackPage() {
  const [tulisan, setTulisan] = useState('');
  const [jenis, setJenis] = useState('narasi');
  const [kelas, setKelas] = useState('VII');
  const [namaSiswa, setNamaSiswa] = useState('');
  const [fokusSelected, setFokusSelected] = useState([]);
  const [bahasa, setBahasa] = useState('Indonesia');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function toggleFokus(opt) {
    setFokusSelected(prev => prev.includes(opt) ? prev.filter(f => f !== opt) : [...prev, opt]);
  }

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!tulisan.trim()) { setError('Teks karangan siswa wajib diisi.'); return; }
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const token = sessionStorage.getItem("accessToken");
      if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const formData = new FormData();
      formData.append("tulisan_siswa", tulisan.trim());
      formData.append("jenis_tulisan", jenis);
      formData.append("tingkat_kelas", kelas);
      formData.append("nama_siswa", namaSiswa.trim() || "Siswa Anonim");
      formData.append("bahasa_output", bahasa);
      if (fokusSelected.length > 0) formData.append("fokus_feedback", fokusSelected.join(", "));

      const response = await fetch(`${apiUrl}/api/generate/writing-feedback`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Gagal memproses feedback.");
      setResult(resData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(buildShareText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setResult(null);
    setError('');
    setTulisan('');
    setNamaSiswa('');
    setFokusSelected([]);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700">
        ← Kembali ke Dashboard
      </Link>

      {/* HERO */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl shrink-0">✍️</div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asesmen</p>
          <h2 className="text-xl font-bold text-gray-900">Writing Feedback</h2>
          <p className="text-xs text-gray-500 mt-0.5">Analisis dan umpan balik tulisan siswa secara komprehensif dan konstruktif</p>
        </div>
      </div>

      {!result ? (
        /* ===== FORM ===== */
        <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

          {/* Teks tulisan */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Teks Tulisan Siswa <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={tulisan}
              onChange={e => { setTulisan(e.target.value); if (error) setError(''); }}
              placeholder="Tempel atau ketik teks karangan siswa di sini..."
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 resize-none bg-gray-50"
            />
            <p className="text-[10px] text-gray-400 text-right mt-1">{tulisan.length} karakter</p>
          </div>

          {/* Jenis tulisan */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Jenis Tulisan <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {JENIS_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setJenis(opt)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium capitalize
                    ${jenis === opt ? 'bg-[#006747] text-white border-[#006747]' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'}`}>
                  {opt}
                </button>
              ))}
            </div>
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

          {/* Nama siswa */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Nama Siswa</label>
            <input
              type="text"
              value={namaSiswa}
              onChange={e => setNamaSiswa(e.target.value)}
              placeholder="cth. Ahmad Fauzi (opsional)"
              className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50"
            />
          </div>

          {/* Fokus aspek */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Fokus Aspek <span className="text-xs text-gray-400">(bisa pilih lebih dari satu)</span></label>
            <div className="flex flex-wrap gap-2">
              {FOKUS_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => toggleFokus(opt)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium
                    ${fokusSelected.includes(opt) ? 'bg-[#006747] text-white border-[#006747]' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'}`}>
                  {opt}
                </button>
              ))}
            </div>
            {fokusSelected.length > 0 && (
              <p className="text-xs text-emerald-600 italic mt-1.5">Terpilih: {fokusSelected.join(', ')}</p>
            )}
          </div>

          {/* Bahasa output */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Bahasa Output</label>
            <div className="flex gap-2">
              {BAHASA_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setBahasa(opt)}
                  className={`px-4 py-2 rounded-full text-sm border transition font-medium
                    ${bahasa === opt ? 'bg-[#006747] text-white border-[#006747]' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'}`}>
                  {opt}
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
                AI sedang menganalisis tulisan siswa...
              </>
            ) : <>✨ Generate Feedback</>}
          </button>
        </form>
      ) : (
        /* ===== RESULT ===== */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

          {/* Header skor */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Hasil Umpan Balik ✍️</h3>
              {result.nama_siswa && result.nama_siswa !== 'Siswa Anonim' && (
                <p className="text-sm text-gray-500 mt-0.5">{result.nama_siswa} · Kelas {result.tingkat_kelas}</p>
              )}
              {result.jenis_tulisan && (
                <span className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1 capitalize">
                  Teks {result.jenis_tulisan}
                </span>
              )}
            </div>
            <ScoreCircle score={result.skor_total} />
          </div>

          {/* Ringkasan */}
          {result.ringkasan && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1.5">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">📄 Ringkasan</p>
              <p className="text-sm text-gray-800 leading-relaxed">{result.ringkasan}</p>
            </div>
          )}

          {/* Aspek */}
          {result.aspek?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detail Per Aspek</p>
              {result.aspek.map((asp, i) => <AspekCard key={i} aspek={asp} index={i} />)}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-600 text-emerald-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-50 transition">
              {copied ? '✅ Tersalin!' : '📋 Copy'}
            </button>
            <button type="button"
              onClick={() => {
                const text = buildShareText(result);
                const encoded = encodeURIComponent(text);
                window.open(`https://wa.me/?text=${encoded}`, '_blank');
              }}
              className="flex-[1.4] flex items-center justify-center gap-1.5 bg-[#006747] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-800 transition">
              📤 Kirim ke Siswa
            </button>
          </div>

          <button type="button" onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 text-gray-400 text-sm py-2 hover:text-gray-600 transition">
            🔄 Buat Feedback Baru
          </button>
        </div>
      )}
    </div>
  );
}