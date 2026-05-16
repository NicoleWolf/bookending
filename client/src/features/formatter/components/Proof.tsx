import { useState } from 'react';
import { Btn } from '../../../shared/ui/atoms';
import { deriveWarnings } from '../data';
import type {
  FormattingProjectRecord,
  DetectedItem,
  FrontMatterState,
  SetTypeState,
  FontSize,
  ProofWarning,
} from '../types';
import type { Device } from '../index';
import styles from './Proof.module.css';

const FONT_SIZES: FontSize[] = ['S', 'M', 'L', 'XL'];

const DEVICES: { id: Device; label: string }[] = [
  { id: 'paperwhite', label: 'Paperwhite' },
  { id: 'phone',      label: 'Phone' },
  { id: 'tablet',     label: '7″ tablet' },
];

interface Props {
  project:          FormattingProjectRecord | null;
  structureItems:   DetectedItem[];
  frontMatterState: FrontMatterState | null;
  typeSettingsState: SetTypeState;
  device:           Device;
  onDeviceChange:   (d: Device) => void;
  fontSize:         FontSize;
  onFontSizeChange: (s: FontSize) => void;
  jumpChapter:      number;
  onJumpChapter:    (n: number) => void;
  onGoToStep:       (n: number) => void;
  onBack:           () => void;
  onAdvance:        () => void;
}

function levelIcon(level: ProofWarning['level']) {
  if (level === 'warn') return '!';
  if (level === 'info') return 'i';
  return '✓';
}

