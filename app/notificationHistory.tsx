import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type HistoryItem = {
  _id: string;
  message: string;
  sentToCount: number;
  createdAt: string;
};

export default function NotificationHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/history');
      setHistory(res.data || []);
    } catch (err) {
      console.log('Fetch history failed', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 1. Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerLabel}>RECORDS</Text>
          <Text style={styles.headerTitle}>Broadcast History</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchHistory}>
          <Ionicons name="refresh" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 2. List */}
      <FlatList
        data={history}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Ionicons name="megaphone" size={20} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                <Text style={styles.recipientText}>Sent to {item.sentToCount} teachers</Text>
              </View>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{item.message}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="mail-unread-outline" size={60} color="#e5e7eb" />
              <Text style={styles.emptyText}>No broadcasts found</Text>
              <Text style={styles.emptySubText}>Your sent notifications will appear here</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleContainer: { flex: 1 },
  headerLabel: { fontSize: 11, color: '#c7d2fe', fontWeight: '800', letterSpacing: 1 },
  headerTitle: { fontSize: 20, color: '#ffffff', fontWeight: '700', marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPadding: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#f5f7ff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dateText: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  recipientText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  messageBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  messageText: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#1e293b', marginTop: 20, fontSize: 18, fontWeight: '800' },
  emptySubText: { color: '#94a3b8', marginTop: 4, fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
