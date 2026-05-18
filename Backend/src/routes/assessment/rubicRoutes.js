const express = require('express');
const router = express.Router();
const { generateRubric } = require('../../controllers/assessment/rubicController');

// POST /api/assessment/rubric/generate
router.post('/generate', generateRubric);

module.exports = router;