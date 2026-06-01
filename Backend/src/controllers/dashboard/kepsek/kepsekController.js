const KepsekModel = require('../../../models/dashboard/kepsek/kepsekModel');

const getDashboardSummary = async (req, res) => {
    try {
        // 1. Ambal semua data summary (Total Guru, Rating, dan Total Global Generate) secara bersamaan (Paralel)
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

// =========================================================================
// 🌟 TAMBAHAN BARU: FITUR ANTRIAN & APPROVE GURU (AUTH VERIFIKASI)
// =========================================================================

// 1. Mengambil antrean guru yang daftar di madrasah milik kepsek tersebut
const getRegistrationQueue = async (req, res) => {
    try {
        // ID Instansi idealnya diambil dari token JWT Kepsek (misal: req.user.instansi_id)
        // Untuk testing awal di Postman, kita tangkap dulu dari query string / body / default dummy
        const instansiId = req.query.instansi_id || req.body.instansi_id || 'b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a';

        const listGuru = await KepsekModel.getPendingTeachers(instansiId);
        
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat daftar antrean pendaftaran guru.",
            count: listGuru.length,
            data: listGuru
        });
    } catch (error) {
        console.error("Error pada getRegistrationQueue:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Gagal memuat antrean verifikasi guru.",
            error: error.message 
        });
    }
};

// 2. Mengeksekusi aksi klik tombol ACC (Approve) atau Tolak (Reject)
const reviewTeacherAccount = async (req, res) => {
    try {
        const { targetUserId, action } = req.body; // action diisi teks: 'approve' atau 'reject'

        if (!targetUserId || !action) {
            return res.status(400).json({ success: false, message: "ID Guru (targetUserId) dan Aksi (approve/reject) wajib diisi." });
        }

        // Skenario Aksi = APPROVE (ACC)
        if (action === 'approve') {
            const approvedGuru = await KepsekModel.approveTeacher(targetUserId);
            if (!approvedGuru) {
                return res.status(404).json({ success: false, message: "Data guru tidak ditemukan." });
            }
            return res.status(200).json({
                success: true,
                message: `Sukses! Akun guru atas nama ${approvedGuru.nama_lengkap} telah di-ACC. Sekarang dia sudah bisa login.`,
                data: approvedGuru
            });
        }

        // Skenario Aksi = REJECT (TOLAK)
        if (action === 'reject') {
            const rejectedGuru = await KepsekModel.rejectTeacherTransaction(targetUserId);
            if (!rejectedGuru) {
                return res.status(404).json({ success: false, message: "Data guru tidak ditemukan." });
            }
            return res.status(200).json({
                success: true,
                message: `Pendaftaran ${rejectedGuru.nama_lengkap} berhasil ditolak dan dihapus dari sistem.`,
                data: rejectedGuru
            });
        }

        return res.status(400).json({ success: false, message: "Aksi tidak valid! Gunakan kata 'approve' atau 'reject'." });

    } catch (error) {
        console.error("Error pada reviewTeacherAccount:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Terjadi kesalahan server saat memproses verifikasi.", 
            error: error.message 
        });
    }
};

// 3. Daftar guru aktif
const getDaftarGuru = async (req, res) => {
    try {
        const instansiId = req.query.instansi_id || req.body.instansi_id || 'b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a';
        const guruList = await KepsekModel.getDaftarGuru(instansiId);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat daftar guru aktif.",
            data: guruList,
            meta: { total: guruList.length }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat daftar guru.", error: error.message, data: null, meta: {} });
    }
};

// 4. Detail satu guru
const getDetailGuru = async (req, res) => {
    try {
        const { guruId } = req.params;
        const instansiId = req.query.instansi_id || req.body.instansi_id || 'b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a';
        const guru = await KepsekModel.getDetailGuru(guruId, instansiId);
        if (!guru) {
            return res.status(404).json({ success: false, message: "Guru tidak ditemukan.", data: null, meta: {} });
        }
        return res.status(200).json({ success: true, message: "Berhasil memuat detail guru.", data: guru, meta: {} });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat detail guru.", error: error.message, data: null, meta: {} });
    }
};

// 5. History semua guru
const getHistoryAllGuru = async (req, res) => {
    try {
        const instansiId = req.query.instansi_id || req.body.instansi_id || 'b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a';
        const featureType = req.query.feature_type || null;
        const history = await KepsekModel.getHistoryAllGuru(instansiId, featureType);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat history generate semua guru.",
            data: history,
            meta: { total: history.length, filter_feature: featureType || 'semua' }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat history.", error: error.message, data: null, meta: {} });
    }
};

// 6. History satu guru
const getHistoryByGuru = async (req, res) => {
    try {
        const { guruId } = req.params;
        const instansiId = req.query.instansi_id || req.body.instansi_id || 'b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a';
        const history = await KepsekModel.getHistoryByGuru(guruId, instansiId);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat history guru.",
            data: history,
            meta: { total: history.length }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat history guru.", error: error.message, data: null, meta: {} });
    }
};

// 7. Statistik per guru
const getStatistikGuru = async (req, res) => {
    try {
        const instansiId = req.query.instansi_id || req.body.instansi_id || 'b3b0c2a1-1234-4bc1-bf2a-9f8e7d6c5b4a';
        const statistik = await KepsekModel.getStatistikGuru(instansiId);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat statistik guru.",
            data: statistik,
            meta: { total_guru: statistik.length }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat statistik.", error: error.message, data: null, meta: {} });
    }
};
// Pastikan semua fungsi diekspor di sini agar bisa dipanggil oleh Routes
module.exports = { 
    getDashboardSummary,
    getRegistrationQueue, // 🌟 Daftarkan fungsi baru
    reviewTeacherAccount, // 🌟 Daftarkan fungsi baru
    getDaftarGuru,
    getDetailGuru,
    getHistoryAllGuru,
    getHistoryByGuru,
    getStatistikGuru
};
