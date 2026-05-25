const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generateUnitPlan,
    getUnitPlans,
    downloadUnitPlanDocx
} = require("../../controllers/content/unitPlanController");

router.post("/generate", verifyToken, authorizeRoles('guru'), generateUnitPlan);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getUnitPlans);
router.get("/download/:id/docx", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadUnitPlanDocx);

module.exports = router;
