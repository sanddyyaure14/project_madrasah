const pool = require('../../config/db');


// 1. Catat request masuk ke generation_requests

const createRequest = async (requestId, userId, inputData) => {
    const query = `
        INSERT INTO generation_requests 
            (id, user_id, feature_type, input_data, status, created_at)
        VALUES 
            ($1, $2, 'worksheet', $3, 'processing', NOW())
        RETURNING *
    `;
    const values = [requestId, userId, JSON.stringify(inputData)];
    const result = await pool.query(query, values);
    return result.rows[0];
};


// 2. Simpan hasil worksheet ke tabel worksheets

const saveWorksheet = async (data) => {
    const query = `
        INSERT INTO worksheets 
            (id, request_id, judul, mata_pelajaran, topik, tipe_aktivitas, durasi_menit, worksheet_json)
        VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const values = [
        data.id,
        data.request_id,
        data.judul,
        data.mata_pelajaran,
        data.topik,
        data.tipe_aktivitas,       // array of string
        data.durasi_menit || null,
        JSON.stringify(data.worksheet_json)
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};


// 3. Update status request (completed / failed)

const updateRequestStatus = async (requestId, status, outputData) => {
    const query = `
        UPDATE generation_requests
        SET 
            status = $1,
            output_data = $2,
            completed_at = NOW()
        WHERE id = $3
        RETURNING *
    `;
    const values = [status, JSON.stringify(outputData), requestId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

module.exports = { createRequest, saveWorksheet, updateRequestStatus };