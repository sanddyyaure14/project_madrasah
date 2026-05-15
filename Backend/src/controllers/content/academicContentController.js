const { v4: uuidv4 } = require('uuid');
const AcademicContentModel = require('../../models/content/academicContentModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inisialisasi Gemini menggunakan API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateAcademicContent = async (req, res) => {
    const requestId = uuidv4();
    const contentId = uuidv4();

    try {
        const {
            jenis_konten, topik, mapel, kelas, panjang, bahasa, gaya_bahasa, userId
        } = req.body;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        // 1. Log Request ke Database
        await AcademicContentModel.createRequest(requestId, finalUserId, {
            jenis_konten, topik, mapel, kelas, panjang, bahasa, gaya_bahasa
        });

        // 2. Panggil Gemini (Menggunakan model gemini-2.5-flash)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `Anda adalah asisten pembuat materi akademik yang ahli. Buatlah konten dengan spesifikasi berikut:
Jenis Konten: ${jenis_konten}
Topik: "${topik}"
Mata Pelajaran: ${mapel || 'Umum'}
Target Kelas: ${kelas || 'Umum'}
Panjang Konten: ${panjang || 'sedang'}
Bahasa: ${bahasa || 'Indonesia'}
Gaya Bahasa: ${gaya_bahasa || 'Akademik dan Informatif'}

Anda wajib memberikan respon dalam format JSON murni dengan struktur berikut:
{
    "judul": "Judul Konten",
    "konten": "Isi materi akademik secara detail sesuai panjang konten yang diminta. Boleh mengandung format teks jika diperlukan.",
    "ringkasan": "Ringkasan singkat dari konten tersebut",
    "kata_kunci": ["kata1", "kata2", "kata3"],
    "referensi": ["referensi 1", "referensi 2"]
}`;

        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();
        const aiResponse = JSON.parse(aiResponseText);

        // 3. Simpan ke Database
        const contentData = {
            id: contentId,
            request_id: requestId,
            jenis_konten: jenis_konten,
            topik: topik,
            mata_pelajaran: mapel,
            tingkat_kelas: kelas,
            panjang_konten: panjang,
            content_json: aiResponse
        };

        const savedContent = await AcademicContentModel.saveAcademicContent(contentData);

        // 4. Update Status Request
        await AcademicContentModel.updateRequestStatus(requestId, 'completed', savedContent);

        res.status(201).json({
            success: true,
            message: "Konten akademik berhasil dibuat dengan Gemini AI.",
            data: savedContent
        });

    } catch (error) {
        console.error("Error Detail:", error);

        try {
            await AcademicContentModel.updateRequestStatus(requestId, 'failed', { error: error.message });
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

const getAcademicContents = async (req, res) => {
    try {
        const data = await AcademicContentModel.getAllAcademicContents();
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data konten akademik.",
            data: data
        });
    } catch (error) {
        console.error("Error fetching academic contents:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data konten akademik dari server.",
            error: error.message
        });
    }
};

module.exports = { generateAcademicContent, getAcademicContents };
