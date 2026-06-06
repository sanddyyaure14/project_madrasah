//UNIT07 (Form input RPP)
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { generateUnitPlan } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function UnitPlanFormScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [judul, setJudul] = useState('');
    const [mapel, setMapel] = useState('');
    const [kelas, setKelas] = useState('');
    const [pertemuan, setPertemuan] = useState('');

    const handleGenerate = async () => {
        try {
            const result = await generateUnitPlan({
                judul_unit: judul,
                mata_pelajaran: mapel,
                tingkat_kelas: kelas,
                tujuan_pembelajaran: '',
                jumlah_pertemuan: parseInt(pertemuan) || 2,
                durasi_per_jp: 40,
                userId: user?.id,
            });

            navigation.navigate('UnitPlanPreview', {
                data: result.data,
                judul: judul,
                mapel: mapel,
                kelas: kelas,
                pertemuan: pertemuan,
            });

        } catch (err) {
            console.log(err);
            alert(err.message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Madrasah AI</Text>

            <View style={styles.card}>
                <Text style={styles.title}>
                    Generator RPP
                </Text>

                <Text style={styles.label}>
                    Judul Unit
                </Text>

                <TextInput
                    placeholder="Contoh: Thaharah"
                    style={styles.input}
                    value={judul}
                    onChangeText={setJudul}
                />

                <Text style={styles.label}>
                    Mata Pelajaran
                </Text>

                <TextInput
                    placeholder="Contoh: Akidah Akhlak"
                    style={styles.input}
                    value={mapel}
                    onChangeText={setMapel}
                />

                <Text style={styles.label}>
                    Kelas
                </Text>

                <TextInput
                    placeholder="Contoh: VII"
                    style={styles.input}
                    value={kelas}
                    onChangeText={setKelas}
                />

                <Text style={styles.label}>
                    Jumlah Pertemuan
                </Text>

                <TextInput
                    placeholder="Contoh: 2"
                    keyboardType="numeric"
                    style={styles.input}
                    value={pertemuan}
                    onChangeText={setPertemuan}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGenerate}
                >
                    <Text style={styles.buttonText}>
                        Generate RPP
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F5F1E8',
        padding: 20,
        justifyContent: 'center',
    },

    header: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#0F3D2E',
        marginBottom: 20,
        textAlign: 'center',
    },

    card: {
        backgroundColor: '#FFFDF8',
        borderRadius: 20,
        padding: 20,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F3D2E',
        marginBottom: 25,
    },

    label: {
        fontSize: 15,
        color: '#333',
        marginBottom: 8,
        marginTop: 10,
    },

    input: {
        borderWidth: 1,
        borderColor: '#D4C9B8',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#FAF7F0',
        fontSize: 16,
    },

    button: {
        backgroundColor: '#0F3D2E',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 25,
    },

    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});