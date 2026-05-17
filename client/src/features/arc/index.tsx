import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Avatar, Pill, SectionHead } from '../../shared/ui/atoms';
import styles from './ARC.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ManuscriptOption {
  id: string; title: string; status: string; genre: string | null; subgenre: string | null;
}

interface ArcProgram {
  id: string; manuscriptId: string; mode: 'MANUAL' | 'AUTO'; cap: number | null;
  reviewDeadline: string | null; launchDate: string | null;
  isOpen: boolean; openedAt: string | null; closedAt: string | null;
  _count?: { applications: number };
}

interface ArcApplication {
  id: string; status: string; pitch: string | null; readingProgress: number;
  appliedAt: string; decidedAt: string | null; genreTier: 'wheelhouse' | 'adjacent' | 'stretch' | 'unknown';
  reader: { id: string; name: string; email: string; location: string | null; genres: string | null; subgenres: string | null };
}

type HubTab = 'setup' | 'applications' | 'telemetry';
type SortKey = 'recency' | 'progress';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const TIER_LABELS: Record<string, string> = {
  wheelhouse: 'In their wheelhouse',
  adjacent:   'Adjacent to their interests',
  stretch:    'A stretch',
  unknown:    'Reading preferences not yet shared',
};

const TIER_TONES: Record<string, 'good' | 'accent' | 'neutral' | 'paper'> = {
  wheelhouse: 'good',
  adjacent:   'accent',
  stretch:    'neutral',
  unknown:    'paper',
};

// ── Genre-match badge ─────────────────────────────────────────────────────────

function GenreBadge({ tier }: { tier: string }) {
  return (
    <Pill tone={TIER_TONES[tier] ?? 'neutral'}>
      {TIER_LABELS[tier] ?? tier}
    </Pill>
  );
}

// ── Application row ───────────────────────────────────────────────────────────

function ApplicationRow({ app, onDecide }: {
  app: ArcApplication;
  onDecide: (appId: string, status: 'ACCEPTED' | 'DECLINED') => void;
}) {
  const [pitchOpen, setPitchOpen] = useState(false);
  const isPending = app.status === 'PENDING';

  return (
    <div className={styles.appRow} data-status={app.status.toLowerCase()}>
      <div className={styles.appRowLeft}>
        <Avatar initials={initials(app.reader.name)} tone="muted" />
        <div className={styles.appReaderInfo}>
          <div className={styles.appReaderName}>{app.reader.name}</div>
          {app.reader.location && (
            <div className={styles.appReaderLocation}>{app.reader.location}</div>
          )}
          <div className={styles.appReaderGenres}>
            {[app.reader.genres, app.reader.subgenres].filter(Boolean).join(' · ') || 'No genre preferences set'}
          </div>
        </div>
      </div>

      <div className={styles.appRowMeta}>
        <GenreBadge tier={app.genreTier} />
        <div className={styles.appStatusLabel}>
          {app.status === 'PENDING'   && <span className={styles.appStatusPending}>Awaiting review</span>}
          {app.status === 'ACCEPTED'  && <span className={styles.appStatusAccepted}>Accepted</span>}
          {app.status === 'DECLINED'  && <span className={styles.appStatusDeclined}>Not selected</span>}
          {app.status === 'WITHDRAWN' && <span className={styles.appStatusMuted}>Stepped back</span>}
          {app.status === 'FULFILLED' && <span className={styles.appStatusAccepted}>Review posted</span>}
          {app.status === 'UNFULFILLED' && <span className={styles.appStatusDeclined}>Commitment unfulfilled</span>}
        </div>
        <div className={styles.appAppliedAt}>Applied {fmtDate(app.appliedAt)}</div>
      </div>

      {app.pitch && (
        <div className={styles.appPitchWrap}>
          <button className={styles.appPitchToggle} onClick={() => setPitchOpen(o => !o)}>
            {pitchOpen ? 'Hide note' : 'Read their note'}
          </button>
          {pitchOpen && <p className={styles.appPitchBody}>{app.pitch}</p>}
        </div>
      )}

      {isPending && (
        <div className={styles.appActions}>
          <button className={styles.appAccept} onClick={() => onDecide(app.id, 'ACCEPTED')}>Accept</button>
          <button className={styles.appDecline} onClick={() => onDecide(app.id, 'DECLINED')}>Not this time</button>
        </div>
      )}
    </div>
  );
}

// ── Program Setup tab ─────────────────────────────────────────────────────────

