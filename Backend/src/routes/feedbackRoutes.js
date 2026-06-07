const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { submitFeedback, getFeedbackForRequest } = require('../controllers/feedbackController');

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

module.exports = router;
