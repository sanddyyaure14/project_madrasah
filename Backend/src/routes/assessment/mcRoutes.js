const express = require('express');
const router = express.Router();
const mcController = require('../../controllers/mcController');

// Endpoint untuk generate soal
router.post('/generate-mc', mcController.generateMC);

module.exports = router;