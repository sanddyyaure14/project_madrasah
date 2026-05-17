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
            'writing_feedback',      // $3 (Penanda ketat bahwa ini modul essay/writing kamu)
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
}

module.exports = WritingModel;