function ProgramSetupTab({ manuscriptId, program, onProgramChange }: {
  manuscriptId: string;
  program: ArcProgram | null;
  onProgramChange: (p: ArcProgram) => void;
}) {
  const [mode,           setMode]           = useState<'MANUAL' | 'AUTO'>(program?.mode ?? 'MANUAL');
  const [cap,            setCap]            = useState(program?.cap?.toString() ?? '');
  const [reviewDeadline, setReviewDeadline] = useState(program?.reviewDeadline?.slice(0, 10) ?? '');
  const [launchDate,     setLaunchDate]     = useState(program?.launchDate?.slice(0, 10) ?? '');
  const [saving,         setSaving]         = useState(false);
  const [toggling,       setToggling]       = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const data = await api.post<ArcProgram>(`/api/manuscripts/${manuscriptId}/arc/program`, {
        mode,
        cap: cap ? parseInt(cap, 10) : null,
        reviewDeadline: reviewDeadline || null,
        launchDate: launchDate || null,
      });
      onProgramChange(data);
    } finally { setSaving(false); }
  }

  async function handleOpen() {
    setToggling(true);
    try {
      const data = await api.post<ArcProgram>(`/api/manuscripts/${manuscriptId}/arc/program/open`);
      onProgramChange(data);
    } finally { setToggling(false); }
  }

  async function handleClose() {
    if (!confirm('Close the ARC program? Existing accepted readers will keep their access.')) return;
    setToggling(true);
    try {
      const data = await api.post<ArcProgram>(`/api/manuscripts/${manuscriptId}/arc/program/close`);
      onProgramChange(data);
    } finally { setToggling(false); }
  }

  return (
    <div className={styles.setupWrap}>
      {program?.isOpen && (
        <div className={styles.programOpenBanner}>
          <span className={styles.programOpenDot} />
          <span className={styles.programOpenLabel}>
            Open since {fmtDate(program.openedAt!)}
          </span>
          <span className={styles.programOpenCount}>
            {program._count?.applications ?? 0} application{(program._count?.applications ?? 0) !== 1 ? 's' : ''}
          </span>
          <button className={styles.programCloseBtn} onClick={handleClose} disabled={toggling}>
            Close program
          </button>
        </div>
      )}

      <div className={styles.setupGrid}>
        <div className={styles.setupField}>
          <label className={`label ${styles.setupLabel}`}>Approval mode</label>
          <div className={styles.modeToggle}>
            <button
              className={styles.modeBtn}
              data-active={mode === 'MANUAL' ? '' : undefined}
              onClick={() => setMode('MANUAL')}
            >
              Manual review
            </button>
            <button
              className={styles.modeBtn}
              data-active={mode === 'AUTO' ? '' : undefined}
              onClick={() => setMode('AUTO')}
            >
              Auto-accept
            </button>
          </div>
          <p className={styles.setupHint}>
            {mode === 'MANUAL'
              ? 'The author personally reviews each application.'
              : 'Accepted on submission, up to your cap.'}
          </p>
        </div>

        {mode === 'AUTO' && (
          <div className={styles.setupField}>
            <label className={`label ${styles.setupLabel}`}>Reader cap</label>
            <input
              type="number"
              className={styles.setupInput}
              value={cap}
              onChange={e => setCap(e.target.value)}
              placeholder="No limit"
              min={1}
            />
            <p className={styles.setupHint}>Maximum number of readers to accept. Leave blank for no limit.</p>
          </div>
        )}

        <div className={styles.setupField}>
          <label className={`label ${styles.setupLabel}`}>Review deadline</label>
          <input
            type="date"
            className={styles.setupInput}
            value={reviewDeadline}
            onChange={e => setReviewDeadline(e.target.value)}
          />
          <p className={styles.setupHint}>Readers must post their review by this date.</p>
        </div>

        <div className={styles.setupField}>
          <label className={`label ${styles.setupLabel}`}>Launch date</label>
          <input
            type="date"
            className={styles.setupInput}
            value={launchDate}
            onChange={e => setLaunchDate(e.target.value)}
          />
          <p className={styles.setupHint}>Shown to readers alongside the review deadline.</p>
        </div>
      </div>

      <div className={styles.setupActions}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {!program?.isOpen && (
          <button className={styles.openBtn} onClick={handleOpen} disabled={toggling || saving}>
            {toggling ? 'Opening…' : 'Open program'}
          </button>
        )}
      </div>

      {!program?.isOpen && (
        <p className={styles.setupOpenHint}>
          Save your settings, then open the program to start accepting applications.
          ARC is available for manuscripts in revision or published.
        </p>
      )}
    </div>
  );
}

