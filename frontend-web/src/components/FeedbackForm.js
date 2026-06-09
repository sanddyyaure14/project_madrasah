"use client";

import { useState } from "react";

export default function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isHelpful, setIsHelpful] = useState(null); // 'ya' | 'belum' | null
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic to send feedback to backend would go here
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pb-2">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 text-center">
          <p className="text-emerald-700 font-bold mb-1">Terima kasih atas feedback Anda! 🎉</p>
          <p className="text-emerald-600 text-xs">Masukan Anda sangat membantu kami untuk terus berkembang.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-2">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
        <span className="text-gray-400">✦</span> Bagaimana silabus/konten ini?
      </h4>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Rating Bintang */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl transition-transform hover:scale-110 focus:outline-none"
            >
              <span
                className={
                  star <= (hoverRating || rating)
                    ? "text-yellow-400 drop-shadow-sm"
                    : "text-gray-200"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>

        {/* Apakah Membantu? */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">Apakah output ini membantu?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsHelpful("ya")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition flex items-center gap-1.5
                ${
                  isHelpful === "ya"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300"
                }`}
            >
              👍 Ya
            </button>
            <button
              type="button"
              onClick={() => setIsHelpful("belum")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition flex items-center gap-1.5
                ${
                  isHelpful === "belum"
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-amber-300"
                }`}
            >
              👎 Belum
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Komentar atau saran perbaikan (opsional)..."
          className="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-emerald-400 bg-white resize-none h-20"
        />

        {/* Kirim Button */}
        <button
          type="submit"
          disabled={!rating && !isHelpful && !comment}
          className="bg-[#75A48F] hover:bg-[#628f7a] text-white font-semibold py-2 px-5 rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-1.5"
        >
          ✓ Kirim Feedback
        </button>
      </form>
    </div>
  );
}
