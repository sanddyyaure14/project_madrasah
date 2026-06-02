const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint untuk memuat pilihan sekolah di dropdown pendaftaran
router.get('/auth/institutions', authController.getDropdownInstitutions);

// Endpoint registrasi pendaftaran guru baru
router.post('/auth/register', authController.register);

// Endpoint login multi-role (Guru, Admin, Kepsek)
router.post('/auth/login', authController.login);

module.exports = router;
