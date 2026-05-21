const express = require('express');
const router = express.Router();
const {
    generateWorksheet,
    getAllWorksheets,
    getWorksheetById,
    updateWorksheet,
    deleteWorksheet,
    cetakPDF
} = require('../../controllers/assessment/worksheetController');

// POST   - Generate worksheet baru
router.post('/generate-worksheet', generateWorksheet);

// GET    - Ambil semua worksheet milik user
router.get('/worksheets', getAllWorksheets);

// GET    - Cetak PDF worksheet
router.get('/worksheets/:id/cetak-pdf', cetakPDF);

// GET    - Ambil detail worksheet berdasarkan ID
router.get('/worksheets/:id', getWorksheetById);

// PUT    - Update worksheet berdasarkan ID
router.put('/worksheets/:id', updateWorksheet);

// DELETE - Hapus worksheet berdasarkan ID
router.delete('/worksheets/:id', deleteWorksheet);

module.exports = router;