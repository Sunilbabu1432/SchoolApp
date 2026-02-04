import {
  View,
  Text,
  StyleSheet,
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
    <View style={styles.container}>
      <Text style={styles.title}>Manager Dashboard</Text>
      <Text style={styles.subtitle}>Latest complaints & alerts</Text>

      <View style={{ flex: 1 }}>
        {latestCase && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Latest Complaint</Text>

            <Text>Case ID: {latestCase.caseId}</Text>
            <Text>Subject: {latestCase.subject}</Text>

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
        )}

        {/* 🔹 SEND INFORMATION – UNTOUCHED */}
        <View style={styles.cardSecondary}>
          <Text style={styles.cardTitle}>Send Information</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/sendInfoToTeachers')}
          >
            <Text style={styles.secondaryButtonText}>
              SEND MESSAGE TO TEACHERS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { marginTop: 10, backgroundColor: '#0f766e' },
            ]}
            onPress={() => router.push('/notificationHistory')}
          >
            <Text style={styles.secondaryButtonText}>
              VIEW NOTIFICATION HISTORY
            </Text>
          </TouchableOpacity>
        </View>

        {/* 🔥 NEW: PUBLISH RESULTS BUTTON (ONLY ADDITION) */}
        <View style={styles.cardSecondary}>
          <Text style={styles.cardTitle}>Results</Text>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#2563eb' }]}
            onPress={() => router.push('/publishResults')}
          >
            <Text style={styles.primaryButtonText}>
              PUBLISH RESULTS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  cardSecondary: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', textAlign: 'center' },
  secondaryButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: { color: '#fff', textAlign: 'center' },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  logoutText: { color: '#fff', textAlign: 'center' },
});
