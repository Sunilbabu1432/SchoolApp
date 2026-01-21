import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useEffect, useState } from 'react';
import api from '../services/api';

type HistoryItem = {
  _id: string;
  message: string;
  sentToCount: number;
  createdAt: string;
};

export default function NotificationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const res = await api.get('/notifications/history');
    setHistory(res.data || []);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification History</Text>

      <FlatList
        data={history}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.message}>{item.message}</Text>

            <View style={styles.row}>
              <Text style={styles.meta}>
                Sent to: {item.sentToCount} teachers
              </Text>
              <Text style={styles.meta}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications sent yet</Text>
        }
      />
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6b7280',
  },
});
