const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

const authController = {
    // 1. LOGIKA DROPDOWN SEKOLAH
    getDropdownInstitutions: async (req, res) => {
        try {
            const institutions = await AuthModel.getInstitutions();
            return res.status(200).json({
                success: true,
                message: "Daftar madrasah berhasil dimuat untuk dropdown.",
                data: institutions
            });
        } catch (error) {
            console.error("Error get institutions dropdown:", error);
            return res.status(500).json({ success: false, message: "Gagal memuat daftar sekolah." });
        }
    },

    // 2. LOGIKA REGISTRASI GURU
    register: async (req, res) => {
        try {
            const { 
                nama_lengkap, email, password, nip, 
                mata_pelajaran, jenjang, kurikulum, no_hp, instansi_id 
            } = req.body;

            // Validasi Input Wajib
            if (!nama_lengkap || !email || !password) {
                return res.status(400).json({ success: false, message: "Nama lengkap, email, dan password wajib diisi." });
            }

            // Validasi duplikasi email
            const emailTerpakai = await AuthModel.findByEmail(email);
            if (emailTerpakai) {
                return res.status(400).json({ success: false, message: "Email sudah terdaftar di sistem." });
            }

            // Enkripsi Password menggunakan bcrypt
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);

            // Bungkus data registrasi
            const userData = { nama_lengkap, email, password_hash: passwordHash };
            const profileData = {
                nip,
                // Pastikan input mata_pelajaran terkirim sebagai Array teks []
                mata_pelajaran: Array.isArray(mata_pelajaran) ? mata_pelajaran : [mata_pelajaran],
                jenjang,
                kurikulum,
                no_hp,
                instansi_id
            };

            // Simpan serentak ke DB via transaksi model
            const newTeacher = await AuthModel.registerTeacherTransaction(userData, profileData);

            // Berikan response sukses lengkap dengan ringkasan datanya untuk di layar guru
            return res.status(201).json({
                success: true,
                message: "Registrasi berhasil! Akun Anda sedang menunggu verifikasi oleh Kepala Sekolah.",
                data: {
                    id: newTeacher.id,
                    nama_lengkap: newTeacher.nama_lengkap,
                    email: newTeacher.email,
                    role: newTeacher.role,
                    is_active: newTeacher.is_active,
                    nip: nip || null,
                    mata_pelajaran: profileData.mata_pelajaran,
                    jenjang: jenjang || null,
                    kurikulum: kurikulum || null,
                    no_hp: no_hp || null,
                    instansi_id: instansi_id || null
                }
            });

        } catch (error) {
            console.error("Error pada proses registrasi:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat registrasi.", error: error.message });
        }
    },

    // 3. LOGIKA LOGIN GURU / ADMIN / KEPSEK
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ success: false, message: "Email dan password wajib diisi." });
            }

            // Cek keberadaan user berdasarkan email
            const user = await AuthModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: "Email atau password salah." });
            }

            // Cocokkan hash password menggunakan bcrypt.compare
            const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordMatch) {
                return res.status(401).json({ success: false, message: "Email atau password salah." });
            }

            // 🛑 SELEKSI SAKELAR AKTIF: Jika akun guru is_active masih false, kunci akses!
            if (user.is_active === false) {
                return res.status(403).json({
                    success: false,
                    message: "Login ditolak. Akun Anda masih dalam antrean peninjauan oleh Admin atau Kepala Sekolah."
                });
            }

            // Generate JWT (Access Token & Refresh Token sesuai alur gambar kamu)
            const accessToken = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'DEFAULT_ACCESS_SECRET_KEY',
                { expiresIn: '15m' }
            );
            const refreshToken = jwt.sign(
                { id: user.id },
                process.env.JWT_REFRESH_SECRET || 'DEFAULT_REFRESH_SECRET_KEY',
                { expiresIn: '7d' }
            );

            // Tangkap metadata jaringan untuk tabel user_sessions
            const ip_address = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
            const user_agent = req.headers['user-agent'] || 'Unknown Browser';
            
            // Atur waktu kedaluwarsa session di DB (7 hari)
            const expires_at = new Date();
            expires_at.setDate(expires_at.getDate() + 7);

            // Catat log session baru ke database
            await AuthModel.createSession({
                user_id: user.id,
                refresh_token: refreshToken,
                ip_address: ip_address,
                user_agent: user_agent,
                expires_at: expires_at
            });

            // Update record login terakhir di profil user
            await AuthModel.updateLastLogin(user.id);

            // Kirim Refresh Token di dalam HttpOnly Cookie (Proteksi XSS)
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari dalam milidetik
            });

            // Kirim Access Token ke client/Postman
            return res.status(200).json({
                success: true,
                message: "Login sukses! Selamat datang kembali.",
                accessToken,
                user: {
                    id: user.id,
                    nama_lengkap: user.nama_lengkap,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error("Error pada proses login:", error);
            return res.status(500).json({ success: false, message: "Terjadi kesalahan server saat login.", error: error.message });
        }
    }
};

module.exports = authController;