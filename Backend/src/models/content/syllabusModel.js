const pool = require('../../config/db');

const SyllabusModel = {
    // 1. Simpan log request ke tabel generation_requests (bisa pakai model yg sudah ada, tapi kita buat modular)
    createRequest: async (requestId, userId, inputData) => {
        const query = `
    INSERT INTO generation_requests (id, user_id, feature_type, input_data, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';
        const values = [requestId, finalUserId, 'syllabus', JSON.stringify(inputData), 'processing'];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 2. Simpan hasil silabus ke tabel syllabi-
    saveSyllabus: async (data) => {
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

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 3. Update status di generation_requests
    updateRequestStatus: async (requestId, status, outputData = null) => {
        const query = `
      UPDATE generation_requests 
      SET status = $2, output_data = $3, completed_at = NOW() 
      WHERE id = $1;
    `;
        await pool.query(query, [requestId, status, JSON.stringify(outputData)]);
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
    }
};

module.exports = SyllabusModel;
