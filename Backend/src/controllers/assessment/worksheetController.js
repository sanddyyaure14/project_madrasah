const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const WorksheetModel = require('../../models/assessment/worksheetModel');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateWorksheet = async (req, res) => {
    const requestId = uuidv4();
    const worksheetId = uuidv4();

    try {
        const {
            mata_pelajaran,      // WAJIB - sesuai modul
            topik,               // WAJIB - sesuai modul
            tipe_aktivitas,      // WAJIB - sesuai modul (array: ["isian", "esai", dll])
            tingkat_kelas,       // WAJIB - sesuai modul
            durasi_menit,        // opsional
            tujuan_pembelajaran, // opsional
            header_sekolah,      // opsional
            userId
        } = req.body;

        // Validasi input WAJIB sesuai modul
    
        if (!mata_pelajaran) {
            return res.status(400).json({
                success: false,
                message: 'mata_pelajaran wajib diisi'
            });
        }

        if (!topik) {
            return res.status(400).json({
                success: false,
                message: 'topik wajib diisi'
            });
        }

        if (!tipe_aktivitas || !Array.isArray(tipe_aktivitas) || tipe_aktivitas.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'tipe_aktivitas wajib diisi (contoh: ["isian", "esai"])'
            });
        }

        const tipeValid = ['isian', 'esai', 'praktik', 'observasi'];
        const tipeInvalid = tipe_aktivitas.filter(t => !tipeValid.includes(t));
        if (tipeInvalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `tipe_aktivitas tidak valid: ${tipeInvalid.join(', ')}. Pilihan: isian, esai, praktik, observasi`
            });
        }

        if (!tingkat_kelas) {
            return res.status(400).json({
                success: false,
                message: 'tingkat_kelas wajib diisi'
            });
        }

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

       
        // 1. Log Request ke Database
       
        await WorksheetModel.createRequest(requestId, finalUserId, {
            mata_pelajaran,
            topik,
            tipe_aktivitas,
            tingkat_kelas,
            durasi_menit,
            tujuan_pembelajaran,
            header_sekolah
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
    "tujuan_pembelajaran": "tujuan pembelajaran yang spesifik dan terukur",
    "petunjuk": "petunjuk pengerjaan LKS untuk siswa",
    "aktivitas": [
        {
            "tipe": "tipe aktivitas (isian/esai/praktik/observasi)",
            "judul_aktivitas": "judul aktivitas",
            "instruksi": "instruksi detail untuk siswa",
            "soal": [
                {
                    "no": 1,
                    "pertanyaan": "isi pertanyaan",
                    "kolom_jawaban": "tersedia/tidak"
                }
            ]
        }
    ],
    "refleksi": "pertanyaan refleksi untuk siswa di akhir LKS",
    "catatan_guru": "panduan untuk guru dalam menggunakan LKS ini"
}

Buat aktivitas sesuai tipe yang diminta: ${tipe_aktivitas.join(', ')}.
Setiap aktivitas minimal 3 soal yang relevan dengan topik.`
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
            }
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
            error: error.message
        });
    }
};

module.exports = { generateWorksheet };