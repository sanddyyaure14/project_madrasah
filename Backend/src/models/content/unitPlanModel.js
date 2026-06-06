const pool = require('../../config/db');

const UnitPlanModel = {
    createRequest: async (requestId, userId, inputData) => {
        const query = `
    INSERT INTO generation_requests (id, user_id, feature_type, input_data, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';
        const values = [requestId, finalUserId, 'unit_plan', JSON.stringify(inputData), 'processing'];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    saveUnitPlan: async (data) => {
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

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    updateRequestStatus: async (requestId, status, outputData = null) => {
        const query = `
      UPDATE generation_requests 
      SET status = $2, output_data = $3, completed_at = NOW() 
      WHERE id = $1;
    `;
        await pool.query(query, [requestId, status, JSON.stringify(outputData)]);
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

    deleteUnitPlan: async (id) => {
        const query = `
        DELETE FROM unit_plans
        WHERE id = $1
        RETURNING *;
    `;

        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};
//-
module.exports = UnitPlanModel;
