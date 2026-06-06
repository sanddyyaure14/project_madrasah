const express = require('express');
const router = express.Router();

const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');

const {
    generateUnitPlan,
    getUnitPlans,
    downloadUnitPlanDocx,
    deleteUnitPlan
} = require('../../controllers/content/unitPlanController');

// Generate RPP / Unit Plan
router.post(
    '/generate',
    verifyToken,
    authorizeRoles('guru'),
    generateUnitPlan
);

// Ambil semua RPP
router.get(
    '/',
    verifyToken,
    authorizeRoles('guru', 'kepsek', 'admin'),
    getUnitPlans
);

// Download DOCX
router.get(
    '/download/:id/docx',
    verifyToken,
    authorizeRoles('guru', 'kepsek', 'admin'),
    downloadUnitPlanDocx
);

// Hapus RPP
router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('guru', 'kepsek', 'admin'),
    deleteUnitPlan
);

module.exports = router;