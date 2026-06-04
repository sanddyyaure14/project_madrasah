"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Config ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: "all",       label: "Semua",    emoji: "🗂️" },
  { key: "mc",        label: "Soal PG",  emoji: "📝" },
  { key: "rubric",    label: "Rubrik",   emoji: "📊" },
  { key: "feedback",  label: "Writing",  emoji: "✍️" },
  { key: "worksheet", label: "Worksheet",emoji: "📋" },
  { key: "syllabus",  label: "Silabus",  emoji: "📚" },
  { key: "academic",  label: "Konten",   emoji: "🎓" },
  //anak konten nanti lengkapin ini ya
];

const FETCH_URL = {
  feedback:  "/feedback",
  worksheet: "/worksheet/worksheets",
  mc:        "/assessment",
  rubric:    "/rubrics",
  syllabus:  "/syllabus",
  academic:  "/academic-content",
  //anak konten nanti lengkapin ini ya
};

const DELETE_URL = (type, id) => {
  switch (type) {
    case "worksheet": return `/worksheet/worksheets/${id}`;
    case "mc":        return `/assessment/delete/${id}`;
    case "rubric":    return `/rubrics/${id}`;
    case "syllabus":  return `/syllabus/${id}`;
    case "academic":  return `/academic-content/${id}`;
    case "feedback":  return `/feedback/delete/${id}`;
    //anak konten nanti lengkapin ini ya
    default:          return null;
  }
};

// PATCH/PUT endpoint per type
const UPDATE_URL = (type, id) => {
  switch (type) {
    case "worksheet": return `/worksheet/worksheets/${id}`;
    case "mc":        return `/assessment/${id}`;
    case "rubric":    return `/rubrics/${id}`;
    case "syllabus":  return `/syllabus/${id}`;
    case "academic":  return `/academic-content/${id}`;
    case "feedback":  return `/feedback/edit/${id}`;
    //anak konten nanti lengkapin ini ya
    default:          return null;
  }
};

// Fields yang bisa diedit per type
const EDIT_FIELDS = {
  feedback:  [
    { key: "nama_siswa",    label: "Nama Siswa",    type: "text" },
    { key: "jenis_tulisan", label: "Jenis Tulisan", type: "text" },
    { key: "kelas",         label: "Kelas",         type: "text" },
  ],
 worksheet: [
  {
    key: "worksheet_content",
    label: "Soal Worksheet",
    type: "textarea",
  },
  ],
  mc: [
    { key: "judul",         label: "Judul",         type: "text" },
    { key: "mata_pelajaran",label: "Mata Pelajaran",type: "text" },
    { key: "kelas",         label: "Kelas",         type: "text" },
  ],
  rubric: [
    { key: "judul",         label: "Judul",         type: "text" },
    { key: "nama_rubrik",   label: "Nama Rubrik",   type: "text" },
  ],
  syllabus: [
    { key: "nama_silabus",  label: "Nama Silabus",  type: "text" },
    { key: "mata_pelajaran",label: "Mata Pelajaran",type: "text" },
    { key: "semester",      label: "Semester",      type: "text" },
  ],
  academic: [
    { key: "judul",         label: "Judul",         type: "text" },
    { key: "mata_pelajaran",label: "Mata Pelajaran",type: "text" },
    { key: "jenis_konten",  label: "Jenis Konten",  type: "text" },
  ],
  //anak konten nanti lengkapin ini ya, dst...
};

const BADGE = {
  mc:        { bg: "#fee2e2", color: "#dc2626", label: "Soal PG" },
  rubric:    { bg: "#fef9c3", color: "#ca8a04", label: "Rubrik" },
  worksheet: { bg: "#fef3c7", color: "#d97706", label: "Worksheet" },
  syllabus:  { bg: "#f0fdf4", color: "#16a34a", label: "Silabus" },
  academic:  { bg: "#eff6ff", color: "#1d4ed8", label: "Konten" },
  feedback:  { bg: "#d1fae5", color: "#065f46", label: "Writing" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Worksheet Data Parser ─────────────────────────────────────────────────────
// Data LKS bisa tersimpan sebagai string JSON di field worksheet_content
function parseLks(doc) {
  // Try each possible field where the full LKS JSON might live
  const candidates = [doc.worksheet_content, doc.worksheet_json, doc.worksheet];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "string") {
      try { return JSON.parse(c); } catch { /* try next */ }
    } else if (typeof c === "object") {
      return c;
    }
  }
  return doc;
}

