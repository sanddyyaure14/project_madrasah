import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function PresentationPreviewScreen({ route }) {

  const presentation =
    route.params?.presentation ||
    route.params?.data ||
    {};

  const kelas =
    route.params?.kelas ||
    presentation?.audiens ||
    '-';

  const topic =
    presentation?.topik ||
    'Materi Presentasi';

  const slides =
    presentation?.slides_json ||
    [];

  const slideCount =
    presentation?.jumlah_slide ||
    slides.length;

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
            Slide {slide.slide_number}
          </Text>

          <Text style={styles.slideTitle}>
            {slide.title}
          </Text>

          {slide.content?.map((point, idx) => (
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