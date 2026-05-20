const pool = require('../../config/db');

const MCModel = {
    // 1. Simpan log request ke tabel generation_requests
    createRequest: async (requestId, userId, inputData) => {
        const query = `
    INSERT INTO generation_requests (id, user_id, feature_type, input_data, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

        /**
         * SOLUSI NOT-NULL CONSTRAINT:
         * Jika userId dari frontend kosong/null, kita gunakan ID dummy.
         * Pastikan ID dummy ini adalah UUID yang valid secara format.
         */
        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        const values = [
            requestId,                 // $1
            finalUserId,               // $2 (Sekarang tidak akan null lagi)
            'multiple_choice',         // $3
            JSON.stringify(inputData), // $4
            'processing'               // $5
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 2. Simpan hasil soal ke tabel assessment_mc
    saveAssessment: async (data) => {
        // Destructuring harus sesuai dengan kunci yang dikirim dari controller
        const {
            id,
            request_id,      // SESUAIKAN: ganti dari requestId ke request_id
            mata_pelajaran,  // SESUAIKAN: ganti dari subject ke mata_pelajaran
            tingkat_kelas,   // SESUAIKAN: ganti dari grade ke tingkat_kelas
            topik,           // SESUAIKAN: ganti dari topic ke topik
            jumlah_soal,     // SESUAIKAN: ganti dari count ke jumlah_soal
            tingkat_kesulitan,
            include_kunci,
            questions_json,
            kompetensi_dasar // TAMBAHKAN: ini kolom baru yang kamu minta
        } = data;

        const query = `
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

        const values = [
            id,                                     // $1
            request_id,                             // $2
            mata_pelajaran,                         // $3
            tingkat_kelas,                          // $4
            topik,                                  // $5
            jumlah_soal,                            // $6
            tingkat_kesulitan,                      // $7
            include_kunci === false ? false : true, // $8 (Menangani default boolean aman)
            JSON.stringify(questions_json),     // $9
            kompetensi_dasar                    // $10
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    },

    // 3. Update status di generation_requests (misal dari processing ke completed)
    updateRequestStatus: async (requestId, status, outputData = null) => {
        const query = `
      UPDATE generation_requests 
      SET status = $2, output_data = $3, completed_at = NOW() 
      WHERE id = $1;
    `;
        await pool.query(query, [requestId, status, JSON.stringify(outputData)]);
    },

    // 4. Ambil data berdasarkan ID
    getAssessmentById: async (id) => {
        try {
            const query = `
                SELECT id, request_id, mata_pelajaran, tingkat_kelas, topik, 
                       jumlah_soal, tingkat_kesulitan, include_kunci, questions_json, kompetensi_dasar
                FROM assessment_mc 
                WHERE id = $1;
            `; // <--- Kolom ditarik pas sesuai isi tabel di gambar (tanpa created_at)
            const result = await pool.query(query, [id]);
            return result.rows[0] || null; 
        } catch (error) {
            console.error("Error di MCModel (getAssessmentById):", error);
            throw error;
        }
    },

    // 5. FUNGSI KHUSUS DELETE (Sudah dimasukkan ke dalam objek MCModel & pakai pool)
    deleteAssessment: async (id) => {
        try {
            const query = `DELETE FROM assessment_mc WHERE id = $1;`;
            const result = await pool.query(query, [id]);
            return result;
        } catch (error) {
            console.error("Error di MCModel (deleteAssessment):", error);
            throw error;
        }
    },

    getAllAssessment: async () => {
        try {
            // Kita pakai LEFT JOIN ke generation_requests kalau sewaktu-waktu 
            // kamu butuh mengambil data dari log request-nya juga, Ris.
            const query = `
                SELECT amc.*, gr.user_id, gr.status AS request_status
                FROM assessment_mc amc
                LEFT JOIN generation_requests gr ON amc.request_id = gr.id
                ORDER BY amc.id DESC;
            `; 
            
            const result = await pool.query(query);
            return result.rows; // Mengembalikan semua baris data berupa array objek
        } catch (error) {
            console.error("Error di MCModel (getAllAssessment):", error);
            throw error;
        }
    }
};

module.exports = MCModel;