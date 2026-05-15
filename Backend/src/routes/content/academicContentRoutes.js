const express = require("express");
const router = express.Router();

const {
    generateAcademicContent,
    getAcademicContents
} = require("../../controllers/content/academicContentController");

router.post("/generate", generateAcademicContent);
router.get("/", getAcademicContents);

module.exports = router;
