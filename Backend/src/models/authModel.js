const db = require('../config/db'); // Path ke file pool koneksi database pg kamu

const AuthModel = {
    // A. Mengambil daftar sekolah dummy untuk dipasang di dropdown frontend
    getInstitutions: async () => {
        const query = "SELECT id, nama FROM institutions ORDER BY nama ASC;";
        const result = await db.query(query);
        return result.rows;
    },

    // B. Mencari user berdasarkan email (Dipakai saat login & validasi registrasi)
    findByEmail: async (email) => {
        const query = "SELECT * FROM users WHERE email = $1;";
        const result = await db.query(query, [email]);
        return result.rows[0];
    },

    // C. Transaksi Registrasi: Menyimpan data ke tabel users DAN user_profiles sekaligus
    registerTeacherTransaction: async (userData, profileData) => {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Masukkan ke tabel users (role diset 'guru', is_active diset false/pending)
            const userQuery = `
                INSERT INTO users (id, nama_lengkap, email, password_hash, role, is_active)
                VALUES (gen_random_uuid(), $1, $2, $3, 'guru', false)
                RETURNING id, nama_lengkap, email, role, is_active;
            `;
            const userResult = await client.query(userQuery, [
                userData.nama_lengkap,
                userData.email,
                userData.password_hash
            ]);
            
            const newUser = userResult.rows[0];

            // 2. Masukkan ke tabel user_profiles (Hubungkan dengan user_id yang baru dibuat)
            const profileQuery = `
                INSERT INTO user_profiles (id, user_id, nip, mata_pelajaran, jenjang, kurikulum, no_hp, instansi_id)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7);
            `;
            await client.query(profileQuery, [
                newUser.id,
                profileData.nip || null,
                profileData.mata_pelajaran, // Berupa Array Teks, misal: ['Fikih']
                profileData.jenjang || null,
                profileData.kurikulum || null,
                profileData.no_hp || null,
                profileData.instansi_id || null
            ]);

            await client.query('COMMIT');
            return newUser;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // D. Mencatat log ke tabel user_sessions sesuai skema ERD kamu saat login sukses
    createSession: async (sessionData) => {
        const query = `
            INSERT INTO user_sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at, is_revoked)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, false)
            RETURNING id;
        `;
        const values = [
            sessionData.user_id,
            sessionData.refresh_token,
            sessionData.ip_address,
            sessionData.user_agent,
            sessionData.expires_at
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    // E. Memperbarui timestamp login terakhir pada tabel users
    updateLastLogin: async (userId) => {
        const query = "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1;";
        await db.query(query, [userId]);
    }
};

module.exports = AuthModel;