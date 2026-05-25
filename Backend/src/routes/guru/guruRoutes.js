const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../../middlewares/authMiddleware');
const guruController = require('../../controllers/guru/guruController');

// Semua endpoint guru hanya bisa diakses oleh guru yang sudah login & aktif
// verifyToken  → cek JWT valid
// authorizeRoles('guru') → pastikan role = 'guru'

// ── PROFILE ────────────────────────────────────────────────────────────────
// GET  /api/guru/profile → Lihat profil lengkap
router.get(
    '/guru/profile',
    verifyToken,
    authorizeRoles('guru'),
    guruController.getProfile
);

// PUT  /api/guru/profile → Update profil (nama, nip, mapel, jenjang, kurikulum, no_hp)
router.put(
    '/guru/profile',
    verifyToken,
    authorizeRoles('guru'),
    guruController.updateProfile
);

// ── DOKUMEN SAYA / HISTORY ─────────────────────────────────────────────────
// GET /api/guru/documents              → Semua riwayat dokumen (dengan pagination)
// GET /api/guru/documents?feature_type=multiple_choice → Filter per jenis
// GET /api/guru/documents?page=2&limit=10 → Pagination
router.get(
    '/guru/documents',
    verifyToken,
    authorizeRoles('guru'),
    guruController.getDocuments
);

// GET /api/guru/documents/:requestId   → Detail satu dokumen
router.get(
    '/guru/documents/:requestId',
    verifyToken,
    authorizeRoles('guru'),
    guruController.getDocumentDetail
);

module.exports = router;
