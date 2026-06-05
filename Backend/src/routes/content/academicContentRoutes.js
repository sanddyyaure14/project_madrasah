const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generateAcademicContent,
    getAcademicContents,
    getAcademicContentById,
    updateAcademicContent,
    deleteAcademicContent,
    downloadAcademicContentPDF,
    downloadAcademicContentDocx
} = require("../../controllers/content/academicContentController");

// Route spesifik WAJIB didefinisikan sebelum route param /:id
router.post("/generate", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), generateAcademicContent);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getAcademicContents);
router.get("/download/:id/pdf", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), downloadAcademicContentPDF);
router.get("/download/:id/docx", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), downloadAcademicContentDocx);
router.get("/:id", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getAcademicContentById);
router.put("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateAcademicContent);
router.delete("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah', 'admin'), deleteAcademicContent);

module.exports = router;
