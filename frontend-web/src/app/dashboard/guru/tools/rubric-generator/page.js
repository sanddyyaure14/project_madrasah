"use client";

import { useState } from "react";
import Link from "next/link";

export default function RubricGeneratorPage() {
  const [formData, setFormData] = useState({
    jenis_tugas: "",
    tujuan_pembelajaran: "",
    aspek_penilaian: "",
    skala_nilai: "1-4",
  });

  const [loading, setLoading] = useState(false);
  const [rubric, setRubric] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setRubric(null);

    try {
      const token = sessionStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Token login tidak ditemukan");
      }

      const response = await fetch(
        "http://localhost:3000/api/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jenis_tugas: formData.jenis_tugas,
            tujuan_pembelajaran:
              formData.tujuan_pembelajaran,
            aspek_penilaian:
              formData.aspek_penilaian
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            skala_nilai: formData.skala_nilai,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal generate rubrik"
        );
      }

      setRubric(result.data.rubric);
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
        <span className="text-2xl p-2 bg-amber-50 rounded-xl">
          📚
        </span>

        <div>
          <h2 className="text-xl font-bold">
            Rubric Generator
          </h2>

          <p className="text-xs text-gray-500">
            Generate rubric penilaian otomatis
            sesuai kebutuhan pembelajaran.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2 items-start">
        {/* FORM */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex-1 overflow-y-auto">
            <form
              onSubmit={handleGenerate}
              className="p-5 space-y-4"
            >
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Jenis Tugas
            </label>

            <input
              type="text"
              required
              placeholder="Contoh: Presentasi"
              className="w-full text-sm p-2 border border-gray-200 rounded-lg"
              value={formData.jenis_tugas}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jenis_tugas: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Tujuan Pembelajaran
            </label>

            <textarea
              rows="4"
              required
              placeholder="Masukkan tujuan pembelajaran"
              className="w-full text-sm p-2 border border-gray-200 rounded-lg"
              value={
                formData.tujuan_pembelajaran
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tujuan_pembelajaran:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Aspek Penilaian
            </label>

            <textarea
              rows="3"
              required
              placeholder="Contoh: Isi Materi, Penyampaian, Kerja Sama"
              className="w-full text-sm p-2 border border-gray-200 rounded-lg"
              value={formData.aspek_penilaian}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  aspek_penilaian:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Skala Penilaian
            </label>

            <select
              className="w-full text-sm p-2 border border-gray-200 rounded-lg"
              value={formData.skala_nilai}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  skala_nilai: e.target.value,
                })
              }
            >
              <option value="1-4">1-4</option>
              <option value="1-10">1-10</option>
              <option value="1-100">1-100</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006747] hover:bg-emerald-800 text-white font-medium py-2 rounded-lg text-sm transition"
          >
            {loading
              ? "Generating Rubric..."
              : "📚 Generate Rubrik"}
          </button>
            </form>
          </div>
        </div>

        {/* HASIL */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {rubric ? (
            <div className="flex-1 overflow-y-auto overflow-x-auto p-6 space-y-5">
              <div className="border-b pb-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {rubric.judul}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {
                    rubric.tujuan_pembelajaran
                  }
                </p>
              </div>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#006747] text-white">
                    <th className="p-3 text-left">
                      Aspek
                    </th>
                    <th className="p-3 text-left">
                      Bobot
                    </th>

                    {rubric.aspek?.[0]?.level?.map(
                      (lvl, idx) => (
                        <th
                          key={idx}
                          className="p-3 text-left"
                        >
                          {lvl.nama}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {rubric.aspek?.map(
                    (aspek, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200"
                      >
                        <td className="p-3 font-medium">
                          {aspek.nama}
                        </td>

                        <td className="p-3">
                          {aspek.bobot}%
                        </td>

                        {aspek.level?.map(
                          (level, idx) => (
                            <td
                              key={idx}
                              className="p-3"
                            >
                              <div className="font-medium">
                                {level.skor}
                              </div>

                              <div className="text-xs text-gray-600 mt-1">
                                {
                                  level.deskripsi
                                }
                              </div>
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs border border-dashed rounded-lg m-6">
              Hasil rubric akan tampil di sini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}