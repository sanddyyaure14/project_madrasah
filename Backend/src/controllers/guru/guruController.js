const GuruModel = require('../../models/guru/guruModel');

// =========================================================================
// A. PROFILE GURU
// =========================================================================

/**
 * GET /api/guru/profile
 * Ambil profil lengkap guru yang sedang login (dari JWT)
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Disuntikkan oleh verifyToken middleware

        const profile = await GuruModel.getProfileByUserId(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profil guru tidak ditemukan.',
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profil berhasil dimuat.',
            data: profile
        });
    } catch (error) {
        console.error('Error getProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memuat profil.',
            error: error.message
        });
    }
};

/**
 * PUT /api/guru/profile
 * Update profil guru yang sedang login
 * Field yang bisa diubah: nama_lengkap, nip, mata_pelajaran, jenjang, kurikulum, no_hp
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nama_lengkap, nip, mata_pelajaran, jenjang, kurikulum, no_hp } = req.body;

        // Minimal satu field harus diisi
        if (!nama_lengkap && !nip && !mata_pelajaran && !jenjang && !kurikulum && !no_hp) {
            return res.status(400).json({
                success: false,
                message: 'Minimal satu field harus diisi untuk update profil.',
                data: null
            });
        }

        const updatedProfile = await GuruModel.updateProfile(userId, {
            nama_lengkap,
            nip,
            mata_pelajaran,
            jenjang,
            kurikulum,
            no_hp
        });

        return res.status(200).json({
            success: true,
            message: 'Profil berhasil diperbarui.',
            data: updatedProfile
        });
    } catch (error) {
        console.error('Error updateProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui profil.',
            error: error.message
        });
    }
};

// =========================================================================
// B. DOKUMEN SAYA / HISTORY
// =========================================================================

/**
 * GET /api/guru/documents
 * Ambil semua riwayat dokumen yang pernah di-generate oleh guru ini
 * Query params opsional:
 *   - page (default: 1)
 *   - limit (default: 20)
 *   - feature_type (filter by type, contoh: 'multiple_choice')
 */
const getDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const featureType = req.query.feature_type || null;
        const offset = (page - 1) * limit;

        let documents, totalCount;

        if (featureType) {
            // Filter berdasarkan jenis fitur
            [documents, totalCount] = await Promise.all([
                GuruModel.getDocumentHistoryByType(userId, featureType, limit, offset),
                GuruModel.countDocumentHistory(userId) // total semua (bisa difilter juga jika perlu)
            ]);
        } else {
            // Semua dokumen
            [documents, totalCount] = await Promise.all([
                GuruModel.getDocumentHistory(userId, limit, offset),
                GuruModel.countDocumentHistory(userId)
            ]);
        }

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            message: 'Riwayat dokumen berhasil dimuat.',
            data: documents,
            pagination: {
                total: totalCount,
                page,
                limit,
                total_pages: totalPages,
                has_next: page < totalPages,
                has_prev: page > 1
            }
        });
    } catch (error) {
        console.error('Error getDocuments:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memuat riwayat dokumen.',
            error: error.message
        });
    }
};

/**
 * GET /api/guru/documents/:requestId
 * Ambil detail satu dokumen berdasarkan request_id
 * Hanya bisa diakses oleh pemiliknya
 */
const getDocumentDetail = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID wajib disertakan.',
                data: null
            });
        }

        const document = await GuruModel.getDocumentDetail(requestId, userId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Dokumen tidak ditemukan atau bukan milik Anda.',
                data: null
            });
        }

        // Tentukan data konten yang relevan berdasarkan feature_type
        const contentData = resolveContentData(document);

        return res.status(200).json({
            success: true,
            message: 'Detail dokumen berhasil dimuat.',
            data: {
                request_id: document.id,
                feature_type: document.feature_type,
                status: document.status,
                input_data: document.input_data,
                created_at: document.created_at,
                completed_at: document.completed_at,
                processing_time_ms: document.processing_time_ms,
                llm_model_used: document.llm_model_used,
                content: contentData
            }
        });
    } catch (error) {
        console.error('Error getDocumentDetail:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memuat detail dokumen.',
            error: error.message
        });
    }
};

/**
 * Helper: Pilih data konten yang relevan berdasarkan feature_type
 */
const resolveContentData = (doc) => {
    const map = {
        'multiple_choice': doc.mc_data,
        'writing':         doc.writing_data,
        'rubric':          doc.rubric_data,
        'worksheet':       doc.worksheet_data,
        'syllabus':        doc.syllabus_data,
        'unit_plan':       doc.unit_plan_data,
        'presentation':    doc.presentation_data,
        'academic_content': doc.academic_content_data
    };
    return map[doc.feature_type] || null;
};

module.exports = {
    getProfile,
    updateProfile,
    getDocuments,
    getDocumentDetail
};
