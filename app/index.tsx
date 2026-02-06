import { Redirect, useRouter } from "expo-router";
import messaging from "@react-native-firebase/messaging";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

// ✅ REQUIRED: background & killed-state notification handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log("📩 Background / Quit notification:", remoteMessage);
});

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuthenticated(user.role);
        } else {
          setAuthenticated(null);
        }
      } catch (err) {
        setAuthenticated(null);
      } finally {
        setChecking(false);
      }
    };
    checkSession();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (authenticated === 'Teacher') return <Redirect href="/teacherHome" />;
  if (authenticated === 'Manager') return <Redirect href="/managerHome" />;
  if (authenticated === 'Parent') return <Redirect href="/parentHome" />;

  return <Redirect href="/login" />;
}
