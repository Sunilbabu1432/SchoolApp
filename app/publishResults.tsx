import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import api from '../services/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EXAMS = ['Unit Test', 'Mid Term', 'Final Exam'];
const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5',
  'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10',
];

export default function PublishResults() {
  const router = useRouter();
  const [examType, setExamType] = useState('');
  const [className, setClassName] = useState('');
  const [publishAt, setPublishAt] = useState<Date | null>(null);

  const [showExam, setShowExam] = useState(false);
  const [showClass, setShowClass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  /* ✅ ANDROID SAFE DATE + TIME PICKER (2 STEP) */
  const openDateTimePicker = () => {
    const current = publishAt || new Date();

    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      is24Hour: true,
      onChange: (event: any, selectedDate?: Date) => {
        if (!selectedDate) return;
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
      Alert.alert('Required', 'Please select Exam, Class and Publish Time');
      return;
    }

    try {
      setLoading(true);
      setSuccessMsg('');

      await api.post('/marks/schedule-publish', {
        examType,
        className,
        publishAt: publishAt.toISOString(),
      });

      setSuccessMsg(
        `${className} results scheduled successfully. Parents will be notified at the set time.`
      );
      setShowSuccess(true);
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
    title: string,
    data: string[],
    selected: string,
    onSelect: (v: string) => void,
    onClose: () => void
  ) => (
    <Modal transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <FlatList
            data={data}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, item === selected && styles.modalItemSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.modalItemText, item === selected && styles.modalItemSelectedText]}>
                  {item}
                </Text>
                {item === selected && (
                  <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                )}
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerLabel}>PLANNER</Text>
            <Text style={styles.headerTitle}>Publish Results</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#6366f1" />
            <Text style={styles.infoText}>
              Schedule when marks should be visible to parents. All registered teachers will be notified once published.
            </Text>
          </View>

          {/* 2. Form Fields */}
          <View style={styles.form}>
            <Text style={styles.label}>EXAM CATEGORY</Text>
            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowExam(true)}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text" size={20} color="#6366f1" />
              </View>
              <Text style={[styles.pickerValue, !examType && styles.placeholder]}>
                {examType || 'Select Exam Type'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.label}>TARGET CLASS</Text>
            <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowClass(true)}>
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={20} color="#6366f1" />
              </View>
              <Text style={[styles.pickerValue, !className && styles.placeholder]}>
                {className || 'Select Class'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>

            <Text style={styles.label}>PUBLISH SCHEDULE</Text>
            <TouchableOpacity style={styles.pickerTrigger} onPress={openDateTimePicker}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={20} color="#6366f1" />
              </View>
              <Text style={[styles.pickerValue, !publishAt && styles.placeholder]}>
                {publishAt ? publishAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Select Date & Time'}
              </Text>
              <Ionicons name="time" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* 3. Action */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.publishBtn, loading && styles.disabledBtn]}
            onPress={scheduleResults}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.publishText}>SCHEDULE PUBLICATION</Text>
                <Ionicons name="cloud-upload" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconBox}>
              <Ionicons name="calendar" size={40} color="#ffffff" />
            </View>
            <Text style={styles.successTitle}>Scheduled!</Text>
            <Text style={styles.successDesc}>{successMsg}</Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => {
                setShowSuccess(false);
                router.back();
              }}
            >
              <Text style={styles.successBtnText}>Great</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showExam && renderModal('Exam Type', EXAMS, examType, setExamType, () => setShowExam(false))}
      {showClass && renderModal('Target Class', CLASSES, className, setClassName, () => setShowClass(false))}
    </SafeAreaView>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f7ff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 28,
    alignItems: 'center',
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#6366f1', fontWeight: '500', lineHeight: 18 },
  form: { marginBottom: 32 },
  label: { fontSize: 11, fontWeight: '800', color: '#94a3b8', marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f7ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pickerValue: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  placeholder: { color: '#94a3b8', fontWeight: '500' },
  publishBtn: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  disabledBtn: { backgroundColor: '#cbd5e1', elevation: 0 },
  publishText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  successContainer: { marginTop: 32, alignItems: 'center', backgroundColor: '#f0fdf4', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#dcfce7' },
  successText: { marginTop: 12, textAlign: 'center', color: '#16a34a', fontWeight: '700', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%', paddingBottom: 40 },
  modalHeader: { alignItems: 'center', paddingTop: 12, paddingBottom: 24 },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 24, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  modalItemSelected: { backgroundColor: '#f5f7ff' },
  modalItemText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  modalItemSelectedText: { color: '#6366f1', fontWeight: '800' },
  modalClose: { marginTop: 12, marginHorizontal: 24, padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, alignItems: 'center' },
  modalCloseText: { color: '#64748b', fontWeight: '700', fontSize: 16 },

  /* Success Modal Styles */
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successBox: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#1e293b',
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  successIconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#6366f1',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '500',
  },
  successBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  successBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
