/**
 * scheduler.js
 * Auto-reset kuota generate guru setiap bulan.
 *
 * Cara kerja:
 * - Cron berjalan setiap hari tengah malam (00:00)
 * - Cek baris usage_quotas yang reset_date-nya sudah lewat (≤ hari ini)
 * - Reset used_this_month = 0 dan geser reset_date +1 bulan ke depan
 */

const cron = require('node-cron');
const db   = require('./config/db');

// Jalankan setiap hari pukul 00:00 untuk mengecek kuota yang perlu direset
cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Menjalankan pengecekan reset kuota bulanan...');
    try {
        const result = await db.query(`
            UPDATE usage_quotas
            SET
                used_this_month = 0,
                reset_date      = reset_date + INTERVAL '1 month'
            WHERE reset_date <= NOW()
            RETURNING user_id, plan_type, monthly_limit, reset_date
        `);

        if (result.rows.length > 0) {
            console.log(`[Scheduler] ✅ Kuota direset untuk ${result.rows.length} guru.`);
        } else {
            console.log('[Scheduler] Tidak ada kuota yang perlu direset hari ini.');
        }
    } catch (error) {
        console.error('[Scheduler] ❌ Gagal mereset kuota:', error.message);
    }
}, {
    timezone: 'Asia/Jakarta',
});

console.log('[Scheduler] Auto-reset kuota bulanan aktif (setiap hari 00:00 WIB).');
