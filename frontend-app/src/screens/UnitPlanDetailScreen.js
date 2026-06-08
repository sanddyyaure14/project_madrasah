import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function UnitPlanDetailScreen({ route }) {
    const { data } = route.params || {};

    useEffect(() => {
        console.log('UNIT PLAN DATA');
        console.log(JSON.stringify(data, null, 2));
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>
                {data?.judul_unit || 'RPP'}
            </Text>

            <Text>Mata Pelajaran: {data?.mata_pelajaran}</Text>
            <Text>Kelas: {data?.tingkat_kelas}</Text>
            <Text>Tujuan: {data?.tujuan_pembelajaran}</Text>
            <Text>Pertemuan: {data?.jumlah_pertemuan}</Text>
            <Text>Durasi JP: {data?.durasi_per_jp}</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
});