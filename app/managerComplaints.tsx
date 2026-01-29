import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export default function ManagerComplaints() {
  const params = useLocalSearchParams();
  const caseIdParam = params.caseId;

  // ✅ Ensure caseId is string
  const caseId =
    Array.isArray(caseIdParam) ? caseIdParam[0] : caseIdParam;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ LOAD CASE FUNCTION
  const loadCase = useCallback(async () => {
    if (!caseId) return;

    try {
      console.log('📡 Loading case:', caseId);

      const res = await api.get(`/cases/${caseId}`);
      console.log('✅ Case data:', res.data);

      setData(res.data);
    } catch (err) {
      console.log('❌ Load case failed', err);
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

  // 🔴 CASE ID NOT FOUND
  if (!caseId) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No complaint selected</Text>
      </View>
    );
  }

  // ⏳ LOADING
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading complaint...</Text>
      </View>
    );
  }

  // ❌ NO DATA
  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Complaint not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Complaint Details</Text>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Case ID</Text>
          <Text style={styles.value}>{data.caseId}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>{data.studentName}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <Text style={styles.value}>{data.subject}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{data.description}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.status}>{data.status}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: '#6b7280' },
  value: { fontSize: 15, fontWeight: '500' },
  status: { fontSize: 15, fontWeight: '700', color: '#2563eb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280' },
});
