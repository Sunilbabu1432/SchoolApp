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
import messaging from '@react-native-firebase/messaging';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const router = useRouter();

  const saveFcmToken = async (authToken: string) => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) return;

      api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
      const token = await messaging().getToken();
      await api.post('/save-token', { token });
    } catch (err) {
      console.log('❌ FCM token failed', err);
    }
  };

  const login = async () => {
    if (!mobile) return alert('Enter mobile number');
    try {
      const res = await api.post('/auth/login', { mobile });
      await AsyncStorage.setItem('token', res.data.token);
      await saveFcmToken(res.data.token);
      await AsyncStorage.setItem(
        'user',
        JSON.stringify({
          name: res.data.name,
          role: res.data.role,
        })
      );

      const role = res.data.role;
      if (role === 'Teacher') router.replace('/teacherHome');
      else if (role === 'Manager') router.replace('/managerHome');
      else if (role === 'Parent') router.replace('/parentHome');
      else alert('Unknown role');

    } catch (err: any) {
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
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={40} color="#6366f1" />
          </View>
        </View>

        <Text style={styles.subtitle}>Sign in to access your dashboard.</Text>

        <View style={styles.divider} />

        <View style={styles.inputContainer}>
          <Ionicons name="phone-portrait-outline" size={24} color="#6366f1" style={styles.inputIcon} />
          <TextInput
            placeholder="Mobile Number"
            placeholderTextColor="#94a3b8"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={login} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    paddingTop: 48,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#9a7566', // Brownish border from mockup
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    top: -46,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 90,
    height: 90,
    backgroundColor: '#eef2ff',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 24,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#a5b4fc', // Soft purple from mockup
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a5b4fc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
