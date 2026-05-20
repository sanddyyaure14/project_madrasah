const { v4: uuidv4 } = require('uuid');
const Groq = require('groq-sdk');
const MCModel = require('../../models/assessment/mcModel');
const PDFDocument = require('pdfkit');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateMC = async (req, res) => {
    const requestId = uuidv4();
    const mcId = uuidv4();

    try {
        // 1. Ambil data dari req.body (Termasuk kompetensi_dasar hasil input manual guru)
        const {
            mata_pelajaran,
            tingkat_kelas: input_kelas,
            topik,
            jumlah_soal,
            tingkat_kesulitan,
            include_kunci, 
            kompetensi_dasar, 
            userId
        } = req.body;

        // Validasi dan Normalisasi Tingkat Kelas (Menangani Romawi atau Angka)
        let tingkat_kelas = "";
        let angkaKelas = parseInt(input_kelas);
        
        if (isNaN(angkaKelas) && input_kelas) {
            const romawi = input_kelas.toUpperCase();
            if (romawi === "VII") angkaKelas = 7;
            else if (romawi === "VIII") angkaKelas = 8;
            else if (romawi === "IX") angkaKelas = 9;
            else if (romawi === "X") angkaKelas = 10;
            else if (romawi === "XI") angkaKelas = 11;
            else if (romawi === "XII") angkaKelas = 12;
        }

        if (angkaKelas >= 7 && angkaKelas <= 9) {
            tingkat_kelas = `${angkaKelas} SMP`;
        } else if (angkaKelas >= 10 && angkaKelas <= 12) {
            tingkat_kelas = `${angkaKelas} SMA`;
        } else {
            return res.status(400).json({
                success: false,
                message: `Tingkat kelas '${input_kelas}' tidak valid. Backend menerima kelas 7-12 atau VII-XII.`,
                data: null,
                meta: {}
            });
        }

        const finalUserId = userId || '99999999-9999-9999-9999-999999999999';

        // Log request awal ke database
        await MCModel.createRequest(requestId, finalUserId, {
            mata_pelajaran,
            tingkat_kelas,
            topik,
            jumlah_soal,
            tingkat_kesulitan,
            include_kunci: include_kunci === false ? false : true,
            standards: kompetensi_dasar 
        });

        // Penentuan jumlah opsi pilihan otomatis (SMP = 4 opsi, SMA = 5 opsi)
        const jumlahOpsi = tingkat_kelas.includes('SMA') ? 5 : 4;

        // 2. Kirim prompt ke Groq (Hanya menyuruh AI fokus bikin soal, tidak usah ngarang KD)
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Anda adalah asisten pembuat soal ujian madrasah yang ahli. Anda wajib memberikan respon dalam format JSON murni tanpa teks penjelasan apa pun di luar objek JSON."
                },
                {
                    role: "user",
                    content: `Buatlah ${jumlah_soal} soal pilihan ganda kontekstual berbasis materi madrasah tentang ${topik}.
                    
                    ACUAN KOMPETENSI DASAR (INPUT GURU):
                    ${kompetensi_dasar || 'Gunakan materi standar nasional madrasah'}

                    SPESIFIKASI SOAL:
                    - Tingkat: ${tingkat_kelas} (${mata_pelajaran}).
                    - Kesulitan: ${tingkat_kesulitan}.
                    - Jumlah Opsi Pilihan: ${jumlahOpsi}.

                    Struktur JSON awal yang wajib Anda keluarkan:
                    {
                        "questions": [
                            {
                                "no": 1,
                                "soal": "Teks pertanyaan soal...",
                                "pilihan_raw": ["Opsi A", "Opsi B", "Opsi C (KUNCI)", "Opsi D"],
                                "pembahasan": "Penjelasan ilmiah/fakta sejarah/cara pengerjaan yang logis mengapa opsi tersebut benar."
                            }
                        ]
                    }

                    ATURAN SANGAT KETAT UNTUK AKURASI KONTEN:
                    1. Jika mata pelajaran eksak (Matematika/Fisika): Pastikan hitungan menghasilkan jawaban BILANGAN BULAT.
                    2. Tentukan 1 jawaban benar di dalam array "pilihan_raw" lalu beri tanda " (KUNCI)" tepat di belakang teksnya. Contoh: "Bersih atau suci (KUNCI)".`
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { "type": "json_object" }
        });

        const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
        const indexToLetter = ["A", "B", "C", "D", "E"];

        // 3. Transformasi Array ke Object {A, B, C, D} & Filter Sakelar "Include Kunci"
        const formattedQuestions = aiResponse.questions.map((q) => {
            let hurufKunci = "A";
            let objekPilihan = {};

            q.pilihan_raw.forEach((pil, index) => {
                const huruf = indexToLetter[index];
                
                if (typeof pil === 'string' && pil.includes("(KUNCI)")) {
                    hurufKunci = huruf;
                    objekPilihan[huruf] = pil.replace(" (KUNCI)", "").trim();
                } else {
                    objekPilihan[huruf] = String(pil).trim();
                }
            });

            return {
                no: q.no,
                soal: q.soal,
                pilihan: objekPilihan,
                kunci: include_kunci === false ? "" : hurufKunci,
                pembahasan: include_kunci === false ? "" : (q.pembahasan || "Gunakan prinsip materi untuk menyelesaikan soal ini.")
            };
        });

        // Susun objek data (Gunakan kompetensi_dasar asli yang diketik manual oleh guru)
        const assessmentData = {
            id: mcId,
            request_id: requestId,        
            mata_pelajaran,      
            tingkat_kelas,        
            topik,                
            jumlah_soal: formattedQuestions.length,
            tingkat_kesulitan,
            include_kunci: include_kunci === false ? false : true,
            questions_json: formattedQuestions, 
            kompetensi_dasar: kompetensi_dasar || "" 
        };

        const savedAssessment = await MCModel.saveAssessment(assessmentData);
        await MCModel.updateRequestStatus(requestId, 'completed', savedAssessment);

        // 4. Return Response sesuai blueprint dosen (Sudah Ditambahkan Meta)
        res.status(201).json({
            success: true,
            message: "Haris Berhasil buat dengan Groq Llama 3.3.",
            request_id: requestId,
            status: "completed",
            data: {
                questions: formattedQuestions
            },
            meta: {}
        });

    } catch (error) {
        console.error("Error Detail:", error);
        try {
            await MCModel.updateRequestStatus(requestId, 'failed', { error: error.message });
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

// FUNGSI KHUSUS PUT UNTUK AKSI EDIT & SIMPAN
const updateMC = async (req, res) => {
    try {
        const { id } = req.params; 
        const { questions, kompetensi_dasar, topik, tingkat_kesulitan } = req.body; 

        if (!id || !questions) {
            return res.status(400).json({
                success: false,
                message: "ID Assessment dan data questions wajib disertakan.",
                data: null,
                meta: {}
            });
        }

        // 1. Tarik data asli yang sudah ada di database berdasarkan ID
        const existingAssessment = await MCModel.getAssessmentById(id);

        if (!existingAssessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} tidak ditemukan di database.`,
                data: null,
                meta: {}
            });
        }

        // 2. Gabungkan data lama (sebagai backup) dengan data baru hasil editan dari body
        const updatedData = {
            id,
            request_id: existingAssessment.request_id,
            mata_pelajaran: existingAssessment.mata_pelajaran,
            tingkat_kelas: existingAssessment.tingkat_kelas,
            include_kunci: existingAssessment.include_kunci, 
            jumlah_soal: questions.length, 
            topik: topik || existingAssessment.topik,
            tingkat_kesulitan: tingkat_kesulitan || existingAssessment.tingkat_kesulitan,
            questions_json: questions, 
            kompetensi_dasar: kompetensi_dasar !== undefined ? kompetensi_dasar : existingAssessment.kompetensi_dasar
        };

        // 3. Panggil model untuk melakukan update (Upsert) ke database
        const result = await MCModel.saveAssessment(updatedData); 

        // Return Response dengan Meta
        res.status(200).json({
            success: true,
            message: "Aksi EDIT Sukses! Perubahan soal berhasil disimpan via PUT.",
            data: result,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat PUT Assessment:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengupdate data assessment.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

// FUNGSI KHUSUS GET UNTUK MENAMPILKAN DETAIL SOAL BERDASARKAN ID
const getMCById = async (req, res) => {
    try {
        const { id } = req.params; 

        // Panggil model untuk mengambil data dari database berdasarkan ID
        const assessment = await MCModel.getAssessmentById(id); 

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} tidak ditemukan.`,
                data: null,
                meta: {}
            });
        }

        // Return Response dengan Meta
        res.status(200).json({
            success: true,
            message: "Haris Berhasil mengambil data assessment untuk preview/edit.",
            data: assessment,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat GET Assessment:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil data assessment.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

// FUNGSI KHUSUS DELETE UNTUK MENGHAPUS SOAL BERDASARKAN ID
const deleteMC = async (req, res) => {
    try {
        const { id } = req.params; 

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID Assessment wajib disertakan.",
                data: null,
                meta: {}
            });
        }

        // Jalankan pengecekan terlebih dahulu apakah datanya ada di database
        const existingAssessment = await MCModel.getAssessmentById(id);
        if (!existingAssessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} memang tidak ada atau sudah dihapus sebelumnya.`,
                data: null,
                meta: {}
            });
        }

        // Panggil model untuk menghapus data. 
        await MCModel.deleteAssessment(id);

        // Return Response dengan Meta sesuai Standar Kontrak
        res.status(200).json({
            success: true,
            message: `Haris Berhasil menghapus data assessment dengan ID ${id}.`,
            data: null,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat DELETE Assessment:", error);
        res.status(500).json({
            success: false,
            message: "Gagal menghapus data assessment.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

const exportToPDF = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Ambil data soal dari database seperti biasa
        const assessment = await MCModel.getAssessmentById(id);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: `Data assessment dengan ID ${id} tidak ditemukan untuk dicetak.`,
                data: null,
                meta: {}
            });
        }

        // 2. Inisialisasi Dokumen PDF Baru menggunakan PDFKit
        const doc = new PDFDocument({ margin: 50 });

        // Atur Header HTTP agar browser tahu bahwa ini adalah file PDF yang siap di-download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Soal_${assessment.topik.replace(/\s+/g, '_')}.pdf`);

        // Alirkan (pipe) hasil pembuatan PDF langsung ke response Express
        doc.pipe(res);

        // 3. Mulai Menggambar/Menulis isi PDF
        // === JUDUL UTAMA ===
        doc.fontSize(16).text(`KUMPULAN SOAL UJIAN MADRASAH`, { align: 'center' });
        doc.fontSize(12).text(`Mata Pelajaran: ${assessment.mata_pelajaran} | Kelas: ${assessment.tingkat_kelas}`, { align: 'center' });
        doc.text(`Topik: ${assessment.topik} | Kesulitan: ${assessment.tingkat_kesulitan}`, { align: 'center' });
        doc.moveDown(2); // Kasih jarak baris kosong

        // === LOOPING CETAK SOAL ===
        // Karena questions_json di database kamu berupa array of object
        const daftarSoal = assessment.questions_json || [];

        daftarSoal.forEach((q) => {
            // Tulis Teks Soal
            doc.fontSize(11).text(`${q.no}. ${q.soal}`, { align: 'justify' });
            doc.moveDown(0.5);

            // Tulis Pilihan Ganda (A, B, C, D, E)
            if (q.pilihan) {
                Object.entries(q.pilihan).forEach(([huruf, teksOpsi]) => {
                    doc.text(`   ${huruf}. ${teksOpsi}`);
                });
            }

            // Jika include_kunci bernilai true, tampilkan kunci dan pembahasan di bawah soal
            if (assessment.include_kunci && q.kunci) {
                doc.moveDown(0.5);
                doc.fillColor('green').text(`   * Kunci Jawaban: ${q.kunci}`, { bold: true });
                doc.fillColor('black').text(`   * Pembahasan: ${q.pembahasan || '-'}`);
            }

            doc.moveDown(1.5); // Jarak antar nomor soal
        });

        // Akhiri dokumen (PDF Selesai dibuat dan otomatis dikirim)
        doc.end();

    } catch (error) {
        console.error("Error saat Cetak PDF:", error);
        res.status(500).json({
            success: false,
            message: "Gagal membuat file cetak PDF di backend.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};

// FUNGSI KHUSUS GET ALL UNTUK MENAMPILKAN SEMUA DATA ASSESSMENT SOAL MULTIPLE CHOICE (MC)
const getAllMC = async (req, res) => {
    try {
        // Panggil fungsi model untuk mengambil semua data dari database
        const assessments = await MCModel.getAllAssessment(); // Pastikan fungsi ini ada di mcModel.js kamu nanti

        // Return Response dengan Meta sesuai Blueprint Dosen
        res.status(200).json({
            success: true,
            message: "Haris Berhasil mengambil semua data riwayat assessment soal pilihan ganda.",
            data: assessments,
            meta: {}
        });

    } catch (error) {
        console.error("Error saat GET ALL Assessment MC:", error);
        res.status(500).json({
            success: false,
            message: "Gagal mengambil semua data assessment pilihan ganda.",
            error: error.message,
            data: null,
            meta: {}
        });
    }
};
module.exports = { generateMC, updateMC, getMCById, deleteMC,exportToPDF,getAllMC };