const express = require("express");
const router = express.Router();

const {
    generateSyllabus,
    getSyllabi,
    downloadSyllabusPDF,
    downloadSyllabusDocx
} = require("../../controllers/content/syllabusController");

router.post("/generate", generateSyllabus);
router.get("/", getSyllabi);
router.get("/download/:id/pdf", downloadSyllabusPDF);
router.get("/download/:id/docx", downloadSyllabusDocx);

module.exports = router;
