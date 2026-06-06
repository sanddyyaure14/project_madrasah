//PRES07 (Form Input Presentasi)
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
import { generatePresentation } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function PresentationFormScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [topic, setTopic] = useState('');
    const [slides, setSlides] = useState('');
    const [kelas, setKelas] = useState('');

    const handleGenerate = async () => {
        try {
            const result = await generatePresentation({
                topik: topic,
                jumlah_slide: parseInt(slides) || 5,
                tujuan: 'Pembelajaran',
                audiens: kelas || 'Siswa',
                include_catatan: false,
                userId: user?.id,
            });

            navigation.navigate('PresentationPreview', {
                presentation: result.data,
                kelas,
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
                    Generator Presentasi
                </Text>

                <Text style={styles.label}>
                    Topik Presentasi
                </Text>

                <TextInput
                    placeholder="Contoh: Fiqih Muamalah Modern"
                    style={styles.input}
                    value={topic}
                    onChangeText={setTopic}
                />

                <Text style={styles.label}>
                    Jumlah Slide
                </Text>

                <TextInput
                    placeholder="Contoh: 10"
                    keyboardType="numeric"
                    style={styles.input}
                    value={slides}
                    onChangeText={setSlides}
                />

                <Text style={styles.label}>
                    Kelas
                </Text>

                <TextInput
                    placeholder="Contoh: XI IPA 1"
                    style={styles.input}
                    value={kelas}
                    onChangeText={setKelas}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleGenerate}
                >
                    <Text style={styles.buttonText}>
                        Generate Presentasi
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
        backgroundColor: '#D4A017',
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