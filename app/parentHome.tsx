import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function ParentHome() {
  const [results, setResults] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        setParentName(JSON.parse(user).name);
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
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading Results...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Profile Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.parentName}>{parentName || 'Parent'}</Text>
          </View>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={24} color="#6366f1" />
          </View>
        </View>

        <View style={styles.studentCard}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentLabel}>STUDENT</Text>
            <Text style={styles.studentNameText}>{studentName}</Text>
          </View>
          <View style={styles.classBadge}>
            <Text style={styles.classText}>Grade: {examResults[0]?.Class__c || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* 2. Exam Selector */}
        <Text style={styles.sectionTitle}>Exam Reports</Text>
        <View style={styles.examRow}>
          {exams.map(exam => (
            <TouchableOpacity
              key={exam}
              activeOpacity={0.7}
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

        {/* 3. Results List */}
        <FlatList
          data={examResults}
          keyExtractor={item => item.Id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="book-outline" size={22} color="#6366f1" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.subject}>{item.Subject__c}</Text>
                <Text style={styles.subjectType}>{selectedExam}</Text>
              </View>
              <View style={styles.marksContainer}>
                <Text style={styles.marksText}>{item.Marks__c}</Text>
                <Text style={styles.maxText}>/ {item.Max_Marks__c}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="alert-circle-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyText}>No results found for this exam.</Text>
            </View>
          }
        />
      </View>

      {/* 4. Summary Footer Card */}
      {examResults.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>AGGREGATE SCORE</Text>
              <Text style={styles.footerTotal}>
                {aggregate.total} <Text style={styles.footerMax}>/ {aggregate.max}</Text>
              </Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{aggregate.percent}%</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: { color: '#c7d2fe', fontSize: 16, fontWeight: '500' },
  parentName: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  profileCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  studentInfo: { flex: 1 },
  studentLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 1 },
  studentNameText: { fontSize: 18, color: '#1e293b', fontWeight: '700', marginTop: 2 },
  classBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  classText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 18, color: '#1e293b', fontWeight: '700', marginBottom: 16 },
  examRow: { flexDirection: 'row', marginBottom: 20 },
  examBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  examActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  examText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  examTextActive: { color: '#ffffff' },
  listPadding: { paddingBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#f5f7ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardBody: { flex: 1 },
  subject: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  subjectType: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  marksContainer: { alignItems: 'flex-end' },
  marksText: { fontSize: 18, fontWeight: '800', color: '#10b981' },
  maxText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30, // 🔥 FIX: Add bottom padding
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '800', letterSpacing: 1 },
  footerTotal: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 4 },
  footerMax: { fontSize: 16, color: '#94a3b8', fontWeight: '600' },
  percentBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  percentText: { color: '#10b981', fontSize: 20, fontWeight: '800' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 15, fontWeight: '500' },
});
