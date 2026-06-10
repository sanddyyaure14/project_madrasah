const KepsekModel = require('../../../models/dashboard/kepsek/kepsekModel');
const bcrypt = require('bcrypt');
const db = require('../../../config/db');

const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Ambil data global (Informasi Madrasah)
        const totalGuruPromise = KepsekModel.countTotalGuru();
        const ratingDataPromise = KepsekModel.getAverageRatingSummary();
        const globalGeneratePromise = KepsekModel.getTotalGlobalGenerate();
        const pendingTeachersPromise = KepsekModel.getPendingTeachers();

        // 2. Ambil data personal (Informasi Saya)
        // a. Total Generate Saya (Bulan ini)
        const myGeneratePromise = db.query(`
            SELECT COALESCE(used_this_month, 0) AS used_this_month, COALESCE(monthly_limit, 100) AS monthly_limit
            FROM usage_quotas 
            WHERE user_id = $1
        `, [userId]);
        
        // b. Dokumen Tersimpan (Total history saya)
        const myDocsPromise = db.query(`
            SELECT COUNT(*) AS total 
            FROM generation_requests 
            WHERE user_id = $1 AND status = 'completed'
        `, [userId]);

        // c. Feedback Saya (Rata-rata feedback saya)
        const myFeedbackPromise = db.query(`
            SELECT 
                COUNT(*) AS total_feedback,
                ROUND(AVG(rating), 1) AS rata_rata
            FROM user_feedback
            WHERE user_id = $1
        `, [userId]);

        const [
            totalGuru, 
            ratingData, 
            globalGenerate, 
            pendingTeachers,
            myGenerateRes,
            myDocsRes,
            myFeedbackRes
        ] = await Promise.all([
            totalGuruPromise,
            ratingDataPromise,
            globalGeneratePromise,
            pendingTeachersPromise,
            myGeneratePromise,
            myDocsPromise,
            myFeedbackPromise
        ]);

        return res.status(200).json({
            success: true,
            message: "Berhasil memuat data Cards Summary untuk Dashboard Kepsek.",
            data: {
                informasi_madrasah: {
                    total_guru: totalGuru,
                    total_generate_bulan_ini: globalGenerate,
                    menunggu_persetujuan: pendingTeachers.length,
                    rata_rata_rating: ratingData.rata_rata,
                    total_feedback_rating: ratingData.jumlah_feedback
                },
                informasi_saya: {
                    total_generate_saya: myGenerateRes.rows[0] ? myGenerateRes.rows[0].used_this_month : 0,
                    monthly_limit_saya: myGenerateRes.rows[0] ? myGenerateRes.rows[0].monthly_limit : 100,
                    dokumen_tersimpan: myDocsRes.rows[0] ? parseInt(myDocsRes.rows[0].total, 10) : 0,
                    rata_rata_feedback: myFeedbackRes.rows[0] && myFeedbackRes.rows[0].rata_rata ? parseFloat(myFeedbackRes.rows[0].rata_rata) : 0,
                    total_feedback_saya: myFeedbackRes.rows[0] ? parseInt(myFeedbackRes.rows[0].total_feedback, 10) : 0
                }
            }
        });
    } catch (error) {
        console.error("Error pada getDashboardSummary:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal memuat data dashboard Kepsek.",
            error: error.message,
            data: null
        });
    }
};

