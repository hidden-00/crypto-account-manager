import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { appBackend } from '../appBackend';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type Account = {
  _id: string;
  name: string;
  createdAt: string;
};

export default function DashboardScreen({ navigation }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = async () => {
    try {
      const data = await appBackend.getAccounts();
      setAccounts(data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async () => {
    Alert.prompt('Tạo tài khoản', 'Nhập tên tài khoản', async (name) => {
      if (!name) return;
      try {
        await appBackend.createAccount(name);
        fetchAccounts();
      } catch {
        Alert.alert('Lỗi', 'Không thể tạo tài khoản');
      }
    });
  };

  const renderAccount = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={() => navigation.navigate('AccountDetail', { accountId: item._id })}
    >
      <Text style={styles.accountName}>{item.name}</Text>
      <Text style={styles.accountDate}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateAccount}>
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAccounts(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có tài khoản nào</Text>}
          renderItem={renderAccount}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    color: '#6b7280',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  list: {
    paddingBottom: 24,
  },
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  accountDate: {
    marginTop: 6,
    color: '#6b7280',
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 32,
  },
});
