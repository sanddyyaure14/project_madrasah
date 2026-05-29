const pool = require('../../config/db');

// 1. Catat request masuk ke generation_requests
const createRequest = async (requestId, userId, inputData) => {
    const query = `
        INSERT INTO generation_requests 
            (id, user_id, feature_type, input_data, status, created_at)
        VALUES 
            ($1, $2, 'worksheet', $3, 'pending', NOW())
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
        data.tipe_aktivitas,
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

// 4. GET ALL - Ambil semua worksheet milik user
const getAllWorksheets = async (userId) => {
    const query = `
        SELECT 
            w.id,
            w.request_id,
            w.judul,
            w.mata_pelajaran,
            w.topik,
            w.tipe_aktivitas,
            w.durasi_menit,
            w.worksheet_json,
            gr.status,
            gr.created_at,
            gr.completed_at
        FROM worksheets w
        JOIN generation_requests gr ON w.request_id = gr.id
        WHERE gr.user_id = $1
        ORDER BY gr.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

// 5. GET BY ID - Ambil detail worksheet berdasarkan ID
const getWorksheetById = async (worksheetId, userId) => {
    const query = `
        SELECT 
            w.id,
            w.request_id,
            w.judul,
            w.mata_pelajaran,
            w.topik,
            w.tipe_aktivitas,
            w.durasi_menit,
            w.worksheet_json,
            gr.status,
            gr.input_data,
            gr.created_at,
            gr.completed_at
        FROM worksheets w
        JOIN generation_requests gr ON w.request_id = gr.id
        WHERE w.id = $1 AND gr.user_id = $2
    `;
    const result = await pool.query(query, [worksheetId, userId]);
    return result.rows[0];
};

// 6. UPDATE - Update worksheet berdasarkan ID
const updateWorksheet = async (worksheetId, userId, data) => {
    const query = `
        UPDATE worksheets w
        SET 
            judul = $1,
            mata_pelajaran = $2,
            topik = $3,
            tipe_aktivitas = $4,
            durasi_menit = $5,
            worksheet_json = $6
        FROM generation_requests gr
        WHERE w.request_id = gr.id
            AND w.id = $7
            AND gr.user_id = $8
        RETURNING w.*
    `;
    const values = [
        data.judul,
        data.mata_pelajaran,
        data.topik,
        data.tipe_aktivitas,
        data.durasi_menit || null,
        JSON.stringify(data.worksheet_json),
        worksheetId,
        userId
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 7. DELETE - Hapus worksheet berdasarkan ID
const deleteWorksheet = async (worksheetId, userId) => {
    const getQuery = `
        SELECT w.id, w.request_id 
        FROM worksheets w
        JOIN generation_requests gr ON w.request_id = gr.id
        WHERE w.id = $1 AND gr.user_id = $2
    `;
    const worksheet = await pool.query(getQuery, [worksheetId, userId]);
    if (!worksheet.rows[0]) return null;

    const requestId = worksheet.rows[0].request_id;
    await pool.query('DELETE FROM worksheets WHERE id = $1', [worksheetId]);
    await pool.query('DELETE FROM generation_requests WHERE id = $1', [requestId]);

    return worksheet.rows[0];
};

module.exports = {
    createRequest,
    saveWorksheet,
    updateRequestStatus,
    getAllWorksheets,
    getWorksheetById,
    updateWorksheet,
    deleteWorksheet
};
