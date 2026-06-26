export type MockAccount = {
  _id: string;
  name: string;
  createdAt: string;
};

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    _id: 'demo-account-1',
    name: 'Tài khoản demo 1',
    createdAt: '2026-06-01T08:00:00.000Z',
  },
  {
    _id: 'demo-account-2',
    name: 'Tài khoản demo 2',
    createdAt: '2026-06-05T09:30:00.000Z',
  },
];

export const DEMO_SESSION_ID = 'demo-session';

export const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@mike.app',
  role: 'user',
  createdAt: '2026-06-01T08:00:00.000Z',
};
