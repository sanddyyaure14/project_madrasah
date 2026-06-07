const express = require('express');
const router = express.Router();
const mcController = require('../../controllers/assessment/mcController');
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');
const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// Semua endpoint assessment MC dilindungi: harus login sebagai guru atau kepala_sekolah
router.post('/generate-mc', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), mcController.generateMC);
router.get('/assessment', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), mcController.getAllMC);
router.put('/assessment/edit/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), mcController.updateMC);
router.get('/assessment/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), mcController.getMCById);
router.delete('/assessment/delete/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), mcController.deleteMC);
router.get('/assessment/print/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), mcController.exportToPDF);

// ── Rating / Feedback untuk hasil generate ────────────────────────────────────
// POST /api/feedback/mc/:requestId  — kirim rating & komentar
router.post('/feedback/mc/:requestId', verifyToken, async (req, res) => {
    const { requestId } = req.params;
    const { rating, komentar, is_helpful } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5.' });
    }

    try {
        // Cek apakah sudah pernah memberi feedback untuk request ini
        const existing = await db.query(
            'SELECT id FROM user_feedback WHERE request_id = $1 AND user_id = $2',
            [requestId, req.user.id]
        );

        if (existing.rows.length > 0) {
            // Update feedback yang sudah ada
            await db.query(
                'UPDATE user_feedback SET rating = $1, komentar = $2, is_helpful = $3 WHERE request_id = $4 AND user_id = $5',
                [rating, komentar || null, is_helpful ?? null, requestId, req.user.id]
            );
            return res.json({ success: true, message: 'Feedback berhasil diperbarui.' });
        }

        // Insert feedback baru
        await db.query(
            'INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), requestId, req.user.id, rating, komentar || null, is_helpful ?? null]
        );
        return res.json({ success: true, message: 'Terima kasih atas feedback-mu!' });
    } catch (e) {
        console.error('Error simpan feedback MC:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/feedback/mc/:requestId — ambil feedback yang sudah dikirim
router.get('/feedback/mc/:requestId', verifyToken, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT rating, komentar, is_helpful FROM user_feedback WHERE request_id = $1 AND user_id = $2',
            [req.params.requestId, req.user.id]
        );
        return res.json({ success: true, data: rows[0] ?? null });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
