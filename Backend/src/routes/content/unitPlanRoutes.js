const express = require("express");
const router = express.Router();

const {
    generateUnitPlan,
    getUnitPlans
} = require("../../controllers/content/unitPlanController");

router.post("/generate", generateUnitPlan);
router.get("/", getUnitPlans);

module.exports = router;
