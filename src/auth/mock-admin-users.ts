import * as bcrypt from 'bcrypt';

export type MockAdminUser = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const MOCK_ADMIN_USERS: MockAdminUser[] = [
  {
    id: 'mock_admin_owner_01',
    email: 'owner@wuji.test',
    displayName: '陳老闆',
    passwordHash: bcrypt.hashSync('mock-owner-pass', 10),
    role: 'owner',
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-17T00:00:00.000Z'),
  },
  {
    id: 'mock_admin_manager_01',
    email: 'manager@wuji.test',
    displayName: '林經理',
    passwordHash: bcrypt.hashSync('mock-manager-pass', 10),
    role: 'manager',
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-17T00:00:00.000Z'),
  },
  {
    id: 'mock_admin_support_01',
    email: 'support@wuji.test',
    displayName: '王客服',
    passwordHash: bcrypt.hashSync('mock-support-pass', 10),
    role: 'support',
    isActive: true,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-17T00:00:00.000Z'),
  },
];

export function findMockAdminByEmail(email: string) {
  return (
    MOCK_ADMIN_USERS.find(
      (admin) => admin.email.toLowerCase() === email.toLowerCase(),
    ) ?? null
  );
}

export function findMockAdminById(id: string) {
  return MOCK_ADMIN_USERS.find((admin) => admin.id === id) ?? null;
}

export function listMockAdminUsers() {
  return MOCK_ADMIN_USERS.slice();
}

export function createMockAdminUser(input: {
  email: string;
  displayName: string;
  password: string;
  role: string;
}) {
  const id = `mock_admin_${String(MOCK_ADMIN_USERS.length + 1).padStart(2, '0')}`;
  const now = new Date();
  const newAdmin: MockAdminUser = {
    id,
    email: input.email,
    displayName: input.displayName,
    passwordHash: bcrypt.hashSync(input.password, 10),
    role: input.role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  MOCK_ADMIN_USERS.unshift(newAdmin);

  return newAdmin;
}

export function disableMockAdminUser(id: string) {
  const admin = findMockAdminById(id);

  if (!admin) {
    return null;
  }

  admin.isActive = false;
  admin.updatedAt = new Date();

  return admin;
}
