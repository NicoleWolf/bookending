import { useState } from 'react';
import { useAuth } from './AuthContext';
import styles from './LoginView.module.css';

type Mode = 'login' | 'register';

export function LoginView() {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [mode,     setMode]     = useState<Mode>('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState<'AUTHOR' | 'READER'>('AUTHOR');

  function switchMode(next: Mode) {
    setMode(next);
    clearError();
    setName('');
    setEmail('');
    setPassword('');
    setRole('AUTHOR');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'login') {
      await login({ email, password });
    } else {
      await register({ name, email, password, role });
    }
  }

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
          <div className={styles.eyebrow}>
            {mode === 'login' ? 'Sign in to Bookending' : 'Create your account'}
          </div>

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

            {error && (
              <div className={styles.errorMsg}>{error.message}</div>
            )}

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? 'One moment…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className={styles.switchRow}>
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button className={styles.switchBtn} onClick={() => switchMode('register')}>
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className={styles.switchBtn} onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
