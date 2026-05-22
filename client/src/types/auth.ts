export interface AuthUser {
  id: string;
  name: string;
  displayName?: string | null;
  location?: string | null;
  email: string;
  role: 'AUTHOR' | 'READER';
  lastLoginAt: string | null;
  avatarUrl?: string | null;
  theme?: 'dark' | 'light';
  isAdmin?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  token: string | null;
  expiresAt: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'AUTHOR' | 'READER';
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'EMAIL_IN_USE' | 'CONFIRM_EMAIL' | 'UNKNOWN';
  message: string;
}
