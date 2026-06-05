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

module.exports = router;
