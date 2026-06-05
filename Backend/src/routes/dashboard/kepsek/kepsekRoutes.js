const express = require('express');
const router = express.Router();
const kepsekController = require('../../../controllers/dashboard/kepsek/kepsekController');

// 1. Endpoint Summary Dashboard (Bawaan lama yang sudah benar)
router.get('/kepsek/dashboard/summary', kepsekController.getDashboardSummary);

// =========================================================================
// 🌟 TAMBAHAN BARU: ENDPOINT ANTRIAN & APPROVE GURU (AUTH VERIFIKASI)
// =========================================================================

// 2. Endpoint Kepsek untuk melihat list pendaftar guru (is_active = false)
// URL: GET http://localhost:3000/api/kepsek/pending-teachers
router.get('/kepsek/pending-teachers', kepsekController.getRegistrationQueue);

// 3. Endpoint Kepsek untuk klik tombol ACC (Approve) atau Tolak (Reject)
// URL: POST http://localhost:3000/api/kepsek/review-teacher
router.post('/kepsek/review-teacher', kepsekController.reviewTeacherAccount);
// 4. Daftar guru aktif
router.get('/kepsek/guru', kepsekController.getDaftarGuru);

// 5. Detail satu guru
router.get('/kepsek/guru/:guruId', kepsekController.getDetailGuru);

// 6. History semua guru (opsional filter: ?feature_type=rubric)
router.get('/kepsek/history', kepsekController.getHistoryAllGuru);

// 7. History satu guru
router.get('/kepsek/history/:guruId', kepsekController.getHistoryByGuru);

// 8. Statistik per guru
router.get('/kepsek/statistik', kepsekController.getStatistikGuru);
module.exports = router;

// 9. Endpoint Kepsek untuk memberi atau update paket kuota bulanan guru
// URL: POST http://localhost:3000/api/kepsek/quota/assign
router.post('/kepsek/quota/assign', kepsekController.assignQuotaToTeacher);

// 10. Profil kepsek
router.get('/kepsek/profile', require('../../../middlewares/authMiddleware').verifyToken, async (req, res) => {
    try {
        const pool = require('../../../config/db');
        const result = await pool.query(`
            SELECT u.id, u.nama_lengkap, u.email, u.role, u.avatar_url,
                   p.nip, p.no_hp, p.jenjang, p.kurikulum, p.instansi_id,
                   i.nama AS nama_instansi
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN institutions i ON p.instansi_id = i.id
            WHERE u.id = $1
        `, [req.user.id]);
        if (!result.rows[0]) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.put('/kepsek/profile', require('../../../middlewares/authMiddleware').verifyToken, async (req, res) => {
    const pool = require('../../../config/db');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { nama_lengkap, nip, no_hp, jenjang, kurikulum } = req.body;
        if (!nama_lengkap) return res.status(400).json({ success: false, message: 'nama_lengkap wajib diisi.' });

        // Update tabel users
        await client.query(
            'UPDATE users SET nama_lengkap = $1 WHERE id = $2',
            [nama_lengkap, req.user.id]
        );

        // Upsert user_profiles
        const existing = await client.query('SELECT id FROM user_profiles WHERE user_id = $1', [req.user.id]);
        if (existing.rows.length > 0) {
            await client.query(
                'UPDATE user_profiles SET nip=$1, no_hp=$2, jenjang=$3, kurikulum=$4 WHERE user_id=$5',
                [nip || null, no_hp || null, jenjang || null, kurikulum || null, req.user.id]
            );
        } else {
            await client.query(
                'INSERT INTO user_profiles (id, user_id, nip, no_hp, jenjang, kurikulum) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)',
                [req.user.id, nip || null, no_hp || null, jenjang || null, kurikulum || null]
            );
        }
        await client.query('COMMIT');
        res.json({ success: true, message: 'Profil berhasil diperbarui.' });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: e.message });
    } finally {
        client.release();
    }
});
