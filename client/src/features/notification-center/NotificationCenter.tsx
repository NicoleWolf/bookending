import { useState, useEffect, useRef } from 'react';
import { WRITER_ROWS, READER_ROWS, ACCOUNT_SECURITY_ROWS } from './row-data';
import type { NotificationRow, Cadence } from './row-data';
import styles from './NotificationCenter.module.css';

const API = import.meta.env.VITE_API_URL ?? '';

interface RowPref {
  rowKey:    string;
  emailOn:   boolean;
  inAppOn:   boolean;
  cadence:   string;
  isDefault: boolean;
}

interface LocalPref {
  emailOn: boolean;
  inAppOn: boolean;
  cadence: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function useSaveState() {
  const [state, setState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(next: 'saved' | 'error') {
    setState(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2400);
  }

  return { saveState: state, setSaving: () => setState('saving'), flashSaved: () => flash('saved'), flashError: () => flash('error') };
}

// ── Toggle button ──────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.toggle}
      data-on={checked ? '' : undefined}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

// ── Single notification row ────────────────────────────────────────
function NotifRow({
  row,
  pref,
  onToggleEmail,
  onToggleInApp,
  onCadence,
}: {
  row: NotificationRow;
  pref: LocalPref;
  onToggleEmail: () => void;
  onToggleInApp: () => void;
  onCadence: (c: Cadence) => void;
}) {
  const bothOff = !pref.emailOn && !pref.inAppOn;

  return (
    <div className={styles.row}>
      <div className={styles.rowMeta}>
        <span className={styles.rowLabel}>{row.label}</span>
        <span className={styles.rowDesc}>{row.description}</span>
      </div>
      <div className={styles.rowControls}>
        <Toggle checked={pref.emailOn} onChange={onToggleEmail} label={`Email — ${row.label}`} />
        <Toggle checked={pref.inAppOn} onChange={onToggleInApp} label={`In-app — ${row.label}`} />
        <select
          className={styles.cadenceSelect}
          value={pref.cadence}
          disabled={bothOff}
          aria-label={`Cadence — ${row.label}`}
          onChange={e => onCadence(e.target.value as Cadence)}
        >
          {row.cadenceOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────
function Section({ title, rows, prefs, onToggleEmail, onToggleInApp, onCadence }: {
  title: string;
  rows: NotificationRow[];
  prefs: Record<string, LocalPref>;
  onToggleEmail: (key: string) => void;
  onToggleInApp: (key: string) => void;
  onCadence: (key: string, c: Cadence) => void;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionEyebrow}>Section</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.colHeaders} aria-hidden>
          <span>Email</span>
          <span>In-App</span>
          <span>Cadence</span>
        </div>
      </div>
      <div className={styles.rowList}>
        {rows.map(row => (
          <NotifRow
            key={row.key}
            row={row}
            pref={prefs[row.key] ?? { emailOn: row.defaultEmail, inAppOn: row.defaultInApp, cadence: row.cadenceOptions[0] }}
            onToggleEmail={() => onToggleEmail(row.key)}
            onToggleInApp={() => onToggleInApp(row.key)}
            onCadence={c => onCadence(row.key, c)}
          />
        ))}
      </div>
    </section>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function NotificationCenter() {
  const [prefs, setPrefs] = useState<Record<string, LocalPref>>({});
  const [writingMode, setWritingMode] = useState(false);
  const [writingModeSince, setWritingModeSince] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { saveState, setSaving, flashSaved, flashError } = useSaveState();
  const liveRef = useRef<HTMLDivElement>(null);

  // ── Fetch on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/notification-preferences`, { credentials: 'include' })
      .then(r => r.json())
      .then(body => {
        const map: Record<string, LocalPref> = {};
        for (const p of (body.data.preferences as RowPref[])) {
          map[p.rowKey] = { emailOn: p.emailOn, inAppOn: p.inAppOn, cadence: p.cadence };
        }
        setPrefs(map);
        setWritingMode(body.data.writingMode ?? false);
        setWritingModeSince(body.data.writingModeSince ?? null);
      })
      .catch(() => setError('Failed to load preferences.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Patch a single row ───────────────────────────────────────────
  async function patchRow(key: string, patch: Partial<LocalPref>) {
    const prev = prefs[key];
    const next = { ...prev, ...patch };
    setPrefs(p => ({ ...p, [key]: next }));
    setSaving();
    try {
      const r = await fetch(`${API}/api/notification-preferences/${key}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error();
      flashSaved();
      announce('Preference saved.');
    } catch {
      setPrefs(p => ({ ...p, [key]: prev }));
      flashError();
      announce('Failed to save preference.');
    }
  }

  function announce(msg: string) {
    if (liveRef.current) liveRef.current.textContent = msg;
  }

  // ── Toggle Writing Mode ──────────────────────────────────────────
  async function toggleWritingMode() {
    const next = !writingMode;
    setWritingMode(next);
    setSaving();
    try {
      const r = await fetch(`${API}/api/notification-preferences/writing-mode`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: next }),
      });
      if (!r.ok) throw new Error();
      const body = await r.json();
      setWritingModeSince(body.data.writingModeSince ?? null);
      flashSaved();
      announce(next ? 'Writing Mode on.' : 'Writing Mode off.');
    } catch {
      setWritingMode(!next);
      flashError();
      announce('Failed to update Writing Mode.');
    }
  }

  if (loading) {
    return <div className={styles.loadingShell}><span className={styles.loadingText}>Loading preferences…</span></div>;
  }

  if (error) {
    return <div className={styles.loadingShell}><span className={styles.errorText}>{error}</span></div>;
  }

  return (
    <div className={styles.page}>
      {/* aria-live region for save announcements */}
      <div ref={liveRef} role="status" aria-live="polite" aria-atomic className={styles.srOnly} />

      {/* ── Header bar ──────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1 className={styles.pageTitle}>Notifications</h1>
          <p className={styles.pageSubtitle}>Choose how and when Bookending contacts you.</p>
        </div>
        <div className={styles.saveIndicator} data-state={saveState}>
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved'  && 'Saved'}
          {saveState === 'error'  && 'Error'}
        </div>
      </div>

      {/* ── Writing Mode ────────────────────────────────────────── */}
      <div className={styles.writingModeBlock} data-on={writingMode ? '' : undefined}>
        <div className={styles.writingModeText}>
          <span className={styles.writingModeLabel}>Writing Mode</span>
          <span className={styles.writingModeDesc}>
            {writingMode && writingModeSince
              ? `On since ${new Date(writingModeSince).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} — all notifications paused.`
              : 'Pause all notifications while you write. Nothing gets through.'}
          </span>
        </div>
        <Toggle
          checked={writingMode}
          onChange={toggleWritingMode}
          label="Writing Mode"
        />
      </div>

      {/* ── Sections ────────────────────────────────────────────── */}
      <div className={styles.sections} data-muted={writingMode ? '' : undefined}>
        <Section
          title="Writer"
          rows={WRITER_ROWS}
          prefs={prefs}
          onToggleEmail={key => patchRow(key, { emailOn: !prefs[key]?.emailOn })}
          onToggleInApp={key => patchRow(key, { inAppOn: !prefs[key]?.inAppOn })}
          onCadence={(key, c) => patchRow(key, { cadence: c })}
        />
        <Section
          title="Reader"
          rows={READER_ROWS}
          prefs={prefs}
          onToggleEmail={key => patchRow(key, { emailOn: !prefs[key]?.emailOn })}
          onToggleInApp={key => patchRow(key, { inAppOn: !prefs[key]?.inAppOn })}
          onCadence={(key, c) => patchRow(key, { cadence: c })}
        />

        {/* ── Account & Security ──────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Always on</span>
            <h2 className={styles.sectionTitle}>Account &amp; Security</h2>
          </div>
          <div className={styles.rowList}>
            {ACCOUNT_SECURITY_ROWS.map(label => (
              <div key={label} className={styles.row}>
                <div className={styles.rowMeta}>
                  <span className={styles.rowLabel}>{label}</span>
                </div>
                <div className={styles.rowControls}>
                  <span className={styles.alwaysOn} aria-label="Always on">Always on</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
