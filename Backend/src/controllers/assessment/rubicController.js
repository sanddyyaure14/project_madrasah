const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const RubicModel = require('../../models/assessment/rubicModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateRubric = async (req, res) => {
    const requestId = uuidv4();
    const rubicId = uuidv4();

    try {
        const {
            jenis_tugas,         // WAJIB - sesuai modul
            aspek_penilaian,     // WAJIB - sesuai modul (guru yang isi)
            skala_nilai,         // WAJIB - sesuai modul
            tujuan_pembelajaran, // opsional - sesuai modul (TP/KD)
            deskripsi_tugas,     // opsional - sesuai modul
            mata_pelajaran,      // opsional - sesuai modul
            tingkat_kelas,       // opsional 
            userId
        } = req.body;

        // =========================================
        // Validasi input WAJIB sesuai modul
        // =========================================
        if (!jenis_tugas) {
            return res.status(400).json({
                success: false,
                message: 'jenis_tugas wajib diisi'
            });
        }

        if (!aspek_penilaian || !Array.isArray(aspek_penilaian) || aspek_penilaian.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'aspek_penilaian wajib diisi dan harus berupa array (contoh: ["Isi", "Penyampaian"])'
            });
        }

        const skalaValid = ['1-4', '1-10', '1-100'];
        if (!skala_nilai || !skalaValid.includes(skala_nilai)) {
            return res.status(400).json({
                success: false,
                message: `skala_nilai wajib diisi. Pilihan: 1-4, 1-10, atau 1-100`
            });
        }

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // =========================================
        // 1. Log Request ke Database
        // =========================================
        await RubicModel.createRequest(requestId, finalUserId, {
            jenis_tugas,
            aspek_penilaian,
            skala_nilai,
            tujuan_pembelajaran,
            deskripsi_tugas,
            mata_pelajaran,
            tingkat_kelas
        });

        // =========================================
        // 2. Tentukan nilai berdasarkan skala
        // =========================================
        const nilaiMap = {
            '1-4':   { max: 4,   levels: [4, 3, 2, 1] },
            '1-10':  { max: 10,  levels: [10, 8, 6, 4] },
            '1-100': { max: 100, levels: [100, 75, 50, 25] }
        };
        const skalaInfo = nilaiMap[skala_nilai];

        // =========================================
        // 3. Panggil Groq AI
        // aspek_penilaian dari guru dikirim ke AI
        // =========================================
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
- Skala Nilai: ${skala_nilai} (nilai tertinggi: ${skalaInfo.max})
${deskripsi_tugas ? `- Deskripsi Tugas: ${deskripsi_tugas}` : ''}
${mata_pelajaran ? `- Mata Pelajaran: ${mata_pelajaran}` : ''}
${tingkat_kelas ? `- Tingkat Kelas: ${tingkat_kelas}` : ''}
${tujuan_pembelajaran ? `- Tujuan Pembelajaran (gunakan ini): ${tujuan_pembelajaran}` : '- Tujuan Pembelajaran: buatkan otomatis yang relevan'}

Struktur JSON yang wajib diikuti:
{
    "judul": "judul rubrik",
    "deskripsi": "deskripsi singkat rubrik",
    "tujuan_pembelajaran": "tujuan pembelajaran spesifik dan terukur menggunakan kata kerja operasional",
    "aspek_penilaian": ${JSON.stringify(aspek_penilaian)},
    "aspek": [
        {
            "nama_aspek": "nama aspek (harus dari daftar aspek yang diberikan)",
            "bobot_persen": 25,
            "deskripsi_aspek": "penjelasan aspek ini",
            "kriteria": [
                { "level": "Sangat Baik", "nilai": ${skalaInfo.levels[0]}, "deskripsi": "deskripsi kriteria sangat baik" },
                { "level": "Baik", "nilai": ${skalaInfo.levels[1]}, "deskripsi": "deskripsi kriteria baik" },
                { "level": "Cukup", "nilai": ${skalaInfo.levels[2]}, "deskripsi": "deskripsi kriteria cukup" },
                { "level": "Perlu Bimbingan", "nilai": ${skalaInfo.levels[3]}, "deskripsi": "deskripsi kriteria perlu bimbingan" }
            ]
        }
    ],
    "cara_penilaian": "petunjuk cara menggunakan rubrik ini",
    "catatan_guru": "saran tambahan untuk guru"
}

PENTING: Buat tepat ${aspek_penilaian.length} aspek sesuai daftar yang diberikan. Total bobot_persen semua aspek = 100.`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);

        // Ambil tujuan_pembelajaran dari AI jika tidak diisi guru
        const finalTujuanPembelajaran = tujuan_pembelajaran || aiResponse.tujuan_pembelajaran;

        // =========================================
        // 4. Simpan ke Database
        // =========================================
        const assessmentData = {
            id: rubicId,
            request_id: requestId,
            jenis_tugas,
            aspek_penilaian,          // dari guru, bukan dari AI
            skala_nilai,
            rubric_json: aiResponse,
            tujuan_pembelajaran: finalTujuanPembelajaran
        };

        const savedAssessment = await RubicModel.saveAssessment(assessmentData);

        // =========================================
        // 5. Update Status Request
        // =========================================
        await RubicModel.updateRequestStatus(requestId, 'completed', savedAssessment);

        res.status(201).json({
            success: true,
            message: "Rubrik berhasil dibuat dengan Groq Llama 3.3.",
            data: {
                request_id: requestId,
                rubic_id: rubicId,
                rubric: aiResponse,
                tujuan_pembelajaran: finalTujuanPembelajaran
            }
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
            error: error.message
        });
    }
};

module.exports = { generateRubric };