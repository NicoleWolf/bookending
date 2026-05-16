import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../../../lib/api';
import type { FormattingProjectRecord, CoverPressState, CoverFileState, EpubFormat, BuildStatus } from '../types';
import styles from './CoverPress.module.css';

interface Props {
  project:        FormattingProjectRecord | null;
  state:          CoverPressState;
  onStateChange:  (s: CoverPressState) => void;
  onBack:         () => void;
}

const KDP_STEPS = [
  {
    n: '01',
    title: 'Book details',
    desc:  'Title, subtitle, author, description, keywords. Bookending pre-fills what it knows.',
  },
  {
    n: '02',
    title: 'Content upload',
    desc:  'Upload your .epub and your cover. KDP runs its own previewer — it should match.',
  },
  {
    n: '03',
    title: 'Pricing & rights',
    desc:  "Royalty plan, territories, list price. Bookending doesn't set these.",
  },
  {
    n: '04',
    title: 'Preview & publish',
    desc:  "KDP's own previewer. If it's clean, hit publish.",
  },
];

function coverRatio(w: number, h: number) {
  const r = w / h;
  return r.toFixed(1) + ':1';
}

function validateCoverFile(file: File): Promise<CoverFileState> {
  return new Promise((resolve) => {
    const isJpeg = file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');
    const isPng  = file.type === 'image/png'  || file.name.toLowerCase().endsWith('.png');
    const format = isJpeg ? 'JPEG' : isPng ? 'PNG' : 'JPEG';
    const fileSizeMB = file.size / (1024 * 1024);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const widthPx  = img.naturalWidth;
        const heightPx = img.naturalHeight;
        const isValid  = widthPx >= 2560 && format === 'JPEG' && fileSizeMB <= 50;
        resolve({
          fileName: file.name,
          format,
          widthPx,
          heightPx,
          fileSizeMB,
          colorSpace: 'sRGB',
          isValid,
          dataUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function CoverPress({ project, state, onStateChange, onBack }: Props) {
  const [saveState,    setSaveState]    = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  // Auto-save debounce
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleAutoSave = useCallback(() => {
    if (!project) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState('saving');
      const s = latestStateRef.current;
      // Omit dataUrl from persistence (too large)
      const payload: CoverPressState = {
        ...s,
        cover: s.cover ? { ...s.cover, dataUrl: null } : null,
      };
      try {
        await api.patch(`/api/formatter/${project.id}`, { coverPress: JSON.stringify(payload) });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 600);
  }, [project]);

  function update(patch: Partial<CoverPressState>) {
    const next = { ...state, ...patch };
    onStateChange(next);
    scheduleAutoSave();
  }

  async function handleCoverFile(file: File) {
    const cover = await validateCoverFile(file);
    update({ cover });
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleCoverFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleCoverFile(file);
  }

  // Build simulation
  const buildTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleBuild() {
    if (state.build.status === 'building') return;
    const next = { ...state.build, status: 'building' as BuildStatus };
    onStateChange({ ...state, build: next });

    if (buildTimer.current) clearTimeout(buildTimer.current);
    buildTimer.current = setTimeout(() => {
      const now = new Date().toISOString();
      const result = {
        buildNumber:   (state.build.buildNumber || 0) + 1,
        status:        'passed' as BuildStatus,
        errorCount:    0,
        warningCount:  0,
        fileSizeKB:    1187,
        builtAt:       now,
        schemaVersion: 'EPUB 3',
        pageCount:     322,
        fontSizeKB:    312,
      };
      const withResult = { ...state, build: result };
      onStateChange(withResult);
      latestStateRef.current = withResult;
      scheduleAutoSave();
    }, 3500);
  }

  useEffect(() => {
    return () => {
      if (buildTimer.current)  clearTimeout(buildTimer.current);
      if (saveTimer.current)   clearTimeout(saveTimer.current);
    };
  }, []);

  const { cover, build } = state;
  const hasBuild = build.status === 'passed' || build.status === 'failed';
  const isBuilding = build.status === 'building';

  const coverOk    = cover?.isValid ?? false;
  const epubcheckOk = hasBuild && build.errorCount === 0;

  const fileSizeMB  = build.fileSizeKB ? (build.fileSizeKB / 1024).toFixed(2) : '—';
  const builtAgo    = build.builtAt
    ? Math.round((Date.now() - new Date(build.builtAt).getTime()) / 1000) + 's ago'
    : '—';

  return (
    <div className={styles.wrap}>

      {/* ── Heading ──────────────────────────────────────────── */}
      <div className={styles.headingRow}>
        <h1 className={`serif ${styles.heading}`}>The press is ready. Validate the cover, run the build, take the file.</h1>
      </div>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.formatToggle}>
            {(['epub3-kdp', 'epub2'] as EpubFormat[]).map(f => (
              <button
                key={f}
                type="button"
                className={`mono ${styles.formatBtn}`}
                data-active={state.format === f ? '' : undefined}
                onClick={() => update({ format: f })}
              >
                {f === 'epub3-kdp' ? 'EPUB 3 · KDP' : 'EPUB 2'}
              </button>
            ))}
          </div>

          <div className={styles.validationPills}>
            <span className={`mono ${styles.validPill}`} data-ok={cover && cover.widthPx >= 2560 ? '' : undefined}>
              2,560 px+
            </span>
            <span className={`mono ${styles.validPill}`} data-ok={cover && cover.format === 'JPEG' ? '' : undefined}>
              RGB
            </span>
            <span className={`mono ${styles.validPill}`} data-ok={cover && cover.fileSizeMB <= 50 ? '' : undefined}>
              ≤50 MB
            </span>
          </div>

          <div className={styles.epubcheckPill}>
            <span className={`mono ${styles.epubLabel}`}>EPUBCheck</span>
            {hasBuild ? (
              <span className={`mono ${styles.epubCount}`} data-ok={epubcheckOk ? '' : undefined}>
                {build.errorCount} err · {build.warningCount} warn
              </span>
            ) : (
              <span className={`mono ${styles.epubCount}`}>—</span>
            )}
          </div>
        </div>

        <div className={styles.topBarRight}>
          {hasBuild && (
            <span className={`mono ${styles.buildMeta}`}>BUILD #{build.buildNumber} · {builtAgo}</span>
          )}
          <button
            type="button"
            className={`mono ${styles.rebuildBtn}`}
            onClick={handleBuild}
            disabled={isBuilding}
          >
            {isBuilding ? 'Building…' : hasBuild ? 'Re-build' : 'Run build'}
          </button>
          {hasBuild && (
            <button type="button" className={`mono ${styles.downloadBtn}`} disabled>
              Download .epub
            </button>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* ── Left: cover + KDP steps ──────────────────────── */}
        <div className={styles.leftCol}>

          {/* Cover section */}
          <div className={styles.sectionHead}>
            <span className={`mono ${styles.sectionLabel}`}>THE COVER</span>
            {cover && (
              <span className={`mono ${styles.validBadge}`} data-valid={cover.isValid ? '' : undefined}>
                {cover.isValid ? 'VALID' : 'INVALID'}
              </span>
            )}
          </div>

          <div
            className={styles.coverArea}
            data-dragover={dragOver ? '' : undefined}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !cover && fileInputRef.current?.click()}
          >
            {cover?.dataUrl ? (
              <img src={cover.dataUrl} alt="Cover" className={styles.coverThumb} />
            ) : (
              <div className={styles.coverEmpty}>
                <span className={`mono ${styles.coverEmptyText}`}>DRAG JPEG HERE</span>
                <span className={`mono ${styles.coverEmptyOr}`}>or click to upload</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className={styles.hiddenInput}
            onChange={handleFileInput}
          />

          {cover ? (
            <div className={styles.coverMeta}>
              <div className={styles.coverMetaRow}>
                <span className={`mono ${styles.metaKey}`}>Format</span>
                <span className={`mono ${styles.metaVal}`}>{cover.format}</span>
              </div>
              <div className={styles.coverMetaRow}>
                <span className={`mono ${styles.metaKey}`}>Color</span>
                <span className={`mono ${styles.metaVal}`}>{cover.colorSpace}</span>
              </div>
              <div className={styles.coverMetaRow}>
                <span className={`mono ${styles.metaKey}`}>Size</span>
                <span className={`mono ${styles.metaVal}`}>{cover.widthPx.toLocaleString()} × {cover.heightPx.toLocaleString()}</span>
              </div>
              <div className={styles.coverMetaRow}>
                <span className={`mono ${styles.metaKey}`}>Ratio</span>
                <span className={`mono ${styles.metaVal}`}>{coverRatio(cover.widthPx, cover.heightPx)}</span>
              </div>
              <div className={styles.coverMetaRow}>
                <span className={`mono ${styles.metaKey}`}>File</span>
                <span className={`mono ${styles.metaVal}`}>{cover.fileSizeMB.toFixed(1)} MB</span>
              </div>
              <div className={styles.coverMetaRow}>
                <span className={`mono ${styles.metaKey}`}>Profile</span>
                <span className={`mono ${styles.metaVal}`}>{cover.colorSpace}</span>
              </div>
              <button
                type="button"
                className={`mono ${styles.replaceBtn}`}
                onClick={() => fileInputRef.current?.click()}
              >
                Replace
              </button>
            </div>
          ) : null}

          {/* KDP steps */}
          <div className={styles.kdpHead}>
            <span className={`mono ${styles.sectionLabel}`}>WHAT HAPPENS NEXT ON KDP</span>
          </div>
          <div className={styles.kdpList}>
            {KDP_STEPS.map(step => (
              <div key={step.n} className={styles.kdpStep}>
                <span className={`mono ${styles.kdpN}`}>{step.n}</span>
                <div className={styles.kdpBody}>
                  <span className={`mono ${styles.kdpTitle}`}>{step.title}</span>
                  <p className={styles.kdpDesc}>{step.desc}</p>
                </div>
                <span className={`mono ${styles.kdpOpen}`}>Open ↗</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: EPUBCheck results ───────────────────────── */}
        <div className={styles.rightCol}>
          <div className={styles.sectionHead}>
            <span className={`mono ${styles.sectionLabel}`}>EPUBCHECK</span>
            {hasBuild && (
              <span className={`mono ${styles.buildTag}`}>
                BUILD #{build.buildNumber}
              </span>
            )}
          </div>

          {isBuilding ? (
            <div className={styles.buildingState}>
              <div className={styles.buildingDot} />
              <span className={`mono ${styles.buildingText}`}>Building…</span>
            </div>
          ) : hasBuild ? (
            <>
              <div className={styles.passedHead}>
                <span className={`serif ${styles.passedLabel}`} data-passed={build.errorCount === 0 ? '' : undefined}>
                  {build.errorCount === 0 ? 'Passed.' : 'Failed.'}
                </span>
                <span className={`mono ${styles.errCount}`} data-ok={build.errorCount === 0 ? '' : undefined}>
                  {build.errorCount} ERRORS
                </span>
                <span className={`mono ${styles.warnCount}`} data-ok={build.warningCount === 0 ? '' : undefined}>
                  · {build.warningCount} WARNINGS
                </span>
              </div>

              <div className={styles.buildDetails}>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>EPUBCheck v5.1.0 · profile {build.schemaVersion}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>Schema</span>
                  <span className={`mono ${styles.detailVal}`}>OPF 3.0, NAV, NCX</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>Validity</span>
                  <span className={`mono ${styles.detailVal}`}>OK · {build.pageCount} pages · {fileSizeMB} MB</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>Embedded fonts</span>
                  <span className={`mono ${styles.detailVal}`}>OFL · {build.fontSizeKB} KB</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>Cover</span>
                  <span className={`mono ${styles.detailVal}`}>
                    {cover ? `linked · /OEBPS/${cover.fileName}` : '—'}
                  </span>
                </div>
              </div>

              <div className={styles.buildFileRow}>
                <span className={`mono ${styles.buildFileLabel}`}>Build details</span>
              </div>
              <div className={styles.buildDetails}>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>File</span>
                  <span className={`mono ${styles.detailVal}`}>manuscript.epub</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>Size</span>
                  <span className={`mono ${styles.detailVal}`}>{fileSizeMB} MB · well under KDP's 650 MB</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>Built</span>
                  <span className={`mono ${styles.detailVal}`}>{builtAgo} · build #{build.buildNumber}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={`mono ${styles.detailKey}`}>URL TTL</span>
                  <span className={`mono ${styles.detailVal}`}>23h 59m · re-builds extend</span>
                </div>
              </div>

              <div className={styles.downloadRow}>
                <button type="button" className={`mono ${styles.downloadPrimary}`} disabled>
                  Download .epub · {fileSizeMB} MB
                </button>
              </div>
              <div className={styles.actionRow}>
                <button type="button" className={`mono ${styles.actionBtn}`} disabled>Send to my Kindle</button>
                <button type="button" className={`mono ${styles.actionBtn}`} disabled>Copy preview link</button>
                <button type="button" className={`mono ${styles.actionBtn}`}>Open KDP ↗</button>
              </div>

              <p className={styles.doneNote}>
                You're done. Go put it on Amazon — we'll keep the build for 24 hours.
              </p>
            </>
          ) : (
            <div className={styles.idleState}>
              <p className={styles.idleText}>
                Run a build to validate your EPUB against EPUBCheck 5.1 and get a download link.
              </p>
              {!coverOk && (
                <p className={styles.idleHint}>
                  Upload a valid cover first — KDP requires JPEG, 2,560 px minimum width, ≤ 50 MB.
                </p>
              )}
              <button
                type="button"
                className={`mono ${styles.runBuildBtn}`}
                onClick={handleBuild}
              >
                Run build
              </button>
            </div>
          )}

          {/* Save indicator */}
          {saveState !== 'idle' && (
            <div className={styles.saveRow}>
              <span className={`mono ${styles.saveIndicator}`} data-state={saveState}>
                {saveState === 'saving' ? 'Saving…'
                 : saveState === 'saved' ? '✓ Saved'
                 : 'Error saving'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button type="button" className={`mono ${styles.backBtn}`} onClick={onBack}>
            ← Step 06 — Back matter
          </button>
          <p className={`mono ${styles.footerNote}`}>
            Bookending hands you a file and a four-step walkthrough. We don't push to KDP in v1.
          </p>
        </div>
        <div className={styles.footerRight}>
          <button type="button" className={`mono ${styles.kdpBtn}`}>
            Open KDP ↗
          </button>
        </div>
      </div>
    </div>
  );
}
