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

  const slides = Array.from(
    { length: slideCount },
    (_, index) => ({
      title: `${topic} - Bagian ${index + 1}`,
      points: [
        `Pembahasan poin utama ${index + 1}`,
        `Penjelasan materi ${index + 1}`,
        `Contoh penerapan ${index + 1}`,
      ],
    })
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
            Slide {index + 1} - {slide.title}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F3D2E',
    marginBottom: 10,
  },

  point: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
});