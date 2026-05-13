import { useState, useEffect, useRef, useCallback } from 'react';
import { Btn } from '../../../shared/ui/atoms';
import { api } from '../../../lib/api';
import type {
  FormattingProjectRecord,
  FrontMatterState,
  BlockKey,
  AlsoByEntry,
} from '../types';
import styles from './FrontMatter.module.css';

// ── Constants ──────────────────────────────────────────────────────

const BLOCK_ORDER: BlockKey[] = [
  'title-page', 'copyright', 'dedication', 'epigraph', 'also-by',
];

const BLOCK_LABEL: Record<BlockKey, string> = {
  'title-page': 'Title page',
  'copyright':  'Copyright',
  'dedication': 'Dedication',
  'epigraph':   'Epigraph',
  'also-by':    'Also by',
};

const BLOCK_REQUIRED: Record<BlockKey, boolean> = {
  'title-page': true,
  'copyright':  true,
  'dedication': false,
  'epigraph':   false,
  'also-by':    false,
};

const ORDER_NUM: Record<BlockKey, number> = {
  'title-page': 1,
  'copyright':  2,
  'dedication': 3,
  'epigraph':   4,
  'also-by':    5,
};

// ── Props ──────────────────────────────────────────────────────────

interface Props {
  project:              FormattingProjectRecord | null;
  state:                FrontMatterState;
  onStateChange:        (s: FrontMatterState) => void;
  onBack:               () => void;
  onAdvance:            () => void;
}

// ── Save indicator ─────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ── Block editors ──────────────────────────────────────────────────

function TitlePageEditor({
  fields,
  onChange,
}: {
  fields: FrontMatterState['blocks']['title-page']['fields'];
  onChange: (patch: Partial<typeof fields>) => void;
}) {
  return (
    <div className={styles.editor}>
      <div className={styles.editorRow}>
        <label className={`mono ${styles.fieldLabel}`}>TITLE</label>
        <input
          className={styles.fieldInput}
          value={fields.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="Book title"
        />
      </div>
      <div className={styles.editorRow}>
        <label className={`mono ${styles.fieldLabel}`}>AUTHOR</label>
        <input
          className={styles.fieldInput}
          value={fields.author}
          onChange={e => onChange({ author: e.target.value })}
          placeholder="Author name"
        />
      </div>
      <div className={styles.editorRow}>
        <label className={`mono ${styles.fieldLabel}`}>YEAR</label>
        <input
          className={styles.fieldInput}
          value={fields.year}
          onChange={e => onChange({ year: e.target.value })}
          maxLength={4}
          style={{ width: '80px' }}
        />
      </div>
      <div className={styles.editorRow}>
        <label className={`mono ${styles.fieldLabel}`}>SUBTITLE</label>
        <input
          className={styles.fieldInput}
          value={fields.subtitle}
          onChange={e => onChange({ subtitle: e.target.value })}
          placeholder="Optional"
        />
      </div>
    </div>
  );
}

function CopyrightEditor({
  fields,
  onChange,
}: {
  fields: FrontMatterState['blocks']['copyright']['fields'];
  onChange: (patch: Partial<typeof fields>) => void;
}) {
  const words = fields.text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className={styles.editor}>
      <textarea
        className={styles.blockTextarea}
        value={fields.text}
        onChange={e => onChange({ text: e.target.value })}
        rows={10}
      />
      <div className={`mono ${styles.textareaFoot}`}>
        <span>{words} words · saved automatically</span>
      </div>
    </div>
  );
}

function DedicationEditor({
  fields,
  onChange,
}: {
  fields: FrontMatterState['blocks']['dedication']['fields'];
  onChange: (patch: Partial<typeof fields>) => void;
}) {
  const words = fields.text.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className={styles.editor}>
      <p className={`mono ${styles.convention}`}>
        One sentence is the convention. Centred. No quotation marks unless quoting someone else.
      </p>
      <textarea
        className={styles.blockTextarea}
        value={fields.text}
        onChange={e => onChange({ text: e.target.value })}
        rows={5}
        placeholder="For …"
      />
      <div className={`mono ${styles.textareaFoot}`}>
        <span>{fields.text ? `${words} words · saved automatically` : 'saved automatically'}</span>
      </div>
    </div>
  );
}

