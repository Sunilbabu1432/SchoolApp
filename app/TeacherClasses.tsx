import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, StatusBar, Modal, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5',
  'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10',
];

const SECTIONS = ['A', 'B', 'C', 'D'];

export default function TeacherClasses() {
  const router = useRouter();
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const handleClassPress = (className: string) => {
    setSelectedClass(className);
    setShowSectionPicker(true);
  };

  const handleSectionSelect = (sectionName: string) => {
    setShowSectionPicker(false);
    router.push({
      pathname: '/TeachersStudents',
      params: {
        className: selectedClass,
        sectionName: sectionName || 'All'
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>SELECTION</Text>
          <Text style={styles.headerTitle}>Select Class</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={CLASSES}
        keyExtractor={(i) => i}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.card}
            onPress={() => handleClassPress(item)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="school-outline" size={20} color="#6366f1" />
            </View>
            <Text style={styles.text}>{item}</Text>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      />

      {/* Section Picker Modal (Popup Card style) */}
      <Modal visible={showSectionPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalLabel}>SELECT SECTION</Text>
                <Text style={styles.modalTitle}>{selectedClass}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSectionPicker(false)}>
                <Ionicons name="close-circle" size={32} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View style={styles.gridContainer}>
              {['', ...SECTIONS].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={styles.gridItem}
                  onPress={() => handleSectionSelect(sec)}
                >
                  <View style={styles.gridIconBox}>
                    <Ionicons name="layers-outline" size={24} color="#6366f1" />
                  </View>
                  <Text style={styles.gridText}>{sec || 'All Sections'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerContent: { flex: 1 },
  headerLabel: { fontSize: 11, color: '#c7d2fe', fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 20, color: '#ffffff', fontWeight: '700', marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPadding: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#f5f7ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  text: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1e293b' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    width: Dimensions.get('window').width * 0.85,
    borderRadius: 28,
    padding: 24,
    elevation: 20,
    shadowColor: '#6366f1',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '800', letterSpacing: 1 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // 📏 Better alignment
  },
  gridItem: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  gridIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gridText: { fontSize: 15, fontWeight: '700', color: '#475569' },
});
