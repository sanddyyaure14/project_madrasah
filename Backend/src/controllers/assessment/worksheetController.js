const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const WorksheetModel = require('../../models/assessment/worksheetModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });



// POST - Generate worksheet baru

const generateWorksheet = async (req, res) => {
    const requestId = uuidv4();
    const worksheetId = uuidv4();

    try {
        const {
            mata_pelajaran,
            topik,
            tipe_aktivitas,
            tingkat_kelas,
            durasi_menit,
            tujuan_pembelajaran,
            header_sekolah,
            userId
        } = req.body;

        // Validasi input WAJIB
        if (!mata_pelajaran) {
            return res.status(400).json({ success: false, message: 'mata_pelajaran wajib diisi', data: null, meta: {} });
        }
        if (!topik) {
            return res.status(400).json({ success: false, message: 'topik wajib diisi', data: null, meta: {} });
        }
        if (!tipe_aktivitas || !Array.isArray(tipe_aktivitas) || tipe_aktivitas.length === 0) {
            return res.status(400).json({ success: false, message: 'tipe_aktivitas wajib diisi (contoh: ["isian", "esai"])', data: null, meta: {} });
        }
        if (!tingkat_kelas) {
            return res.status(400).json({ success: false, message: 'tingkat_kelas wajib diisi', data: null, meta: {} });
        }

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // 1. Log Request ke Database
        await WorksheetModel.createRequest(requestId, finalUserId, {
            mata_pelajaran, topik, tipe_aktivitas, tingkat_kelas,
            durasi_menit, tujuan_pembelajaran, header_sekolah
        });

        // 2. Panggil Groq AI
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah ahli pendidikan madrasah Indonesia yang membuat Lembar Kerja Siswa (LKS) detail dan siap cetak. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun."
                },
                {
                    role: "user",
                    content: `Buatlah Lembar Kerja Siswa (LKS) dengan ketentuan berikut:
- Mata Pelajaran: ${mata_pelajaran}
- Topik: ${topik}
- Tingkat Kelas: ${tingkat_kelas}
- Tipe Aktivitas: ${tipe_aktivitas.join(', ')}
${durasi_menit ? `- Durasi: ${durasi_menit} menit` : ''}
${tujuan_pembelajaran ? `- Tujuan Pembelajaran: ${tujuan_pembelajaran}` : ''}
${header_sekolah ? `- Header Sekolah: ${header_sekolah}` : ''}

Struktur JSON yang wajib diikuti:
{
    "judul": "judul LKS",
    "info": {
        "mata_pelajaran": "${mata_pelajaran}",
        "kelas": "${tingkat_kelas}",
        "topik": "${topik}",
        "durasi": "${durasi_menit ? durasi_menit + ' menit' : 'Menyesuaikan'}"
    },
    "tujuan_pembelajaran": "tujuan pembelajaran spesifik dan terukur",
    "petunjuk": "petunjuk pengerjaan LKS untuk siswa",
    "aktivitas": [
        {
            "tipe": "tipe aktivitas",
            "judul_aktivitas": "judul aktivitas",
            "instruksi": "instruksi detail untuk siswa",
            "soal": [
                {
                    "no": 1,
                    "pertanyaan": "isi pertanyaan",
                    "kolom_jawaban": "tersedia"
                }
            ]
        }
    ],
    "refleksi": "pertanyaan refleksi untuk siswa",
    "catatan_guru": "panduan untuk guru"
}
Buat aktivitas sesuai tipe: ${tipe_aktivitas.join(', ')}. Setiap aktivitas minimal 3 soal.`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // 3. Simpan ke Database
        const worksheetData = {
            id: worksheetId,
            request_id: requestId,
            judul: aiResponse.judul,
            mata_pelajaran,
            topik,
            tipe_aktivitas,
            durasi_menit: durasi_menit || null,
            worksheet_json: aiResponse
        };
        const savedWorksheet = await WorksheetModel.saveWorksheet(worksheetData);

        // 4. Update Status Request
        await WorksheetModel.updateRequestStatus(requestId, 'completed', savedWorksheet);

        res.status(201).json({
            success: true,
            message: "Worksheet berhasil dibuat dengan Groq Llama 3.3.",
            data: {
                request_id: requestId,
                worksheet_id: worksheetId,
                worksheet: aiResponse
            },
            meta: {}
        });

    } catch (error) {
        console.error("Error Detail:", error);
        try {
            await WorksheetModel.updateRequestStatus(requestId, 'failed', { error: error.message });
        } catch (dbErr) {
            console.error("Gagal update status fail ke DB");
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan pada proses AI atau Database",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};


// GET ALL - Ambil semua worksheet milik user

const getAllWorksheets = async (req, res) => {
    try {
        const { userId } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';
        const worksheets = await WorksheetModel.getAllWorksheets(finalUserId);

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil semua worksheet.",
            data: worksheets,
            meta: { total: worksheets.length }
        });
    } catch (error) {
        console.error("Error Detail:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};


// GET BY ID - Ambil detail worksheet berdasarkan ID

const getWorksheetById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        const worksheet = await WorksheetModel.getWorksheetById(id, finalUserId);

        if (!worksheet) {
            return res.status(404).json({
                success: false,
                message: "Worksheet tidak ditemukan",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil detail worksheet.",
            data: worksheet,
            meta: {}
        });
    } catch (error) {
        console.error("Error Detail:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};


// PUT - Update worksheet berdasarkan ID

const updateWorksheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, judul, mata_pelajaran, topik, tipe_aktivitas, durasi_menit, worksheet_json } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        if (!judul || !mata_pelajaran || !topik || !tipe_aktivitas || !worksheet_json) {
            return res.status(400).json({
                success: false,
                message: "judul, mata_pelajaran, topik, tipe_aktivitas, dan worksheet_json wajib diisi",
                data: null,
                meta: {}
            });
        }

        const updated = await WorksheetModel.updateWorksheet(id, finalUserId, {
            judul, mata_pelajaran, topik, tipe_aktivitas, durasi_menit, worksheet_json
        });

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Worksheet tidak ditemukan atau bukan milik kamu",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Worksheet berhasil diupdate.",
            data: updated,
            meta: {}
        });
    } catch (error) {
        console.error("Error Detail:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat update data",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};


// DELETE - Hapus worksheet berdasarkan ID

const deleteWorksheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        const deleted = await WorksheetModel.deleteWorksheet(id, finalUserId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Worksheet tidak ditemukan atau bukan milik kamu",
                data: null,
                meta: {}
            });
        }

        res.status(200).json({
            success: true,
            message: "Worksheet berhasil dihapus.",
            data: null,
            meta: {}
        });
    } catch (error) {
        console.error("Error Detail:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat menghapus data",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

module.exports = { generateWorksheet, getAllWorksheets, getWorksheetById, updateWorksheet, deleteWorksheet };