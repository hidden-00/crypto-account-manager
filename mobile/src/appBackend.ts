import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { DEMO_SESSION_ID, DEMO_USER, MOCK_ACCOUNTS } from './mockData';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type AccountItem = {
  _id: string;
  name: string;
  createdAt: string;
};

const API_BASE_URL = 'http://10.0.2.2:3000';

class AppBackend {
  private static instance: AppBackend;

  static getInstance() {
    if (!AppBackend.instance) {
      AppBackend.instance = new AppBackend();
    }
    return AppBackend.instance;
  }

  private async getSessionHeader() {
    const sessionId = await AsyncStorage.getItem('sessionId');
    return sessionId ? { 'X-Session-Id': sessionId } : {};
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; sessionId?: string; error?: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      if (response.data?.success) {
        const sessionId = response.data.sessionId;
        await AsyncStorage.setItem('sessionId', sessionId);
        return { success: true, user: response.data.user, sessionId };
      }
    } catch {
      // fallback to local demo mode when backend is unavailable
    }

    if (email === 'demo' && password === 'demo') {
      await AsyncStorage.setItem('sessionId', DEMO_SESSION_ID);
      return { success: true, user: DEMO_USER, sessionId: DEMO_SESSION_ID };
    }

    return { success: false, error: 'Email hoặc mật khẩu không hợp lệ' };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const headers = await this.getSessionHeader();
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
      if (response.data?.user) {
        return response.data.user;
      }
    } catch {
      // fallback to demo session
    }

    const sessionId = await AsyncStorage.getItem('sessionId');
    if (sessionId === DEMO_SESSION_ID) {
      return DEMO_USER;
    }
    return null;
  }

  async logout(): Promise<void> {
    try {
      const headers = await this.getSessionHeader();
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { headers });
    } catch {
      // ignore network errors
    }
    await AsyncStorage.removeItem('sessionId');
  }

  async getAccounts(): Promise<AccountItem[]> {
    try {
      const headers = await this.getSessionHeader();
      const response = await axios.get(`${API_BASE_URL}/api/accounts`, { headers });
      return response.data || [];
    } catch {
      return MOCK_ACCOUNTS;
    }
  }

  async getAccount(accountId: string): Promise<AccountItem | null> {
    try {
      const headers = await this.getSessionHeader();
      const response = await axios.get(`${API_BASE_URL}/api/accounts/${accountId}`, { headers });
      return response.data || null;
    } catch {
      return MOCK_ACCOUNTS.find((item) => item._id === accountId) || null;
    }
  }

  async createAccount(name: string): Promise<AccountItem> {
    try {
      const headers = await this.getSessionHeader();
      const response = await axios.post(`${API_BASE_URL}/api/accounts`, { name }, { headers });
      if (response.data?.success) {
        return response.data.data;
      }
    } catch {
      // ignore and use local fallback
    }

    const newAccount: AccountItem = {
      _id: `account-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    MOCK_ACCOUNTS.unshift(newAccount);
    return newAccount;
  }
}

export const appBackend = AppBackend.getInstance();
