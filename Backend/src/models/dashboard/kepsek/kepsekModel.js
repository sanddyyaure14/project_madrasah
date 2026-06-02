// UBAH BARIS INI: Sesuaikan dengan nama dan posisi file konfigurasi databasemu
const db = require('../../../config/db'); 

class KepsekModel {
    // 1. Fungsi hitung total guru yang aktif
    static async countTotalGuru() {
        const query = `
            SELECT COUNT(*) AS total_guru 
            FROM users 
            WHERE role = 'guru' AND is_active = true
        `;
        const { rows } = await db.query(query);
        return parseInt(rows[0].total_guru, 10);
    }

    // 2. Fungsi hitung rata-rata rating feedback
    // Dipakai untuk Card "RATA-RATA RATING"
    static async getAverageRatingSummary() {
        const query = `
            SELECT 
                ROUND(AVG(rating), 1) AS avg_rating, -- Menggunakan 1 angka desimal (misal: 4.7)
                COUNT(*) AS total_feedback           -- Menggunakan hitungan feedback (misal: Dari 18 feedback)
            FROM user_feedback
        `;
        const { rows } = await db.query(query);
        return {
            rata_rata: rows[0].avg_rating ? parseFloat(rows[0].avg_rating) : 0.0,
            jumlah_feedback: parseInt(rows[0].total_feedback, 10)
        };
    }

    // 🌟 BARU & RINGKAS: Menghitung akumulasi total berapa kali generate yang sudah dilakukan semua guru
    // Dipakai untuk Card "TOTAL GENERATE"
    static async getTotalGlobalGenerate() {
        try {
            // Cukup menjumlahkan (SUM) kolom used_this_month dari seluruh record kuota guru
            const query = `
                SELECT SUM(used_this_month) AS total_global_generate 
                FROM usage_quotas;
            `;
            const { rows } = await db.query(query);
            
            // Jika hasilnya null (karena belum ada guru yang generate sama sekali), kita amankan ke angka 0
            return rows[0].total_global_generate ? parseInt(rows[0].total_global_generate, 10) : 0;
        } catch (error) {
            console.error("Error di KepsekModel.getTotalGlobalGenerate:", error);
            throw error;
        }
    }

    // =========================================================================
    // 🌟 TAMBAHAN BARU: QUERY ANTRIAN & APPROVE GURU (AUTH VERIFIKASI)
    // =========================================================================

    // A. Ambil semua daftar guru yang statusnya masih 'Pending' (is_active = false)
    static async getPendingTeachers(instansiId) {
        try {
            const query = `
                SELECT 
                    u.id, u.nama_lengkap, u.email, u.role, u.is_active,
                    p.nip, p.mata_pelajaran, p.jenjang, p.kurikulum, p.no_hp, u.created_at,
                    i.nama AS nama_instansi
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN institutions i ON p.instansi_id = i.id
                WHERE u.role = 'guru' AND u.is_active = false
                ORDER BY u.created_at DESC;
            `;
            const { rows } = await db.query(query);
            return rows;
        } catch (error) {
            console.error("Error di KepsekModel.getPendingTeachers:", error);
            throw error;
        }
    }

    // B. Proses ACC atau APPROVE (Mengubah is_active menjadi true)
    static async approveTeacher(userId) {
        try {
            const query = `
                UPDATE users 
                SET is_active = true 
                WHERE id = $1 AND role = 'guru'
                RETURNING id, nama_lengkap, email, is_active;
            `;
            const { rows } = await db.query(query, [userId]);
            return rows[0];
        } catch (error) {
            console.error("Error di KepsekModel.approveTeacher:", error);
            throw error;
        }
    }

    // C. Proses REJECT / TOLAK (Menghapus data pendaftaran secara aman via Transaksi SQL)
    static async rejectTeacherTransaction(userId) {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Hapus profil dulu karena adanya relasi Foreign Key ke tabel users
            await client.query("DELETE FROM user_profiles WHERE user_id = $1;", [userId]);
            
            // 2. Hapus user utamanya
            const queryUser = "DELETE FROM users WHERE id = $1 AND role = 'guru' RETURNING id, nama_lengkap;";
            const { rows } = await client.query(queryUser, [userId]);
            
            await client.query('COMMIT');
            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error di KepsekModel.rejectTeacherTransaction:", error);
            throw error;
        } finally {
            client.release();
        }
    }
    // D. Ambil semua guru aktif di madrasah kepsek
static async getDaftarGuru(instansiId) {
    try {
        const query = `
            SELECT 
                u.id,
                u.nama_lengkap,
                u.email,
                u.avatar_url,
                u.is_active,
                u.created_at,
                u.last_login_at,
                p.nip,
                p.mata_pelajaran,
                p.jenjang,
                p.kurikulum,
                p.no_hp,
                COALESCE(uq.used_this_month, 0) AS total_generate_bulan_ini,
                COALESCE(uq.monthly_limit, 0) AS monthly_limit,
                uq.plan_type
            FROM users u
            INNER JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN usage_quotas uq ON u.id = uq.user_id
            WHERE u.role = 'guru' 
                AND u.is_active = true 
                AND p.instansi_id = $1
            ORDER BY u.nama_lengkap ASC;
        `;
        const { rows } = await db.query(query, [instansiId]);
        return rows;
    } catch (error) {
        console.error("Error di KepsekModel.getDaftarGuru:", error);
        throw error;
    }
}

