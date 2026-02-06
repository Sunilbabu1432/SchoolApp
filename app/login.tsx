import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
    <LinearGradient
      colors={['#4f46e5', '#7c3aed']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={50} color="#ffffff" />
          </View>
          <Text style={styles.appName}>SchoolApp</Text>
          <Text style={styles.tagline}>Connected Education</Text>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.cardTitle}>
            {showOtpInput ? 'Verification' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {showOtpInput
              ? `Enter the 6-digit code sent to\n+91 ${mobile}`
              : 'Enter your mobile number to get started'}
          </Text>

          {!showOtpInput ? (
            <View style={styles.inputStack}>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#6366f1" style={styles.inputIcon} />
                <TextInput
                  placeholder="Mobile Number"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, (!isMobileReady || loading) && styles.buttonDisabled]}
                onPress={handleRequestOtp}
                activeOpacity={0.8}
                disabled={loading || !isMobileReady}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.buttonText}>Get OTP</Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputStack}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6366f1" style={styles.inputIcon} />
                <TextInput
                  placeholder="OTP Code"
                  placeholderTextColor="#94a3b8"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { letterSpacing: 8 }]}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, (!isOtpReady || loading) && styles.buttonDisabled]}
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
                style={styles.linkButton}
                onPress={() => {
                  setShowOtpInput(false);
                  setOtp('');
                }}
                disabled={loading}
              >
                <Text style={styles.linkText}>Changed mobile number?</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure Login Powered by Salesforce</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputStack: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 60,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#c7d2fe',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
});
