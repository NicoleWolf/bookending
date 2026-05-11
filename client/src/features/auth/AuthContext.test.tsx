import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from './AuthContext';

// ── Hoisted mock (must be defined before vi.mock factory runs) ────
const mockAuth = vi.hoisted(() => ({
  getSession:         vi.fn(),
  signInWithPassword: vi.fn(),
  signUp:             vi.fn(),
  signOut:            vi.fn(),
  updateUser:         vi.fn(),
  onAuthStateChange:  vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: mockAuth },
}));

// ── Auth-state trigger (captured in beforeEach) ───────────────────
let triggerAuthChange: (session: Session | null) => void = () => {};

// ── Session fixture ───────────────────────────────────────────────
const MOCK_SESSION: Session = {
  access_token:  'token123',
  token_type:    'bearer',
  expires_in:    3600,
  expires_at:    Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'refresh123',
  user: {
    id:              'usr_billie',
    app_metadata:    {},
    user_metadata:   { name: 'Billie Wolf' },
    aud:             'authenticated',
    created_at:      '2024-03-01T00:00:00.000Z',
    email:           'billie@bookending.test',
    last_sign_in_at: null,
    role:            'authenticated',
    updated_at:      '2024-03-01T00:00:00.000Z',
  },
};

// ── Consumer ──────────────────────────────────────────────────────
function TestConsumer() {
  const { currentUser, isLoading, error, login, logout } = useAuth();
  if (isLoading) return <div>loading</div>;
  if (currentUser) return (
    <div>
      <span data-testid="name">{currentUser.name}</span>
      <button onClick={logout}>Sign out</button>
    </div>
  );
  return (
    <div>
      <span data-testid="status">logged-out</span>
      {error && <span data-testid="error">{error.message}</span>}
      <button onClick={() => login({ email: 'billie@bookending.test', password: 'password' })}>
        Login valid
      </button>
      <button onClick={() => login({ email: 'bad@test.com', password: 'wrong' })}>
        Login invalid
      </button>
    </div>
  );
}

function wrap() {
  return render(<AuthProvider><TestConsumer /></AuthProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.getSession.mockResolvedValue({ data: { session: null } });
  mockAuth.signInWithPassword.mockResolvedValue({ error: null });
  mockAuth.signOut.mockResolvedValue({ error: null });
  mockAuth.onAuthStateChange.mockImplementation(
    (cb: (event: string, session: Session | null) => void) => {
      triggerAuthChange = (s) => cb('SIGNED_IN', s);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    },
  );
});

// ── Tests ─────────────────────────────────────────────────────────
describe('AuthProvider — initial state', () => {
  it('shows logged-out when no session exists', async () => {
    wrap();
    await waitFor(() => expect(screen.getByTestId('status')).toBeInTheDocument());
  });

  it('hydrates from Supabase session on mount', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    wrap();
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Billie Wolf'));
  });
});

describe('AuthProvider — login', () => {
  it('calls signInWithPassword with credentials', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByTestId('status'));
    await user.click(screen.getByText('Login valid'));
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'billie@bookending.test',
      password: 'password',
    });
  });

  it('sets currentUser after successful login via auth state change', async () => {
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByTestId('status'));
    await user.click(screen.getByText('Login valid'));
    act(() => triggerAuthChange(MOCK_SESSION));
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Billie Wolf'));
  });

  it('sets error for invalid credentials', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials', status: 400 },
    });
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByTestId('status'));
    await user.click(screen.getByText('Login invalid'));
    await waitFor(() => expect(screen.getByTestId('error')).toBeInTheDocument());
  });
});

describe('AuthProvider — logout', () => {
  it('calls signOut and clears user', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: MOCK_SESSION } });
    const user = userEvent.setup();
    wrap();
    await waitFor(() => screen.getByTestId('name'));
    await user.click(screen.getByText('Sign out'));
    act(() => triggerAuthChange(null));
    await waitFor(() => expect(screen.getByTestId('status')).toBeInTheDocument());
    expect(mockAuth.signOut).toHaveBeenCalled();
  });
});
