const FeedbackModel = require('../models/feedbackModel');

/**
 * POST /api/feedback
 * Simpan atau update rating + komentar dari guru untuk hasil generate
 * Body: { request_id, rating (1-5), komentar (opsional), is_helpful (bool, opsional) }
 */
const submitFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const { request_id, rating, komentar, is_helpful } = req.body;

        // Validasi input
        if (!request_id) {
            return res.status(400).json({
                success: false,
                message: 'request_id wajib diisi.',
            });
        }

        if (!rating || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating wajib diisi dan bernilai antara 1 sampai 5.',
            });
        }

        // Pastikan request_id milik user ini dan sudah completed
        const requestOwner = await FeedbackModel.validateRequestOwnership(request_id, userId);
        if (!requestOwner) {
            return res.status(404).json({
                success: false,
                message: 'Dokumen tidak ditemukan atau belum selesai diproses.',
            });
        }

        // Cek apakah sudah pernah ada feedback untuk request ini
        const existing = await FeedbackModel.getFeedbackByRequestAndUser(request_id, userId);

        let feedback;
        if (existing) {
            // Update feedback yang sudah ada
            feedback = await FeedbackModel.updateFeedback({
                userId,
                requestId:  request_id,
                rating:     Number(rating),
                komentar:   komentar || null,
                isHelpful:  is_helpful !== undefined ? Boolean(is_helpful) : null,
            });

            return res.status(200).json({
                success: true,
                message: 'Feedback berhasil diperbarui. Terima kasih atas penilaianmu!',
                data: feedback,
            });
        } else {
            // Buat feedback baru
            feedback = await FeedbackModel.saveFeedback({
                userId,
                requestId:  request_id,
                rating:     Number(rating),
                komentar:   komentar || null,
                isHelpful:  is_helpful !== undefined ? Boolean(is_helpful) : null,
            });

            return res.status(201).json({
                success: true,
                message: 'Feedback berhasil disimpan. Terima kasih!',
                data: feedback,
            });
        }
    } catch (error) {
        console.error('Error submitFeedback:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan feedback.',
            error: error.message,
        });
    }
};

/**
 * GET /api/feedback/:requestId
 * Ambil feedback milik user untuk satu dokumen (untuk cek apakah sudah pernah memberi rating)
 */
const getFeedbackForRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;

        if (!requestId) {
            return res.status(400).json({ success: false, message: 'requestId wajib disertakan.' });
        }

        const feedback = await FeedbackModel.getFeedbackByRequestAndUser(requestId, userId);

        return res.status(200).json({
            success: true,
            data: feedback || null,
        });
    } catch (error) {
        console.error('Error getFeedbackForRequest:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memuat feedback.',
            error: error.message,
        });
    }
};

module.exports = { submitFeedback, getFeedbackForRequest };
