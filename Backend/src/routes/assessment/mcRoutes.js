const express = require('express');
const router = express.Router();
const mcController = require('../../controllers/assessment/mcController');

// TODO: Aktifkan baris di bawah ini jika fitur login/auth sudah selesai dibuat
// const { verifyToken } = require('../../middlewares/authMiddleware'); 

// Endpoint untuk Assessment (Saat ini verifyToken dinonaktifkan dulu agar bisa dites tanpa login)
router.post('/generate-mc', mcController.generateMC);
router.get('/assessment', mcController.getAllMC);
router.put('/assessment/edit/:id', mcController.updateMC);
router.get('/assessment/:id', mcController.getMCById);
router.delete('/assessment/delete/:id', mcController.deleteMC);
router.get('/assessment/print/:id', mcController.exportToPDF);

/* Besok kalau fitur login sudah jadi, tinggal ganti rute di atas dengan versi di bawah ini:
  
  router.post('/generate-mc', verifyToken, mcController.generateMC);
  router.put('/assessment/edit/:id', verifyToken, mcController.updateMC);
  router.get('/assessment/:id', verifyToken, mcController.getMCById);
  router.delete('/assessment/delete/:id', verifyToken, mcController.deleteMC);
*/

module.exports = router;