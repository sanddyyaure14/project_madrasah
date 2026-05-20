const express = require('express');
const router = express.Router();
const {
    generateWorksheet,
    getAllWorksheets,
    getWorksheetById,
    updateWorksheet,
    deleteWorksheet
} = require('../../controllers/assessment/worksheetController');

// POST   - Generate worksheet baru
router.post('/generate-worksheet', generateWorksheet);

// GET    - Mengambil semua worksheet milik user
router.get('/worksheets', getAllWorksheets);

// GET    - Mengambil detail worksheet berdasarkan ID
router.get('/worksheets/:id', getWorksheetById);

// PUT    - Mengupdate worksheet berdasarkan ID
router.put('/worksheets/:id', updateWorksheet);

// DELETE - Menghapus worksheet berdasarkan ID
router.delete('/worksheets/:id', deleteWorksheet);

module.exports = router;