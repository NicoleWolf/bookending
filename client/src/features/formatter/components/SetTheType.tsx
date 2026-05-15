import { useState, useEffect, useRef, useCallback } from 'react';
import { Btn } from '../../../shared/ui/atoms';
import { api } from '../../../lib/api';
import type { FormattingProjectRecord, SetTypeState, ThemeKey, SceneBreakKey } from '../types';
import { THEME_DEFS, SCENE_BREAK_SYMBOLS } from '../types';
import styles from './SetTheType.module.css';

const EXCERPT_TITLE = 'The keeper’s daughter';
const EXCERPT_P1    = 'Mara was nine the first night her father climbed the lantern alone, and she watched from the kitchen window with her chin on the sill, breath fogging a half-moon on the glass. The light went up at twenty past eight — earlier than any night that summer — and for a long minute she could see his shape against it, dark on gold, before the storm closed over him.';
const EXCERPT_P2    = 'By morning the storm had moved east, the gulls were already arguing over the breakwater, and her father was at the kitchen table reading yesterday’s newspaper.';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  project:       FormattingProjectRecord | null;
  state:         SetTypeState;
  onStateChange: (s: SetTypeState) => void;
  onBack:        () => void;
  onAdvance:     () => void;
}

function ThemeCard({
  theme,
  state,
  onSelect,
}: {
  theme: typeof THEME_DEFS[number];
  state: SetTypeState;
  onSelect: (key: ThemeKey) => void;
}) {
  const selected  = state.theme === theme.key;
  const sceneSymbol = SCENE_BREAK_SYMBOLS[
    selected ? state.sceneBreak : theme.defaultSceneBreak
  ];
  const showDropCap = selected ? state.dropCap : theme.defaultDropCap;
  const firstLetter = EXCERPT_P1[0];
  const restOfP1    = EXCERPT_P1.slice(1);

  return (
    <button
      className={styles.card}
      data-selected={selected ? '' : undefined}
      onClick={() => onSelect(theme.key)}
      type="button"
    >
      <div className={styles.cardHead}>
        <span className={`mono ${styles.cardLabel}`}>{theme.label.toUpperCase()}</span>
        {selected && <span className={`mono ${styles.cardSelected}`}>SELECTED</span>}
      </div>
      <div className={`mono ${styles.cardFonts}`}>
        {theme.bodyFont} · {theme.headingFont}
      </div>

      <div className={styles.cardPreview} style={{ fontFamily: theme.bodyStack } as React.CSSProperties}>
        <p className={styles.previewTitle} style={{ fontFamily: theme.headingStack } as React.CSSProperties}>
          {EXCERPT_TITLE}
        </p>
        <p className={styles.previewBody}>
          {showDropCap
            ? <><span className={styles.dropCap}>{firstLetter}</span>{restOfP1}</>
            : EXCERPT_P1
          }
        </p>
        <div className={`mono ${styles.previewBreak}`}>{sceneSymbol}</div>
        <p className={styles.previewBody}>{EXCERPT_P2}</p>
      </div>

      <div className={styles.cardFoot}>
        {showDropCap
          ? <span className={`mono ${styles.cardFootTag}`}>DROP CAP</span>
          : <span className={`mono ${styles.cardFootTag} ${styles.cardFootTagMuted}`}>NO CAP</span>
        }
        <span className={`mono ${styles.cardFootBreak}`}>{sceneSymbol}</span>
      </div>
    </button>
  );
}

