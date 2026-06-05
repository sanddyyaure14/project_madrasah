const pool = require('../../config/db');

const AcademicContentModel = {
    // 1. Simpan log request ke tabel generation_requests
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
            'academic_content',
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

    saveAcademicContentAndDeductQuota: async (data, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                id,
                request_id,
                jenis_konten,
                topik,
                mata_pelajaran,
                tingkat_kelas,
                panjang_konten,
                content_json
            } = data;

            const query = `
          INSERT INTO academic_contents 
          (id, request_id, jenis_konten, topik, mata_pelajaran, tingkat_kelas, panjang_konten, content_json)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;

            const values = [
                id,
                request_id,
                jenis_konten,
                topik,
                mata_pelajaran || null,
                tingkat_kelas || null,
                panjang_konten || null,
                JSON.stringify(content_json)
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

    // 4. Ambil semua data konten akademik (GET)
    getAllAcademicContents: async (userId) => {
        const query = `
            SELECT ac.* 
            FROM academic_contents ac
            JOIN generation_requests gr ON ac.request_id = gr.id
            WHERE gr.user_id = $1
            ORDER BY ac.id DESC;
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    // 5. Ambil data konten akademik berdasarkan ID (GET BY ID)
    getAcademicContentById: async (id, userId) => {
        const query = `
            SELECT ac.* 
            FROM academic_contents ac
            JOIN generation_requests gr ON ac.request_id = gr.id
            WHERE ac.id = $1 AND gr.user_id = $2;
        `;
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    },

    // 6. Update konten akademik berdasarkan ID (PUT)
    updateAcademicContent: async (id, userId, data) => {
        const {
            jenis_konten, topik, mata_pelajaran,
            tingkat_kelas, panjang_konten, content_json
        } = data;

        const query = `
            UPDATE academic_contents ac
            SET 
                jenis_konten    = COALESCE($3, ac.jenis_konten),
                topik           = COALESCE($4, ac.topik),
                mata_pelajaran  = COALESCE($5, ac.mata_pelajaran),
                tingkat_kelas   = COALESCE($6, ac.tingkat_kelas),
                panjang_konten  = COALESCE($7, ac.panjang_konten),
                content_json    = COALESCE($8, ac.content_json)
            FROM generation_requests gr
            WHERE ac.request_id = gr.id
              AND ac.id = $1
              AND gr.user_id = $2
            RETURNING ac.*;
        `;

        const values = [
            id,
            userId,
            jenis_konten || null,
            topik || null,
            mata_pelajaran || null,
            tingkat_kelas || null,
            panjang_konten || null,
            content_json ? JSON.stringify(content_json) : null
        ];

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    },

    // 7. Hapus konten akademik berdasarkan ID (DELETE)
    deleteAcademicContent: async (id, userId) => {
        const existingQuery = `
            SELECT ac.id, ac.request_id 
            FROM academic_contents ac
            JOIN generation_requests gr ON ac.request_id = gr.id
            WHERE ac.id = $1 AND gr.user_id = $2;
        `;
        const existing = await pool.query(existingQuery, [id, userId]);
        if (!existing.rows[0]) return null;

        const requestId = existing.rows[0].request_id;
        await pool.query(`DELETE FROM academic_contents WHERE id = $1`, [id]);
        await pool.query(`DELETE FROM generation_requests WHERE id = $1`, [requestId]);
        return existing.rows[0];
    }
};

module.exports = AcademicContentModel;
