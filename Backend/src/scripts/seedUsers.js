require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seedUsers() {
  try {
    console.log('Membuat user demo...');

    const saltRounds = 10;

    // Hash password
    const adminPass = await bcrypt.hash('admin1234', saltRounds);
    const guruPass = await bcrypt.hash('guru1234', saltRounds);

    // Insert kepala sekolah
    await pool.query(`
      INSERT INTO users (nama_lengkap, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Dr. H. Mahmud Siregar, M.Pd.', 'kepala@madrasah.id', adminPass, 'kepala_sekolah', true]);

    const zamiPass = await bcrypt.hash('zami1234', saltRounds);
    const sharfinaPass = await bcrypt.hash('sharfina1234', saltRounds);

    // Insert guru lama
    await pool.query(`
      INSERT INTO users (nama_lengkap, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Ust. Ahmad Fauzi, S.Pd.I.', 'ustadz@madrasah.id', guruPass, 'guru', true]);

    // Insert guru Zami
    await pool.query(`
      INSERT INTO users (nama_lengkap, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Zami', 'zami@madrasah.id', zamiPass, 'guru', true]);

    // Insert guru Sharfina
    await pool.query(`
      INSERT INTO users (nama_lengkap, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['Sharfina', 'sharfina@madrasah.id', sharfinaPass, 'guru', true]);

    console.log('✅ User demo berhasil dibuat!');
    console.log('   👑 kepala@madrasah.id / admin1234');
    console.log('   🧑‍🏫 ustadz@madrasah.id / guru1234');
    console.log('   🧑‍🏫 zami@madrasah.id / zami1234');
    console.log('   🧑‍🏫 sharfina@madrasah.id / sharfina1234');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedUsers();
