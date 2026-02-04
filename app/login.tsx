import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging'; // ✅ ADD

export default function Login() {
  const [mobile, setMobile] = useState('');
  const router = useRouter();

  // ✅ SAVE FCM TOKEN (COMMON FOR ALL ROLES)
  const saveFcmToken = async (authToken: string) => {
    try {
      // 1. Request Permission (Android 13+)
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Authorization status:', authStatus);
        return;
      }

      // set auth header
      api.defaults.headers.common.Authorization = `Bearer ${authToken}`;

      // 2. Get Token
      const token = await messaging().getToken();
      await api.post('/save-token', { token });

      console.log('✅ FCM token saved');
    } catch (err) {
      console.log('❌ FCM token save failed', err);
      // Do not rethrow, let the user proceed
    }
  };

  const login = async () => {
    try {
      const res = await api.post('/auth/login', { mobile });

      // 🔴 store token
      await AsyncStorage.setItem('token', res.data.token);

      // 🔥 SAVE FCM TOKEN (Teacher / Manager / Parent)
      // We await this, but we caught errors inside, so it won't block navigation if it fails
      await saveFcmToken(res.data.token);

      // ✅ SAVE USER INFO (ADD ONLY)
await AsyncStorage.setItem(
  'user',
  JSON.stringify({
    name: res.data.name,   // 👈 backend nunchi ravali
    role: res.data.role,
  })
);


      const role = res.data.role;

      if (role === 'Teacher') {
        router.replace('/teacherHome');
      } else if (role === 'Manager') {
        router.replace('/managerHome');
      } else if (role === 'Parent') {
        router.replace('/parentHome');
      } else {
        alert('Unknown role');
      }

    } catch (err: any) {
      console.error('LOGIN FAILED', err);
      // Detailed error logging
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      } else if (err.request) {
        console.error('No response received:', err.request);
      } else {
        console.error('Error config:', err.message);
      }

      const msg = err.response?.data?.message || err.message || 'Login failed';
      alert(`Login Failed: ${msg}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>School App</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <TextInput
          placeholder="Enter mobile number"
          placeholderTextColor="#9ca3af"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={login}>
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 30,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
