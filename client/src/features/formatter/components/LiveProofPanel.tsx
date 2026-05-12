import type { Device } from '../index';
import type { DetectedItem } from '../types';
import styles from './LiveProofPanel.module.css';

interface Props {
  device:          Device;
  onDeviceChange:  (device: Device) => void;
  activeStep?:     number;
  structureItems?: DetectedItem[];
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

export default function LiveProofPanel({ device, onDeviceChange, activeStep = 1, structureItems = [] }: Props) {
  const showTOC = activeStep === 2 && structureItems.length > 0;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={`mono ${styles.headerLabel}`}>LIVE PROOF</span>
        <span className={`mono ${styles.headerMeta}`}>
          {showTOC ? '— TOC · IN EPUB' : '— · IN EPUB'}
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
