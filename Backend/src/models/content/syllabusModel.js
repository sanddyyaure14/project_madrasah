const pool = require('../../config/db');

const SyllabusModel = {
    // 1. Simpan log request ke tabel generation_requests (bisa pakai model yg sudah ada, tapi kita buat modular)
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
            'syllabus',
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

    saveSyllabusAndDeductQuota: async (data, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                id, request_id, kurikulum, semester, silabus_json,
                jenjang, mata_pelajaran, tahun_ajaran, tingkat_kelas
            } = data;

            const query = `
          INSERT INTO syllabi 
          (id, request_id, kurikulum, semester, silabus_json, jenjang, mata_pelajaran, tahun_ajaran, tingkat_kelas)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;

            const values = [
                id, request_id, kurikulum, semester, JSON.stringify(silabus_json),
                jenjang, mata_pelajaran, tahun_ajaran, tingkat_kelas
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

    // 4. Ambil semua data silabus (GET)
    getAllSyllabi: async (userId) => {
        const query = `
            SELECT s.* 
            FROM syllabi s
            JOIN generation_requests gr ON s.request_id = gr.id
            WHERE gr.user_id = $1
            ORDER BY s.id DESC;
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    // 5. Ambil data silabus berdasarkan ID (GET BY ID)
    getSyllabusById: async (id, userId) => {
        const query = `
            SELECT s.* 
            FROM syllabi s
            JOIN generation_requests gr ON s.request_id = gr.id
            WHERE s.id = $1 AND gr.user_id = $2;
        `;
        const result = await pool.query(query, [id, userId]);
        return result.rows[0];
    },

    // 6. Update silabus berdasarkan ID (PUT)
    updateSyllabus: async (id, userId, data) => {
        const {
            kurikulum, semester, silabus_json,
            jenjang, mata_pelajaran, tahun_ajaran, tingkat_kelas
        } = data;

        const query = `
            UPDATE syllabi s
            SET 
                kurikulum       = COALESCE($3, s.kurikulum),
                semester        = COALESCE($4, s.semester),
                silabus_json    = COALESCE($5, s.silabus_json),
                jenjang         = COALESCE($6, s.jenjang),
                mata_pelajaran  = COALESCE($7, s.mata_pelajaran),
                tahun_ajaran    = COALESCE($8, s.tahun_ajaran),
                tingkat_kelas   = COALESCE($9, s.tingkat_kelas)
            FROM generation_requests gr
            WHERE s.request_id = gr.id
              AND s.id = $1
              AND gr.user_id = $2
            RETURNING s.*;
        `;

        const values = [
            id,
            userId,
            kurikulum || null,
            semester || null,
            silabus_json ? JSON.stringify(silabus_json) : null,
            jenjang || null,
            mata_pelajaran || null,
            tahun_ajaran || null,
            tingkat_kelas || null
        ];

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    },

    // 7. Hapus silabus berdasarkan ID (DELETE)
    deleteSyllabus: async (id, userId) => {
        const existingQuery = `
            SELECT s.id, s.request_id 
            FROM syllabi s
            JOIN generation_requests gr ON s.request_id = gr.id
            WHERE s.id = $1 AND gr.user_id = $2;
        `;
        const existing = await pool.query(existingQuery, [id, userId]);
        if (!existing.rows[0]) return null;

        const requestId = existing.rows[0].request_id;
        await pool.query(`DELETE FROM syllabi WHERE id = $1`, [id]);
        await pool.query(`DELETE FROM generation_requests WHERE id = $1`, [requestId]);
        return existing.rows[0];
    }
};

module.exports = SyllabusModel;
