const express = require("express");
const router = express.Router();

const {
    generateSyllabus,
    getSyllabi
} = require("../../controllers/content/syllabusController");

router.post("/generate", generateSyllabus);
router.get("/", getSyllabi);

module.exports = router;
