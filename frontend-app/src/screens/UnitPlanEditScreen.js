import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, API_URL } from '../lib/auth';
import { C, S } from '../lib/theme';

export default function UnitPlanEditScreen({ route, navigation }) {
  const { id, data: initialData } = route.params || {};
  const { token } = useAuth();

  // Basic fields
  const [judulUnit, setJudulUnit] = useState(initialData?.judul_unit || '');
  const [mataPelajaran, setMataPelajaran] = useState(initialData?.mata_pelajaran || '');
  const [tingkatKelas, setTingkatKelas] = useState(initialData?.tingkat_kelas || '');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState(initialData?.tujuan_pembelajaran || '');
  const [jumlahPertemuan, setJumlahPertemuan] = useState(String(initialData?.jumlah_pertemuan || 2));
  const [durasiPerJp, setDurasiPerJp] = useState(String(initialData?.durasi_per_jp || 40));

  // JSON fields
  const unitPlanJson = initialData?.unit_plan_json || {};
  const infoUmum = unitPlanJson.informasi_umum || {};
  const komponenInti = unitPlanJson.komponen_inti || {};

  const [kompetensiAwal, setKompetensiAwal] = useState(
    (infoUmum.kompetensi_awal || []).join('\n')
  );
  const [profilPelajarPancasila, setProfilPelajarPancasila] = useState(
    (infoUmum.profil_pelajar_pancasila || []).join('\n')
  );
  const [saranaPrasarana, setSaranaPrasarana] = useState(
    (infoUmum.sarana_prasarana || []).join('\n')
  );
  const [targetPesertaDidik, setTargetPesertaDidik] = useState(
    infoUmum.target_peserta_didik || ''
  );

  const [tujuanPembelajaranInti, setTujuanPembelajaranInti] = useState(
    (komponenInti.tujuan_pembelajaran || []).join('\n')
  );
  const [pemahamanBermakna, setPemahamanBermakna] = useState(
    komponenInti.pemahaman_bermakna || ''
  );
  const [pertanyaanPemantik, setPertanyaanPemantik] = useState(
    (komponenInti.pertanyaan_pemantik || []).join('\n')
  );
  const [asesmen, setAsesmen] = useState((komponenInti.asesmen || []).join('\n'));
  const [pengayaanRemedial, setPengayaanRemedial] = useState(
    (komponenInti.pengayaan_dan_remedial || []).join('\n')
  );

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!judulUnit.trim()) {
      Alert.alert('Validasi', 'Judul Unit wajib diisi');
      return;
    }

    setSaving(true);
    try {
      // Build updated unit_plan_json
      const updatedUnitPlanJson = {
        informasi_umum: {
          mata_pelajaran: mataPelajaran,
          judul_unit: judulUnit,
          kelas: tingkatKelas,
          alokasi_waktu: `${jumlahPertemuan} Pertemuan`,
          kompetensi_awal: kompetensiAwal.split('\n').filter(x => x.trim()),
          profil_pelajar_pancasila: profilPelajarPancasila.split('\n').filter(x => x.trim()),
          sarana_prasarana: saranaPrasarana.split('\n').filter(x => x.trim()),
          target_peserta_didik: targetPesertaDidik.trim(),
        },
        komponen_inti: {
          tujuan_pembelajaran: tujuanPembelajaranInti.split('\n').filter(x => x.trim()),
          pemahaman_bermakna: pemahamanBermakna.trim(),
          pertanyaan_pemantik: pertanyaanPemantik.split('\n').filter(x => x.trim()),
          kegiatan_pembelajaran: komponenInti.kegiatan_pembelajaran || [],
          asesmen: asesmen.split('\n').filter(x => x.trim()),
          pengayaan_dan_remedial: pengayaanRemedial.split('\n').filter(x => x.trim()),
        },
      };

      const body = {
        judul_unit: judulUnit.trim(),
        mata_pelajaran: mataPelajaran,
        tingkat_kelas: tingkatKelas,
        tujuan_pembelajaran: tujuanPembelajaran.trim() || null,
        jumlah_pertemuan: parseInt(jumlahPertemuan) || 2,
        durasi_per_jp: parseInt(durasiPerJp) || 40,
        unit_plan_json: updatedUnitPlanJson,
      };

      console.log('[UnitPlanEdit] Saving to API...');
      console.log('[UnitPlanEdit] Endpoint:', `${API_URL}/unit-plan/${id}`);
      console.log('[UnitPlanEdit] Body:', JSON.stringify(body, null, 2));

      const res = await fetch(`${API_URL}/unit-plan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      console.log('[UnitPlanEdit] Response:', json);

      if (json.success) {
        Alert.alert('Berhasil', 'RPP berhasil diperbarui', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back dengan parameter refresh
              navigation.navigate('UnitPlanDetail', {
                id,
                data: json.data,
                _refresh: Date.now(), // Trigger refresh
              });
            },
          },
        ]);
      } else {
        Alert.alert('Gagal', json.message || 'Tidak dapat menyimpan perubahan');
      }
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Tidak dapat terhubung ke server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>📋 Informasi Dasar</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Judul Unit *</Text>
          <TextInput
            style={styles.input}
            value={judulUnit}
            onChangeText={setJudulUnit}
            placeholder="cth. Thaharah dan Bersuci"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mata Pelajaran *</Text>
          <TextInput
            style={styles.input}
            value={mataPelajaran}
            onChangeText={setMataPelajaran}
            placeholder="cth. Fiqih"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Kelas *</Text>
          <TextInput
            style={styles.input}
            value={tingkatKelas}
            onChangeText={setTingkatKelas}
            placeholder="cth. VII"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tujuan Pembelajaran</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={tujuanPembelajaran}
            onChangeText={setTujuanPembelajaran}
            placeholder="Tujuan pembelajaran"
            multiline
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Jumlah Pertemuan</Text>
            <TextInput
              style={styles.input}
              value={jumlahPertemuan}
              onChangeText={setJumlahPertemuan}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Durasi per JP (menit)</Text>
            <TextInput
              style={styles.input}
              value={durasiPerJp}
              onChangeText={setDurasiPerJp}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>🎯 Komponen Inti</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Kompetensi Awal (satu per baris)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={kompetensiAwal}
            onChangeText={setKompetensiAwal}
            placeholder="Tulis satu kompetensi per baris"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Profil Pelajar Pancasila (satu per baris)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={profilPelajarPancasila}
            onChangeText={setProfilPelajarPancasila}
            placeholder="Tulis satu profil per baris"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sarana & Prasarana (satu per baris)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={saranaPrasarana}
            onChangeText={setSaranaPrasarana}
            placeholder="Tulis satu sarana per baris"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Target Peserta Didik</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={targetPesertaDidik}
            onChangeText={setTargetPesertaDidik}
            placeholder="Deskripsi target peserta didik"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tujuan Pembelajaran (satu per baris)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={tujuanPembelajaranInti}
            onChangeText={setTujuanPembelajaranInti}
            placeholder="Tulis satu tujuan per baris"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pemahaman Bermakna</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={pemahamanBermakna}
            onChangeText={setPemahamanBermakna}
            placeholder="Deskripsi pemahaman bermakna"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pertanyaan Pemantik (satu per baris)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={pertanyaanPemantik}
            onChangeText={setPertanyaanPemantik}
            placeholder="Tulis satu pertanyaan per baris"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Asesmen (satu per baris)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={asesmen}
            onChangeText={setAsesmen}
            placeholder="Tulis satu asesmen per baris"
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pengayaan & Remedial (satu per baris)</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={pengayaanRemedial}
            onChangeText={setPengayaanRemedial}
            placeholder="Tulis satu item per baris"
            multiline
          />
        </View>

        <Text style={styles.hint}>
          💡 Catatan: Kegiatan pembelajaran per pertemuan belum dapat diedit di sini. Untuk
          edit detail kegiatan, silakan gunakan versi web.
        </Text>
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.btn, styles.btnCancel]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnCancelText}>Batal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnSave]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.btnSaveText}>Simpan</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.ink,
    marginTop: 16,
    marginBottom: 12,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.ink,
    backgroundColor: '#fff',
  },
  inputMulti: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: 12 },
  hint: {
    fontSize: 12,
    color: C.muted,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 8,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...S.shadow,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnCancel: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.muted,
  },
  btnSave: {
    backgroundColor: C.primary,
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
