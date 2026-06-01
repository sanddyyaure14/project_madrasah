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
// 4. Daftar guru aktif
router.get('/kepsek/guru', kepsekController.getDaftarGuru);

// 5. Detail satu guru
router.get('/kepsek/guru/:guruId', kepsekController.getDetailGuru);

// 6. History semua guru (opsional filter: ?feature_type=rubric)
router.get('/kepsek/history', kepsekController.getHistoryAllGuru);

// 7. History satu guru
router.get('/kepsek/history/:guruId', kepsekController.getHistoryByGuru);

// 8. Statistik per guru
router.get('/kepsek/statistik', kepsekController.getStatistikGuru);
module.exports = router;

// 9. Endpoint Kepsek untuk memberi atau update paket kuota bulanan guru
// URL: POST http://localhost:3000/api/kepsek/quota/assign
router.post('/kepsek/quota/assign', kepsekController.assignQuotaToTeacher);
