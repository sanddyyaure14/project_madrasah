const pool = require('../../config/db');

const PresentationModel = {
    // 1. Simpan log request ke tabel generation_requests-
    createRequest: async (requestId, userId, inputData, additionalData = {}) => {
        const query = `
    INSERT INTO generation_requests (id, user_id, feature_type, input_data, status, prompt_used, llm_model_used)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        const values = [
            requestId,
            finalUserId,
            'presentation',
            JSON.stringify(inputData),
            'pending',
            additionalData.prompt_used || null,
            additionalData.llm_model_used || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    getUserQuota: async (userId) => {
        const query = `
            SELECT monthly_limit, used_this_month, plan_type, reset_date 
            FROM usage_quotas 
            WHERE user_id = $1
            FOR UPDATE;
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0] || null;
    },

    savePresentationAndDeductQuota: async (data, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                id,
                request_id,
                topik,
                jumlah_slide,
                tujuan,
                audiens,
                slides_json,
                include_catatan
            } = data;

            const query = `
          INSERT INTO presentations 
          (id, request_id, topik, jumlah_slide, tujuan, audiens, slides_json, include_catatan)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;

            const values = [
                id,
                request_id,
                topik,
                jumlah_slide,
                tujuan,
                audiens,
                JSON.stringify(slides_json),
                include_catatan
            ];

            const result = await client.query(query, values);

            // Potong Kuota Guru (+1 Pemakaian)
            const quotaQuery = `
                UPDATE usage_quotas 
                SET used_this_month = used_this_month + 1 
                WHERE user_id = $1;
            `;
            await client.query(quotaQuery, [userId]);

            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    updateRequestStatus: async (requestId, status, metrics = {}) => {
        const query = `
      UPDATE generation_requests 
      SET 
          status = $2, 
          output_data = COALESCE($3, output_data),
          prompt_used = COALESCE($4, prompt_used),
          error_message = COALESCE($5, error_message),
          processing_time_ms = COALESCE($6, processing_time_ms),
          llm_model_used = COALESCE($7, llm_model_used),
          token_usage = COALESCE($8, token_usage),
          completed_at = NOW() 
      WHERE id = $1;
    `;
        const values = [
            requestId,
            status,
            metrics.output_data ? JSON.stringify(metrics.output_data) : null,
            metrics.prompt_used || null,
            metrics.error_message || null,
            metrics.processing_time_ms || null,
            metrics.llm_model_used || null,
            metrics.token_usage ? JSON.stringify(metrics.token_usage) : null
        ];
        await pool.query(query, values);
    },

    // 4. Ambil semua data presentasi (GET)
    getAllPresentations: async () => {
        const query = `SELECT * FROM presentations ORDER BY id DESC;`;
        const result = await pool.query(query);
        return result.rows;
    },

    // 5. Ambil data presentasi berdasarkan ID (GET BY ID)
    getPresentationById: async (id) => {
        const query = `SELECT * FROM presentations WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // 6. Update presentasi berdasarkan ID (PUT)
    updatePresentation: async (id, data) => {
        const {
            topik, jumlah_slide, tujuan,
            audiens, slides_json, include_catatan
        } = data;

        const query = `
            UPDATE presentations 
            SET 
                topik           = COALESCE($2, topik),
                jumlah_slide    = COALESCE($3, jumlah_slide),
                tujuan          = COALESCE($4, tujuan),
                audiens         = COALESCE($5, audiens),
                slides_json     = COALESCE($6, slides_json),
                include_catatan = COALESCE($7, include_catatan)
            WHERE id = $1
            RETURNING *;
        `;

        const values = [
            id,
            topik || null,
            jumlah_slide || null,
            tujuan || null,
            audiens || null,
            slides_json ? JSON.stringify(slides_json) : null,
            include_catatan !== undefined ? include_catatan : null
        ];

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    },

    // 7. Hapus presentasi berdasarkan ID (DELETE)
    deletePresentation: async (id) => {
        const existing = await pool.query(`SELECT id FROM presentations WHERE id = $1`, [id]);
        if (!existing.rows[0]) return null;

        await pool.query(`DELETE FROM presentations WHERE id = $1`, [id]);
        return existing.rows[0];
    }
};

module.exports = PresentationModel;
