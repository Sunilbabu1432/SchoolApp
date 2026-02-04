import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import api from '../services/api';
import { logout } from '../utils/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LatestCase = {
  caseId: string;
  subject: string;
};

export default function ManagerHome() {
  const router = useRouter();
  const [latestCase, setLatestCase] = useState<LatestCase | null>(null);
  const [managerName, setManagerName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        setManagerName(parsed.name);
      }
    };
    loadUser();
  }, []);

  // ✅ Save FCM token ONLY (NO CHANGE)
  useEffect(() => {
    saveManagerToken();
  }, []);

  // ✅ Notification listeners (SAFE)
  useEffect(() => {
    let unsubscribe = () => { };
    try {
      unsubscribe = messaging().onNotificationOpenedApp(msg => {
        const d = msg?.data;

        if (d?.type === 'CASE' && d?.caseId) {
          setLatestCase({
            caseId: String(d.caseId),
            subject: String(d.subject ?? ''),
          });

          router.push({
            pathname: '/managerComplaints',
            params: { caseId: String(d.caseId) },
          });
        }

        if (d?.type === 'MARKS' && d?.markId) {
          router.push({
            pathname: '/managerMarkDetails',
            params: { markId: String(d.markId) },
          });
        }
      });

      messaging()
        .getInitialNotification()
        .then(msg => {
          const d = msg?.data;

          if (d?.type === 'CASE' && d?.caseId) {
            setLatestCase({
              caseId: String(d.caseId),
              subject: String(d.subject ?? ''),
            });

            router.push({
              pathname: '/managerComplaints',
              params: { caseId: String(d.caseId) },
            });
          }

          if (d?.type === 'MARKS' && d?.markId) {
            router.push({
              pathname: '/managerMarkDetails',
              params: { markId: String(d.markId) },
            });
          }
        })
        .catch(err => console.log('Init notification failed', err));
    } catch (e) {
      console.log('Messaging setup failed', e);
    }

    return () => {
      try {
        unsubscribe();
      } catch { }
    };
  }, []);

  const saveManagerToken = async () => {
    try {
      await messaging().requestPermission();
      const token = await messaging().getToken();
      await api.post('/save-token', { token });
    } catch (err) {
      console.log('Manager token save failed', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* 1. Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeLabel}>Headmaster,</Text>
              <Text style={styles.managerTitle}>{managerName || 'Admin Portal'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutCircle} onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroIconBox}>
              <Ionicons name="stats-chart" size={28} color="#6366f1" />
            </View>
            <View>
              <Text style={styles.heroTitle}>Management Overview</Text>
              <Text style={styles.heroSub}>Monitor complaints and academic progress</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* 2. Latest Complaints (Conditional) */}
          {latestCase && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority Alerts</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.actionCard, { borderColor: '#fee2e2', backgroundColor: '#fffafb' }]}
                onPress={() => {
                  setLatestCase(null);
                  router.push({
                    pathname: '/managerComplaints',
                    params: { caseId: latestCase.caseId },
                  });
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="alert-circle" size={24} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>New Complaint</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{latestCase.subject}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          {/* 3. Send Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communications</Text>
            <View style={styles.grid}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.gridCard}
                onPress={() => router.push('/sendInfoToTeachers')}
              >
                <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="paper-plane" size={22} color="#16a34a" />
                </View>
                <Text style={styles.gridTitle}>Message Teachers</Text>
                <Text style={styles.gridSub}>Send push alerts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.gridCard}
                onPress={() => router.push('/notificationHistory')}
              >
                <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                  <Ionicons name="time-outline" size={22} color="#64748b" />
                </View>
                <Text style={styles.gridTitle}>Sent History</Text>
                <Text style={styles.gridSub}>View past logs</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Academic Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic Control</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionCard}
              onPress={() => router.push('/publishResults')}
            >
              <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="cloud-upload" size={22} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Publish Exam Results</Text>
                <Text style={styles.cardSub}>Release marks to parent portal</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeLabel: { color: '#c7d2fe', fontSize: 14, fontWeight: '500' },
  managerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  logoutCircle: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  heroIconBox: {
    width: 56,
    height: 56,
    backgroundColor: '#f5f7ff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroTitle: { fontSize: 18, color: '#1e293b', fontWeight: '800' },
  heroSub: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 17, color: '#1e293b', fontWeight: '800', marginBottom: 16, marginLeft: 4 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#64748b',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  gridTitle: { fontSize: 15, color: '#1e293b', fontWeight: '700', marginTop: 12 },
  gridSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    elevation: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: { fontSize: 16, color: '#1e293b', fontWeight: '700' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
});
