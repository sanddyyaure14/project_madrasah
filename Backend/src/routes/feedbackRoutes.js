const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { submitFeedback, getFeedbackForRequest } = require('../controllers/feedbackController');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper — upsert feedback dan return data
async function upsertFeedback(requestId, userId, rating, komentar, is_helpful) {
    const existing = await db.query(
        'SELECT id FROM user_feedback WHERE request_id = $1 AND user_id = $2',
        [requestId, userId]
    );
    if (existing.rows.length > 0) {
        const { rows } = await db.query(
            'UPDATE user_feedback SET rating=$1, komentar=$2, is_helpful=$3 WHERE request_id=$4 AND user_id=$5 RETURNING *',
            [rating, komentar || null, is_helpful ?? null, requestId, userId]
        );
        return rows[0];
    }
    const { rows } = await db.query(
        'INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [uuidv4(), requestId, userId, rating, komentar || null, is_helpful ?? null]
    );
    return rows[0];
}

// Helper — ambil feedback
async function getFeedback(requestId, userId) {
    const { rows } = await db.query(
        'SELECT * FROM user_feedback WHERE request_id = $1 AND user_id = $2 LIMIT 1',
        [requestId, userId]
    );
    return rows[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT GENERIK (fallback, pakai validasi ownership)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/feedback', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), submitFeedback);
router.get('/feedback/:requestId', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), getFeedbackForRequest);

// ─────────────────────────────────────────────────────────────────────────────
// UNIT PLAN
// ─────────────────────────────────────────────────────────────────────────────
router.post('/feedback/unit-plan/:requestId', verifyToken, async (req, res) => {
    const { rating, komentar, is_helpful } = req.body;
    if (!rating || rating < 1 || rating > 5)
        return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5.' });
    try {
        const data = await upsertFeedback(req.params.requestId, req.user.id, rating, komentar, is_helpful);
        res.json({ success: true, message: 'Terima kasih atas penilaian Anda!', data });
    } catch (err) {
        console.error('[FeedbackRoute] unit-plan:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/feedback/unit-plan/:requestId', verifyToken, async (req, res) => {
    try {
        const data = await getFeedback(req.params.requestId, req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PRESENTATION
// ─────────────────────────────────────────────────────────────────────────────
router.post('/feedback/presentation/:requestId', verifyToken, async (req, res) => {
    const { rating, komentar, is_helpful } = req.body;
    if (!rating || rating < 1 || rating > 5)
        return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5.' });
    try {
        const data = await upsertFeedback(req.params.requestId, req.user.id, rating, komentar, is_helpful);
        res.json({ success: true, message: 'Terima kasih atas penilaian Anda!', data });
    } catch (err) {
        console.error('[FeedbackRoute] presentation:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/feedback/presentation/:requestId', verifyToken, async (req, res) => {
    try {
        const data = await getFeedback(req.params.requestId, req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// SYLLABUS
// ─────────────────────────────────────────────────────────────────────────────
router.post('/feedback/syllabus/:requestId', verifyToken, async (req, res) => {
    const { rating, komentar, is_helpful } = req.body;
    if (!rating || rating < 1 || rating > 5)
        return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5.' });
    try {
        const data = await upsertFeedback(req.params.requestId, req.user.id, rating, komentar, is_helpful);
        res.json({ success: true, message: 'Terima kasih atas penilaian Anda!', data });
    } catch (err) {
        console.error('[FeedbackRoute] syllabus:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/feedback/syllabus/:requestId', verifyToken, async (req, res) => {
    try {
        const data = await getFeedback(req.params.requestId, req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC CONTENT
// ─────────────────────────────────────────────────────────────────────────────
router.post('/feedback/academic/:requestId', verifyToken, async (req, res) => {
    const { rating, komentar, is_helpful } = req.body;
    if (!rating || rating < 1 || rating > 5)
        return res.status(400).json({ success: false, message: 'Rating harus antara 1 sampai 5.' });
    try {
        const data = await upsertFeedback(req.params.requestId, req.user.id, rating, komentar, is_helpful);
        res.json({ success: true, message: 'Terima kasih atas penilaian Anda!', data });
    } catch (err) {
        console.error('[FeedbackRoute] academic:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/feedback/academic/:requestId', verifyToken, async (req, res) => {
    try {
        const data = await getFeedback(req.params.requestId, req.user.id);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
