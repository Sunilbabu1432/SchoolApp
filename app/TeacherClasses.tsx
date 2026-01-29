import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

const CLASSES = [
  'Nursery','LKG','UKG',
  'Class-1','Class-2','Class-3','Class-4','Class-5',
  'Class-6','Class-7','Class-8','Class-9','Class-10',
];

export default function TeacherClasses() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Class</Text>

      <FlatList
        data={CLASSES}
        keyExtractor={(i) => i}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/teacherStudents',
                params: { className: item },
              })
            }
          >
            <Text style={styles.text}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f7fb' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  text: { fontSize: 16, fontWeight: '600' },
});
