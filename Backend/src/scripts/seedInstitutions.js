require('dotenv').config();
const pool = require('../config/db');

async function seedInstitutions() {
  try {
    console.log('Membuat data madrasah...');

    const institutions = [
      { nama: 'MTs Negeri 1 Jakarta', npsn: '20100001', jenis: 'MTs', alamat: 'Jl. Raya Bogor No. 1', kota: 'Jakarta', provinsi: 'DKI Jakarta' },
      { nama: 'MTs Al-Hikmah Bandung', npsn: '20100002', jenis: 'MTs', alamat: 'Jl. Soekarno Hatta No. 10', kota: 'Bandung', provinsi: 'Jawa Barat' },
      { nama: 'MA Negeri 2 Surabaya', npsn: '20100003', jenis: 'MA', alamat: 'Jl. Ahmad Yani No. 5', kota: 'Surabaya', provinsi: 'Jawa Timur' },
      { nama: 'MI Darul Ulum Yogyakarta', npsn: '20100004', jenis: 'MI', alamat: 'Jl. Malioboro No. 20', kota: 'Yogyakarta', provinsi: 'DI Yogyakarta' },
      { nama: 'MTs Nurul Huda Semarang', npsn: '20100005', jenis: 'MTs', alamat: 'Jl. Pemuda No. 15', kota: 'Semarang', provinsi: 'Jawa Tengah' },
      { nama: 'MA Al-Azhar Medan', npsn: '20100006', jenis: 'MA', alamat: 'Jl. Gatot Subroto No. 8', kota: 'Medan', provinsi: 'Sumatera Utara' },
      { nama: 'MI Islamiyah Makassar', npsn: '20100007', jenis: 'MI', alamat: 'Jl. Sultan Hasanuddin No. 3', kota: 'Makassar', provinsi: 'Sulawesi Selatan' },
      { nama: 'MTs Darussalam Palembang', npsn: '20100008', jenis: 'MTs', alamat: 'Jl. Sudirman No. 12', kota: 'Palembang', provinsi: 'Sumatera Selatan' },
    ];

    for (const inst of institutions) {
      await pool.query(`
        INSERT INTO institutions (nama, npsn, jenis, alamat, kota, provinsi)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (npsn) DO NOTHING
      `, [inst.nama, inst.npsn, inst.jenis, inst.alamat, inst.kota, inst.provinsi]);
    }

    console.log('✅ Data madrasah berhasil dibuat!');
    institutions.forEach(i => console.log(`   🏫 ${i.nama} (${i.jenis}) - ${i.kota}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedInstitutions();