// ── Applications tab ──────────────────────────────────────────────────────────

function ApplicationsTab({ manuscriptId, program }: {
  manuscriptId: string;
  program: ArcProgram | null;
}) {
  const [apps,    setApps]    = useState<ArcApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState<SortKey>('recency');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<ArcApplication[]>(
        `/api/manuscripts/${manuscriptId}/arc/applications?sort=${sort}`
      );
      setApps(data);
    } finally { setLoading(false); }
  }, [manuscriptId, sort]);

  useEffect(() => { load(); }, [load]);

  async function handleDecide(appId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
      await api.patch(`/api/manuscripts/${manuscriptId}/arc/applications/${appId}`, { status });
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status, decidedAt: new Date().toISOString() } : a));
    } catch { /* swallow */ }
  }

  if (program?.mode === 'AUTO') {
    const accepted = apps.filter(a => a.status === 'ACCEPTED');
    return (
      <div className={styles.autoModeNotice}>
        <p className={styles.autoModeText}>
          Auto-accept is on — readers are accepted immediately on application.
        </p>
        {accepted.length > 0 && (
          <p className={styles.autoModeCount}>{accepted.length} reader{accepted.length !== 1 ? 's' : ''} accepted so far.</p>
        )}
      </div>
    );
  }

  const pending   = apps.filter(a => a.status === 'PENDING');
  const decided   = apps.filter(a => a.status !== 'PENDING');

  return (
    <div className={styles.appsWrap}>
      <div className={styles.appsToolbar}>
        <span className={styles.appsCount}>
          {pending.length} pending · {decided.length} decided
        </span>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
        >
          <option value="recency">Newest first</option>
          <option value="progress">Reading progress</option>
        </select>
      </div>

      {loading && <div className={styles.appsEmpty}>Loading…</div>}

      {!loading && apps.length === 0 && (
        <div className={styles.appsEmpty}>
          {program?.isOpen
            ? 'No applications yet. Share your author profile to let readers find the program.'
            : 'Open the program to start receiving applications.'}
        </div>
      )}

      {!loading && pending.length > 0 && (
        <div className={styles.appSection}>
          <div className={`label ${styles.appSectionLabel}`}>Awaiting your review</div>
          {pending.map(app => (
            <ApplicationRow key={app.id} app={app} onDecide={handleDecide} />
          ))}
        </div>
      )}

      {!loading && decided.length > 0 && (
        <div className={styles.appSection}>
          <div className={`label ${styles.appSectionLabel}`}>Decided</div>
          {decided.map(app => (
            <ApplicationRow key={app.id} app={app} onDecide={handleDecide} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Telemetry tab ─────────────────────────────────────────────────────────────

function TelemetryTab({ manuscriptId, program }: {
  manuscriptId: string;
  program: ArcProgram | null;
}) {
  const [apps, setApps]       = useState<ArcApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<ArcApplication[]>(`/api/manuscripts/${manuscriptId}/arc/applications`)
      .then(data => setApps(data.filter(a => a.status === 'ACCEPTED' || a.status === 'FULFILLED' || a.status === 'UNFULFILLED')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [manuscriptId]);

  const total     = apps.length;
  const started   = apps.filter(a => a.readingProgress > 0).length;
  const finished  = apps.filter(a => a.readingProgress >= 100).length;
  const reviewed  = apps.filter(a => a.status === 'FULFILLED').length;
  const avgPct    = total > 0 ? Math.round(apps.reduce((s, a) => s + a.readingProgress, 0) / total) : 0;

  if (!program?.isOpen && total === 0) {
    return (
      <div className={styles.appsEmpty}>
        Reading telemetry will appear here once the program is open and readers are accepted.
      </div>
    );
  }

  return (
    <div className={styles.telemetryWrap}>
      <div className={styles.telemetryStats}>
        <div className={styles.telemetryStat}>
          <span className={styles.telemetryStatVal}>{total}</span>
          <span className={`label ${styles.telemetryStatLabel}`}>Accepted</span>
        </div>
        <div className={styles.telemetryStat}>
          <span className={styles.telemetryStatVal}>{started}</span>
          <span className={`label ${styles.telemetryStatLabel}`}>Started</span>
        </div>
        <div className={styles.telemetryStat}>
          <span className={styles.telemetryStatVal}>{finished}</span>
          <span className={`label ${styles.telemetryStatLabel}`}>Finished</span>
        </div>
        <div className={styles.telemetryStat}>
          <span className={styles.telemetryStatVal}>{reviewed}</span>
          <span className={`label ${styles.telemetryStatLabel}`}>Reviewed</span>
        </div>
        <div className={styles.telemetryStat}>
          <span className={styles.telemetryStatVal}>{avgPct}%</span>
          <span className={`label ${styles.telemetryStatLabel}`}>Avg. progress</span>
        </div>
      </div>

      {loading && <div className={styles.appsEmpty}>Loading…</div>}

      {!loading && apps.map(app => (
        <div key={app.id} className={styles.telemetryRow}>
          <Avatar initials={initials(app.reader.name)} tone="muted" />
          <div className={styles.telemetryReaderName}>{app.reader.name}</div>
          <div className={styles.telemetryBar}>
            <div
              className={styles.telemetryBarFill}
              style={{ '--pct': `${app.readingProgress}%` } as React.CSSProperties}
            />
          </div>
          <div className={styles.telemetryPct}>{Math.round(app.readingProgress)}%</div>
          {app.status === 'FULFILLED' && (
            <Pill tone="good">Review posted</Pill>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main hub ──────────────────────────────────────────────────────────────────

export default function ARCHub() {
  const [manuscripts, setManuscripts] = useState<ManuscriptOption[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [program,     setProgram]     = useState<ArcProgram | null>(null);
  const [loadingMs,   setLoadingMs]   = useState(true);
  const [tab,         setTab]         = useState<HubTab>('setup');

  // Load eligible manuscripts (IN_REVISION or PUBLISHED)
  useEffect(() => {
    setLoadingMs(true);
    api.get<ManuscriptOption[]>('/api/manuscripts')
      .then(data => {
        const eligible = data.filter(m => m.status === 'IN_REVISION' || m.status === 'PUBLISHED');
        setManuscripts(eligible);
        if (eligible.length > 0) setSelectedId(eligible[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingMs(false));
  }, []);

  // Load ARC program whenever manuscript changes
  useEffect(() => {
    if (!selectedId) return;
    api.get<ArcProgram | null>(`/api/manuscripts/${selectedId}/arc/program`)
      .then(data => setProgram(data))
      .catch(() => setProgram(null));
  }, [selectedId]);

  return (
    <div className={styles.hub}>
      <SectionHead
        eyebrow="ARC"
        title="Advance Reader Copies"
        kicker="Build a curated pool of early readers, collect reviews at launch."
      />

      <div className={styles.hubBody}>
        {/* Manuscript selector */}
        <div className={styles.msBar}>
          {loadingMs ? (
            <span className={`label ${styles.msLoading}`}>Loading manuscripts…</span>
          ) : manuscripts.length === 0 ? (
            <span className={styles.msNone}>
              ARC programs are available for manuscripts in revision or published.
              Move a manuscript to In Revision to get started.
            </span>
          ) : (
            <select
              className={styles.msSelect}
              value={selectedId ?? ''}
              onChange={e => { setSelectedId(e.target.value); setProgram(null); }}
            >
              {manuscripts.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} · {m.status === 'IN_REVISION' ? 'In Revision' : 'Published'}
                </option>
              ))}
            </select>
          )}

          {program?.isOpen && (
            <div className={styles.msOpenBadge}>
              <span className={styles.msOpenDot} />
              Open
            </div>
          )}
        </div>

        {selectedId && manuscripts.length > 0 && (
          <>
            {/* Tab bar */}
            <div className={styles.tabBar}>
              {(['setup', 'applications', 'telemetry'] as HubTab[]).map(t => (
                <button
                  key={t}
                  className={styles.tabBtn}
                  data-active={tab === t ? '' : undefined}
                  onClick={() => setTab(t)}
                >
                  {t === 'setup'        ? 'Program setup'
                   : t === 'applications' ? `Applications${program?._count?.applications ? ` (${program._count.applications})` : ''}`
                   : 'Reading progress'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'setup' && (
              <ProgramSetupTab
                manuscriptId={selectedId}
                program={program}
                onProgramChange={p => setProgram(p)}
              />
            )}
            {tab === 'applications' && (
              <ApplicationsTab manuscriptId={selectedId} program={program} />
            )}
            {tab === 'telemetry' && (
              <TelemetryTab manuscriptId={selectedId} program={program} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
