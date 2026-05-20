const express = require('express');
const router = express.Router();
const {
    generateRubric,
    getAllRubrics,
    getRubricById,
    updateRubric,
    deleteRubric
} = require('../../controllers/assessment/rubicController');

// POST   - Generate rubrik baru

router.post('/generate', generateRubric);

// GET    - Ambil semua rubrik milik user

router.get('/rubrics', getAllRubrics);

// GET    - Ambil detail rubrik berdasarkan ID

router.get('/rubrics/:id', getRubricById);

// PUT    - Update rubrik berdasarkan ID

router.put('/rubrics/:id', updateRubric);

// DELETE - Hapus rubrik berdasarkan ID

router.delete('/rubrics/:id', deleteRubric);

module.exports = router;