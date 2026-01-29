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

type Teacher = {
  id: string;
  name: string;
};

const CLASSES = [
  'Nursery',
  'LKG',
  'UKG',
  'Class-1',
  'Class-2',
  'Class-3',
  'Class-4',
  'Class-5',
  'Class-6',
  'Class-7',
  'Class-8',
  'Class-9',
  'Class-10',
];

export default function SendInfoToTeachers() {
  const router = useRouter();

  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filtered, setFiltered] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  /* 🔹 LOAD ALL TEACHERS INITIALLY (SEARCH WORKS WITHOUT CLASS) */
  useEffect(() => {
    fetchAllTeachers();
  }, []);

  /* 🔍 SEARCH LOGIC – ALWAYS WORKS */
  useEffect(() => {
    const source = selectedClass ? teachers : allTeachers;

    if (!search.trim()) {
      setFiltered(source);
    } else {
      setFiltered(
        source.filter(t =>
          t.name.toLowerCase().startsWith(search.toLowerCase())
        )
      );
    }
  }, [search, teachers, allTeachers, selectedClass]);

  const fetchAllTeachers = async () => {
    try {
      const res = await api.get('/teachers');

      const data = (res.data.teachers || []).map((t: any) => ({
        id: t.Id,
        name: t.Name,
      }));

      setAllTeachers(data);
      setFiltered(data);
    } catch {
      Alert.alert('Error', 'Failed to load teachers');
    }
  };

  /* 🎓 CLASS SELECT → AUTO SELECT ALL TEACHERS */
  const fetchTeachersByClass = async (cls: string) => {
    try {
      const res = await api.get(
        `/notifications/teachers-by-class?className=${cls}`
      );

      const data: Teacher[] = res.data;

      setTeachers(data);
      setFiltered(data);
      setSearch('');

      // ✅ AUTO SELECT ALL
      setSelectedTeachers(data.map(t => t.id));
    } catch {
      Alert.alert('Error', 'Failed to load class teachers');
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
      Alert.alert('Select Teachers', 'No teachers selected');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter message');
      return;
    }

    try {
      setLoading(true);

      await api.post('/notifications/manager-to-teachers', {
        teacherIds: selectedTeachers,
        message,
      });

      Alert.alert(
        'Success',
        `Message sent to ${selectedTeachers.length} teachers`
      );

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
      <Text style={styles.title}>Send Information</Text>
      <Text style={styles.subtitle}>
        Search or select class and send message
      </Text>

      {/* SEARCH */}
      <TextInput
        style={styles.searchBox}
        placeholder="Search teacher name"
        value={search}
        onChangeText={setSearch}
      />

      {/* CLASS SELECT */}
      <TouchableOpacity
        style={styles.classSelect}
        onPress={() => setShowClassPicker(true)}
      >
        <Text
          style={[
            styles.classText,
            selectedClass && { color: '#065f46' },
          ]}
        >
          {selectedClass || 'Select Class'}
        </Text>
        <Text>▼</Text>
      </TouchableOpacity>

      {/* CLASS PICKER – SCROLLABLE */}
      {showClassPicker && (
        <View style={styles.classSheet}>
          <Text style={styles.sheetTitle}>Select Class</Text>

          <FlatList
            data={CLASSES}
            keyExtractor={item => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const selected = item === selectedClass;

              return (
                <TouchableOpacity
                  style={[
                    styles.classItem,
                    selected && styles.classItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedClass(item);
                    setShowClassPicker(false);
                    fetchTeachersByClass(item);
                  }}
                >
                  <Text
                    style={[
                      styles.classItemText,
                      selected && { color: '#16a34a' },
                    ]}
                  >
                    {item}
                  </Text>
                  {selected && <Text style={{ color: '#16a34a' }}>✔</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* TEACHERS */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
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
              {selected && <Text>✔️</Text>}
            </TouchableOpacity>
          );
        }}
      />

      {/* MESSAGE */}
      <Text style={styles.label}>Message</Text>
      <TextInput
        style={styles.messageBox}
        placeholder="Type message here..."
        value={message}
        onChangeText={setMessage}
        multiline
      />

      {/* SEND */}
      <TouchableOpacity
        style={[styles.sendButton, loading && { opacity: 0.6 }]}
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

/* ================= STYLES ================= */

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
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
  },
  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  classSelect: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#39d91d',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  classText: {
    fontSize: 18,
    fontWeight: '600',
  },
  classSheet: {
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',           // ✅ IMPORTANT: shows all classes
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    zIndex: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  classItem: {
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  classItemSelected: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  classItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  teacherRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teacherSelected: {
    backgroundColor: '#dbeafe',
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '500',
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  messageBox: {
    minHeight: 90,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  sendButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
