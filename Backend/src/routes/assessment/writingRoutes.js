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

// Import Controller (Sesuaikan dengan nama file controllermu, kemarin kita pakai writingFeedbackController)
const { generateWritingFeedback } = require('../../controllers/assessment/writingController');

// Route untuk Writing Feedback (Mendukung Teks Langsung & Upload PDF)
router.post('/generate/writing-feedback', (req, res, next) => {
    upload.single('file_pdf')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Error mutlak dari Multer (ex: Unexpected field, file too large)
            console.error("=== MULTER ERROR ===", err);
            return res.status(400).json({ 
                success: false, 
                message: `Multer Error: ${err.message}`,
                data: null, // <-- Tambahan kontrak dosen
                meta: {}    // <-- Tambahan kontrak dosen
            });
        } else if (err) {
            // Error sistem lainnya 
            console.error("=== SYSTEM MULTIPART ERROR ===", err);
            return res.status(500).json({ 
                success: false, 
                message: `System Error: ${err.message}`,
                data: null, // <-- Tambahan kontrak dosen
                meta: {}    // <-- Tambahan kontrak dosen
            });
        }
        // Jika aman, lanjut ke controller utama
        next();
    });
}, generateWritingFeedback);

module.exports = router;