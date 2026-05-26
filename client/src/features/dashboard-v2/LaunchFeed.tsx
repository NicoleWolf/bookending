import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { timeAgo } from '../notifications/data';
import type { LaunchEvent, LaunchFeedData } from './launch-feed-data';
import { DEMO_PUBLISHED_AT, DEMO_LAUNCH_EVENTS } from './launch-feed-data';
import styles from './LaunchFeed.module.css';

interface HourBucket {
  hourNum: number;
  startMs: number;
  endMs: number;
  isLive: boolean;
  events: LaunchEvent[];
}

const EVENT_ICON: Record<LaunchEvent['type'], string> = {
  view:     '◎',
  purchase: '★',
  follow:   '◉',
};

const EVENT_LABEL: Record<LaunchEvent['type'], string> = {
  view:     'Listing viewed',
  purchase: 'Purchase',
  follow:   'New follower',
};

function groupByHour(events: LaunchEvent[], publishedAt: string): HourBucket[] {
  const launch = new Date(publishedAt).getTime();
  const now    = Date.now();
  const map    = new Map<number, LaunchEvent[]>();

  for (const e of events) {
    const hourIdx = Math.floor((new Date(e.occurredAt).getTime() - launch) / 3_600_000);
    if (hourIdx < 0 || hourIdx > 23) continue;
    if (!map.has(hourIdx)) map.set(hourIdx, []);
    map.get(hourIdx)!.push(e);
  }

  const currentHourIdx = Math.floor((now - launch) / 3_600_000);

  return Array.from(map.entries())
    .sort(([a], [b]) => b - a) // newest first
    .map(([hourIdx, evs]) => ({
      hourNum: hourIdx + 1,
      startMs: launch + hourIdx * 3_600_000,
      endMs:   Math.min(launch + (hourIdx + 1) * 3_600_000, now),
      isLive:  hourIdx === currentHourIdx,
      events:  evs.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    }));
}

function fmtHour(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtElapsed(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m}m live`;
  return `${h}h ${m}m live`;
}

interface Props {
  manuscriptId: string;
  manuscriptTitle: string;
}

export default function LaunchFeed({ manuscriptId, manuscriptTitle }: Props) {
  const [feed, setFeed] = useState<LaunchFeedData | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    void api.get<LaunchFeedData>(`/api/manuscripts/${manuscriptId}/launch-feed`)
      .then(d => setFeed(d))
      .catch(() => setFeed({ publishedAt: DEMO_PUBLISHED_AT, events: DEMO_LAUNCH_EVENTS }));
  }, [manuscriptId]);

  // Refresh time-ago labels every minute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!feed) return null;

  const launchMs  = new Date(feed.publishedAt).getTime();
  const now       = Date.now();
  const elapsedMs = now - launchMs;
  if (elapsedMs > 24 * 60 * 60 * 1000) return null;

  const totalViews     = feed.events.filter(e => e.type === 'view').length;
  const totalPurchases = feed.events.filter(e => e.type === 'purchase').length;
  const totalFollows   = feed.events.filter(e => e.type === 'follow').length;
  const buckets        = groupByHour(feed.events, feed.publishedAt);

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHead}>
        <span className={`mono ${styles.eyebrow}`}>§ · First 24 hours</span>
        <span className={styles.liveChip}>● LIVE</span>
        <span className={`mono ${styles.elapsed}`}>{fmtElapsed(elapsedMs)}</span>
      </div>

      <p className={`serif ${styles.title}`}>{manuscriptTitle} is live.</p>

      {/* Totals */}
      <div className={styles.statsRow} role="region" aria-label="Launch totals">
        <div className={styles.stat}>
          <span className={styles.eventIcon} data-type="view">{EVENT_ICON.view}</span>
          <span className={styles.statNum}>{totalViews}</span>
          <span className={styles.statLabel}>view{totalViews !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.eventIcon} data-type="purchase">{EVENT_ICON.purchase}</span>
          <span className={styles.statNum}>{totalPurchases}</span>
          <span className={styles.statLabel}>purchase{totalPurchases !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.eventIcon} data-type="follow">{EVENT_ICON.follow}</span>
          <span className={styles.statNum}>{totalFollows}</span>
          <span className={styles.statLabel}>follower{totalFollows !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Hourly buckets */}
      {buckets.length > 0 && (
        <div className={styles.buckets}>
          {buckets.map(bucket => {
            const bViews     = bucket.events.filter(e => e.type === 'view').length;
            const bPurchases = bucket.events.filter(e => e.type === 'purchase').length;
            const bFollows   = bucket.events.filter(e => e.type === 'follow').length;
            const summary    = [
              bViews     > 0 && `${bViews} view${bViews !== 1 ? 's' : ''}`,
              bPurchases > 0 && `${bPurchases} purchase${bPurchases !== 1 ? 's' : ''}`,
              bFollows   > 0 && `${bFollows} follower${bFollows !== 1 ? 's' : ''}`,
            ].filter(Boolean).join(' · ');

            return (
              <div key={bucket.hourNum} className={styles.bucket}>
                <div className={styles.bucketHead}>
                  <span className={`mono ${styles.bucketLabel}`}>
                    Hour {bucket.hourNum}
                    {bucket.isLive && <span className={styles.bucketLive}> · live</span>}
                  </span>
                  <span className={`mono ${styles.bucketRange}`}>
                    {fmtHour(bucket.startMs)} – {bucket.isLive ? 'now' : fmtHour(bucket.endMs)}
                  </span>
                  <span className={`mono ${styles.bucketSummary}`}>{summary}</span>
                </div>
                <div className={styles.events}>
                  {bucket.events.map(e => {
                    const body = [
                      EVENT_LABEL[e.type],
                      e.detail ?? e.location,
                    ].filter(Boolean).join(' · ');
                    return (
                      <div key={e.id} className={styles.event}>
                        <span className={styles.eventIcon} data-type={e.type}>{EVENT_ICON[e.type]}</span>
                        <span className={styles.eventBody}>{body}</span>
                        <span className={`mono ${styles.eventTime}`}>{timeAgo(e.occurredAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
