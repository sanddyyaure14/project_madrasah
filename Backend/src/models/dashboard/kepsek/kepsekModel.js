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
                    p.nip, p.mata_pelajaran, p.jenjang, p.kurikulum, p.no_hp, u.created_at
                FROM users u
                INNER JOIN user_profiles p ON u.id = p.user_id
                WHERE u.role = 'guru' AND u.is_active = false AND p.instansi_id = $1
                ORDER BY u.created_at DESC;
            `;
            const { rows } = await db.query(query, [instansiId]);
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
}

module.exports = KepsekModel;
