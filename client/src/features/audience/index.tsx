import { useState, useEffect } from 'react';
import { SectionHead, Btn } from '../../shared/ui/atoms';
import { IconArrow } from '../../shared/ui/icons';

import { OverviewView } from './OverviewView';
import { DispatchesView } from './DispatchesView';
import { SubscribersView } from './SubscribersView';
import { ComposeView } from './ComposeView';
import { BrandView } from './BrandView';
import { WinBackView } from './WinBackView';
import { useAuth } from '../auth';
import type { Dispatch } from './types';
import type { BookMetadata } from '../library/data';
import styles from './Audience.module.css';

import { api } from '../../lib/api';

type SubView = 'overview' | 'dispatches' | 'subscribers' | 'brand' | 'compose' | 'winback';

import type { DispatchRecord } from '@bookending/shared';

function recordToDispatch(r: DispatchRecord): Dispatch {
  const status = r.status.toLowerCase() as Dispatch['status'];
  return {
    id:        r.id,
    issue:     r.issue,
    subject:   r.subject,
    date:      r.sentAt ? new Date(r.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    status,
    opens:     null,
    openRate:  null,
    replies:   null,
    clickRate: null,
    unsubs:    null,
    recipients: null,
  };
}

interface AudienceTabProps {
  savedBooks:    Record<string, BookMetadata>;
  onOpenSeasons?: () => void;
}

export default function AudienceTab({ savedBooks, onOpenSeasons }: AudienceTabProps) {
  const { session } = useAuth();
  const [view,      setView]      = useState<SubView>('overview');
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const records = await api.get<DispatchRecord[]>('/api/dispatches');
        setDispatches(records.map(recordToDispatch));
      } catch { /* leave empty */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  function handleDispatchSaved(d: Dispatch) {
    setDispatches(prev => [d, ...prev]);
    setView('dispatches');
  }

  const drafts     = dispatches.filter(d => d.status === 'draft').length;
  const sentCount  = dispatches.filter(d => d.status === 'sent').length;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <SectionHead
          eyebrow="§ 04 · Audience · The Margin Letter"
          title="Your readers, gathered"
          kicker="3,055 readers sorted not by data points, but by how they read."
        >
          {drafts > 0 && <Btn tone="ghost">Drafts · {drafts}</Btn>}
          <Btn tone="accent" icon={<IconArrow size={14} />} onClick={() => setView('compose')}>
            Compose dispatch
          </Btn>
        </SectionHead>

        {view !== 'compose' && view !== 'winback' && (
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
              data-active={view === 'dispatches' ? 'true' : undefined}
              onClick={() => setView('dispatches')}
            >
              Dispatches
              <span className={styles.tabCount}>({sentCount})</span>
            </button>
            <button
              className={styles.tab}
              data-active={view === 'subscribers' ? 'true' : undefined}
              onClick={() => setView('subscribers')}
            >
              Subscribers
              <span className={styles.tabCount}>(3,055)</span>
            </button>
            <button
              className={styles.tab}
              data-active={view === 'brand' ? 'true' : undefined}
              onClick={() => setView('brand')}
            >
              Brand
            </button>
          </nav>
        )}
      </div>

      {view === 'overview'    && <OverviewView dispatches={dispatches} onCompose={() => setView('compose')} onViewSubscribers={() => setView('subscribers')} onReviewWinBack={() => setView('winback')} onOpenSeasons={onOpenSeasons} />}
      {view === 'dispatches'  && <DispatchesView dispatches={dispatches} onCompose={() => setView('compose')} />}
      {view === 'subscribers' && <SubscribersView />}
      {view === 'brand'       && <BrandView savedBooks={savedBooks} />}
      {view === 'compose'     && <ComposeView dispatches={dispatches} onBack={() => setView('dispatches')} onRouteToWinBack={() => setView('winback')} onSaved={handleDispatchSaved} />}
      {view === 'winback'     && <WinBackView onBack={() => setView('overview')} />}
    </section>
  );
}
