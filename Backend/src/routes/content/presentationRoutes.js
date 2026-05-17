const express = require("express");
const router = express.Router();

const {
    generatePresentation,
    getPresentations
} = require("../../controllers/content/presentationController");

router.post("/generate", generatePresentation);
router.get("/", getPresentations);
//-
module.exports = router;