const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generateAcademicContent,
    getAcademicContents,
    getAcademicContentById,
    updateAcademicContent,
    deleteAcademicContent,
    downloadAcademicContentPDF
} = require("../../controllers/content/academicContentController");

// Route spesifik WAJIB didefinisikan sebelum route param /:id
router.post("/generate", verifyToken, authorizeRoles('guru'), generateAcademicContent);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getAcademicContents);
router.get("/download/:id/pdf", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadAcademicContentPDF);
router.get("/:id", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getAcademicContentById);
router.put("/:id", verifyToken, authorizeRoles('guru'), updateAcademicContent);
router.delete("/:id", verifyToken, authorizeRoles('guru', 'admin'), deleteAcademicContent);

module.exports = router;