// =========================================================================
// STATISTIK GENERATE SEMUA USER (KEPSEK VIEW)
// =========================================================================
const getKepsekGenerateStats = async (req, res) => {
    try {
        const { rows: breakdown } = await db.query(`
            SELECT
                gr.feature_type,
                COUNT(*)::int                                               AS total,
                COUNT(CASE WHEN gr.status = 'completed' THEN 1 END)::int  AS berhasil,
                COUNT(CASE WHEN gr.status = 'failed'    THEN 1 END)::int  AS gagal,
                ROUND(AVG(gr.processing_time_ms))::int                     AS avg_ms
            FROM generation_requests gr
            WHERE gr.created_at >= date_trunc('month', NOW())
            GROUP BY gr.feature_type
            ORDER BY total DESC
        `);

        const { rows: totalRow } = await db.query(`
            SELECT COUNT(*)::int AS total
            FROM generation_requests
            WHERE created_at >= date_trunc('month', NOW())
        `);

        const { rows: perGuru } = await db.query(`
            SELECT
                u.nama_lengkap,
                u.role,
                COUNT(gr.id)::int AS total
            FROM generation_requests gr
            INNER JOIN users u ON u.id = gr.user_id
            WHERE gr.created_at >= date_trunc('month', NOW())
            GROUP BY u.id, u.nama_lengkap, u.role
            ORDER BY total DESC
            LIMIT 10
        `);

        return res.status(200).json({
            success: true,
            data: {
                total_bulan_ini: totalRow[0]?.total ?? 0,
                breakdown,
                top_users: perGuru,
            }
        });
    } catch (error) {
        console.error("Error getKepsekGenerateStats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================================
// SEMUA FEEDBACK (KEPSEK VIEW) — rating + komentar + nama pemberi
// =========================================================================
const getKepsekFeedbackStats = async (req, res) => {
    try {
        const { rows: list } = await db.query(`
            SELECT
                uf.id,
                uf.rating,
                uf.komentar,
                uf.is_helpful,
                uf.created_at,
                gr.feature_type,
                gr.input_data->>'topik'          AS topik,
                gr.input_data->>'mata_pelajaran'  AS mata_pelajaran,
                gr.input_data->>'jenis_konten'    AS jenis_konten,
                u.nama_lengkap                   AS nama_pemberi,
                u.role                           AS role_pemberi
            FROM user_feedback uf
            INNER JOIN generation_requests gr ON gr.id = uf.request_id
            INNER JOIN users u ON u.id = uf.user_id
            ORDER BY uf.created_at DESC
        `);

        const rataRow = await db.query(`
            SELECT
                ROUND(AVG(rating), 1)::float AS rata_rata,
                COUNT(*)::int                AS total
            FROM user_feedback
        `);

        return res.status(200).json({
            success: true,
            data: {
                rata_rata: rataRow.rows[0]?.rata_rata ?? null,
                total:     rataRow.rows[0]?.total     ?? 0,
                list,
            }
        });
    } catch (error) {
        console.error("Error getKepsekFeedbackStats:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================================
// AKTIVITAS TERBARU SEMUA USER (GURU + KEPSEK)
// =========================================================================
const getKepsekRecentActivity = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT
                gr.id            AS request_id,
                gr.feature_type,
                gr.status,
                gr.created_at,
                gr.input_data->>'topik'          AS topik,
                gr.input_data->>'mata_pelajaran'  AS mata_pelajaran,
                gr.input_data->>'jenis_konten'    AS jenis_konten,
                u.nama_lengkap   AS nama_user,
                u.role           AS role_user
            FROM generation_requests gr
            INNER JOIN users u ON u.id = gr.user_id
            ORDER BY gr.created_at DESC
            LIMIT 20
        `);

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error getKepsekRecentActivity:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =========================================================================
// 🌟 TAMBAHAN BARU: FITUR ANTRIAN & APPROVE GURU (AUTH VERIFIKASI)
// =========================================================================

// 1. Mengambil antrean guru yang daftar di madrasah milik kepsek tersebut
const getRegistrationQueue = async (req, res) => {
    try {
        const listGuru = await KepsekModel.getPendingTeachers();

        return res.status(200).json({
            success: true,
            message: "Berhasil memuat daftar antrean pendaftaran guru.",
            count: listGuru.length,
            data: listGuru
        });
    } catch (error) {
        console.error("Error pada getRegistrationQueue:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal memuat antrean verifikasi guru.",
            error: error.message
        });
    }
};

// 2. Mengeksekusi aksi klik tombol ACC (Approve) atau Tolak (Reject)
const reviewTeacherAccount = async (req, res) => {
    try {
        const { targetUserId, action } = req.body; // action diisi teks: 'approve' atau 'reject'

        if (!targetUserId || !action) {
            return res.status(400).json({ success: false, message: "ID Guru (targetUserId) dan Aksi (approve/reject) wajib diisi." });
        }

        // Skenario Aksi = APPROVE (ACC)
        if (action === 'approve') {
            const approvedGuru = await KepsekModel.approveTeacher(targetUserId);
            if (!approvedGuru) {
                return res.status(404).json({ success: false, message: "Data guru tidak ditemukan." });
            }

            // Set kuota free otomatis untuk guru baru yang di-approve
            const reset_date = new Date();
            reset_date.setMonth(reset_date.getMonth() + 1);
            await db.query(`
                INSERT INTO usage_quotas (id, user_id, plan_type, monthly_limit, used_this_month, reset_date)
                VALUES (gen_random_uuid(), $1, 'free', 100, 0, $2)
                ON CONFLICT (user_id) DO NOTHING
            `, [targetUserId, reset_date]);

            return res.status(200).json({
                success: true,
                message: `Sukses! Akun guru atas nama ${approvedGuru.nama_lengkap} telah di-ACC. Sekarang dia sudah bisa login.`,
                data: approvedGuru
            });
        }

        // Skenario Aksi = REJECT (TOLAK)
        if (action === 'reject') {
            const rejectedGuru = await KepsekModel.rejectTeacherTransaction(targetUserId);
            if (!rejectedGuru) {
                return res.status(404).json({ success: false, message: "Data guru tidak ditemukan." });
            }
            return res.status(200).json({
                success: true,
                message: `Pendaftaran ${rejectedGuru.nama_lengkap} berhasil ditolak dan dihapus dari sistem.`,
                data: rejectedGuru
            });
        }

        return res.status(400).json({ success: false, message: "Aksi tidak valid! Gunakan kata 'approve' atau 'reject'." });

    } catch (error) {
        console.error("Error pada reviewTeacherAccount:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat memproses verifikasi.",
            error: error.message
        });
    }
};

// 3. Daftar guru aktif
const getDaftarGuru = async (req, res) => {
    try {
        // Coba ambil instansi_id kepsek dari DB
        const kepsekProfile = await db.query(
            'SELECT instansi_id FROM user_profiles WHERE user_id = $1',
            [req.user.id]
        );
        const instansiId = kepsekProfile.rows[0]?.instansi_id
            || req.query.instansi_id
            || null;

        // Jika instansiId tersedia → filter per madrasah, jika tidak → tampilkan semua guru aktif
        let query, params;
        if (instansiId) {
            query = `
                SELECT 
                    u.id, u.nama_lengkap, u.email, u.avatar_url, u.is_active,
                    u.created_at, u.last_login_at,
                    p.nip, p.mata_pelajaran, p.jenjang, p.kurikulum, p.no_hp,
                    p.instansi_id,
                    COALESCE(uq.used_this_month, 0) AS total_generate_bulan_ini,
                    COALESCE(uq.monthly_limit, 100) AS monthly_limit,
                    COALESCE(uq.plan_type, 'free') AS plan_type
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN usage_quotas uq ON u.id = uq.user_id
                WHERE u.role = 'guru'
                    AND u.is_active = true
                    AND (p.instansi_id = $1 OR p.instansi_id IS NULL)
                ORDER BY u.nama_lengkap ASC
            `;
            params = [instansiId];
        } else {
            query = `
                SELECT 
                    u.id, u.nama_lengkap, u.email, u.avatar_url, u.is_active,
                    u.created_at, u.last_login_at,
                    p.nip, p.mata_pelajaran, p.jenjang, p.kurikulum, p.no_hp,
                    p.instansi_id,
                    COALESCE(uq.used_this_month, 0) AS total_generate_bulan_ini,
                    COALESCE(uq.monthly_limit, 100) AS monthly_limit,
                    COALESCE(uq.plan_type, 'free') AS plan_type
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN usage_quotas uq ON u.id = uq.user_id
                WHERE u.role = 'guru'
                    AND u.is_active = true
                ORDER BY u.nama_lengkap ASC
            `;
            params = [];
        }

        const { rows } = await db.query(query, params);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat daftar guru aktif.",
            data: rows,
            meta: { total: rows.length, instansi_id: instansiId }
        });
    } catch (error) {
        console.error('Error getDaftarGuru:', error);
        return res.status(500).json({ success: false, message: "Gagal memuat daftar guru.", error: error.message, data: [], meta: {} });
    }
};

// 4. Detail satu guru
const getDetailGuru = async (req, res) => {
    try {
        const { guruId } = req.params;

        const { rows } = await db.query(`
            SELECT 
                u.id, u.nama_lengkap, u.email, u.avatar_url, u.is_active,
                u.created_at, u.last_login_at,
                p.nip, p.mata_pelajaran, p.jenjang, p.kurikulum, p.no_hp, p.instansi_id,
                COALESCE(uq.used_this_month, 0) AS total_generate_bulan_ini,
                COALESCE(uq.monthly_limit, 100) AS monthly_limit,
                COALESCE(uq.plan_type, 'free') AS plan_type
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN usage_quotas uq ON u.id = uq.user_id
            WHERE u.id = $1 AND u.role = 'guru'
        `, [guruId]);

        const guru = rows[0];
        if (!guru) {
            return res.status(404).json({ success: false, message: "Guru tidak ditemukan.", data: null });
        }
        return res.status(200).json({ success: true, message: "Berhasil memuat detail guru.", data: guru });
    } catch (error) {
        console.error('Error getDetailGuru:', error);
        return res.status(500).json({ success: false, message: "Gagal memuat detail guru.", error: error.message, data: null });
    }
};

// 5. History semua guru
const getHistoryAllGuru = async (req, res) => {
    try {
        const instansiId = req.user?.instansi_id || req.query.instansi_id || req.body.instansi_id;
        const featureType = req.query.feature_type || null;
        const history = await KepsekModel.getHistoryAllGuru(instansiId, featureType);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat history generate semua guru.",
            data: history,
            meta: { total: history.length, filter_feature: featureType || 'semua' }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat history.", error: error.message, data: null, meta: {} });
    }
};

// 6. History satu guru
const getHistoryByGuru = async (req, res) => {
    try {
        const { guruId } = req.params;
        const instansiId = req.user?.instansi_id || req.query.instansi_id || req.body.instansi_id;
        const history = await KepsekModel.getHistoryByGuru(guruId, instansiId);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat history guru.",
            data: history,
            meta: { total: history.length }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat history guru.", error: error.message, data: null, meta: {} });
    }
};

// 7. Statistik per guru
const getStatistikGuru = async (req, res) => {
    try {
        const instansiId = req.user?.instansi_id || req.query.instansi_id || req.body.instansi_id;
        const statistik = await KepsekModel.getStatistikGuru(instansiId);
        return res.status(200).json({
            success: true,
            message: "Berhasil memuat statistik guru.",
            data: statistik,
            meta: { total_guru: statistik.length }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal memuat statistik.", error: error.message, data: null, meta: {} });
    }
};

// 8. ALOKASI KUOTA AI GURU (KLOP SKEMA USAGE_QUOTAS)
const assignQuotaToTeacher = async (req, res) => {
    try {
        const { user_id, plan_type, monthly_limit } = req.body;

        // 1. Validasi Input Wajib (Sesuai kolom NOT NULL kamu)
        if (!user_id || !plan_type || !monthly_limit) {
            return res.status(400).json({
                success: false,
                message: "user_id, plan_type, dan monthly_limit wajib diisi."
            });
        }

        // 2. Validasi ENUM plan_type agar aman dari error DB
        const validPlans = ['free', 'basic', 'premium'];
        if (!validPlans.includes(plan_type)) {
            return res.status(400).json({
                success: false,
                message: "plan_type harus bernilai 'free', 'basic', atau 'premium'."
            });
        }

        // 3. Hitung reset_date otomatis (1 bulan dari hari ini)
        const reset_date = new Date();
        reset_date.setMonth(reset_date.getMonth() + 1);

        // 4. Kirim data ke Model (UPSERT)
        const updatedQuota = await KepsekModel.upsertTeacherQuota({
            user_id,
            plan_type,
            monthly_limit: parseInt(monthly_limit, 10),
            reset_date
        });

        return res.status(200).json({
            success: true,
            message: "Kuota berhasil dialokasikan untuk guru.",
            data: updatedQuota
        });

    } catch (error) {
        console.error("Error pada kepsekController.assignQuotaToTeacher:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat mengatur kuota.",
            error: error.message
        });
    }
};

// =========================================================================
// CRUD GURU OLEH KEPSEK
// =========================================================================

// UPDATE semua data guru (nama, email, nip, mapel, jenjang, kurikulum, no_hp)
const updateGuru = async (req, res) => {
    const { guruId } = req.params;
    const { nama_lengkap, email, nip, mata_pelajaran, jenjang, kurikulum, no_hp } = req.body;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        if (!nama_lengkap) {
            return res.status(400).json({ success: false, message: 'nama_lengkap wajib diisi.' });
        }

        // Cek email duplikat jika email berubah
        if (email) {
            const emailCheck = await client.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, guruId]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'Email sudah dipakai guru lain.' });
            }
        }

        // Update tabel users
        await client.query(
            'UPDATE users SET nama_lengkap = $1, email = COALESCE($2, email) WHERE id = $3 AND role = \'guru\'',
            [nama_lengkap, email || null, guruId]
        );

        // Upsert user_profiles
        const mapelArr = Array.isArray(mata_pelajaran)
            ? mata_pelajaran
            : (mata_pelajaran ? [mata_pelajaran] : null);

        const existing = await client.query('SELECT id FROM user_profiles WHERE user_id = $1', [guruId]);
        if (existing.rows.length > 0) {
            await client.query(
                'UPDATE user_profiles SET nip=$1, mata_pelajaran=$2, jenjang=$3, kurikulum=$4, no_hp=$5 WHERE user_id=$6',
                [nip || null, mapelArr, jenjang || null, kurikulum || null, no_hp || null, guruId]
            );
        } else {
            await client.query(
                'INSERT INTO user_profiles (id, user_id, nip, mata_pelajaran, jenjang, kurikulum, no_hp) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)',
                [guruId, nip || null, mapelArr, jenjang || null, kurikulum || null, no_hp || null]
            );
        }

        await client.query('COMMIT');

        // Ambil data terbaru
        const updated = await db.query(`
            SELECT u.id, u.nama_lengkap, u.email, u.is_active,
                   p.nip, p.mata_pelajaran, p.jenjang, p.kurikulum, p.no_hp,
                   COALESCE(uq.plan_type, 'free') AS plan_type,
                   COALESCE(uq.monthly_limit, 100) AS monthly_limit,
                   COALESCE(uq.used_this_month, 0) AS used_this_month
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN usage_quotas uq ON u.id = uq.user_id
            WHERE u.id = $1
        `, [guruId]);

        return res.json({ success: true, message: 'Data guru berhasil diperbarui.', data: updated.rows[0] });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error updateGuru:', e);
        return res.status(500).json({ success: false, message: e.message });
    } finally {
        client.release();
    }
};

// RESET/UBAH PASSWORD GURU
const resetGuruPassword = async (req, res) => {
    const { guruId } = req.params;
    const { password_baru } = req.body;
    try {
        if (!password_baru || password_baru.length < 6) {
            return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
        }

        const hash = await bcrypt.hash(password_baru, 10);
        const result = await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 AND role = \'guru\' RETURNING id, nama_lengkap',
            [hash, guruId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ success: false, message: 'Guru tidak ditemukan.' });
        }

        return res.json({ success: true, message: `Password guru ${result.rows[0].nama_lengkap} berhasil direset.` });
    } catch (e) {
        console.error('Error resetGuruPassword:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
};

// HAPUS GURU
const deleteGuru = async (req, res) => {
    const { guruId } = req.params;
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Cek guru ada
        const check = await client.query(
            'SELECT id, nama_lengkap FROM users WHERE id = $1 AND role = \'guru\'',
            [guruId]
        );
        if (!check.rows[0]) {
            return res.status(404).json({ success: false, message: 'Guru tidak ditemukan.' });
        }
        const namaGuru = check.rows[0].nama_lengkap;

        // Hapus data terkait secara berurutan (foreign key)
        await client.query('DELETE FROM usage_quotas WHERE user_id = $1', [guruId]);
        await client.query('DELETE FROM user_sessions WHERE user_id = $1', [guruId]);
        await client.query('DELETE FROM user_profiles WHERE user_id = $1', [guruId]);
        await client.query('DELETE FROM users WHERE id = $1', [guruId]);

        await client.query('COMMIT');
        return res.json({ success: true, message: `Guru ${namaGuru} berhasil dihapus dari sistem.` });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error deleteGuru:', e);
        return res.status(500).json({ success: false, message: e.message });
    } finally {
        client.release();
    }
};

// UBAH PLAN_TYPE GURU (free/basic/premium) DAN LIMIT KUOTA
const PLAN_LIMITS = { free: 100, basic: 150, premium: 200 };

const updateGuruPlan = async (req, res) => {
    const { guruId } = req.params;
    const { plan_type } = req.body;

    const validPlans = ['free', 'basic', 'premium'];
    if (!validPlans.includes(plan_type)) {
        return res.status(400).json({ success: false, message: 'plan_type harus free, basic, atau premium.' });
    }

    try {
        const monthly_limit = PLAN_LIMITS[plan_type];

        // reset_date = 1 bulan dari sekarang
        const reset_date = new Date();
        reset_date.setMonth(reset_date.getMonth() + 1);

        const result = await db.query(`
            INSERT INTO usage_quotas (id, user_id, plan_type, monthly_limit, used_this_month, reset_date)
            VALUES (gen_random_uuid(), $1, $2, $3, 0, $4)
            ON CONFLICT (user_id)
            DO UPDATE SET
                plan_type        = EXCLUDED.plan_type,
                monthly_limit    = EXCLUDED.monthly_limit,
                used_this_month  = 0,
                reset_date       = EXCLUDED.reset_date
            RETURNING *
        `, [guruId, plan_type, monthly_limit, reset_date]);

        return res.json({
            success: true,
            message: `Plan guru berhasil diubah ke ${plan_type}. Kuota direset menjadi 0/${monthly_limit}.`,
            data: result.rows[0],
        });
    } catch (e) {
        console.error('Error updateGuruPlan:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
};

// Pastikan semua fungsi diekspor di sini agar bisa dipanggil oleh Routes
module.exports = {
    getDashboardSummary,
    getRegistrationQueue,
    reviewTeacherAccount,
    getDaftarGuru,
    getDetailGuru,
    getHistoryAllGuru,
    getHistoryByGuru,
    getStatistikGuru,
    assignQuotaToTeacher,
    updateGuru,
    resetGuruPassword,
    deleteGuru,
    updateGuruPlan,
    getKepsekGenerateStats,
    getKepsekFeedbackStats,
    getKepsekRecentActivity,
};
