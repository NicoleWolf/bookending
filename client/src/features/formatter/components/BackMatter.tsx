import { useState, useEffect, useRef, useCallback } from 'react';
import { Btn } from '../../../shared/ui/atoms';
import { api } from '../../../lib/api';
import type {
  FormattingProjectRecord,
  BackMatterState,
  BackMatterBlockKey,
  AckTone,
  ProfileSnapshot,
} from '../types';
import styles from './BackMatter.module.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const BLOCK_ORDER: BackMatterBlockKey[] = [
  'acknowledgments', 'about-author', 'also-by', 'newsletter-cta', 'colophon',
];

const BLOCK_LABELS: Record<BackMatterBlockKey, string> = {
  'acknowledgments': 'Acknowledgments',
  'about-author':    'About the author',
  'also-by':         'Also by',
  'newsletter-cta':  'Newsletter CTA',
  'colophon':        'Colophon',
};

const BLOCK_PAGES: Record<BackMatterBlockKey, number> = {
  'acknowledgments': 2,
  'about-author':    1,
  'also-by':         1,
  'newsletter-cta':  1,
  'colophon':        1,
};

const ACK_TONES: { key: AckTone; label: string }[] = [
  { key: 'warm',   label: 'Warm' },
  { key: 'brief',  label: 'Brief' },
  { key: 'formal', label: 'Formal' },
];