function getAktivitas(doc) {
  const lks = parseLks(doc);
  return lks.aktivitas || lks.sections || lks.soal || doc.aktivitas || doc.sections || [];
}

function getTitle(doc, type) {
  switch (type) {
    case "mc":        return doc.judul || doc.mata_pelajaran || "Soal PG";
    case "rubric":    return doc.judul || doc.nama_rubrik || "Rubrik";
    case "worksheet": return doc.judul || doc.topik || "Worksheet";
    case "syllabus":  return doc.nama_silabus || doc.mata_pelajaran || "Silabus";
    case "academic":  return doc.judul || doc.title || "Konten";
    case "feedback":  return doc.nama_siswa || doc.judul || "Writing Feedback";
    default:          return "Dokumen";
  }
}

function getMeta(doc, type) {
  switch (type) {
    case "mc":
      return [doc.kelas && `Kelas ${doc.kelas}`, doc.jumlah_soal && `${doc.jumlah_soal} soal`, doc.tingkat_kesulitan].filter(Boolean);
    case "rubric":
      return [doc.skala_nilai && `Skala ${doc.skala_nilai}`, doc.aspek_penilaian && `${Array.isArray(doc.aspek_penilaian) ? doc.aspek_penilaian.length : doc.aspek_penilaian} aspek`].filter(Boolean);
    case "worksheet":
      return [doc.mata_pelajaran, doc.topik].filter(Boolean);
    case "syllabus":
      return [(doc.jenjang || doc.kelas) && `${doc.jenjang ?? ""} ${doc.kelas ?? ""}`.trim(), doc.semester && `Semester ${doc.semester}`, doc.kurikulum].filter(Boolean);
    case "academic":
      return [doc.jenis_konten, doc.mata_pelajaran].filter(Boolean);
    case "feedback":
      return [doc.kelas && `Kelas ${doc.kelas}`, doc.jenis_tulisan, doc.skor != null && `Skor: ${doc.skor}`].filter(Boolean);
    default:
      return [];
  }
}

function matchesSearch(doc, type, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return getTitle(doc, type).toLowerCase().includes(q) || getMeta(doc, type).join(" ").toLowerCase().includes(q);
}

function scoreColor(n) {
  const v = parseFloat(n) || 0;
  if (v >= 80) return "text-emerald-600";
  if (v >= 65) return "text-amber-500";
  return "text-red-500";
}

function getApiBase() {
  return (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "http://localhost:3000";
}
function getToken() {
  return typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : "";
}


// ─── Edit Form (dipakai di dalam drawer) ─────────────────────────────────────

// Shared save helper — handle non-JSON (HTML) responses + fallback methods
async function saveDoc(type, doc, body) {
  const path = UPDATE_URL(type, doc.id);
  if (!path) throw new Error("Tipe dokumen tidak mendukung edit.");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
  const bodyStr = JSON.stringify(body);

  const tryFetch = async (method, url) => {
    const res = await fetch(url, { method, headers, body: bodyStr });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* server returned HTML, ignore */ }
    return { ok: res.ok, status: res.status, data };
  };

  const base = `${getApiBase()}/api`;

  // 1. PATCH primary
  let r = await tryFetch("PATCH", `${base}${path}`);
  if (r.ok) return r.data;

  // 2. PUT primary
  r = await tryFetch("PUT", `${base}${path}`);
  if (r.ok) return r.data;

  throw new Error(r.data?.message || `Gagal menyimpan (${r.status}).`);
}