function DiagSection({
  label, items, defaultOpen,
}: {
  label: string;
  items: ProofWarning[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  return (
    <div className={styles.diagSection}>
      <button
        className={`mono ${styles.diagHead}`}
        onClick={() => setOpen(o => !o)}
        type="button"
        data-level={items[0].level}
      >
        <span className={styles.diagHeadLabel}>{label.toUpperCase()}</span>
        <span className={styles.diagHeadMeta}>
          {open
            ? `Hide`
            : `Show · ${items.length}`}
        </span>
      </button>
      {open && (
        <div className={styles.diagList}>
          {items.map((w, i) => (
            <div key={i} className={styles.diagRow} data-level={w.level}>
              <span className={`mono ${styles.diagIcon}`} data-level={w.level}>
                {levelIcon(w.level)}
              </span>
              <span className={`mono ${styles.diagLoc}`}>{w.location}</span>
              <span className={styles.diagMsg}>{w.message}</span>
              {w.fixStep !== undefined && (
                <button
                  className={`mono ${styles.diagFix}`}
                  onClick={() => {}}
                  type="button"
                >
                  Fix in Step {String(w.fixStep).padStart(2, '0')} ↗
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageFlowStrip({
  chapter,
  warnings,
  totalWords,
  allItems,
}: {
  chapter: DetectedItem | null;
  warnings: ProofWarning[];
  totalWords: number;
  allItems: DetectedItem[];
}) {
  if (!chapter) return null;

  const warnCount   = warnings.filter(w => w.level === 'warn').length;
  const infoCount   = warnings.filter(w => w.level === 'info').length;
  const okCount     = warnings.filter(w => w.level === 'ok').length;
  const isBlocking  = warnCount === 0;

  const chapterWords = chapter.wordCount || 2000;
  const pageCount    = Math.max(2, Math.ceil(chapterWords / 250));
  const startPage    = (() => {
    let p = 7;
    for (const item of allItems) {
      if (item.id === chapter.id) break;
      if (item.type !== 'front') p += Math.max(1, Math.ceil((item.wordCount || 0) / 250));
    }
    return p;
  })();

  const warnPages = new Set<number>();
  const chapterIdx = allItems.filter(i => i.subtype === 'chapter').indexOf(chapter);
  warnings.filter(w => w.level === 'warn').forEach((_w, i) => {
    if (i === 0 && chapterIdx >= 0) warnPages.add(startPage + Math.floor(pageCount * 0.3));
  });

  const VISIBLE = 9;
  const pages   = Array.from({ length: pageCount }, (_, i) => startPage + i);
  const visible = pages.slice(0, VISIBLE);
  const overflow = pageCount - VISIBLE;
  const totalPages = Math.ceil(totalWords / 250) + 7;
  const position = Math.round((startPage / totalPages) * 100);

  return (
    <div className={styles.flowSection}>
      <div className={styles.flowStrip}>
        {visible.map(p => (
          <div
            key={p}
            className={`mono ${styles.flowPage}`}
            data-warn={warnPages.has(p) ? '' : undefined}
          >
            {warnPages.has(p) && <span className={styles.flowWarnDot}>!</span>}
            {p}
          </div>
        ))}
        {overflow > 0 && (
          <div className={`mono ${styles.flowOverflow}`}>+{overflow} →</div>
        )}
      </div>
      <div className={`mono ${styles.flowSummary}`}>
        <span data-level="warn">{warnCount} WARN</span>
        <span className={styles.flowDot}>·</span>
        <span data-level="info">{infoCount} INFO</span>
        <span className={styles.flowDot}>·</span>
        <span data-level="ok">{okCount} OK</span>
        <span className={styles.flowDot}>·</span>
        <span data-blocking={isBlocking ? '' : undefined}>
          {isBlocking ? 'NONE BLOCKING' : `${warnCount} BLOCKING`}
        </span>
      </div>
      <div className={`mono ${styles.flowPosition}`}>
        {startPage} of {totalPages} · {position}%
      </div>
    </div>
  );
}

export default function Proof({
  structureItems, frontMatterState, typeSettingsState,
  device, onDeviceChange, fontSize, onFontSizeChange,
  jumpChapter, onJumpChapter,
  onBack, onAdvance,
}: Props) {
  const warnings = deriveWarnings(structureItems, frontMatterState, typeSettingsState);
  const warnItems = warnings.filter(w => w.level === 'warn');
  const infoItems = warnings.filter(w => w.level === 'info');
  const okItems   = warnings.filter(w => w.level === 'ok');
  const isBlocking = warnItems.length === 0;

  const chapters  = structureItems.filter(i => i.subtype === 'chapter');
  const activeChapter = chapters[jumpChapter] ?? chapters[0] ?? null;
  const totalWords = structureItems.reduce((s, i) => s + (i.wordCount || 0), 0);

  return (
    <div className={styles.wrap}>

      {/* ── Heading ───────────────────────────────────────────── */}
      <div className={styles.headingRow}>
        <h1 className={`serif ${styles.heading}`}>
          The same EPUB you'll download is rendered here. Walk a chapter on Paperwhite,
          scan the warnings, side-load if you want to feel it on a real device.
        </h1>
      </div>

      {/* ── Intro bar ─────────────────────────────────────────── */}
      <div className={styles.introBar}>
        <p className={`mono ${styles.introText}`}>
          READ IT THE WAY YOUR READERS WILL.
        </p>
      </div>

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className={styles.controls}>

        <div className={styles.controlGroup}>
          <span className={`mono ${styles.controlLabel}`}>DEVICE</span>
          <div className={styles.toggleRow}>
            {DEVICES.map(d => (
              <button
                key={d.id}
                className={`mono ${styles.toggleBtn}`}
                data-active={device === d.id ? '' : undefined}
                onClick={() => onDeviceChange(d.id)}
                type="button"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={`mono ${styles.controlLabel}`}>FONT SIZE</span>
          <div className={styles.toggleRow}>
            {FONT_SIZES.map(s => (
              <button
                key={s}
                className={`mono ${styles.toggleBtn}`}
                data-active={fontSize === s ? '' : undefined}
                onClick={() => onFontSizeChange(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {chapters.length > 0 && (
          <div className={styles.controlGroup}>
            <span className={`mono ${styles.controlLabel}`}>JUMP TO</span>
            <div className={styles.chapterRail}>
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  className={`mono ${styles.chapterBtn}`}
                  data-active={jumpChapter === i ? '' : undefined}
                  onClick={() => onJumpChapter(i)}
                  type="button"
                >
                  Ch · {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Diagnostics ───────────────────────────────────────── */}
      <div className={styles.diagnostics}>
        <DiagSection label="Warnings" items={warnItems} defaultOpen={true} />
        <DiagSection label="Info"     items={infoItems} defaultOpen={false} />
        <DiagSection label="Passed checks" items={okItems} defaultOpen={false} />
      </div>

      {/* ── Page flow strip ───────────────────────────────────── */}
      <PageFlowStrip
        chapter={activeChapter}
        warnings={warnings}
        totalWords={totalWords}
        allItems={structureItems}
      />

      {/* ── Side-load ─────────────────────────────────────────── */}
      <div className={styles.sideload}>
        <span className={`mono ${styles.sideloadLabel}`}>SIDE-LOAD</span>
        <button className={`mono ${styles.sideloadBtn}`} disabled type="button" title="Coming in a future build">
          Send to my Kindle
        </button>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button className={`mono ${styles.backBtn}`} onClick={onBack} type="button">
            ← Step 04 — Set the type
          </button>
          <span className={`mono ${styles.footerNote}`}>
            {isBlocking
              ? 'No blocking issues. Warnings link back to the steps that own them.'
              : `${warnItems.length} warning${warnItems.length !== 1 ? 's' : ''} — review before continuing.`}
          </span>
        </div>
        <div className={styles.footerRight}>
          <Btn tone="accent" onClick={onAdvance} icon={<span className={styles.btnIcon}>→</span>}>
            Step 06 — Back matter
          </Btn>
        </div>
      </div>
    </div>
  );
}
