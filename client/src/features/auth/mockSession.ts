import type { AuthSession, AuthUser, LoginCredentials, RegisterPayload, AuthError } from '../../types/auth';

export type UserStatus = 'active' | 'suspended';

interface UserRecord {
  user: AuthUser;
  password: string;
  createdAt: string;
  status: UserStatus;
}

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  lastLoginAt: string | null;
  isAdmin: boolean;
  status: UserStatus;
  createdAt: string;
}

export const SEED_USER: AuthUser = {
  id: 'usr_billie',
  name: 'Billie Wolf',
  email: 'nlizwolf@gmail.com',
  role: 'AUTHOR',
  lastLoginAt: null,
  isAdmin: true,
};

function makeSession(user: AuthUser): AuthSession {
  // dev:<id>:<email>:<encodedName> — parsed by server dev-bypass middleware
  const token = `dev:${user.id}:${user.email}:${encodeURIComponent(user.name)}`;
  return {
    user: { ...user, lastLoginAt: new Date().toISOString() },
    token,
    expiresAt: null,
  };
}

function toView(r: UserRecord): AdminUserView {
  return {
    id:          r.user.id,
    name:        r.user.name,
    email:       r.user.email,
    lastLoginAt: r.user.lastLoginAt,
    isAdmin:     r.user.isAdmin ?? false,
    status:      r.status,
    createdAt:   r.createdAt,
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// In-memory user store — real users only; synced via Supabase + requireAuth when real auth lands
const MOCK_USERS = new Map<string, UserRecord>([
  [SEED_USER.email, {
    user: SEED_USER,
    password: 'password',
    createdAt: '2024-03-01T00:00:00.000Z',
    status: 'active',
  }],
  ['aaronfoushee@gmail.com', {
    user: { id: 'usr_aaron', name: 'Aaron Foushee', email: 'aaronfoushee@gmail.com', role: 'AUTHOR', lastLoginAt: null },
    password: 'password',
    createdAt: new Date().toISOString(),
    status: 'active',
  }],
]);

// ── Session functions ─────────────────────────────────────────────

export function mockLogin(creds: LoginCredentials): Promise<AuthSession> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!creds.email.trim() || !creds.password.trim()) {
        const err: AuthError = { code: 'INVALID_CREDENTIALS', message: 'Email and password are required.' };
        reject(err); return;
      }
      const record = MOCK_USERS.get(creds.email.toLowerCase());
      if (!record || record.password !== creds.password || record.status === 'suspended') {
        const err: AuthError = {
          code: 'INVALID_CREDENTIALS',
          message: record?.status === 'suspended'
            ? 'This account has been suspended.'
            : 'Incorrect email or password.',
        };
        reject(err); return;
      }
      resolve(makeSession(record.user));
    }, 320);
  });
}

export function mockChangePassword(email: string, current: string, next: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const record = MOCK_USERS.get(email.toLowerCase());
      if (!record || record.password !== current) {
        const err: AuthError = { code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect.' };
        reject(err); return;
      }
      MOCK_USERS.set(email.toLowerCase(), { ...record, password: next });
      resolve();
    }, 320);
  });
}

export function mockRegister(payload: RegisterPayload): Promise<AuthSession> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!payload.name.trim() || !payload.email.trim() || !payload.password.trim()) {
        const err: AuthError = { code: 'INVALID_CREDENTIALS', message: 'All fields are required.' };
        reject(err); return;
      }
      if (MOCK_USERS.has(payload.email.toLowerCase())) {
        const err: AuthError = { code: 'EMAIL_IN_USE', message: 'An account with that email already exists.' };
        reject(err); return;
      }
      const newUser: AuthUser = {
        id: `usr_${Date.now()}`,
        name: payload.name,
        email: payload.email.toLowerCase(),
        role: payload.role,
        lastLoginAt: null,
      };
      MOCK_USERS.set(newUser.email, {
        user: newUser,
        password: payload.password,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
      resolve(makeSession(newUser));
    }, 320);
  });
}

// ── Admin functions ───────────────────────────────────────────────

export function adminGetUsers(): AdminUserView[] {
  return Array.from(MOCK_USERS.values())
    .map(toView)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function adminUpdateUser(id: string, data: { name?: string; email?: string }): AdminUserView | null {
  for (const [key, record] of MOCK_USERS.entries()) {
    if (record.user.id !== id) continue;
    const newEmail = (data.email ?? record.user.email).toLowerCase();
    const updated: UserRecord = { ...record, user: { ...record.user, ...data, email: newEmail } };
    MOCK_USERS.delete(key);
    MOCK_USERS.set(newEmail, updated);
    return toView(updated);
  }
  return null;
}

export function adminDeleteUser(id: string): boolean {
  for (const [key, record] of MOCK_USERS.entries()) {
    if (record.user.id === id) { MOCK_USERS.delete(key); return true; }
  }
  return false;
}

export function adminResetPassword(id: string): string | null {
  for (const [key, record] of MOCK_USERS.entries()) {
    if (record.user.id !== id) continue;
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const temp = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    MOCK_USERS.set(key, { ...record, password: temp });
    return temp;
  }
  return null;
}

export function adminSetRole(id: string, isAdmin: boolean): AdminUserView | null {
  for (const [key, record] of MOCK_USERS.entries()) {
    if (record.user.id !== id) continue;
    const updated: UserRecord = { ...record, user: { ...record.user, isAdmin } };
    MOCK_USERS.set(key, updated);
    return toView(updated);
  }
  return null;
}

export function adminSetStatus(id: string, status: UserStatus): AdminUserView | null {
  for (const [key, record] of MOCK_USERS.entries()) {
    if (record.user.id !== id) continue;
    const updated: UserRecord = { ...record, status };
    MOCK_USERS.set(key, updated);
    return toView(updated);
  }
  return null;
}

// Returns the latest user record for a given email — used to refresh stale sessions.
export function mockGetUser(email: string): AuthUser | null {
  return MOCK_USERS.get(email.toLowerCase())?.user ?? null;
}

export { fmtDate };
