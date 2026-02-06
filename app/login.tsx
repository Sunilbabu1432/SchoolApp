import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isMobileReady = mobile.length === 10;
  const isOtpReady = otp.length === 6;

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

  const handleRequestOtp = async () => {
    if (!isMobileReady) return;
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { mobile });
      setShowOtpInput(true);
      alert('OTP sent successfully. Please check your console/device.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Request failed';
      alert(`OTP Request Failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpReady) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { mobile, otp });
      await AsyncStorage.setItem('token', res.data.token);
      await saveFcmToken(res.data.token);
      await AsyncStorage.setItem(
        'user',
        JSON.stringify({
          id: res.data.contactId,
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
      alert(`Verification Failed: ${msg}`);
    } finally {
      setLoading(false);
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

        <Text style={styles.subtitle}>
          {showOtpInput ? 'Enter the security code sent to you.' : 'Sign in to access your dashboard.'}
        </Text>

        <View style={styles.divider} />

        {!showOtpInput ? (
          <>
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

            <TouchableOpacity
              style={[styles.button, (!isMobileReady || loading) && styles.buttonDisabled]}
              onPress={handleRequestOtp}
              activeOpacity={0.8}
              disabled={loading || !isMobileReady}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Get OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#6366f1" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#94a3b8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, (!isOtpReady || loading) && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              activeOpacity={0.8}
              disabled={loading || !isOtpReady}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowOtpInput(false);
                setOtp('');
              }}
              disabled={loading}
            >
              <Text style={styles.backButtonText}>Back to login</Text>
            </TouchableOpacity>
          </>
        )}
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
    backgroundColor: '#6366f1', // Vibrant Deep Indigo
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#c7d2fe', // Desaturated "Blur" Indigo
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
});
