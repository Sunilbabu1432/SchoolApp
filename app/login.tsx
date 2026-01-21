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

export default function Login() {
  const [mobile, setMobile] = useState('');
  const router = useRouter();

  const login = async () => {
    try {
      const res = await api.post('/auth/login', { mobile });

      // 🔴 IMPORTANT: store token
      await AsyncStorage.setItem('token', res.data.token);

      if (res.data.role === 'Teacher') {
        router.replace('/teacherHome');
      } else {
        router.replace('/managerHome');
      }
    } catch (err) {
      console.log('LOGIN FAILED', err);
      alert('Login failed');
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
