import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

/* =======================
   PICKLIST VALUES
======================= */

// ⚠️ Subject values must match Salesforce
const SUBJECTS = [
  'Maths', 'Science', 'English', 'Telugu', 'Hindi', 'Social', 'Computer', 'PET',
];

// ⚠️ UI label → Salesforce VALUE mapping
const EXAMS = [
  { label: 'Unit Test', value: 'Unit Test' },
  { label: 'Mid Term', value: 'Mid Term' },
  { label: 'Final Exam', value: 'Final Exam' },
];



export default function EnterMarks() {
  const { studentId, studentName, className } = useLocalSearchParams();
  const router = useRouter();

  const [subject, setSubject] = useState('');
  const [exam, setExam] = useState<{ label: string; value: string } | null>(null);
  const [marks, setMarks] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [picker, setPicker] = useState<'subject' | 'exam' | null>(null);

  /* =======================
     SUBMIT MARKS
  ======================= */
  const submitMarks = async () => {
    if (!subject || !exam || !marks || !maxMarks) {
      Alert.alert('Required', 'Please fill all fields');
      return;
    }

    if (Number(marks) > Number(maxMarks)) {
      Alert.alert('Invalid', 'Marks cannot be greater than Max Marks');
      return;
    }

    try {
      await api.post('/marks', {
        studentId: String(studentId),
        className: String(className),
        subject,
        examType: exam.value,
        marks: Number(marks),
        maxMarks: Number(maxMarks),
      });

      Alert.alert('Success', 'Marks submitted successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit marks');
    }
  };

  /* =======================
     PICKER RENDER
  ======================= */
  const renderPicker = (
    data: any[],
    selected: any,
    onSelect: (v: any) => void,
    isExam = false
  ) => (
    <Modal transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.pickerBox}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              Select {isExam ? 'Exam Type' : 'Subject'}
            </Text>
            <TouchableOpacity onPress={() => setPicker(null)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => (isExam ? item.value : item)}
            contentContainerStyle={styles.pickerList}
            renderItem={({ item }) => {
              const label = isExam ? item.label : item;
              const active = isExam ? selected?.value === item.value : selected === item;

              return (
                <TouchableOpacity
                  style={[styles.pickerOption, active && styles.pickerActive]}
                  onPress={() => {
                    onSelect(item);
                    setPicker(null);
                  }}
                >
                  <Text style={[styles.pickerText, active && styles.pickerTextActive]}>
                    {label}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={22} color="#6366f1" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerLabel}>SCORE ENTRY</Text>
          <Text style={styles.headerTitle}>{studentName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.infoBadge}>
            <Ionicons name="school" size={18} color="#6366f1" />
            <Text style={styles.infoText}>{className}</Text>
          </View>

          <View style={styles.form}>
            {/* SUBJECT */}
            <Text style={styles.label}>Academic Subject</Text>
            <TouchableOpacity
              style={[styles.inputContainer, subject ? styles.inputActive : null]}
              onPress={() => setPicker('subject')}
            >
              <Ionicons name="book-outline" size={22} color={subject ? "#6366f1" : "#94a3b8"} />
              <Text style={[styles.inputValue, !subject && styles.placeholder]}>
                {subject || 'Select Subject'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* EXAM TYPE */}
            <Text style={styles.label}>Exam Type</Text>
            <TouchableOpacity
              style={[styles.inputContainer, exam ? styles.inputActive : null]}
              onPress={() => setPicker('exam')}
            >
              <Ionicons name="calendar-outline" size={22} color={exam ? "#6366f1" : "#94a3b8"} />
              <Text style={[styles.inputValue, !exam && styles.placeholder]}>
                {exam?.label || 'Select Exam Type'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* SCORES ROW */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.label}>Marks Obtained</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="star-outline" size={22} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="E.g. 85"
                    keyboardType="numeric"
                    value={marks}
                    onChangeText={setMarks}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Max Marks</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="medal-outline" size={22} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="E.g. 100"
                    keyboardType="numeric"
                    value={maxMarks}
                    onChangeText={setMaxMarks}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={submitMarks}>
              <Text style={styles.submitText}>Submit Report</Text>
              <Ionicons name="send" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {picker === 'subject' && renderPicker(SUBJECTS, subject, setSubject)}
      {picker === 'exam' && renderPicker(EXAMS, exam, setExam, true)}
    </SafeAreaView>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
  scroll: { padding: 24 },
  infoBadge: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginBottom: 32,
  },
  infoText: { color: '#6366f1', fontWeight: '700', marginLeft: 8 },
  form: {},
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputActive: { borderColor: '#6366f1', backgroundColor: '#f5f7ff' },
  inputValue: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600', marginLeft: 12 },
  textInput: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600', marginLeft: 12 },
  placeholder: { color: '#94a3b8' },
  row: { flexDirection: 'row' },
  submitBtn: {
    backgroundColor: '#6366f1',
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  submitText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  pickerBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  pickerList: { paddingBottom: 10 },
  pickerOption: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  pickerActive: { backgroundColor: '#f5f7ff', borderRadius: 12, paddingHorizontal: 12, marginHorizontal: -12 },
  pickerText: { fontSize: 16, color: '#475569', fontWeight: '600' },
  pickerTextActive: { color: '#6366f1', fontWeight: '700' },
});
