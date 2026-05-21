const db = require('../../config/db'); // Sesuaikan dengan path koneksi database milikmu

class WritingModel {
    // =========================================================================
    // 🌟 SEIRAMA MCASSESSMENT: LOGIKA PENGECEKAN & POTONG KUOTA GLOBAL
    // =========================================================================

    // A. Fungsi cek sisa kuota user sebelum panggil API AI
    static async checkUserQuota(userId) {
        const query = `
            SELECT monthly_limit, used_this_month 
            FROM usage_quotas 
            WHERE user_id = $1;
        `;
        const { rows } = await db.query(query, [userId]);
        if (rows.length === 0) return null;
        
        return {
            hasQuota: rows[0].used_this_month < rows[0].monthly_limit,
            remaining: rows[0].monthly_limit - rows[0].used_this_month
        };
    }

    // B. Fungsi memotong / menambah hitungan pemakaian kuota saat AI berhasil di-generate
    static async incrementQuotaUsage(userId) {
        const query = `
            UPDATE usage_quotas 
            SET used_this_month = used_this_month + 1 
            WHERE user_id = $1 
            RETURNING used_this_month;
        `;
        const { rows } = await db.query(query, [userId]);
        return rows[0] ? rows[0].used_this_month : 0;
    }

    // =========================================================================
    // KODE UTAMA: REKAYASA TRANSAKSI & AMAN SESUAI STANDAR AKADEMIK
    // =========================================================================

