const express = require("express");
const router = express.Router();

const {
    generateUnitPlan,
    getUnitPlans,
    downloadUnitPlanDocx
} = require("../../controllers/content/unitPlanController");

router.post("/generate", generateUnitPlan);
router.get("/", getUnitPlans);
router.get("/download/:id/docx", downloadUnitPlanDocx);

module.exports = router;
