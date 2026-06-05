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

        const finalUserId = req.user?.id || userId || '99999999-9999-9999-9999-999999999999';
        const isKepsek = req.user?.role === 'kepala_sekolah';
        
        // 0. CEK KUOTA — skip untuk kepala_sekolah (unlimited)
        if (!isKepsek) {
            const quotaCheck = await RubicModel.checkUserQuota(finalUserId);
            if (!quotaCheck.hasQuota) {
                return res.status(403).json({
                    success: false,
                    message: "Kuota generate bulanan Anda telah habis.",
                    data: null,
                    meta: { remaining: 0, limit: quotaCheck.limit }
                });
            }
        }

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
        const startTime = Date.now();
        
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
        
        // --- METRIK AI UNTUK LOGGING DATABASE ---
        const processingTimeMs = Date.now() - startTime;
        const tokenUsage = {
            prompt_tokens:     chatCompletion.usage?.prompt_tokens || 0,
            completion_tokens: chatCompletion.usage?.completion_tokens || 0,
            total_tokens:      chatCompletion.usage?.total_tokens || 0
        };
        const promptUsed = `[system]: Ahli pendidikan madrasah, balas JSON murni. [user]: jenis_tugas=${jenis_tugas}, aspek=${aspek_penilaian.join(', ')}, skala=${skala_nilai}`;
        
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

        // 5. PERBAIKAN: Memanggil updateRequestCompleted agar semua metrik masuk ke database
        await RubicModel.updateRequestCompleted(
            requestId,
            savedAssessment,
            promptUsed,        
            processingTimeMs,  
            tokenUsage,        
            chatCompletion.model 
        );

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
        
        // 6. Update usage_quotas — skip untuk kepala_sekolah
        if (!isKepsek) {
            await RubicModel.incrementQuotaUsage(finalUserId);
        }
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
        const finalUserId = req.user?.id;
        const isKepsek = req.user?.role === 'kepala_sekolah';
        
        if (!finalUserId) {
            return res.status(401).json({ success: false, message: "User tidak terautentikasi" });
        }

        const rubrics = await RubicModel.getAllRubrics(finalUserId, isKepsek);

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
        const finalUserId = req.user?.id;
        const isKepsek = req.user?.role === 'kepala_sekolah';

        if (!finalUserId) {
            return res.status(401).json({ success: false, message: "User tidak terautentikasi" });
        }

        const rubric = await RubicModel.getRubricById(id, finalUserId, isKepsek);
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
        const { jenis_tugas, aspek_penilaian, skala_nilai, tujuan_pembelajaran, rubric_json } = req.body;
        const finalUserId = req.user?.id;
        const isKepsek = req.user?.role === 'kepala_sekolah';

        if (!finalUserId) {
            return res.status(401).json({ success: false, message: "User tidak terautentikasi" });
        }

        if (!jenis_tugas || !aspek_penilaian || !skala_nilai || !rubric_json) {
            return res.status(400).json({ success: false, message: "jenis_tugas, aspek_penilaian, skala_nilai, dan rubric_json wajib diisi", data: null, meta: {} });
        }

        const updated = await RubicModel.updateRubric(id, finalUserId, {
            jenis_tugas, aspek_penilaian, skala_nilai, tujuan_pembelajaran, rubric_json
        }, isKepsek);

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
        const finalUserId = req.user?.id;
        const isKepsek = req.user?.role === 'kepala_sekolah';

        if (!finalUserId) {
            return res.status(401).json({ success: false, message: "User tidak terautentikasi" });
        }

        const deleted = await RubicModel.deleteRubric(id, finalUserId, isKepsek);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Rubrik tidak ditemukan atau bukan milik kamu", data: null, meta: {} });
        }

        res.status(200).json({ success: true, message: "Rubrik berhasil dihapus.", data: null, meta: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan saat menghapus data", error: error.message, data: null, meta: {} });
    }
};

