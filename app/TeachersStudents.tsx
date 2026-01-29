import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function TeachersStudents() {
  const { className } = useLocalSearchParams(); // 🔑 selected class
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (className) {
      loadStudents();
    }
  }, [className]);

  const loadStudents = async () => {
    try {
      const res = await api.get(
        `/students?class=${encodeURIComponent(String(className))}`
      );
      setStudents(res.data.students || []);
    } catch (err) {
      console.log('❌ Student fetch failed', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{className}</Text>

      <FlatList
        data={students}
        keyExtractor={item => item.Id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/StudentAction',
                params: {
                  studentId: item.Id,
                  studentName: item.Name,
                  className,
                },
              })
            }
          >
            <Text style={styles.name}>{item.Name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f7fb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
});