// E. Ambil detail satu guru
static async getDetailGuru(guruId, instansiId) {
    try {
        const query = `
            SELECT 
                u.id,
                u.nama_lengkap,
                u.email,
                u.avatar_url,
                u.is_active,
                u.created_at,
                u.last_login_at,
                p.nip,
                p.mata_pelajaran,
                p.jenjang,
                p.kurikulum,
                p.no_hp,
                COALESCE(uq.used_this_month, 0) AS total_generate_bulan_ini,
                COALESCE(uq.monthly_limit, 0) AS monthly_limit,
                uq.plan_type
            FROM users u
            INNER JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN usage_quotas uq ON u.id = uq.user_id
            WHERE u.id = $1
                AND u.role = 'guru'
                AND p.instansi_id = $2;
        `;
        const { rows } = await db.query(query, [guruId, instansiId]);
        return rows[0];
    } catch (error) {
        console.error("Error di KepsekModel.getDetailGuru:", error);
        throw error;
    }
}

// F. Ambil semua history generate dari semua guru
static async getHistoryAllGuru(instansiId, featureType = null) {
    try {
        let whereClause = `
            WHERE u.role = 'guru'
                AND u.is_active = true
                AND p.instansi_id = $1
                AND gr.status = 'completed'
        `;
        const params = [instansiId];

        if (featureType) {
            params.push(featureType);
            whereClause += ` AND gr.feature_type = $${params.length}`;
        }

        const query = `
            SELECT 
                gr.id AS request_id,
                gr.feature_type,
                gr.status,
                gr.created_at,
                gr.completed_at,
                gr.input_data,
                u.id AS guru_id,
                u.nama_lengkap AS nama_guru,
                u.email AS email_guru
            FROM generation_requests gr
            INNER JOIN users u ON gr.user_id = u.id
            INNER JOIN user_profiles p ON u.id = p.user_id
            ${whereClause}
            ORDER BY gr.created_at DESC;
        `;
        const { rows } = await db.query(query, params);
        return rows;
    } catch (error) {
        console.error("Error di KepsekModel.getHistoryAllGuru:", error);
        throw error;
    }
}

// G. Ambil history generate milik satu guru
static async getHistoryByGuru(guruId, instansiId) {
    try {
        const query = `
            SELECT 
                gr.id AS request_id,
                gr.feature_type,
                gr.status,
                gr.created_at,
                gr.completed_at,
                gr.input_data,
                u.nama_lengkap AS nama_guru
            FROM generation_requests gr
            INNER JOIN users u ON gr.user_id = u.id
            INNER JOIN user_profiles p ON u.id = p.user_id
            WHERE gr.user_id = $1
                AND p.instansi_id = $2
                AND gr.status = 'completed'
            ORDER BY gr.created_at DESC;
        `;
        const { rows } = await db.query(query, [guruId, instansiId]);
        return rows;
    } catch (error) {
        console.error("Error di KepsekModel.getHistoryByGuru:", error);
        throw error;
    }
}

// H. Statistik per guru
static async getStatistikGuru(instansiId) {
    try {
        const query = `
            SELECT 
                u.id AS guru_id,
                u.nama_lengkap,
                COUNT(gr.id) AS total_generate,
                COUNT(CASE WHEN gr.feature_type = 'rubric' THEN 1 END) AS total_rubric,
                COUNT(CASE WHEN gr.feature_type = 'worksheet' THEN 1 END) AS total_worksheet,
                COUNT(CASE WHEN gr.feature_type = 'multiple_choice' THEN 1 END) AS total_mc,
                COUNT(CASE WHEN gr.feature_type = 'writing_feedback' THEN 1 END) AS total_writing,
                MAX(gr.created_at) AS last_generate_at
            FROM users u
            INNER JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN generation_requests gr ON u.id = gr.user_id AND gr.status = 'completed'
            WHERE u.role = 'guru'
                AND u.is_active = true
                AND p.instansi_id = $1
            GROUP BY u.id, u.nama_lengkap
            ORDER BY total_generate DESC;
        `;
        const { rows } = await db.query(query, [instansiId]);
        return rows;
    } catch (error) {
        console.error("Error di KepsekModel.getStatistikGuru:", error);
        throw error;
    }
}

// =========================================================================
    // 🌟 UPSERT KUOTA GURU (Sesuai skema tabel usage_quotas)
    // =========================================================================
    static async upsertTeacherQuota({ user_id, plan_type, monthly_limit, reset_date }) {
        try {
            const query = `
                INSERT INTO usage_quotas (id, user_id, plan_type, monthly_limit, used_this_month, reset_date)
                VALUES (gen_random_uuid(), $1, $2, $3, 0, $4)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    plan_type = EXCLUDED.plan_type,
                    monthly_limit = EXCLUDED.monthly_limit,
                    used_this_month = 0, -- Reset jumlah terpakai ke 0 saat kuota diperbarui
                    reset_date = EXCLUDED.reset_date
                RETURNING id, user_id, plan_type, monthly_limit, used_this_month, reset_date;
            `;
            const values = [user_id, plan_type, monthly_limit, reset_date];
            const { rows } = await db.query(query, values);
            return rows[0];
        } catch (error) {
            console.error("Error di KepsekModel.upsertTeacherQuota:", error);
            throw error;
        }
    }
}


    
module.exports = KepsekModel;
