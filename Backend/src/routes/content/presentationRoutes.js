const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generatePresentation,
    getPresentations,
    getPresentationById,
    updatePresentation,
    deletePresentation,
    downloadPresentationPPT
} = require("../../controllers/content/presentationController");

// Route spesifik WAJIB didefinisikan sebelum route param /:id
router.post("/generate", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), generatePresentation);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getPresentations);
router.get("/download/:id/ppt", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), downloadPresentationPPT);
router.get("/:id", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getPresentationById);
router.put("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updatePresentation);
router.delete("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah', 'admin'), deletePresentation);

module.exports = router;
