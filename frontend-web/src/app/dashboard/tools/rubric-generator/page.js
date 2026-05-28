"use client";

import { useState } from "react";

export default function RubricGeneratorPage() {
  const [formData, setFormData] = useState({
    taskType: "",
    learningObjective: "",
    scale: "1-4",
  });

  const [rubrics, setRubrics] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = (e) => {
    e.preventDefault();

    // Dummy Data
    const dummyRubrics = [
      {
        aspect: "Isi Materi",
        score1: "Kurang lengkap",
        score2: "Cukup lengkap",
        score3: "Lengkap",
        score4: "Sangat lengkap",
      },
      {
        aspect: "Penyampaian",
        score1: "Tidak jelas",
        score2: "Cukup jelas",
        score3: "Jelas",
        score4: "Sangat jelas dan menarik",
      },
      {
        aspect: "Kerja Sama",
        score1: "Tidak bekerja sama",
        score2: "Kurang bekerja sama",
        score3: "Bekerja sama",
        score4: "Sangat aktif bekerja sama",
      },
    ];

    setRubrics(dummyRubrics);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Rubric Generator
        </h1>

        <p className="text-gray-500 mt-2">
          Generate rubric penilaian otomatis untuk berbagai jenis tugas.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <form onSubmit={handleGenerate} className="space-y-5">

          {/* Jenis Tugas */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Jenis Tugas
            </label>

            <input
              type="text"
              name="taskType"
              value={formData.taskType}
              onChange={handleChange}
              placeholder="Contoh: Presentasi"
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tujuan Pembelajaran */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Tujuan Pembelajaran
            </label>

            <textarea
              name="learningObjective"
              value={formData.learningObjective}
              onChange={handleChange}
              placeholder="Masukkan tujuan pembelajaran"
              rows={4}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Skala Penilaian */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Skala Penilaian
            </label>

            <select
              name="scale"
              value={formData.scale}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option>1-4</option>
              <option>1-5</option>
              <option>1-10</option>
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition duration-300"
          >
            Generate Rubrik
          </button>

        </form>
      </div>

      {/* Hasil Rubric */}
      {rubrics.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-6 overflow-x-auto">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800">
            Hasil Rubrik Penilaian
          </h2>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-600 text-white">
                <th className="p-3 text-left">Aspek</th>
                <th className="p-3 text-left">1</th>
                <th className="p-3 text-left">2</th>
                <th className="p-3 text-left">3</th>
                <th className="p-3 text-left">4</th>
              </tr>
            </thead>

            <tbody>
              {rubrics.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200"
                >
                  <td className="p-3 font-medium">
                    {item.aspect}
                  </td>

                  <td className="p-3">{item.score1}</td>
                  <td className="p-3">{item.score2}</td>
                  <td className="p-3">{item.score3}</td>
                  <td className="p-3">{item.score4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}