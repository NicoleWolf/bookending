import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import type { AuthSession } from '../../types/auth';

// ── Hoisted mocks ─────────────────────────────────────────────────
const mockLogin    = vi.hoisted(() => vi.fn());
const mockRegister = vi.hoisted(() => vi.fn());
const mockApiGet   = vi.hoisted(() => vi.fn());

vi.mock('./mockSession', () => ({
  mockLogin,
  mockRegister,
  mockChangePassword: vi.fn(),
  mockGetUser:        vi.fn(),
}));

vi.mock('../../lib/api', () => ({
  setApiToken: vi.fn(),
  api: { get: mockApiGet },
}));

// ── Fixtures ──────────────────────────────────────────────────────
const SESSION_KEY = 'bookending_session';

const MOCK_SESSION: AuthSession = {
  user: {
    id:          'usr_billie',
    name:        'Billie Wolf',
    email:       'nlizwolf@gmail.com',
    role:        'AUTHOR',
    lastLoginAt: null,
    isAdmin:     true,
  },
  token:     'dev:usr_billie:nlizwolf@gmail.com:Billie%20Wolf',
  expiresAt: null,
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
      <button onClick={() => login({ email: 'nlizwolf@gmail.com', password: 'password' })}>
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
  localStorage.removeItem(SESSION_KEY);
  // api.get (whoami) fails by default — swallowed non-critically by AuthContext
  mockApiGet.mockRejectedValue(new Error('server down'));
});

// ── Tests ─────────────────────────────────────────────────────────
describe('AuthProvider — initial state', () => {
  it('shows logged-out synchronously when localStorage has no session', () => {
    wrap();
    expect(screen.getByTestId('status')).toHaveTextContent('logged-out');
  });

  it('hydrates from localStorage session synchronously on mount', () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(MOCK_SESSION));
    wrap();
    expect(screen.getByTestId('name')).toHaveTextContent('Billie Wolf');
  });
});

describe('AuthProvider — login', () => {
  it('calls mockLogin with the provided credentials', async () => {
    mockLogin.mockResolvedValue(MOCK_SESSION);
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Login valid'));
    expect(mockLogin).toHaveBeenCalledWith({
      email:    'nlizwolf@gmail.com',
      password: 'password',
    });
  });

  it('sets currentUser after successful login', async () => {
    mockLogin.mockResolvedValue(MOCK_SESSION);
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Login valid'));
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Billie Wolf'));
  });

  it('sets error for invalid credentials', async () => {
    mockLogin.mockRejectedValue({
      code:    'INVALID_CREDENTIALS',
      message: 'Incorrect email or password.',
    });
    const user = userEvent.setup();
    wrap();
    await user.click(screen.getByText('Login invalid'));
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Incorrect email or password.'),
    );
  });
});

describe('AuthProvider — logout', () => {
  it('clears currentUser and returns to logged-out state', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(MOCK_SESSION));
    const user = userEvent.setup();
    wrap();
    expect(screen.getByTestId('name')).toHaveTextContent('Billie Wolf');
    await user.click(screen.getByText('Sign out'));
    await waitFor(() => expect(screen.getByTestId('status')).toBeInTheDocument());
    expect(screen.queryByTestId('name')).not.toBeInTheDocument();
  });
});
