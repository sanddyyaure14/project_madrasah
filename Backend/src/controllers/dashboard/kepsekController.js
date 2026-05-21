const KepsekModel = require('../../models/dashboard/kepsekModel');

const getDashboardSummary = async (req, res) => {
    try {
        // 1. Ambil semua data summary (Total Guru, Rating, dan Total Global Generate) secara bersamaan (Paralel)
        const [totalGuru, ratingData, globalGenerate] = await Promise.all([
            KepsekModel.countTotalGuru(),
            KepsekModel.getAverageRatingSummary(),
            KepsekModel.getTotalGlobalGenerate() // 🌟 Menggunakan fungsi counter baru dari model
        ]);

        // 2. Response JSON yang dikelompokkan dengan rapi untuk Front-end (Fokus komponen Cards)
        return res.status(200).json({
            success: true,
            message: "Haris Berhasil memuat data full Cards Summary untuk Dashboard Kepsek.",
            data: {
                card_total_guru: {
                    total: totalGuru
                },
                card_rata_rating: {
                    rating: ratingData.rata_rata,        // Nanti muncul 4.1 di UI
                    total_feedback: ratingData.jumlah_feedback // Nanti muncul "Dari 10 feedback" di UI
                },
                // 🌟 CARD BARU: Menggantikan struktur tabel lama dengan objek card ringkas
                card_total_generate: {
                    total: globalGenerate               // Muncul akumulasi berapa kali generate semua guru
                }
            }
        });
    } catch (error) {
        console.error("Error pada getDashboardSummary:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal memuat data dashboard Kepsek.",
            error: error.message,
            data: null
        });
    }
};

module.exports = { getDashboardSummary };