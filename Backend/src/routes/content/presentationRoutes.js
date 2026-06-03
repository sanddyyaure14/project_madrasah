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
router.post("/generate", verifyToken, authorizeRoles('guru'), generatePresentation);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getPresentations);
router.get("/download/:id/ppt", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadPresentationPPT);
router.get("/:id", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getPresentationById);
router.put("/:id", verifyToken, authorizeRoles('guru'), updatePresentation);
router.delete("/:id", verifyToken, authorizeRoles('guru', 'admin'), deletePresentation);

module.exports = router;
