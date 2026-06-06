const pool = require('../../config/db');

const PresentationModel = {
    // 1. Simpan log request ke tabel generation_requests-
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
            'presentation',
            JSON.stringify(inputData),
            'processing'
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 2. Simpan hasil presentasi ke tabel presentations
    savePresentation: async (data) => {
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

    // 4. Ambil semua data presentasi (GET)
    getAllPresentations: async () => {
        const query = `SELECT * FROM presentations ORDER BY id DESC;`;
        const result = await pool.query(query);
        return result.rows;
    },

    // 5. Ambil data presentasi berdasarkan ID (GET BY ID)
    getPresentationById: async (id) => {
        const query = `SELECT * FROM presentations WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },

    deletePresentation: async (id) => {
        const query = `
        DELETE FROM presentations
        WHERE id = $1
        RETURNING *;
    `;

        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
};

module.exports = PresentationModel;
