const express = require('express');
const router = express.Router();
const kepsekController = require('../../controllers/dashboard/kepsekController');

router.get('/kepsek/dashboard/summary', kepsekController.getDashboardSummary);

module.exports = router;