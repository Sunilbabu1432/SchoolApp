import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5',
  'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10',
];

export default function TeacherClasses() {
  const router = useRouter();

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
            onPress={() =>
              router.push({
                pathname: '/TeachersStudents',
                params: { className: item },
              })
            }
          >
            <View style={styles.iconBox}>
              <Ionicons name="school-outline" size={20} color="#6366f1" />
            </View>
            <Text style={styles.text}>{item}</Text>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      />
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
});
