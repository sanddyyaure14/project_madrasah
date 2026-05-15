const { v4: uuidv4 } = require('uuid');
const UnitPlanModel = require('../../models/content/unitPlanModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

        // 2. Panggil Gemini
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

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

        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text();
        const aiResponseJSON = JSON.parse(aiResponseText);

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
            message: "Modul Ajar (RPP) berhasil dibuat dengan Gemini AI.",
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

module.exports = { generateUnitPlan, getUnitPlans };
