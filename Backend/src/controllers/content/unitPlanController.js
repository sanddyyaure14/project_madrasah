const { v4: uuidv4 } = require('uuid');
const UnitPlanModel = require('../../models/content/unitPlanModel');
const Groq = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { generateUnitPlanDocx } = require('../../utils/docxGenerator');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateUnitPlan = async (req, res) => {
    const requestId = uuidv4();
    const unitPlanId = uuidv4();

    try {
        const {
            judul_unit, mata_pelajaran, tingkat_kelas, tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp, userId
        } = req.body;

        const finalUserId = userId || '00000000-0000-0000-0000-000000000000';

        // 1. Log Request ke Database
        await UnitPlanModel.createRequest(requestId, finalUserId, {
            judul_unit, mata_pelajaran, tingkat_kelas, tujuan_pembelajaran, jumlah_pertemuan, durasi_per_jp
        });

        // 2. Panggil Groq AI Llama 3.3

        const prompt = `Anda adalah seorang ahli penyusun Modul Ajar / RPP Kurikulum Merdeka (Madrasah). Buatlah rancangan Modul Ajar untuk:
Mata Pelajaran: ${mata_pelajaran}
Judul Materi/Unit: ${judul_unit}
Kelas: ${tingkat_kelas}
Tujuan Pembelajaran: ${tujuan_pembelajaran || 'Tentukan tujuan yang sesuai dengan materi'}
Jumlah Pertemuan: ${jumlah_pertemuan || 2}
Durasi per JP: ${durasi_per_jp || 40} menit

Anda WAJIB memberikan respons dalam format JSON murni dengan struktur berikut:
{
    "informasi_umum": {
        "mata_pelajaran": "${mata_pelajaran}",
        "judul_unit": "${judul_unit}",
        "kelas": "${tingkat_kelas}",
        "alokasi_waktu": "${jumlah_pertemuan || 2} Pertemuan",
        "kompetensi_awal": ["..."],
        "profil_pelajar_pancasila": ["..."],
        "sarana_prasarana": ["..."],
        "target_peserta_didik": "..."
    },
    "komponen_inti": {
        "tujuan_pembelajaran": ["..."],
        "pemahaman_bermakna": "...",
        "pertanyaan_pemantik": ["..."],
        "kegiatan_pembelajaran": [
            {
                "pertemuan_ke": 1,
                "pendahuluan": ["..."],
                "kegiatan_inti": ["..."],
                "penutup": ["..."]
            }
        ],
        "asesmen": ["..."],
        "pengayaan_dan_remedial": ["..."]
    }
}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah seorang ahli penyusun Modul Ajar / RPP Kurikulum Merdeka (Madrasah). Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });
        const aiResponseJSON = JSON.parse(chatCompletion.choices[0].message.content);

        // 3. Simpan ke Database
        const unitPlanData = {
            id: unitPlanId,
            request_id: requestId,
            judul_unit,
            mata_pelajaran,
            tingkat_kelas,
            tujuan_pembelajaran: tujuan_pembelajaran || null,
            jumlah_pertemuan: jumlah_pertemuan || 2,
            durasi_per_jp: durasi_per_jp || 40,
            unit_plan_json: aiResponseJSON
        };

        const savedUnitPlan = await UnitPlanModel.saveUnitPlan(unitPlanData);

        // 4. Update Status Request
        await UnitPlanModel.updateRequestStatus(requestId, 'completed', savedUnitPlan);

        res.status(201).json({
            success: true,
            message: "Modul Ajar (RPP) berhasil dibuat dengan Groq Llama 3.3.",
            data: savedUnitPlan
        });

    } catch (error) {
        console.error("Error Detail:", error);
        try {
            await UnitPlanModel.updateRequestStatus(requestId, 'failed', { error: error.message });
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

const getUnitPlans = async (req, res) => {
    try {
        const data = await UnitPlanModel.getAllUnitPlans();
        res.status(200).json({
            success: true,
            message: "Berhasil mengambil data Modul Ajar (RPP).",
            data: data
        });
    } catch (error) {
        console.error("Error fetching unit plans:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data dari server.",
            error: error.message
        });
    }
};

const downloadUnitPlanDocx = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Ambil data dari database
        const unitPlanData = await UnitPlanModel.getUnitPlanById(id);
        
        if (!unitPlanData) {
            return res.status(404).json({
                success: false,
                message: "Unit Plan tidak ditemukan"
            });
        }

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '../../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Generate DOCX
        const fileName = `unit_plan_${id}.docx`;
        const filePath = path.join(tempDir, fileName);
        
        await generateUnitPlanDocx(unitPlanData, filePath);

        // Download file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
            }
            // Hapus file setelah download
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error("Error generating DOCX:", error);
        res.status(500).json({
            success: false,
            message: "Gagal generate DOCX",
            error: error.message
        });
    }
};

module.exports = { generateUnitPlan, getUnitPlans, downloadUnitPlanDocx };
