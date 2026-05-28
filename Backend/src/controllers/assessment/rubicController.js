const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const ExcelJS = require('exceljs');
const RubicModel = require('../../models/assessment/rubicModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// =============================================
// POST - Generate rubrik baru
// =============================================
const generateRubric = async (req, res) => {
    const requestId = uuidv4();
    const rubicId = uuidv4();

    try {
        const {
            jenis_tugas,            // WAJIB
            aspek_penilaian,        // WAJIB - array, guru yang isi
            skala_nilai,            // WAJIB - "1-4" | "1-10" | "1-100"
            tujuan_pembelajaran,    // opsional (TP/KD)
            deskripsi_tugas,        // opsional
            mata_pelajaran,         // opsional
            jumlah_level,           // opsional - default 4
            userId
        } = req.body;

        // Validasi input WAJIB
        if (!jenis_tugas) {
            return res.status(400).json({ success: false, message: 'jenis_tugas wajib diisi', data: null, meta: {} });
        }
        if (!aspek_penilaian || !Array.isArray(aspek_penilaian) || aspek_penilaian.length === 0) {
            return res.status(400).json({ success: false, message: 'aspek_penilaian wajib diisi (contoh: ["Isi", "Penyampaian"])', data: null, meta: {} });
        }
        const skalaValid = ['1-4', '1-10', '1-100'];
        if (!skala_nilai || !skalaValid.includes(skala_nilai)) {
            return res.status(400).json({ success: false, message: 'skala_nilai wajib diisi. Pilihan: 1-4, 1-10, atau 1-100', data: null, meta: {} });
        }

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // Tentukan jumlah level (default 4)
        const finalJumlahLevel = parseInt(jumlah_level) || 4;

        // Tentukan nama level dan skor berdasarkan skala + jumlah level
        const levelConfig = buildLevelConfig(skala_nilai, finalJumlahLevel);

        // 1. Log Request ke Database
        await RubicModel.createRequest(requestId, finalUserId, {
            jenis_tugas, aspek_penilaian, skala_nilai,
            tujuan_pembelajaran, deskripsi_tugas, mata_pelajaran, jumlah_level: finalJumlahLevel
        });

        // 2. Update status → PROCESSING
await RubicModel.updateRequestStatus(requestId, 'processing', {});

        // 3. Panggil Groq AI
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah ahli pendidikan madrasah Indonesia yang membuat rubrik penilaian detail. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun."
                },
                {
                    role: "user",
                    content: `Buatlah rubrik penilaian detail dengan ketentuan berikut:
- Jenis Tugas: ${jenis_tugas}
- Aspek yang Dinilai (WAJIB gunakan aspek ini): ${aspek_penilaian.join(', ')}
- Skala Nilai: ${skala_nilai}
- Jumlah Level: ${finalJumlahLevel}
${deskripsi_tugas ? `- Deskripsi Tugas: ${deskripsi_tugas}` : ''}
${mata_pelajaran ? `- Mata Pelajaran: ${mata_pelajaran}` : ''}
${tujuan_pembelajaran ? `- Tujuan Pembelajaran (gunakan ini): ${tujuan_pembelajaran}` : '- Tujuan Pembelajaran: buatkan otomatis yang relevan'}

Level yang digunakan: ${levelConfig.map(l => `${l.nama} (skor: ${l.skor})`).join(', ')}

Struktur JSON yang WAJIB diikuti (sesuai schema):
{
    "judul": "judul rubrik",
    "tujuan_pembelajaran": "tujuan pembelajaran spesifik dan terukur",
    "aspek": [
        {
            "nama": "nama aspek (harus dari daftar aspek yang diberikan)",
            "bobot": 25,
            "level": [
                ${levelConfig.map(l => `{ "nama": "${l.nama}", "deskripsi": "deskripsi kriteria ${l.nama.toLowerCase()}", "skor": ${l.skor} }`).join(',\n                ')}
            ]
        }
    ]
}

PENTING:
- Buat tepat ${aspek_penilaian.length} aspek sesuai daftar yang diberikan
- Total bobot semua aspek = 100
- Setiap aspek harus punya tepat ${finalJumlahLevel} level`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
        const finalTujuanPembelajaran = tujuan_pembelajaran || aiResponse.tujuan_pembelajaran;

        // 4. Simpan ke Database
        const assessmentData = {
            id: rubicId,
            request_id: requestId,
            jenis_tugas,
            aspek_penilaian,
            skala_nilai,
            rubric_json: aiResponse,
            tujuan_pembelajaran: finalTujuanPembelajaran
        };
        const savedAssessment = await RubicModel.saveAssessment(assessmentData);

        // 5. Update Status Request
        await RubicModel.updateRequestStatus(requestId, 'completed', savedAssessment);

        res.status(201).json({
            success: true,
            message: "Rubrik berhasil dibuat dengan Groq Llama 3.3.",
            data: {
                request_id: requestId,
                rubic_id: rubicId,
                rubric: aiResponse,
                tujuan_pembelajaran: finalTujuanPembelajaran
            },
            meta: {}
        });

    } catch (error) {
        console.error("Error Detail:", error);
        try {
            await RubicModel.updateRequestStatus(requestId, 'failed', { error: error.message });
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
// GET ALL - Ambil semua rubrik milik user
// =============================================
const getAllRubrics = async (req, res) => {
    try {
        const { userId } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';
        const rubrics = await RubicModel.getAllRubrics(finalUserId);

        res.status(200).json({
            success: true,
            message: "Berhasil mengambil semua rubrik.",
            data: rubrics,
            meta: { total: rubrics.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// GET BY ID - Ambil detail rubrik
// =============================================
const getRubricById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        const rubric = await RubicModel.getRubricById(id, finalUserId);
        if (!rubric) {
            return res.status(404).json({ success: false, message: "Rubrik tidak ditemukan", data: null, meta: {} });
        }

        res.status(200).json({ success: true, message: "Berhasil mengambil detail rubrik.", data: rubric, meta: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// PUT - Update rubrik
// =============================================
const updateRubric = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, jenis_tugas, aspek_penilaian, skala_nilai, tujuan_pembelajaran, rubric_json } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        if (!jenis_tugas || !aspek_penilaian || !skala_nilai || !rubric_json) {
            return res.status(400).json({ success: false, message: "jenis_tugas, aspek_penilaian, skala_nilai, dan rubric_json wajib diisi", data: null, meta: {} });
        }

        const updated = await RubicModel.updateRubric(id, finalUserId, {
            jenis_tugas, aspek_penilaian, skala_nilai, tujuan_pembelajaran, rubric_json
        });

        if (!updated) {
            return res.status(404).json({ success: false, message: "Rubrik tidak ditemukan atau bukan milik kamu", data: null, meta: {} });
        }

        res.status(200).json({ success: true, message: "Rubrik berhasil diupdate.", data: updated, meta: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat update data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// DELETE - Hapus rubrik
// =============================================
const deleteRubric = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        const deleted = await RubicModel.deleteRubric(id, finalUserId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Rubrik tidak ditemukan atau bukan milik kamu", data: null, meta: {} });
        }

        res.status(200).json({ success: true, message: "Rubrik berhasil dihapus.", data: null, meta: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat menghapus data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// GET - Export rubrik ke Excel
// =============================================
const exportToExcel = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        const rubric = await RubicModel.getRubricById(id, finalUserId);
        if (!rubric) {
            return res.status(404).json({ success: false, message: "Rubrik tidak ditemukan", data: null, meta: {} });
        }

        const rubricData = rubric.rubric_json;
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Rubrik Penilaian');

        // Header utama
        sheet.mergeCells('A1', `${String.fromCharCode(65 + (rubricData.aspek?.[0]?.level?.length || 4))}1`);
        sheet.getCell('A1').value = rubricData.judul || `Rubrik Penilaian ${rubric.jenis_tugas}`;
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // Tujuan pembelajaran
        sheet.getCell('A2').value = `Tujuan Pembelajaran: ${rubric.tujuan_pembelajaran || '-'}`;
        sheet.getCell('A2').font = { italic: true };

        sheet.addRow([]);

        // Header tabel
        const levels = rubricData.aspek?.[0]?.level?.map(l => l.nama) || ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Bimbingan'];
        const headerRow = sheet.addRow(['Aspek', 'Bobot (%)', ...levels]);
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
            cell.alignment = { horizontal: 'center', wrapText: true };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Isi tabel per aspek
        rubricData.aspek?.forEach((aspek, i) => {
            const levelDeskripsi = aspek.level?.map(l => `${l.nama} (skor: ${l.skor})\n${l.deskripsi}`) || [];
            const row = sheet.addRow([aspek.nama, aspek.bobot, ...levelDeskripsi]);
            row.eachCell(cell => {
                cell.alignment = { wrapText: true, vertical: 'top' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
            row.height = 80;
        });

        // Set lebar kolom
        sheet.getColumn(1).width = 20;
        sheet.getColumn(2).width = 12;
        for (let i = 3; i <= levels.length + 2; i++) {
            sheet.getColumn(i).width = 35;
        }

        // Kirim file Excel
        const fileName = `Rubrik_${rubric.jenis_tugas.replace(/\s+/g, '_')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error Export Excel:", error);
        res.status(500).json({ success: false, message: "Gagal export ke Excel", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// HELPER - Build level config berdasarkan skala & jumlah level
// =============================================
const buildLevelConfig = (skala_nilai, jumlahLevel) => {
    const namaLevel = {
        4: ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Bimbingan'],
        3: ['Baik', 'Cukup', 'Perlu Bimbingan'],
        5: ['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang']
    };

    const skorMap = {
        '1-4':   { 4: [4,3,2,1], 3: [3,2,1], 5: [5,4,3,2,1] },
        '1-10':  { 4: [10,8,6,4], 3: [10,7,4], 5: [10,8,6,4,2] },
        '1-100': { 4: [100,75,50,25], 3: [100,65,30], 5: [100,80,60,40,20] }
    };

    const nama = namaLevel[jumlahLevel] || namaLevel[4];
    const skor = skorMap[skala_nilai]?.[jumlahLevel] || skorMap['1-4'][4];

    return nama.map((n, i) => ({ nama: n, skor: skor[i] }));
};

module.exports = { generateRubric, getAllRubrics, getRubricById, updateRubric, deleteRubric, exportToExcel };