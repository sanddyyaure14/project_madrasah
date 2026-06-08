import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadAsync, documentDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';
import FeedbackRating from '../components/FeedbackRating';

export default function UnitPlanDetailScreen({ route, navigation }) {
    const { id, data: initialData } = route.params || {};
    const { token } = useAuth();
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!initialData);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        console.log('UNIT PLAN DATA (initial):', JSON.stringify(initialData, null, 2));
        
        // Jika tidak ada data atau data tidak lengkap, fetch dari server
        if (!initialData || !initialData.unit_plan_json) {
            fetchData();
        } else {
            setData(initialData);
        }
    }, [initialData]);

    const fetchData = async () => {
        if (!id || !token) return;
        
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/unit-plan/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const json = await res.json();
            console.log('UNIT PLAN DATA (fetched):', JSON.stringify(json, null, 2));
            
            if (json.success && json.data) {
                setData(json.data);
            }
        } catch (err) {
            console.error('Error fetching unit plan:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Handle Copy ─────────────────────────────────────────────────────────
    const handleCopy = () => {
        if (!data) return;
        
        const unitPlanJson = data.unit_plan_json || {};
        const infoUmum = unitPlanJson.informasi_umum || {};
        const komponenInti = unitPlanJson.komponen_inti || {};
        
        let text = `MODUL AJAR / RPP\n`;
        text += `${data.judul_unit}\n\n`;
        text += `Mata Pelajaran: ${data.mata_pelajaran}\n`;
        text += `Kelas: ${data.tingkat_kelas}\n\n`;
        
        text += `═══ INFORMASI UMUM ═══\n\n`;
        if (infoUmum.alokasi_waktu) text += `Alokasi Waktu: ${infoUmum.alokasi_waktu}\n\n`;
        
        if (infoUmum.kompetensi_awal && infoUmum.kompetensi_awal.length > 0) {
            text += `Kompetensi Awal:\n`;
            infoUmum.kompetensi_awal.forEach(item => text += `• ${item}\n`);
            text += `\n`;
        }
        
        text += `\n═══ KOMPONEN INTI ═══\n\n`;
        if (komponenInti.tujuan_pembelajaran && komponenInti.tujuan_pembelajaran.length > 0) {
            text += `Tujuan Pembelajaran:\n`;
            komponenInti.tujuan_pembelajaran.forEach(item => text += `• ${item}\n`);
            text += `\n`;
        }
        
        if (komponenInti.kegiatan_pembelajaran && komponenInti.kegiatan_pembelajaran.length > 0) {
            text += `Kegiatan Pembelajaran:\n\n`;
            komponenInti.kegiatan_pembelajaran.forEach((p, idx) => {
                text += `Pertemuan ${p.pertemuan_ke || idx + 1}:\n`;
                if (p.pendahuluan) {
                    text += `Pendahuluan:\n`;
                    p.pendahuluan.forEach(item => text += `• ${item}\n`);
                }
                if (p.kegiatan_inti) {
                    text += `Kegiatan Inti:\n`;
                    p.kegiatan_inti.forEach(item => text += `• ${item}\n`);
                }
                if (p.penutup) {
                    text += `Penutup:\n`;
                    p.penutup.forEach(item => text += `• ${item}\n`);
                }
                text += `\n`;
            });
        }
        
        Share.share({ message: text })
            .then(() => Alert.alert('Berhasil', 'Konten berhasil dibagikan'))
            .catch(err => console.error('Share error:', err));
    };

    // ─── Handle Delete ───────────────────────────────────────────────────────
    const handleDelete = () => {
        Alert.alert(
            'Hapus RPP',
            'Yakin ingin menghapus RPP ini? Tindakan ini tidak dapat dibatalkan.',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_URL}/unit-plan/${id}`, {
                                method: 'DELETE',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });
                            const json = await res.json();
                            
                            if (json.success) {
                                Alert.alert('Berhasil', 'RPP berhasil dihapus');
                                navigation.goBack();
                            } else {
                                Alert.alert('Gagal', json.message || 'Tidak dapat menghapus RPP');
                            }
                        } catch (err) {
                            console.error('Delete error:', err);
                            Alert.alert('Error', 'Tidak dapat terhubung ke server');
                        }
                    },
                },
            ]
        );
    };

    // ─── Handle Download DOCX ────────────────────────────────────────────────
    const handleDownloadDocx = async () => {
        if (!id || !token) return;
        
        try {
            setDownloading(true);
            const url = `${API_URL}/unit-plan/download/${id}/docx`;
            const localUri = documentDirectory + `rpp_${data.judul_unit.replace(/\s+/g, '_')}.docx`;
            
            const result = await downloadAsync(url, localUri, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            if (result.status !== 200) {
                Alert.alert('Gagal', 'Server menolak permintaan download.');
                return;
            }
            
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(result.uri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    dialogTitle: 'Buka RPP.docx',
                });
            } else {
                Alert.alert('Selesai', `File tersimpan di: ${result.uri}`);
            }
        } catch (err) {
            console.error('Download DOCX error:', err);
            Alert.alert('Error', 'Gagal download file: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    // ─── Handle Download PDF ─────────────────────────────────────────────────
    const handleDownloadPdf = async () => {
        Alert.alert('Info', 'Fitur download PDF akan segera hadir. Sementara gunakan DOCX.');
    };

    // ─── Handle Edit ─────────────────────────────────────────────────────────
    const handleEdit = () => {
        navigation.navigate('UnitPlanEdit', { id, data });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={C.primary} />
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Data tidak ditemukan</Text>
            </View>
        );
    }

    const unitPlanJson = data.unit_plan_json || {};
    const infoUmum = unitPlanJson.informasi_umum || {};
    const komponenInti = unitPlanJson.komponen_inti || {};

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Action Buttons */}
            <View style={styles.actionBar}>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnEdit]} onPress={handleEdit}>
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnCopy]} onPress={handleCopy}>
                    <Ionicons name="copy-outline" size={18} color={C.primary} />
                    <Text style={[styles.actionBtnText, { color: C.primary }]}>Salin</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionBtn, styles.actionBtnDownload]} 
                    onPress={handleDownloadDocx}
                    disabled={downloading}
                >
                    {downloading ? (
                        <ActivityIndicator size="small" color={C.primary} />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={18} color={C.primary} />
                            <Text style={[styles.actionBtnText, { color: C.primary }]}>DOCX</Text>
                        </>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDelete]} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={18} color={C.danger} />
                </TouchableOpacity>
            </View>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{data.judul_unit || 'Modul Ajar / RPP'}</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>📚 {data.mata_pelajaran}</Text>
                    <Text style={styles.metaText}>👥 Kelas {data.tingkat_kelas}</Text>
                </View>
            </View>

            {/* Informasi Umum */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 INFORMASI UMUM</Text>
                
                {infoUmum.alokasi_waktu && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Alokasi Waktu</Text>
                        <Text style={styles.fieldValue}>{infoUmum.alokasi_waktu}</Text>
                    </View>
                )}

                {infoUmum.kompetensi_awal && infoUmum.kompetensi_awal.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Kompetensi Awal</Text>
                        {infoUmum.kompetensi_awal.map((item, idx) => (
                            <Text key={idx} style={styles.listItem}>• {item}</Text>
                        ))}
                    </View>
                )}

                {infoUmum.profil_pelajar_pancasila && infoUmum.profil_pelajar_pancasila.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Profil Pelajar Pancasila</Text>
                        {infoUmum.profil_pelajar_pancasila.map((item, idx) => (
                            <Text key={idx} style={styles.listItem}>• {item}</Text>
                        ))}
                    </View>
                )}

                {infoUmum.sarana_prasarana && infoUmum.sarana_prasarana.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Sarana & Prasarana</Text>
                        {infoUmum.sarana_prasarana.map((item, idx) => (
                            <Text key={idx} style={styles.listItem}>• {item}</Text>
                        ))}
                    </View>
                )}

                {infoUmum.target_peserta_didik && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Target Peserta Didik</Text>
                        <Text style={styles.fieldValue}>{infoUmum.target_peserta_didik}</Text>
                    </View>
                )}
            </View>

            {/* Komponen Inti */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 KOMPONEN INTI</Text>

                {komponenInti.tujuan_pembelajaran && komponenInti.tujuan_pembelajaran.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Tujuan Pembelajaran</Text>
                        {komponenInti.tujuan_pembelajaran.map((item, idx) => (
                            <Text key={idx} style={styles.listItem}>• {item}</Text>
                        ))}
                    </View>
                )}

                {komponenInti.pemahaman_bermakna && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Pemahaman Bermakna</Text>
                        <Text style={styles.fieldValue}>{komponenInti.pemahaman_bermakna}</Text>
                    </View>
                )}

                {komponenInti.pertanyaan_pemantik && komponenInti.pertanyaan_pemantik.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Pertanyaan Pemantik</Text>
                        {komponenInti.pertanyaan_pemantik.map((item, idx) => (
                            <Text key={idx} style={styles.listItem}>• {item}</Text>
                        ))}
                    </View>
                )}

                {/* Kegiatan Pembelajaran */}
                {komponenInti.kegiatan_pembelajaran && komponenInti.kegiatan_pembelajaran.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Kegiatan Pembelajaran</Text>
                        {komponenInti.kegiatan_pembelajaran.map((pertemuan, idx) => (
                            <View key={idx} style={styles.pertemuanCard}>
                                <Text style={styles.pertemuanTitle}>
                                    📅 Pertemuan {pertemuan.pertemuan_ke || idx + 1}
                                </Text>
                                
                                {pertemuan.pendahuluan && pertemuan.pendahuluan.length > 0 && (
                                    <View style={styles.kegiatanSection}>
                                        <Text style={styles.kegiatanLabel}>Pendahuluan</Text>
                                        {pertemuan.pendahuluan.map((item, i) => (
                                            <Text key={i} style={styles.listItem}>• {item}</Text>
                                        ))}
                                    </View>
                                )}

                                {pertemuan.kegiatan_inti && pertemuan.kegiatan_inti.length > 0 && (
                                    <View style={styles.kegiatanSection}>
                                        <Text style={styles.kegiatanLabel}>Kegiatan Inti</Text>
                                        {pertemuan.kegiatan_inti.map((item, i) => (
                                            <Text key={i} style={styles.listItem}>• {item}</Text>
                                        ))}
                                    </View>
                                )}

                                {pertemuan.penutup && pertemuan.penutup.length > 0 && (
                                    <View style={styles.kegiatanSection}>
                                        <Text style={styles.kegiatanLabel}>Penutup</Text>
                                        {pertemuan.penutup.map((item, i) => (
                                            <Text key={i} style={styles.listItem}>• {item}</Text>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {komponenInti.asesmen && komponenInti.asesmen.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Asesmen</Text>
                        {komponenInti.asesmen.map((item, idx) => (
                            <Text key={idx} style={styles.listItem}>• {item}</Text>
                        ))}
                    </View>
                )}

                {komponenInti.pengayaan_dan_remedial && komponenInti.pengayaan_dan_remedial.length > 0 && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Pengayaan & Remedial</Text>
                        {komponenInti.pengayaan_dan_remedial.map((item, idx) => (
                            <Text key={idx} style={styles.listItem}>• {item}</Text>
                        ))}
                    </View>
                )}
            </View>

            {/* Feedback Rating */}
            {data.request_id && (
                <View style={{ marginTop: 24 }}>
                    <FeedbackRating 
                        requestId={data.request_id}
                        endpoint="unit-plan"
                        featureLabel="Modul Ajar / RPP" 
                    />
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: C.bg,
    },
    errorText: {
        fontSize: 14,
        color: C.muted,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: C.ink,
        marginBottom: 8,
        lineHeight: 32,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 12,
    },
    metaText: {
        fontSize: 13,
        color: C.muted,
    },
    section: {
        backgroundColor: C.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: C.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.ink,
        marginBottom: 12,
    },
    field: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: C.ink,
        marginBottom: 6,
    },
    fieldValue: {
        fontSize: 14,
        color: C.ink,
        lineHeight: 22,
    },
    listItem: {
        fontSize: 14,
        color: C.ink,
        lineHeight: 22,
        marginBottom: 4,
    },
    pertemuanCard: {
        backgroundColor: C.bg,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
    },
    pertemuanTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: C.primary,
        marginBottom: 12,
    },
    kegiatanSection: {
        marginBottom: 12,
    },
    kegiatanLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: C.muted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionBar: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    actionBtnEdit: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    actionBtnCopy: {
        backgroundColor: '#fff',
        borderColor: C.primary,
    },
    actionBtnDownload: {
        backgroundColor: '#fff',
        borderColor: C.primary,
    },
    actionBtnDelete: {
        backgroundColor: '#fff',
        borderColor: C.danger,
        flex: 0.5,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
});