    // 1. Membuat log request awal
    static async createRequest(requestId, userId, inputData) {
        const query = `
            INSERT INTO generation_requests (id, user_id, feature_type, input_data, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        const values = [
            requestId,                 // $1
            finalUserId,               // $2
            'writing_feedback',        // $3
            JSON.stringify(inputData), // $4
            'pending'               // $5
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // 2. Menyimpan hasil akhir DAN potong kuota dalam SATU Transaksi Atomik (Aman Sidang Skripsi)
    static async saveFeedbackAndDeductQuota(data, userId) {
        // Menggunakan client pool mandiri untuk menjamin isolation level transaksi
        const client = await db.connect();
        try {
            await client.query('BEGIN'); // Memulai transaksi database

            // Langkah A: Simpan data umpan balik menulis
            const feedbackQuery = `
                INSERT INTO writing_feedback (
                    id, request_id, tulisan_siswa, jenis_tulisan, 
                    tingkat_kelas, fokus_feedback, feedback_json, skor_keseluruhan
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) DO UPDATE SET
                    feedback_json = EXCLUDED.feedback_json,
                    skor_keseluruhan = EXCLUDED.skor_keseluruhan
                RETURNING *;
            `;
            const feedbackValues = [
                data.id,
                data.request_id,
                data.tulisan_siswa,
                data.jenis_tulisan, 
                data.tingkat_kelas,  
                data.fokus_feedback, 
                JSON.stringify(data.feedback_json), 
                data.skor_keseluruhan 
            ];
            const feedbackResult = await client.query(feedbackQuery, feedbackValues);

            // Langkah B: Potong kuota pengguna secara simultan
            const quotaQuery = `
                UPDATE usage_quotas 
                SET used_this_month = used_this_month + 1 
                WHERE user_id = $1;
            `;
            await client.query(quotaQuery, [userId]);

            await client.query('COMMIT'); // Eksekusi sukses bersamaan
            return feedbackResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK'); // Jika salah satu gagal, batalkan semua perubahan!
            console.error("Rollback Transaksi di WritingModel (saveFeedbackAndDeductQuota):", error);
            throw error;
        } finally {
            client.release(); // Kembalikan koneksi ke pool database
        }
    }

    // Mempertahankan fungsi lama agar tidak merusak kompabilitas modul lain jika ada
    static async saveFeedback(data) {
        const query = `
            INSERT INTO writing_feedback (
                id, request_id, tulisan_siswa, jenis_tulisan, 
                tingkat_kelas, fokus_feedback, feedback_json, skor_keseluruhan
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
                feedback_json = EXCLUDED.feedback_json,
                skor_keseluruhan = EXCLUDED.skor_keseluruhan
            RETURNING *;
        `;
        const values = [
            data.id,
            data.request_id,
            data.tulisan_siswa,
            data.jenis_tulisan, 
            data.tingkat_kelas,  
            data.fokus_feedback, 
            JSON.stringify(data.feedback_json), 
            data.skor_keseluruhan 
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // 3. Mengubah status request menjadi completed / failed
    static async updateRequestStatus(requestId, status, outputData = null) {
        try {
            if (status === 'completed' && outputData) {
                const query = `
                    UPDATE generation_requests 
                    SET 
                        status = $2, 
                        output_data = $3, 
                        llm_model_used = $4, 
                        token_usage = $5,
                        prompt_used = $6,
                        processing_time_ms = $7,
                        completed_at = NOW() 
                    WHERE id = $1
                    RETURNING *;
                `;
                
                const cleanResult = outputData.result ? outputData.result : outputData;
                
                const tokenUsageObj = {
                    prompt_tokens: outputData.prompt_tokens || 0,
                    completion_tokens: outputData.completion_tokens || 0,
                    total_tokens: outputData.total_tokens || 0
                };

                const values = [
                    requestId,                                                                   // $1
                    status,                                                                      // $2
                    typeof cleanResult === 'string' ? cleanResult : JSON.stringify(cleanResult), // $3
                    outputData.model_used || 'llama-3.3-70b-versatile',                           // $4
                    JSON.stringify(tokenUsageObj),                                               // $5
                    outputData.prompt_used || null,                                              // $6
                    outputData.processing_time_ms || 0                                           // $7
                ];
                
                const result = await db.query(query, values);
                return result.rows[0];
            } else {
                const query = `
                    UPDATE generation_requests 
                    SET 
                        status = $2, 
                        error_message = $3, 
                        completed_at = NOW() 
                    WHERE id = $1
                    RETURNING *;
                `;
                
                const errorMessage = outputData && outputData.error ? outputData.error : JSON.stringify(outputData);
                const result = await db.query(query, [requestId, status, errorMessage]);
                return result.rows[0];
            }
        } catch (error) {
            console.error("Error di WritingModel (updateRequestStatus):", error);
            throw error;
        }
    }

    // 4. READ ALL: Mengambil seluruh riwayat feedback esai siswa (Ditingkatkan dengan COALESCE)
    static async getAllFeedback() {
        try {
            const query = `
                SELECT wf.*, COALESCE(gr.input_data->>'nama_siswa', 'Siswa Anonim') AS nama_siswa 
                FROM writing_feedback wf
                LEFT JOIN generation_requests gr ON wf.request_id = gr.id
                ORDER BY wf.id DESC;
            `;
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error("Error di WritingModel (getAllFeedback):", error);
            throw error;
        }
    }

    // 5. READ BY ID: Mengambil satu data ulasan detail (Ditingkatkan dengan COALESCE)
    static async getFeedbackById(id) {
        try {
            const query = `
                SELECT wf.*, COALESCE(gr.input_data->>'nama_siswa', 'Siswa Anonim') AS nama_siswa 
                FROM writing_feedback wf
                LEFT JOIN generation_requests gr ON wf.request_id = gr.id
                WHERE wf.id = $1;
            `;
            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error("Error di WritingModel (getFeedbackById):", error);
            throw error;
        }
    }

    // 6. UPDATE: Digunakan ketika guru melakukan aksi simpan editan skor/aspek
    static async updateFeedback(id, feedbackJson, skorKeseluruhan) {
        try {
            const query = `
                UPDATE writing_feedback 
                SET feedback_json = $1, skor_keseluruhan = $2
                WHERE id = $3
                RETURNING *;
            `;
            const values = [JSON.stringify(feedbackJson), skorKeseluruhan, id];
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Error di WritingModel (updateFeedback):", error);
            throw error;
        }
    }

    // 7. DELETE: Untuk menghapus data ulasan dari database
    static async deleteFeedback(id) {
        try {
            const query = `DELETE FROM writing_feedback WHERE id = $1 RETURNING id;`;
            const result = await db.query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            console.error("Error di WritingModel (deleteFeedback):", error);
            throw error;
        }
    }
}

module.exports = WritingModel;