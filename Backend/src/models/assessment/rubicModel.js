const pool = require('../../config/db');

// 1. Catat request masuk ke generation_requests
const createRequest = async (requestId, userId, inputData) => {
    const query = `
        INSERT INTO generation_requests 
            (id, user_id, feature_type, input_data, status, created_at)
        VALUES 
            ($1, $2, 'rubric', $3, 'pending', NOW())
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
        data.aspek_penilaian,
        data.skala_nilai,
        JSON.stringify(data.rubric_json),
        data.tujuan_pembelajaran || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 3. Update status request (basic update)
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

// 3b. Update Request Completed dengan data metrik LLM lengkap
const updateRequestCompleted = async (requestId, outputData, promptUsed, processingTimeMs, tokenUsage, modelUsed) => {
    const query = `
        UPDATE generation_requests
        SET 
            status             = 'completed',
            output_data        = $1,
            prompt_used        = $2,
            processing_time_ms = $3,
            token_usage        = $4,
            llm_model_used     = $5,
            completed_at       = NOW()
        WHERE id = $6
        RETURNING *
    `;
    const values = [
        JSON.stringify(outputData),
        promptUsed,
        processingTimeMs,
        JSON.stringify(tokenUsage),
        modelUsed,
        requestId
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 4. GET ALL - Ambil semua rubrik milik user
const getAllRubrics = async (userId) => {
    const query = `
        SELECT 
            ar.id,
            ar.request_id,
            ar.jenis_tugas,
            ar.aspek_penilaian,
            ar.skala_nilai,
            ar.tujuan_pembelajaran,
            ar.rubric_json,
            gr.status,
            gr.created_at,
            gr.completed_at
        FROM assessment_rubric ar
        JOIN generation_requests gr ON ar.request_id = gr.id
        WHERE gr.user_id = $1
        ORDER BY gr.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

// 5. GET BY ID - Ambil detail rubrik berdasarkan ID
const getRubricById = async (rubricId, userId) => {
    const query = `
        SELECT 
            ar.id,
            ar.request_id,
            ar.jenis_tugas,
            ar.aspek_penilaian,
            ar.skala_nilai,
            ar.tujuan_pembelajaran,
            ar.rubric_json,
            gr.status,
            gr.input_data,
            gr.created_at,
            gr.completed_at
        FROM assessment_rubric ar
        JOIN generation_requests gr ON ar.request_id = gr.id
        WHERE ar.id = $1 AND gr.user_id = $2
    `;
    const result = await pool.query(query, [rubricId, userId]);
    return result.rows[0];
};

// 6. UPDATE - Update rubrik berdasarkan ID
const updateRubric = async (rubricId, userId, data) => {
    const query = `
        UPDATE assessment_rubric ar
        SET 
            jenis_tugas = $1,
            aspek_penilaian = $2,
            skala_nilai = $3,
            tujuan_pembelajaran = $4,
            rubric_json = $5
        FROM generation_requests gr
        WHERE ar.request_id = gr.id
            AND ar.id = $6
            AND gr.user_id = $7
        RETURNING ar.*
    `;
    const values = [
        data.jenis_tugas,
        data.aspek_penilaian,
        data.skala_nilai,
        data.tujuan_pembelajaran || null,
        JSON.stringify(data.rubric_json),
        rubricId,
        userId
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 7. DELETE - Hapus rubrik berdasarkan ID
const deleteRubric = async (rubricId, userId) => {
    const getRubricQuery = `
        SELECT ar.id, ar.request_id 
        FROM assessment_rubric ar
        JOIN generation_requests gr ON ar.request_id = gr.id
        WHERE ar.id = $1 AND gr.user_id = $2
    `;
    const rubric = await pool.query(getRubricQuery, [rubricId, userId]);
    if (!rubric.rows[0]) return null;

    const requestId = rubric.rows[0].request_id;
    await pool.query('DELETE FROM assessment_rubric WHERE id = $1', [rubricId]);
    await pool.query('DELETE FROM generation_requests WHERE id = $1', [requestId]);

    return rubric.rows[0];
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
        await pool.query(`
            INSERT INTO usage_quotas (id, user_id, plan_type, monthly_limit, used_this_month, reset_date)
            VALUES (gen_random_uuid(), $1, 'free', 10, 0, DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
        `, [userId]);
        return { hasQuota: true, remaining: 10, plan_type: 'free' };
    }

    const quota = result.rows[0];

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
    saveAssessment,
    updateRequestStatus,
    updateRequestCompleted,
    getAllRubrics,
    getRubricById,
    updateRubric,
    deleteRubric,
    checkUserQuota,
    incrementQuotaUsage
};