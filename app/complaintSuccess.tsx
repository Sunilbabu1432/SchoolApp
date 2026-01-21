import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { logout } from '../utils/auth';

export default function ComplaintSuccess() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.title}>Complaint Submitted</Text>
        <Text style={styles.subtitle}>
          The manager has been notified and will review it shortly.
        </Text>

        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    elevation: 3,
  },
  icon: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