function SaveCancelButtons({ saving, onCancel, onSave }) {
  return (
    <div className="flex gap-2 pt-1">
      <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
        Batal
      </button>
      <button onClick={onSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#006747] text-white text-sm font-semibold hover:bg-emerald-800 transition disabled:opacity-60 flex items-center justify-center gap-2">
        {saving ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</> : <><span>✓</span> Simpan Perubahan</>}
      </button>
    </div>
  );
}

// ─── Edit Form: Feedback ──────────────────────────────────────────────────────
function EditFeedbackForm({ doc, onSave, onCancel }) {
  const [ringkasan, setRingkasan] = useState(doc.ringkasan || "");
  const [aspek, setAspek] = useState(
    (doc.aspek || []).map(a => ({ ...a, skor: parseFloat(a.skor) || 0 }))
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const skor_total = aspek.length > 0
        ? parseFloat((aspek.reduce((s, a) => s + (parseFloat(a.skor) || 0), 0) / aspek.length).toFixed(1))
        : parseFloat(doc.skor_total || doc.skor || 0);
      const body = { ringkasan, aspek, skor_total };
      await saveDoc("feedback", doc, body);
      onSave({ ...doc, ringkasan, aspek, skor_total });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <span className="text-base">✏️</span>
        <h4 className="text-sm font-bold text-gray-900">Edit Feedback</h4>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ringkasan / Kesimpulan</label>
        <textarea
          value={ringkasan}
          onChange={e => setRingkasan(e.target.value)}
          rows={4}
          className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition resize-none"
          placeholder="Tulis ringkasan feedback..."
        />
      </div>

      {aspek.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skor Per Aspek</p>
          {aspek.map((a, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <span className="flex-1 text-sm font-medium text-gray-800">{a.nama_aspek || a.nama}</span>
              <input
                type="number"
                min={0} max={100} step={0.5}
                value={a.skor}
                onChange={e => setAspek(prev => prev.map((x, j) => j === i ? { ...x, skor: parseFloat(e.target.value) || 0 } : x))}
                className="w-20 text-sm text-center px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 bg-white font-semibold"
              />
              <span className="text-xs text-gray-400 font-medium">/100</span>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 italic">* Skor total akan dihitung otomatis dari rata-rata aspek.</p>
        </div>
      )}

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Worksheet (soal-by-soal) ─────────────────────────────────────
function EditWorksheetForm({ doc, onSave, onCancel }) {
  const lks = parseLks(doc);
  const [aktivitas, setAktivitas] = useState(
    JSON.parse(JSON.stringify(getAktivitas(doc)))
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const updateSoal = (ai, si, field, value) => {
    setAktivitas(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[ai].soal[si][field] = value;
      return next;
    });
  };

  const updateOpsi = (ai, si, oi, value) => {
    setAktivitas(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[ai].soal[si].opsi[oi] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const updatedLks = { ...lks, aktivitas };

      // Ambil field wajib dari doc (backend updateWorksheet memerlukannya semua)
      const requiredFields = {
        judul:          doc.judul          || lks.judul          || "",
        mata_pelajaran: doc.mata_pelajaran || lks.mata_pelajaran || "",
        topik:          doc.topik          || lks.topik          || "",
        tipe_aktivitas: doc.tipe_aktivitas || lks.tipe_aktivitas || [],
        durasi_menit:   doc.durasi_menit   || lks.durasi_menit   || null,
        worksheet_json: updatedLks,
      };

      await saveDoc("worksheet", doc, requiredFields);

      // Perbarui doc di state lokal dengan worksheet_json terbaru
      const updatedDoc = { ...doc, ...requiredFields };
      onSave(updatedDoc);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <span className="text-base">✏️</span>
        <h4 className="text-sm font-bold text-gray-900">Edit Soal Worksheet</h4>
      </div>

      {aktivitas.length === 0 && (
        <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700 text-center">
          Belum ada soal untuk diedit.
        </div>
      )}

      {aktivitas.map((akt, ai) => (
        <div key={ai} className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-emerald-200">
            <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{ai + 1}</span>
            <p className="font-bold text-emerald-900 uppercase tracking-wide text-[11px]">Aktivitas {ai + 1} — {akt.tipe}</p>
          </div>
          <p className="text-xs text-gray-500 italic">{akt.instruksi}</p>
          {(akt.soal || []).map((s, si) => (
            <div key={si} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Soal {s.no}</label>
              <textarea
                value={s.pertanyaan}
                onChange={e => updateSoal(ai, si, "pertanyaan", e.target.value)}
                rows={2}
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 bg-white transition resize-none"
                placeholder="Tulis pertanyaan..."
              />
              {Array.isArray(s.opsi) && s.opsi.length > 0 && (
                <div className="space-y-1.5 pl-1">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pilihan Jawaban</p>
                  {s.opsi.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 w-5 shrink-0">{String.fromCharCode(65 + oi)}.</span>
                      <input
                        type="text"
                        value={o}
                        onChange={e => updateOpsi(ai, si, oi, e.target.value)}
                        className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 bg-white transition"
                        placeholder={`Pilihan ${String.fromCharCode(65 + oi)}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Generic ───────────────────────────────────────────────────────
function EditForm({ doc, type, onSave, onCancel }) {
  if (type === "feedback")  return <EditFeedbackForm  doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "worksheet") return <EditWorksheetForm doc={doc} onSave={onSave} onCancel={onCancel} />;

  const fields = EDIT_FIELDS[type] || [];
  const [form, setForm] = useState(() => {
    const init = {};
    fields.forEach(f => { init[f.key] = doc[f.key] || ""; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      await saveDoc(type, doc, form);
      onSave({ ...doc, ...form });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  if (fields.length === 0) return (
    <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-700 text-center">
      Edit tidak tersedia untuk tipe dokumen ini.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <span className="text-base">✏️</span>
        <h4 className="text-sm font-bold text-gray-900">Edit Dokumen</h4>
      </div>

      {fields.map(f => (
        <div key={f.key}>
          <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
          <input
            type={f.type}
            value={form[f.key]}
            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
            className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
            placeholder={`Masukkan ${f.label.toLowerCase()}...`}
          />
        </div>
      ))}

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Detail: Writing Feedback ─────────────────────────────────────────────────
function FeedbackDetail({ doc, onDelete, onEdit }) {
  const result = doc;
  const [copied, setCopied] = useState(false);

  function buildText() {
    let t = `LAPORAN UMPAN BALIK TULISAN SISWA\n=====================================\n`;
    t += `Nama  : ${result.nama_siswa || "Siswa Anonim"}\n`;
    t += `Kelas : ${result.tingkat_kelas || result.kelas || "-"}\n`;
    t += `Jenis : Teks ${result.jenis_tulisan || "-"}\n`;
    t += `Skor  : ${parseFloat(result.skor_total || result.skor || 0).toFixed(0)} / 100\n`;
    t += `=====================================\n\n`;
    if (result.aspek?.length) {
      t += `DETAIL PER ASPEK:\n\n`;
      result.aspek.forEach((asp, i) => {
        const nama = asp.nama_aspek || asp.nama;
        t += `${i + 1}. ${nama} — Skor: ${parseFloat(asp.skor).toFixed(0)}\n`;
        if (asp.komentar) t += `   Komentar: ${asp.komentar}\n`;
        if (asp.saran) t += `   Saran: ${asp.saran}\n\n`;
      });
    }
    if (result.ringkasan) t += `KESIMPULAN:\n"${result.ringkasan}"\n`;
    return t;
  }

  const skor = parseFloat(result.skor_total || result.skor || 0);
  const borderColor = skor >= 80 ? "border-emerald-500" : skor >= 65 ? "border-amber-400" : "border-red-400";

  return (
    <div className="space-y-5">
      {/* Score header */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{result.nama_siswa || "Siswa Anonim"}</h3>
          <p className="text-sm text-gray-500">
            {(result.tingkat_kelas || result.kelas) ? `Kelas ${result.tingkat_kelas || result.kelas}` : ""}
            {result.jenis_tulisan ? ` · Teks ${result.jenis_tulisan}` : ""}
          </p>
        </div>
        <div className={`w-16 h-16 rounded-full border-4 ${borderColor} flex flex-col items-center justify-center bg-white shrink-0`}>
          <span className={`text-xl font-black leading-none ${scoreColor(skor)}`}>{skor.toFixed(0)}</span>
          <span className={`text-[9px] font-semibold ${scoreColor(skor)}`}>/100</span>
        </div>
      </div>

      {result.ringkasan && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">📄 Ringkasan</p>
          <p className="text-sm text-gray-800 leading-relaxed">{result.ringkasan}</p>
        </div>
      )}

      {result.aspek?.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detail Per Aspek</p>
          {result.aspek.map((asp, i) => {
            const num = parseFloat(asp.skor) || 0;
            const bgBar = num >= 80 ? "bg-emerald-500" : num >= 65 ? "bg-amber-400" : "bg-red-400";
            return (
              <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{asp.nama_aspek || asp.nama}</p>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full">
                      <div className={`h-1.5 rounded-full ${bgBar}`} style={{ width: `${Math.min(num, 100)}%` }} />
                    </div>
                  </div>
                  <span className={`text-base font-bold shrink-0 ${scoreColor(num)}`}>{num.toFixed(0)}</span>
                </div>
                {(asp.komentar || asp.saran || asp.rekomendasi) && (
                  <div className="mt-2.5 pl-9 space-y-2">
                    {asp.komentar && <p className="text-xs text-gray-600 leading-relaxed">{asp.komentar}</p>}
                    {(asp.saran || asp.rekomendasi) && (
                      <div className="bg-amber-50 rounded-lg p-2">
                        <p className="text-[10px] font-bold text-amber-700 mb-0.5">💡 Saran</p>
                        <p className="text-xs text-amber-900 leading-relaxed">{asp.saran || asp.rekomendasi}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => { navigator.clipboard.writeText(buildText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-600 text-emerald-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-50 transition"
        >
          {copied ? "✅ Tersalin!" : "📋 Copy"}
        </button>
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildText())}`, "_blank")}
          className="flex-[1.4] flex items-center justify-center gap-1.5 bg-[#006747] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-800 transition"
        >
          📤 Kirim ke Siswa
        </button>
      </div>

      {/* Edit & Delete */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition"
        >
          🗑️ Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Detail: Worksheet ────────────────────────────────────────────────────────
function WorksheetDetail({ doc, onDelete, onEdit }) {
  const lks = parseLks(doc);
  const aktivitasList = getAktivitas(doc);
  const [copied, setCopied] = useState(false);

  const handleCetakPDF = async () => {
    if (!doc.id) return;
    try {
      const res = await fetch(`${getApiBase()}/api/worksheet/worksheets/${doc.id}/cetak-pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LKS_${lks?.judul || "worksheet"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh PDF: " + err.message);
    }
  };

  // Fungsi baru untuk menyusun teks Worksheet (LKS) agar rapi saat dicopy
  function buildWorksheetText() {
    let t = `LEMBAR KERJA SISWA (LKS)\n`;
    t += `=====================================\n`;
    t += `Judul   : ${lks.judul || doc.judul || "Worksheet"}\n`;
    if (lks.info?.mata_pelajaran || doc.mata_pelajaran) t += `Mapel   : ${lks.info?.mata_pelajaran || doc.mata_pelajaran}\n`;
    if (lks.info?.kelas || doc.kelas) t += `Kelas   : ${lks.info?.kelas || doc.kelas}\n`;
    if (lks.info?.topik || doc.topik) t += `Topik   : ${lks.info?.topik || doc.topik}\n`;
    if (lks.info?.durasi || doc.durasi_menit) t += `Durasi  : ${lks.info?.durasi || `${doc.durasi_menit} menit`}\n`;
    t += `=====================================\n\n`;

    if (lks.tujuan) {
      t += `TUJUAN PEMBELAJARAN:\n${lks.tujuan}\n\n`;
    }
    if (lks.petunjuk) {
      t += `PETUNJUK PENGERJAAN:\n${lks.petunjuk}\n\n`;
    }

    if (aktivitasList.length) {
      aktivitasList.forEach((akt, i) => {
        t += `AKTIVITAS ${i + 1}: ${akt.tipe || ""}\n`;
        t += `Instruksi: ${akt.instruksi || ""}\n`;
        t += `-------------------------------------\n`;
        
        if (akt.soal?.length) {
          akt.soal.forEach((s) => {
            t += `${s.no}. ${s.pertanyaan}\n`;
            if (Array.isArray(s.opsi) && s.opsi.length > 0) {
              s.opsi.forEach((o, j) => {
                t += `   ${String.fromCharCode(65 + j)}. ${o}\n`;
              });
            } else {
              t += `   Jawab: ___________________________\n`;
            }
            t += `\n`;
          });
        }
      });
    }
    return t;
  }

  return (
    <div className="space-y-4">
      {/* Tombol Aksi Atas */}
      <div className="flex gap-2">
        <button onClick={handleCetakPDF} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-2 rounded-lg transition">
          ⬇️ Unduh PDF
        </button>
        <button 
          onClick={() => { 
            navigator.clipboard.writeText(buildWorksheetText()); 
            setCopied(true); 
            setTimeout(() => setCopied(false), 2000); 
          }} 
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg transition"
        >
          {copied ? "✅ Tersalin!" : "📋 Copy Teks"}
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition">
          🖨️ Print
        </button>
      </div>

      {/* Preview LKS */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-5 space-y-4 text-xs">
          <div className="text-center border-b-2 border-gray-800 pb-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Lembar Kerja Siswa (LKS)</p>
            <h3 className="font-bold text-sm text-gray-900 uppercase">{lks.judul || doc.judul || "Worksheet"}</h3>
            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              {(lks.info?.mata_pelajaran || doc.mata_pelajaran) && (
                <span className="text-[10px] text-gray-500 font-mono">Mapel: {lks.info?.mata_pelajaran || doc.mata_pelajaran}</span>
              )}
              {(lks.info?.kelas || doc.kelas) && (
                <><span className="text-gray-300">|</span><span className="text-[10px] text-gray-500 font-mono">Kelas: {lks.info?.kelas || doc.kelas}</span></>
              )}
              {(lks.info?.durasi || doc.durasi_menit) && (
                <><span className="text-gray-300">|</span><span className="text-[10px] text-gray-500 font-mono">Waktu: {lks.info?.durasi || `${doc.durasi_menit} menit`}</span></>
              )}
            </div>
            {(lks.info?.topik || doc.topik) && <p className="text-[10px] text-gray-500 font-mono mt-1">Topik: {lks.info?.topik || doc.topik}</p>}
          </div>
          {lks.tujuan && <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100"><p className="font-bold text-emerald-800 mb-1">Tujuan:</p><p className="text-gray-700 leading-relaxed">{lks.tujuan}</p></div>}
          {lks.petunjuk && <div className="bg-amber-50 rounded-lg p-3 border border-amber-100"><p className="font-bold text-amber-800 mb-1">Petunjuk:</p><p className="text-gray-700 leading-relaxed">{lks.petunjuk}</p></div>}
          {aktivitasList.map((akt, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-emerald-200">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="font-bold text-emerald-900 uppercase tracking-wide text-[11px]">Aktivitas {i + 1} — {akt.tipe}</p>
              </div>
              <p className="text-gray-500 italic">{akt.instruksi}</p>
              {akt.soal?.map((s) => (
                <div key={s.no}>
                  <p className="text-gray-800 font-medium">{s.no}. {s.pertanyaan}</p>
                  {Array.isArray(s.opsi) && s.opsi.length > 0
                    ? <ul className="mt-1.5 ml-4 space-y-1">{s.opsi.map((o, j) => <li key={j} className="text-gray-600">{String.fromCharCode(65+j)}. {o}</li>)}</ul>
                    : <div className="mt-2 border-b border-gray-300 w-full" />}
                </div>
              ))}
            </div>
          ))}
          {aktivitasList.length === 0 && (
            <div className="text-center py-8 text-gray-400 space-y-2">
              <p className="text-sm">Belum ada aktivitas/soal tersimpan.</p>
              {process.env.NODE_ENV === "development" && (
                <details className="text-left mt-2">
                  <summary className="text-[10px] text-gray-400 cursor-pointer">Debug: struktur data</summary>
                  <pre className="text-[9px] text-gray-500 mt-1 whitespace-pre-wrap break-all bg-gray-100 p-2 rounded">
                    {JSON.stringify({ keys: Object.keys(doc), worksheet_content_type: typeof doc.worksheet_content, has_worksheet: !!doc.worksheet }, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tombol CRUD Bawah */}
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
          ✏️ Edit
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">
          🗑️ Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Detail: Generic ──────────────────────────────────────────────────────────
function GenericDetail({ doc, type, onDelete, onEdit }) {
  const title = getTitle(doc, type);
  const meta = getMeta(doc, type);
  const badge = BADGE[type] || BADGE.feedback;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide" style={{ background: badge.bg, color: badge.color }}>
          {badge.label}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {meta.map((m, i) => <span key={i} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{m}</span>)}
        </div>
      )}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 max-h-64 overflow-y-auto">
        <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Data Dokumen</p>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{JSON.stringify(doc, null, 2)}</pre>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
          ✏️ Edit
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">
          🗑️ Hapus
        </button>
      </div>
    </div>
  );
}

// ─── DocCard ──────────────────────────────────────────────────────────────────
function DocCard({ doc, type, onPress, onDelete, onEdit }) {
  const badge = BADGE[type] || BADGE.feedback;
  const title = getTitle(doc, type);
  const meta = getMeta(doc, type);

  return (
    <div
      onClick={onPress}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPress()}
      className="w-full text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-emerald-200 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: badge.bg, color: badge.color }}>
          {badge.label}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition"
            title="Edit"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
            title="Hapus"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">{title}</p>
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {meta.map((m, i) => <span key={i} className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-medium">{m}</span>)}
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🗑️</div>
          <h3 className="text-base font-bold text-gray-900">Hapus Dokumen</h3>
          <p className="text-sm text-gray-500 mt-1">Yakin ingin menghapus? Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ doc, onClose, onDelete, onSaved }) {
  const type = doc.__type;
  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [fullDoc, setFullDoc] = useState(doc);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch full detail for worksheet — list API may not include worksheet_content/aktivitas
  useEffect(() => {
    if (type !== "worksheet" || !doc.id) { setFullDoc(doc); return; }
    setLoadingDetail(true);
    fetch(`${getApiBase()}/api/worksheet/worksheets/${doc.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        const detail = data.data ?? data.worksheet ?? data;
        if (detail && typeof detail === "object" && detail.id) {
          setFullDoc({ ...detail, __type: "worksheet" });
        } else {
          setFullDoc(doc);
        }
      })
      .catch(() => setFullDoc(doc))
      .finally(() => setLoadingDetail(false));
  }, [doc.id, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = (updatedDoc) => {
    setFullDoc(updatedDoc);
    onSaved(updatedDoc);
    setMode("view");
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
{mode === "edit" ? (type === "feedback" ? "Edit Feedback" : type === "worksheet" ? "Edit Soal Worksheet" : "Edit Dokumen") : "Detail Dokumen"}
            </p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 line-clamp-1">{getTitle(fullDoc, type)}</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "edit" ? (
              <button onClick={() => setMode("view")} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                ← Kembali
              </button>
            ) : null}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 text-base">
              ✕
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Memuat detail...</p>
            </div>
          ) : mode === "edit" ? (
            <EditForm doc={fullDoc} type={type} onSave={handleSave} onCancel={() => setMode("view")} />
          ) : (
            <>
              {type === "feedback"  && <FeedbackDetail  doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "worksheet" && <WorksheetDetail doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type !== "feedback" && type !== "worksheet" && (
                <GenericDetail doc={fullDoc} type={type} onDelete={onDelete} onEdit={() => setMode("edit")} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyDocsPage() {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch]       = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError]         = useState("");

  const fetchAll = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const apiUrl = getApiBase();
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const requests = Object.entries(FETCH_URL).map(([type, path]) =>
      fetch(`${apiUrl}/api${path}`, { headers })
        .then(r => r.json())
        .then(data => {
          const list = data.data ?? data.assessments ?? data.worksheets ?? data.rubrics ?? data.syllabi ?? data.feedbacks ?? (Array.isArray(data) ? data : []);
          return list.map(d => ({ ...d, __type: type }));
        })
        .catch(() => [])
    );
    const results = await Promise.all(requests);
    setDocs(results.flat());
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { await fetchAll(); }
    catch { setError("Gagal memuat dokumen. Pastikan kamu sudah login."); }
    finally { setLoading(false); }
  }, [fetchAll]);

  useEffect(() => { load(); }, [load]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { doc } = deleteTarget;
    const path = DELETE_URL(doc.__type, doc.id);
    if (!path) { setDeleteTarget(null); return; }
    setDeleteLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api${path}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok || data.success) {
        setDocs(prev => prev.filter(d => !(d.id === doc.id && d.__type === doc.__type)));
        if (selectedDoc?.id === doc.id) setSelectedDoc(null);
      } else {
        alert(data.message || "Tidak dapat menghapus dokumen.");
      }
    } catch { alert("Koneksi gagal. Coba lagi."); }
    finally { setDeleteLoading(false); setDeleteTarget(null); }
  };

  // ── Update (setelah edit berhasil) ────────────────────────────────────────
  const handleSaved = (updatedDoc) => {
    setDocs(prev => prev.map(d =>
      d.id === updatedDoc.id && d.__type === updatedDoc.__type ? { ...d, ...updatedDoc } : d
    ));
    setSelectedDoc(updatedDoc);
  };

  const visible = docs.filter(doc => {
    const tabOk = activeTab === "all" || doc.__type === activeTab;
    return tabOk && matchesSearch(doc, doc.__type, search);
  });

  const countByType = (key) => key === "all" ? docs.length : docs.filter(d => d.__type === key).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-16 space-y-5">

        <Link href="/dashboard/guru" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-emerald-700 transition">
          ← Kembali ke Dashboard
        </Link>

        {/* Hero */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">🗂️</div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Perpustakaan</p>
              <h2 className="text-xl font-bold text-gray-900">Dokumen Saya</h2>
              <p className="text-xs text-gray-500 mt-0.5">Semua hasil generate AI tersimpan di sini</p>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 bg-white px-3 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shrink-0">
            <span className={loading ? "animate-spin inline-block" : ""}>🔄</span> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari dokumen berdasarkan judul, mata pelajaran, atau topik..."
            className="w-full pl-9 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-2xl outline-none focus:border-emerald-500 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">✕</button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => {
            const count = countByType(tab.key);
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition shrink-0 ${active ? "bg-[#006747] text-white border-[#006747] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"}`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Memuat dokumen...</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <span className="text-5xl">📭</span>
            <p className="text-base font-semibold text-gray-600">Belum ada dokumen</p>
            <p className="text-sm text-gray-400 max-w-xs">
              {search ? `Tidak ada dokumen yang cocok dengan "${search}"` : activeTab !== "all" ? `Belum ada dokumen jenis ${TABS.find(t => t.key === activeTab)?.label}.` : "Mulai buat dokumen pertamamu menggunakan fitur AI."}
            </p>
            {!search && (
              <Link href="/dashboard/guru" className="mt-2 inline-flex items-center gap-2 bg-[#006747] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-emerald-800 transition">
                ✨ Buat Dokumen Baru
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400">{visible.length} dokumen ditemukan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map((doc, idx) => (
                <DocCard
                  key={`${doc.__type}-${doc.id ?? idx}`}
                  doc={doc} type={doc.__type}
                  onPress={() => setSelectedDoc(doc)}
                  onDelete={() => setDeleteTarget({ doc })}
                  onEdit={() => { setSelectedDoc(doc); }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedDoc && (
        <DetailDrawer
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onDelete={() => { setDeleteTarget({ doc: selectedDoc }); setSelectedDoc(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          loading={deleteLoading}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}