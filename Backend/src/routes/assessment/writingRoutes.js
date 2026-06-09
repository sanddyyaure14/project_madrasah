const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');

// =========================================================================
// 🌟 ARSITEKTUR ALUR 2: Konfigurasi Multer & Validasi Input Ketat
// =========================================================================
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Batasi maksimal file 5MB
        parts: 10 
    },
    fileFilter: (req, file, cb) => {
        // Alur 2 Langkah 1: Validasi format dokumen input
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Format file tidak didukung. Hanya menerima dokumen PDF (.pdf)!'));
        }
    }
});

// Import Controller Lengkap
const { 
    generateWritingFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
    getFeedbackShareText 
} = require('../../controllers/assessment/writingController');

// =========================================================================
// 🔥 ENDPOINT UTAMA (CREATE / GENERATE)
// =========================================================================

// 1. GENERATE CONTEN AI (Sesuai Alur 2: Langkah 1 s.d 4)
router.post('/generate/writing-feedback', 
    verifyToken,
    authorizeRoles('guru', 'kepala_sekolah'),
    // Middleware A: Penanganan Multipart Form-Data (Upload)
    (req, res, next) => {
        upload.single('file_pdf')(req, res, function (err) {
            if (err instanceof multer.MulterError) {
                console.error("=== MULTER ERROR ===", err);
                const customMessage = err.code === 'LIMIT_UNEXPECTED_FILE' ? err.field : `Multer Error: ${err.message}`;
                return res.status(400).json({ success: false, message: customMessage, data: null, meta: {} });
            } else if (err) {
                console.error("=== SYSTEM MULTIPART ERROR ===", err);
                return res.status(500).json({ success: false, message: `System Error: ${err.message}`, data: null, meta: {} });
            }
            next();
        });
    },
    
    // Middleware B: Validasi Input (Alur 2 - Langkah 1: Validasi Input)
    (req, res, next) => {
        // Memastikan ada payload teks atau payload file yang dikirim oleh guru
        if (!req.body.tulisan_siswa && !req.file) {
            return res.status(400).json({
                success: false,
                message: "Validasi Gagal: Mohon masukkan teks tulisan siswa atau unggah file dokumen PDF tugas siswa.",
                data: null,
                meta: {}
            });
        }
        next();
    }, 
    
    // Controller Utama (Alur 2 - Langkah 2 & 3: Cek Kuota, Insert PENDING -> PROCESSING -> COMPLETED)
    generateWritingFeedback
);

// =========================================================================
// 🌟 ENDPOINT MANAGEMENT HISTORY (READ, UPDATE, DELETE)
// =========================================================================

// 2. READ ALL (Diletakkan paling atas agar tidak bentrok dengan parameter :id)
router.get('/writing-feedback', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getAllFeedback);

// Rute Share Text WA 
router.get('/writing-feedback/share/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), getFeedbackShareText);

// 3. READ BY ID
router.get('/writing-feedback/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getFeedbackById);

// 4. UPDATE
router.put('/writing-feedback/edit/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateFeedback);

// 5. DELETE
router.delete('/writing-feedback/delete/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), deleteFeedback);

// ── Rating / Feedback untuk hasil generate writing ───────────────────────────
const db = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// POST /api/feedback/writing/:requestId — kirim rating & komentar
router.post('/feedback/writing/:requestId', verifyToken, async (req, res) => {
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

        await db.query(
            'INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), requestId, req.user.id, rating, komentar || null, is_helpful ?? null]
        );
        return res.json({ success: true, message: 'Terima kasih atas feedback-mu!', data: { request_id: requestId, rating, komentar: komentar || null, is_helpful: is_helpful ?? null } });
    } catch (e) {
        console.error('Error simpan feedback Writing:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/feedback/writing/:requestId — ambil feedback yang sudah dikirim
router.get('/feedback/writing/:requestId', verifyToken, async (req, res) => {
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

// ── Rating / Feedback untuk hasil generate WORKSHEET ─────────────────────────
// Dipasang di sini (/api) agar URL konsisten: /api/feedback/worksheet/:requestId
// Sama dengan pattern MC (/api/feedback/mc/:id) dan Rubric (/api/feedback/rubric/:id)

// POST /api/feedback/worksheet/:requestId — kirim rating & komentar
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
            // Update existing feedback
            console.log('[FeedbackRoute] Updating existing feedback');
            const updateResult = await db.query(
                'UPDATE user_feedback SET rating = $1, komentar = $2, is_helpful = $3 WHERE request_id = $4 AND user_id = $5 RETURNING *',
                [rating, komentar || null, is_helpful ?? null, requestId, req.user.id]
            );
            return res.json({ success: true, message: 'Feedback berhasil diperbarui.', data: updateResult.rows[0] });
        }

        await db.query(
            'INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful) VALUES ($1, $2, $3, $4, $5, $6)',
            [uuidv4(), requestId, req.user.id, rating, komentar || null, is_helpful ?? null]
        );
        return res.json({ success: true, message: 'Terima kasih atas feedback-mu!', data: { request_id: requestId, rating, komentar: komentar || null, is_helpful: is_helpful ?? null } });
    } catch (e) {
        console.error('Error simpan feedback Worksheet:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

// GET /api/feedback/worksheet/:requestId — ambil feedback yang sudah dikirim
router.get('/feedback/worksheet/:requestId', verifyToken, async (req, res) => {
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
