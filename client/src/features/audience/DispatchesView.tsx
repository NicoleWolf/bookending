import { useState } from 'react';
import { Btn } from '../../shared/ui/atoms';
import { IconArrow } from '../../shared/ui/icons';
import type { Dispatch, DispatchStatus } from './types';
import styles from './Dispatches.module.css';

interface Props {
  dispatches: Dispatch[];
  onCompose: () => void;
}

export function DispatchesView({ dispatches, onCompose }: Props) {
  const [filter, setFilter] = useState<DispatchStatus | 'all'>('all');
  const filtered = filter === 'all' ? dispatches : dispatches.filter(d => d.status === filter);

  const sentWithRate = dispatches.filter(d => d.status === 'sent' && d.openRate != null);
  const trailingAvg  = sentWithRate.length > 0
    ? sentWithRate.reduce((s, d) => s + parseFloat(d.openRate!), 0) / sentWithRate.length
    : 0;

  return (
    <div>
      <div className={styles.filterBar}>
        <div className={styles.filterBtns}>
          {(['all', 'sent', 'draft', 'scheduled'] as const).map(f => (
            <button
              key={f}
              className={styles.filterBtn}
              data-active={filter === f ? 'true' : undefined}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={styles.filterCount}>
                ({f === 'all' ? dispatches.length : dispatches.filter(d => d.status === f).length})
              </span>
            </button>
          ))}
        </div>
        <Btn tone="accent" icon={<IconArrow size={13} />} onClick={onCompose}>New dispatch</Btn>
      </div>

      <div className={styles.resonancePanel}>
        <div className={`label ${styles.resonanceLabel}`}>What's resonating</div>
        <div className={styles.resonanceNotes}>
          <p className={`serif ${styles.resonanceNote}`}>Dispatches that open with grief, doubt, or difficulty — No. 47, No. 46 — draw your highest open rates.</p>
          <p className={`serif ${styles.resonanceNote}`}>Reading list issues draw fewer replies but more clicks: readers go looking for what you name.</p>
          <p className={`serif ${styles.resonanceNote}`}>When you say something that feels true rather than useful, readers write back.</p>
        </div>
      </div>

      <div className={styles.tableHead}>
        {['Issue', 'Subject', 'Date', 'Open rate', 'Replies', 'Click rate', 'Unsubs'].map(h => (
          <div key={h} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {filtered.map((d) => (
        <div
          key={d.id}
          className={styles.dispatchRow}
          data-draft={d.status === 'draft' ? 'true' : undefined}
        >
          <div className={styles.issueNum}>{d.issue.toUpperCase()}</div>
          <div>
            <div className={styles.subjectText}>{d.subject}</div>
            {d.status === 'draft' && (
              <div className={styles.draftTag}>DRAFT</div>
            )}
            {d.openRate && parseFloat(d.openRate) > trailingAvg + 5 && (
              <button className={styles.followupPrompt} onClick={onCompose}>
                Reply window open — draft follow-up?
              </button>
            )}
          </div>
          <div className={styles.dispatchDate}>{d.date}</div>
          <div className={`serif ${styles.dispatchStat}`} data-empty={!d.openRate ? 'true' : undefined}>
            {d.openRate ?? '—'}
          </div>
          <div className={`serif ${styles.dispatchStat}`} data-empty={!d.replies ? 'true' : undefined}>
            {d.replies ?? '—'}
          </div>
          <div className={`serif ${styles.dispatchStat}`} data-empty={!d.clickRate ? 'true' : undefined}>
            {d.clickRate ?? '—'}
          </div>
          <div className={`serif ${styles.dispatchStat}`} data-empty={d.unsubs == null ? 'true' : undefined}>
            {d.unsubs ?? '—'}
          </div>
        </div>
      ))}
    </div>
  );
}
