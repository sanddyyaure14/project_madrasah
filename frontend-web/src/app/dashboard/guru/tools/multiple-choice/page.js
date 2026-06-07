"use client";

import { useState } from "react";
import Link from "next/link";
import RatingFeedback from "@/components/RatingFeedback";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function MultipleChoicePage() {
  const [formData, setFormData] = useState({
    mata_pelajaran: "",
    topik: "",
    tingkat_kelas: "VII",
    jumlah_soal: 10,
    tingkat_kesulitan: "Sedang",
  });

  const [loading, setLoading]     = useState(false);
  const [questions, setQuestions] = useState([]);
  const [mcId, setMcId]           = useState(null);
  const [error, setError]         = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setQuestions([]);
    setMcId(null);

    try {
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Token login tidak ditemukan");
      }

      const response = await fetch(`${API_URL}/api/generate-mc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mata_pelajaran: formData.mata_pelajaran,
          topik: formData.topik,
          tingkat_kelas: formData.tingkat_kelas,
          jumlah_soal: Number(formData.jumlah_soal),
          tingkat_kesulitan: formData.tingkat_kesulitan,
          include_kunci: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal generate soal");
      }

      setQuestions(result.data.questions || []);
      setMcId(result.request_id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link
        href="/dashboard/guru"
        className="text-xs font-medium text-gray-500 hover:text-emerald-700"
      >
        ← Kembali ke Dashboard
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-2xl p-2 bg-emerald-50 rounded-xl">📝</span>
        <div>
          <h2 className="text-xl font-bold">Multiple Choice Assessment</h2>
          <p className="text-xs text-gray-500">
            Generate soal pilihan ganda otomatis untuk pembelajaran madrasah.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-start">
        {/* ===== FORM ===== */}
        <div
          className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleGenerate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: IPA"
                  className="w-full text-sm p-2 border border-gray-200 rounded-lg"
                  onChange={(e) => setFormData({ ...formData, mata_pelajaran: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tingkat Kelas
                </label>
                <select
                  className="w-full text-sm p-2 border border-gray-200 rounded-lg"
                  value={formData.tingkat_kelas}
                  onChange={(e) => setFormData({ ...formData, tingkat_kelas: e.target.value })}
                >
                  <option>VII</option>
                  <option>VIII</option>
                  <option>IX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Topik
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Masukkan topik soal"
                  className="w-full text-sm p-2 border border-gray-200 rounded-lg"
                  onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Jumlah Soal
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full text-sm p-2 border border-gray-200 rounded-lg"
                  value={formData.jumlah_soal}
                  onChange={(e) => setFormData({ ...formData, jumlah_soal: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tingkat Kesulitan
                </label>
                <select
                  className="w-full text-sm p-2 border border-gray-200 rounded-lg"
                  value={formData.tingkat_kesulitan}
                  onChange={(e) => setFormData({ ...formData, tingkat_kesulitan: e.target.value })}
                >
                  <option>Mudah</option>
                  <option>Sedang</option>
                  <option>Sulit</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#006747] hover:bg-emerald-800 text-white font-medium py-2 rounded-lg text-sm transition"
              >
                {loading ? "Generating Questions..." : "🛠️ Generate Soal"}
              </button>
            </form>
          </div>
        </div>

        {/* ===== PREVIEW ===== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {questions.length > 0 ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="border-b pb-3">
                  <h3 className="text-lg font-bold text-gray-800">Hasil Generate Soal</h3>
                  <p className="text-xs text-gray-500 mt-1">Soal otomatis berhasil dibuat.</p>
                </div>

                {questions.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-800 mb-4">
                      {index + 1}. {item.soal}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(item.pilihan || {}).map(([key, value]) => (
                        <p key={key} className="text-sm text-gray-700">
                          {key}. {value}
                        </p>
                      ))}
                    </div>
                    {item.kunci && (
                      <div className="mt-4 text-sm font-semibold text-emerald-700">
                        Jawaban: {item.kunci}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs border border-dashed rounded-lg m-6">
              Hasil generate soal akan tampil di sini.
            </div>
          )}
        </div>

        {/* Rating & Feedback — di bawah panel, muncul setelah generate */}
        {questions.length > 0 && mcId && (
          <RatingFeedback requestId={mcId} featureLabel="soal pilihan ganda" />
        )}
        </div>
      </div>
    </div>
  );
}
