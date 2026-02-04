import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type Teacher = {
  id: string;
  name: string;
};

const CLASSES = [
  'Nursery', 'LKG', 'UKG', 'Class-1', 'Class-2', 'Class-3',
  'Class-4', 'Class-5', 'Class-6', 'Class-7', 'Class-8',
  'Class-9', 'Class-10',
];

export default function SendInfoToTeachers() {
  const router = useRouter();

  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filtered, setFiltered] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  /* 🔹 LOAD ALL TEACHERS INITIALLY (SEARCH WORKS WITHOUT CLASS) */
  useEffect(() => {
    fetchAllTeachers();
  }, []);

  /* 🔍 SEARCH LOGIC – ALWAYS WORKS */
  useEffect(() => {
    const source = selectedClass ? teachers : allTeachers;

    if (!search.trim()) {
      setFiltered(source);
    } else {
      setFiltered(
        source.filter(t =>
          t.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, teachers, allTeachers, selectedClass]);

  const fetchAllTeachers = async () => {
    try {
      const res = await api.get('/teachers');

      const data = (res.data.teachers || []).map((t: any) => ({
        id: t.Id,
        name: t.Name,
      }));

      setAllTeachers(data);
      setFiltered(data);
    } catch {
      Alert.alert('Error', 'Failed to load teachers');
    }
  };

  /* 🎓 CLASS SELECT → AUTO SELECT ALL TEACHERS */
  const fetchTeachersByClass = async (cls: string) => {
    try {
      setLoading(true);
      const res = await api.get(
        `/notifications/teachers-by-class?className=${cls}`
      );

      const data: Teacher[] = res.data;

      setTeachers(data);
      setFiltered(data);
      setSearch('');

      // ✅ AUTO SELECT ALL
      setSelectedTeachers(data.map(t => t.id));
    } catch {
      Alert.alert('Error', 'Failed to load class teachers');
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeachers(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const sendNotification = async () => {
    if (!selectedTeachers.length) {
      Alert.alert('Select Teachers', 'No teachers selected');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter message');
      return;
    }

    try {
      setLoading(true);

      await api.post('/notifications/manager-to-teachers', {
        teacherIds: selectedTeachers,
        message,
      });

      setSuccessMsg(`Message successfully sent to ${selectedTeachers.length} teachers.`);
      setShowSuccess(true);

      setMessage('');
      setSelectedTeachers([]);
      // we'll handle redirect after modal close
    } catch {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* 1. Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerLabel}>BROADCAST</Text>
              <Text style={styles.headerTitle}>Send Information</Text>
            </View>
          </View>

          {/* 2. Selection Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.classTrigger}
              onPress={() => setShowClassPicker(true)}
            >
              <Ionicons name="school" size={18} color="#6366f1" />
              <Text style={styles.classTriggerText}>
                {selectedClass || 'Select Class'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#94a3b8" />
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search teacher..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* 3. Message Area - MOVED UP */}
          <View style={styles.messageSectionTop}>
            <Text style={styles.inputLabel}>YOUR MESSAGE</Text>
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type your message here..."
                placeholderTextColor="#94a3b8"
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.sendButton, (loading || !message.trim() || selectedTeachers.length === 0) && styles.sendButtonDisabled]}
                onPress={sendNotification}
                disabled={loading || !message.trim() || selectedTeachers.length === 0}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Teachers List */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Select Recipients</Text>
            <Text style={styles.countText}>{selectedTeachers.length} selected</Text>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const selected = selectedTeachers.includes(item.id);
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.teacherCard, selected && styles.teacherCardSelected]}
                  onPress={() => toggleTeacher(item.id)}
                >
                  <View style={[styles.avatarCircle, selected && { backgroundColor: '#e0e7ff' }]}>
                    <Ionicons name="person" size={20} color={selected ? '#6366f1' : '#94a3b8'} />
                  </View>
                  <Text style={[styles.teacherNameText, selected && { color: '#6366f1' }]}>
                    {item.name}
                  </Text>
                  <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                    {selected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Premium Success Modal */}
        <Modal visible={showSuccess} transparent animationType="fade">
          <View style={styles.successOverlay}>
            <View style={styles.successBox}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-done" size={40} color="#ffffff" />
              </View>
              <Text style={styles.successTitle}>Broadcast Sent!</Text>
              <Text style={styles.successDesc}>{successMsg}</Text>
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => {
                  setShowSuccess(false);
                  router.back();
                }}
              >
                <Text style={styles.successBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Class Picker Modal */}
        <Modal visible={showClassPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIndicator} />
                <Text style={styles.modalTitle}>Select Target Class</Text>
              </View>
              <FlatList
                data={CLASSES}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, item === selectedClass && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedClass(item);
                      setShowClassPicker(false);
                      fetchTeachersByClass(item);
                    }}
                  >
                    <Text style={[styles.modalItemText, item === selectedClass && styles.modalItemSelectedText]}>
                      {item}
                    </Text>
                    {item === selectedClass && (
                      <Ionicons name="checkmark-circle" size={20} color="#6366f1" />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowClassPicker(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
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
  controlsRow: { flexDirection: 'row', gap: 12 },
  classTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  classTriggerText: { flex: 1, marginLeft: 8, fontSize: 14, fontWeight: '700', color: '#1e293b' },
  searchBox: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  content: { flex: 1, paddingTop: 12 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 12, alignItems: 'center' },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  countText: { fontSize: 12, fontWeight: '700', color: '#6366f1', backgroundColor: '#f5f7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 100 },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  teacherCardSelected: { borderColor: '#6366f1', backgroundColor: '#f5f7ff' },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  teacherNameText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e293b' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  messageSectionTop: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  messageInputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  messageInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendButtonDisabled: { backgroundColor: '#cbd5e1', elevation: 0, shadowOpacity: 0 },
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
