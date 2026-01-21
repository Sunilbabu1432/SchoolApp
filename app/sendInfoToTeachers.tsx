import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import api from '../services/api';

// 👇 UI-friendly teacher type
type Teacher = {
  id: string;
  name: string;
};

export default function SendInfoToTeachers() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  // ✅ FIXED: Salesforce → UI mapping
  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');

      const mappedTeachers: Teacher[] =
        (res.data.teachers || []).map((t: any) => ({
          id: t.Id,
          name: t.Name,
        }));

      setTeachers(mappedTeachers);
    } catch  {
      Alert.alert('Error', 'Unable to load teachers');
    }
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeachers(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const sendNotification = async () => {
    if (!selectedTeachers.length) {
      Alert.alert('Select Teachers', 'Please select at least one teacher');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message');
      return;
    }

    try {
      setLoading(true);

      await api.post('/notifications/manager-to-teachers', {
        teacherIds: selectedTeachers,
        message,
      });

      Alert.alert('Success', 'Notification sent successfully');

      setMessage('');
      setSelectedTeachers([]);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Send Information</Text>
      <Text style={styles.subtitle}>
        Select teachers and send message
      </Text>

      {/* TEACHERS LIST */}
      <FlatList
        data={teachers}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const selected = selectedTeachers.includes(item.id);

          return (
            <TouchableOpacity
              style={[
                styles.teacherRow,
                selected && styles.teacherSelected,
              ]}
              onPress={() => toggleTeacher(item.id)}
            >
              <Text style={styles.teacherName}>{item.name}</Text>
              <Text>{selected ? '✔️' : ''}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* MESSAGE BOX */}
      <Text style={styles.label}>Message</Text>
      <TextInput
        style={styles.messageBox}
        placeholder="Type message here..."
        value={message}
        onChangeText={setMessage}
        multiline
      />

      {/* SEND BUTTON */}
      <TouchableOpacity
        style={[
          styles.sendButton,
          loading && { opacity: 0.6 },
        ]}
        onPress={sendNotification}
        disabled={loading}
      >
        <Text style={styles.sendText}>
          {loading ? 'Sending...' : 'Send Notification'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
    marginTop: 4,
  },
  teacherRow: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teacherSelected: {
    backgroundColor: '#dbeafe',
  },
  teacherName: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
    color: '#374151',
  },
  messageBox: {
    minHeight: 90,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  sendButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
