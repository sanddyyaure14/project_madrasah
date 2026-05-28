"use client";

import { useState } from "react";

export default function MultipleChoicePage() {
  const [formData, setFormData] = useState({
    subject: "",
    grade: "VII",
    topic: "",
    totalQuestions: 10,
    difficulty: "Sedang",
  });

  const [questions, setQuestions] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = (e) => {
    e.preventDefault();

    // Dummy Data
    const dummyQuestions = [
      {
        question: "Apa fungsi paru-paru pada manusia?",
        options: [
          "Mencerna makanan",
          "Memompa darah",
          "Pertukaran oksigen dan karbon dioksida",
          "Mengatur suhu tubuh",
        ],
        answer: "C",
      },
      {
        question: "Organ pernapasan utama manusia adalah?",
        options: ["Jantung", "Paru-paru", "Hati", "Ginjal"],
        answer: "B",
      },
    ];

    setQuestions(dummyQuestions);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Multiple Choice Assessment
        </h1>
        <p className="text-gray-500 mt-2">
          Generate soal pilihan ganda otomatis untuk pembelajaran.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Mata Pelajaran */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Mata Pelajaran
            </label>

            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Contoh: IPA"
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tingkat Kelas */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Tingkat Kelas
            </label>

            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option>VII</option>
              <option>VIII</option>
              <option>IX</option>
            </select>
          </div>

          {/* Topik */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Topik
            </label>

            <textarea
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="Masukkan topik soal"
              rows={4}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Jumlah Soal */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Jumlah Soal
            </label>

            <input
              type="number"
              name="totalQuestions"
              value={formData.totalQuestions}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tingkat Kesulitan */}
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Tingkat Kesulitan
            </label>

            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option>Mudah</option>
              <option>Sedang</option>
              <option>Sulit</option>
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition duration-300"
          >
            Generate Soal
          </button>
        </form>
      </div>

      {/* Hasil Soal */}
      {questions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800">
            Hasil Generate Soal
          </h2>

          <div className="space-y-6">
            {questions.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-5"
              >
                <h3 className="font-semibold text-lg mb-4">
                  {index + 1}. {item.question}
                </h3>

                <div className="space-y-2">
                  {item.options.map((option, i) => (
                    <p key={i} className="text-gray-700">
                      {String.fromCharCode(65 + i)}. {option}
                    </p>
                  ))}
                </div>

                <p className="mt-4 text-emerald-600 font-semibold">
                  Jawaban: {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}