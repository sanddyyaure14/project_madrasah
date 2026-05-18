const pool = require('../../config/db');

// 1. Catat request masuk ke generation_requests

const createRequest = async (requestId, userId, inputData) => {
    const query = `
        INSERT INTO generation_requests 
            (id, user_id, feature_type, input_data, status, created_at)
        VALUES 
            ($1, $2, 'rubric', $3, 'processing', NOW())
        RETURNING *
    `;
    const values = [requestId, userId, JSON.stringify(inputData)];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 2. Simpan hasil rubrik ke assessment_rubric

const saveAssessment = async (data) => {
    const query = `
        INSERT INTO assessment_rubric 
            (id, request_id, jenis_tugas, aspek_penilaian, skala_nilai, rubric_json, tujuan_pembelajaran)
        VALUES 
            ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const values = [
        data.id,
        data.request_id,
        data.jenis_tugas,
        data.aspek_penilaian,       // array of string
        data.skala_nilai,
        JSON.stringify(data.rubric_json),
        data.tujuan_pembelajaran || null
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

module.exports = { createRequest, saveAssessment, updateRequestStatus };