const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const PDFDocument = require('pdfkit');
const WorksheetModel = require('../../models/assessment/worksheetModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// =============================================
// POST - Generate worksheet baru
// =============================================
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
            petunjuk_khusus
        } = req.body;

        // userId diambil dari JWT token (req.user disuntikkan oleh authMiddleware)
        const finalUserId = req.user.id;

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

        // 1. Log Request ke Database
        await WorksheetModel.createRequest(requestId, finalUserId, {
            mata_pelajaran, topik, tipe_aktivitas, tingkat_kelas,
            durasi_menit, tujuan_pembelajaran, header_sekolah, petunjuk_khusus
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
${petunjuk_khusus ? `- Petunjuk Khusus: ${petunjuk_khusus}` : ''}

Struktur JSON yang WAJIB diikuti (sesuai schema):
{
    "judul": "judul LKS",
    "info": {
        "mata_pelajaran": "${mata_pelajaran}",
        "kelas": "${tingkat_kelas}",
        "topik": "${topik}",
        "durasi": "${durasi_menit ? durasi_menit + ' menit' : 'Menyesuaikan'}"
    },
    "tujuan": "tujuan pembelajaran spesifik dan terukur",
    "petunjuk": "petunjuk umum pengerjaan LKS untuk siswa",
    "aktivitas": [
        {
            "tipe": "tipe aktivitas (isian/esai/praktik/observasi)",
            "instruksi": "instruksi detail untuk siswa",
            "soal": [
                {
                    "no": 1,
                    "pertanyaan": "isi pertanyaan",
                    "kolom_jawaban": "tersedia"
                }
            ]
        }
    ]
}

PENTING:
- Buat aktivitas sesuai tipe: ${tipe_aktivitas.join(', ')}
- Setiap aktivitas minimal 3 soal yang relevan
- Gunakan kata "tujuan" bukan "tujuan_pembelajaran" di JSON`
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

// =============================================
// GET ALL - Ambil semua worksheet milik user
// =============================================
const getAllWorksheets = async (req, res) => {
    try {
        const finalUserId = req.user.id;
        const worksheets = await WorksheetModel.getAllWorksheets(finalUserId);

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil semua worksheet.",
            data: worksheets,
            meta: { total: worksheets.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// GET BY ID - Ambil detail worksheet
// =============================================
const getWorksheetById = async (req, res) => {
    try {
        const { id } = req.params;
        const finalUserId = req.user.id;

        const worksheet = await WorksheetModel.getWorksheetById(id, finalUserId);
        if (!worksheet) {
            return res.status(404).json({ success: false, message: "Worksheet tidak ditemukan", data: null, meta: {} });
        }

        res.status(200).json({ success: true, message: "Berhasil mengambil detail worksheet.", data: worksheet, meta: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// PUT - Update worksheet
// =============================================
const updateWorksheet = async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, mata_pelajaran, topik, tipe_aktivitas, durasi_menit, worksheet_json } = req.body;
        const finalUserId = req.user.id;

        if (!judul || !mata_pelajaran || !topik || !tipe_aktivitas || !worksheet_json) {
            return res.status(400).json({ success: false, message: "judul, mata_pelajaran, topik, tipe_aktivitas, dan worksheet_json wajib diisi", data: null, meta: {} });
        }

        const updated = await WorksheetModel.updateWorksheet(id, finalUserId, {
            judul, mata_pelajaran, topik, tipe_aktivitas, durasi_menit, worksheet_json
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Worksheet tidak ditemukan atau bukan milik kamu", data: null, meta: {} });
        }

        res.status(200).json({ success: true, message: "Worksheet berhasil diupdate.", data: updated, meta: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat update data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// DELETE - Hapus worksheet
// =============================================
const deleteWorksheet = async (req, res) => {
    try {
        const { id } = req.params;
        const finalUserId = req.user.id;

        const deleted = await WorksheetModel.deleteWorksheet(id, finalUserId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Worksheet tidak ditemukan atau bukan milik kamu", data: null, meta: {} });
        }

        res.status(200).json({ success: true, message: "Worksheet berhasil dihapus.", data: null, meta: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat menghapus data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// GET - Cetak PDF worksheet
// =============================================
const cetakPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const finalUserId = req.user.id;

        const worksheet = await WorksheetModel.getWorksheetById(id, finalUserId);
        if (!worksheet) {
            return res.status(404).json({ success: false, message: "Worksheet tidak ditemukan", data: null, meta: {} });
        }

        const data = worksheet.worksheet_json;
        const doc = new PDFDocument({ margin: 50 });

        // Set header HTTP untuk download PDF
        const fileName = `LKS_${data.judul?.replace(/\s+/g, '_') || 'worksheet'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);

        // === HEADER SEKOLAH (jika ada) ===
        if (data.info?.header_sekolah) {
            doc.fontSize(12).text(data.info.header_sekolah, { align: 'center' });
            doc.moveDown(0.5);
        }

        // === JUDUL LKS ===
        doc.fontSize(16).font('Helvetica-Bold').text(data.judul || 'Lembar Kerja Siswa', { align: 'center' });
        doc.moveDown(0.5);

        // === INFO ===
        doc.fontSize(11).font('Helvetica');
        doc.text(`Mata Pelajaran : ${data.info?.mata_pelajaran || '-'}`, { continued: true });
        doc.text(`    Kelas : ${data.info?.kelas || '-'}`);
        doc.text(`Topik          : ${data.info?.topik || '-'}`, { continued: true });
        doc.text(`    Durasi : ${data.info?.durasi || '-'}`);
        doc.moveDown(0.5);

        // Garis pemisah
        doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.5);

        // === TUJUAN PEMBELAJARAN ===
        doc.fontSize(11).font('Helvetica-Bold').text('Tujuan Pembelajaran:');
        doc.font('Helvetica').text(data.tujuan || '-');
        doc.moveDown(0.5);

        // === PETUNJUK ===
        doc.font('Helvetica-Bold').text('Petunjuk:');
        doc.font('Helvetica').text(data.petunjuk || '-');
        doc.moveDown(1);

        // === AKTIVITAS ===
        const aktivitas = data.aktivitas || [];
        aktivitas.forEach((akt, i) => {
            doc.font('Helvetica-Bold').fontSize(12).text(`Aktivitas ${i + 1} — ${akt.tipe?.toUpperCase()}`);
            doc.font('Helvetica').fontSize(11).text(akt.instruksi || '');
            doc.moveDown(0.5);

            const soalList = akt.soal || [];
            soalList.forEach((s) => {
                doc.text(`${s.no}. ${s.pertanyaan}`);
                doc.moveDown(0.3);
                // Kolom jawaban kosong
                doc.moveTo(70, doc.y).lineTo(540, doc.y).stroke();
                doc.moveDown(1);
            });

            doc.moveDown(0.5);
        });

        doc.end();

    } catch (error) {
        console.error("Error Cetak PDF:", error);
        res.status(500).json({ success: false, message: "Gagal mencetak PDF", error: error.message, data: null, meta: {} });
    }
};

module.exports = { generateWorksheet, getAllWorksheets, getWorksheetById, updateWorksheet, deleteWorksheet, cetakPDF };