const express = require("express");
const router = express.Router();

const {
    generatePresentation,
} = require("../../controllers/content/presentationController");

router.post("/generate", generatePresentation);

module.exports = router;