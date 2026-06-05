const pool = require('../../config/db');

// 1. Catat request masuk ke generation_requests dengan field baru
const createRequest = async (requestId, userId, inputData, additionalData = {}) => {
    const query = `
        INSERT INTO generation_requests 
            (
                id, user_id, feature_type, input_data, status, 
                prompt_used, llm_model_used, created_at
            )
        VALUES 
            ($1, $2, 'worksheet', $3, 'pending', $4, $5, NOW())
        RETURNING *
    `;
    const values = [
        requestId, 
        userId, 
        JSON.stringify(inputData),
        additionalData.prompt_used || null,
        additionalData.llm_model_used || 'llama-3.3-70b-versatile'
    ];
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

// 3. Update status request (completed / failed) + Mengisi token_usage & metrics
const updateRequestStatus = async (requestId, status, outputData, metrics = {}) => {
    const query = `
        UPDATE generation_requests
        SET 
            status = $1,
            output_data = $2,
            error_message = $3,
            processing_time_ms = $4,
            token_usage = $5,
            completed_at = NOW()
        WHERE id = $6
        RETURNING *
    `;
    const values = [
        status,                                                                 // $1
        outputData ? JSON.stringify(outputData) : null,                         // $2
        metrics.error_message || null,                                          // $3
        metrics.processing_time_ms || null,                                     // $4
        metrics.token_usage ? JSON.stringify(metrics.token_usage) : null,       // $5
        requestId                                                               // $6
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 4. GET ALL - Ambil semua worksheet milik user (atau semua jika kepsek)
const getAllWorksheets = async (userId, isKepsek = false) => {
    if (isKepsek) {
        const query = 'SELECT w.id, w.request_id, w.judul, w.mata_pelajaran, w.topik, w.tipe_aktivitas, w.durasi_menit, w.worksheet_json, gr.status, gr.user_id, gr.created_at, gr.completed_at FROM worksheets w JOIN generation_requests gr ON w.request_id = gr.id ORDER BY gr.created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
    const query = 'SELECT w.id, w.request_id, w.judul, w.mata_pelajaran, w.topik, w.tipe_aktivitas, w.durasi_menit, w.worksheet_json, gr.status, gr.created_at, gr.completed_at FROM worksheets w JOIN generation_requests gr ON w.request_id = gr.id WHERE gr.user_id = $1 ORDER BY gr.created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
};

// 5. GET BY ID - Ambil detail worksheet berdasarkan ID (kepsek bisa akses tanpa filter user)
const getWorksheetById = async (worksheetId, userId, isKepsek = false) => {
    if (isKepsek) {
        const query = `
            SELECT 
                w.id, w.request_id, w.judul, w.mata_pelajaran, w.topik,
                w.tipe_aktivitas, w.durasi_menit, w.worksheet_json,
                gr.status, gr.user_id, gr.input_data, gr.created_at, gr.completed_at
            FROM worksheets w
            JOIN generation_requests gr ON w.request_id = gr.id
            WHERE w.id = $1
        `;
        const result = await pool.query(query, [worksheetId]);
        return result.rows[0];
    }
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

// 6. UPDATE - Update worksheet berdasarkan ID (kepsek bisa update tanpa filter user)
const updateWorksheet = async (worksheetId, userId, data, isKepsek = false) => {
    if (isKepsek) {
        const query = `
            UPDATE worksheets
            SET 
                judul = $1,
                mata_pelajaran = $2,
                topik = $3,
                tipe_aktivitas = $4,
                durasi_menit = $5,
                worksheet_json = $6
            WHERE id = $7
            RETURNING *
        `;
        const values = [
            data.judul, data.mata_pelajaran, data.topik,
            data.tipe_aktivitas, data.durasi_menit || null,
            JSON.stringify(data.worksheet_json), worksheetId
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
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

// 7. DELETE - Hapus worksheet berdasarkan ID (kepsek bisa hapus tanpa filter user)
const deleteWorksheet = async (worksheetId, userId, isKepsek = false) => {
    if (isKepsek) {
        const worksheet = await pool.query('SELECT id, request_id FROM worksheets WHERE id = $1', [worksheetId]);
        if (!worksheet.rows[0]) return null;
        const requestId = worksheet.rows[0].request_id;
        await pool.query('DELETE FROM worksheets WHERE id = $1', [worksheetId]);
        await pool.query('DELETE FROM generation_requests WHERE id = $1', [requestId]);
        return worksheet.rows[0];
    }
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


// 8. CEK KUOTA user sebelum generate
const checkUserQuota = async (userId) => {
    const query = `
        SELECT monthly_limit, used_this_month, reset_date, plan_type
        FROM usage_quotas
        WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (!result.rows[0]) {
        // Buat kuota default free jika belum ada
        await pool.query(`
            INSERT INTO usage_quotas (id, user_id, plan_type, monthly_limit, used_this_month, reset_date)
            VALUES (gen_random_uuid(), $1, 'free', 10, 0, DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
        `, [userId]);
        return { hasQuota: true, remaining: 10, plan_type: 'free' };
    }

    const quota = result.rows[0];

    // Reset jika sudah melewati tanggal reset
    if (new Date() >= new Date(quota.reset_date)) {
        await pool.query(`
            UPDATE usage_quotas 
            SET used_this_month = 0, reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
            WHERE user_id = $1
        `, [userId]);
        return { hasQuota: true, remaining: quota.monthly_limit, plan_type: quota.plan_type };
    }

    const remaining = quota.monthly_limit - quota.used_this_month;
    return {
        hasQuota: remaining > 0,
        remaining,
        used: quota.used_this_month,
        limit: quota.monthly_limit,
        plan_type: quota.plan_type
    };
};

// 9. INCREMENT kuota setelah generate berhasil
const incrementQuotaUsage = async (userId) => {
    const query = `
        UPDATE usage_quotas
        SET used_this_month = used_this_month + 1
        WHERE user_id = $1
        RETURNING used_this_month, monthly_limit
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
};

module.exports = {
    createRequest,
    saveWorksheet,
    updateRequestStatus,
    getAllWorksheets,
    getWorksheetById,
    updateWorksheet,
    deleteWorksheet,
    checkUserQuota,
    incrementQuotaUsage
};
