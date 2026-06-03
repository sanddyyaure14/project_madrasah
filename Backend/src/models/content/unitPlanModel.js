const pool = require('../../config/db');

const UnitPlanModel = {
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
            'unit_plan',
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

    saveUnitPlanAndDeductQuota: async (data, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                id, request_id, judul_unit, mata_pelajaran, tingkat_kelas,
                tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp, unit_plan_json
            } = data;

            const query = `
          INSERT INTO unit_plans 
          (id, request_id, judul_unit, mata_pelajaran, tingkat_kelas, tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp, unit_plan_json)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;

            const values = [
                id, request_id, judul_unit, mata_pelajaran, tingkat_kelas,
                tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp, JSON.stringify(unit_plan_json)
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

    getAllUnitPlans: async () => {
        const query = `SELECT * FROM unit_plans ORDER BY id DESC;`;
        const result = await pool.query(query);
        return result.rows;
    },

    // Ambil data unit plan berdasarkan ID (GET BY ID)
    getUnitPlanById: async (id) => {
        const query = `SELECT * FROM unit_plans WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    // Update unit plan berdasarkan ID (PUT)
    updateUnitPlan: async (id, data) => {
        const {
            judul_unit, mata_pelajaran, tingkat_kelas,
            tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp, unit_plan_json
        } = data;

        const query = `
            UPDATE unit_plans 
            SET 
                judul_unit = COALESCE($2, judul_unit),
                mata_pelajaran = COALESCE($3, mata_pelajaran),
                tingkat_kelas = COALESCE($4, tingkat_kelas),
                tujuan_pembelajaran = COALESCE($5, tujuan_pembelajaran),
                jumlah_pertemuan = COALESCE($6, jumlah_pertemuan),
                durasi_per_jp = COALESCE($7, durasi_per_jp),
                unit_plan_json = COALESCE($8, unit_plan_json)
            WHERE id = $1
            RETURNING *;
        `;

        const values = [
            id,
            judul_unit || null,
            mata_pelajaran || null,
            tingkat_kelas || null,
            tujuan_pembelajaran || null,
            jumlah_pertemuan || null,
            durasi_per_jp || null,
            unit_plan_json ? JSON.stringify(unit_plan_json) : null
        ];

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    },

    // Hapus unit plan berdasarkan ID (DELETE)
    deleteUnitPlan: async (id) => {
        const existing = await pool.query(`SELECT id FROM unit_plans WHERE id = $1`, [id]);
        if (!existing.rows[0]) return null;

        await pool.query(`DELETE FROM unit_plans WHERE id = $1`, [id]);
        return existing.rows[0];
    }
};
//-
module.exports = UnitPlanModel;
