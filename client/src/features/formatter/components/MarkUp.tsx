import { useState, useRef, useEffect } from 'react';
import { Btn } from '../../../shared/ui/atoms';
import type {
  DetectedItem,
  ItemType,
  ConfidenceThreshold,
  FormattingProjectRecord,
} from '../types';
import styles from './MarkUp.module.css';

/* ── Constants ────────────────────────────────────────────────────── */

const THRESHOLD_MAP: Record<ConfidenceThreshold, number> = {
  strict:   0.95,
  standard: 0.85,
  loose:    0.70,
};

type FilterKey = 'all' | 'low-conf' | 'front' | 'body' | 'back';

/* ── Helpers ──────────────────────────────────────────────────────── */

function pct(n: number) { return `${Math.round(n * 100)}%`; }

function subtypeLabel(item: DetectedItem): string {
  const map: Record<string, string> = {
    'title-page':      'TITLE PAGE',
    copyright:         'COPYRIGHT',
    dedication:        'DEDICATION',
    epigraph:          'EPIGRAPH',
    chapter:           'CHAPTER',
    part:              'PART',
    'scene-break':     'SCENE BREAK',
    'about-author':    'ABOUT THE AUTHOR',
    acknowledgments:   'ACKNOWLEDGMENTS',
    'also-by':         'ALSO BY',
  };
  return map[item.subtype] ?? item.subtype.toUpperCase();
}

/* ── Props ────────────────────────────────────────────────────────── */

interface Props {
  project:        FormattingProjectRecord | null;
  items:          DetectedItem[];
  onItemsChange:  (items: DetectedItem[]) => void;
  onBack:         () => void;
  onAdvance:      () => void;
}

/* ── Component ────────────────────────────────────────────────────── */

