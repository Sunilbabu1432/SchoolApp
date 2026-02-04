import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function TeachersStudents() {
  const { className } = useLocalSearchParams(); // 🔑 selected class
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (className) {
      loadStudents();
    }
  }, [className]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/students?class=${encodeURIComponent(String(className))}`
      );
      const data = res.data.students || [];
      setStudents(data);
      setFilteredStudents(data);
    } catch (err) {
      console.log('❌ Student fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredStudents(students);
      return;
    }
    const filtered = students.filter(s =>
      s.Name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Fetching Students...</Text>
          <Text style={styles.loadingSub}>Personalizing your class list</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerLabel}>STUDENTS LIST</Text>
            <Text style={styles.headerTitle}>{className}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredStudents.length}</Text>
          </View>
        </View>

        {/* 2. Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            placeholder="Search students..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* 2. List */}
        <FlatList
          data={filteredStudents}
          keyExtractor={item => item.Id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/StudentAction',
                  params: {
                    studentId: item.Id,
                    studentName: item.Name,
                    className,
                  },
                })
              }
            >
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={20} color="#6366f1" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.Name}</Text>
                <Text style={styles.subText}>Tap to enter marks or raise complaint</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={60} color="#e2e8f0" />
              <Text style={styles.emptyText}>No students found</Text>
              <Text style={styles.emptySubText}>Try a different name or class</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  loadingBox: { alignItems: 'center' },
  loadingText: { marginTop: 16, color: '#1e293b', fontWeight: '800', fontSize: 18 },
  loadingSub: { marginTop: 4, color: '#94a3b8', fontSize: 14, fontWeight: '500' },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  countText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  content: { flex: 1, paddingTop: 10 },
  listPadding: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
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
  avatarCircle: {
    width: 44,
    height: 44,
    backgroundColor: '#f5f7ff',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  subText: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#1e293b', marginTop: 20, fontSize: 18, fontWeight: '800' },
  emptySubText: { color: '#94a3b8', marginTop: 4, fontSize: 14, fontWeight: '500' },
});
