import { useState } from 'react';
import { SectionHead, Btn } from '../../shared/ui/atoms';
import { OverviewView } from './OverviewView';
import { ByTitleView } from './ByTitleView';
import { ByChannelView } from './ByChannelView';
import { PayoutsView } from './PayoutsView';
import { TaxView } from './TaxView';
import type { BookMetadata } from '../library/data';
import { TITLE_EARNINGS } from './data';
import styles from './Royalties.module.css';

type SubView = 'overview' | 'title' | 'channel' | 'payouts' | 'tax';

interface RoyaltiesProps {
  savedBooks?: Record<number, BookMetadata>;
}

export default function RoyaltiesTab({ savedBooks }: RoyaltiesProps) {
  const [view, setView] = useState<SubView>('overview');
  const primaryTitle = savedBooks?.[TITLE_EARNINGS[0].id]?.title ?? TITLE_EARNINGS[0].title;

  return (
    <section className={styles.section}>
      <div style={{ padding: '6px 0 10px', borderBottom: '1px solid var(--rule)', marginBottom: '4px' }}>
        <span className="label" style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>
          PREVIEW DATA · Live royalty reporting coming soon
        </span>
      </div>
      <div className={styles.header}>
        <SectionHead
          eyebrow="§ 06 · Royalties"
          title="Earnings, account by account"
          kicker={`${primaryTitle} · 147 units sold · $1,411.82 net lifetime`}
        >
          <Btn tone="ghost">Export CSV</Btn>
        </SectionHead>

        <nav className={styles.tabs}>
          <button
            className={styles.tab}
            data-active={view === 'overview' ? 'true' : undefined}
            onClick={() => setView('overview')}
          >
            Overview
          </button>
          <button
            className={styles.tab}
            data-active={view === 'title' ? 'true' : undefined}
            onClick={() => setView('title')}
          >
            By Title
          </button>
          <button
            className={styles.tab}
            data-active={view === 'channel' ? 'true' : undefined}
            onClick={() => setView('channel')}
          >
            By Channel
          </button>
          <button
            className={styles.tab}
            data-active={view === 'payouts' ? 'true' : undefined}
            onClick={() => setView('payouts')}
          >
            Payouts
          </button>
          <button
            className={styles.tab}
            data-active={view === 'tax' ? 'true' : undefined}
            onClick={() => setView('tax')}
          >
            Tax Summary
          </button>
        </nav>
      </div>

      {view === 'overview' && <OverviewView />}
      {view === 'title'    && <ByTitleView savedBooks={savedBooks} />}
      {view === 'channel'  && <ByChannelView />}
      {view === 'payouts'  && <PayoutsView />}
      {view === 'tax'      && <TaxView />}
    </section>
  );
}
