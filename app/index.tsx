import { Redirect } from "expo-router";
import messaging from "@react-native-firebase/messaging";

// ✅ REQUIRED: background & killed-state notification handler
// ⚠️ MUST be outside component
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log("📩 Background / Quit notification:", remoteMessage);
});

export default function Index() {
  return <Redirect href="/login" />;
}
