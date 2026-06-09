const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');
const {
    generateWorksheet,
    getAllWorksheets,
    getWorksheetById,
    updateWorksheet,
    deleteWorksheet,
    cetakPDF
} = require('../../controllers/assessment/worksheetController');

// POST   - Generate worksheet baru
router.post('/generate-worksheet', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), generateWorksheet);

// GET    - Ambil semua worksheet
router.get('/worksheets', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getAllWorksheets);

// GET    - Cetak PDF worksheet
router.get('/worksheets/:id/cetak-pdf', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), cetakPDF);

// GET    - Ambil detail worksheet berdasarkan ID
router.get('/worksheets/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getWorksheetById);

// PUT    - Update worksheet berdasarkan ID
router.put('/worksheets/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateWorksheet);

// DELETE - Hapus worksheet berdasarkan ID
router.delete('/worksheets/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), deleteWorksheet);

const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// POST /api/worksheet/feedback/worksheet/:requestId — kirim rating & komentar
router.post('/feedback/worksheet/:requestId', verifyToken, async (req, res) => {
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
        console.error('Error simpan feedback Worksheet:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/worksheet/feedback/worksheet/:requestId — ambil feedback yang sudah dikirim
router.get('/feedback/worksheet/:requestId', verifyToken, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM user_feedback WHERE request_id = $1 AND user_id = $2 LIMIT 1',
            [req.params.requestId, req.user.id]
        );
        return res.json({ success: true, data: rows[0] ?? null });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
