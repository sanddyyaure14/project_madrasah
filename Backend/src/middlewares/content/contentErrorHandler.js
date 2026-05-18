const contentErrorHandler = (err, req, res, next) => {
    // Daftar awalan URL yang merupakan tanggung jawab kelompok Erridho & Afifah
    const contentRoutes = ['/api/presentation', '/api/syllabus', '/api/unit-plan', '/api/academic-content', '/api/library', '/api/admin'];

    // Cek apakah error berasal dari URL kita
    const isOurRoute = contentRoutes.some(route => req.originalUrl.includes(route));

    if (isOurRoute) {
        console.error(`[Content Team Error] ${req.method} ${req.originalUrl}:`, err);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan internal pada sistem Content/Library/Admin.",
            error: err.message
        });
    }

    // Jika error BUKAN dari URL kita (misal dari /api/generate-mc), lempar ke middleware berikutnya
    next(err);
};

module.exports = contentErrorHandler;
