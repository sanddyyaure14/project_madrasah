import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Share, Modal, TextInput } from 'react-native';
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
    const [editVisible, setEditVisible] = useState(false);

    useEffect(() => {
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success && json.data) setData(json.data);
        } catch (err) {
            console.error('Error fetching unit plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!data) return;
        const unitPlanJson = data.unit_plan_json || {};
        const infoUmum = unitPlanJson.informasi_umum || {};
        const komponenInti = unitPlanJson.komponen_inti || {};
        
        let text = `MODUL AJAR / RPP\n${data.judul_unit}\n\nMata Pelajaran: ${data.mata_pelajaran}\nKelas: ${data.tingkat_kelas}\n\n`;
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
                if (p.pendahuluan) { text += `Pendahuluan:\n`; p.pendahuluan.forEach(item => text += `• ${item}\n`); }
                if (p.kegiatan_inti) { text += `Kegiatan Inti:\n`; p.kegiatan_inti.forEach(item => text += `• ${item}\n`); }
                if (p.penutup) { text += `Penutup:\n`; p.penutup.forEach(item => text += `• ${item}\n`); }
                text += `\n`;
            });
        }
        
        Share.share({ message: text })
            .catch(err => console.error('Share error:', err));
    };

    const handleDelete = () => {
        Alert.alert('Hapus RPP', 'Yakin ingin menghapus RPP ini? Tindakan ini tidak dapat dibatalkan.', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus', style: 'destructive',
                onPress: async () => {
                    try {
                        const res = await fetch(`${API_URL}/unit-plan/${id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const json = await res.json();
                        if (json.success) {
                            Alert.alert('Berhasil', 'RPP berhasil dihapus');
                            navigation.goBack();
                        } else {
                            Alert.alert('Gagal', json.message || 'Tidak dapat menghapus RPP');
                        }
                    } catch (err) {
                        Alert.alert('Error', 'Tidak dapat terhubung ke server');
                    }
                },
            },
        ]);
    };

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
            Alert.alert('Error', 'Gagal download file: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

    async function handleSaveEdit(payload) {
        try {
            const res = await fetch(`${API_URL}/unit-plan/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setEditVisible(false);
                Alert.alert('Tersimpan', 'Perubahan berhasil disimpan.');
            } else {
                Alert.alert('Gagal', json.message || 'Tidak dapat menyimpan.');
            }
        } catch {
            Alert.alert('Error', 'Tidak dapat terhubung ke server.');
        }
    }

    const handleEdit = () => {
        setEditVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.loadingText}>Memuat RPP...</Text>
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Data tidak ditemukan</Text>
            </View>
        );
    }

    const unitPlanJson = data.unit_plan_json || {};
    const infoUmum = unitPlanJson.informasi_umum || {};
    const komponenInti = unitPlanJson.komponen_inti || {};

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Result Panel */}
                <View style={[styles.resultPanel, S.shadow]}>
                    {/* Header */}
                    <View style={styles.resultHeader}>
                        <View style={styles.resultIconWrap}>
                            <Ionicons name="folder-open" size={28} color={C.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.resultTitle}>{data.judul_unit || 'Modul Ajar / RPP'}</Text>
                            <Text style={styles.resultSubtitle}>{data.mata_pelajaran}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>Kelas {data.tingkat_kelas}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Informasi Umum */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle" size={16} color={C.primary} />
                            <Text style={styles.sectionTitleText}>INFORMASI UMUM</Text>
                        </View>
                        <View style={styles.sectionBody}>
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
                                        <View key={idx} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                    ))}
                                </View>
                            )}
                            {infoUmum.profil_pelajar_pancasila && infoUmum.profil_pelajar_pancasila.length > 0 && (
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Profil Pelajar Pancasila</Text>
                                    {infoUmum.profil_pelajar_pancasila.map((item, idx) => (
                                        <View key={idx} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                    ))}
                                </View>
                            )}
                            {infoUmum.sarana_prasarana && infoUmum.sarana_prasarana.length > 0 && (
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Sarana & Prasarana</Text>
                                    {infoUmum.sarana_prasarana.map((item, idx) => (
                                        <View key={idx} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
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
                    </View>

                    {/* Komponen Inti */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="bulb" size={16} color={C.primary} />
                            <Text style={styles.sectionTitleText}>KOMPONEN INTI</Text>
                        </View>
                        <View style={styles.sectionBody}>
                            {komponenInti.tujuan_pembelajaran && komponenInti.tujuan_pembelajaran.length > 0 && (
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Tujuan Pembelajaran</Text>
                                    {komponenInti.tujuan_pembelajaran.map((item, idx) => (
                                        <View key={idx} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
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
                                        <View key={idx} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                    ))}
                                </View>
                            )}

                            {/* Kegiatan Pembelajaran */}
                            {komponenInti.kegiatan_pembelajaran && komponenInti.kegiatan_pembelajaran.length > 0 && (
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Kegiatan Pembelajaran</Text>
                                    {komponenInti.kegiatan_pembelajaran.map((pertemuan, idx) => (
                                        <View key={idx} style={styles.pertemuanCard}>
                                            <View style={styles.pertemuanHeader}>
                                                <Ionicons name="calendar-outline" size={14} color={C.primary} />
                                                <Text style={styles.pertemuanTitleText}>Pertemuan {pertemuan.pertemuan_ke || idx + 1}</Text>
                                            </View>
                                            <View style={styles.pertemuanBody}>
                                                {pertemuan.pendahuluan && pertemuan.pendahuluan.length > 0 && (
                                                    <View style={styles.kegiatanSection}>
                                                        <Text style={styles.kegiatanLabel}>Pendahuluan</Text>
                                                        {pertemuan.pendahuluan.map((item, i) => (
                                                            <View key={`pend-${i}`} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                                        ))}
                                                    </View>
                                                )}
                                                {pertemuan.kegiatan_inti && pertemuan.kegiatan_inti.length > 0 && (
                                                    <View style={styles.kegiatanSection}>
                                                        <Text style={styles.kegiatanLabel}>Kegiatan Inti</Text>
                                                        {pertemuan.kegiatan_inti.map((item, i) => (
                                                            <View key={`inti-${i}`} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                                        ))}
                                                    </View>
                                                )}
                                                {pertemuan.penutup && pertemuan.penutup.length > 0 && (
                                                    <View style={styles.kegiatanSection}>
                                                        <Text style={styles.kegiatanLabel}>Penutup</Text>
                                                        {pertemuan.penutup.map((item, i) => (
                                                            <View key={`tutup-${i}`} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {komponenInti.asesmen && komponenInti.asesmen.length > 0 && (
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Asesmen</Text>
                                    {komponenInti.asesmen.map((item, idx) => (
                                        <View key={idx} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                    ))}
                                </View>
                            )}
                            {komponenInti.pengayaan_dan_remedial && komponenInti.pengayaan_dan_remedial.length > 0 && (
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Pengayaan & Remedial</Text>
                                    {komponenInti.pengayaan_dan_remedial.map((item, idx) => (
                                        <View key={idx} style={styles.listItem}><View style={styles.bullet}/><Text style={styles.listText}>{item}</Text></View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.resultActions}>
                        <TouchableOpacity style={styles.btnEdit} onPress={handleEdit} activeOpacity={0.8}>
                            <Ionicons name="create-outline" size={16} color={C.primary} />
                            <Text style={styles.btnEditText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnCopy} onPress={handleCopy} activeOpacity={0.8}>
                            <Ionicons name="copy-outline" size={16} color={C.primary} />
                            <Text style={styles.btnCopyText}>Salin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnDelete} onPress={handleDelete} activeOpacity={0.8}>
                            <Ionicons name="trash-outline" size={16} color={C.danger} />
                            <Text style={styles.btnDeleteText}>Hapus</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Export buttons */}
                    <TouchableOpacity style={styles.exportBtn} onPress={handleDownloadDocx} disabled={downloading} activeOpacity={0.8}>
                        {downloading ? (
                            <ActivityIndicator size="small" color={C.primary} />
                        ) : (
                            <>
                                <Ionicons name="document-outline" size={16} color={C.primary} />
                                <Text style={styles.exportBtnText}>Export DOCX</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Rating & Feedback AI */}
                    {data.request_id && (
                        <>
                            <Text style={[styles.sectionGroupTitle, { marginTop: 16 }]}>Nilai Hasil Generate</Text>
                            <FeedbackRating requestId={data.request_id} endpoint="unit-plan" featureLabel="Modul Ajar / RPP" />
                        </>
                    )}
                </View>
            </ScrollView>

            <EditModal 
                visible={editVisible} 
                data={data} 
                onClose={() => setEditVisible(false)} 
                onSave={handleSaveEdit} 
            />
        </View>
    );
}

function EditModal({ visible, data, onClose, onSave }) {
    const [judulUnit, setJudulUnit] = useState('');
    
    // Informasi Umum
    const [alokasiWaktu, setAlokasiWaktu] = useState('');
    const [kompetensiAwal, setKompetensiAwal] = useState('');
    const [profilPelajarPancasila, setProfilPelajarPancasila] = useState('');
    const [saranaPrasarana, setSaranaPrasarana] = useState('');
    const [targetPesertaDidik, setTargetPesertaDidik] = useState('');

    // Komponen Inti
    const [tujuanPembelajaran, setTujuanPembelajaran] = useState('');
    const [pemahamanBermakna, setPemahamanBermakna] = useState('');
    const [pertanyaanPemantik, setPertanyaanPemantik] = useState('');
    const [kegiatan, setKegiatan] = useState([]);
    const [asesmen, setAsesmen] = useState('');
    const [pengayaanDanRemedial, setPengayaanDanRemedial] = useState('');

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (data && visible) {
            setJudulUnit(data.judul_unit || '');
            const unitPlanJson = data.unit_plan_json || {};
            const infoUmum = unitPlanJson.informasi_umum || {};
            const komponenInti = unitPlanJson.komponen_inti || {};
            
            // Info Umum
            setAlokasiWaktu(infoUmum.alokasi_waktu || '');
            setKompetensiAwal(infoUmum.kompetensi_awal?.join('\n') || '');
            setProfilPelajarPancasila(infoUmum.profil_pelajar_pancasila?.join('\n') || '');
            setSaranaPrasarana(infoUmum.sarana_prasarana?.join('\n') || '');
            setTargetPesertaDidik(infoUmum.target_peserta_didik || '');

            // Komponen Inti
            setTujuanPembelajaran(komponenInti.tujuan_pembelajaran?.join('\n') || '');
            setPemahamanBermakna(komponenInti.pemahaman_bermakna || '');
            setPertanyaanPemantik(komponenInti.pertanyaan_pemantik?.join('\n') || '');
            setAsesmen(komponenInti.asesmen?.join('\n') || '');
            setPengayaanDanRemedial(komponenInti.pengayaan_dan_remedial?.join('\n') || '');
            
            // Deep copy kegiatan
            setKegiatan(JSON.parse(JSON.stringify(komponenInti.kegiatan_pembelajaran || [])));
        }
    }, [data, visible]);

    function updateKegiatan(pertemuanIdx, field, value) {
        setKegiatan(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            copy[pertemuanIdx][field] = value.split('\n').filter(s => s.trim() !== '');
            return copy;
        });
    }

    async function handleSave() {
        if (!judulUnit.trim()) { Alert.alert('Validasi', 'Judul tidak boleh kosong.'); return; }
        setSaving(true);
        const unitPlanJson = data.unit_plan_json || {};
        const infoUmum = unitPlanJson.informasi_umum || {};
        const komponenInti = unitPlanJson.komponen_inti || {};
        
        const updatedJson = {
            ...unitPlanJson,
            informasi_umum: {
                ...infoUmum,
                alokasi_waktu: alokasiWaktu.trim(),
                kompetensi_awal: kompetensiAwal.split('\n').filter(s => s.trim() !== ''),
                profil_pelajar_pancasila: profilPelajarPancasila.split('\n').filter(s => s.trim() !== ''),
                sarana_prasarana: saranaPrasarana.split('\n').filter(s => s.trim() !== ''),
                target_peserta_didik: targetPesertaDidik.trim()
            },
            komponen_inti: {
                ...komponenInti,
                tujuan_pembelajaran: tujuanPembelajaran.split('\n').filter(s => s.trim() !== ''),
                pemahaman_bermakna: pemahamanBermakna.trim(),
                pertanyaan_pemantik: pertanyaanPemantik.split('\n').filter(s => s.trim() !== ''),
                asesmen: asesmen.split('\n').filter(s => s.trim() !== ''),
                pengayaan_dan_remedial: pengayaanDanRemedial.split('\n').filter(s => s.trim() !== ''),
                kegiatan_pembelajaran: kegiatan
            }
        };

        await onSave({
            judul_unit: judulUnit.trim(),
            unit_plan_json: updatedJson
        });
        setSaving(false);
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={styles.modalRoot}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit RPP</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={C.ink} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.editInfoBox}>
                        <Ionicons name="information-circle" size={14} color={C.primary} />
                        <Text style={styles.editInfoText}>Edit komponen RPP. Tiap baris baru pada kolom daftar akan menjadi satu poin (bullet).</Text>
                    </View>

                    {/* --- INFORMASI UMUM --- */}
                    <Text style={styles.sectionGroupTitle}>INFORMASI UMUM</Text>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Judul RPP *</Text>
                        <TextInput
                            style={styles.editInput}
                            value={judulUnit}
                            onChangeText={setJudulUnit}
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Alokasi Waktu</Text>
                        <TextInput
                            style={styles.editInput}
                            value={alokasiWaktu}
                            onChangeText={setAlokasiWaktu}
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Target Peserta Didik</Text>
                        <TextInput
                            style={styles.editInput}
                            value={targetPesertaDidik}
                            onChangeText={setTargetPesertaDidik}
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Kompetensi Awal</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={kompetensiAwal}
                            onChangeText={setKompetensiAwal}
                            multiline
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Profil Pelajar Pancasila</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={profilPelajarPancasila}
                            onChangeText={setProfilPelajarPancasila}
                            multiline
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Sarana & Prasarana</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={saranaPrasarana}
                            onChangeText={setSaranaPrasarana}
                            multiline
                        />
                    </View>

                    {/* --- KOMPONEN INTI --- */}
                    <Text style={[styles.sectionGroupTitle, { marginTop: 12 }]}>KOMPONEN INTI</Text>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Tujuan Pembelajaran</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top' }]}
                            value={tujuanPembelajaran}
                            onChangeText={setTujuanPembelajaran}
                            multiline
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Pemahaman Bermakna</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={pemahamanBermakna}
                            onChangeText={setPemahamanBermakna}
                            multiline
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Pertanyaan Pemantik</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={pertanyaanPemantik}
                            onChangeText={setPertanyaanPemantik}
                            multiline
                        />
                    </View>

                    <Text style={[styles.sectionGroupTitle, { marginTop: 12 }]}>KEGIATAN PEMBELAJARAN</Text>
                    {kegiatan.map((akt, aktIdx) => (
                        <View key={aktIdx} style={styles.editAktCard}>
                            <View style={styles.editAktHeader}>
                                <View style={styles.editAktBadge}>
                                    <Text style={styles.editAktBadgeText}>{akt.pertemuan_ke || aktIdx + 1}</Text>
                                </View>
                                <Text style={styles.editAktTipe}>PERTEMUAN {akt.pertemuan_ke || aktIdx + 1}</Text>
                            </View>

                            <View style={styles.editGroup}>
                                <Text style={styles.editLabel}>Pendahuluan</Text>
                                <TextInput
                                    style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                                    value={akt.pendahuluan?.join('\n') || ''}
                                    onChangeText={v => updateKegiatan(aktIdx, 'pendahuluan', v)}
                                    multiline
                                />
                            </View>

                            <View style={styles.editGroup}>
                                <Text style={styles.editLabel}>Kegiatan Inti</Text>
                                <TextInput
                                    style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top' }]}
                                    value={akt.kegiatan_inti?.join('\n') || ''}
                                    onChangeText={v => updateKegiatan(aktIdx, 'kegiatan_inti', v)}
                                    multiline
                                />
                            </View>

                            <View style={styles.editGroup}>
                                <Text style={styles.editLabel}>Penutup</Text>
                                <TextInput
                                    style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                                    value={akt.penutup?.join('\n') || ''}
                                    onChangeText={v => updateKegiatan(aktIdx, 'penutup', v)}
                                    multiline
                                />
                            </View>
                        </View>
                    ))}

                    <Text style={[styles.sectionGroupTitle, { marginTop: 12 }]}>PENUTUP</Text>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Asesmen</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={asesmen}
                            onChangeText={setAsesmen}
                            multiline
                        />
                    </View>
                    <View style={styles.editGroup}>
                        <Text style={styles.editLabel}>Pengayaan & Remedial</Text>
                        <TextInput
                            style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                            value={pengayaanDanRemedial}
                            onChangeText={setPengayaanDanRemedial}
                            multiline
                        />
                    </View>

                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                        <Text style={styles.btnCancelText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btnSaveModal, saving && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={styles.btnSaveModalText}>Simpan</Text></>}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 48, gap: 16 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg },
    loadingText: { fontSize: 14, color: C.muted },
    
    resultPanel: { backgroundColor: C.card, borderRadius: 20, padding: 20, gap: 16 },
    resultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    resultIconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    resultTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
    resultSubtitle: { fontSize: 13, color: C.muted, marginTop: 2 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    badge: { backgroundColor: C.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700', color: C.primary },

    sectionCard: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
    sectionTitleText: { fontSize: 12, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionBody: { padding: 14, gap: 14 },
    field: { gap: 4 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
    fieldValue: { fontSize: 13, color: C.ink, lineHeight: 20 },
    listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
    bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.muted, marginTop: 8 },
    listText: { flex: 1, fontSize: 13, color: C.ink, lineHeight: 20 },

    pertemuanCard: { backgroundColor: '#fffbeb', borderRadius: 10, borderWidth: 1, borderColor: '#fef3c7', overflow: 'hidden', marginTop: 8 },
    pertemuanHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#fef3c7' },
    pertemuanTitleText: { fontSize: 12, fontWeight: '700', color: C.warning, textTransform: 'uppercase', letterSpacing: 0.5 },
    pertemuanBody: { padding: 10, gap: 10 },
    kegiatanSection: { gap: 4 },
    kegiatanLabel: { fontSize: 11, fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: 0.5 },

    sectionGroupTitle: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },

    resultActions: { flexDirection: 'row', gap: 10 },
    btnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 12 },
    btnEditText: { fontSize: 14, fontWeight: '600', color: C.primary },
    btnCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.primary, borderRadius: 12, paddingVertical: 12 },
    btnCopyText: { fontSize: 14, fontWeight: '600', color: C.primary },
    btnDelete: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.danger, borderRadius: 12, paddingVertical: 12 },
    btnDeleteText: { fontSize: 14, fontWeight: '600', color: C.danger },

    exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, backgroundColor: C.bg },
    exportBtnText: { fontSize: 14, fontWeight: '600', color: C.primary },

    modalRoot: { flex: 1, backgroundColor: C.bg },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card },
    modalTitle: { fontSize: 18, fontWeight: '700', color: C.ink },
    modalContent: { padding: 16, gap: 14, paddingBottom: 32 },
    editGroup: { gap: 6 },
    editLabel: { fontSize: 13, fontWeight: '600', color: C.ink },
    editInput: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.ink, backgroundColor: '#fff' },
    editInfoBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bbf7d0' },
    editInfoText: { flex: 1, fontSize: 12, color: C.primary, lineHeight: 18 },
    editAktCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: C.border },
    editAktHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    editAktBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    editAktBadgeText: { fontSize: 12, fontWeight: '700', color: C.primary },
    editAktTipe: { fontSize: 14, fontWeight: '700', color: C.ink },
    modalFooter: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.card },
    btnCancel: { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    btnCancelText: { fontSize: 14, fontWeight: '600', color: C.muted },
    btnSaveModal: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: 12, paddingVertical: 13 },
    btnSaveModalText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});