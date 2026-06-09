const express = require('express');
const router = express.Router();
const kepsekController = require('../../../controllers/dashboard/kepsek/kepsekController');
const { verifyToken } = require('../../../middlewares/authMiddleware');
const db = require('../../../config/db');
const bcrypt = require('bcrypt');

// ── semua route dilindungi verifyToken ────────────────────────────────────────

// 1. Summary Dashboard
router.get('/kepsek/dashboard/summary', verifyToken, kepsekController.getDashboardSummary);

// 2. List pendaftar guru (is_active = false)
router.get('/kepsek/pending-teachers', verifyToken, kepsekController.getRegistrationQueue);

// 3. ACC atau Tolak pendaftar guru (saat approve → set kuota free)
router.post('/kepsek/review-teacher', verifyToken, kepsekController.reviewTeacherAccount);

// 4. Daftar guru aktif (termasuk semua madrasah, filter instansi ada di controller)
router.get('/kepsek/guru', verifyToken, kepsekController.getDaftarGuru);

// 5. Detail satu guru
router.get('/kepsek/guru/:guruId', verifyToken, kepsekController.getDetailGuru);

// 6. Edit guru (semua field profil + nama + email)
router.put('/kepsek/guru/:guruId', verifyToken, kepsekController.updateGuru);

// 7. Reset/ubah password guru
router.put('/kepsek/guru/:guruId/password', verifyToken, kepsekController.resetGuruPassword);

// 8. Hapus guru
router.delete('/kepsek/guru/:guruId', verifyToken, kepsekController.deleteGuru);

// 9. Ubah plan_type guru (free/basic/premium)
router.put('/kepsek/guru/:guruId/plan', verifyToken, kepsekController.updateGuruPlan);

// 10. History semua guru (opsional filter: ?feature_type=rubric)
router.get('/kepsek/history', verifyToken, kepsekController.getHistoryAllGuru);

// 11. History satu guru
router.get('/kepsek/history/:guruId', verifyToken, kepsekController.getHistoryByGuru);

// 12. Statistik per guru
router.get('/kepsek/statistik', verifyToken, kepsekController.getStatistikGuru);

// 13. Alokasi kuota bulanan guru
router.post('/kepsek/quota/assign', verifyToken, kepsekController.assignQuotaToTeacher);

// 14. Statistik generate semua user bulan ini (kepsek view)
router.get('/kepsek/stats/generate', verifyToken, kepsekController.getKepsekGenerateStats);

// 15. Semua feedback dari semua user (kepsek view)
router.get('/kepsek/stats/feedback', verifyToken, kepsekController.getKepsekFeedbackStats);

// 16. Aktivitas terbaru semua user (guru + kepsek)
router.get('/kepsek/activity/recent', verifyToken, kepsekController.getKepsekRecentActivity);

// 10. GET Profil kepsek
router.get('/kepsek/profile', verifyToken, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.nama_lengkap, u.email, u.role, u.avatar_url,
                   p.nip, p.no_hp, p.jenjang, p.kurikulum, p.instansi_id,
                   i.nama AS nama_instansi
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN institutions i ON p.instansi_id = i.id
            WHERE u.id = $1
        `, [req.user.id]);
        if (!result.rows[0]) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// 11. PUT Update profil kepsek
router.put('/kepsek/profile', verifyToken, async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const { nama_lengkap, nip, no_hp, jenjang, kurikulum } = req.body;
        if (!nama_lengkap) {
            return res.status(400).json({ success: false, message: 'nama_lengkap wajib diisi.' });
        }

        // Update nama di tabel users
        await client.query(
            'UPDATE users SET nama_lengkap = $1 WHERE id = $2',
            [nama_lengkap, req.user.id]
        );

        // Upsert user_profiles
        const existing = await client.query(
            'SELECT id FROM user_profiles WHERE user_id = $1',
            [req.user.id]
        );
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

        // Ambil data terbaru untuk response
        const updated = await db.query(`
            SELECT u.id, u.nama_lengkap, u.email, u.role,
                   p.nip, p.no_hp, p.jenjang, p.kurikulum,
                   i.nama AS nama_instansi
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN institutions i ON p.instansi_id = i.id
            WHERE u.id = $1
        `, [req.user.id]);

        res.json({ success: true, message: 'Profil berhasil diperbarui.', data: updated.rows[0] });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: e.message });
    } finally {
        client.release();
    }
});

module.exports = router;
