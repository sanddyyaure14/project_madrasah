const express = require("express");
const router = express.Router();

const {
    generateAcademicContent,
    getAcademicContents,
    downloadAcademicContentPDF
} = require("../../controllers/content/academicContentController");

router.post("/generate", generateAcademicContent);
router.get("/", getAcademicContents);
router.get("/download/:id/pdf", downloadAcademicContentPDF);

module.exports = router;
