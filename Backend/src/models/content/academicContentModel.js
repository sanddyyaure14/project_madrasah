const pool = require('../../config/db');

const AcademicContentModel = {
    // 1. Simpan log request ke tabel generation_requests
    createRequest: async (requestId, userId, inputData) => {
        const query = `
    INSERT INTO generation_requests (id, user_id, feature_type, input_data, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        const values = [
            requestId,
            finalUserId,
            'academic_content',
            JSON.stringify(inputData),
            'processing'
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 2. Simpan hasil konten akademik ke tabel academic_contents
    saveAcademicContent: async (data) => {
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

    // 4. Ambil semua data konten akademik (GET)
    getAllAcademicContents: async () => {
        const query = `SELECT * FROM academic_contents ORDER BY id DESC;`;
        const result = await pool.query(query);
        return result.rows;
    }
};

module.exports = AcademicContentModel;
