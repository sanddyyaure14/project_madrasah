//UNIT08 (Halaman Preview RPP)
import React from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
} from 'react-native';

export default function UnitPlanPreviewScreen({ route }) {
    const {
        judul,
        mapel,
        kelas,
        pertemuan,
    } = route.params || {};

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>
                Preview RPP
            </Text>

            <View style={styles.card}>
                <Text style={styles.content}>
                    {`RENCANA PELAKSANAAN PEMBELAJARAN (RPP)

Kurikulum: Merdeka Belajar

Identitas:
• Judul Unit : ${judul || '-'}
• Mata Pelajaran : ${mapel || '-'}
• Kelas/Semester : ${kelas || '-'} / Ganjil
• Jumlah Pertemuan : ${pertemuan || '-'}
• Alokasi Waktu : ${pertemuan || 1} × 40 menit

Capaian Pembelajaran:
Peserta didik memahami materi ${judul || 'yang dipelajari'} dan mampu menerapkannya dalam kehidupan sehari-hari.

Tujuan Pembelajaran:
1. Menjelaskan pengertian ${judul || 'materi'}
2. Memahami konsep utama ${judul || 'materi'}
3. Mengimplementasikan nilai-nilai ${judul || 'materi'} dalam kehidupan sehari-hari

Kegiatan Pembelajaran:

PENDAHULUAN (10 menit)
• Salam dan doa pembuka
• Apersepsi terkait materi ${judul || 'pelajaran'}
• Menyampaikan tujuan pembelajaran

INTI (60 menit)
• Eksplorasi materi ${judul || 'pelajaran'}
• Diskusi kelompok
• Presentasi hasil diskusi
• Latihan dan tanya jawab

PENUTUP (10 menit)
• Refleksi pembelajaran
• Kesimpulan materi ${judul || 'pelajaran'}
• Doa penutup`}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#F5F1E8',
        flexGrow: 1,
    },

    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0F3D2E',
        marginBottom: 20,
    },

    card: {
        backgroundColor: '#FFFDF8',
        borderRadius: 20,
        padding: 20,
    },

    content: {
        fontSize: 15,
        lineHeight: 25,
        color: '#333',
    },
});