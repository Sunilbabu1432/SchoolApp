import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="teacherHome" />
      <Stack.Screen name="raiseComplaint" />
      <Stack.Screen name="managerHome" />
    </Stack>
  );
}
