import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useState } from 'react';
import api from '../services/api';

const EXAMS = ['Unit Test', 'Mid Term', 'Final Exam'];
const CLASSES = [
  'Nursery','LKG','UKG',
  'Class-1','Class-2','Class-3','Class-4','Class-5',
  'Class-6','Class-7','Class-8','Class-9','Class-10',
];

export default function PublishResults() {
  const [examType, setExamType] = useState('');
  const [className, setClassName] = useState('');
  const [showExam, setShowExam] = useState(false);
  const [showClass, setShowClass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const publishResults = async () => {
    if (!examType || !className) {
      Alert.alert('Required', 'Please select Exam Type and Class');
      return;
    }

    try {
      setLoading(true);
      setSuccessMsg('');

      const res = await api.post('/marks/publish', {
        examType,
        className,
      });

      setSuccessMsg(
        `✅ Published: ${res.data.publishedCount}\n📢 Parents Notified: ${res.data.notifiedParents}`
      );
    } catch {
      Alert.alert('Error', 'Failed to publish results');
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (
    visible: boolean,
    data: string[],
    onSelect: (v: string) => void,
    onClose: () => void
  ) => (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dropdown}>
          <FlatList
            data={data}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publish Results</Text>

      {/* EXAM */}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowExam(true)}
      >
        <Text style={styles.inputText}>
          {examType || 'Select Exam Type'}
        </Text>
      </TouchableOpacity>

      {/* CLASS */}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowClass(true)}
      >
        <Text style={styles.inputText}>
          {className || 'Select Class'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.publishBtn}
        onPress={publishResults}
        disabled={loading}
      >
        <Text style={styles.publishText}>
          {loading ? 'Publishing...' : 'PUBLISH RESULTS'}
        </Text>
      </TouchableOpacity>

      {successMsg ? (
        <Text style={styles.successText}>{successMsg}</Text>
      ) : null}

      {showExam &&
        renderModal(showExam, EXAMS, setExamType, () =>
          setShowExam(false)
        )}

      {showClass &&
        renderModal(showClass, CLASSES, setClassName, () =>
          setShowClass(false)
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
  },
  inputText: {
    color: '#111',
    fontWeight: '600',
  },
  publishBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
  },
  publishText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  successText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#16a34a',
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: 400,
  },
  option: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