function EpigraphEditor({
  fields,
  onChange,
}: {
  fields: FrontMatterState['blocks']['epigraph']['fields'];
  onChange: (patch: Partial<typeof fields>) => void;
}) {
  return (
    <div className={styles.editor}>
      <p className={`mono ${styles.convention}`}>
        One sentence is the convention. Centred. No quotation marks unless quoting someone else.
      </p>
      <div className={styles.editorRow}>
        <label className={`mono ${styles.fieldLabel}`}>QUOTE</label>
        <textarea
          className={styles.blockTextarea}
          value={fields.quote}
          onChange={e => onChange({ quote: e.target.value })}
          rows={4}
          placeholder="The quote…"
        />
      </div>
      <div className={styles.editorRow}>
        <label className={`mono ${styles.fieldLabel}`}>ATTRIBUTION</label>
        <input
          className={styles.fieldInput}
          value={fields.attribution}
          onChange={e => onChange({ attribution: e.target.value })}
          placeholder="— Author, Title"
        />
      </div>
    </div>
  );
}

function AlsoByEditor({
  fields,
  onChange,
}: {
  fields: FrontMatterState['blocks']['also-by']['fields'];
  onChange: (patch: Partial<typeof fields>) => void;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newYear,  setNewYear]  = useState('');

  function addEntry() {
    if (!newTitle.trim()) return;
    const entry: AlsoByEntry = {
      id:    crypto.randomUUID(),
      title: newTitle.trim(),
      year:  newYear.trim(),
    };
    onChange({ entries: [...fields.entries, entry] });
    setNewTitle('');
    setNewYear('');
  }

  function removeEntry(id: string) {
    onChange({ entries: fields.entries.filter(e => e.id !== id) });
  }

  return (
    <div className={styles.editor}>
      <div className={styles.alsoByList}>
        {fields.entries.length === 0 && (
          <p className={`mono ${styles.alsoByEmpty}`}>No titles added yet.</p>
        )}
        {fields.entries.map((entry, i) => (
          <div key={entry.id} className={styles.alsoByRow}>
            <span className={`mono ${styles.alsoByNum}`}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.alsoByTitle}>{entry.title}</span>
            {entry.year && <span className={`mono ${styles.alsoByYear}`}>{entry.year}</span>}
            <button
              className={`mono ${styles.alsoByRemove}`}
              onClick={() => removeEntry(entry.id)}
              aria-label={`Remove ${entry.title}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className={styles.alsoByAdd}>
        <input
          className={styles.fieldInput}
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Title"
          onKeyDown={e => e.key === 'Enter' && addEntry()}
          style={{ flex: 1 }}
        />
        <input
          className={styles.fieldInput}
          value={newYear}
          onChange={e => setNewYear(e.target.value)}
          placeholder="Year"
          maxLength={4}
          style={{ width: '72px' }}
          onKeyDown={e => e.key === 'Enter' && addEntry()}
        />
        <button className={`mono ${styles.alsoByAddBtn}`} onClick={addEntry}>
          + Add
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function FrontMatter({ project, state, onStateChange, onBack, onAdvance }: Props) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestState = useRef(state);
  latestState.current = state;

  // Debounced autosave
  const scheduleSave = useCallback(() => {
    if (!project) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        await api.patch(`/api/formatter/${project.id}`, {
          frontMatter: JSON.stringify(latestState.current),
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    }, 600);
  }, [project]);

  // Trigger save whenever state changes (skip on first mount)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    scheduleSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const { selectedBlock, blocks } = state;

  function setBlock(key: BlockKey) {
    onStateChange({ ...state, selectedBlock: key });
  }

  function toggleBlock(key: BlockKey) {
    if (BLOCK_REQUIRED[key]) return;
    onStateChange({
      ...state,
      blocks: {
        ...state.blocks,
        [key]: { ...state.blocks[key], included: !state.blocks[key].included },
      },
    });
  }

  function patchFields(key: BlockKey, patch: Record<string, unknown>) {
    onStateChange({
      ...state,
      blocks: {
        ...state.blocks,
        [key]: {
          ...state.blocks[key],
          fields: { ...state.blocks[key].fields, ...patch },
        },
      },
    });
  }

  const includedCount = BLOCK_ORDER.filter(k => blocks[k].included).length;

  return (
    <div className={styles.wrap}>

      {/* ── Heading ───────────────────────────────────────────── */}
      <div className={styles.headingRow}>
        <h1 className={`serif ${styles.heading}`}>
          Your book starts before Chapter One.
        </h1>
      </div>

      {/* ── Intro bar ─────────────────────────────────────────── */}
      <div className={styles.introBar}>
        <p className={`mono ${styles.introText}`}>
          WE'VE DRAFTED THE TITLE PAGE AND COPYRIGHT FROM YOUR MANUSCRIPT.
          TURN THE OPTIONAL BLOCKS ON IF YOU WANT THEM.
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
          const required = BLOCK_REQUIRED[key];
          const included = blocks[key].included;
          const active   = selectedBlock === key;
          return (
            <div key={key} className={styles.tabGroup}>
              <button
                className={styles.tab}
                data-active={active ? '' : undefined}
                data-included={included ? '' : undefined}
                onClick={() => setBlock(key)}
              >
                <span className={`mono ${styles.tabLabel}`}>{BLOCK_LABEL[key].toUpperCase()}</span>
                <span className={`mono ${styles.tabBadge}`} data-req={required ? '' : undefined}>
                  {required ? 'REQ' : included ? 'INCL' : ''}
                </span>
              </button>
              {!required && (
                <button
                  className={`mono ${styles.tabToggle}`}
                  data-included={included ? '' : undefined}
                  onClick={() => toggleBlock(key)}
                  aria-label={`${included ? 'Exclude' : 'Include'} ${BLOCK_LABEL[key]}`}
                >
                  {included ? '■' : '□'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Body: editor + info sidebar ───────────────────────── */}
      <div className={styles.body}>

        {/* ── Editor panel ────────────────────────────────────── */}
        <div className={styles.editorPanel}>
          <div className={`mono ${styles.editorHead}`}>
            EDITING · FRONT MATTER · {BLOCK_LABEL[selectedBlock].toUpperCase()}
          </div>

          {selectedBlock === 'title-page' && (
            <TitlePageEditor
              fields={blocks['title-page'].fields}
              onChange={p => patchFields('title-page', p as Record<string, unknown>)}
            />
          )}
          {selectedBlock === 'copyright' && (
            <CopyrightEditor
              fields={blocks['copyright'].fields}
              onChange={p => patchFields('copyright', p as Record<string, unknown>)}
            />
          )}
          {selectedBlock === 'dedication' && (
            <DedicationEditor
              fields={blocks['dedication'].fields}
              onChange={p => patchFields('dedication', p as Record<string, unknown>)}
            />
          )}
          {selectedBlock === 'epigraph' && (
            <EpigraphEditor
              fields={blocks['epigraph'].fields}
              onChange={p => patchFields('epigraph', p as Record<string, unknown>)}
            />
          )}
          {selectedBlock === 'also-by' && (
            <AlsoByEditor
              fields={blocks['also-by'].fields}
              onChange={p => patchFields('also-by', p as Record<string, unknown>)}
            />
          )}
        </div>

        {/* ── Info sidebar ────────────────────────────────────── */}
        <aside className={styles.infoSidebar}>
          <div className={styles.infoSection}>
            <div className={`mono ${styles.infoSectionLabel}`}>WE PRE-FILLED WHAT WE KNOW</div>
            <div className={styles.infoRow}>
              <span className={`mono ${styles.infoKey}`}>AUTHOR</span>
              <span className={styles.infoVal}>{blocks['title-page'].fields.author}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={`mono ${styles.infoKey}`}>YEAR</span>
              <span className={styles.infoVal}>{blocks['title-page'].fields.year}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={`mono ${styles.infoKey}`}>TITLE</span>
              <span className={styles.infoVal} title={blocks['title-page'].fields.title}>
                {blocks['title-page'].fields.title.length > 28
                  ? blocks['title-page'].fields.title.slice(0, 28) + '…'
                  : blocks['title-page'].fields.title}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={`mono ${styles.infoKey}`}>ALSO BY</span>
              <span className={`mono ${styles.infoVal}`}>
                {blocks['also-by'].fields.entries.length} titles · manual
              </span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={`mono ${styles.infoSectionLabel}`}>ORDER IN THE BOOK</div>
            {BLOCK_ORDER.map((key) => {
              const required = BLOCK_REQUIRED[key];
              const included = blocks[key].included;
              if (!included) return null;
              return (
                <div key={key} className={styles.orderRow} data-active={selectedBlock === key ? '' : undefined}>
                  <span className={`mono ${styles.orderNum}`}>{String(ORDER_NUM[key]).padStart(2, '0')}</span>
                  <span className={styles.orderLabel}>{BLOCK_LABEL[key]}</span>
                  <span className={`mono ${styles.orderBadge}`} data-req={required ? '' : undefined}>
                    {required ? 'REQ' : 'INCL'}
                  </span>
                </div>
              );
            })}
            <p className={`mono ${styles.copyrightNote}`}>
              We won't let you ship without a copyright page. Real books have them.
            </p>
          </div>
        </aside>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button className={`mono ${styles.backBtn}`} onClick={onBack} type="button">
            ← Step 02 — Mark up
          </button>
          <span className={`mono ${styles.footerNote}`}>
            Required blocks (title, copyright) can be edited but not removed.
          </span>
        </div>
        <div className={styles.footerRight}>
          <span className={`mono ${styles.footerCount}`}>{includedCount} blocks included</span>
          <Btn tone="accent" onClick={onAdvance} icon={<span className={styles.btnIcon}>→</span>}>
            Step 04 — Set the type
          </Btn>
        </div>
      </div>
    </div>
  );
}
