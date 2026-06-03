const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../../middlewares/authMiddleware");

const {
    generateUnitPlan,
    getUnitPlans,
    getUnitPlanById,
    updateUnitPlan,
    deleteUnitPlan,
    downloadUnitPlanDocx
} = require("../../controllers/content/unitPlanController");

// Route spesifik WAJIB didefinisikan sebelum route param /:id
router.post("/generate", verifyToken, authorizeRoles('guru'), generateUnitPlan);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getUnitPlans);
router.get("/download/:id/docx", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), downloadUnitPlanDocx);
router.get("/:id", verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), getUnitPlanById);
router.put("/:id", verifyToken, authorizeRoles('guru'), updateUnitPlan);
router.delete("/:id", verifyToken, authorizeRoles('guru', 'admin'), deleteUnitPlan);

module.exports = router;
