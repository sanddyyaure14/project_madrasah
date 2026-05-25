const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generateSyllabus,
    getSyllabi,
    downloadSyllabusPDF,
    downloadSyllabusDocx
} = require("../../controllers/content/syllabusController");

router.post("/generate", verifyToken, authorizeRoles('guru'), generateSyllabus);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getSyllabi);
router.get("/download/:id/pdf", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadSyllabusPDF);
router.get("/download/:id/docx", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadSyllabusDocx);

module.exports = router;
