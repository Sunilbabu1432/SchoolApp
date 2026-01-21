import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import api from '../services/api';
import { logout } from '../utils/auth';
import { useRouter } from 'expo-router';

type LatestCase = {
  caseId: string;
  subject: string;
};

export default function ManagerHome() {
  const router = useRouter();
  const [latestCase, setLatestCase] = useState<LatestCase | null>(null);

  useEffect(() => {
    saveToken();

    // 🔔 Background state
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      const data = remoteMessage?.data;

      if (data && data.type === 'CASE' && data.caseId) {
        const caseId = String(data.caseId);
        const subject = String(data.subject ?? '');

        setLatestCase({ caseId, subject });

        Alert.alert(
          'New Complaint',
          `Case ID: ${caseId}\nSubject: ${subject}`
        );
      }
    });

    // 🔔 Quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        const data = remoteMessage?.data;

        if (data && data.type === 'CASE' && data.caseId) {
          setLatestCase({
            caseId: String(data.caseId),
            subject: String(data.subject ?? ''),
          });
        }
      });

    return unsubscribe;
  }, []);

  const saveToken = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) return;

      const fcmToken = await messaging().getToken();
      console.log('🔥 FCM TOKEN =>', fcmToken);

      await api.post('/save-token', { token: fcmToken });
    } catch {
      console.log('Token save failed');
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Manager Dashboard</Text>
      <Text style={styles.subtitle}>Latest complaints & alerts</Text>

      {/* CONTENT */}
      <View style={{ flex: 1 }}>
        {/* 🔹 LATEST COMPLAINT CARD */}
        {latestCase ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Latest Complaint</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Case ID</Text>
              <Text style={styles.value}>{latestCase.caseId}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Subject</Text>
              <Text style={styles.value}>{latestCase.subject}</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                router.push({
                  pathname: '/managerComplaints',
                  params: { caseId: latestCase.caseId },
                })
              }
            >
              <Text style={styles.primaryButtonText}>
                VIEW COMPLAINT DETAILS
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No new complaints at the moment
            </Text>
          </View>
        )}

        {/* 🔹 SEND INFO TO TEACHERS (NEW – CLEAN ADDITION) */}
        <View style={styles.cardSecondary}>
          <Text style={styles.cardTitle}>Send Information</Text>
          <Text style={styles.infoText}>
            Send announcements or instructions to selected teachers
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/sendInfoToTeachers')}
          >
            <Text style={styles.secondaryButtonText}>
              SEND MESSAGE TO TEACHERS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
  style={[styles.secondaryButton, { marginTop: 10, backgroundColor: '#0f766e' }]}
  onPress={() => router.push('/notificationHistory')}
>
  <Text style={styles.secondaryButtonText}>
    VIEW NOTIFICATION HISTORY
  </Text>
</TouchableOpacity>

        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    elevation: 3,
    marginBottom: 16,
  },
  cardSecondary: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    elevation: 2,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  row: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    elevation: 2,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  logoutText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
});
