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
    getAllAcademicContents: async () => {
        const query = `SELECT * FROM academic_contents ORDER BY id DESC;`;
        const result = await pool.query(query);
        return result.rows;
    },

    // 5. Ambil data konten akademik berdasarkan ID (GET BY ID)
    getAcademicContentById: async (id) => {
        const query = `SELECT * FROM academic_contents WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // 6. Update konten akademik berdasarkan ID (PUT)
    updateAcademicContent: async (id, data) => {
        const {
            jenis_konten, topik, mata_pelajaran,
            tingkat_kelas, panjang_konten, content_json
        } = data;

        const query = `
            UPDATE academic_contents 
            SET 
                jenis_konten    = COALESCE($2, jenis_konten),
                topik           = COALESCE($3, topik),
                mata_pelajaran  = COALESCE($4, mata_pelajaran),
                tingkat_kelas   = COALESCE($5, tingkat_kelas),
                panjang_konten  = COALESCE($6, panjang_konten),
                content_json    = COALESCE($7, content_json)
            WHERE id = $1
            RETURNING *;
        `;

        const values = [
            id,
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
    deleteAcademicContent: async (id) => {
        const existing = await pool.query(`SELECT id FROM academic_contents WHERE id = $1`, [id]);
        if (!existing.rows[0]) return null;

        await pool.query(`DELETE FROM academic_contents WHERE id = $1`, [id]);
        return existing.rows[0];
    }
};

module.exports = AcademicContentModel;
