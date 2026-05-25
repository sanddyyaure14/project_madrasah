const jwt = require('jsonwebtoken');

/**
 * Middleware: Verifikasi JWT Access Token
 * Menyuntikkan req.user = { id, role } jika token valid
 */
const verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

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
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Akses ditolak. Fitur ini hanya untuk: ${roles.join(', ')}.`
            });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRoles };
