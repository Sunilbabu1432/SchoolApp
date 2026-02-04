import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ ADD

export default function ParentHome() {
  const [results, setResults] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState(''); // ✅ ADD
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setParentName(JSON.parse(user).name); // ✅ NAME SET
      }
    };

    loadUser();
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await api.get('/marks/parent/results');
      const data = res.data.results || [];
      setResults(data);
      setStudentName(res.data.studentName || '');

      if (data.length) {
        setSelectedExam(data[0].Exam_Type__c);
      }
    } catch {
      console.log('❌ Parent results fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const exams = useMemo(
    () => [...new Set(results.map(r => r.Exam_Type__c))],
    [results]
  );

  const examResults = useMemo(
    () => results.filter(r => r.Exam_Type__c === selectedExam),
    [results, selectedExam]
  );

  const aggregate = useMemo(() => {
    const total = examResults.reduce((s, r) => s + r.Marks__c, 0);
    const max = examResults.reduce((s, r) => s + r.Max_Marks__c, 0);
    const percent = max ? ((total / max) * 100).toFixed(2) : '0';
    return { total, max, percent };
  }, [examResults]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.parentName}>Welcome, {parentName}</Text>
        <Text style={styles.classText}>
          Class: {examResults[0]?.Class__c}
        </Text>
      </View>

      <View style={styles.examRow}>
        {exams.map(exam => (
          <TouchableOpacity
            key={exam}
            style={[
              styles.examBtn,
              exam === selectedExam && styles.examActive,
            ]}
            onPress={() => setSelectedExam(exam)}
          >
            <Text
              style={[
                styles.examText,
                exam === selectedExam && styles.examTextActive,
              ]}
            >
              {exam}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={examResults}
        keyExtractor={item => item.Id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.subject}>{item.Subject__c}</Text>
            <Text style={styles.marks}>
              {item.Marks__c} / {item.Max_Marks__c}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.total}>
          Total: {aggregate.total} / {aggregate.max}
        </Text>
        <Text style={styles.percent}>
          Percentage: {aggregate.percent}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 16 },
  header: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  studentName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  parentName: { color: '#dbeafe', marginTop: 4 },
  classText: { color: '#dbeafe', fontSize: 14, marginTop: 4 },
  examRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  examBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  examActive: { backgroundColor: '#2563eb' },
  examText: { color: '#111827', fontWeight: '600' },
  examTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subject: { fontSize: 16, fontWeight: '600' },
  marks: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  footer: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  total: { color: '#fff', fontSize: 18, fontWeight: '700' },
  percent: { color: '#22c55e', fontSize: 16, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