interface Props {
  project:       FormattingProjectRecord | null;
  state:         BackMatterState;
  onStateChange: (s: BackMatterState) => void;
  profile:       ProfileSnapshot | null;
  onBack:        () => void;
  onAdvance:     () => void;
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function syncAge(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'synced today';
  if (days === 1) return 'synced 1 day ago';
  return `synced ${days} days ago`;
}

export default function BackMatter({ project, state, onStateChange, profile, onBack, onAdvance }: Props) {
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
          backMatter: JSON.stringify(latestState.current),
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

  function setBlock(key: BackMatterBlockKey) {
    onStateChange({ ...state, selectedBlock: key });
  }

  function toggleInclude(key: BackMatterBlockKey) {
    if (key === 'acknowledgments') return; // always included
    const block = state.blocks[key] as { fields: unknown; included: boolean };
    onStateChange({
      ...state,
      blocks: { ...state.blocks, [key]: { ...block, included: !block.included } },
    });
  }

  function patchBlock<K extends BackMatterBlockKey>(
    key: K,
    fields: Partial<typeof state.blocks[K]['fields']>,
  ) {
    const block = state.blocks[key];
    onStateChange({
      ...state,
      blocks: { ...state.blocks, [key]: { ...block, fields: { ...block.fields, ...fields } } },
    });
  }

  const sel = state.selectedBlock;

  const onCount  = BLOCK_ORDER.filter(k => (state.blocks[k] as { included: boolean }).included !== false).length;
  const offCount = BLOCK_ORDER.length - onCount;
  const pageEst  = BLOCK_ORDER
    .filter(k => (state.blocks[k] as { included: boolean }).included !== false)
    .reduce((s, k) => s + BLOCK_PAGES[k], 0);

  const bioWords    = profile?.bio ? wordCount(profile.bio) : 0;
  const titleCount  = profile?.otherTitles?.length ?? 0;
  const hasHeadshot = !!profile?.avatarUrl;

  return (
    <div className={styles.wrap}>

      {/* ── Heading ───────────────────────────────────────────── */}
      <div className={styles.headingRow}>
        <h1 className={`serif ${styles.heading}`}>What you say after the last chapter.</h1>
      </div>

      {/* ── Intro bar ─────────────────────────────────────────── */}
      <div className={styles.introBar}>
        <p className={`mono ${styles.introText}`}>
          ACKNOWLEDGMENTS, A SHORT BIO, YOUR OTHER TITLES, AN OPTIONAL NEWSLETTER SIGN-UP.
          WE PRE-FILL WHAT WE KNOW — YOU WRITE THE PART THAT'S YOURS.
        </p>
        <span className={`mono ${styles.saveIndicator}`} data-state={saveState}>
          {saveState === 'saving' ? 'Saving…'
           : saveState === 'saved' ? '✓ Saved'
           : saveState === 'error' ? 'Error saving'
           : ''}
        </span>
      </div>

      {/* ── Block tab rail ────────────────────────────────────── */}
      <div className={styles.tabRail}>
        {BLOCK_ORDER.map(key => {
          const b        = state.blocks[key] as { included: boolean };
          const included = b.included !== false;
          return (
            <div key={key} className={styles.tabGroup}>
              <button
                className={`mono ${styles.tab}`}
                data-active={sel === key ? '' : undefined}
                onClick={() => setBlock(key)}
                type="button"
              >
                <span className={styles.tabLabel}>{BLOCK_LABELS[key]}</span>
              </button>
              {key !== 'acknowledgments' && (
                <button
                  className={`mono ${styles.tabToggle}`}
                  data-included={included ? '' : undefined}
                  onClick={() => toggleInclude(key)}
                  type="button"
                  title={included ? 'Remove from book' : 'Add to book'}
                >
                  {included ? '✓' : '+'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className={styles.body}>

        {/* Editor panel */}
        <div className={styles.editorPanel}>
          <div className={`mono ${styles.editorHead}`}>
            EDITING · BACK MATTER · {BLOCK_LABELS[sel].toUpperCase()}
          </div>

          {/* ── Acknowledgments ──────────────────────── */}
          {sel === 'acknowledgments' && (() => {
            const f = state.blocks['acknowledgments'].fields;
            return (
              <div className={styles.editor}>
                <div className={`serif ${styles.blockIntro}`}>
                  A page where you say thank you.
                </div>
                <div className={styles.toneRow}>
                  <span className={`mono ${styles.fieldLabel}`}>TONE</span>
                  <div className={styles.toneGroup}>
                    {ACK_TONES.map(t => (
                      <button
                        key={t.key}
                        className={`mono ${styles.toneBtn}`}
                        data-active={f.tone === t.key ? '' : undefined}
                        onClick={() => patchBlock('acknowledgments', { tone: t.key })}
                        type="button"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <span className={`mono ${styles.signOffLabel}`}>SIGN-OFF</span>
                  <input
                    className={`mono ${styles.signOffInput}`}
                    value={f.signOff}
                    onChange={e => patchBlock('acknowledgments', { signOff: e.target.value })}
                    placeholder="— Your name"
                  />
                </div>
                <textarea
                  className={`serif ${styles.blockTextarea}`}
                  value={f.text}
                  onChange={e => patchBlock('acknowledgments', { text: e.target.value })}
                  placeholder="Write your acknowledgments here…"
                  rows={12}
                />
                <div className={styles.textareaFoot}>
                  <div className={styles.actionRow}>
                    <button className={`mono ${styles.actionBtn}`} type="button" disabled title="Coming soon">
                      Use a template
                    </button>
                    <button className={`mono ${styles.actionBtn}`} type="button" disabled title="Coming soon">
                      Suggest from my notes
                    </button>
                    <button
                      className={`mono ${styles.actionBtn}`}
                      type="button"
                      onClick={() => patchBlock('acknowledgments', { text: '' })}
                    >
                      Clear
                    </button>
                  </div>
                  <span className={`mono ${styles.wordCount}`}>
                    {wordCount(f.text)} words · saves automatically
                  </span>
                </div>
              </div>
            );
          })()}

          {/* ── About the author ─────────────────────── */}
          {sel === 'about-author' && (() => {
            const f = state.blocks['about-author'].fields;
            return (
              <div className={styles.editor}>
                <div className={`serif ${styles.blockIntro}`}>
                  A short paragraph about you — the person behind the book.
                </div>
                <textarea
                  className={`serif ${styles.blockTextarea}`}
                  value={f.text}
                  onChange={e => patchBlock('about-author', { text: e.target.value })}
                  placeholder="Write a short bio here…"
                  rows={8}
                />
                <div className={styles.textareaFoot}>
                  <span className={`mono ${styles.syncNote}`}>
                    {profile?.bio
                      ? `Pre-filled from your profile · ${syncAge(profile.syncedAt)}`
                      : 'No bio in your profile — add one via Edit profile ↗'}
                  </span>
                  <span className={`mono ${styles.wordCount}`}>
                    {wordCount(f.text)} words · saves automatically
                  </span>
                </div>
              </div>
            );
          })()}

          {/* ── Also by ──────────────────────────────── */}
          {sel === 'also-by' && (
            <div className={styles.editor}>
              <div className={`serif ${styles.blockIntro}`}>
                Your other titles, auto-filled from your profile.
              </div>
              {profile && profile.otherTitles.length > 0 ? (
                <ul className={styles.alsoByList}>
                  {profile.otherTitles.map(t => (
                    <li key={t.id} className={styles.alsoByItem}>
                      <span className={`serif ${styles.alsoByTitle}`}>{t.title}</span>
                      <span className={`mono ${styles.alsoByAuto}`}>AUTO</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mono ${styles.alsoByEmpty}`}>
                  No other titles in your profile yet.
                  Add them via <a href="/author-profile" className={styles.profileLink}>Edit profile ↗</a>
                </p>
              )}
              <p className={`mono ${styles.convention}`}>
                This list updates automatically when you add titles to your profile.
                To edit, go to <a href="/author-profile" className={styles.profileLink}>your profile ↗</a>
              </p>
            </div>
          )}

          {/* ── Newsletter CTA ───────────────────────── */}
          {sel === 'newsletter-cta' && (() => {
            const f = state.blocks['newsletter-cta'].fields;
            return (
              <div className={styles.editor}>
                <div className={`serif ${styles.blockIntro}`}>
                  An optional call-to-action to join your mailing list.
                </div>
                <div className={styles.editorRow}>
                  <label className={`mono ${styles.fieldLabel}`}>SIGN-UP URL</label>
                  <input
                    className={`mono ${styles.fieldInput}`}
                    value={f.url}
                    onChange={e => patchBlock('newsletter-cta', { url: e.target.value })}
                    placeholder="https://your-list.com/subscribe"
                  />
                </div>
                <div className={styles.editorRow}>
                  <label className={`mono ${styles.fieldLabel}`}>CALLOUT TEXT</label>
                  <textarea
                    className={`serif ${styles.blockTextarea}`}
                    value={f.callout}
                    onChange={e => patchBlock('newsletter-cta', { callout: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className={styles.textareaFoot}>
                  <span className={`mono ${styles.wordCount}`}>
                    {wordCount(f.callout)} words · saves automatically
                  </span>
                </div>
              </div>
            );
          })()}

          {/* ── Colophon ─────────────────────────────── */}
          {sel === 'colophon' && (() => {
            const f = state.blocks['colophon'].fields;
            return (
              <div className={styles.editor}>
                <div className={`serif ${styles.blockIntro}`}>
                  A brief note on production — auto-generated, editable.
                </div>
                <textarea
                  className={`serif ${styles.blockTextarea}`}
                  value={f.text}
                  onChange={e => patchBlock('colophon', { text: e.target.value })}
                  rows={6}
                />
                <div className={styles.textareaFoot}>
                  <span className={`mono ${styles.wordCount}`}>
                    {wordCount(f.text)} words · saves automatically
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className={styles.sidebar}>

          {/* Order in the book */}
          <div className={styles.sideSection}>
            <div className={`mono ${styles.sideSectionLabel}`}>ORDER IN THE BOOK</div>
            <div className={styles.orderList}>
              <div className={`mono ${styles.orderRowAnchor}`}>↩ Body — last chapter ends</div>
              {BLOCK_ORDER.map(key => {
                const b        = state.blocks[key] as { included: boolean };
                const included = b.included !== false;
                return (
                  <div
                    key={key}
                    className={`mono ${styles.orderRow}`}
                    data-included={included ? '' : undefined}
                    data-active={sel === key ? '' : undefined}
                    onClick={() => setBlock(key)}
                  >
                    <span className={styles.orderTag}>BM</span>
                    <span className={styles.orderLabel}>{BLOCK_LABELS[key]}</span>
                    {!included && <span className={styles.orderOff}>OFF</span>}
                  </div>
                );
              })}
            </div>
            <div className={`mono ${styles.orderSummary}`}>
              {onCount} ON · {offCount} OFF · ~{pageEst} PAGES
            </div>
          </div>

          {/* From your profile */}
          <div className={styles.sideSection}>
            <div className={`mono ${styles.sideSectionLabel}`}>FROM YOUR PROFILE</div>
            <div className={styles.profileRows}>
              <div className={styles.profileRow}>
                <span className={`mono ${styles.profileKey}`}>BIO</span>
                <span className={`mono ${styles.profileVal}`}>
                  {profile?.bio
                    ? `${bioWords} words · ${syncAge(profile.syncedAt)}`
                    : 'Not set'}
                </span>
              </div>
              <div className={styles.profileRow}>
                <span className={`mono ${styles.profileKey}`}>TITLES</span>
                <span className={`mono ${styles.profileVal}`}>
                  {titleCount > 0 ? `${titleCount} also-by · auto` : 'None'}
                </span>
              </div>
              <div className={styles.profileRow}>
                <span className={`mono ${styles.profileKey}`}>HEADSHOT</span>
                <span className={`mono ${styles.profileVal}`}>
                  {hasHeadshot ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
            </div>
            <a href="/author-profile" className={`mono ${styles.editProfile}`}>
              Edit profile ↗
            </a>
          </div>

        </aside>
      </div>

      {/* ── Quote ─────────────────────────────────────────────── */}
      <p className={`serif ${styles.quote}`}>
        The acks are the page most readers actually read all the way through.
        Make them yours.
      </p>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button className={`mono ${styles.backBtn}`} onClick={onBack} type="button">
            ← Step 05 — Proof
          </button>
          <span className={`mono ${styles.footerNote}`}>
            {onCount} block{onCount !== 1 ? 's' : ''} on, {offCount} off.
            Total of about {pageEst} pages — readers expect this here.
          </span>
        </div>
        <div className={styles.footerRight}>
          <Btn tone="accent" onClick={onAdvance} icon={<span className={styles.btnIcon}>→</span>}>
            Step 07 — Cover · Press
          </Btn>
        </div>
      </div>
    </div>
  );
}
