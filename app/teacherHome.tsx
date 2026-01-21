import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';

type Student = {
  Id: string;
  Name: string;
};

export default function TeacherHome() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.students || []);
    } catch {
      console.log('Student fetch failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Student</Text>
      <Text style={styles.subtitle}>
        Tap on a student to raise a complaint
      </Text>

      <FlatList
        data={students}
        keyExtractor={(item) => item.Id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/raiseComplaint',
                params: {
                  studentId: item.Id,
                  studentName: item.Name,
                },
              })
            }
          >
            <Text style={styles.studentName}>{item.Name}</Text>
            <Text style={styles.actionText}>Raise Complaint →</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionText: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 6,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
});
