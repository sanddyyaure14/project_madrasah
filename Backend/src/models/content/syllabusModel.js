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
    getAllSyllabi: async () => {
        const query = `SELECT * FROM syllabi ORDER BY id DESC;`;
        const result = await pool.query(query);
        return result.rows;
    },

    // 5. Ambil data silabus berdasarkan ID (GET BY ID)
    getSyllabusById: async (id) => {
        const query = `SELECT * FROM syllabi WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // 6. Update silabus berdasarkan ID (PUT)
    updateSyllabus: async (id, data) => {
        const {
            kurikulum, semester, silabus_json,
            jenjang, mata_pelajaran, tahun_ajaran, tingkat_kelas
        } = data;

        const query = `
            UPDATE syllabi 
            SET 
                kurikulum       = COALESCE($2, kurikulum),
                semester        = COALESCE($3, semester),
                silabus_json    = COALESCE($4, silabus_json),
                jenjang         = COALESCE($5, jenjang),
                mata_pelajaran  = COALESCE($6, mata_pelajaran),
                tahun_ajaran    = COALESCE($7, tahun_ajaran),
                tingkat_kelas   = COALESCE($8, tingkat_kelas)
            WHERE id = $1
            RETURNING *;
        `;

        const values = [
            id,
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
    deleteSyllabus: async (id) => {
        const existing = await pool.query(`SELECT id FROM syllabi WHERE id = $1`, [id]);
        if (!existing.rows[0]) return null;

        await pool.query(`DELETE FROM syllabi WHERE id = $1`, [id]);
        return existing.rows[0];
    }
};

module.exports = SyllabusModel;
