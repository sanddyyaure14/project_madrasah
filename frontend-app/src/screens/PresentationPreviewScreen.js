import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function PresentationPreviewScreen({ route }) {
  const {
    topic = 'Materi Presentasi',
    kelas = '-',
    slideCount = 1,
  } = route.params || {};

  const templateSlides = [
    {
      title: `Pendahuluan ${topic}`,
      points: [
        `Pengantar materi ${topic}`,
        'Latar belakang pembelajaran',
        'Tujuan pembelajaran',
      ],
    },
    {
      title: `Pengertian ${topic}`,
      points: [
        `Definisi ${topic}`,
        'Konsep dasar materi',
        'Ruang lingkup pembahasan',
      ],
    },
    {
      title: `Dasar Materi ${topic}`,
      points: [
        'Landasan teori',
        'Sumber referensi utama',
        'Prinsip-prinsip dasar',
      ],
    },
    {
      title: `Pembahasan Utama ${topic}`,
      points: [
        'Pokok bahasan pertama',
        'Pokok bahasan kedua',
        'Pokok bahasan ketiga',
      ],
    },
    {
      title: `Contoh Penerapan ${topic}`,
      points: [
        'Contoh dalam kehidupan sehari-hari',
        'Studi kasus sederhana',
        'Implementasi materi',
      ],
    },
    {
      title: `Manfaat ${topic}`,
      points: [
        'Manfaat bagi peserta didik',
        'Manfaat dalam kehidupan',
        'Nilai yang dapat diterapkan',
      ],
    },
    {
      title: `Tantangan dan Solusi`,
      points: [
        'Permasalahan yang sering muncul',
        'Cara mengatasi masalah',
        'Strategi penerapan',
      ],
    },
    {
      title: `Rangkuman Materi`,
      points: [
        'Ringkasan konsep utama',
        'Poin penting yang dipelajari',
        'Hal yang perlu diingat',
      ],
    },
    {
      title: `Evaluasi Pembelajaran`,
      points: [
        'Pertanyaan refleksi',
        'Diskusi kelas',
        'Latihan pemahaman',
      ],
    },
    {
      title: 'Kesimpulan',
      points: [
        `Kesimpulan materi ${topic}`,
        'Pesan utama pembelajaran',
        'Penutup presentasi',
      ],
    },
  ];

  const slides = Array.from(
    { length: slideCount },
    (_, index) =>
      templateSlides[index] || {
        title: `${topic} - Pembahasan Tambahan ${index + 1}`,
        points: [
          'Pengembangan materi',
          'Pembahasan lanjutan',
          'Contoh tambahan',
        ],
      }
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>
        Preview Presentasi
      </Text>

      <Text style={styles.info}>
        Topik: {topic}
      </Text>

      <Text style={styles.info}>
        Kelas: {kelas}
      </Text>

      <Text style={styles.info}>
        Jumlah Slide: {slideCount}
      </Text>

      {slides.map((slide, index) => (
        <View
          key={index}
          style={styles.card}
        >
          <Text style={styles.title}>
            Slide {index + 1}
          </Text>

          <Text style={styles.slideTitle}>
            {slide.title}
          </Text>

          {slide.points.map((point, idx) => (
            <Text
              key={idx}
              style={styles.point}
            >
              • {point}
            </Text>
          ))}
        </View>
      ))}
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
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F3D2E',
    marginBottom: 20,
  },

  info: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
  },

  card: {
    backgroundColor: '#FFFDF8',
    borderRadius: 18,
    padding: 18,
    marginTop: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F3D2E',
    marginBottom: 8,
  },

  slideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F3D2E',
    marginBottom: 12,
  },

  point: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
});