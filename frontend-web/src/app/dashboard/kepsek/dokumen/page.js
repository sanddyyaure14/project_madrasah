"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── FeedbackBadge — tampil di modal detail jika user pernah memberi rating ──
function FeedbackBadge({ requestId }) {
  const [fb, setFb]           = useState(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [isHelpful, setIsHelpful] = useState(null);
  const [komentar, setKomentar]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!requestId) return;
    const token = typeof window !== "undefined" ? sessionStorage.getItem("accessToken") : null;
    if (!token) return;
    fetch(`${getApiBase()}/api/feedback/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setFb(json.data);
          setRating(json.data.rating || 0);
          setIsHelpful(json.data.is_helpful ?? null);
          setKomentar(json.data.komentar || "");
        }
      })
      .catch(() => {});
  }, [requestId]);

  const handleSave = async () => {
    if (!rating) { setError("Pilih rating bintang dulu."); return; }
    setSaving(true); setError("");
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch(`${getApiBase()}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ request_id: requestId, rating, komentar: komentar.trim() || null, is_helpful: isHelpful }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan.");
      setFb(json.data);
      setEditing(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (!fb && !editing) return null;

  const STAR_LABELS = { 1: "Sangat Kurang", 2: "Kurang", 3: "Cukup", 4: "Bagus", 5: "Sangat Bagus" };
  const activeRating = hovered || rating;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">✦ Feedback Kamu</p>
        {!editing && fb && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold underline transition"
          >
            Ubah
          </button>
        )}
      </div>

      {editing ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          {/* Bintang */}
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <button key={s} type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                className={`text-2xl transition-transform hover:scale-110 ${s <= activeRating ? "text-amber-400" : "text-gray-200 hover:text-amber-200"}`}
              >★</button>
            ))}
            {activeRating > 0 && (
              <span className="text-xs font-medium text-amber-600 ml-1">{STAR_LABELS[activeRating]}</span>
            )}
          </div>

          {/* Helpful */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Membantu?</span>
            <button type="button" onClick={() => setIsHelpful(true)}
              className={`text-xs px-3 py-1 rounded-full border transition font-medium ${isHelpful === true ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"}`}>
              👍 Ya
            </button>
            <button type="button" onClick={() => setIsHelpful(false)}
              className={`text-xs px-3 py-1 rounded-full border transition font-medium ${isHelpful === false ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-red-300"}`}>
              👎 Belum
            </button>
          </div>

          {/* Komentar */}
          <textarea rows={2} value={komentar} onChange={e => setKomentar(e.target.value)}
            placeholder="Komentar atau saran perbaikan (opsional)..."
            maxLength={500}
            className="w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 resize-none bg-white"
          />

          {error && <p className="text-[11px] text-red-500 font-medium">⚠ {error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => { setEditing(false); setError(""); }}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
              Batal
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !rating}
              className="flex-1 py-2 rounded-lg bg-[#006747] hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Menyimpan...</> : "✓ Simpan Feedback"}
            </button>
          </div>
        </div>
      ) : fb ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="flex gap-0.5 shrink-0 mt-0.5">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-base ${s <= fb.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700">
              {STAR_LABELS[fb.rating] || `${fb.rating} bintang`}
              {fb.is_helpful === true  && <span className="ml-2 text-emerald-600">· 👍 Membantu</span>}
              {fb.is_helpful === false && <span className="ml-2 text-gray-400">· 👎 Belum membantu</span>}
            </p>
            {fb.komentar && (
              <p className="text-[11px] text-gray-500 mt-0.5 italic truncate">"{fb.komentar}"</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Config ──────────────────────────────────────────────────────────────────
const TABS = [
  { key: "all",          label: "Semua",      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
  { key: "mc",           label: "Soal PG",    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { key: "rubric",       label: "Rubrik",     icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M6 3v18" /></svg> },
  { key: "feedback",     label: "Writing",    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> },
  { key: "worksheet",    label: "Worksheet",  icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { key: "syllabus",     label: "Silabus",    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { key: "academic",     label: "Konten",     icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
  { key: "presentation", label: "Presentasi", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg> },
  { key: "unit_plan",    label: "Modul Ajar", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
];

const FETCH_URL = {
  feedback:     "/feedback",
  worksheet:    "/worksheet/worksheets",
  mc:           "/assessment",
  rubric:       "/rubrics",
  syllabus:     "/syllabus",
  academic:     "/academic-content",
  presentation: "/presentation",
  unit_plan:    "/unit-plan",
};

const DELETE_URL = (type, id) => {
  switch (type) {
    case "worksheet":    return `/worksheet/worksheets/${id}`;
    case "mc":           return `/assessment/delete/${id}`;
    case "rubric":       return `/rubrics/${id}`;
    case "syllabus":     return `/syllabus/${id}`;
    case "academic":     return `/academic-content/${id}`;
    case "feedback":     return `/feedback/delete/${id}`;
    case "presentation": return `/presentation/${id}`;
    case "unit_plan":    return `/unit-plan/${id}`;
    default:             return null;
  }
};

// GET detail endpoint per type (untuk fetch detail saat modal dibuka)
const DETAIL_URL = (type, id) => {
  switch (type) {
    case "worksheet":    return `/worksheet/worksheets/${id}`;
    case "mc":           return `/assessment/${id}`;
    case "rubric":       return `/rubrics/${id}`;
    case "syllabus":     return `/syllabus/${id}`;
    case "academic":     return `/academic-content/${id}`;
    case "feedback":     return `/feedback/${id}`;
    case "presentation": return `/presentation/${id}`;
    case "unit_plan":    return `/unit-plan/${id}`;
    default:             return null;
  }
};

// PATCH/PUT endpoint per type
const UPDATE_URL = (type, id) => {
  switch (type) {
    case "worksheet":    return `/worksheet/worksheets/${id}`;
    case "mc":           return `/assessment/edit/${id}`;
    case "rubric":       return `/rubrics/${id}`;
    case "syllabus":     return `/syllabus/${id}`;
    case "academic":     return `/academic-content/${id}`;
    case "feedback":     return `/feedback/edit/${id}`;
    case "presentation": return `/presentation/${id}`;
    case "unit_plan":    return `/unit-plan/${id}`;
    default:             return null;
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
    { key: "worksheet_content", label: "Soal Worksheet", type: "textarea" },
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
  presentation: [
    { key: "topik",         label: "Topik",         type: "text" },
    { key: "tujuan",        label: "Tujuan",        type: "text" },
    { key: "audiens",       label: "Audiens",       type: "text" },
  ],
  unit_plan: [
    { key: "judul_unit",    label: "Judul Unit",    type: "text" },
    { key: "mata_pelajaran",label: "Mata Pelajaran",type: "text" },
    { key: "tingkat_kelas", label: "Tingkat Kelas", type: "text" },
  ],
};

const BADGE = {
  mc:           { bg: "#fee2e2", color: "#dc2626", label: "Soal PG" },
  rubric:       { bg: "#fef9c3", color: "#ca8a04", label: "Rubrik" },
  worksheet:    { bg: "#fef3c7", color: "#d97706", label: "Worksheet" },
  syllabus:     { bg: "#f0fdf4", color: "#16a34a", label: "Silabus" },
  academic:     { bg: "#eff6ff", color: "#1d4ed8", label: "Konten" },
  feedback:     { bg: "#d1fae5", color: "#065f46", label: "Writing" },
  presentation: { bg: "#f3e8ff", color: "#7e22ce", label: "Presentasi" },
  unit_plan:    { bg: "#fae8ff", color: "#a21caf", label: "Modul Ajar" },
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

function parseUnitPlan(doc) {
  const candidates = [doc.unit_plan_json, doc.unit_plan, doc.rpp_json];
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
    case "mc":           return doc.judul || doc.mata_pelajaran || "Soal PG";
    case "rubric":       return doc.judul || doc.nama_rubrik || "Rubrik";
    case "worksheet":    return doc.judul || doc.topik || "Worksheet";
    case "syllabus":     return doc.nama_silabus || doc.mata_pelajaran || "Silabus";
    case "academic":     return doc.judul || doc.title || "Konten";
    case "feedback":     return doc.nama_siswa || doc.judul || "Writing Feedback";
    case "presentation": return doc.topik || doc.tujuan || "Presentasi";
    case "unit_plan":    return doc.judul_unit || doc.mata_pelajaran || "Modul Ajar";
    default:             return "Dokumen";
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
    case "presentation":
      return [doc.jumlah_slide && `${doc.jumlah_slide} Slide`, doc.audiens && `Audiens: ${doc.audiens}`].filter(Boolean);
    case "unit_plan":
      return [doc.tingkat_kelas && `Kelas ${doc.tingkat_kelas}`, doc.jumlah_pertemuan && `${doc.jumlah_pertemuan} Pertemuan`].filter(Boolean);
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
  return (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : "") || "";
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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

// ─── Edit Form: Multiple Choice ───────────────────────────────────────────────
function EditMCForm({ doc, onSave, onCancel }) {
  const [topik, setTopik] = useState(doc.topik || "");
  const [tingkatKesulitan, setTingkatKesulitan] = useState(doc.tingkat_kesulitan || "");
  const [kompetensiDasar, setKompetensiDasar] = useState(doc.kompetensi_dasar || "");
  
  const [questions, setQuestions] = useState(() => {
    const list = Array.isArray(doc.questions_json) ? doc.questions_json :
                 Array.isArray(doc.soal) ? doc.soal :
                 Array.isArray(doc.questions) ? doc.questions : [];
    return JSON.parse(JSON.stringify(list));
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const updateQuestionField = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updatePilihan = (qIdx, char, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const nextPilihan = { ...(q.pilihan || {}) };
        nextPilihan[char] = value;
        return { ...q, pilihan: nextPilihan };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        topik,
        tingkat_kesulitan: tingkatKesulitan,
        kompetensi_dasar: kompetensiDasar,
        questions: questions
      };
      await saveDoc("mc", doc, body);
      onSave({ ...doc, topik, tingkat_kesulitan: tingkatKesulitan, kompetensi_dasar: kompetensiDasar, questions_json: questions });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h4 className="text-sm font-bold text-gray-900">Edit Soal Pilihan Ganda</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Topik</label>
          <input
            type="text"
            value={topik}
            onChange={e => setTopik(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tingkat Kesulitan</label>
          <select
            value={tingkatKesulitan}
            onChange={e => setTingkatKesulitan(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition capitalize"
          >
            <option value="mudah">Mudah</option>
            <option value="sedang">Sedang</option>
            <option value="sulit">Sulit</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Kompetensi Dasar</label>
        <input
          type="text"
          value={kompetensiDasar}
          onChange={e => setKompetensiDasar(e.target.value)}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daftar Pertanyaan</p>
        {questions.map((q, idx) => {
          const pilihan = q.pilihan || {};
          const keys = ["A", "B", "C", "D"];
          return (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-emerald-700">Soal {q.no || idx + 1}</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pertanyaan</label>
                <textarea
                  value={q.soal || q.pertanyaan || q.question || ""}
                  onChange={e => updateQuestionField(idx, "soal", e.target.value)}
                  rows={2}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keys.map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 w-5 shrink-0">{key}.</span>
                    <input
                      type="text"
                      value={pilihan[key] || ""}
                      onChange={e => updatePilihan(idx, key, e.target.value)}
                      className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kunci Jawaban</label>
                  <select
                    value={q.kunci || q.jawaban || q.answer || ""}
                    onChange={e => updateQuestionField(idx, "kunci", e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition font-semibold"
                  >
                    <option value="">-- Pilih Kunci --</option>
                    {keys.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pembahasan</label>
                  <textarea
                    value={q.pembahasan || ""}
                    onChange={e => updateQuestionField(idx, "pembahasan", e.target.value)}
                    rows={1}
                    className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Rubrik ────────────────────────────────────────────────────────
function EditRubricForm({ doc, onSave, onCancel }) {
  const [jenisTugas, setJenisTugas] = useState(doc.jenis_tugas || "");
  const [skalaNilai, setSkalaNilai] = useState(doc.skala_nilai || "");
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(doc.tujuan_pembelajaran || "");
  
  const [rubricJson, setRubricJson] = useState(() => {
    let raw = doc.rubric_json || {};
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = {}; }
    }
    const rubricData = raw.rubric || raw;
    return JSON.parse(JSON.stringify(rubricData));
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const updateAspekNama = (idx, val) => {
    setRubricJson(prev => {
      const next = { ...prev };
      next.aspek[idx].nama = val;
      return next;
    });
  };

  const updateAspekBobot = (idx, val) => {
    setRubricJson(prev => {
      const next = { ...prev };
      next.aspek[idx].bobot = parseInt(val) || 0;
      return next;
    });
  };

  const updateLevelDeskripsi = (aspekIdx, levelIdx, val) => {
    setRubricJson(prev => {
      const next = { ...prev };
      next.aspek[aspekIdx].level[levelIdx].deskripsi = val;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        jenis_tugas: jenisTugas,
        aspek_penilaian: rubricJson.aspek?.length || 0,
        skala_nilai: skalaNilai,
        tujuan_pembelajaran: tujuanPembelajaran,
        rubric_json: rubricJson
      };
      await saveDoc("rubric", doc, body);
      onSave({ ...doc, jenis_tugas: jenisTugas, skala_nilai: skalaNilai, tujuan_pembelajaran: tujuanPembelajaran, rubric_json: rubricJson });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const aspekList = rubricJson.aspek || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h4 className="text-sm font-bold text-gray-900">Edit Rubrik Penilaian</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Jenis Tugas</label>
          <input
            type="text"
            value={jenisTugas}
            onChange={e => setJenisTugas(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Skala Nilai</label>
          <input
            type="text"
            value={skalaNilai}
            onChange={e => setSkalaNilai(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
            placeholder="misal: 1-4, 1-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Tujuan Pembelajaran</label>
        <textarea
          value={tujuanPembelajaran}
          onChange={e => setTujuanPembelajaran(e.target.value)}
          rows={2}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition resize-none"
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kriteria & Aspek Penilaian</p>
        {aspekList.map((asp, aIdx) => {
          const levels = asp.level || asp.levels || [];
          return (
            <div key={aIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="grid grid-cols-3 gap-3 border-b border-gray-200 pb-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Aspek Penilaian {aIdx + 1}</label>
                  <input
                    type="text"
                    value={asp.nama || asp.nama_aspek || asp.name || ""}
                    onChange={e => updateAspekNama(aIdx, e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition font-semibold text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bobot (%)</label>
                  <input
                    type="number"
                    value={asp.bobot || 0}
                    onChange={e => updateAspekBobot(aIdx, e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition text-center font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi Tiap Skor</p>
                {levels.map((lvl, lIdx) => (
                  <div key={lIdx} className="flex gap-2.5 items-start bg-white border border-gray-100 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0 mt-1">
                      {lvl.nama} ({lvl.skor})
                    </span>
                    <textarea
                      value={lvl.deskripsi || lvl.kriteria || lvl.description || ""}
                      onChange={e => updateLevelDeskripsi(aIdx, lIdx, e.target.value)}
                      rows={2}
                      className="flex-1 text-xs px-3 py-1.5 border border-gray-100 rounded-lg outline-none focus:border-emerald-500 transition resize-none bg-gray-50/50"
                      placeholder={`Deskripsi untuk level ${lvl.nama || ""}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Silabus ───────────────────────────────────────────────────────
function EditSyllabusForm({ doc, onSave, onCancel }) {
  const [namaSilabus, setNamaSilabus] = useState(doc.nama_silabus || "");
  const [mataPelajaran, setMataPelajaran] = useState(doc.mata_pelajaran || "");
  const [semester, setSemester] = useState(doc.semester || "");
  const [tingkatKelas, setTingkatKelas] = useState(doc.tingkat_kelas || "");
  const [kurikulum, setKurikulum] = useState(doc.kurikulum || "");

  const [silabusJson, setSilabusJson] = useState(() => {
    let raw = doc.silabus_json || {};
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = {}; }
    }
    return JSON.parse(JSON.stringify(raw));
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const updateKompetensiInti = (val) => {
    const arr = val.split("\n").filter(x => x.trim() !== "");
    setSilabusJson(prev => ({ ...prev, kompetensi_inti: arr }));
  };

  const updateTabelRow = (idx, field, val) => {
    setSilabusJson(prev => {
      const next = { ...prev };
      next.tabel_silabus = (next.tabel_silabus || []).map((row, i) =>
        i === idx ? { ...row, [field]: val } : row
      );
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const updatedSillabusJson = {
        ...silabusJson,
        judul_silabus: namaSilabus,
        kompetensi_inti: silabusJson.kompetensi_inti || []
      };
      const body = {
        kurikulum,
        semester,
        jenjang: doc.jenjang,
        mata_pelajaran: mataPelajaran,
        tahun_ajaran: doc.tahun_ajaran,
        tingkat_kelas: tingkatKelas,
        silabus_json: updatedSillabusJson
      };
      await saveDoc("syllabus", doc, body);
      onSave({ ...doc, nama_silabus: namaSilabus, mata_pelajaran: mataPelajaran, semester, tingkat_kelas: tingkatKelas, kurikulum, silabus_json: updatedSillabusJson });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const kiText = (silabusJson.kompetensi_inti || []).join("\n");
  const tabelList = silabusJson.tabel_silabus || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h4 className="text-sm font-bold text-gray-900">Edit Silabus Pembelajaran</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Silabus</label>
          <input
            type="text"
            value={namaSilabus}
            onChange={e => setNamaSilabus(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Mata Pelajaran</label>
          <input
            type="text"
            value={mataPelajaran}
            onChange={e => setMataPelajaran(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Semester</label>
          <input
            type="text"
            value={semester}
            onChange={e => setSemester(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Kelas</label>
          <input
            type="text"
            value={tingkatKelas}
            onChange={e => setTingkatKelas(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Kurikulum</label>
        <input
          type="text"
          value={kurikulum}
          onChange={e => setKurikulum(e.target.value)}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Kompetensi Inti (Satu item per baris)</label>
        <textarea
          defaultValue={kiText}
          onBlur={e => updateKompetensiInti(e.target.value)}
          rows={4}
          className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          placeholder="Kompetensi Inti 1&#10;Kompetensi Inti 2..."
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tabel Silabus Mingguan</p>
        {tabelList.map((row, idx) => (
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-xs font-bold text-emerald-700">Minggu Ke-{row.minggu_ke || idx + 1}</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kompetensi Dasar</label>
                <textarea
                  value={row.kompetensi_dasar || ""}
                  onChange={e => updateTabelRow(idx, "kompetensi_dasar", e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Materi Pokok</label>
                <input
                  type="text"
                  value={row.materi_pokok || ""}
                  onChange={e => updateTabelRow(idx, "materi_pokok", e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kegiatan Pembelajaran</label>
                <textarea
                  value={row.kegiatan_pembelajaran || ""}
                  onChange={e => updateTabelRow(idx, "kegiatan_pembelajaran", e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alokasi Waktu</label>
                <input
                  type="text"
                  value={row.alokasi_waktu || ""}
                  onChange={e => updateTabelRow(idx, "alokasi_waktu", e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Konten Akademik ───────────────────────────────────────────────
function EditAcademicForm({ doc, onSave, onCancel }) {
  const [judul, setJudul] = useState(doc.judul || "");
  const [mataPelajaran, setMataPelajaran] = useState(doc.mata_pelajaran || "");
  const [tingkatKelas, setTingkatKelas] = useState(doc.tingkat_kelas || "");
  const [panjangKonten, setPanjangKonten] = useState(doc.panjang_konten || "");

  const [contentJson, setContentJson] = useState(() => {
    let raw = doc.content_json || {};
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = {}; }
    }
    return JSON.parse(JSON.stringify(raw));
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const updateContentField = (field, val) => {
    setContentJson(prev => ({ ...prev, [field]: val }));
  };

  const updatePoinPenting = (idx, field, val) => {
    setContentJson(prev => {
      const next = { ...prev };
      next.poin_penting = (next.poin_penting || []).map((p, i) =>
        i === idx ? { ...p, [field]: val } : p
      );
      return next;
    });
  };

  const updateIstilah = (idx, field, val) => {
    setContentJson(prev => {
      const next = { ...prev };
      next.istilah = (next.istilah || []).map((ist, i) =>
        i === idx ? { ...ist, [field]: val } : ist
      );
      return next;
    });
  };

  const updateSoal = (idx, field, val) => {
    setContentJson(prev => {
      const next = { ...prev };
      next.soal = (next.soal || []).map((s, i) =>
        i === idx ? { ...s, [field]: val } : s
      );
      return next;
    });
  };

  const updateSoalPilihan = (sIdx, key, val) => {
    setContentJson(prev => {
      const next = { ...prev };
      next.soal = (next.soal || []).map((s, i) => {
        if (i === sIdx) {
          const nextPilihan = { ...(s.pilihan || {}) };
          nextPilihan[key] = val;
          return { ...s, pilihan: nextPilihan };
        }
        return s;
      });
      return next;
    });
  };

  const updateKeywords = (val) => {
    const arr = val.split("\n").filter(x => x.trim() !== "");
    setContentJson(prev => ({ ...prev, kata_kunci: arr }));
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const updatedContentJson = { ...contentJson, judul: judul };
      const body = {
        jenis_konten: doc.jenis_konten,
        topik: doc.topik,
        mata_pelajaran: mataPelajaran,
        tingkat_kelas: tingkatKelas,
        panjang_konten: panjangKonten,
        content_json: updatedContentJson
      };
      await saveDoc("academic", doc, body);
      onSave({ ...doc, judul, mata_pelajaran: mataPelajaran, tingkat_kelas: tingkatKelas, panjang_konten: panjangKonten, content_json: updatedContentJson });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const jenis = doc.jenis_konten || "";
  const kwText = (contentJson.kata_kunci || []).join("\n");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h4 className="text-sm font-bold text-gray-900">Edit Konten Akademik</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Judul Konten</label>
          <input
            type="text"
            value={judul}
            onChange={e => setJudul(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Mata Pelajaran</label>
          <input
            type="text"
            value={mataPelajaran}
            onChange={e => setMataPelajaran(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Kelas</label>
          <input
            type="text"
            value={tingkatKelas}
            onChange={e => setTingkatKelas(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Panjang Konten</label>
          <input
            type="text"
            value={panjangKonten}
            onChange={e => setPanjangKonten(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
      </div>

      {contentJson.ringkasan !== undefined && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Ringkasan Utama</label>
          <textarea
            value={contentJson.ringkasan}
            onChange={e => updateContentField("ringkasan", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition resize-none"
          />
        </div>
      )}

      {jenis === "penjelasan" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pendahuluan</label>
            <textarea
              value={contentJson.pendahuluan || ""}
              onChange={e => updateContentField("pendahuluan", e.target.value)}
              rows={4}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Isi Konten</label>
            <textarea
              value={contentJson.konten || ""}
              onChange={e => updateContentField("konten", e.target.value)}
              rows={8}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Contoh Penerapan</label>
            <textarea
              value={contentJson.contoh_penerapan || ""}
              onChange={e => updateContentField("contoh_penerapan", e.target.value)}
              rows={3}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
            />
          </div>
        </div>
      )}

      {jenis === "ringkasan" && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Poin Penting</p>
          {(contentJson.poin_penting || []).map((poin, pIdx) => (
            <div key={pIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-2">
              <input
                type="text"
                value={poin.subjudul || ""}
                onChange={e => updatePoinPenting(pIdx, "subjudul", e.target.value)}
                className="w-full text-xs font-bold px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                placeholder="Subjudul..."
              />
              <textarea
                value={poin.isi || ""}
                onChange={e => updatePoinPenting(pIdx, "isi", e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                placeholder="Isi penjelasan poin..."
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Kesimpulan</label>
            <textarea
              value={contentJson.kesimpulan || ""}
              onChange={e => updateContentField("kesimpulan", e.target.value)}
              rows={3}
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
            />
          </div>
        </div>
      )}

      {jenis === "kamus" && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daftar Istilah</p>
          {(contentJson.istilah || []).map((ist, iIdx) => (
            <div key={iIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-3 space-y-2">
              <input
                type="text"
                value={ist.kata || ""}
                onChange={e => updateIstilah(iIdx, "kata", e.target.value)}
                className="w-full text-xs font-bold px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                placeholder="Kata/Istilah..."
              />
              <textarea
                value={ist.definisi || ""}
                onChange={e => updateIstilah(iIdx, "definisi", e.target.value)}
                rows={2}
                className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                placeholder="Definisi..."
              />
              <textarea
                value={ist.contoh || ""}
                onChange={e => updateIstilah(iIdx, "contoh", e.target.value)}
                rows={1}
                className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                placeholder="Contoh penggunaan..."
              />
            </div>
          ))}
        </div>
      )}

      {jenis === "contoh_soal" && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daftar Soal</p>
          {(contentJson.soal || []).map((s, sIdx) => {
            const pilihan = s.pilihan || {};
            const keys = ["A", "B", "C", "D"];
            return (
              <div key={sIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
                <span className="text-xs font-bold text-emerald-700">Soal {s.nomor || sIdx + 1}</span>
                <textarea
                  value={s.pertanyaan || ""}
                  onChange={e => updateSoal(sIdx, "pertanyaan", e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                  placeholder="Pertanyaan..."
                />
                
                {pilihan && typeof pilihan === "object" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {keys.map(k => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 w-5 shrink-0">{k}.</span>
                        <input
                          type="text"
                          value={pilihan[k] || ""}
                          onChange={e => updateSoalPilihan(sIdx, k, e.target.value)}
                          className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jawaban</label>
                    <select
                      value={s.jawaban || ""}
                      onChange={e => updateSoal(sIdx, "jawaban", e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition font-semibold"
                    >
                      <option value="">-- Kunci --</option>
                      {keys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pembahasan</label>
                    <textarea
                      value={s.pembahasan || ""}
                      onChange={e => updateSoal(sIdx, "pembahasan", e.target.value)}
                      rows={1}
                      className="w-full text-xs px-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Kata Kunci (Satu kata/frasa per baris)</label>
        <textarea
          defaultValue={kwText}
          onBlur={e => updateKeywords(e.target.value)}
          rows={3}
          className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          placeholder="Kata kunci 1&#10;Kata kunci 2..."
        />
      </div>

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Presentasi ───────────────────────────────────────────────────
function EditPresentationForm({ doc, onSave, onCancel }) {
  const [topik, setTopik] = useState(doc.topik || "");
  const [tujuan, setTujuan] = useState(doc.tujuan || "");
  const [audiens, setAudiens] = useState(doc.audiens || "");

  const [slidesJson, setSlidesJson] = useState(() => {
    let raw = doc.slides_json || [];
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    return JSON.parse(JSON.stringify(raw));
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const updateSlideField = (idx, field, val) => {
    setSlidesJson(prev => prev.map((s, i) =>
      i === idx ? { ...s, [field]: val } : s
    ));
  };

  const updateSlideContent = (idx, val) => {
    const arr = val.split("\n").filter(x => x.trim() !== "");
    setSlidesJson(prev => prev.map((s, i) =>
      i === idx ? { ...s, content: arr } : s
    ));
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const body = {
        topik,
        tujuan,
        audiens,
        slides_json: slidesJson,
        jumlah_slide: slidesJson.length
      };
      await saveDoc("presentation", doc, body);
      onSave({ ...doc, topik, tujuan, audiens, slides_json: slidesJson, jumlah_slide: slidesJson.length });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h4 className="text-sm font-bold text-gray-900">Edit Presentasi (Slides)</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Topik</label>
          <input
            type="text"
            value={topik}
            onChange={e => setTopik(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Audiens</label>
          <input
            type="text"
            value={audiens}
            onChange={e => setAudiens(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Tujuan Presentasi</label>
        <textarea
          value={tujuan}
          onChange={e => setTujuan(e.target.value)}
          rows={2}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition resize-none"
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide Pembelajaran</p>
        {slidesJson.map((slide, idx) => {
          const bulletText = (slide.content || []).join("\n");
          return (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-emerald-700">Slide {slide.slide_number || idx + 1}</span>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Judul Slide</label>
                <input
                  type="text"
                  value={slide.title || ""}
                  onChange={e => updateSlideField(idx, "title", e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Isi Poin (Satu poin per baris)</label>
                <textarea
                  defaultValue={bulletText}
                  onBlur={e => updateSlideContent(idx, e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                  placeholder="Poin bahasan 1&#10;Poin bahasan 2..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Catatan Presenter</label>
                <textarea
                  value={slide.catatan || ""}
                  onChange={e => updateSlideField(idx, "catatan", e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                  placeholder="Catatan saat presentasi..."
                />
              </div>
            </div>
          );
        })}
      </div>

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Modul Ajar ────────────────────────────────────────────────────
function EditUnitPlanForm({ doc, onSave, onCancel }) {
  const [judulUnit, setJudulUnit] = useState(doc.judul_unit || "");
  const [mataPelajaran, setMataPelajaran] = useState(doc.mata_pelajaran || "");
  const [tingkatKelas, setTingkatKelas] = useState(doc.tingkat_kelas || doc.kelas || "");
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(doc.tujuan_pembelajaran || "");
  const [jumlahPertemuan, setJumlahPertemuan] = useState(doc.jumlah_pertemuan || 2);
  const [durasiPerJp, setDurasiPerJp] = useState(doc.durasi_per_jp || 40);

  const [unitPlanJson, setUnitPlanJson] = useState(() => {
    let raw = doc.unit_plan_json || {};
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch { raw = {}; }
    }
    return JSON.parse(JSON.stringify(raw));
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const updateInfoField = (field, val) => {
    setUnitPlanJson(prev => {
      const next = { ...prev };
      next.informasi_umum = { ...(next.informasi_umum || {}), [field]: val };
      return next;
    });
  };

  const updateInfoArray = (field, val) => {
    const arr = val.split("\n").filter(x => x.trim() !== "");
    updateInfoField(field, arr);
  };

  const updateIntiField = (field, val) => {
    setUnitPlanJson(prev => {
      const next = { ...prev };
      next.komponen_inti = { ...(next.komponen_inti || {}), [field]: val };
      return next;
    });
  };

  const updateIntiArray = (field, val) => {
    const arr = val.split("\n").filter(x => x.trim() !== "");
    updateIntiField(field, arr);
  };

  const updatePertemuanField = (pIdx, field, val) => {
    const arr = val.split("\n").filter(x => x.trim() !== "");
    setUnitPlanJson(prev => {
      const next = { ...prev };
      if (!next.komponen_inti) next.komponen_inti = {};
      const list = next.komponen_inti.kegiatan_pembelajaran || [];
      next.komponen_inti.kegiatan_pembelajaran = list.map((keg, idx) =>
        idx === pIdx ? { ...keg, [field]: arr } : keg
      );
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true); setErr("");
    try {
      const updatedUnitPlanJson = {
        ...unitPlanJson,
        informasi_umum: {
          ...(unitPlanJson.informasi_umum || {}),
          judul_unit: judulUnit,
          mata_pelajaran: mataPelajaran,
          kelas: tingkatKelas
        }
      };
      const body = {
        judul_unit: judulUnit,
        mata_pelajaran: mataPelajaran,
        tingkat_kelas: tingkatKelas,
        tujuan_pembelajaran: tujuanPembelajaran,
        jumlah_pertemuan: parseInt(jumlahPertemuan) || 2,
        durasi_per_jp: parseInt(durasiPerJp) || 40,
        unit_plan_json: updatedUnitPlanJson
      };
      await saveDoc("unit_plan", doc, body);
      onSave({ ...doc, judul_unit: judulUnit, mata_pelajaran: mataPelajaran, tingkat_kelas: tingkatKelas, tujuan_pembelajaran: tujuanPembelajaran, jumlah_pertemuan: jumlahPertemuan, durasi_per_jp: durasiPerJp, unit_plan_json: updatedUnitPlanJson });
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const info = unitPlanJson.informasi_umum || {};
  const inti = unitPlanJson.komponen_inti || {};

  const kompetensiAwalText = (info.kompetensi_awal || []).join("\n");
  const p3Text = (info.profil_pelajar_pancasila || []).join("\n");
  const sarprasText = (info.sarana_prasarana || []).join("\n");

  const tpText = (inti.tujuan_pembelajaran || []).join("\n");
  const pemantikText = (inti.pertanyaan_pemantik || []).join("\n");
  const asesmenText = (inti.asesmen || []).join("\n");
  const pengayaanText = (inti.pengayaan_dan_remedial || []).join("\n");

  const kegiatanList = inti.kegiatan_pembelajaran || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        <h4 className="text-sm font-bold text-gray-900">Edit Modul Ajar (RPP)</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Judul Unit</label>
          <input
            type="text"
            value={judulUnit}
            onChange={e => setJudulUnit(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Mata Pelajaran</label>
          <input
            type="text"
            value={mataPelajaran}
            onChange={e => setMataPelajaran(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Kelas</label>
          <input
            type="text"
            value={tingkatKelas}
            onChange={e => setTingkatKelas(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tujuan Pembelajaran (Singkat)</label>
          <input
            type="text"
            value={tujuanPembelajaran}
            onChange={e => setTujuanPembelajaran(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Pertemuan</label>
          <input
            type="number"
            value={jumlahPertemuan}
            onChange={e => setJumlahPertemuan(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition text-center"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Durasi per JP (menit)</label>
          <input
            type="number"
            value={durasiPerJp}
            onChange={e => setDurasiPerJp(e.target.value)}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-gray-50 transition text-center"
          />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">I. Informasi Umum</p>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Peserta Didik</label>
          <input
            type="text"
            value={info.target_peserta_didik || ""}
            onChange={e => updateInfoField("target_peserta_didik", e.target.value)}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kompetensi Awal (Satu item per baris)</label>
          <textarea
            defaultValue={kompetensiAwalText}
            onBlur={e => updateInfoArray("kompetensi_awal", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Profil Pelajar Pancasila (Satu item per baris)</label>
          <textarea
            defaultValue={p3Text}
            onBlur={e => updateInfoArray("profil_pelajar_pancasila", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sarana & Prasarana (Satu item per baris)</label>
          <textarea
            defaultValue={sarprasText}
            onBlur={e => updateInfoArray("sarana_prasarana", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">II. Komponen Inti</p>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tujuan Pembelajaran Lengkap (Satu item per baris)</label>
          <textarea
            defaultValue={tpText}
            onBlur={e => updateIntiArray("tujuan_pembelajaran", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pemahaman Bermakna</label>
          <textarea
            value={inti.pemahaman_bermakna || ""}
            onChange={e => updateIntiField("pemahaman_bermakna", e.target.value)}
            rows={2}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition resize-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pertanyaan Pemantik (Satu item per baris)</label>
          <textarea
            defaultValue={pemantikText}
            onBlur={e => updateIntiArray("pertanyaan_pemantik", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">III. Kegiatan Pembelajaran</p>
        {kegiatanList.map((keg, idx) => {
          const pendText = (keg.pendahuluan || []).join("\n");
          const intiText = (keg.kegiatan_inti || []).join("\n");
          const penText = (keg.penutup || []).join("\n");

          return (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <span className="text-xs font-bold text-emerald-700">Pertemuan Ke-{keg.pertemuan_ke || idx + 1}</span>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pendahuluan (Satu langkah per baris)</label>
                <textarea
                  defaultValue={pendText}
                  onBlur={e => updatePertemuanField(idx, "pendahuluan", e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kegiatan Inti (Satu langkah per baris)</label>
                <textarea
                  defaultValue={intiText}
                  onBlur={e => updatePertemuanField(idx, "kegiatan_inti", e.target.value)}
                  rows={5}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Penutup (Satu langkah per baris)</label>
                <textarea
                  defaultValue={penText}
                  onBlur={e => updatePertemuanField(idx, "penutup", e.target.value)}
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">IV. Asesmen & Pengayaan</p>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Metode Asesmen (Satu item per baris)</label>
          <textarea
            defaultValue={asesmenText}
            onBlur={e => updateIntiArray("asesmen", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pengayaan & Remedial (Satu item per baris)</label>
          <textarea
            defaultValue={pengayaanText}
            onBlur={e => updateIntiArray("pengayaan_dan_remedial", e.target.value)}
            rows={3}
            className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 bg-white transition"
          />
        </div>
      </div>

      {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <SaveCancelButtons saving={saving} onCancel={onCancel} onSave={handleSave} />
    </div>
  );
}

// ─── Edit Form: Generic ───────────────────────────────────────────────────────
function EditForm({ doc, type, onSave, onCancel }) {
  if (type === "feedback")     return <EditFeedbackForm     doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "worksheet")    return <EditWorksheetForm    doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "mc")           return <EditMCForm           doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "rubric")       return <EditRubricForm       doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "syllabus")     return <EditSyllabusForm     doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "academic")     return <EditAcademicForm     doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "presentation") return <EditPresentationForm doc={doc} onSave={onSave} onCancel={onCancel} />;
  if (type === "unit_plan")    return <EditUnitPlanForm    doc={doc} onSave={onSave} onCancel={onCancel} />;

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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
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
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">Ringkasan</p>
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
                        <p className="text-[10px] font-bold text-amber-700 mb-0.5">Saran</p>
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
          {copied ? "✓ Tersalin!" : "Copy"}
        </button>
        <button
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildText())}`, "_blank")}
          className="flex-[1.4] flex items-center justify-center gap-1.5 bg-[#006747] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-emerald-800 transition"
        >
          Kirim ke Siswa
        </button>
      </div>

      {/* Edit & Delete */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition"
        >
          Hapus
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
          {copied ? "✓ Tersalin!" : "Copy Teks"}
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition">
          Print
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
          Edit
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">
          Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Detail: Presentasi ───────────────────────────────────────────────────────
function PresentationDetail({ doc, onDelete, onEdit }) {
  const slides = Array.isArray(doc.slides_json) ? doc.slides_json : [];

  const handleDownloadPPT = async () => {
    if (!doc.id) return;
    try {
      const res = await fetch(`${getApiBase()}/api/presentation/download/${doc.id}/ppt`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh PPT");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Presentasi_${doc.topik || "presentation"}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh PPT: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={handleDownloadPPT} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-2 rounded-lg transition">
          Unduh PPTX
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4 max-h-[400px] overflow-y-auto">
        <h4 className="font-bold text-sm text-gray-900 border-b border-gray-200 pb-2 uppercase">{doc.topik}</h4>
        {slides.map((slide, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
              <span className="text-xs font-bold text-emerald-700">Slide {slide.slide_number || idx + 1}</span>
            </div>
            <p className="font-bold text-sm text-gray-800">{slide.title}</p>
            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
              {Array.isArray(slide.content) && slide.content.map((point, pIdx) => (
                <li key={pIdx}>{point}</li>
              ))}
            </ul>
            {slide.catatan && (
              <div className="bg-amber-50 rounded-lg p-2.5 mt-2 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">Catatan Presenter</p>
                <p className="text-xs text-amber-900 leading-relaxed">{slide.catatan}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
          Edit
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">
          Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Detail: Modul Ajar ───────────────────────────────────────────────────────
function UnitPlanDetail({ doc, onDelete, onEdit }) {
  const up = parseUnitPlan(doc);
  const info = up.informasi_umum || {};
  const inti = up.komponen_inti || {};

  const handleDownloadDocx = async () => {
    if (!doc.id) return;
    try {
      const res = await fetch(`${getApiBase()}/api/unit-plan/download/${doc.id}/docx`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Gagal mengunduh DOCX");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RPP_${doc.judul_unit || "unit_plan"}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal unduh DOCX: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={handleDownloadDocx} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-3 py-2 rounded-lg transition">
          Unduh DOCX
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-4 max-h-[400px] overflow-y-auto text-xs">
        <div className="text-center border-b-2 border-gray-800 pb-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Modul Ajar / RPP</p>
          <h3 className="font-bold text-sm text-gray-900 uppercase">{doc.judul_unit || info.judul_unit || "Modul Ajar"}</h3>
          <p className="text-[10px] text-gray-500 font-mono mt-1">Mapel: {doc.mata_pelajaran || info.mata_pelajaran} | Kelas: {doc.tingkat_kelas || info.kelas}</p>
        </div>

        {/* Informasi Umum */}
        <div className="space-y-2">
          <p className="font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-0.5">I. Informasi Umum</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-700 font-medium">
            {info.alokasi_waktu && <p><strong>Alokasi Waktu:</strong> {info.alokasi_waktu}</p>}
            {info.target_peserta_didik && <p><strong>Target Didik:</strong> {info.target_peserta_didik}</p>}
          </div>
          {Array.isArray(info.kompetensi_awal) && info.kompetensi_awal.length > 0 && (
            <div className="mt-1">
              <strong className="text-gray-800">Kompetensi Awal:</strong>
              <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                {info.kompetensi_awal.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          {Array.isArray(info.profil_pelajar_pancasila) && info.profil_pelajar_pancasila.length > 0 && (
            <div className="mt-1">
              <strong className="text-gray-800">Profil Pelajar Pancasila:</strong>
              <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                {info.profil_pelajar_pancasila.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          {Array.isArray(info.sarana_prasarana) && info.sarana_prasarana.length > 0 && (
            <div className="mt-1">
              <strong className="text-gray-800">Sarana & Prasarana:</strong>
              <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                {info.sarana_prasarana.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Komponen Inti */}
        <div className="space-y-2 pt-2">
          <p className="font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-0.5">II. Komponen Inti</p>
          {Array.isArray(inti.tujuan_pembelajaran) && inti.tujuan_pembelajaran.length > 0 && (
            <div>
              <strong className="text-gray-800">Tujuan Pembelajaran:</strong>
              <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                {inti.tujuan_pembelajaran.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
          {inti.pemahaman_bermakna && (
            <p className="mt-1"><strong className="text-gray-800">Pemahaman Bermakna:</strong> <span className="text-gray-600 font-medium">{inti.pemahaman_bermakna}</span></p>
          )}
          {Array.isArray(inti.pertanyaan_pemantik) && inti.pertanyaan_pemantik.length > 0 && (
            <div className="mt-1">
              <strong className="text-gray-800">Pertanyaan Pemantik:</strong>
              <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                {inti.pertanyaan_pemantik.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Kegiatan Pembelajaran */}
        {Array.isArray(inti.kegiatan_pembelajaran) && inti.kegiatan_pembelajaran.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-0.5">III. Kegiatan Pembelajaran</p>
            {inti.kegiatan_pembelajaran.map((keg, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <p className="font-bold text-emerald-700">Pertemuan Ke-{keg.pertemuan_ke || idx + 1}</p>
                {Array.isArray(keg.pendahuluan) && keg.pendahuluan.length > 0 && (
                  <div>
                    <strong className="text-[10px] text-gray-500 uppercase">Pendahuluan:</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                      {keg.pendahuluan.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(keg.kegiatan_inti) && keg.kegiatan_inti.length > 0 && (
                  <div>
                    <strong className="text-[10px] text-gray-500 uppercase">Kegiatan Inti:</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                      {keg.kegiatan_inti.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                )}
                {Array.isArray(keg.penutup) && keg.penutup.length > 0 && (
                  <div>
                    <strong className="text-[10px] text-gray-500 uppercase">Penutup:</strong>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                      {keg.penutup.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Asesmen & Lampiran */}
        {((Array.isArray(inti.asesmen) && inti.asesmen.length > 0) || (Array.isArray(inti.pengayaan_dan_remedial) && inti.pengayaan_dan_remedial.length > 0)) && (
          <div className="space-y-2 pt-2">
            <p className="font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-100 pb-0.5">IV. Asesmen & Pengayaan</p>
            {Array.isArray(inti.asesmen) && inti.asesmen.length > 0 && (
              <div>
                <strong className="text-gray-800">Asesmen:</strong>
                <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                  {inti.asesmen.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            )}
            {Array.isArray(inti.pengayaan_dan_remedial) && inti.pengayaan_dan_remedial.length > 0 && (
              <div className="mt-1.5">
                <strong className="text-gray-800">Pengayaan & Remedial:</strong>
                <ul className="list-disc pl-5 mt-0.5 space-y-0.5 text-gray-600 font-medium">
                  {inti.pengayaan_dan_remedial.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
          Edit
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">
          Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Detail: Soal PG (Multiple Choice) ───────────────────────────────────────
function MCDetail({ doc, onDelete, onEdit }) {
  // questions_json adalah array dari DB, pilihan berformat object {A: "...", B: "...", ...}
  const soalList = Array.isArray(doc.questions_json) ? doc.questions_json :
    Array.isArray(doc.soal) ? doc.soal :
    Array.isArray(doc.questions) ? doc.questions :
    Array.isArray(doc.content_json?.soal) ? doc.content_json.soal : [];

  const [copied, setCopied] = useState(false);

  function buildText() {
    let t = `SOAL PILIHAN GANDA\n=====================================\n`;
    t += `Mata Pelajaran: ${doc.mata_pelajaran || "-"}\n`;
    t += `Kelas       : ${doc.tingkat_kelas || doc.kelas || "-"}\n`;
    t += `Topik       : ${doc.topik || "-"}\n`;
    t += `Kesulitan   : ${doc.tingkat_kesulitan || "-"}\n`;
    t += `=====================================\n\n`;
    soalList.forEach((s, i) => {
      t += `${s.no || i + 1}. ${s.soal || s.pertanyaan || s.question || ""}\n`;
      // pilihan bisa berformat object {A,B,C,D} atau array
      const pilihan = s.pilihan || s.opsi || s.options;
      if (pilihan && typeof pilihan === "object" && !Array.isArray(pilihan)) {
        Object.entries(pilihan).forEach(([huruf, teks]) => { t += `   ${huruf}. ${teks}\n`; });
      } else if (Array.isArray(pilihan)) {
        pilihan.forEach((o, j) => { t += `   ${String.fromCharCode(65 + j)}. ${typeof o === "object" ? (o.teks || o.text || JSON.stringify(o)) : o}\n`; });
      }
      if (s.kunci || s.jawaban || s.answer) t += `   ✓ Jawaban: ${s.kunci || s.jawaban || s.answer}\n`;
      if (s.pembahasan) t += `   ${s.pembahasan}\n`;
      t += `\n`;
    });
    return t;
  }

  return (
    <div className="space-y-4">
      {/* Info Header */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1">
        <h3 className="text-base font-bold text-gray-900">{doc.judul || "Soal Pilihan Ganda"}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {doc.mata_pelajaran && <span className="bg-white border border-red-200 text-red-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{doc.mata_pelajaran}</span>}
          {doc.kelas && <span className="bg-white border border-red-200 text-red-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">Kelas {doc.kelas}</span>}
          {doc.jumlah_soal && <span className="bg-white border border-red-200 text-red-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{doc.jumlah_soal} Soal</span>}
          {doc.tingkat_kesulitan && <span className="bg-white border border-red-200 text-red-700 text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize">{doc.tingkat_kesulitan}</span>}
        </div>
      </div>

      {/* Soal List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {soalList.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Belum ada soal tersimpan.</p>
          </div>
        )}
        {soalList.map((s, i) => {
          // pilihan bisa object {A,B,C,D} atau array
          const pilihanObj = s.pilihan || s.opsi || s.options;
          const pilihanEntries = pilihanObj
            ? (typeof pilihanObj === "object" && !Array.isArray(pilihanObj)
                ? Object.entries(pilihanObj)
                : (Array.isArray(pilihanObj) ? pilihanObj.map((o, j) => [String.fromCharCode(65 + j), typeof o === "object" ? (o.teks || o.text || JSON.stringify(o)) : o]) : [])
              )
            : [];
          const jawaban = s.kunci || s.jawaban || s.answer || "";
          return (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-sm font-semibold text-gray-800">{s.no || i + 1}. {s.soal || s.pertanyaan || s.question}</p>
              {pilihanEntries.length > 0 && (
                <ul className="space-y-1 pl-1">
                  {pilihanEntries.map(([huruf, teks]) => {
                    const isAnswer = jawaban && jawaban === huruf;
                    return (
                      <li key={huruf} className={`flex items-start gap-2 text-xs rounded-lg px-2 py-1 ${isAnswer ? "bg-emerald-50 text-emerald-800 font-semibold" : "text-gray-600"}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5 ${isAnswer ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}>{huruf}</span>
                        {teks} {isAnswer && <span className="ml-auto text-emerald-600">✓</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {s.pembahasan && (
                <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 mb-0.5">Pembahasan</p>
                  <p className="text-xs text-amber-900">{s.pembahasan}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action */}
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => { navigator.clipboard.writeText(buildText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex-1 flex items-center justify-center gap-1.5 border border-red-300 text-red-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-red-50 transition"
        >
          {copied ? "✓ Tersalin!" : "Copy Soal"}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">
          Edit
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">
          Hapus
        </button>
      </div>
    </div>
  );
}

// ─── Detail: Rubrik ───────────────────────────────────────────────────────────
function RubricDetail({ doc, onDelete, onEdit }) {
  // rubric_json berisi { judul, aspek: [{nama, bobot, level: [{nama,skor,deskripsi}]}] }
  const rubricJson = doc.rubric_json || {};
  const rubricData = rubricJson.rubric || rubricJson; // kadang dibungkus lagi
  const aspek = Array.isArray(rubricData.aspek) ? rubricData.aspek :
    Array.isArray(doc.aspek_penilaian) ? doc.aspek_penilaian :
    Array.isArray(doc.criteria) ? doc.criteria : [];
  const judulRubrik = rubricData.judul || doc.judul || doc.nama_rubrik || doc.jenis_tugas || "Rubrik Penilaian";
  const [copied, setCopied] = useState(false);

  function buildText() {
    let t = `RUBRIK PENILAIAN\n=====================================\n`;
    t += `Judul  : ${judulRubrik}\n`;
    t += `Skala  : ${doc.skala_nilai || "-"}\n`;
    t += `=====================================\n\n`;
    aspek.forEach((a, i) => {
      t += `${i + 1}. ${a.nama || a.nama_aspek || a.name || ""}  (Bobot: ${a.bobot || "-"}%)\n`;
      const levels = a.level || a.levels || a.kriteria || [];
      if (Array.isArray(levels)) levels.forEach(l => { t += `   [${l.nama || ""}/${l.skor || ""}] ${l.deskripsi || l.kriteria || ""}\n`; });
      t += `\n`;
    });
    return t;
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
        <h3 className="text-base font-bold text-gray-900">{judulRubrik}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {doc.jenis_tugas && <span className="bg-white border border-yellow-200 text-yellow-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{doc.jenis_tugas}</span>}
          {doc.skala_nilai && <span className="bg-white border border-yellow-200 text-yellow-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">Skala: {doc.skala_nilai}</span>}
          {aspek.length > 0 && <span className="bg-white border border-yellow-200 text-yellow-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{aspek.length} Aspek</span>}
        </div>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {aspek.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">Belum ada aspek tersimpan.</div>}
        {aspek.map((a, i) => {
          const levels = a.level || a.levels || a.kriteria || [];
          return (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">{i + 1}. {a.nama || a.nama_aspek || a.name}</p>
                {a.bobot != null && <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{a.bobot}%</span>}
              </div>
              {Array.isArray(levels) && levels.length > 0 && (
                <div className="space-y-1">
                  {levels.map((l, j) => (
                    <div key={j} className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                      {(l.skor != null || l.nilai != null) && (
                        <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">{l.nama || ""} ({l.skor ?? l.nilai})</span>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed">{l.deskripsi || l.kriteria || l.description || ""}</p>
                    </div>
                  ))}
                </div>
              )}
              {typeof levels === "string" && <p className="text-xs text-gray-600">{levels}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button onClick={() => { navigator.clipboard.writeText(buildText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex-1 flex items-center justify-center gap-1.5 border border-yellow-400 text-yellow-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-yellow-50 transition">
          {copied ? "✓ Tersalin!" : "Copy Rubrik"}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">Edit</button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">Hapus</button>
      </div>
    </div>
  );
}

// ─── Detail: Silabus ──────────────────────────────────────────────────────────
function SyllabusDetail({ doc, onDelete, onEdit }) {
  // silabus_json berisi { judul_silabus, kompetensi_inti, tabel_silabus: [{minggu_ke, kompetensi_dasar, materi_pokok, ...}] }
  const silabusJson = doc.silabus_json || {};
  const judulSilabus = silabusJson.judul_silabus || doc.nama_silabus || doc.mata_pelajaran || "Silabus";
  const kompetensiInti = Array.isArray(silabusJson.kompetensi_inti) ? silabusJson.kompetensi_inti : [];
  const tabelSilabus = Array.isArray(silabusJson.tabel_silabus) ? silabusJson.tabel_silabus : [];
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
        <h3 className="text-base font-bold text-gray-900">{judulSilabus}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {doc.mata_pelajaran && <span className="bg-white border border-green-200 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{doc.mata_pelajaran}</span>}
          {doc.jenjang && <span className="bg-white border border-green-200 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{doc.jenjang}</span>}
          {doc.tingkat_kelas && <span className="bg-white border border-green-200 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">Kelas {doc.tingkat_kelas}</span>}
          {doc.semester && <span className="bg-white border border-green-200 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">Semester {doc.semester}</span>}
          {doc.kurikulum && <span className="bg-white border border-green-200 text-green-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{doc.kurikulum}</span>}
        </div>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
        {kompetensiInti.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-2">Kompetensi Inti</p>
            <ul className="list-disc pl-4 space-y-1">
              {kompetensiInti.map((k, i) => (
                <li key={i} className="text-gray-700 leading-relaxed">{typeof k === "object" ? JSON.stringify(k) : k}</li>
              ))}
            </ul>
          </div>
        )}
        {tabelSilabus.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Kegiatan Per Minggu</p>
            {tabelSilabus.map((row, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 space-y-1">
                <p className="font-bold text-emerald-700 text-[11px]">Minggu ke-{row.minggu_ke || i + 1}</p>
                {row.kompetensi_dasar && <p className="text-gray-700"><strong>KD:</strong> {row.kompetensi_dasar}</p>}
                {row.materi_pokok && <p className="text-gray-700"><strong>Materi:</strong> {row.materi_pokok}</p>}
                {row.kegiatan_pembelajaran && <p className="text-gray-700"><strong>Kegiatan:</strong> {row.kegiatan_pembelajaran}</p>}
                {row.alokasi_waktu && <p className="text-gray-500"><strong>Waktu:</strong> {row.alokasi_waktu}</p>}
              </div>
            ))}
          </div>
        )}
        {kompetensiInti.length === 0 && tabelSilabus.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">Data silabus belum tersedia.</div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">Edit</button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">Hapus</button>
      </div>
    </div>
  );
}

// ─── Detail: Konten Akademik ──────────────────────────────────────────────────
function AcademicDetail({ doc, onDelete, onEdit }) {
  // content_json berbeda struktur per jenis_konten:
  // penjelasan: { judul, ringkasan, pendahuluan, konten, contoh_penerapan, kata_kunci }
  // ringkasan:  { judul, ringkasan, poin_penting:[{subjudul,isi}], kesimpulan, kata_kunci }
  // kamus:      { judul, ringkasan, istilah:[{kata,definisi,contoh}], kata_kunci }
  // contoh_soal:{ judul, ringkasan, soal:[{nomor,pertanyaan,pilihan,jawaban,pembahasan}], kata_kunci }
  const cj = doc.content_json || {};
  const judul = cj.judul || doc.judul || doc.topik || "Konten";
  const jenis = doc.jenis_konten || "";
  const [copied, setCopied] = useState(false);

  function buildText() {
    let t = `${judul}\n${'='.repeat(Math.min(judul.length, 40))}\n\n`;
    if (doc.mata_pelajaran) t += `Mata Pelajaran: ${doc.mata_pelajaran}\n`;
    if (jenis) t += `Jenis: ${jenis}\n\n`;
    if (cj.ringkasan) t += `RINGKASAN:\n${cj.ringkasan}\n\n`;
    if (cj.pendahuluan) t += `PENDAHULUAN:\n${cj.pendahuluan}\n\n`;
    if (cj.konten) t += `KONTEN:\n${cj.konten}\n\n`;
    if (cj.kesimpulan) t += `KESIMPULAN:\n${cj.kesimpulan}\n\n`;
    return t;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="text-base font-bold text-gray-900">{judul}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {doc.mata_pelajaran && <span className="bg-white border border-blue-200 text-blue-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">{doc.mata_pelajaran}</span>}
          {jenis && <span className="bg-white border border-blue-200 text-blue-700 text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize">{jenis.replace("_", " ")}</span>}
          {doc.tingkat_kelas && <span className="bg-white border border-blue-200 text-blue-700 text-[10px] px-2.5 py-1 rounded-full font-semibold">Kelas {doc.tingkat_kelas}</span>}
          {doc.panjang_konten && <span className="bg-white border border-blue-200 text-blue-700 text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize">{doc.panjang_konten}</span>}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 text-xs">
        {!cj.judul && !cj.konten && !cj.poin_penting && !cj.istilah && !cj.soal && (
          <div className="text-center py-6 text-gray-400 text-sm">Konten belum tersedia.</div>
        )}
        {/* Ringkasan/Pendahuluan */}
        {cj.ringkasan && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Ringkasan</p>
            <p className="text-gray-700 leading-relaxed">{cj.ringkasan}</p>
          </div>
        )}
        {/* Penjelasan */}
        {cj.pendahuluan && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Pendahuluan</p>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{cj.pendahuluan}</p>
          </div>
        )}
        {cj.konten && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Konten</p>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{cj.konten}</p>
          </div>
        )}
        {cj.contoh_penerapan && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Contoh Penerapan</p>
            <p className="text-gray-700 leading-relaxed">{cj.contoh_penerapan}</p>
          </div>
        )}
        {/* Ringkasan: poin_penting */}
        {Array.isArray(cj.poin_penting) && cj.poin_penting.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Poin Penting</p>
            {cj.poin_penting.map((p, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                {p.subjudul && <p className="font-bold text-gray-800 mb-1">{p.subjudul}</p>}
                <p className="text-gray-600 leading-relaxed">{p.isi}</p>
              </div>
            ))}
          </div>
        )}
        {cj.kesimpulan && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Kesimpulan</p>
            <p className="text-gray-700 leading-relaxed">{cj.kesimpulan}</p>
          </div>
        )}
        {/* Kamus: istilah */}
        {Array.isArray(cj.istilah) && cj.istilah.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Daftar Istilah</p>
            {cj.istilah.map((ist, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-bold text-blue-700">{ist.kata}</p>
                <p className="text-gray-700 mt-0.5">{ist.definisi}</p>
                {ist.contoh && <p className="text-gray-500 italic mt-0.5">Contoh: {ist.contoh}</p>}
              </div>
            ))}
          </div>
        )}
        {/* Contoh soal */}
        {Array.isArray(cj.soal) && cj.soal.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Contoh Soal</p>
            {cj.soal.map((s, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-gray-800">{s.nomor || i+1}. {s.pertanyaan}</p>
                {s.pilihan && typeof s.pilihan === "object" && !Array.isArray(s.pilihan) && (
                  <ul className="space-y-0.5 pl-1">
                    {Object.entries(s.pilihan).map(([h, t]) => (
                      <li key={h} className={`flex gap-1.5 rounded px-1 py-0.5 ${s.jawaban === h ? "bg-emerald-50 text-emerald-800 font-semibold" : "text-gray-600"}`}>
                        <span className={`font-bold shrink-0 ${s.jawaban === h ? "text-emerald-700" : "text-gray-500"}`}>{h}.</span> {t}
                      </li>
                    ))}
                  </ul>
                )}
                {s.pembahasan && <p className="text-gray-500 italic">{s.pembahasan}</p>}
              </div>
            ))}
          </div>
        )}
        {/* Kata kunci */}
        {Array.isArray(cj.kata_kunci) && cj.kata_kunci.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {cj.kata_kunci.map((k, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium">{k}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button onClick={() => { navigator.clipboard.writeText(buildText()); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex-1 flex items-center justify-center gap-1.5 border border-blue-400 text-blue-700 font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-50 transition">
          {copied ? "✓ Tersalin!" : "Copy Konten"}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-xl hover:bg-gray-50 transition">Edit</button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-sm font-semibold py-2 rounded-xl hover:bg-red-50 transition">Hapus</button>
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
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
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

// ─── Detail Modal (Centered Popup) ───────────────────────────────────────────
function DetailDrawer({ doc, onClose, onDelete, onSaved }) {
  const type = doc.__type;
  const [mode, setMode] = useState("view"); // "view" | "edit"
  const [fullDoc, setFullDoc] = useState(doc);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch full detail dari API untuk semua tipe dokumen
  useEffect(() => {
    const path = DETAIL_URL(type, doc.id);
    if (!path || !doc.id) { setFullDoc(doc); return; }
    setLoadingDetail(true);
    fetch(`${getApiBase()}/api${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        const detail = data.data ?? data.assessment ?? data.rubric ?? data.syllabus ?? data.content ?? data.worksheet ?? data.presentation ?? data.unit_plan ?? data;
        if (detail && typeof detail === "object" && (detail.id || detail.rubric_json || detail.silabus_json || detail.content_json || detail.questions_json)) {
          setFullDoc({ ...doc, ...detail, __type: type });
        } else {
          setFullDoc(doc);
        }
      })
      .catch(() => setFullDoc(doc))
      .finally(() => setLoadingDetail(false));
  }, [doc.id, type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = (updatedDoc) => {
    setFullDoc(updatedDoc);
    onSaved(updatedDoc);
    setMode("view");
  };

  const badge = BADGE[type] || BADGE.feedback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full"
        style={{ maxWidth: "640px", maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {mode === "edit" ? "Edit Dokumen" : "Detail Dokumen"}
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{getTitle(fullDoc, type)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {mode === "edit" && (
              <button
                onClick={() => setMode("view")}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                ← Kembali
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-700 text-base"
              title="Tutup (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Memuat detail...</p>
            </div>
          ) : mode === "edit" ? (
            <EditForm doc={fullDoc} type={type} onSave={handleSave} onCancel={() => setMode("view")} />
          ) : (
            <>
              {type === "feedback"     && <FeedbackDetail     doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "worksheet"    && <WorksheetDetail    doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "presentation" && <PresentationDetail doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "unit_plan"    && <UnitPlanDetail     doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "mc"           && <MCDetail           doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "rubric"       && <RubricDetail       doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "syllabus"     && <SyllabusDetail     doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {type === "academic"     && <AcademicDetail     doc={fullDoc} onDelete={onDelete} onEdit={() => setMode("edit")} />}
              {/* Tampilkan feedback/rating jika user pernah memberi rating untuk dokumen ini */}
              {fullDoc.request_id && <FeedbackBadge requestId={fullDoc.request_id} />}
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

        <Link href="/dashboard/kepsek" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-emerald-700 transition">
          ← Kembali ke Dashboard
        </Link>

        {/* Hero */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Perpustakaan</p>
              <h2 className="text-xl font-bold text-gray-900">Dokumen Saya</h2>
              <p className="text-xs text-gray-500 mt-0.5">Semua hasil generate AI tersimpan di sini</p>
            </div>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 bg-white px-3 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-50 shrink-0">
            <span className={loading ? "animate-spin inline-block" : ""}>↺</span> Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></span>
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
                <span>{tab.icon}</span>
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
            <span className="text-5xl"></span>
            <p className="text-base font-semibold text-gray-600">Belum ada dokumen</p>
            <p className="text-sm text-gray-400 max-w-xs">
              {search ? `Tidak ada dokumen yang cocok dengan "${search}"` : activeTab !== "all" ? `Belum ada dokumen jenis ${TABS.find(t => t.key === activeTab)?.label}.` : "Mulai buat dokumen pertamamu menggunakan fitur AI."}
            </p>
            {!search && (
              <Link href="/dashboard/kepsek" className="mt-2 inline-flex items-center gap-2 bg-[#006747] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-emerald-800 transition">
                Buat Dokumen Baru
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