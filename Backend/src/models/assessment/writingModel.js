const db = require('../../config/db'); // Sesuaikan dengan path koneksi database milikmu

class WritingModel {
    // 1. Membuat log request awal
    static async createRequest(requestId, userId, inputData) {
        const query = `
            INSERT INTO generation_requests (id, user_id, feature_type, input_data, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const finalUserId = userId || '00000000-0000-0000-0000-000000000000'

        const values = [
            requestId,                 // $1
            finalUserId,               // $2
            'writing_feedback',        // $3 (Penanda ketat bahwa ini modul essay/writing kamu)
            JSON.stringify(inputData), // $4 (Data mentah tersimpan rapi di kolom input_data)
            'processing'               // $5
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    // 2. Menyimpan hasil akhir sesuai tabel di foto kamu
    static async saveFeedback(data) {
        const query = `
            INSERT INTO writing_feedback (
                id, 
                request_id, 
                tulisan_siswa, 
                jenis_tulisan, 
                tingkat_kelas, 
                fokus_feedback, 
                feedback_json, 
                skor_keseluruhan
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
        const query = `
            UPDATE generation_requests 
            SET status = $2, output_data = $3, completed_at = NOW() 
            WHERE id = $1;
        `;
        await db.query(query, [requestId, status, JSON.stringify(outputData)]);
    }

    // =========================================================================
    // 🔥 TAMBAHAN LOGIKA CRUD TERSISA (GET ALL, GET BY ID, UPDATE, DELETE)
    // =========================================================================

    // 4. READ ALL: Mengambil seluruh riwayat feedback esai siswa
    static async getAllFeedback() {
        try {
            const query = `
                SELECT wf.*, gr.input_data->>'nama_siswa' AS nama_siswa 
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

    // 5. READ BY ID: Mengambil satu data ulasan detail anak berdasarkan ID
    static async getFeedbackById(id) {
        try {
            const query = `
                SELECT wf.*, gr.input_data->>'nama_siswa' AS nama_siswa 
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