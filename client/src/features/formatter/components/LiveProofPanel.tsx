import { useState } from 'react';
import type { Device } from '../index';
import type { DetectedItem, FrontMatterState, BlockKey, SetTypeState, FontSize, BackMatterState, ProfileSnapshot, CoverPressState } from '../types';
import { THEME_DEFS, SCENE_BREAK_SYMBOLS, FONT_SIZE_SCALE } from '../types';
import styles from './LiveProofPanel.module.css';

interface Props {
  device:              Device;
  onDeviceChange:      (device: Device) => void;
  activeStep?:         number;
  structureItems?:     DetectedItem[];
  frontMatterState?:   FrontMatterState;
  typeSettingsState?:  SetTypeState;
  backMatterState?:    BackMatterState;
  coverPressState?:    CoverPressState;
  profile?:            ProfileSnapshot | null;
  fontSize?:           FontSize;
  jumpChapter?:        number;
  hideDeviceToggle?:   boolean;
}

const DEVICES: { id: Device; label: string }[] = [
  { id: 'paperwhite', label: 'Paperwhite' },
  { id: 'phone',      label: 'Phone' },
  { id: 'tablet',     label: '7″ tablet' },
];

/* Compute a running mock page number from accumulated word counts (~250 wpp) */
function buildPageMap(items: DetectedItem[]): Map<string, number> {
  const map = new Map<string, number>();
  let page = 7; // body starts after front matter pages
  for (const item of items) {
    if (item.isHidden) continue;
    if (item.type === 'front') {
      // front matter pages are roman, show 1-based index
      map.set(item.id, items.filter(i => i.type === 'front' && !i.isHidden).indexOf(item) + 1);
    } else {
      map.set(item.id, page);
      if (item.wordCount > 0) page += Math.max(1, Math.round(item.wordCount / 250));
    }
  }
  return map;
}

