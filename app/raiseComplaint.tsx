import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import api from '../services/api';

export default function RaiseComplaint() {
  const { studentId, studentName } = useLocalSearchParams();
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submitComplaint = async () => {
    if (!studentId || !subject) {
      alert('Subject required');
      return;
    }

    try {
      setLoading(true);

      await api.post('/cases', {
        studentAccountId: studentId,
        subject,
        description,
      });

      router.replace('/complaintSuccess');
    } catch {
      alert('Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Raise Complaint</Text>
        <Text style={styles.subtitle}>Student: {studentName}</Text>

        <Text style={styles.label}>Subject</Text>
        <TextInput
          placeholder="Enter complaint subject"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Describe the issue"
          placeholderTextColor="#9ca3af"
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabled]}
          onPress={submitComplaint}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>SUBMIT COMPLAINT</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 22,
    elevation: 3,
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
    marginBottom: 20,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
