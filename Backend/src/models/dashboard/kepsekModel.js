// UBAH BARIS INI: Sesuaikan dengan nama dan posisi file konfigurasi databasemu
const db = require('../../config/db'); 

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
}

module.exports = KepsekModel;