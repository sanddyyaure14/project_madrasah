const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generateSyllabus,
    getSyllabi,
    getSyllabusById,
    updateSyllabus,
    deleteSyllabus,
    downloadSyllabusPDF,
    downloadSyllabusDocx
} = require("../../controllers/content/syllabusController");

// Route spesifik WAJIB didefinisikan sebelum route param /:id
router.post("/generate", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), generateSyllabus);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getSyllabi);
router.get("/download/:id/pdf", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), downloadSyllabusPDF);
router.get("/download/:id/docx", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), downloadSyllabusDocx);
router.get("/:id", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getSyllabusById);
router.put("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateSyllabus);
router.delete("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah', 'admin'), deleteSyllabus);

module.exports = router;
