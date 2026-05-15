const { v4: uuidv4 } = require('uuid');
const PresentationModel = require('../../models/content/presentationModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Gemini menggunakan API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        // 2. Panggil Gemini (Menggunakan model gemini-2.5-flash)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `Anda adalah asisten pembuat materi presentasi yang ahli. Buatlah presentasi sebanyak ${jumlah_slide} slide tentang topik: "${topik}".
Tujuan presentasi: ${tujuan || 'Edukasi / Penjelasan umum'}.
Target Audiens: ${audiens || 'Umum'}.
Sertakan catatan presenter: ${include_catatan ? 'Ya' : 'Tidak'}.

Anda wajib memberikan respon dalam format JSON murni dengan struktur berikut:
{
    "slides_json": [
        {
            "slide_number": 1,
            "title": "Judul Slide",
            "content": ["Poin 1", "Poin 2", "Poin 3"]${include_catatan ? ',\n            "catatan": "Catatan untuk presenter saat menjelaskan slide ini"' : ''}
        }
    ]
}`;

        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();
        const aiResponse = JSON.parse(aiResponseText);

        // 3. Simpan ke Database
        const presentationData = {
            id: presentationId,
            request_id: requestId,
            topik: topik,
            jumlah_slide: aiResponse.slides_json.length,
            tujuan: tujuan || null,
            audiens: audiens || null,
            slides_json: aiResponse.slides_json,
            include_catatan: include_catatan || false
        };

        const savedPresentation = await PresentationModel.savePresentation(presentationData);

        // 4. Update Status Request
        await PresentationModel.updateRequestStatus(requestId, 'completed', savedPresentation);

        res.status(201).json({
            success: true,
            message: "Presentasi berhasil dibuat dengan Gemini AI.",
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
            message: "Terjadi kesalahan pada proses AI atau Database",
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
