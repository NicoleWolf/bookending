import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../auth';
import { Avatar } from '../../shared/ui/atoms';
import styles from './ProfileView.module.css';

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  onBack: () => void;
}

export default function ProfileView({ onBack }: Props) {
  const { currentUser, updateProfile, changePassword } = useAuth();

  // ── Top-bar save state (shared by autosave fields) ────────────────
  const [saveState,   setSaveState]   = useState<SaveState>('idle');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function markSaved() {
    setSaveState('saved');
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(
      () => setSaveState(s => s === 'saved' ? 'idle' : s), 2500
    );
  }

  // ── Name (autosave) ───────────────────────────────────────────────
  const [name,      setName]      = useState(currentUser?.name         ?? '');
  const debouncedName             = useDebounce(name, 600);
  const prevName                  = useRef(currentUser?.name           ?? '');

  useEffect(() => {
    if (debouncedName === prevName.current || !debouncedName.trim()) return;
    prevName.current = debouncedName;
    setSaveState('saving');
    updateProfile({ name: debouncedName.trim() });
    markSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName]);

  // ── Display name (autosave) ───────────────────────────────────────
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '');
  const debouncedDisplayName          = useDebounce(displayName, 600);
  const prevDisplayName               = useRef(currentUser?.displayName   ?? '');

  useEffect(() => {
    if (debouncedDisplayName === prevDisplayName.current) return;
    prevDisplayName.current = debouncedDisplayName;
    setSaveState('saving');
    updateProfile({ displayName: debouncedDisplayName || null });
    markSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDisplayName]);

  // ── Location (autosave) ───────────────────────────────────────────
  const [location,  setLocation]  = useState(currentUser?.location      ?? '');
  const debouncedLocation         = useDebounce(location, 600);
  const prevLocation              = useRef(currentUser?.location         ?? '');

  useEffect(() => {
    if (debouncedLocation === prevLocation.current) return;
    prevLocation.current = debouncedLocation;
    setSaveState('saving');
    updateProfile({ location: debouncedLocation || null });
    markSaved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLocation]);

  // ── Avatar ────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = (currentUser?.name ?? '')
    .trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { updateProfile({ avatarUrl: reader.result as string }); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ── Password ──────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError,   setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function handlePasswordSave() {
    setPwError(''); setPwSuccess(false);
    if (!currentPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw.length < 8)                   { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw)                 { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError((err as { message?: string }).message ?? 'Something went wrong.');
    } finally { setPwLoading(false); }
  }

  // ── Theme ─────────────────────────────────────────────────────────
  const theme = currentUser?.theme ?? 'light';
  const handleThemeChange = useCallback(
    (t: 'dark' | 'light') => { updateProfile({ theme: t }); },
    [updateProfile]
  );

  const DISPLAY_NAME_MAX = 60;

  return (
    <div className={styles.page}>

      {/* ── Sticky top bar ──────────────────────────────────────── */}
      <div className={styles.topBar}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span className={styles.breadcrumbItem}>Account</span>
          <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">
            {currentUser?.displayName ?? currentUser?.name ?? 'Profile'}
          </span>
        </nav>

        <div className={styles.topBarRight}>
          <span
            className={styles.saveIndicator}
            data-state={saveState}
            aria-live="polite"
            aria-atomic="true"
          >
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved'  && '✓ Saved'}
            {saveState === 'error'  && 'Error saving'}
          </span>
          <button className={styles.doneBtn} type="button" onClick={onBack}>Done</button>
        </div>
      </div>

      {/* ── Card stack ──────────────────────────────────────────── */}
      <div className={styles.content}>

        {/* ── Photo ─────────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.head}>
            <span className={styles.label}>Photo</span>
            <span className={styles.hint}>Displayed on your public profile and in the community.</span>
          </div>
          <div className={styles.avatarRow}>
            <Avatar initials={initials} tone="paper" size={56} src={currentUser?.avatarUrl} />
            <div className={styles.avatarActions}>
              <button
                className={styles.uploadBtn}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload photo
              </button>
              {currentUser?.avatarUrl && (
                <button
                  className={styles.removeBtn}
                  type="button"
                  onClick={() => updateProfile({ avatarUrl: null })}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        {/* ── Identity ──────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.head}>
            <span className={styles.label}>Identity</span>
            <span className={styles.hint}>Your name and how you appear to others. Changes save automatically.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pv-name">
              Name <span className={styles.annotation}>Private</span>
            </label>
            <input
              id="pv-name"
              className={styles.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pv-display-name">
              Display name <span className={styles.annotation}>Public</span>
            </label>
            <input
              id="pv-display-name"
              className={styles.input}
              type="text"
              value={displayName}
              maxLength={DISPLAY_NAME_MAX}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={name || 'Your public name'}
            />
            <span className={styles.counter}>{displayName.length}/{DISPLAY_NAME_MAX}</span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pv-location">
              Location <span className={styles.annotation}>Public</span>
            </label>
            <input
              id="pv-location"
              className={styles.input}
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <div className={styles.readonlyRow}>
              <span className={styles.readonlyValue}>{currentUser?.email}</span>
              <span className={styles.readonlyNote}>Contact support to change</span>
            </div>
          </div>
        </div>

        {/* ── Password ──────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.head}>
            <span className={styles.label}>Password</span>
            <span className={styles.hint}>Leave all fields blank to keep your current password.</span>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pv-current-pw">Current password</label>
            <input
              id="pv-current-pw"
              className={styles.input}
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pv-new-pw">New password</label>
            <input
              id="pv-new-pw"
              className={styles.input}
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="pv-confirm-pw">Confirm</label>
            <input
              id="pv-confirm-pw"
              className={styles.input}
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>

          <div className={styles.cardFooter}>
            <span
              className={styles.pwStatus}
              data-error={pwError ? '' : undefined}
              data-success={pwSuccess ? '' : undefined}
              aria-live="polite"
            >
              {pwError || (pwSuccess ? '✓ Password updated' : '')}
            </span>
            <button
              className={styles.saveBtn}
              type="button"
              disabled={pwLoading || !currentPw || !newPw || !confirmPw}
              onClick={() => void handlePasswordSave()}
            >
              {pwLoading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </div>

        {/* ── Preferences ───────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.head}>
            <span className={styles.label}>Preferences</span>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Theme</span>
            <div className={styles.segmented} role="group" aria-label="Theme selection">
              {(['light', 'dark'] as const).map(t => (
                <button
                  key={t}
                  className={styles.seg}
                  type="button"
                  data-active={theme === t ? '' : undefined}
                  onClick={() => handleThemeChange(t)}
                >
                  {t === 'light' ? 'Light' : 'Dark'}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
