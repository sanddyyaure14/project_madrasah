const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate PDF untuk Academic Content
 */
const generateAcademicContentPDF = (contentData, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text(contentData.content_json.judul || 'Konten Akademik', {
                align: 'center'
            });
            doc.moveDown();

            // Metadata
            doc.fontSize(10).font('Helvetica');
            if (contentData.mata_pelajaran) {
                doc.text(`Mata Pelajaran: ${contentData.mata_pelajaran}`);
            }
            if (contentData.tingkat_kelas) {
                doc.text(`Tingkat Kelas: ${contentData.tingkat_kelas}`);
            }
            if (contentData.jenis_konten) {
                doc.text(`Jenis Konten: ${contentData.jenis_konten}`);
            }
            doc.moveDown();

            // Konten Utama
            doc.fontSize(12).font('Helvetica');
            const konten = contentData.content_json.konten || '';
            doc.text(konten, {
                align: 'justify',
                lineGap: 5
            });
            doc.moveDown();

            // Ringkasan
            if (contentData.content_json.ringkasan) {
                doc.fontSize(14).font('Helvetica-Bold').text('Ringkasan:', { underline: true });
                doc.fontSize(11).font('Helvetica').text(contentData.content_json.ringkasan);
                doc.moveDown();
            }

            // Kata Kunci
            if (contentData.content_json.kata_kunci && contentData.content_json.kata_kunci.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('Kata Kunci:', { underline: true });
                doc.fontSize(11).font('Helvetica').text(contentData.content_json.kata_kunci.join(', '));
                doc.moveDown();
            }

            // Referensi
            if (contentData.content_json.referensi && contentData.content_json.referensi.length > 0) {
                doc.fontSize(14).font('Helvetica-Bold').text('Referensi:', { underline: true });
                doc.fontSize(10).font('Helvetica');
                contentData.content_json.referensi.forEach((ref, index) => {
                    doc.text(`${index + 1}. ${ref}`);
                });
            }

            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate PDF untuk Syllabus
 */
const generateSyllabusPDF = (syllabusData, outputPath) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);

            doc.pipe(stream);

            // Header
            doc.fontSize(18).font('Helvetica-Bold').text('SILABUS', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(14).text(syllabusData.silabus_json.judul_silabus || 'Silabus Pembelajaran', { align: 'center' });
            doc.moveDown();

            // Informasi Umum
            doc.fontSize(10).font('Helvetica');
            doc.text(`Mata Pelajaran: ${syllabusData.mata_pelajaran}`);
            doc.text(`Kurikulum: ${syllabusData.kurikulum}`);
            doc.text(`Jenjang: ${syllabusData.jenjang}`);
            doc.text(`Kelas: ${syllabusData.tingkat_kelas}`);
            doc.text(`Semester: ${syllabusData.semester}`);
            if (syllabusData.tahun_ajaran) {
                doc.text(`Tahun Ajaran: ${syllabusData.tahun_ajaran}`);
            }
            doc.moveDown();

            // Kompetensi Inti
            if (syllabusData.silabus_json.kompetensi_inti && syllabusData.silabus_json.kompetensi_inti.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Kompetensi Inti:', { underline: true });
                doc.fontSize(10).font('Helvetica');
                syllabusData.silabus_json.kompetensi_inti.forEach((ki, index) => {
                    doc.text(`${index + 1}. ${ki}`, { indent: 20 });
                });
                doc.moveDown();
            }

            // Tabel Silabus
            if (syllabusData.silabus_json.tabel_silabus && syllabusData.silabus_json.tabel_silabus.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').text('Rencana Pembelajaran:', { underline: true });
                doc.moveDown(0.5);

                syllabusData.silabus_json.tabel_silabus.forEach((item, index) => {
                    doc.fontSize(11).font('Helvetica-Bold').text(`Minggu ${item.minggu_ke || index + 1}`);
                    doc.fontSize(9).font('Helvetica');
                    
                    if (item.kompetensi_dasar) {
                        doc.text(`Kompetensi Dasar: ${item.kompetensi_dasar}`, { indent: 10 });
                    }
                    if (item.materi_pokok) {
                        doc.text(`Materi Pokok: ${item.materi_pokok}`, { indent: 10 });
                    }
                    if (item.kegiatan_pembelajaran) {
                        doc.text(`Kegiatan: ${item.kegiatan_pembelajaran}`, { indent: 10 });
                    }
                    if (item.penilaian) {
                        doc.text(`Penilaian: ${item.penilaian}`, { indent: 10 });
                    }
                    if (item.alokasi_waktu) {
                        doc.text(`Alokasi Waktu: ${item.alokasi_waktu}`, { indent: 10 });
                    }
                    if (item.sumber_belajar) {
                        doc.text(`Sumber Belajar: ${item.sumber_belajar}`, { indent: 10 });
                    }
                    doc.moveDown(0.5);
                });
            }

            doc.end();

            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateAcademicContentPDF,
    generateSyllabusPDF
};
