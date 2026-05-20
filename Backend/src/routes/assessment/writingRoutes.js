const express = require('express');
const router = express.Router();
const multer = require('multer');

// Konfigurasi multer menggunakan RAM storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Batasi maksimal file 5MB
        parts: 10 // Beri kuota total field teks + file maksimal 10 part
    }
});

// Import Controller Lengkap (Sekarang mencakup fungsi CRUD baru)
const { 
    generateWritingFeedback,
    getAllFeedback,
    getFeedbackById,
    updateFeedback,
    deleteFeedback,
    getFeedbackShareText 
} = require('../../controllers/assessment/writingController');

// 1. CREATE / GENERATE (Mendukung Teks Langsung & Upload PDF)
router.post('/generate/writing-feedback', (req, res, next) => {
    upload.single('file_pdf')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error("=== MULTER ERROR ===", err);
            return res.status(400).json({ 
                success: false, 
                message: `Multer Error: ${err.message}`,
                data: null, 
                meta: {} 
            });
        } else if (err) {
            console.error("=== SYSTEM MULTIPART ERROR ===", err);
            return res.status(500).json({ 
                success: false, 
                message: `System Error: ${err.message}`,
                data: null, 
                meta: {} 
            });
        }
        next();
    });
}, generateWritingFeedback);

// =========================================================================
// 🔥 AMAN & BERURUTAN: Tambahan Endpoint CRUD untuk Writing Feedback
// =========================================================================

// 2. READ ALL (Ditaruh di atas rute bermotif parameter :id agar tidak bentrok)
router.get('/feedback', getAllFeedback);

router.get('/feedback/share/:id', getFeedbackShareText);

// 3. READ BY ID
router.get('/feedback/:id', getFeedbackById);

// 4. UPDATE (Aksi Simpan setelah Guru mengedit skor/komentar)
router.put('/feedback/edit/:id', updateFeedback);

// 5. DELETE
router.delete('/feedback/delete/:id', deleteFeedback);



module.exports = router;