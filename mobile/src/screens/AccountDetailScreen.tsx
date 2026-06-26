import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { appBackend } from '../appBackend';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetail'>;

type AccountData = {
  id: string;
  name: string;
  createdAt: string;
};

export default function AccountDetailScreen({ route }: Props) {
  const { accountId } = route.params;
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const data = await appBackend.getAccount(accountId);
        setAccount(data ? { id: data._id, name: data.name, createdAt: data.createdAt } : null);
      } catch {
        Alert.alert('Lỗi', 'Không thể tải chi tiết');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{account?.name || 'Chi tiết tài khoản'}</Text>
      <Text style={styles.label}>Ngày tạo</Text>
      <Text style={styles.value}>{account ? new Date(account.createdAt).toLocaleString('vi-VN') : '--'}</Text>
      <Text style={styles.label}>ID</Text>
      <Text style={styles.value}>{account?.id || '--'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827',
  },
  label: {
    color: '#6b7280',
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    marginTop: 4,
  },
});
