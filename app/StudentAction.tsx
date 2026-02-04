import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StudentActions() {
  const { studentId, studentName, className } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Identity Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.profileBox}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#6366f1" />
          </View>
          <Text style={styles.studentName}>{studentName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{className}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Action</Text>

        {/* 2. Action Cards */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.actionCard}
          onPress={() =>
            router.push({
              pathname: '/EnterMarks',
              params: { studentId, studentName, className },
            })
          }
        >
          <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
            <Ionicons name="create-outline" size={28} color="#6366f1" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Enter Marks</Text>
            <Text style={styles.cardSub}>Submit scores for exams and tests</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.actionCard}
          onPress={() =>
            router.push({
              pathname: '/raiseComplaint',
              params: { studentId, studentName },
            })
          }
        >
          <View style={[styles.iconBox, { backgroundColor: '#fff1f2' }]}>
            <Ionicons name="alert-circle-outline" size={28} color="#f43f5e" />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Raise Complaint</Text>
            <Text style={styles.cardSub}>Report issues or behavior to manager</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 16,
    paddingBottom: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileBox: { alignItems: 'center' },
  avatar: {
    width: 90,
    height: 90,
    backgroundColor: '#ffffff',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  studentName: { fontSize: 22, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  sectionTitle: { fontSize: 18, color: '#1e293b', fontWeight: '700', marginBottom: 20 },
  actionCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
});
