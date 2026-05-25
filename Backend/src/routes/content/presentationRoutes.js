const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generatePresentation,
    getPresentations,
    downloadPresentationPPT
} = require("../../controllers/content/presentationController");

router.post("/generate", verifyToken, authorizeRoles('guru'), generatePresentation);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getPresentations);
router.get("/download/:id/ppt", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadPresentationPPT);

module.exports = router;
