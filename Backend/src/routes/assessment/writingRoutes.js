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
router.get('/feedback', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getAllFeedback);

// Rute Share Text WA 
router.get('/feedback/share/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), getFeedbackShareText);

// 3. READ BY ID (Alur 2 - Langkah 4: Tampilkan Output / Ambil data dari library)
router.get('/feedback/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getFeedbackById);

// 4. UPDATE (Alur 2 - Langkah 4: Edit jika perlu & Simpan kembali ke library)
router.put('/feedback/edit/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateFeedback);

// 5. DELETE
router.delete('/feedback/delete/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), deleteFeedback);

module.exports = router;
