const express = require('express');
const router = express.Router();
const mcController = require('../../controllers/assessment/mcController');
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');

// Semua endpoint assessment MC dilindungi: harus login sebagai guru atau kepala_sekolah
router.post('/generate-mc', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), mcController.generateMC);
router.get('/assessment', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), mcController.getAllMC);
router.put('/assessment/edit/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), mcController.updateMC);
router.get('/assessment/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), mcController.getMCById);
router.delete('/assessment/delete/:id', verifyToken, authorizeRoles('guru', 'kepala_sekolah'), mcController.deleteMC);
router.get('/assessment/print/:id', verifyToken, authorizeRoles('guru', 'kepsek', 'kepala_sekolah', 'admin'), mcController.exportToPDF);

module.exports = router;
