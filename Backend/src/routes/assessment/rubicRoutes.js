const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');
const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');
const {
    generateRubric,
    getAllRubrics,
    getRubricById,
    updateRubric,
    deleteRubric,
    exportToExcel
} = require('../../controllers/assessment/rubicController');

// POST   - Generate rubrik baru
router.post('/generate', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), generateRubric);

// Fix urutan route: export-excel HARUS sebelum :id agar tidak di-match sebagai ID
router.get('/rubrics/:id/export-excel', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), exportToExcel);

// GET    - Ambil semua rubrik
router.get('/rubrics', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getAllRubrics);

// GET    - Ambil detail rubrik berdasarkan ID
router.get('/rubrics/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getRubricById);

// PUT    - Update rubrik berdasarkan ID
router.put('/rubrics/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateRubric);

// DELETE - Hapus rubrik berdasarkan ID
router.delete('/rubrics/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), deleteRubric);

// ── Rating / Feedback untuk hasil generate ────────────────────────────────────
// POST /api/feedback/rubric/:requestId — kirim rating & komentar
router.post('/feedback/rubric/:requestId', verifyToken, async (req, res) => {
    const { requestId } = req.params;
    const { rating, komentar, is_helpful } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5.' });
    }

    try {
        const existing = await db.query(
            'SELECT id FROM user_feedback WHERE request_id = $1 AND user_id = $2',
            [requestId, req.user.id]
        );

        if (existing.rows.length > 0) {
            const updated = await db.query(
                'UPDATE user_feedback SET rating = $1, komentar = $2, is_helpful = $3 WHERE request_id = $4 AND user_id = $5 RETURNING *',
                [rating, komentar || null, is_helpful ?? null, requestId, req.user.id]
            );
            return res.json({ success: true, message: 'Feedback berhasil diperbarui.', data: updated.rows[0] });
        }

        const inserted = await db.query(
            'INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [uuidv4(), requestId, req.user.id, rating, komentar || null, is_helpful ?? null]
        );
        return res.json({ success: true, message: 'Terima kasih atas feedback-mu!', data: inserted.rows[0] });
    } catch (e) {
        console.error('Error simpan feedback Rubric:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/feedback/rubric/:requestId — ambil feedback yang sudah dikirim
router.get('/feedback/rubric/:requestId', verifyToken, async (req, res) => {
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
