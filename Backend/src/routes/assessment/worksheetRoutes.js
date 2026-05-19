const express = require('express');
const router = express.Router();
const { generateWorksheet } = require('../../controllers/assessment/worksheetController');

// POST /api/generate-worksheet  ← sesuai pola tim
router.post('/generate-worksheet', generateWorksheet);

module.exports = router;