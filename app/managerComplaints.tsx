import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ManagerComplaints() {
  const { caseId } = useLocalSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      loadCase();
    }
  }, [caseId]);

  const loadCase = async () => {
    try {
      const res = await api.get(`/cases/${caseId}`);
      setData(res.data);
    } catch {
      console.log('Load case failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading complaint...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    elevation: 3,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  status: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
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
