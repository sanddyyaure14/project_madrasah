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
            if (userId) {
                const quotaQuery = `
                    UPDATE usage_quotas 
                    SET used_this_month = used_this_month + 1 
                    WHERE user_id = $1;
                `;
                await client.query(quotaQuery, [userId]);
            }

            // Ambil created_at dari generation_requests
            const timestampQuery = `
                SELECT created_at, completed_at 
                FROM generation_requests 
                WHERE id = $1;
            `;
            const timestampResult = await client.query(timestampQuery, [request_id]);

            await client.query('COMMIT');
            
            // Merge unit plan dengan timestamps
            const unitPlan = result.rows[0];
            
            // Parse unit_plan_json jika berupa string
            if (typeof unitPlan.unit_plan_json === 'string') {
                unitPlan.unit_plan_json = JSON.parse(unitPlan.unit_plan_json);
            }
            
            if (timestampResult.rows[0]) {
                unitPlan.created_at = timestampResult.rows[0].created_at;
                unitPlan.completed_at = timestampResult.rows[0].completed_at;
            }
            
            return unitPlan;
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

    getAllUnitPlans: async (userId) => {
        const query = `
            SELECT 
                up.id,
                up.request_id,
                up.judul_unit,
                up.mata_pelajaran,
                up.tingkat_kelas,
                up.tujuan_pembelajaran,
                up.jumlah_pertemuan,
                up.durasi_per_jp,
                up.unit_plan_json,
                gr.created_at,
                gr.completed_at
            FROM unit_plans up
            JOIN generation_requests gr ON up.request_id = gr.id
            WHERE gr.user_id = $1
            ORDER BY gr.created_at DESC;
        `;
        const result = await pool.query(query, [userId]);
        
        // Parse unit_plan_json jika berupa string
        return result.rows.map(row => ({
            ...row,
            unit_plan_json: typeof row.unit_plan_json === 'string' 
                ? JSON.parse(row.unit_plan_json) 
                : row.unit_plan_json
        }));
    },

    // Ambil data unit plan berdasarkan ID (GET BY ID)
    getUnitPlanById: async (id, userId) => {
        const query = `
            SELECT 
                up.id,
                up.request_id,
                up.judul_unit,
                up.mata_pelajaran,
                up.tingkat_kelas,
                up.tujuan_pembelajaran,
                up.jumlah_pertemuan,
                up.durasi_per_jp,
                up.unit_plan_json,
                gr.created_at,
                gr.completed_at
            FROM unit_plans up
            JOIN generation_requests gr ON up.request_id = gr.id
            WHERE up.id = $1 AND gr.user_id = $2;
        `;
        const result = await pool.query(query, [id, userId]);
        
        if (!result.rows[0]) return null;
        
        const row = result.rows[0];
        // Parse unit_plan_json jika berupa string
        return {
            ...row,
            unit_plan_json: typeof row.unit_plan_json === 'string' 
                ? JSON.parse(row.unit_plan_json) 
                : row.unit_plan_json
        };
    },

    // Update unit plan berdasarkan ID (PUT)
    updateUnitPlan: async (id, userId, data) => {
        const {
            judul_unit, mata_pelajaran, tingkat_kelas,
            tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp, unit_plan_json
        } = data;

        console.log('[Model.updateUnitPlan] Updating with data:', {
            id,
            userId,
            has_unit_plan_json: !!unit_plan_json,
            unit_plan_json_type: typeof unit_plan_json,
        });

        const query = `
            UPDATE unit_plans up
            SET 
                judul_unit = COALESCE($3, up.judul_unit),
                mata_pelajaran = COALESCE($4, up.mata_pelajaran),
                tingkat_kelas = COALESCE($5, up.tingkat_kelas),
                tujuan_pembelajaran = COALESCE($6, up.tujuan_pembelajaran),
                jumlah_pertemuan = COALESCE($7, up.jumlah_pertemuan),
                durasi_per_jp = COALESCE($8, up.durasi_per_jp),
                unit_plan_json = COALESCE($9::jsonb, up.unit_plan_json)
            FROM generation_requests gr
            WHERE up.request_id = gr.id
              AND up.id = $1
              AND gr.user_id = $2
            RETURNING 
                up.id,
                up.request_id,
                up.judul_unit,
                up.mata_pelajaran,
                up.tingkat_kelas,
                up.tujuan_pembelajaran,
                up.jumlah_pertemuan,
                up.durasi_per_jp,
                up.unit_plan_json,
                gr.created_at,
                gr.completed_at;
        `;

        const values = [
            id,
            userId,
            judul_unit || null,
            mata_pelajaran || null,
            tingkat_kelas || null,
            tujuan_pembelajaran || null,
            jumlah_pertemuan || null,
            durasi_per_jp || null,
            unit_plan_json ? JSON.stringify(unit_plan_json) : null
        ];

        const result = await pool.query(query, values);
        
        if (!result.rows[0]) {
            console.log('[Model.updateUnitPlan] No rows returned!');
            return null;
        }
        
        const row = result.rows[0];
        console.log('[Model.updateUnitPlan] Update successful, returning data');
        
        // Parse unit_plan_json jika berupa string
        return {
            ...row,
            unit_plan_json: typeof row.unit_plan_json === 'string' 
                ? JSON.parse(row.unit_plan_json) 
                : row.unit_plan_json
        };
    },

    // Hapus unit plan berdasarkan ID (DELETE)
    deleteUnitPlan: async (id, userId) => {
        const existingQuery = `
            SELECT up.id, up.request_id 
            FROM unit_plans up
            JOIN generation_requests gr ON up.request_id = gr.id
            WHERE up.id = $1 AND gr.user_id = $2;
        `;
        const existing = await pool.query(existingQuery, [id, userId]);
        if (!existing.rows[0]) return null;

        const requestId = existing.rows[0].request_id;
        await pool.query(`DELETE FROM unit_plans WHERE id = $1`, [id]);
        await pool.query(`DELETE FROM generation_requests WHERE id = $1`, [requestId]);
        return existing.rows[0];
    }
};
//-
module.exports = UnitPlanModel;
