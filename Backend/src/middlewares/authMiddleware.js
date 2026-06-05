const jwt = require('jsonwebtoken');

/**
 * Middleware: Verifikasi JWT Access Token
 * Menyuntikkan req.user = { id, role } jika token valid
 */
const verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization: Bearer <token>
    // atau dari query param ?token=<token> (untuk download file)
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const queryToken = req.query.token;
    const token = headerToken || queryToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token tidak ditemukan. Silakan login terlebih dahulu.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'DEFAULT_ACCESS_SECRET_KEY');
        req.user = decoded; // { id, role, iat, exp }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token sudah kedaluwarsa. Silakan login ulang.'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Token tidak valid atau telah dimanipulasi.'
        });
    }
};

/**
 * Middleware: Otorisasi berdasarkan Role
 * Gunakan setelah verifyToken
 * Contoh: authorizeRoles('guru', 'kepsek')
 * 
 * CATATAN: kepala_sekolah selalu diizinkan masuk ke semua endpoint
 * karena memiliki akses unlimited sebagai superadmin madrasah.
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. User tidak ditemukan.'
            });
        }
        // kepala_sekolah bypass semua role restriction — akses unlimited
        if (req.user.role === 'kepala_sekolah') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Akses ditolak. Fitur ini hanya untuk: ${roles.join(', ')}.`
            });
        }
        next();
    };
};

/**
 * Helper: Cek apakah user adalah kepala_sekolah (unlimited access)
 */
const isKepsek = (req) => req.user?.role === 'kepala_sekolah';

/**
 * Helper: Return kuota unlimited untuk kepala_sekolah
 */
const UNLIMITED_QUOTA = {
    plan_type: 'unlimited',
    monthly_limit: 9999,
    used_this_month: 0,
    remaining_quota: 9999,
    hasQuota: true,
    remaining: 9999,
    used: 0,
    limit: 9999,
};

module.exports = { verifyToken, authorizeRoles, isKepsek, UNLIMITED_QUOTA };
