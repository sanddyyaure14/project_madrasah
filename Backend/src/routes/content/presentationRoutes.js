const express = require('express');
const router = express.Router();

const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');

const {
    generatePresentation,
    getPresentations,
    downloadPresentationPPT,
    deletePresentation
} = require('../../controllers/content/presentationController');

// Generate Presentasi
router.post(
    '/generate',
    verifyToken,
    authorizeRoles('guru'),
    generatePresentation
);

// Ambil semua presentasi
router.get(
    '/',
    verifyToken,
    authorizeRoles('guru', 'kepsek', 'admin'),
    getPresentations
);

// Download PPT
router.get(
    '/download/:id/ppt',
    verifyToken,
    authorizeRoles('guru', 'kepsek', 'admin'),
    downloadPresentationPPT
);

// Hapus Presentasi
router.delete(
    '/:id',
    verifyToken,
    authorizeRoles('guru', 'kepsek', 'admin'),
    deletePresentation
);

module.exports = router;