const { v4: uuidv4 } = require('uuid');
const AcademicContentModel = require('../../models/content/academicContentModel');
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { generateAcademicContentPDF } = require('../../utils/pdfGenerator');

// Inisialisasi Groq menggunakan API Key
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to map jenis_konten to valid academic_content_type enum in DB
const mapJenisKonten = (jenis) => {
    if (!jenis) return 'penjelasan';
    const normalized = jenis.toLowerCase().trim();
    if (normalized === 'materi pembelajaran' || normalized === 'materi_pembelajaran' || normalized === 'penjelasan' || normalized === 'materi') {
        return 'penjelasan';
    }
    if (normalized === 'ringkasan' || normalized === 'ringkasan materi') {
        return 'ringkasan';
    }
    if (normalized === 'contoh soal' || normalized === 'contoh_soal' || normalized === 'soal') {
        return 'contoh_soal';
    }
    if (normalized === 'kamus' || normalized === 'kamus istilah') {
        return 'kamus';
    }
    if (normalized === 'artikel') {
        return 'artikel';
    }
    
    const validTypes = ['ringkasan', 'penjelasan', 'contoh_soal', 'kamus', 'artikel'];
    if (validTypes.includes(normalized)) {
        return normalized;
    }
    return 'penjelasan';
};

// Helper to map panjang to valid content_length enum in DB
const mapPanjangKonten = (panjang) => {
    if (!panjang) return 'sedang';
    const normalized = panjang.toLowerCase().trim();
    if (normalized === 'singkat' || normalized === 'short') {
        return 'singkat';
    }
    if (normalized === 'sedang' || normalized === 'medium') {
        return 'sedang';
    }
    if (normalized === 'panjang' || normalized === 'long') {
        return 'panjang';
    }
    
    const validLengths = ['singkat', 'sedang', 'panjang'];
    if (validLengths.includes(normalized)) {
        return normalized;
    }
    return 'sedang';
};

const generateAcademicContent = async (req, res) => {
    const requestId = uuidv4();
    const contentId = uuidv4();

    try {
        const {
            jenis_konten, topik, mapel, kelas, panjang, bahasa, gaya_bahasa, userId
        } = req.body;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';
        const mappedJenis = mapJenisKonten(jenis_konten);
        const mappedPanjang = mapPanjangKonten(panjang);

        // 1. Log Request ke Database
        await AcademicContentModel.createRequest(requestId, finalUserId, {
            jenis_konten: mappedJenis, topik, mapel, kelas, panjang: mappedPanjang, bahasa, gaya_bahasa
        });

        // 2. Panggil Groq AI Llama 3.3

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

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah asisten pembuat materi akademik yang ahli. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });
        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // 3. Simpan ke Database
        const contentData = {
            id: contentId,
            request_id: requestId,
            jenis_konten: mappedJenis,
            topik: topik,
            mata_pelajaran: mapel,
            tingkat_kelas: kelas,
            panjang_konten: mappedPanjang,
            content_json: aiResponse
        };

        const savedContent = await AcademicContentModel.saveAcademicContent(contentData);

        // 4. Update Status Request
        await AcademicContentModel.updateRequestStatus(requestId, 'completed', savedContent);

        res.status(201).json({
            success: true,
            message: "Konten akademik berhasil dibuat dengan Groq Llama 3.3.",
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

const downloadAcademicContentPDF = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data dari database
        const contentData = await AcademicContentModel.getAcademicContentById(id);
        
        if (!contentData) {
            return res.status(404).json({
                success: false,
                message: "Konten akademik tidak ditemukan"
            });
        }

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate PDF
        const fileName = `academic_content_${id}.pdf`;
        const filePath = path.join(tempDir, fileName);
        
        await generateAcademicContentPDF(contentData, filePath);

        // Download file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
            }
            // Hapus file setelah download
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({
            success: false,
            message: "Gagal generate PDF",
            error: error.message
        });
    }
};

module.exports = { generateAcademicContent, getAcademicContents, downloadAcademicContentPDF };
