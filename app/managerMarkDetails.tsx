import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../services/api';

export default function ManagerMarkDetails() {
  const { markId } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    try {
      const res = await api.get(`/marks/${markId}`);
      setData(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load marks');
    }
  };

  // ✅ APPROVE / REJECT HANDLER
  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    try {
      setLoading(true);

      await api.post('/mark-action', {
        markId,
        action,
      });

      Alert.alert(
        'Success',
        `Marks ${action === 'APPROVE' ? 'approved' : 'rejected'}`
      );

      // reload updated status
      loadDetails();
    } catch {
      Alert.alert('Error', 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Loading marks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Marks Details</Text>

      <View style={styles.card}>
        <Row label="👦 Student" value={data.studentName} />
        <Row label="🏫 Class" value={data.className} />
        <Row label="📘 Subject" value={data.subject} />
        <Row label="📝 Exam" value={data.examType} />
        <Row
          label="📊 Marks"
          value={`${data.marks} / ${data.maxMarks}`}
        />
        <Row label="📌 Status" value={data.status} />
      </View>

      {/* ✅ ACTION BUTTONS */}
      {data.status === 'Submitted' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.approve}
            disabled={loading}
            onPress={() => handleAction('APPROVE')}
          >
            <Text style={styles.btnText}>APPROVE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reject}
            disabled={loading}
            onPress={() => handleAction('REJECT')}
          >
            <Text style={styles.btnText}>REJECT</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    elevation: 3,
  },
  row: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  approve: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    width: '48%',
  },
  reject: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 12,
    width: '48%',
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
