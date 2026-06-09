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
router.post("/generate", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), generateUnitPlan);
router.get("/", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getUnitPlans);
router.get("/download/:id/docx", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), downloadUnitPlanDocx);
router.get("/:id", verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), getUnitPlanById);
router.put("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah'), updateUnitPlan);
router.delete("/:id", verifyToken, authorizeRoles('guru', 'kepala_sekolah', 'admin'), deleteUnitPlan);

module.exports = router;


module.exports = router;
