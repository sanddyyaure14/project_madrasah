const pool = require('../../config/db');

const MCModel = {
    // 1. SESUAI DIAGRAM LANGKAH 2: Simpan log request awal dengan status PENDING
    createRequest: async (requestId, userId, inputData) => {
        const query = `
            INSERT INTO generation_requests (id, user_id, feature_type, input_data, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const values = [
            requestId,
            userId || '00000000-0000-0000-0000-000000000000',
            'multiple_choice', // Menjaga tipe fitur asli kamu
            JSON.stringify(inputData),
            'pending' // 🌟 DIUBAH: Dari 'processing' ke 'pending' agar sesuai alur awal
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 2. SESUAI DIAGRAM LANGKAH 3: Update status (pending -> processing -> completed/failed)
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
            WHERE id = $1
            RETURNING *;
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

    // 3. AMBIL DATA KUOTA GURU
    getUserQuota: async (userId) => {
    const query = `
        SELECT monthly_limit, used_this_month, plan_type, reset_date 
        FROM usage_quotas 
        WHERE user_id = $1
        FOR UPDATE; -- 🌟 Kuncinya ada di sini, Ris!
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
},

    // 4. 🌟 BARU & KRUSIAL: TRANSAKSI ATOMIK (Simpan Soal SEKALIGUS Potong Kuota)
    // Ini menggantikan fungsi saveAssessment dan incrementUsedQuota terpisah agar aman dari cececan dosen!
    saveAssessmentAndDeductQuota: async (data, userId) => {
        const client = await pool.connect(); // Ambil client untuk transaksi berkelanjutan
        try {
            await client.query('BEGIN'); // Mulai transaksi manual

            const {
                id,
                request_id,
                mata_pelajaran,
                tingkat_kelas,
                topik,
                jumlah_soal,
                tingkat_kesulitan,
                include_kunci,
                questions_json,
                kompetensi_dasar
            } = data;

            // Query 1: Simpan Paket Soal Pilihan Ganda
            const assessmentQuery = `
                INSERT INTO assessment_mc 
                (id, request_id, mata_pelajaran, tingkat_kelas, topik, jumlah_soal, tingkat_kesulitan, include_kunci, questions_json, kompetensi_dasar)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO UPDATE SET
                    questions_json = EXCLUDED.questions_json,
                    kompetensi_dasar = EXCLUDED.kompetensi_dasar,
                    topik = EXCLUDED.topik,
                    tingkat_kesulitan = EXCLUDED.tingkat_kesulitan,
                    include_kunci = EXCLUDED.include_kunci,
                    jumlah_soal = EXCLUDED.jumlah_soal
                RETURNING *;
            `;

            const assessmentValues = [
                id,
                request_id,
                mata_pelajaran,
                tingkat_kelas,
                topik,
                jumlah_soal,
                tingkat_kesulitan,
                include_kunci === false ? false : true,
                JSON.stringify(questions_json),
                kompetensi_dasar
            ];
            const assessmentResult = await client.query(assessmentQuery, assessmentValues);

            // Query 2: Potong Kuota Guru (+1 Pemakaian)
            const quotaQuery = `
                UPDATE usage_quotas 
                SET used_this_month = used_this_month + 1 
                WHERE user_id = $1;
            `;
            await client.query(quotaQuery, [userId]);

            await client.query('COMMIT'); // Eksekusi sukses bersamaan ke DB
            return assessmentResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK'); // Batalkan semua aksi jika salah satu gagal!
            throw error;
        } finally {
            client.release(); // Kembalikan koneksi ke pool
        }
    },

    getAssessmentById: async (id, userId = null) => {
        try {
            const query = userId
                ? `SELECT amc.id, amc.request_id, amc.mata_pelajaran, amc.tingkat_kelas, amc.topik, 
                          amc.jumlah_soal, amc.tingkat_kesulitan, amc.include_kunci, amc.questions_json, amc.kompetensi_dasar
                   FROM assessment_mc amc
                   JOIN generation_requests gr ON amc.request_id = gr.id
                   WHERE amc.id = $1 AND gr.user_id = $2;`
                : `SELECT id, request_id, mata_pelajaran, tingkat_kelas, topik, 
                          jumlah_soal, tingkat_kesulitan, include_kunci, questions_json, kompetensi_dasar
                   FROM assessment_mc 
                   WHERE id = $1;`;
            const values = userId ? [id, userId] : [id];
            const result = await pool.query(query, values);
            if (!result.rows[0]) return null;

            const row = result.rows[0];
            // Parse questions_json jika masih berupa string
            if (typeof row.questions_json === 'string') {
                try { row.questions_json = JSON.parse(row.questions_json); } catch { row.questions_json = []; }
            }
            return row;
        } catch (error) {
            console.error("Error di MCModel (getAssessmentById):", error);
            throw error;
        }
    },

    deleteAssessment: async (id, userId) => {
        try {
            const existing = await MCModel.getAssessmentById(id, userId);
            if (!existing) return null;

            const requestId = existing.request_id;
            await pool.query(`DELETE FROM assessment_mc WHERE id = $1;`, [id]);
            await pool.query(`DELETE FROM generation_requests WHERE id = $1;`, [requestId]);
            return existing;
        } catch (error) {
            console.error("Error di MCModel (deleteAssessment):", error);
            throw error;
        }
    },

    getAllAssessment: async (userId, isKepsek = false) => {
        try {
            if (isKepsek) {
                const query = `
                    SELECT amc.*, gr.user_id, gr.status AS request_status
                    FROM assessment_mc amc
                    LEFT JOIN generation_requests gr ON amc.request_id = gr.id
                    ORDER BY amc.id DESC;
                `;
                const result = await pool.query(query);
                return result.rows;
            }
            const query = `
                SELECT amc.*, gr.user_id, gr.status AS request_status
                FROM assessment_mc amc
                LEFT JOIN generation_requests gr ON amc.request_id = gr.id
                WHERE gr.user_id = $1
                ORDER BY amc.id DESC;
            `; 
            const result = await pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error("Error di MCModel (getAllAssessment):", error);
            throw error;
        }
    }
};

module.exports = MCModel;
