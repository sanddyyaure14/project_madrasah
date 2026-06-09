const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { submitFeedback, getFeedbackForRequest } = require('../controllers/feedbackController');
const db = require('../config/db');

// POST /api/feedback
// Simpan atau update rating + komentar untuk satu hasil generate
router.post(
    '/feedback',
    verifyToken,
    authorizeRoles('guru', 'kepala_sekolah'),
    submitFeedback
);

// GET /api/feedback/:requestId
// Ambil feedback user untuk satu dokumen tertentu
router.get(
    '/feedback/:requestId',
    verifyToken,
    authorizeRoles('guru', 'kepala_sekolah'),
    getFeedbackForRequest
);

// ══════════════════════════════════════════════════════════════════════════════
// FEEDBACK ROUTES FOR UNIT PLAN & PRESENTATION
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/feedback/unit-plan/:requestId
router.post('/feedback/unit-plan/:requestId', verifyToken, async (req, res) => {
    const { requestId } = req.params;
    const { rating, komentar, is_helpful } = req.body;
    const userId = req.user.id;

    console.log('[FeedbackRoute] POST unit-plan feedback:', { requestId, userId, rating, komentar, is_helpful });

    try {
        // Validate request_id exists in generation_requests
        const validateQuery = `
            SELECT id FROM generation_requests 
            WHERE id = $1 AND user_id = $2 AND status = 'completed'
        `;
        const validateResult = await db.query(validateQuery, [requestId, userId]);
        
        if (validateResult.rows.length === 0) {
            console.log('[FeedbackRoute] Request not found or not completed');
            return res.status(404).json({ 
                success: false, 
                message: 'Dokumen tidak ditemukan atau belum selesai diproses' 
            });
        }

        // Check if feedback already exists
        const checkQuery = `SELECT id FROM user_feedback WHERE request_id = $1 AND user_id = $2`;
        const checkResult = await db.query(checkQuery, [requestId, userId]);
        
        let result;
        if (checkResult.rows.length > 0) {
            // Update existing feedback
            console.log('[FeedbackRoute] Updating existing feedback');
            const updateQuery = `
                UPDATE user_feedback 
                SET rating = $1, komentar = $2, is_helpful = $3, created_at = NOW()
                WHERE request_id = $4 AND user_id = $5
                RETURNING *;
            `;
            result = await db.query(updateQuery, [rating, komentar, is_helpful, requestId, userId]);
        } else {
            // Insert new feedback (biarkan database generate ID dengan default)
            console.log('[FeedbackRoute] Inserting new feedback');
            const insertQuery = `
                INSERT INTO user_feedback (request_id, user_id, rating, komentar, is_helpful, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING *;
            `;
            result = await db.query(insertQuery, [requestId, userId, rating, komentar, is_helpful]);
        }
        
        console.log('[FeedbackRoute] Feedback saved successfully:', result.rows[0]);
        res.json({ success: true, message: 'Terima kasih atas penilaian Anda!', data: result.rows[0] });
    } catch (err) {
        console.error('[FeedbackRoute] Error saving unit-plan feedback:', err);
        console.error('[FeedbackRoute] Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            constraint: err.constraint
        });
        res.status(500).json({ success: false, message: 'Gagal menyimpan feedback: ' + err.message });
    }
});

// GET /api/feedback/unit-plan/:requestId
router.get('/feedback/unit-plan/:requestId', verifyToken, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM user_feedback WHERE request_id = $1 LIMIT 1',
            [req.params.requestId]
        );
        if (rows[0]) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.json({ success: false, data: null });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/feedback/presentation/:requestId
router.post('/feedback/presentation/:requestId', verifyToken, async (req, res) => {
    const { requestId } = req.params;
    const { rating, komentar, is_helpful } = req.body;
    const userId = req.user.id;

    console.log('[FeedbackRoute] POST presentation feedback:', { requestId, userId, rating, komentar, is_helpful });

    try {
        // Validate request_id exists in generation_requests
        const validateQuery = `
            SELECT id FROM generation_requests 
            WHERE id = $1 AND user_id = $2 AND status = 'completed'
        `;
        const validateResult = await db.query(validateQuery, [requestId, userId]);
        
        if (validateResult.rows.length === 0) {
            console.log('[FeedbackRoute] Request not found or not completed');
            return res.status(404).json({ 
                success: false, 
                message: 'Dokumen tidak ditemukan atau belum selesai diproses' 
            });
        }

        // Check if feedback already exists
        const checkQuery = `SELECT id FROM user_feedback WHERE request_id = $1 AND user_id = $2`;
        const checkResult = await db.query(checkQuery, [requestId, userId]);
        
        let result;
        if (checkResult.rows.length > 0) {
            // Update existing feedback
            console.log('[FeedbackRoute] Updating existing feedback');
            const updateQuery = `
                UPDATE user_feedback 
                SET rating = $1, komentar = $2, is_helpful = $3, created_at = NOW()
                WHERE request_id = $4 AND user_id = $5
                RETURNING *;
            `;
            result = await db.query(updateQuery, [rating, komentar, is_helpful, requestId, userId]);
        } else {
            // Insert new feedback (biarkan database generate ID dengan default)
            console.log('[FeedbackRoute] Inserting new feedback');
            const insertQuery = `
                INSERT INTO user_feedback (request_id, user_id, rating, komentar, is_helpful, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING *;
            `;
            result = await db.query(insertQuery, [requestId, userId, rating, komentar, is_helpful]);
        }
        
        console.log('[FeedbackRoute] Feedback saved successfully:', result.rows[0]);
        res.json({ success: true, message: 'Terima kasih atas penilaian Anda!', data: result.rows[0] });
    } catch (err) {
        console.error('[FeedbackRoute] Error saving presentation feedback:', err);
        console.error('[FeedbackRoute] Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            constraint: err.constraint
        });
        res.status(500).json({ success: false, message: 'Gagal menyimpan feedback: ' + err.message });
    }
});

// GET /api/feedback/presentation/:requestId
router.get('/feedback/presentation/:requestId', verifyToken, async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM user_feedback WHERE request_id = $1 LIMIT 1',
            [req.params.requestId]
        );
        if (rows[0]) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.json({ success: false, data: null });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
