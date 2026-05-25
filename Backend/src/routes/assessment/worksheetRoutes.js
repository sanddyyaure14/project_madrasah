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
router.post('/generate-worksheet', verifyToken, authorizeRoles('guru'), generateWorksheet);

// GET    - Ambil semua worksheet
router.get('/worksheets', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getAllWorksheets);

// GET    - Cetak PDF worksheet
router.get('/worksheets/:id/cetak-pdf', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), cetakPDF);

// GET    - Ambil detail worksheet berdasarkan ID
router.get('/worksheets/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getWorksheetById);

// PUT    - Update worksheet berdasarkan ID
router.put('/worksheets/:id', verifyToken, authorizeRoles('guru'), updateWorksheet);

// DELETE - Hapus worksheet berdasarkan ID
router.delete('/worksheets/:id', verifyToken, authorizeRoles('guru'), deleteWorksheet);

module.exports = router;