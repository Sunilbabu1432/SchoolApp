import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function StudentActions() {
  const { studentId, studentName, className } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{studentName}</Text>
      <Text style={styles.sub}>{className}</Text>

      <TouchableOpacity
        style={styles.primary}
        onPress={() =>
          router.push({
            pathname: '/EnterMarks',
            params: { studentId, studentName, className },
          })
        }
      >
        <Text style={styles.btnText}>ENTER MARKS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={() =>
          router.push({
            pathname: '/raiseComplaint',
            params: { studentId, studentName },
          })
        }
      >
        <Text style={styles.btnText}>RAISE COMPLAINT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f7fb' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub: { textAlign: 'center', marginBottom: 30, color: '#6b7280' },
  primary: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginBottom: 14 },
  secondary: { backgroundColor: '#16a34a', padding: 16, borderRadius: 12 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
});