// =============================================
// GET - Export rubrik ke Excel (VERSI SUPER REBOST & ANTI-CORRUPT)
// =============================================
const exportToExcel = async (req, res) => {
    try {
        const { id } = req.params;
        const finalUserId = req.user?.id;
        const isKepsek = req.user?.role === 'kepala_sekolah';

        if (!finalUserId) {
            return res.status(401).json({ success: false, message: "User tidak terautentikasi" });
        }

        const rubric = await RubicModel.getRubricById(id, finalUserId, isKepsek);
        if (!rubric) {
            return res.status(404).json({ success: false, message: "Rubrik tidak ditemukan di database" });
        }

        // 🌟 FIX 1: AMBIL DATA DARI DATABASE & PARSE JIKA STRING
        let rawData = rubric.rubric_json;
        if (typeof rawData === 'string') {
            try {
                rawData = JSON.parse(rawData);
            } catch (e) {
                console.error("Gagal parse string rubric_json:", e);
                rawData = {};
            }
        }
        if (!rawData) rawData = {};

        // 🌟 FIX 2: ADAPTASI BUNGKUS DATA (Membaca mentah atau yang dibungkus properti 'rubric')
        let rubricData = rawData.rubric ? rawData.rubric : rawData;
        
        // Ambil daftar aspek secara fleksibel sesuai format Groq
        const daftarAspek = rubricData.aspek || rubricData.aspek_penilaian || rubricData.kriteria || rawData.aspek || [];

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Rubrik Penilaian');

        // Header utama di baris 1
        sheet.mergeCells('A1', 'F1');
        sheet.getCell('A1').value = rubricData.judul || rawData.judul || `Rubrik Penilaian ${rubric.jenis_tugas}`;
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // Tujuan pembelajaran di baris 2
        sheet.getCell('A2').value = `Tujuan Pembelajaran: ${rubric.tujuan_pembelajaran || rubricData.tujuan_pembelajaran || '-'}`;
        sheet.getCell('A2').font = { italic: true };

        sheet.addRow([]); // Pembatas kosong

        // Ambil nama level secara dinamis dari aspek pertama
        let levels = ['Level 4', 'Level 3', 'Level 2', 'Level 1'];
        if (Array.isArray(daftarAspek) && daftarAspek.length > 0 && daftarAspek[0]) {
            const levelData = daftarAspek[0].level || daftarAspek[0].levels || daftarAspek[0].kriteria_skor || [];
            if (levelData.length > 0) {
                levels = levelData.map(l => l.nama || `Skor ${l.skor}`);
            }
        }

        // Membuat Header Tabel di Excel
        const headerRow = sheet.addRow(['Aspek Penilaian', 'Bobot (%)', ...levels]);
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6E4F' } }; // Hijau Madrasah
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        headerRow.height = 25;

        // Memasukkan data aspek ke baris tabel
        if (Array.isArray(daftarAspek) && daftarAspek.length > 0) {
            daftarAspek.forEach((aspek) => {
                if (!aspek) return;
                const namaAspek = aspek.nama || aspek.aspek || 'Tanpa Nama Aspek';
                const bobotAspek = aspek.bobot || '-';
                
                const levelData = aspek.level || aspek.levels || aspek.kriteria_skor || [];
                const levelDeskripsi = levelData.map(l => {
                    const skorText = l.skor !== undefined ? `(Skor: ${l.skor})` : '';
                    const descText = l.deskripsi || l.kriteria || '';
                    return `${l.nama || ''} ${skorText}\n${descText}`;
                });

                const row = sheet.addRow([namaAspek, bobotAspek, ...levelDeskripsi]);
                row.eachCell(cell => {
                    cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                    cell.border = {
                        top: { style: 'thin' }, left: { style: 'thin' },
                        bottom: { style: 'thin' }, right: { style: 'thin' }
                    };
                });
                row.height = 75; // Beri ruang tinggi baris agar deskripsi panjang muat
            });
        } else {
            const emptyRow = sheet.addRow(['Data aspek gagal dipetakan ke dalam Excel', '', '', '', '', '']);
            emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF990000' } };
        }

        // Set Lebar Kolom
        sheet.getColumn(1).width = 25; 
        sheet.getColumn(2).width = 12; 
        for (let i = 3; i <= levels.length + 2; i++) {
            sheet.getColumn(i).width = 30; 
        }

        // kode pembuat tabel excel di atas ...

        // 🌟 SEKARANG DIUBAH MENJADI SEPERTI INI:
        const sanitizedFileName = (rubric.jenis_tugas || 'Rubrik').replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `Rubrik_${sanitizedFileName}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Wajib gunakan tanda kutip ganda (\") di dalam penulisan filename agar terbaca utuh oleh Postman/Browser
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error Export Excel:", error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Gagal export ke Excel akibat sistem internal", error: error.message });
        }
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