const { v4: uuidv4 } = require('uuid');
const SyllabusModel = require('../../models/content/syllabusModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSyllabus = async (req, res) => {
    const requestId = uuidv4();
    const syllabusId = uuidv4();

    try {
        const {
            mata_pelajaran, kurikulum, jenjang, tingkat_kelas, semester, tahun_ajaran, userId
        } = req.body;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        // 1. Log Request ke Database-
        await SyllabusModel.createRequest(requestId, finalUserId, {
            mata_pelajaran, kurikulum, jenjang, tingkat_kelas, semester, tahun_ajaran
        });

        // 2. Panggil Gemini
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `Anda adalah seorang ahli penyusun kurikulum sekolah (Madrasah). Buatlah rancangan silabus terstruktur untuk:
Mata Pelajaran: ${mata_pelajaran}
Jenjang: ${jenjang}
Kelas: ${tingkat_kelas}
Semester: ${semester}
Kurikulum: ${kurikulum}

Anda WAJIB memberikan respons dalam format JSON murni dengan struktur berikut:
{
    "judul_silabus": "Silabus ${mata_pelajaran} Kelas ${tingkat_kelas} Semester ${semester}",
    "kompetensi_inti": ["Daftar kompetensi inti..."],
    "tabel_silabus": [
        {
            "minggu_ke": 1,
            "kompetensi_dasar": "...",
            "materi_pokok": "...",
            "kegiatan_pembelajaran": "...",
            "penilaian": "...",
            "alokasi_waktu": "...",
            "sumber_belajar": "..."
        }
    ]
}
Sertakan minimal 4 minggu kegiatan pembelajaran.`;

        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();
        const aiResponseJSON = JSON.parse(aiResponseText);

        // 3. Simpan ke Database
        const syllabusData = {
            id: syllabusId,
            request_id: requestId,
            mata_pelajaran,
            kurikulum,
            jenjang,
            tingkat_kelas,
            semester,
            tahun_ajaran,
            silabus_json: aiResponseJSON
        };

        const savedSyllabus = await SyllabusModel.saveSyllabus(syllabusData);

        // 4. Update Status Request
        await SyllabusModel.updateRequestStatus(requestId, 'completed', savedSyllabus);

        res.status(201).json({
            success: true,
            message: "Silabus berhasil dibuat dengan Gemini AI.",
            data: savedSyllabus
        });

    } catch (error) {
        console.error("Error Detail:", error);
        try {
            await SyllabusModel.updateRequestStatus(requestId, 'failed', { error: error.message });
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

const getSyllabi = async (req, res) => {
    try {
        const data = await SyllabusModel.getAllSyllabi();
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data silabus.",
            data: data
        });
    } catch (error) {
        console.error("Error fetching syllabi:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data silabus dari server.",
            error: error.message
        });
    }
};

module.exports = { generateSyllabus, getSyllabi };
