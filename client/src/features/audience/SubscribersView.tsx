import { useState, useEffect } from 'react';
import { Pill, Btn, Avatar } from '../../shared/ui/atoms';
import { IconSearch } from '../../shared/ui/icons';
import {
  SUBSCRIBERS as STATIC_SUBSCRIBERS,
  SEGMENT_TONE,
  SUBSCRIBER_DISPLAY,
  subscriberInitials,
  subscriberTone,
} from './data';
import type { Subscriber, SubscriberSegment } from './types';
import { ReaderDetailView } from './ReaderDetailView';
import { useAuth } from '../auth';
import styles from './Subscribers.module.css';

const CHANNEL_LABEL: Record<string, string> = {
  goodreads: 'GR', instagram: 'IG', bookshop: 'BS',
};

import { api } from '../../lib/api';
import type { SubscriberRecord } from '@bookending/shared';

function recordToSubscriber(r: SubscriberRecord, idx: number): Subscriber {
  const display = SUBSCRIBER_DISPLAY[r.name];
  const date    = new Date(r.joinedAt);
  const joined  = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  return {
    id:       r.id,
    name:     r.name     || r.email,
    initials: subscriberInitials(r.name || r.email),
    tone:     subscriberTone(r.name, idx),
    location: r.location || '—',
    joined,
    segment:  r.segment as SubscriberSegment,
    opens:    display?.opens   ?? 0,
    replies:  display?.replies ?? 0,
    spent:    display?.spent   ?? '$0',
  };
}

export function SubscribersView() {
  const { session } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>(STATIC_SUBSCRIBERS);
  const [search,           setSearch]           = useState('');
  const [seg,              setSeg]              = useState<SubscriberSegment | 'all' | 'patrons' | 'champions'>('all');
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [showExportMenu,   setShowExportMenu]   = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const records = await api.get<SubscriberRecord[]>('/api/subscribers');
        if (records.length > 0) {
          setSubscribers(records.map(recordToSubscriber));
          return;
        }
        // DB empty — seed from static data
        const seeded: Subscriber[] = [];
        for (const s of STATIC_SUBSCRIBERS) {
          try {
            const created = await api.post<SubscriberRecord>('/api/subscribers', {
              email:    `${s.name.toLowerCase().replace(/[^a-z]/g, '.')}@example.com`,
              name:     s.name,
              location: s.location,
              segment:  s.segment,
            });
            seeded.push(recordToSubscriber(created, seeded.length));
          } catch { /* skip */ }
        }
        if (seeded.length > 0) setSubscribers(seeded);
      } catch { /* API down — static data remains */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const filtered = subscribers.filter(s => {
    const matchSeg =
      seg === 'all'      ? true :
      seg === 'patrons'  ? s.spent !== '$0' :
      seg === 'champions' ? s.isChampion === true :
      s.segment === seg;
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
    return matchSeg && matchQ;
  });

  const selectedSub = selectedId ? subscribers.find(s => s.id === selectedId) ?? null : null;
  if (selectedSub) {
    return <ReaderDetailView subscriber={selectedSub} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <IconSearch size={13} className={styles.searchIcon} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subscribers…"
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterBtns}>
          {(['all', 'devout', 'warm', 'cool', 'new'] as const).map(f => (
            <button
              key={f}
              className={styles.filterBtn}
              data-active={seg === f ? 'true' : undefined}
              onClick={() => setSeg(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className={styles.filterDivider} />
          <button
            className={styles.filterBtnPatron}
            data-active={seg === 'patrons' ? 'true' : undefined}
            onClick={() => setSeg('patrons')}
          >
            Patrons
          </button>
          <button
            className={styles.filterBtnChampion}
            data-active={seg === 'champions' ? 'true' : undefined}
            onClick={() => setSeg('champions')}
          >
            ★ Champions
          </button>
        </div>

        <span className={styles.count}>{filtered.length} OF {subscribers.length}</span>
        <div className={styles.exportWrap}>
          <Btn tone="ghost" onClick={() => setShowExportMenu(s => !s)}>Export ▾</Btn>
          {showExportMenu && (
            <div className={styles.exportMenu}>
              {['Download CSV', 'Push to Mailchimp', 'Push to ConvertKit', 'Generate retailer CSV', 'Generate Goodreads giveaway list'].map(label => (
                <button key={label} className={styles.exportMenuItem} onClick={() => setShowExportMenu(false)}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.tableHead}>
        {['Subscriber', 'Location', 'Segment', 'Joined', 'Opens', 'Replies', 'Spent'].map(h => (
          <div key={h} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {filtered.map((s) => (
        <div key={s.id} className={styles.subRow} onClick={() => setSelectedId(s.id)}>
          <div className={styles.subCell}>
            <Avatar initials={s.initials} tone={s.tone} size={26} />
            <div>
              <div className={styles.subName}>
                {s.name}
                {s.isChampion && <span className={styles.subChampionMark}> ★</span>}
              </div>
              {(s.channels?.length ?? 0) > 1 && (
                <div className={styles.subChannels}>
                  {s.channels!.filter(c => c !== 'email').map(c => (
                    <span key={c} className={styles.subChannel}>{CHANNEL_LABEL[c]}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={styles.subLocation}>{s.location}</div>
          <Pill tone={SEGMENT_TONE[s.segment]}>{s.segment}</Pill>
          <div className={styles.subJoined}>{s.joined}</div>
          <div className={`serif ${styles.subOpens}`}>{s.opens}</div>
          <div className={`serif ${styles.subReplies}`}>{s.replies}</div>
          <div className={`serif ${styles.subSpent}`} data-patron={s.spent !== '$0' ? 'true' : undefined}>
            {s.spent}
          </div>
        </div>
      ))}
    </div>
  );
}
