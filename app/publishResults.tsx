import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import api from '../services/api';

const EXAMS = ['Unit Test', 'Mid Term', 'Final Exam'];
const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5',
  'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10',
];

export default function PublishResults() {
  const [examType, setExamType] = useState('');
  const [className, setClassName] = useState('');
  const [publishAt, setPublishAt] = useState<Date | null>(null);

  const [showExam, setShowExam] = useState(false);
  const [showClass, setShowClass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  /* ✅ ANDROID SAFE DATE + TIME PICKER (2 STEP) */
  const openDateTimePicker = () => {
    const current = publishAt || new Date();

    // STEP 1: DATE
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      is24Hour: true,
      onChange: (event: any, selectedDate?: Date) => {
        if (!selectedDate) return;

        // STEP 2: TIME
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: 'time',
          is24Hour: true,
          onChange: (e: any, selectedTime?: Date) => {
            if (!selectedTime) return;

            const finalDate = new Date(selectedDate);
            finalDate.setHours(selectedTime.getHours());
            finalDate.setMinutes(selectedTime.getMinutes());
            finalDate.setSeconds(0);

            setPublishAt(finalDate);
          },
        });
      },
    });
  };

  const scheduleResults = async () => {
    if (!examType || !className || !publishAt) {
      Alert.alert('Required', 'Exam, Class, Publish Time select cheyyi');
      return;
    }

    try {
      setLoading(true);
      setSuccessMsg('');

      console.log('🚀 Sending Schedule Request:', {
        examType,
        className,
        publishAt: publishAt.toISOString(),
      });

      const res = await api.post('/marks/schedule-publish', {
        examType,
        className,
        publishAt: publishAt.toISOString(), // ✅ correct
      });

      console.log('✅ Schedule Success:', res.data);


      setSuccessMsg(
        `✅ ${className} results scheduled successfully.\nParents will be notified at the set time.`
      );
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const serverErr = err.response?.data?.error;
      const msg = serverErr ? `${serverMsg}: ${serverErr}` : (serverMsg || 'Failed to schedule results');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (
    data: string[],
    onSelect: (v: string) => void,
    onClose: () => void
  ) => (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dropdown}>
          <FlatList
            data={data}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publish Results</Text>

      <TouchableOpacity style={styles.input} onPress={() => setShowExam(true)}>
        <Text style={styles.inputText}>
          {examType || 'Select Exam Type'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.input} onPress={() => setShowClass(true)}>
        <Text style={styles.inputText}>
          {className || 'Select Class'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.input} onPress={openDateTimePicker}>
        <Text style={styles.inputText}>
          {publishAt ? publishAt.toLocaleString() : 'Select Publish Time'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.publishBtn}
        onPress={scheduleResults}
        disabled={loading}
      >
        <Text style={styles.publishText}>
          {loading ? 'Scheduling...' : 'SCHEDULE RESULTS'}
        </Text>
      </TouchableOpacity>

      {successMsg ? (
        <Text style={styles.successText}>{successMsg}</Text>
      ) : null}

      {showExam &&
        renderModal(EXAMS, setExamType, () => setShowExam(false))}
      {showClass &&
        renderModal(CLASSES, setClassName, () => setShowClass(false))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 14 },
  inputText: { fontWeight: '600', color: '#111' },
  publishBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 14 },
  publishText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  successText: { marginTop: 20, textAlign: 'center', color: '#16a34a', fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center' },
  dropdown: { backgroundColor: '#fff', borderRadius: 14, maxHeight: 400 },
  option: { padding: 16, borderBottomWidth: 0.5, borderColor: '#e5e7eb' },
  optionText: { fontWeight: '600' },
});
