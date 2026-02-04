import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherHome() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');

  const classes = [
    'Nursery', 'LKG', 'UKG', 'Class-1', 'Class-2', 'Class-3',
    'Class-4', 'Class-5', 'Class-6', 'Class-7', 'Class-8',
    'Class-9', 'Class-10',
  ];

  const saveTeacherFcmToken = async () => {
    try {
      await messaging().requestPermission();
      const token = await messaging().getToken();
      await api.post('/save-token', { token });
    } catch (err) {
      console.log('❌ Teacher token failed', err);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        setTeacherName(parsed.name);
      }
    };

    loadUser();
    saveTeacherFcmToken();
    setLoading(false);
  }, []);

  // 🔔 NOTIFICATION HANDLING
  useEffect(() => {
    let unsub = () => { };
    let fg = () => { };

    const handleNotification = (msg: any) => {
      console.log('🔔 Notification tapped:', msg);
      if (msg?.data?.caseId) {
        router.push({
          pathname: '/managerComplaints',
          params: { caseId: String(msg.data.caseId) },
        });
      } else if (msg?.notification?.body) {
        // Show general message from Headmaster
        Alert.alert(
          msg.notification.title || 'Broadcast Message',
          msg.notification.body,
          [{ text: 'Dismiss' }]
        );
      }
    };

    try {
      unsub = messaging().onNotificationOpenedApp(handleNotification);

      messaging().getInitialNotification().then(msg => {
        if (msg) handleNotification(msg);
      });

      fg = messaging().onMessage(async msg => {
        Alert.alert(
          msg.notification?.title || 'Message',
          msg.notification?.body || '',
          [{ text: 'OK' }]
        );
      });
    } catch { }

    return () => {
      try { unsub(); } catch { }
      try { fg(); } catch { }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Academic Portal</Text>
          <Text style={styles.loadingSub}>Personalizing your dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeLabel}>Good Day,</Text>
            <Text style={styles.teacherName}>{teacherName || 'Teacher'}</Text>
          </View>
          <View style={styles.profileCircle}>
            <Ionicons name="school" size={26} color="#6366f1" />
          </View>
        </View>

        <View style={styles.heroCard}>
          <Ionicons name="apps-outline" size={32} color="#6366f1" style={styles.heroIcon} />
          <View>
            <Text style={styles.heroTitle}>Academic Portal</Text>
            <Text style={styles.heroSub}>Manage your classes and students</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* 2. Class Selection Dropdown */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dropdownTrigger}
          onPress={() => setShowDropdown(true)}
        >
          <View style={styles.dropdownIconBox}>
            <Ionicons name="people" size={22} color="#6366f1" />
          </View>
          <View style={styles.dropdownBody}>
            <Text style={styles.dropdownLabel}>SELECT CLASS</Text>
            <Text style={styles.dropdownValue}>
              {selectedClass || 'Tap to choose a class'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* 2.5 Daily Attendance Action */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.dropdownTrigger, { marginTop: 12, borderLeftColor: '#10b981', borderLeftWidth: 4 }]}
          onPress={() => router.push('/Attendance')}
        >
          <View style={[styles.dropdownIconBox, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="calendar-outline" size={22} color="#10b981" />
          </View>
          <View style={styles.dropdownBody}>
            <Text style={[styles.dropdownLabel, { color: '#10b981' }]}>TRACK ATTENDANCE</Text>
            <Text style={styles.dropdownValue}>Daily Attendance Log</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
          <Text style={styles.infoText}>
            Selecting a class will show you the list of students for attendance and marks entry.
          </Text>
        </View>
      </View>

      {/* 3. Class Picker Modal */}
      <Modal visible={showDropdown} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>Choose a Class</Text>
            </View>

            <FlatList
              data={classes}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listPadding}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setSelectedClass(item);
                    setShowDropdown(false);
                    router.push({
                      pathname: '/TeachersStudents',
                      params: { className: item },
                    });
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowDropdown(false)}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  teacherName: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  profileCircle: {
    width: 52,
    height: 52,
    backgroundColor: '#ffffff',
    borderRadius: 26,
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
  heroIcon: { marginRight: 16 },
  heroTitle: { fontSize: 18, color: '#1e293b', fontWeight: '800' },
  heroSub: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  sectionTitle: { fontSize: 18, color: '#1e293b', fontWeight: '700', marginBottom: 20 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    elevation: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  dropdownIconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#f5f7ff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dropdownBody: { flex: 1 },
  dropdownLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '800', letterSpacing: 1 },
  dropdownValue: { fontSize: 16, color: '#1e293b', fontWeight: '700', marginTop: 2 },
  infoCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  listPadding: { paddingHorizontal: 24 },
  option: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: { fontSize: 17, color: '#1e293b', fontWeight: '600' },
  closeBtn: {
    marginTop: 20,
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
  },
  closeBtnText: { color: '#64748b', fontWeight: '700', fontSize: 16 },
});
