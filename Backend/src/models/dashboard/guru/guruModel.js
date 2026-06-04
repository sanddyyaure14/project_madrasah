const db = require('../../../config/db');

const GuruModel = {
    // =========================================================================
    // A. PROFILE GURU
    // =========================================================================

    /**
     * Ambil profil lengkap guru berdasarkan user_id dari JWT
     * Menggabungkan data dari tabel users + user_profiles + institutions
     */
    getProfileByUserId: async (userId) => {
        const query = `
            SELECT 
                u.id,
                u.nama_lengkap,
                u.email,
                u.role,
                u.is_active,
                u.last_login_at,
                u.created_at,
                p.nip,
                p.mata_pelajaran,
                p.jenjang,
                p.kurikulum,
                p.no_hp,
                p.instansi_id,
                i.nama AS nama_instansi
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN institutions i ON p.instansi_id = i.id
            WHERE u.id = $1 AND u.role = 'guru';
        `;
        const { rows } = await db.query(query, [userId]);
        return rows[0] || null;
    },

    /**
     * Update profil guru — UPSERT manual (check exist → insert/update)
     */
    updateProfile: async (userId, updateData) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Update nama_lengkap di tabel users
            if (updateData.nama_lengkap) {
                await client.query(
                    'UPDATE users SET nama_lengkap = $2 WHERE id = $1',
                    [userId, updateData.nama_lengkap]
                );
            }

            const mapelArr = updateData.mata_pelajaran
                ? (Array.isArray(updateData.mata_pelajaran)
                    ? updateData.mata_pelajaran
                    : [updateData.mata_pelajaran])
                : null;

            // 2. Cek apakah row user_profiles sudah ada
            const existing = await client.query(
                'SELECT id FROM user_profiles WHERE user_id = $1',
                [userId]
            );

            if (existing.rows.length === 0) {
                // INSERT baru
                await client.query(`
                    INSERT INTO user_profiles (id, user_id, nip, mata_pelajaran, jenjang, kurikulum, no_hp)
                    VALUES (gen_random_uuid(), $1, $2, $3, $4::school_level, $5::curriculum_type, $6)
                `, [
                    userId,
                    updateData.nip || null,
                    mapelArr,
                    updateData.jenjang || null,
                    updateData.kurikulum || null,
                    updateData.no_hp || null,
                ]);
            } else {
                // UPDATE yang sudah ada
                await client.query(`
                    UPDATE user_profiles SET
                        nip            = COALESCE($2, nip),
                        mata_pelajaran = COALESCE($3, mata_pelajaran),
                        jenjang        = COALESCE($4::school_level, jenjang),
                        kurikulum      = COALESCE($5::curriculum_type, kurikulum),
                        no_hp          = COALESCE($6, no_hp)
                    WHERE user_id = $1
                `, [
                    userId,
                    updateData.nip || null,
                    mapelArr,
                    updateData.jenjang || null,
                    updateData.kurikulum || null,
                    updateData.no_hp || null,
                ]);
            }

            await client.query('COMMIT');
            return await GuruModel.getProfileByUserId(userId);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // =========================================================================
    // B. DOKUMEN SAYA / HISTORY
    // =========================================================================

    /**
     * Ambil semua riwayat generate dokumen milik guru ini
     * Diurutkan dari yang terbaru, dengan pagination opsional
     */
    getDocumentHistory: async (userId, limit = 20, offset = 0) => {
        const query = `
            SELECT 
                gr.id AS request_id,
                gr.feature_type,
                gr.status,
                gr.input_data,
                gr.created_at,
                gr.completed_at,
                gr.processing_time_ms,
                gr.llm_model_used,
                -- Ambil judul/topik dari input_data untuk tampilan ringkas
                gr.input_data->>'topik'          AS topik,
                gr.input_data->>'mata_pelajaran'  AS mata_pelajaran,
                gr.input_data->>'tingkat_kelas'   AS tingkat_kelas,
                gr.input_data->>'jenis_konten'    AS jenis_konten,
                gr.input_data->>'judul'           AS judul
            FROM generation_requests gr
            WHERE gr.user_id = $1
            ORDER BY gr.created_at DESC
            LIMIT $2 OFFSET $3;
        `;
        const { rows } = await db.query(query, [userId, limit, offset]);
        return rows;
    },

    /**
     * Hitung total semua riwayat (untuk pagination di frontend)
     */
    countDocumentHistory: async (userId) => {
        const query = `
            SELECT COUNT(*) AS total
            FROM generation_requests
            WHERE user_id = $1;
        `;
        const { rows } = await db.query(query, [userId]);
        return parseInt(rows[0].total, 10);
    },

    /**
     * Ambil detail satu dokumen berdasarkan request_id
     * Hanya bisa diakses oleh pemiliknya (user_id harus cocok)
     */
    getDocumentDetail: async (requestId, userId) => {
        const query = `
            SELECT 
                gr.*,
                -- Coba join ke semua tabel konten/assessment berdasarkan feature_type
                amc.questions_json      AS mc_data,
                aw.essay_json           AS writing_data,
                ar.rubric_json          AS rubric_data,
                ws.worksheet_json       AS worksheet_data,
                sl.silabus_json         AS syllabus_data,
                up.rpp_json             AS unit_plan_data,
                pr.slides_json          AS presentation_data,
                ac.content_json         AS academic_content_data
            FROM generation_requests gr
            LEFT JOIN assessment_mc amc       ON amc.request_id = gr.id
            LEFT JOIN assessment_writing aw   ON aw.request_id  = gr.id
            LEFT JOIN assessment_rubric ar    ON ar.request_id  = gr.id
            LEFT JOIN worksheets ws           ON ws.request_id  = gr.id
            LEFT JOIN syllabi sl              ON sl.request_id  = gr.id
            LEFT JOIN unit_plans up           ON up.request_id  = gr.id
            LEFT JOIN presentations pr        ON pr.request_id  = gr.id
            LEFT JOIN academic_contents ac    ON ac.request_id  = gr.id
            WHERE gr.id = $1 AND gr.user_id = $2;
        `;
        const { rows } = await db.query(query, [requestId, userId]);
        return rows[0] || null;
    },

    /**
     * Filter history berdasarkan feature_type
     * Contoh: 'multiple_choice', 'syllabus', 'unit_plan', dll.
     */
    getDocumentHistoryByType: async (userId, featureType, limit = 20, offset = 0) => {
        const query = `
            SELECT 
                gr.id AS request_id,
                gr.feature_type,
                gr.status,
                gr.created_at,
                gr.completed_at,
                gr.input_data->>'topik'          AS topik,
                gr.input_data->>'mata_pelajaran'  AS mata_pelajaran,
                gr.input_data->>'tingkat_kelas'   AS tingkat_kelas,
                gr.input_data->>'jenis_konten'    AS jenis_konten,
                gr.input_data->>'judul'           AS judul
            FROM generation_requests gr
            WHERE gr.user_id = $1 AND gr.feature_type = $2
            ORDER BY gr.created_at DESC
            LIMIT $3 OFFSET $4;
        `;
        const { rows } = await db.query(query, [userId, featureType, limit, offset]);
        return rows;
    },

    /**
     * Ambil password hash untuk verifikasi ubah password
     */
    getUserPasswordHash: async (userId) => {
        const { rows } = await db.query(
            'SELECT id, password_hash FROM users WHERE id = $1',
            [userId]
        );
        return rows[0] || null;
    },

    /**
     * Update password hash user
     */
    updatePassword: async (userId, newPasswordHash) => {
        await db.query(
            'UPDATE users SET password_hash = $2 WHERE id = $1',
            [userId, newPasswordHash]
        );
    },

    // =========================================================================
    // C. DASHBOARD / QUOTA
    // =========================================================================

    /**
     * Ambil informasi kuota penggunaan guru
     */
    getQuotaUsage: async (userId) => {
        const query = `
            SELECT 
                plan_type, 
                monthly_limit, 
                used_this_month,
                reset_date
            FROM usage_quotas
            WHERE user_id = $1;
        `;
        const { rows } = await db.query(query, [userId]);
        return rows[0] || null;
    }
};

module.exports = GuruModel;
