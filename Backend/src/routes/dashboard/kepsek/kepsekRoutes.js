const express = require('express');
const router = express.Router();
const kepsekController = require('../../../controllers/dashboard/kepsek/kepsekController');

// 1. Endpoint Summary Dashboard (Bawaan lama yang sudah benar)
router.get('/kepsek/dashboard/summary', kepsekController.getDashboardSummary);

// =========================================================================
// 🌟 TAMBAHAN BARU: ENDPOINT ANTRIAN & APPROVE GURU (AUTH VERIFIKASI)
// =========================================================================

// 2. Endpoint Kepsek untuk melihat list pendaftar guru (is_active = false)
// URL: GET http://localhost:3000/api/kepsek/pending-teachers
router.get('/kepsek/pending-teachers', kepsekController.getRegistrationQueue);

// 3. Endpoint Kepsek untuk klik tombol ACC (Approve) atau Tolak (Reject)
// URL: POST http://localhost:3000/api/kepsek/review-teacher
router.post('/kepsek/review-teacher', kepsekController.reviewTeacherAccount);

module.exports = router;
