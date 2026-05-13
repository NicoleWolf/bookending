import type { Device } from '../index';
import type { DetectedItem, FrontMatterState, BlockKey } from '../types';
import styles from './LiveProofPanel.module.css';

interface Props {
  device:             Device;
  onDeviceChange:     (device: Device) => void;
  activeStep?:        number;
  structureItems?:    DetectedItem[];
  frontMatterState?:  FrontMatterState;
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

export default function LiveProofPanel({ device, onDeviceChange, activeStep = 1, structureItems = [], frontMatterState }: Props) {
  const showTOC = activeStep === 2 && structureItems.length > 0;
  const showFM  = activeStep === 3 && !!frontMatterState;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={`mono ${styles.headerLabel}`}>LIVE PROOF</span>
        <span className={`mono ${styles.headerMeta}`}>
          {showTOC ? '— TOC · IN EPUB' : showFM ? '— FRONT MATTER · IN EPUB' : '— · IN EPUB'}
        </span>
      </div>

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

      <div className={styles.frameWrap}>
        <div className={styles.deviceFrame} data-device={device}>
          {showTOC ? (
            <TOCProof items={structureItems} />
          ) : showFM ? (
            <FrontMatterProof state={frontMatterState!} />
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

      <div className={styles.epubcheck}>
        <div className={styles.epubcheckHeader}>
          <span className={`mono ${styles.epubcheckLabel}`}>EPUBCHECK</span>
          <span className={`mono ${styles.epubcheckSep}`}>·</span>
          <span className={`mono ${styles.epubcheckMeta}`}>LAST BUILD</span>
        </div>
        <hr className="rule" />
        <p className={`mono ${styles.epubcheckStatus}`}>
          No build yet — run after Step 02.
        </p>
      </div>
    </aside>
  );
}
