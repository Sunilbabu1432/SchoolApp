import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ManagerComplaints() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const caseIdParam = params.caseId;

  const caseId = Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await api.get(`/cases/${caseId}`);
      setData(res.data);
    } catch (err) {
      console.log('Load case failed', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    loadCase();
  }, [loadCase]);

  if (!caseId) {
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={60} color="#e5e7eb" />
        <Text style={styles.infoText}>No complaint selected</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Fetching case details...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color="#fee2e2" />
        <Text style={styles.infoText}>Complaint not found</Text>
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
          <Text style={styles.headerLabel}>COMPLAINT REPORT</Text>
          <Text style={styles.headerTitle}>{data.caseId}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Student Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={32} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{data.studentName}</Text>
              <Text style={styles.studentSub}>Student involved</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: data.status === 'New' ? '#fee2e2' : '#e0e7ff' }]}>
              <Text style={[styles.statusText, { color: data.status === 'New' ? '#ef4444' : '#6366f1' }]}>
                {data.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsCard}>
            <DetailItem
              icon="bookmark"
              label="SUBJECT"
              value={data.subject}
              iconColor="#6366f1"
              bgColor="#f5f7ff"
            />
            <View style={styles.divider} />
            <DetailItem
              icon="document-text"
              label="DESCRIPTION"
              value={data.description}
              iconColor="#64748b"
              bgColor="#f1f5f9"
              multiline
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#94a3b8" />
            <Text style={styles.infoBoxText}>
              This complaint was raised by a teacher and requires administrative review.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailItem({ icon, label, value, iconColor, bgColor, multiline = false }: any) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, multiline && { lineHeight: 22 }]}>{value}</Text>
      </View>
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
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 12 },
  detailIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  detailLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  detailValue: { fontSize: 16, color: '#1e293b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 },
  infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingHorizontal: 8 },
  infoBoxText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#94a3b8', fontWeight: '500', lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  loadingText: { marginTop: 16, color: '#64748b', fontWeight: '600' },
  infoText: { marginTop: 16, color: '#94a3b8', fontSize: 16, fontWeight: '600' },
});
