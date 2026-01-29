import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';
import messaging from '@react-native-firebase/messaging';

export default function TeacherHome() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const classes = [
    'Nursery',
    'LKG',
    'UKG',
    'Class-1',
    'Class-2',
    'Class-3',
    'Class-4',
    'Class-5',
    'Class-6',
    'Class-7',
    'Class-8',
    'Class-9',
    'Class-10',
  ];

  // ✅ SAVE TEACHER FCM TOKEN (NO CHANGE)
  const saveTeacherFcmToken = async () => {
    try {
      const token = await messaging().getToken();
      await api.post('/save-token', { token });
    } catch {
      console.log('❌ Teacher token save failed');
    }
  };

  // ✅ INITIAL LOAD
  useEffect(() => {
    saveTeacherFcmToken();
    setLoading(false);
  }, []);

  // 🔔 NOTIFICATION HANDLING (NO CHANGE)
  useEffect(() => {
    const unsub = messaging().onNotificationOpenedApp(msg => {
      if (msg?.data?.caseId) {
        router.push({
          pathname: '/managerComplaints',
          params: { caseId: String(msg.data.caseId) },
        });
      }
    });

    messaging().getInitialNotification().then(msg => {
      if (msg?.data?.caseId) {
        router.push({
          pathname: '/managerComplaints',
          params: { caseId: String(msg.data.caseId) },
        });
      }
    });

    const fg = messaging().onMessage(async msg => {
      Alert.alert(
        msg.notification?.title || 'Message',
        msg.notification?.body || ''
      );
    });

    return () => {
      unsub();
      fg();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔝 TOP SECTION */}
      <Text style={styles.title}>Select Class</Text>

      {/* 🔽 DROPDOWN */}
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setShowDropdown(true)}
      >
        <Text style={styles.dropdownText}>
          {selectedClass || 'Select Class'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      {/* 📦 DROPDOWN MODAL */}
      <Modal visible={showDropdown} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Class</Text>

            <FlatList
              data={classes}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setSelectedClass(item);
                    setShowDropdown(false);

                    // 👉 CLASS SELECT → STUDENTS SCREEN
                    router.push({
                      pathname: '/TeachersStudents',
                      params: { className: item },
                    });
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  dropdown: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#22c55e',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
  },
  arrow: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
