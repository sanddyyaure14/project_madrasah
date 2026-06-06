const jwt = require('jsonwebtoken');

/**
 * Middleware: Verifikasi JWT Access Token
 */
const verifyToken = (req, res, next) => {

    // 1. Coba ambil dari Authorization Header
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    // 2. Jika tidak ada, coba ambil dari query parameter
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token tidak ditemukan. Silakan login terlebih dahulu.'
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'DEFAULT_ACCESS_SECRET_KEY'
        );

        req.user = decoded;
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

module.exports = {
    verifyToken,
    authorizeRoles
};