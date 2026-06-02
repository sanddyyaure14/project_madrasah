const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');
const {
    generateRubric,
    getAllRubrics,
    getRubricById,
    updateRubric,
    deleteRubric,
    exportToExcel
} = require('../../controllers/assessment/rubicController');

// POST   - Generate rubrik baru
router.post('/generate', verifyToken, authorizeRoles('guru'), generateRubric);

// GET    - Ambil semua rubrik
router.get('/rubrics', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getAllRubrics);

// GET    - Export rubrik ke Excel
router.get('/rubrics/:id/export-excel', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), exportToExcel);

// GET    - Ambil detail rubrik berdasarkan ID
router.get('/rubrics/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getRubricById);

// PUT    - Update rubrik berdasarkan ID
router.put('/rubrics/:id', verifyToken, authorizeRoles('guru'), updateRubric);

// DELETE - Hapus rubrik berdasarkan ID
router.delete('/rubrics/:id', verifyToken, authorizeRoles('guru'), deleteRubric);

module.exports = router;
