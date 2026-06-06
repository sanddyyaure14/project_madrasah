// UNIT08 (Halaman Preview RPP)
import React from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
} from 'react-native';

export default function UnitPlanPreviewScreen({ route }) {

    const {
        data,
        judul,
        mapel,
        kelas,
        pertemuan,
    } = route.params || {};

    const unitPlan =
        typeof data?.unit_plan_json === 'string'
            ? JSON.parse(data.unit_plan_json)
            : data?.unit_plan_json;

    return (
        <ScrollView contentContainerStyle={styles.container}>

            <Text style={styles.header}>
                Preview RPP
            </Text>

            <View style={styles.card}>

                <Text style={styles.sectionTitle}>
                    Informasi Umum
                </Text>

                <Text style={styles.content}>
                    Mata Pelajaran:
                    {' '}
                    {unitPlan?.informasi_umum?.mata_pelajaran || mapel}
                </Text>

                <Text style={styles.content}>
                    Judul Unit:
                    {' '}
                    {unitPlan?.informasi_umum?.judul_unit || judul}
                </Text>

                <Text style={styles.content}>
                    Kelas:
                    {' '}
                    {unitPlan?.informasi_umum?.kelas || kelas}
                </Text>

                <Text style={styles.content}>
                    Alokasi Waktu:
                    {' '}
                    {unitPlan?.informasi_umum?.alokasi_waktu || `${pertemuan} Pertemuan`}
                </Text>

                <Text style={styles.sectionTitle}>
                    Kompetensi Awal
                </Text>

                {unitPlan?.informasi_umum?.kompetensi_awal?.map(
                    (item, index) => (
                        <Text
                            key={index}
                            style={styles.content}
                        >
                            • {item}
                        </Text>
                    )
                )}

                <Text style={styles.sectionTitle}>
                    Profil Pelajar Pancasila
                </Text>

                {unitPlan?.informasi_umum?.profil_pelajar_pancasila?.map(
                    (item, index) => (
                        <Text
                            key={index}
                            style={styles.content}
                        >
                            • {item}
                        </Text>
                    )
                )}

                <Text style={styles.sectionTitle}>
                    Sarana dan Prasarana
                </Text>

                {unitPlan?.informasi_umum?.sarana_prasarana?.map(
                    (item, index) => (
                        <Text
                            key={index}
                            style={styles.content}
                        >
                            • {item}
                        </Text>
                    )
                )}

                <Text style={styles.sectionTitle}>
                    Target Peserta Didik
                </Text>

                <Text style={styles.content}>
                    {unitPlan?.informasi_umum?.target_peserta_didik}
                </Text>

                <Text style={styles.sectionTitle}>
                    Tujuan Pembelajaran
                </Text>

                {unitPlan?.komponen_inti?.tujuan_pembelajaran?.map(
                    (item, index) => (
                        <Text
                            key={index}
                            style={styles.content}
                        >
                            • {item}
                        </Text>
                    )
                )}

                <Text style={styles.sectionTitle}>
                    Pemahaman Bermakna
                </Text>

                <Text style={styles.content}>
                    {unitPlan?.komponen_inti?.pemahaman_bermakna}
                </Text>

                <Text style={styles.sectionTitle}>
                    Pertanyaan Pemantik
                </Text>

                {unitPlan?.komponen_inti?.pertanyaan_pemantik?.map(
                    (item, index) => (
                        <Text
                            key={index}
                            style={styles.content}
                        >
                            • {item}
                        </Text>
                    )
                )}

                <Text style={styles.sectionTitle}>
                    Asesmen
                </Text>

                {unitPlan?.komponen_inti?.asesmen?.map(
                    (item, index) => (
                        <Text
                            key={index}
                            style={styles.content}
                        >
                            • {item}
                        </Text>
                    )
                )}

                <Text style={styles.sectionTitle}>
                    Pengayaan dan Remedial
                </Text>

                {unitPlan?.komponen_inti?.pengayaan_dan_remedial?.map(
                    (item, index) => (
                        <Text
                            key={index}
                            style={styles.content}
                        >
                            • {item}
                        </Text>
                    )
                )}

                <Text style={styles.sectionTitle}>
                    Kegiatan Pembelajaran
                </Text>

                {unitPlan?.komponen_inti?.kegiatan_pembelajaran?.map(
                    (pertemuanItem, index) => (
                        <View
                            key={index}
                            style={styles.meetingCard}
                        >

                            <Text style={styles.meetingTitle}>
                                Pertemuan {pertemuanItem.pertemuan_ke}
                            </Text>

                            <Text style={styles.subTitle}>
                                Pendahuluan
                            </Text>

                            {pertemuanItem.pendahuluan?.map(
                                (item, idx) => (
                                    <Text
                                        key={idx}
                                        style={styles.content}
                                    >
                                        • {item}
                                    </Text>
                                )
                            )}

                            <Text style={styles.subTitle}>
                                Kegiatan Inti
                            </Text>

                            {pertemuanItem.kegiatan_inti?.map(
                                (item, idx) => (
                                    <Text
                                        key={idx}
                                        style={styles.content}
                                    >
                                        • {item}
                                    </Text>
                                )
                            )}

                            <Text style={styles.subTitle}>
                                Penutup
                            </Text>

                            {pertemuanItem.penutup?.map(
                                (item, idx) => (
                                    <Text
                                        key={idx}
                                        style={styles.content}
                                    >
                                        • {item}
                                    </Text>
                                )
                            )}

                        </View>
                    )
                )}

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

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F3D2E',
        marginTop: 20,
        marginBottom: 10,
    },

    subTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0F3D2E',
        marginTop: 12,
        marginBottom: 6,
    },

    meetingTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#0F3D2E',
        marginBottom: 10,
    },

    meetingCard: {
        marginTop: 15,
        padding: 15,
        borderRadius: 12,
        backgroundColor: '#FAF7F0',
    },

    content: {
        fontSize: 15,
        lineHeight: 24,
        color: '#333',
        marginBottom: 5,
    },
});