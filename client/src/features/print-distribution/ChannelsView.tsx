import { useState, useEffect } from 'react';
import { Pill, Btn, Spark } from '../../shared/ui/atoms';
import { IconArrow, IconArrowUp, IconMore } from '../../shared/ui/icons';
import { CHANNEL_DISPLAY, STATS, PROOF, STATUS_TONE } from './data';
import type { Channel } from './types';
import type { ChannelStatus } from './types';
import ChannelSettingsModal from './ChannelSettingsModal';
import { useAuth } from '../auth';
import styles from './ChannelsView.module.css';

import { api } from '../../lib/api';
import type { ChannelRecord } from '@bookending/shared';

function recordToChannel(r: ChannelRecord): Channel {
  const display = CHANNEL_DISPLAY[r.name] ?? { moved: 0, revenue: '—', last: '—' };
  return {
    id:        r.id,
    name:      r.name,
    kind:      r.kind,
    status:    r.status as ChannelStatus,
    sku:       r.sku      ?? '',
    royalty:   r.royalty  ?? '—',
    moved:     r.copiesSold,
    revenue:   display.revenue,
    last:      display.last,
    reserves:  display.reserves,
    formats:   r.formats ? r.formats.split(',') : [],
    listPrice: r.listPrice ?? undefined,
  };
}

export function ChannelsView() {
  const { session } = useAuth();
  const [channels,       setChannels]       = useState<Channel[]>([]);
  const [expanded,       setExpanded]       = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const records = await api.get<ChannelRecord[]>('/api/distribution');
        setChannels(records.map(recordToChannel));
      } catch { /* leave empty */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  function saveChannel(updated: Channel) {
    setChannels(prev => prev.map(c => c.id === updated.id ? updated : c));
    api.patch(`/api/distribution/${updated.id}`, {
      status:    updated.status,
      sku:       updated.sku       || null,
      royalty:   updated.royalty   || null,
      listPrice: updated.listPrice ?? null,
      formats:   updated.formats,
    }).catch(err => console.error('Failed to save channel:', err));
  }

  return (
    <div>
      <div className={styles.statsGrid}>
        {STATS.map((s, i) => (
          <div key={i} className={styles.statCell}>
            <div className={`label ${styles.statLabel}`}>{s.l}</div>
            <div className={`serif ${styles.statValue}`}>{s.v}</div>
            <div className={styles.statBottom}>
              <span className={styles.statSub}>{s.sub}</span>
              <Spark values={s.spark} w={80} h={20} stroke="var(--accent)" />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.channelsList}>
          <div className={styles.tableHead}>
            {['Channel', 'Format', 'Status', 'Royalty', 'Units', 'Revenue', ''].map((h, i) => (
              <div key={i} className={styles.tableHeadCell}>{h}</div>
            ))}
          </div>

          {channels.map((c) => (
            <div key={c.id}>
              <div
                className={styles.channelRow}
                data-expanded={expanded === c.id ? 'true' : undefined}
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <div>
                  <div className={styles.channelName}>{c.name}</div>
                  <div className={styles.channelSku}>{c.sku}</div>
                </div>
                <div className={`serif ${styles.channelKind}`}>{c.kind}</div>
                <Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill>
                <div className={styles.channelRoyalty}>{c.royalty}</div>
                <div className={`serif ${styles.channelMoved}`}>{c.moved || '—'}</div>
                <div className={styles.channelRevenue}>{c.revenue}</div>
                <button
                  className={styles.channelMore}
                  onClick={(e) => e.stopPropagation()}
                ><IconMore size={15} /></button>
              </div>

              {expanded === c.id && (
                <div className={styles.expandedRow}>
                  <div>
                    <div className={styles.expandedLabel}>Pricing</div>
                    {c.listPrice ? (() => {
                      const pct = parseFloat(c.royalty) / 100;
                      const net = isNaN(pct) ? null : (c.listPrice * pct).toFixed(2);
                      return (
                        <div className={styles.pricingGrid}>
                          <div className={styles.pricingItem}>
                            <div className={styles.pricingKey}>List price</div>
                            <div className={styles.pricingVal}>${c.listPrice.toFixed(2)}</div>
                          </div>
                          <div className={styles.pricingItem}>
                            <div className={styles.pricingKey}>Royalty rate</div>
                            <div className={styles.pricingVal}>{c.royalty}</div>
                          </div>
                          {net && (
                            <div className={styles.pricingItem}>
                              <div className={styles.pricingKey}>Net per copy</div>
                              <div className={`${styles.pricingVal} ${styles.pricingNet}`}>${net}</div>
                            </div>
                          )}
                          {c.reserves && (
                            <div className={styles.pricingReserves}>{c.reserves}</div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className={styles.priceNotSet}>PRICE NOT SET</div>
                    )}
                  </div>
                  <div>
                    <div className={styles.expandedLabel}>Last sync</div>
                    <div className={styles.expandedText}>{c.last}</div>
                  </div>
                  <div>
                    <div className={styles.expandedLabel}>Formats live</div>
                    <div className={styles.expandedFormats}>
                      {c.formats.map(f => <Pill key={f} tone="neutral">{f}</Pill>)}
                    </div>
                  </div>
                  <div className={styles.expandedActions}>
                    <Btn tone="ghost" onClick={() => setEditingChannel(c)}>Channel settings</Btn>
                    <Btn tone="ghost" icon={<IconArrowUp size={12} />}>Dashboard ↗</Btn>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className={styles.addChannelBar}>
            <Btn tone="ghost" icon={<IconArrow size={13} />}>Add channel</Btn>
          </div>
        </div>

        {PROOF && (
          <div className={styles.proofPanel}>
            <div className={styles.proofHeader}>
              <div className="label">Latest proof</div>
              <Pill tone="accent">{PROOF.status}</Pill>
            </div>

            <div className={styles.proofMini}>
              <div className={styles.proofBook}>
                <div className={styles.proofBookAuthor}>E. WINWOOD</div>
                <div>
                  <div className={styles.proofBookTitle}>The<br/>Lantern<br/>Keeper's<br/>Daughter</div>
                  <div className={styles.proofBookLine} />
                  <div className={styles.proofBookTag}>A NOVEL</div>
                </div>
              </div>
              <div>
                <div className={styles.proofTitle}>{PROOF.title}</div>
                <div className={styles.proofVersion}>{PROOF.version.toUpperCase()}</div>
                {PROOF.specs.slice(0, 3).map(([k, v]) => (
                  <div key={k} className={styles.specRow}>
                    <span className={styles.specKey}>{k.toUpperCase()}</span>
                    <span className={`serif ${styles.specVal}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.specsTable}>
              {PROOF.specs.map(([k, v]) => (
                <div key={k} className={styles.specsRow}>
                  <span className={styles.specsKey}>{k.toUpperCase()}</span>
                  <span className={`serif ${styles.specsVal}`}>{v}</span>
                </div>
              ))}
            </div>

            <div className={styles.proofBtns}>
              <Btn tone="primary">Approve & push to print</Btn>
              <Btn tone="ghost">Open proof PDF</Btn>
            </div>
          </div>
        )}
      </div>
      {editingChannel && (
        <ChannelSettingsModal
          channel={editingChannel}
          onSave={saveChannel}
          onClose={() => setEditingChannel(null)}
        />
      )}
    </div>
  );
}