export default function MarkUp({ items, onItemsChange, onBack, onAdvance }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter,     setFilter]     = useState<FilterKey>('all');
  const [threshold,  setThreshold]  = useState<ConfidenceThreshold>('standard');
  const [renaming,   setRenaming]   = useState(false);
  const [renameVal,  setRenameVal]  = useState('');
  const [splitting,  setSplitting]  = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  const threshNum = THRESHOLD_MAP[threshold];

  /* Derived lists */
  const visibleItems = items.filter(item => {
    if (item.isHidden) return false;
    switch (filter) {
      case 'low-conf': return item.confidence < threshNum;
      case 'front':    return item.type === 'front';
      case 'body':     return item.type === 'body';
      case 'back':     return item.type === 'back';
      default:         return true;
    }
  });

  const selectedItem = items.find(i => i.id === selectedId) ?? null;
  const selectedIdx  = items.findIndex(i => i.id === selectedId);
  const visIdx       = visibleItems.findIndex(i => i.id === selectedId);

  /* Tab counts */
  const allCount      = items.filter(i => !i.isHidden).length;
  const lowConfCount  = items.filter(i => !i.isHidden && i.confidence < threshNum).length;
  const frontCount    = items.filter(i => !i.isHidden && i.type === 'front').length;
  const bodyCount     = items.filter(i => !i.isHidden && i.type === 'body').length;
  const backCount     = items.filter(i => !i.isHidden && i.type === 'back').length;

  /* Status bar */
  const chapterCount = items.filter(i => !i.isHidden && i.subtype === 'chapter').length;
  const partCount    = items.filter(i => !i.isHidden && i.subtype === 'part').length;
  const totalWords   = items.filter(i => !i.isHidden).reduce((s, i) => s + i.wordCount, 0);
  const flaggedCount = items.filter(i => !i.isHidden && i.confidence < threshNum).length;

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  /* ── Operations ─────────────────────────────────────────────────── */

  function reindex(arr: DetectedItem[]): DetectedItem[] {
    return arr.map((item, i) => ({ ...item, index: i + 1 }));
  }

  function patch(id: string, delta: Partial<DetectedItem>) {
    onItemsChange(items.map(i => i.id === id ? { ...i, ...delta } : i));
  }

  function startRename() {
    if (!selectedItem) return;
    setRenameVal(selectedItem.title);
    setRenaming(true);
  }

  function commitRename() {
    if (selectedId && renameVal.trim()) patch(selectedId, { title: renameVal.trim() });
    setRenaming(false);
  }

  function setItemType(id: string, type: ItemType) { patch(id, { type }); }

  function toggleHide(id: string) {
    const item = items.find(i => i.id === id);
    if (item) patch(id, { isHidden: !item.isHidden });
  }

  function promoteDemote(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    patch(id, { subtype: item.subtype === 'chapter' ? 'part' : 'chapter' });
  }

  function moveUp(id: string) {
    const idx = items.findIndex(i => i.id === id);
    if (idx <= 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onItemsChange(reindex(next));
  }

  function moveDown(id: string) {
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0 || idx >= items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onItemsChange(reindex(next));
  }

  function mergeWithPrevious(id: string) {
    const idx = items.findIndex(i => i.id === id);
    if (idx <= 0) return;
    const prev = items[idx - 1];
    const curr = items[idx];
    const merged: DetectedItem = {
      ...prev,
      wordCount:  prev.wordCount + curr.wordCount,
      confidence: Math.max(prev.confidence, curr.confidence),
      flag:       undefined,
    };
    const next = [...items.slice(0, idx - 1), merged, ...items.slice(idx + 1)];
    onItemsChange(reindex(next));
    setSelectedId(merged.id);
  }

  function confirmItem(id: string) {
    patch(id, { flag: undefined, confidence: 0.95 });
  }

  function splitItem(id: string) {
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    const item = items[idx];
    const half = Math.round(item.wordCount / 2);
    const a: DetectedItem = { ...item, wordCount: half, flag: undefined, confidence: 0.92 };
    const b: DetectedItem = {
      id:         `${item.id}-b`,
      index:      0,
      type:       item.type,
      subtype:    item.subtype,
      title:      `${item.title} (cont.)`,
      snippet:    '',
      wordCount:  item.wordCount - half,
      confidence: 0.92,
    };
    const next = [...items.slice(0, idx), a, b, ...items.slice(idx + 1)];
    onItemsChange(reindex(next));
    setSplitting(false);
  }

  /* ── Row rendering ───────────────────────────────────────────────── */

  function chapterNumber(item: DetectedItem): number {
    return items.filter(i => i.subtype === 'chapter' && i.index <= item.index).length;
  }

  function rowPrefix(item: DetectedItem): string {
    if (item.subtype === 'part')    return 'PART';
    if (item.type   === 'front')    return `→${item.index}`;
    if (item.type   === 'back')     return `→${item.index}`;
    return `Ch ${String(chapterNumber(item)).padStart(2, '0')}`;
  }

  function renderRow(item: DetectedItem) {
    const isFlagged  = item.confidence < threshNum;
    const isSelected = item.id === selectedId;

    return (
      <button
        key={item.id}
        className={styles.outlineRow}
        data-selected={isSelected ? '' : undefined}
        data-flagged={isFlagged ? '' : undefined}
        data-part={item.subtype === 'part' ? '' : undefined}
        data-hidden={item.isHidden ? '' : undefined}
        onClick={() => setSelectedId(isSelected ? null : item.id)}
        type="button"
      >
        <span className={`mono ${styles.rowPrefix}`}>{rowPrefix(item)}</span>

        <span className={`${item.subtype === 'part' ? 'serif' : ''} ${styles.rowTitle}`}>
          {item.title}
        </span>

        <span className={styles.rowRight}>
          {item.wordCount > 0 && (
            <span className={`mono ${styles.rowWords}`}>
              {item.wordCount.toLocaleString()}W
            </span>
          )}
          {isFlagged && (
            <span className={`mono ${styles.rowConf}`}>{pct(item.confidence)}</span>
          )}
          {item.isRequired && (
            <span className={`mono ${styles.rowBadge} ${styles.badgeRequired}`}>REQUIRED</span>
          )}
          {item.isAutoGenerated && !item.isRequired && (
            <span className={`mono ${styles.rowBadge} ${styles.badgeAuto}`}>AUTO</span>
          )}
        </span>
      </button>
    );
  }

  /* ── Detail panel ────────────────────────────────────────────────── */

  function renderDetail() {
    if (!selectedItem) {
      return (
        <div className={styles.detailEmpty}>
          <p className={`mono ${styles.detailEmptyText}`}>Select an item to review or edit it.</p>
        </div>
      );
    }

    const isFlagged = selectedItem.confidence < threshNum;
    const isFirst   = selectedIdx === 0;
    const isLast    = selectedIdx === items.length - 1;
    const prevItem  = selectedIdx > 0 ? items[selectedIdx - 1] : null;
    const chNum     = chapterNumber(selectedItem);

    return (
      <div className={styles.detailContent}>

        {/* Title */}
        <div className={styles.detailHeader}>
          {renaming ? (
            <input
              ref={renameRef}
              className={`serif ${styles.renameInput}`}
              value={renameVal}
              onChange={e => setRenameVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter')  commitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
            />
          ) : (
            <button
              className={`serif ${styles.detailTitle}`}
              onClick={startRename}
              title="Click to rename"
              type="button"
            >
              {selectedItem.title}
            </button>
          )}

          <div className={styles.detailMeta}>
            <span className={`mono ${styles.metaBadge}`} data-type={selectedItem.type}>
              {selectedItem.type.toUpperCase()}
            </span>
            {selectedItem.wordCount > 0 && (
              <span className={`mono ${styles.metaBadge}`}>
                {selectedItem.wordCount.toLocaleString()} WORDS
              </span>
            )}
            <span className={`mono ${styles.metaBadge}`}>{subtypeLabel(selectedItem)}</span>
          </div>
        </div>

        {/* Snippet */}
        {selectedItem.snippet && (
          <p className={`serif ${styles.detailSnippet}`}>"{selectedItem.snippet}"</p>
        )}

        {/* Flag */}
        {isFlagged && selectedItem.flag && (
          <div className={styles.detailFlag}>
            <span className={`mono ${styles.flagLabel}`}>⚑ FLAGGED · {pct(selectedItem.confidence)} CONFIDENCE</span>
            <p className={`sans ${styles.flagNote}`}>{selectedItem.flag}</p>
          </div>
        )}

        <hr className={styles.detailRule} />

        {/* Primary actions for flagged items */}
        {isFlagged && (
          <div className={styles.primaryActions}>
            <button
              className={`mono ${styles.actionConfirm}`}
              onClick={() => confirmItem(selectedItem.id)}
              type="button"
            >
              Confirm as Chapter {chNum} ✓
            </button>
            {prevItem && (
              <button
                className={`mono ${styles.actionMerge}`}
                onClick={() => mergeWithPrevious(selectedItem.id)}
                type="button"
              >
                Merge into "{prevItem.title.length > 24 ? prevItem.title.slice(0, 24) + '…' : prevItem.title}" ↑
              </button>
            )}
          </div>
        )}

        {/* All operations */}
        <div className={styles.opsSection}>
          <span className={`mono ${styles.opsLabel}`}>OPERATIONS</span>
          <div className={styles.opGrid}>
            <button className={`mono ${styles.opBtn}`} onClick={startRename} type="button">
              Rename
            </button>
            {!selectedItem.isRequired && (
              <button className={`mono ${styles.opBtn}`} onClick={() => toggleHide(selectedItem.id)} type="button">
                {selectedItem.isHidden ? 'Unhide' : 'Hide'}
              </button>
            )}
            {(selectedItem.subtype === 'chapter' || selectedItem.subtype === 'part') && (
              <button className={`mono ${styles.opBtn}`} onClick={() => promoteDemote(selectedItem.id)} type="button">
                {selectedItem.subtype === 'chapter' ? 'Promote to Part' : 'Demote to Chapter'}
              </button>
            )}
            {selectedItem.type !== 'front' && (
              <button className={`mono ${styles.opBtn}`} onClick={() => setItemType(selectedItem.id, 'front')} type="button">Mark front</button>
            )}
            {selectedItem.type !== 'body' && (
              <button className={`mono ${styles.opBtn}`} onClick={() => setItemType(selectedItem.id, 'body')} type="button">Mark body</button>
            )}
            {selectedItem.type !== 'back' && (
              <button className={`mono ${styles.opBtn}`} onClick={() => setItemType(selectedItem.id, 'back')} type="button">Mark back</button>
            )}
            {!isFirst && (
              <button className={`mono ${styles.opBtn}`} onClick={() => moveUp(selectedItem.id)} type="button">Move up ↑</button>
            )}
            {!isLast && (
              <button className={`mono ${styles.opBtn}`} onClick={() => moveDown(selectedItem.id)} type="button">Move down ↓</button>
            )}
            {!isFirst && (
              <button className={`mono ${styles.opBtn}`} onClick={() => mergeWithPrevious(selectedItem.id)} type="button">Merge ↑</button>
            )}
            {selectedItem.wordCount > 500 && (
              <button className={`mono ${styles.opBtn}`} onClick={() => setSplitting(true)} type="button">Split…</button>
            )}
          </div>
        </div>

        {/* Item navigation */}
        <div className={styles.detailNav}>
          <button
            className={`mono ${styles.navBtn}`}
            disabled={visIdx <= 0}
            onClick={() => setSelectedId(visibleItems[visIdx - 1]?.id ?? null)}
            type="button"
          >↑</button>
          <span className={`mono ${styles.navPos}`}>{visIdx + 1} of {visibleItems.length}</span>
          <button
            className={`mono ${styles.navBtn}`}
            disabled={visIdx >= visibleItems.length - 1}
            onClick={() => setSelectedId(visibleItems[visIdx + 1]?.id ?? null)}
            type="button"
          >↓</button>
        </div>
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  const FILTERS: [FilterKey, string][] = [
    ['all',      `All · ${allCount}`],
    ['low-conf', `Low conf · ${lowConfCount}`],
    ['front',    `Front · ${frontCount}`],
    ['body',     `Body · ${bodyCount}`],
    ['back',     `Back · ${backCount}`],
  ];

  const THRESHOLDS: [ConfidenceThreshold, string][] = [
    ['strict',   'Strict: 95%'],
    ['standard', 'Standard: 85%'],
    ['loose',    'Loose: 70%'],
  ];

  return (
    <div className={styles.root}>

      {/* Heading */}
      <div className={styles.headingRow}>
        <h1 className={`serif ${styles.heading}`}>
          Confirm what we found before we change anything.
        </h1>
      </div>

      {/* Controls bar */}
      <div className={styles.controls}>

        {/* Filter tabs */}
        <div className={styles.filterSection}>
          <span className={`mono ${styles.ctrlLabel}`}>FILTER</span>
          <div className={styles.filterTabs}>
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                className={`mono ${styles.filterTab}`}
                data-active={filter === key ? '' : undefined}
                data-alert={key === 'low-conf' && lowConfCount > 0 ? '' : undefined}
                onClick={() => setFilter(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.rightControls}>

          {/* View (Outline only active) */}
          <div className={styles.ctrlGroup}>
            <span className={`mono ${styles.ctrlLabel}`}>VIEW</span>
            <div className={styles.pillRow}>
              {(['Outline', 'List', 'Tree'] as const).map(v => (
                <button
                  key={v}
                  className={`mono ${styles.togglePill}`}
                  data-active={v === 'Outline' ? '' : undefined}
                  disabled={v !== 'Outline'}
                  type="button"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Detection threshold */}
          <div className={styles.ctrlGroup}>
            <span className={`mono ${styles.ctrlLabel}`}>DETECTION</span>
            <div className={styles.pillRow}>
              {THRESHOLDS.map(([key, label]) => (
                <button
                  key={key}
                  className={`mono ${styles.togglePill}`}
                  data-active={threshold === key ? '' : undefined}
                  onClick={() => setThreshold(key)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk actions */}
          <div className={styles.ctrlGroup}>
            <span className={`mono ${styles.ctrlLabel}`}>BULK</span>
            <div className={styles.bulkRow}>
              <button className={`mono ${styles.bulkBtn}`} disabled={!selectedId} type="button"
                onClick={() => selectedId && setItemType(selectedId, 'front')}>Mark front</button>
              <button className={`mono ${styles.bulkBtn}`} disabled={!selectedId} type="button"
                onClick={() => selectedId && setItemType(selectedId, 'back')}>Mark back</button>
              <button className={`mono ${styles.bulkBtn}`} disabled={!selectedId} type="button"
                onClick={() => selectedId && toggleHide(selectedId)}>Hide</button>
              <button className={`mono ${styles.bulkBtn}`} disabled={!selectedId || selectedIdx <= 0} type="button"
                onClick={() => selectedId && mergeWithPrevious(selectedId)}>Merge ↑</button>
              <button className={`mono ${styles.bulkBtn}`} disabled={!selectedId} type="button"
                onClick={() => setSplitting(true)}>Split…</button>
            </div>
          </div>

        </div>
      </div>

      <hr className="rule" />

      {/* Split pane */}
      <div className={styles.splitPane}>

        {/* Outline list */}
        <div className={styles.outlineList} data-testid="outline-list">
          {visibleItems.length === 0 ? (
            <div className={styles.emptyList}>
              <span className={`mono ${styles.emptyListText}`}>No items match this filter.</span>
            </div>
          ) : (
            visibleItems.map(item => renderRow(item))
          )}
        </div>

        {/* Detail panel */}
        <aside
          className={styles.detailPanel}
          data-testid="detail-panel"
          data-open={selectedId ? '' : undefined}
        >
          <button
            type="button"
            className={`mono ${styles.detailClose}`}
            onClick={() => setSelectedId(null)}
            aria-label="Close detail panel"
          >
            ✕ Close
          </button>
          {renderDetail()}
        </aside>

      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.statusBar}>
          {[
            `${allCount} ITEMS`,
            `${chapterCount} CHAPTERS`,
            `${partCount} PARTS`,
            `${totalWords.toLocaleString()} WORDS`,
            flaggedCount > 0 ? `${flaggedCount} FLAGGED` : null,
          ].filter(Boolean).map((stat, i) => (
            <span
              key={i}
              className={`mono ${styles.statItem}`}
              data-flagged={stat?.includes('FLAGGED') ? '' : undefined}
            >
              {stat}
            </span>
          ))}
        </div>
        <div className={styles.footerActions}>
          <button className={`mono ${styles.backBtn}`} onClick={onBack} type="button">
            ← Step 01 — Bring in
          </button>
          <Btn tone="accent" onClick={onAdvance} icon={<span className={styles.btnIcon}>→</span>}>
            Step 03 — Front matter
          </Btn>
        </div>
      </div>

      {/* Split confirmation modal */}
      {splitting && selectedItem && (
        <div
          className={styles.modalOverlay}
          onClick={e => { if (e.target === e.currentTarget) setSplitting(false); }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true">
            <p className={`mono ${styles.modalEyebrow}`}>SPLIT ITEM</p>
            <h2 className={`serif ${styles.modalTitle}`}>Split "{selectedItem.title}"?</h2>
            <p className={`sans ${styles.modalBody}`}>
              This splits the item at its midpoint into two parts
              ({Math.round(selectedItem.wordCount / 2).toLocaleString()} words each).
              You can rename both parts afterward.
            </p>
            <div className={styles.modalActions}>
              <button className={`mono ${styles.modalCancel}`} onClick={() => setSplitting(false)} type="button">
                Cancel
              </button>
              <button className={`mono ${styles.modalConfirm}`} onClick={() => splitItem(selectedItem.id)} type="button">
                Split here
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
