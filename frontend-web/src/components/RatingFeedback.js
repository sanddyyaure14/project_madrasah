"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Komponen RatingFeedback
 * Ditampilkan di bawah hasil generate di setiap halaman tools guru.
 *
 * Props:
 *   - requestId   : string  — ID dari hasil generate (wajib)
 *   - featureLabel: string  — Nama fitur untuk label tampilan (opsional)
 *   - endpoint    : string  — Sub-path endpoint feedback, misal "writing", "worksheet",
 *                             "unit-plan", "presentation". Jika tidak diisi, gunakan
 *                             endpoint generik /api/feedback (dengan body request_id).
 */
export default function RatingFeedback({ requestId, featureLabel = "hasil generate", endpoint = "" }) {
    const [rating, setRating]       = useState(0);
    const [hovered, setHovered]     = useState(0);
    const [komentar, setKomentar]   = useState("");
    const [isHelpful, setIsHelpful] = useState(null); // true | false | null
    const [loading, setLoading]     = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError]         = useState("");
    const [existing, setExisting]   = useState(null); // feedback yang sudah ada

    // Saat requestId berubah (hasil generate baru), ambil feedback lama jika ada
    useEffect(() => {
        if (!requestId) return;
        setSubmitted(false);
        setError("");
        setRating(0);
        setKomentar("");
        setIsHelpful(null);
        setExisting(null);

        const token = sessionStorage.getItem("accessToken");
        if (!token) return;

        // Gunakan endpoint spesifik jika ada, fallback ke endpoint generik
        const getUrl = endpoint
            ? `${API_URL}/api/feedback/${endpoint}/${requestId}`
            : `${API_URL}/api/feedback/${requestId}`;

        fetch(getUrl, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success && json.data) {
                    const fb = json.data;
                    setExisting(fb);
                    setRating(fb.rating || 0);
                    setKomentar(fb.komentar || "");
                    setIsHelpful(fb.is_helpful);
                    setSubmitted(true);
                }
            })
            .catch(() => {}); // silent fail — tidak perlu error jika gagal cek
    }, [requestId, endpoint]);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Pilih rating bintang dulu sebelum kirim.");
            return;
        }
        setError("");
        setLoading(true);

        try {
            const token = sessionStorage.getItem("accessToken");
            if (!token) throw new Error("Sesi tidak ditemukan. Silakan login ulang.");

            let res;
            if (endpoint) {
                // Endpoint spesifik per fitur: POST /api/feedback/{endpoint}/{requestId}
                res = await fetch(`${API_URL}/api/feedback/${endpoint}/${requestId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        rating,
                        komentar:   komentar.trim() || null,
                        is_helpful: isHelpful,
                    }),
                });
            } else {
                // Endpoint generik: POST /api/feedback
                res = await fetch(`${API_URL}/api/feedback`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        request_id: requestId,
                        rating,
                        komentar:   komentar.trim() || null,
                        is_helpful: isHelpful,
                    }),
                });
            }

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Gagal menyimpan feedback.");

            setSubmitted(true);
            setExisting(json.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setSubmitted(false);
    };

    if (!requestId) return null;

    const stars = [1, 2, 3, 4, 5];
    const activeRating = hovered || rating;

    const STAR_LABELS = {
        1: "Sangat Kurang",
        2: "Kurang",
        3: "Cukup",
        4: "Bagus",
        5: "Sangat Bagus",
    };

    // ── Tampilan setelah submit ──────────────────────────────────────────
    if (submitted && existing) {
        return (
            <div className="border-t border-gray-100 px-5 py-4 bg-emerald-50/60">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                            {stars.map((s) => (
                                <span key={s} className={`text-lg ${s <= existing.rating ? "text-amber-400" : "text-gray-200"}`}>
                                    ★
                                </span>
                            ))}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-700">
                                {STAR_LABELS[existing.rating]} — Feedback tersimpan ✓
                            </p>
                            {existing.komentar && (
                                <p className="text-[11px] text-gray-500 mt-0.5 italic">"{existing.komentar}"</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleEdit}
                        className="text-[11px] text-gray-400 hover:text-emerald-600 underline transition shrink-0 ml-2"
                    >
                        Ubah
                    </button>
                </div>
            </div>
        );
    }

    // ── Form rating ──────────────────────────────────────────────────────
    return (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/80">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                ✦ Bagaimana {featureLabel} ini?
            </p>

            {/* Bintang */}
            <div className="flex items-center gap-1 mb-3">
                {stars.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                            s <= activeRating ? "text-amber-400" : "text-gray-200 hover:text-amber-200"
                        }`}
                        aria-label={`Rating ${s} bintang`}
                    >
                        ★
                    </button>
                ))}
                {activeRating > 0 && (
                    <span className="text-xs font-medium text-amber-600 ml-2">
                        {STAR_LABELS[activeRating]}
                    </span>
                )}
            </div>

            {/* Apakah membantu? */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">Apakah output ini membantu?</span>
                <button
                    type="button"
                    onClick={() => setIsHelpful(true)}
                    className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                        isHelpful === true
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
                    }`}
                >
                    👍 Ya
                </button>
                <button
                    type="button"
                    onClick={() => setIsHelpful(false)}
                    className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                        isHelpful === false
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                    }`}
                >
                    👎 Belum
                </button>
            </div>

            {/* Komentar */}
            <textarea
                rows={2}
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                placeholder="Komentar atau saran perbaikan (opsional)..."
                maxLength={500}
                className="w-full text-xs p-2.5 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 resize-none bg-white mb-3"
            />

            {error && (
                <p className="text-[11px] text-red-500 font-medium mb-2">⚠ {error}</p>
            )}

            <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || rating === 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#006747] hover:bg-emerald-800 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Menyimpan...
                    </>
                ) : (
                    <>✓ Kirim Feedback</>
                )}
            </button>
        </div>
    );
}
