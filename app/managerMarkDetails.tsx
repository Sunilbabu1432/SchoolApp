import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ManagerMarkDetails() {
  const { markId } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    try {
      setInitialLoading(true);
      const res = await api.get(`/marks/${markId}`);
      setData(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load marks');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    try {
      setLoading(true);
      await api.post('/mark-action', {
        markId,
        action,
      });
      Alert.alert(
        'Success',
        `Marks ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`
      );
      loadDetails();
    } catch {
      Alert.alert('Error', 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Fetching details...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color="#fee2e2" />
        <Text style={styles.infoText}>Record not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerLabel}>ACADEMIC AUDIT</Text>
          <Text style={styles.headerTitle}>Mark Submission</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={32} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{data.studentName}</Text>
              <Text style={styles.studentSub}>{data.className} • Results</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: data.status === 'Approved' ? '#dcfce7' : data.status === 'Rejected' ? '#fee2e2' : '#fef9c3' }]}>
              <Text style={[styles.statusText, { color: data.status === 'Approved' ? '#16a34a' : data.status === 'Rejected' ? '#dc2626' : '#854d0e' }]}>
                {data.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailGrid}>
              <DetailBox icon="book" label="SUBJECT" value={data.subject} color="#6366f1" />
              <DetailBox icon="document-text" label="EXAM" value={data.examType} color="#64748b" />
            </View>

            <View style={styles.divider} />

            <View style={styles.marksSection}>
              <Text style={styles.marksLabel}>OBTAINED MARKS</Text>
              <View style={styles.marksRow}>
                <Text style={styles.marksMain}>{data.marks}</Text>
                <Text style={styles.marksMax}>/ {data.maxMarks}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(data.marks / data.maxMarks) * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {data.status === 'Submitted' && (
            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.btn, styles.rejectBtn, loading && styles.disabledBtn]}
                onPress={() => handleAction('REJECT')}
                disabled={loading}
              >
                <Ionicons name="close-circle" size={20} color="#dc2626" />
                <Text style={styles.rejectBtnText}>REJECT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.btn, styles.approveBtn, loading && styles.disabledBtn]}
                onPress={() => handleAction('APPROVE')}
                disabled={loading}
              >
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.approveBtnText}>APPROVE</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.auditInfo}>
            <Ionicons name="shield-checkmark" size={18} color="#94a3b8" />
            <Text style={styles.auditText}>
              Verifying submissions ensures accuracy in the parent report portal.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailBox({ icon, label, value, color }: any) {
  return (
    <View style={styles.detailBox}>
      <View style={styles.detailHeader}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={styles.boxLabel}>{label}</Text>
      </View>
      <Text style={styles.boxValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleContainer: { flex: 1 },
  headerLabel: { fontSize: 11, color: '#c7d2fe', fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 20, color: '#ffffff', fontWeight: '700', marginTop: 2 },
  content: { padding: 24 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentName: { fontSize: 18, color: '#1e293b', fontWeight: '800' },
  studentSub: { fontSize: 13, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  detailGrid: { flexDirection: 'row', gap: 20 },
  detailBox: { flex: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  boxLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', marginLeft: 6, letterSpacing: 0.5 },
  boxValue: { fontSize: 15, color: '#1e293b', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  marksSection: { alignItems: 'center' },
  marksLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '800', marginBottom: 12 },
  marksRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  marksMain: { fontSize: 42, fontWeight: '900', color: '#6366f1' },
  marksMax: { fontSize: 18, fontWeight: '700', color: '#94a3b8', marginLeft: 8 },
  progressBar: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 32 },
  btn: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  approveBtn: { backgroundColor: '#6366f1', shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 8 },
  rejectBtn: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#fee2e2', shadowColor: '#ef4444', shadowOpacity: 0.05, shadowRadius: 8 },
  approveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  rejectBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '800', marginLeft: 8 },
  disabledBtn: { opacity: 0.6, elevation: 0 },
  auditInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 32, paddingHorizontal: 8 },
  auditText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#94a3b8', fontWeight: '500', lineHeight: 18, textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  loadingText: { marginTop: 16, color: '#64748b', fontWeight: '600' },
  infoText: { marginTop: 16, color: '#94a3b8', fontSize: 16, fontWeight: '600' },
});
