import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import api from '../services/api';

/* =======================
   PICKLIST VALUES
======================= */

// ⚠️ Subject values must match Salesforce
const SUBJECTS = [
  'Maths',
  'Science',
  'English',
  'Telugu',
  'Hindi',
  'Social',
  'Computer',
  'PET',
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
        className: String(className),   // ✅ readonly
        subject,
        examType: exam.value,           // ✅ Salesforce-safe value
        marks: Number(marks),
        maxMarks: Number(maxMarks),
      });

      Alert.alert('Success', 'Marks submitted successfully');
      router.back();
    } catch (err: any) {
      console.log('❌ MARK SUBMIT ERROR', err?.response?.data || err.message);
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
      <View style={styles.overlay}>
        <View style={styles.dropdown}>
          <FlatList
            data={data}
            keyExtractor={(item) => (isExam ? item.value : item)}
            renderItem={({ item }) => {
              const label = isExam ? item.label : item;
              const active = isExam
                ? selected?.value === item.value
                : selected === item;

              return (
                <TouchableOpacity
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onSelect(item);
                    setPicker(null);
                  }}
                >
                  <Text style={[styles.optionText, active && styles.activeText]}>
                    {label}
                  </Text>
                  {active && <Text>✔</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Marks</Text>
      <Text style={styles.subTitle}>{studentName}</Text>

      {/* CLASS – READ ONLY */}
      <View style={[styles.input, styles.readonly]}>
        <Text style={{ color: '#111' }}>{className}</Text>
      </View>

      {/* SUBJECT */}
      <TouchableOpacity style={styles.input} onPress={() => setPicker('subject')}>
        <Text style={{ color: subject ? '#111' : '#9ca3af' }}>
          {subject || 'Select Subject'}
        </Text>
      </TouchableOpacity>

      {/* EXAM */}
      <TouchableOpacity style={styles.input} onPress={() => setPicker('exam')}>
        <Text style={{ color: exam ? '#111' : '#9ca3af' }}>
          {exam?.label || 'Select Exam Type'}
        </Text>
      </TouchableOpacity>

      {/* MARKS */}
      <TextInput
        style={styles.input}
        placeholder="Marks Obtained"
        keyboardType="numeric"
        value={marks}
        onChangeText={setMarks}
      />

      <TextInput
        style={styles.input}
        placeholder="Max Marks"
        keyboardType="numeric"
        value={maxMarks}
        onChangeText={setMaxMarks}
      />

      {/* SUBMIT */}
      <TouchableOpacity style={styles.submit} onPress={submitMarks}>
        <Text style={styles.submitText}>Submit Marks</Text>
      </TouchableOpacity>

      {/* PICKERS */}
      {picker === 'subject' && renderPicker(SUBJECTS, subject, setSubject)}
      {picker === 'exam' && renderPicker(EXAMS, exam, setExam, true)}
    </View>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  subTitle: { textAlign: 'center', marginBottom: 20, color: '#6b7280' },
  input: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 12 },
  readonly: { backgroundColor: '#e5e7eb' },
  submit: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, marginTop: 10 },
  submitText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    paddingTop: 140,
  },
  dropdown: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: 320,
  },
  option: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionActive: { backgroundColor: '#ecfdf5' },
  optionText: { fontSize: 15 },
  activeText: { color: '#16a34a', fontWeight: '700' },
});
