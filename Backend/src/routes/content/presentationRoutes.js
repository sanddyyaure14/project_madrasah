const express = require("express");
const router = express.Router();

const {
    generatePresentation,
    getPresentations,
    downloadPresentationPPT
} = require("../../controllers/content/presentationController");

router.post("/generate", generatePresentation);
router.get("/", getPresentations);
router.get("/download/:id/ppt", downloadPresentationPPT);

module.exports = router;