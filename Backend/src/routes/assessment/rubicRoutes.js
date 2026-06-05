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
router.post('/generate', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), generateRubric);

// GET    - Ambil semua rubrik
router.get('/rubrics', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getAllRubrics);

// GET    - Export rubrik ke Excel
router.get('/rubrics/:id/export-excel', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), exportToExcel);

// GET    - Ambil detail rubrik berdasarkan ID
router.get('/rubrics/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getRubricById);

// PUT    - Update rubrik berdasarkan ID
router.put('/rubrics/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateRubric);

// DELETE - Hapus rubrik berdasarkan ID
router.delete('/rubrics/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), deleteRubric);

module.exports = router;