export default function SetTheType({ project, state, onStateChange, onBack, onAdvance }: Props) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestState = useRef(state);
  latestState.current = state;

  const scheduleSave = useCallback(() => {
    if (!project) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await api.patch(`/api/formatter/${project.id}`, {
          typeSettings: JSON.stringify(latestState.current),
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    }, 600);
  }, [project]);

  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    scheduleSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  function selectTheme(key: ThemeKey) {
    const def = THEME_DEFS.find(t => t.key === key)!;
    onStateChange({
      theme:        key,
      dropCap:      def.defaultDropCap,
      dropCapLines: 4,
      sceneBreak:   def.defaultSceneBreak,
      smallCaps:    def.defaultSmallCaps,
    });
  }

  function patch(partial: Partial<SetTypeState>) {
    onStateChange({ ...state, ...partial });
  }

  return (
    <div className={styles.wrap}>

      {/* ── Heading ───────────────────────────────────────────── */}
      <div className={styles.headingRow}>
        <h1 className={`serif ${styles.heading}`}>
          Each theme is a coherent bundle — body, headings, drop cap, scene break.
          Restraint is the whole point.
        </h1>
      </div>

      {/* ── Intro bar ─────────────────────────────────────────── */}
      <div className={styles.introBar}>
        <p className={`mono ${styles.introText}`}>
          PICK A TYPEFACE. WE'VE KEPT THE CHOICES SMALL ON PURPOSE.
        </p>
        <span className={`mono ${styles.saveIndicator}`} data-state={saveState}>
          {saveState === 'saving' ? 'Saving…'
           : saveState === 'saved' ? '✓ Saved'
           : saveState === 'error' ? 'Error saving'
           : ''}
        </span>
      </div>

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={`mono ${styles.controlLabel}`}>DROP CAP</span>
          <div className={styles.toggleRow}>
            <button
              className={`mono ${styles.toggleBtn}`}
              data-active={state.dropCap ? '' : undefined}
              onClick={() => patch({ dropCap: true })}
              type="button"
            >
              On · {state.dropCapLines} lines
            </button>
            <button
              className={`mono ${styles.toggleBtn}`}
              data-active={!state.dropCap ? '' : undefined}
              onClick={() => patch({ dropCap: false })}
              type="button"
            >
              Off
            </button>
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={`mono ${styles.controlLabel}`}>SCENE BREAK</span>
          <div className={styles.toggleRow}>
            {(Object.entries(SCENE_BREAK_SYMBOLS) as [SceneBreakKey, string][]).map(([key, sym]) => (
              <button
                key={key}
                className={`mono ${styles.toggleBtn}`}
                data-active={state.sceneBreak === key ? '' : undefined}
                onClick={() => patch({ sceneBreak: key })}
                type="button"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={`mono ${styles.controlLabel}`}>SMALL CAPS</span>
          <div className={styles.toggleRow}>
            <button
              className={`mono ${styles.toggleBtn}`}
              data-active={state.smallCaps ? '' : undefined}
              onClick={() => patch({ smallCaps: true })}
              type="button"
            >
              On
            </button>
            <button
              className={`mono ${styles.toggleBtn}`}
              data-active={!state.smallCaps ? '' : undefined}
              onClick={() => patch({ smallCaps: false })}
              type="button"
            >
              Off
            </button>
          </div>
        </div>

        <a
          className={`mono ${styles.suggestLink}`}
          href="mailto:hello@bookending.co?subject=Theme suggestion"
        >
          Suggest a theme ↗
        </a>
      </div>

      {/* ── Theme card grid ───────────────────────────────────── */}
      <div className={styles.grid}>
        {THEME_DEFS.map(theme => (
          <ThemeCard
            key={theme.key}
            theme={theme}
            state={state}
            onSelect={selectTheme}
          />
        ))}
      </div>

      <p className={`mono ${styles.restraintNote}`}>
        We hold the line at four themes. If you find yourself wanting more, that's a signal
        we should add one — tell us which genre.
      </p>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button className={`mono ${styles.backBtn}`} onClick={onBack} type="button">
            ← Step 03 — Front matter
          </button>
          <span className={`mono ${styles.footerNote}`}>
            No mixing typefaces. If a theme is missing for your genre, tell us.
          </span>
        </div>
        <div className={styles.footerRight}>
          <Btn tone="accent" onClick={onAdvance} icon={<span className={styles.btnIcon}>→</span>}>
            Step 05 — Proof
          </Btn>
        </div>
      </div>
    </div>
  );
}
