import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import styles from './LoginView.module.css';

type Mode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export function LoginView() {
  const { login, register, forgotPassword, resetPassword, isLoading, error, clearError, passwordRecovery } = useAuth();
  const [mode,     setMode]     = useState<Mode>('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [role,     setRole]     = useState<'AUTHOR' | 'READER'>('AUTHOR');
  const [sent,     setSent]     = useState(false);

  useEffect(() => {
    if (passwordRecovery) setMode('reset-password');
  }, [passwordRecovery]);

  function switchMode(next: Mode) {
    setMode(next);
    clearError();
    setName(''); setEmail(''); setPassword(''); setConfirm(''); setRole('AUTHOR'); setSent(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'login') {
      await login({ email, password });
    } else if (mode === 'register') {
      await register({ name, email, password, role });
    } else if (mode === 'forgot-password') {
      await forgotPassword(email);
      if (!error) setSent(true);
    } else if (mode === 'reset-password') {
      if (password !== confirm) return;
      await resetPassword(password);
    }
  }

  const eyebrow =
    mode === 'login'           ? 'Sign in to Bookending'  :
    mode === 'register'        ? 'Create your account'    :
    mode === 'forgot-password' ? 'Reset your password'    :
                                 'Choose a new password';

  return (
    <div className={styles.shell}>
      <div className={styles.left}>
        <div className={`serif ${styles.headline}`}>
          Independent, but never alone.
        </div>
        <div className={`serif ${styles.kicker}`}>
          A community for self-publishers — from manuscript to reader.
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formWrap}>
          <div className={styles.eyebrow}>{eyebrow}</div>

          {mode === 'forgot-password' && sent ? (
            <div className={styles.successMsg}>
              Check your inbox — we sent a password reset link to <strong>{email}</strong>.
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              {mode === 'register' && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="auth-name">Name</label>
                    <input
                      id="auth-name"
                      className={styles.input}
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your full name"
                      data-invalid={error ? '' : undefined}
                    />
                  </div>

                  <div className={styles.field}>
                    <div className={styles.label}>I am joining as</div>
                    <div className={styles.roleToggle}>
                      <button
                        type="button"
                        className={styles.roleOption}
                        data-active={role === 'AUTHOR' ? '' : undefined}
                        onClick={() => setRole('AUTHOR')}
                      >
                        <span className={styles.roleOptionTitle}>An author</span>
                        <span className={styles.roleOptionDesc}>Writing, publishing, and building my readership</span>
                      </button>
                      <button
                        type="button"
                        className={styles.roleOption}
                        data-active={role === 'READER' ? '' : undefined}
                        onClick={() => setRole('READER')}
                      >
                        <span className={styles.roleOptionTitle}>A reader</span>
                        <span className={styles.roleOptionDesc}>Beta-reading manuscripts and following authors</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-email">Email</label>
                  <input
                    id="auth-email"
                    className={styles.input}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    data-invalid={error ? '' : undefined}
                  />
                </div>
              )}

              {(mode === 'login' || mode === 'register') && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-password">Password</label>
                  <input
                    id="auth-password"
                    className={styles.input}
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? '••••••••' : 'At least 8 characters'}
                    data-invalid={error ? '' : undefined}
                  />
                </div>
              )}

              {mode === 'reset-password' && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="auth-new-password">New password</label>
                    <input
                      id="auth-new-password"
                      className={styles.input}
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      data-invalid={error ? '' : undefined}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="auth-confirm-password">Confirm password</label>
                    <input
                      id="auth-confirm-password"
                      className={styles.input}
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      data-invalid={(error || (confirm && password !== confirm)) ? '' : undefined}
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <div className={styles.errorMsg}>Passwords don't match.</div>
                  )}
                </>
              )}

              {error && <div className={styles.errorMsg}>{error.message}</div>}

              <button
                className={styles.submitBtn}
                type="submit"
                disabled={isLoading || (mode === 'reset-password' && password !== confirm)}
              >
                {isLoading ? 'One moment…' :
                  mode === 'login'           ? 'Sign in'          :
                  mode === 'register'        ? 'Create account'   :
                  mode === 'forgot-password' ? 'Send reset link'  :
                                              'Set new password'}
              </button>
            </form>
          )}

          <div className={styles.switchRow}>
            {mode === 'login' && (
              <>
                <button className={styles.switchBtn} onClick={() => switchMode('forgot-password')}>
                  Forgot password?
                </button>
                {' · '}
                No account?{' '}
                <button className={styles.switchBtn} onClick={() => switchMode('register')}>
                  Create one
                </button>
              </>
            )}
            {mode === 'register' && (
              <>
                Already have an account?{' '}
                <button className={styles.switchBtn} onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </>
            )}
            {(mode === 'forgot-password' || mode === 'reset-password') && (
              <button className={styles.switchBtn} onClick={() => switchMode('login')}>
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
