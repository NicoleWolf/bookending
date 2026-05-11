import { useState } from 'react';
import { SectionHead, Btn } from '../../shared/ui/atoms';
import { IconArrow } from '../../shared/ui/icons';
import { ChannelsView } from './ChannelsView';
import { IsbnView } from './IsbnView';
import { FilesView } from './FilesView';
import { FILES } from './data';
import styles from './PrintDistribution.module.css';

type SubView = 'channels' | 'isbns' | 'files';

export default function PrintDistribution() {
  const [view, setView] = useState<SubView>('channels');

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <SectionHead
          eyebrow="§ 02 · Print & Distribution"
          title="Where the book lives"
          kicker="Six channels, one ISBN prefix, royalty consolidation handled nightly at 02:00 UTC."
        >
          <Btn tone="ghost">ISBN registry</Btn>
          <Btn tone="primary" icon={<IconArrow size={14} />}>Add channel</Btn>
        </SectionHead>

        <nav className={styles.tabs}>
          <button
            className={styles.tab}
            data-active={view === 'channels' ? 'true' : undefined}
            onClick={() => setView('channels')}
          >
            Channels & proofs
          </button>
          <button
            className={styles.tab}
            data-active={view === 'isbns' ? 'true' : undefined}
            onClick={() => setView('isbns')}
          >
            ISBN registry
          </button>
          <button
            className={styles.tab}
            data-active={view === 'files' ? 'true' : undefined}
            onClick={() => setView('files')}
          >
            Files & assets
            {FILES.some(f => f.status === 'needs-review') && (
              <span className={styles.tabAlert} />
            )}
          </button>
        </nav>
      </div>

      {view === 'channels' && <ChannelsView />}
      {view === 'isbns'    && <IsbnView />}
      {view === 'files'    && <FilesView />}
    </section>
  );
}
