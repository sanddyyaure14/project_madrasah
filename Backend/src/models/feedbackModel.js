const db = require('../config/db');

const FeedbackModel = {
    /**
     * Simpan feedback baru ke tabel user_feedback
     * Satu user hanya boleh memberikan satu feedback per request_id (upsert via ON CONFLICT)
     */
    saveFeedback: async ({ userId, requestId, rating, komentar, isHelpful }) => {
        const query = `
            INSERT INTO user_feedback (id, request_id, user_id, rating, komentar, is_helpful, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
            RETURNING *;
        `;
        const { rows } = await db.query(query, [
            requestId,
            userId,
            rating,
            komentar || null,
            isHelpful !== undefined ? isHelpful : null,
        ]);
        return rows[0] || null;
    },

    /**
     * Update feedback yang sudah ada (jika user ingin mengubah rating)
     */
    updateFeedback: async ({ userId, requestId, rating, komentar, isHelpful }) => {
        const query = `
            UPDATE user_feedback
            SET rating     = $3,
                komentar   = $4,
                is_helpful = $5
            WHERE request_id = $1 AND user_id = $2
            RETURNING *;
        `;
        const { rows } = await db.query(query, [
            requestId,
            userId,
            rating,
            komentar || null,
            isHelpful !== undefined ? isHelpful : null,
        ]);
        return rows[0] || null;
    },

    /**
     * Cek apakah user sudah pernah memberikan feedback untuk request ini
     */
    getFeedbackByRequestAndUser: async (requestId, userId) => {
        const query = `
            SELECT * FROM user_feedback
            WHERE request_id = $1 AND user_id = $2
            LIMIT 1;
        `;
        const { rows } = await db.query(query, [requestId, userId]);
        return rows[0] || null;
    },

    /**
     * Pastikan request_id valid dan dimiliki oleh user yang bersangkutan
     */
    validateRequestOwnership: async (requestId, userId) => {
        const query = `
            SELECT id FROM generation_requests
            WHERE id = $1 AND user_id = $2 AND status = 'completed'
            LIMIT 1;
        `;
        const { rows } = await db.query(query, [requestId, userId]);
        return rows[0] || null;
    },
};

module.exports = FeedbackModel;
