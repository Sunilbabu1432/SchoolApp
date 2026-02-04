import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 1. Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerLabel}>SUPPORT PORTAL</Text>
              <Text style={styles.headerTitle}>Raise Complaint</Text>
            </View>
          </View>

          <View style={styles.content}>
            {/* 2. Student Card */}
            <View style={styles.studentCard}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={24} color="#6366f1" />
              </View>
              <View>
                <Text style={styles.studentLabel}>Reporting for Student</Text>
                <Text style={styles.studentNameText}>{studentName || 'Unknown Student'}</Text>
              </View>
            </View>

            {/* 3. Form */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Complaint Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="bookmark-outline" size={20} color="#94a3b8" style={styles.fieldIcon} />
                  <TextInput
                    placeholder="Brief summary of the issue"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <Ionicons name="create-outline" size={20} color="#94a3b8" style={[styles.fieldIcon, { marginTop: 14 }]} />
                  <TextInput
                    placeholder="Provide more details about the concern..."
                    placeholderTextColor="#94a3b8"
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.button, loading && styles.disabled]}
                onPress={submitComplaint}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>SUBMIT COMPLAINT</Text>
                    <Ionicons name="send" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerInfo}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#94a3b8" />
              <Text style={styles.footerText}>
                Your report will be reviewed by the administration and action will be taken promptly.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
  headerTitle: { fontSize: 22, color: '#ffffff', fontWeight: '700', marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 20, marginTop: -20 },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    backgroundColor: '#f5f7ff',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  studentNameText: { fontSize: 18, color: '#1e293b', fontWeight: '700', marginTop: 2 },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, color: '#64748b', fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    paddingHorizontal: 16,
  },
  textAreaContainer: { alignItems: 'flex-start' },
  fieldIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '600', paddingVertical: 14 },
  textArea: { height: 120, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabled: { opacity: 0.7, backgroundColor: '#94a3b8', shadowOpacity: 0 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  footerInfo: {
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    fontWeight: '500',
  },
});
