const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generateAcademicContent,
    getAcademicContents,
    downloadAcademicContentPDF
} = require("../../controllers/content/academicContentController");

router.post("/generate", verifyToken, authorizeRoles('guru'), generateAcademicContent);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getAcademicContents);
router.get("/download/:id/pdf", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadAcademicContentPDF);

module.exports = router;
