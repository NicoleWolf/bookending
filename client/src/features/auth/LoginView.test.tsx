import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginView } from './LoginView';
import * as AuthContextModule from './AuthContext';
import type { AuthError } from '../../types/auth';

function mockAuthContext(overrides: Partial<ReturnType<typeof AuthContextModule.useAuth>>) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    session: null,
    currentUser: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    ...overrides,
  });
}

describe('LoginView', () => {
  it('renders sign-in form by default', () => {
    mockAuthContext({});
    render(<LoginView />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('shows name field after switching to create account mode', async () => {
    mockAuthContext({});
    const user = userEvent.setup();
    render(<LoginView />);
    await user.click(screen.getByText('Create one'));
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('calls login with email and password on submit', async () => {
    const loginMock = vi.fn().mockResolvedValue(undefined);
    mockAuthContext({ login: loginMock });
    const user = userEvent.setup();
    render(<LoginView />);
    await user.type(screen.getByLabelText('Email'), 'billie@bookending.test');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(loginMock).toHaveBeenCalledWith({
      email: 'billie@bookending.test',
      password: 'password',
    });
  });

  it('displays error message when auth error is set', () => {
    const authError: AuthError = { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' };
    mockAuthContext({ error: authError });
    render(<LoginView />);
    expect(screen.getByText('Incorrect email or password.')).toBeInTheDocument();
  });

  it('disables submit button while loading', () => {
    mockAuthContext({ isLoading: true });
    render(<LoginView />);
    expect(screen.getByRole('button', { name: 'One moment…' })).toBeDisabled();
  });
});
