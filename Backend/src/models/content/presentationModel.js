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
    getAllPresentations: async (userId) => {
        const query = `
            SELECT p.* 
            FROM presentations p
            JOIN generation_requests gr ON p.request_id = gr.id
            WHERE gr.user_id = $1
            ORDER BY p.id DESC;
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    // 5. Ambil data presentasi berdasarkan ID (GET BY ID)
    getPresentationById: async (id, userId) => {
        const query = `
            SELECT p.* 
            FROM presentations p
            JOIN generation_requests gr ON p.request_id = gr.id
            WHERE p.id = $1 AND gr.user_id = $2;
        `;
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    },

    // 6. Update presentasi berdasarkan ID (PUT)
    updatePresentation: async (id, userId, data) => {
        const {
            topik, jumlah_slide, tujuan,
            audiens, slides_json, include_catatan
        } = data;

        const query = `
            UPDATE presentations p
            SET 
                topik           = COALESCE($3, p.topik),
                jumlah_slide    = COALESCE($4, p.jumlah_slide),
                tujuan          = COALESCE($5, p.tujuan),
                audiens         = COALESCE($6, p.audiens),
                slides_json     = COALESCE($7, p.slides_json),
                include_catatan = COALESCE($8, p.include_catatan)
            FROM generation_requests gr
            WHERE p.request_id = gr.id
              AND p.id = $1
              AND gr.user_id = $2
            RETURNING p.*;
        `;

        const values = [
            id,
            userId,
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
    deletePresentation: async (id, userId) => {
        const existingQuery = `
            SELECT p.id, p.request_id 
            FROM presentations p
            JOIN generation_requests gr ON p.request_id = gr.id
            WHERE p.id = $1 AND gr.user_id = $2;
        `;
        const existing = await pool.query(existingQuery, [id, userId]);
        if (!existing.rows[0]) return null;

        const requestId = existing.rows[0].request_id;
        await pool.query(`DELETE FROM presentations WHERE id = $1`, [id]);
        await pool.query(`DELETE FROM generation_requests WHERE id = $1`, [requestId]);
        return existing.rows[0];
    }
};

module.exports = PresentationModel;