function TOCProof({ items }: { items: DetectedItem[] }) {
  const visible  = items.filter(i => !i.isHidden);
  const pageMap  = buildPageMap(visible);
  const chapters = visible.filter(i => i.subtype === 'chapter');

  return (
    <div className={styles.tocProof}>
      <div className={`mono ${styles.tocContents}`}>CONTENTS</div>
      <div className={styles.tocList}>
        {visible.map(item => {
          const page = pageMap.get(item.id);
          const isPart = item.subtype === 'part';
          const isFront = item.type === 'front';
          const isBack  = item.type === 'back';
          const chNum   = item.subtype === 'chapter'
            ? chapters.indexOf(item) + 1
            : null;

          return (
            <div
              key={item.id}
              className={styles.tocRow}
              data-part={isPart ? '' : undefined}
              data-front={isFront ? '' : undefined}
              data-back={isBack ? '' : undefined}
            >
              <span className={styles.tocTitle}>
                {chNum !== null ? `${chNum}. ` : ''}{item.title}
              </span>
              {page !== undefined && (
                <span className={styles.tocPage}>
                  {isFront ? toRoman(page) : page}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['m','cm','d','cd','c','xc','l','xl','x','ix','v','iv','i'];
  let out = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { out += syms[i]; n -= vals[i]; }
  }
  return out;
}

// ── Front matter proof ─────────────────────────────────────────────

const BLOCK_PAGE_LABEL: Record<BlockKey, string> = {
  'title-page': 'title page',
  'copyright':  'copyright page',
  'dedication': 'dedication',
  'epigraph':   'epigraph',
  'also-by':    'also by',
};

function FrontMatterProof({ state }: { state: FrontMatterState }) {
  const { selectedBlock, blocks } = state;
  const block = blocks[selectedBlock];

  // Compute roman numeral page for the selected block
  const includedOrder = (['title-page', 'copyright', 'dedication', 'epigraph', 'also-by'] as BlockKey[])
    .filter(k => blocks[k].included);
  const pageIdx = includedOrder.indexOf(selectedBlock) + 1;

  return (
    <div className={styles.fmProof}>
      {selectedBlock === 'title-page' && (
        <div className={styles.fmPage} data-block="title-page">
          {(block.fields as { subtitle?: string }).subtitle && (
            <div className={`mono ${styles.fmSubtitle}`}>{(block.fields as { subtitle: string }).subtitle}</div>
          )}
          <div className={`serif ${styles.fmTitle}`}>{(block.fields as { title: string }).title || 'Untitled'}</div>
          <div className={styles.fmAuthor}>{(block.fields as { author: string }).author}</div>
          {(block.fields as { year: string }).year && (
            <div className={`mono ${styles.fmYear}`}>{(block.fields as { year: string }).year}</div>
          )}
        </div>
      )}

      {selectedBlock === 'copyright' && (
        <div className={styles.fmPage} data-block="copyright">
          <p className={`mono ${styles.fmCopyright}`}>
            {(block.fields as { text: string }).text || ''}
          </p>
        </div>
      )}

      {selectedBlock === 'dedication' && (
        <div className={styles.fmPage} data-block="dedication">
          <p className={`serif ${styles.fmDedication}`}>
            {(block.fields as { text: string }).text || <em className={styles.fmPlaceholder}>For …</em>}
          </p>
        </div>
      )}

      {selectedBlock === 'epigraph' && (
        <div className={styles.fmPage} data-block="epigraph">
          <blockquote className={styles.fmEpigraph}>
            <p className={`serif ${styles.fmEpigraphQuote}`}>
              {(block.fields as { quote: string }).quote || <em className={styles.fmPlaceholder}>The quote…</em>}
            </p>
            {(block.fields as { attribution: string }).attribution && (
              <cite className={`mono ${styles.fmEpigraphAttr}`}>
                {(block.fields as { attribution: string }).attribution}
              </cite>
            )}
          </blockquote>
        </div>
      )}

      {selectedBlock === 'also-by' && (
        <div className={styles.fmPage} data-block="also-by">
          <div className={`mono ${styles.fmAlsoByHead}`}>ALSO BY THE AUTHOR</div>
          {(block.fields as { entries: { id: string; title: string; year: string }[] }).entries.length === 0 ? (
            <p className={`mono ${styles.fmPlaceholder}`}>No titles added yet.</p>
          ) : (
            <ul className={styles.fmAlsoByList}>
              {(block.fields as { entries: { id: string; title: string; year: string }[] }).entries.map(e => (
                <li key={e.id} className={`serif ${styles.fmAlsoByItem}`}>{e.title}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pageIdx > 0 && (
        <div className={`mono ${styles.fmPageNote}`}>
          Showing the {BLOCK_PAGE_LABEL[selectedBlock]}, page {toRoman(pageIdx)}.
        </div>
      )}
    </div>
  );
}

// ── Chapter proof ──────────────────────────────────────────────────

const CH_TITLE = 'Chapter One';
const CH_P1    = 'ara was nine the first night her father climbed the lantern alone, and she watched from the kitchen window with her chin on the sill, breath fogging a half-moon on the glass. The light went up at twenty past eight — earlier than any night that summer — and for a long minute she could see his shape against it, dark on gold, before the storm closed over him.';
const CH_P2    = 'By morning the storm had moved east, the gulls were already arguing over the breakwater, and her father was at the kitchen table reading yesterday\'s newspaper.';

function ChapterProof({ state }: { state: SetTypeState }) {
  const def         = THEME_DEFS.find(t => t.key === state.theme)!;
  const sceneSymbol = SCENE_BREAK_SYMBOLS[state.sceneBreak];

  return (
    <div className={styles.chProof} style={{ fontFamily: def.bodyStack } as React.CSSProperties}>
      <div
        className={styles.chHeading}
        style={{ fontFamily: def.headingStack, fontVariant: state.smallCaps ? 'small-caps' : 'normal' } as React.CSSProperties}
      >
        {CH_TITLE}
      </div>
      <p className={styles.chBody}>
        {state.dropCap && (
          <span className={styles.chDropCap} style={{ fontFamily: def.bodyStack } as React.CSSProperties}>
            M
          </span>
        )}
        {state.dropCap ? CH_P1 : 'M' + CH_P1}
      </p>
      <div className={styles.chBreak}>{sceneSymbol}</div>
      <p className={styles.chBody}>{CH_P2}</p>
    </div>
  );
}

// ── Full chapter proof (Step 5) ────────────────────────────────────

function FullChapterProof({
  chapter,
  state,
  fontSize,
  allChapters,
  totalWords,
}: {
  chapter:     DetectedItem | null;
  state:       SetTypeState;
  fontSize:    FontSize;
  allChapters: DetectedItem[];
  totalWords:  number;
}) {
  if (!chapter) return <div className={styles.frameEmpty}><span className={`mono ${styles.frameEmptyText}`}>No chapters</span></div>;

  const def         = THEME_DEFS.find(t => t.key === state.theme)!;
  const sceneSymbol = SCENE_BREAK_SYMBOLS[state.sceneBreak];
  const scale       = FONT_SIZE_SCALE[fontSize];
  const basePx      = 11.5 * scale;

  const chapterIdx  = allChapters.indexOf(chapter);
  const wordsRead   = allChapters.slice(0, chapterIdx).reduce((s, c) => s + (c.wordCount || 0), 0);
  const totalPages  = Math.ceil(totalWords / 250) + 7;
  const startPage   = 7 + Math.ceil(wordsRead / 250);
  const pct         = Math.round((startPage / totalPages) * 100);

  // Use snippet if available, otherwise use a placeholder
  const body = chapter.snippet ||
    "The story continues here — this chapter’s content will render once the manuscript is fully processed.";

  const firstLetter = body[0] ?? '';
  const restOfBody  = body.slice(1);

  return (
    <div
      className={styles.chProof}
      style={{ fontFamily: def.bodyStack, fontSize: `${basePx}px` } as React.CSSProperties}
    >
      <div
        className={styles.chHeading}
        style={{
          fontFamily: def.headingStack,
          fontVariant: state.smallCaps ? 'small-caps' : 'normal',
          fontSize: `${13 * scale}px`,
        } as React.CSSProperties}
      >
        {chapter.title}
      </div>
      <p className={styles.chBody}>
        {state.dropCap
          ? <><span className={styles.chDropCap} style={{ fontFamily: def.bodyStack } as React.CSSProperties}>{firstLetter}</span>{restOfBody}</>
          : body
        }
      </p>
      <div className={styles.chBreak}>{sceneSymbol}</div>
      <p className={styles.chBody}>
        The barometer fell three points before breakfast. She opened the keeper's log and wrote,
        in her father's hand as best she could remember it, the day's weather and the time of the
        first lamp-lighting. The ink dried slowly in the cold.
      </p>
      <div className={`mono ${styles.chFooter}`}>
        {startPage} of {totalPages} · {pct}%
        {chapter.title && ` · ${chapter.title}`}
      </div>
    </div>
  );
}

// ── Back matter proof (Step 6) ─────────────────────────────────────

const BM_BLOCK_LABELS: Record<string, string> = {
  'acknowledgments': 'acknowledgments',
  'about-author':    'about the author',
  'also-by':         'also by',
  'newsletter-cta':  'newsletter CTA',
  'colophon':        'colophon',
};

function BackMatterProof({
  state,
  typeState,
  profile,
  totalWords,
}: {
  state:       BackMatterState;
  typeState:   SetTypeState;
  profile:     ProfileSnapshot | null;
  totalWords:  number;
}) {
  const def       = THEME_DEFS.find(t => t.key === typeState.theme)!;
  const sel       = state.selectedBlock;
  const totalPages = Math.ceil(totalWords / 250) + 7;
  const startPage  = Math.max(1, totalPages - 8);
  const pct        = Math.round((startPage / totalPages) * 100);

  return (
    <div className={styles.bmProof} style={{ fontFamily: def.bodyStack } as React.CSSProperties}>

      {sel === 'acknowledgments' && (() => {
        const f = state.blocks['acknowledgments'].fields;
        return <>
          <div className={styles.bmHeading} style={{ fontFamily: def.headingStack } as React.CSSProperties}>
            Acknowledgments
          </div>
          <p className={styles.bmBody}>{f.text || 'Acknowledgments text will appear here.'}</p>
          {f.signOff && <p className={styles.bmSignOff}>{f.signOff}</p>}
        </>;
      })()}

      {sel === 'about-author' && (() => {
        const f = state.blocks['about-author'].fields;
        return <>
          <div className={styles.bmHeading} style={{ fontFamily: def.headingStack } as React.CSSProperties}>
            About the Author
          </div>
          <p className={styles.bmBody}>{f.text || profile?.bio || 'Bio will appear here.'}</p>
        </>;
      })()}

      {sel === 'also-by' && (
        <>
          <div className={styles.bmHeading} style={{ fontFamily: def.headingStack } as React.CSSProperties}>
            Also by the Author
          </div>
          {profile && profile.otherTitles.length > 0
            ? <ul className={styles.bmAlsoByList}>
                {profile.otherTitles.map(t => (
                  <li key={t.id} className={styles.bmAlsoByItem}>{t.title}</li>
                ))}
              </ul>
            : <p className={styles.bmBody}>No other titles yet.</p>
          }
        </>
      )}

      {sel === 'newsletter-cta' && (() => {
        const f = state.blocks['newsletter-cta'].fields;
        return <>
          <div className={styles.bmHeading} style={{ fontFamily: def.headingStack } as React.CSSProperties}>
            Stay in touch
          </div>
          <p className={styles.bmBody}>{f.callout}</p>
          {f.url && <p className={`mono ${styles.bmCtaUrl}`}>{f.url}</p>}
        </>;
      })()}

      {sel === 'colophon' && (() => {
        const f = state.blocks['colophon'].fields;
        return <>
          <p className={styles.bmColophon}>{f.text}</p>
        </>;
      })()}

      <div className={`mono ${styles.chFooter}`}>
        {startPage} of {totalPages} · {pct}% · Showing the {BM_BLOCK_LABELS[sel] ?? sel} page.
      </div>
    </div>
  );
}

// ── Cover proof (Step 7) ───────────────────────────────────────────

function CoverProof({ state }: { state: CoverPressState }) {
  if (state.cover?.dataUrl) {
    return (
      <img
        src={state.cover.dataUrl}
        alt="Cover"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }
  return (
    <div className={styles.frameEmpty}>
      <span className={`mono ${styles.frameEmptyText}`}>No cover yet</span>
    </div>
  );
}

export default function LiveProofPanel({ device, onDeviceChange, activeStep = 1, structureItems = [], frontMatterState, typeSettingsState, backMatterState, coverPressState, profile, fontSize = 'M', jumpChapter = 0, hideDeviceToggle = false }: Props) {
  const [open, setOpen] = useState(false);

  const showTOC    = activeStep === 2 && structureItems.length > 0;
  const showFM     = activeStep === 3 && !!frontMatterState;
  const showCh     = activeStep === 4 && !!typeSettingsState;
  const showFull   = activeStep === 5 && !!typeSettingsState;
  const showBM     = activeStep === 6 && !!backMatterState && !!typeSettingsState;
  const showCover  = activeStep === 7 && !!coverPressState;

  return (
    <>
    {/* Trigger button — only visible on tablet/mobile via CSS */}
    <button
      type="button"
      className={`mono ${styles.proofTrigger}`}
      data-open={open ? '' : undefined}
      onClick={() => setOpen(o => !o)}
      aria-label="Toggle live proof"
    >
      PROOF
    </button>

    {/* Backdrop — only visible on tablet/mobile when open */}
    {open && (
      <div className={styles.backdrop} onClick={() => setOpen(false)} />
    )}

    <aside className={styles.panel} data-open={open ? '' : undefined}>
      <div className={styles.header}>
        <span className={`mono ${styles.headerLabel}`}>LIVE PROOF</span>
        <span className={`mono ${styles.headerMeta}`}>
          {showTOC   ? '— TOC · IN EPUB'
           : showFM   ? '— FRONT MATTER · IN EPUB'
           : showCh   ? '— CHAPTER · IN EPUB'
           : showFull ? '— CHAPTER · IN EPUB'
           : showBM   ? '— BACK MATTER · IN EPUB'
           : showCover ? '— COVER · KDP-READY'
           : '— · IN EPUB'}
        </span>
        {/* Close button — only visible on tablet/mobile via CSS */}
        <button
          type="button"
          className={`mono ${styles.closeBtn}`}
          onClick={() => setOpen(false)}
          aria-label="Close live proof"
        >
          ✕
        </button>
      </div>

      {!hideDeviceToggle && (
        <div className={styles.deviceToggle}>
          {DEVICES.map(d => (
            <button
              key={d.id}
              className={`mono ${styles.deviceBtn}`}
              data-active={d.id === device ? '' : undefined}
              onClick={() => onDeviceChange(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.frameWrap}>
        <div className={styles.deviceFrame} data-device={device}>
          {showTOC ? (
            <TOCProof items={structureItems} />
          ) : showFM ? (
            <FrontMatterProof state={frontMatterState!} />
          ) : showCh ? (
            <ChapterProof state={typeSettingsState!} />
          ) : showFull ? (
            <FullChapterProof
              chapter={structureItems.filter(i => i.subtype === 'chapter')[jumpChapter] ?? null}
              state={typeSettingsState!}
              fontSize={fontSize}
              allChapters={structureItems.filter(i => i.subtype === 'chapter')}
              totalWords={structureItems.reduce((s, i) => s + (i.wordCount || 0), 0)}
            />
          ) : showBM ? (
            <BackMatterProof
              state={backMatterState!}
              typeState={typeSettingsState!}
              profile={profile ?? null}
              totalWords={structureItems.reduce((s, i) => s + (i.wordCount || 0), 0)}
            />
          ) : showCover ? (
            <CoverProof state={coverPressState!} />
          ) : (
            <div className={styles.frameEmpty}>
              <span className={`mono ${styles.frameEmptyText}`}>No preview yet</span>
            </div>
          )}
        </div>
      </div>

      {showTOC && (
        <p className={`mono ${styles.tocNote}`}>
          Provisional · TOC only. Full pages render once you set the type.
        </p>
      )}
      {showFM && (
        <p className={`mono ${styles.tocNote}`}>
          Provisional · typography applies once you set the type.
        </p>
      )}
      {showCh && (
        <p className={`mono ${styles.tocNote}`}>
          Live re-render · theme applied.
        </p>
      )}
      {showFull && (
        <p className={`mono ${styles.tocNote}`}>
          Live re-render · {fontSize} · theme applied.
        </p>
      )}
      {showBM && (
        <p className={`mono ${styles.tocNote}`}>
          Showing the {BM_BLOCK_LABELS[backMatterState!.selectedBlock] ?? backMatterState!.selectedBlock} page.
        </p>
      )}
      {showCover && (
        <p className={`mono ${styles.tocNote}`}>
          Cover preview · KDP-ready.
        </p>
      )}

      <div className={styles.epubcheck}>
        <div className={styles.epubcheckHeader}>
          <span className={`mono ${styles.epubcheckLabel}`}>EPUBCHECK</span>
          <span className={`mono ${styles.epubcheckSep}`}>·</span>
          <span className={`mono ${styles.epubcheckMeta}`}>LAST BUILD</span>
        </div>
        <hr className="rule" />
        {showCover && coverPressState && coverPressState.build.status === 'passed' ? (
          <p className={`mono ${styles.epubcheckStatus}`}>
            {coverPressState.build.errorCount} errors · {coverPressState.build.warningCount} warnings.
            {' '}BUILD #{coverPressState.build.buildNumber} · {(coverPressState.build.fileSizeKB / 1024).toFixed(2)} MB
          </p>
        ) : (
          <p className={`mono ${styles.epubcheckStatus}`}>
            No build yet — run after Step 02.
          </p>
        )}
      </div>
    </aside>
    </>
  );
}
