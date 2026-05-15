const { v4: uuidv4 } = require('uuid');
const PresentationModel = require('../../models/content/presentationModel');

const generatePresentation = async (req, res) => {
    const requestId = uuidv4();
    const presentationId = uuidv4();

    try {
        const {
            topik, jumlah_slide, tujuan, audiens, include_catatan, userId
        } = req.body;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        // 1. Log Request ke Database
        await PresentationModel.createRequest(requestId, finalUserId, {
            topik, jumlah_slide, tujuan, audiens, include_catatan
        });

        // 2. Buat Data Dummy / Template (Tanpa AI)
        const totalSlides = jumlah_slide || 5; // Default 5 slide jika tidak diisi
        const dummySlides = [];

        for (let i = 1; i <= totalSlides; i++) {
            const slide = {
                slide_number: i,
                title: `Slide Ke-${i}: ${topik}`,
                content: [
                    "Poin materi pertama (Dummy)",
                    "Poin materi kedua (Dummy)",
                    "Poin materi ketiga (Dummy)"
                ]
            };

            // Tambahkan catatan jika diminta
            if (include_catatan) {
                slide.catatan = `Catatan untuk guru saat menjelaskan slide ke-${i} tentang ${topik}.`;
            }

            dummySlides.push(slide);
        }

        // 3. Simpan ke Database
        const presentationData = {
            id: presentationId,
            request_id: requestId,
            topik: topik,
            jumlah_slide: dummySlides.length,
            tujuan: tujuan || null,
            audiens: audiens || null,
            slides_json: dummySlides,
            include_catatan: include_catatan || false
        };

        const savedPresentation = await PresentationModel.savePresentation(presentationData);

        // 4. Update Status Request
        await PresentationModel.updateRequestStatus(requestId, 'completed', savedPresentation);

        res.status(201).json({
            success: true,
            message: "Presentasi berhasil dibuat dengan data template/dummy (Tanpa AI).",
            data: savedPresentation
        });

    } catch (error) {
        console.error("Error Detail:", error);

        try {
            await PresentationModel.updateRequestStatus(requestId, 'failed', { error: error.message });
        } catch (dbErr) {
            console.error("Gagal update status fail ke DB");
        }

        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada Database",
            error: error.message
        });
    }
};

const getPresentations = async (req, res) => {
    try {
        const data = await PresentationModel.getAllPresentations();
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data presentasi.",
            data: data
        });
    } catch (error) {
        console.error("Error fetching presentations:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data presentasi dari server.",
            error: error.message
        });
    }
};

module.exports = { generatePresentation, getPresentations };
