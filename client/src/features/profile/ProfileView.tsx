import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth';
import { Avatar } from '../../shared/ui/atoms';
import styles from './ProfileView.module.css';

interface Props {
  onBack: () => void;
}

export default function ProfileView({ onBack }: Props) {
  const { currentUser, updateProfile, changePassword } = useAuth();

  // ── Identity ──────────────────────────────────────────────────────
  const [name,    setName]    = useState(currentUser?.name    ?? '');
  const [email,   setEmail]   = useState(currentUser?.email   ?? '');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setIsSaved(name === currentUser?.name && email === currentUser?.email);
  }, [name, email, currentUser]);

  function handleIdentitySave() {
    if (!name.trim() || !email.trim()) return;
    updateProfile({ name: name.trim(), email: email.trim() });
    setIsSaved(true);
  }

  // ── Avatar ────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = (currentUser?.name ?? '')
    .trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
    // reset so re-uploading same file triggers onChange
    e.target.value = '';
  }

  function handleAvatarRemove() {
    updateProfile({ avatarUrl: null });
  }

  // ── Password ──────────────────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [pwError,    setPwError]    = useState('');
  const [pwSuccess,  setPwSuccess]  = useState(false);
  const [pwLoading,  setPwLoading]  = useState(false);

  async function handlePasswordSave() {
    setPwError('');
    setPwSuccess(false);
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError((err as { message?: string }).message ?? 'Something went wrong.');
    } finally {
      setPwLoading(false);
    }
  }

  // ── Preferences ───────────────────────────────────────────────────
  const theme           = currentUser?.theme           ?? 'light';
  const betaPrivate     = currentUser?.betaReaderPrivate ?? false;

  function handleThemeChange(t: 'dark' | 'light') {
    updateProfile({ theme: t });
  }

  function handlePrivacyToggle() {
    updateProfile({ betaReaderPrivate: !betaPrivate });
  }

  return (
    <div>
      <div className={styles.backNav}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.backTitle}>Profile</span>
      </div>

      <div className={styles.header}>
        <div className={`label ${styles.eyebrow}`}>Account</div>
        <h2 className={`serif ${styles.title}`}>Your profile</h2>
      </div>

      {/* ── Avatar ────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span className={`label ${styles.sectionTitle}`}>Photo</span>
        </div>
        <div className={styles.avatarBlock}>
          <Avatar
            initials={initials}
            tone="paper"
            size={64}
            src={currentUser?.avatarUrl}
          />
          <div className={styles.avatarActions}>
            <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
              Upload photo
            </button>
            {currentUser?.avatarUrl && (
              <button className={styles.removeBtn} onClick={handleAvatarRemove}>
                Remove
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleAvatarChange}
            />
          </div>
          <span className={styles.avatarHint}>JPG, PNG, or GIF · Displayed in the masthead and community</span>
        </div>
      </section>

      {/* ── Identity ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span className={`label ${styles.sectionTitle}`}>Identity</span>
        </div>
        <div className={styles.formWrap}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Name</span>
            <input
              className={styles.fieldInput}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Email</span>
            <input
              className={styles.fieldInput}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className={styles.sectionFooter}>
          <span className={styles.savedIndicator} data-unsaved={!isSaved ? 'true' : undefined}>
            {isSaved ? 'All changes saved' : 'Unsaved changes'}
          </span>
          <button
            className={styles.saveBtn}
            disabled={isSaved || !name.trim() || !email.trim()}
            onClick={handleIdentitySave}
          >
            Save
          </button>
        </div>
      </section>

      {/* ── Password ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span className={`label ${styles.sectionTitle}`}>Password</span>
        </div>
        <div className={styles.formWrap}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Current</span>
            <input
              className={styles.fieldInput}
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>New password</span>
            <input
              className={styles.fieldInput}
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Confirm</span>
            <input
              className={styles.fieldInput}
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className={styles.sectionFooter}>
          <span className={styles.savedIndicator} data-error={pwError ? 'true' : undefined} data-success={pwSuccess ? 'true' : undefined}>
            {pwError || (pwSuccess ? 'Password updated' : '')}
          </span>
          <button
            className={styles.saveBtn}
            disabled={pwLoading || !currentPw || !newPw || !confirmPw}
            onClick={handlePasswordSave}
          >
            {pwLoading ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </section>

      {/* ── Preferences ───────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>
          <span className={`label ${styles.sectionTitle}`}>Preferences</span>
        </div>
        <div className={styles.formWrap}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Theme</span>
            <div className={styles.themeToggle}>
              <button
                className={styles.themeOption}
                data-active={theme === 'dark' ? 'true' : undefined}
                onClick={() => handleThemeChange('dark')}
              >
                Dark
              </button>
              <button
                className={styles.themeOption}
                data-active={theme === 'light' ? 'true' : undefined}
                onClick={() => handleThemeChange('light')}
              >
                Light
              </button>
            </div>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Beta-reader privacy</span>
            <div className={styles.toggleRow}>
              <button
                className={styles.toggle}
                data-on={betaPrivate ? 'true' : undefined}
                onClick={handlePrivacyToggle}
                role="switch"
                aria-checked={betaPrivate}
              >
                <span className={styles.toggleThumb} />
              </button>
              <span className={styles.toggleLabel}>
                {betaPrivate
                  ? 'Hidden from beta-reader matching'
                  : 'Visible in beta-reader matching'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
