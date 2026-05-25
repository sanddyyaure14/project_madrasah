const express = require('express');
const router = express.Router();
const mcController = require('../../controllers/assessment/mcController');
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');

// Semua endpoint assessment MC dilindungi: harus login sebagai guru
router.post('/generate-mc', verifyToken, authorizeRoles('guru'), mcController.generateMC);
router.get('/assessment', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), mcController.getAllMC);
router.put('/assessment/edit/:id', verifyToken, authorizeRoles('guru'), mcController.updateMC);
router.get('/assessment/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), mcController.getMCById);
router.delete('/assessment/delete/:id', verifyToken, authorizeRoles('guru'), mcController.deleteMC);
router.get('/assessment/print/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'admin'), mcController.exportToPDF);

module.exports = router;