import { Pill, Btn, Avatar, Spark } from '../../shared/ui/atoms';
import { IconArrow } from '../../shared/ui/icons';
import { SEGMENTS, GROWTH_SPARK, REPLY_SNIPPETS, SUBSCRIBERS } from './data';
import { AttentionPanel } from './AttentionPanel';
import type { Dispatch } from './types';
import styles from './AudienceOverview.module.css';

interface Props {
  dispatches:        Dispatch[];
  onCompose:         () => void;
  onViewSubscribers: () => void;
  onReviewWinBack:   () => void;
  onOpenSeasons?:    () => void;
}

function parseDate(date: string): Date | null {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const [d, m, y] = date.split(' ');
  if (!m || !(m in months)) return null;
  return new Date(Number(y), months[m]!, Number(d));
}

export function OverviewView({ dispatches, onCompose, onViewSubscribers, onReviewWinBack, onOpenSeasons }: Props) {
  const sentDispatches = dispatches.filter(d => d.status === 'sent');
  const draftCount     = dispatches.filter(d => d.status === 'draft').length;
  const lastDispatch   = sentDispatches[0] ?? null;

  const patrons       = SUBSCRIBERS.filter(s => s.spent !== '$0');
  const patronRevenue = patrons.reduce((sum, s) => sum + parseFloat(s.spent.replace('$', '')), 0);

  const champions = SUBSCRIBERS.filter(s => s.isChampion);

  // Cross-channel score: email engagement + cross-channel presence
  function crossChannelScore(s: typeof SUBSCRIBERS[0]): number {
    return s.opens + s.replies * 3
      + (s.channels?.includes('goodreads')  ? 20 : 0)
      + (s.channels?.includes('instagram')  ? 15 : 0)
      + (s.channels?.includes('bookshop')   ? 10 : 0)
      + (s.isChampion                       ? 25 : 0);
  }
  const topReaders = [...SUBSCRIBERS]
    .sort((a, b) => crossChannelScore(b) - crossChannelScore(a))
    .slice(0, 5);

  const parsed = lastDispatch ? parseDate(lastDispatch.date) : null;
  const replyWindowOpen = parsed
    ? (Date.now() - parsed.getTime()) / 3_600_000 < 72
    : false;

  return (
    <div>
      <div style={{ padding: '6px 0 10px', borderBottom: '1px solid var(--rule)', marginBottom: '4px' }}>
        <span className="label" style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>
          PREVIEW DATA · Live audience analytics coming soon
        </span>
      </div>
      {lastDispatch && (
        <AttentionPanel
          lastDispatch={lastDispatch}
          onWriteNote={onCompose}
          onInviteReply={onCompose}
          onReviewTestimonials={onViewSubscribers}
          onReviewWinBack={onReviewWinBack}
          onOpenSeasons={onOpenSeasons}
        />
      )}

      <div className={styles.resonancePanel}>
        <div className={`label ${styles.resonanceLabel}`}>What's resonating across channels</div>
        <div className={styles.resonanceLines}>
          <p className={`serif ${styles.resonanceLine}`}>Readers respond to vulnerability about process. Your most-replied dispatches and your most-shared Instagram posts both centre on doubt.</p>
          <p className={`serif ${styles.resonanceLine}`}>The Salt Roads reviews most often cite "quiet precision" — a phrase from The Literary Review. It has become a reader shorthand for your work.</p>
          <p className={`serif ${styles.resonanceLine}`}>Reading list dispatches draw fewer replies but more Instagram engagement. Readers go looking for what you name.</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.heroCell}>
          <div className={`label ${styles.heroLabel}`}>Total subscribers</div>
          <div className={`serif ${styles.heroValue}`}>3,055</div>
          <div className={styles.heroPills}>
            <Pill tone="good">+244 this month</Pill>
            <span className={styles.heroChurn}>1.4% CHURN</span>
          </div>
          <div className={styles.heroSpark}>
            <Spark values={GROWTH_SPARK} w={180} h={28} stroke="var(--good)" />
          </div>
        </div>

        {[
          { l: 'Avg open rate',  v: '52.1%', sub: 'Industry avg: 28%',   ann: 'Better than half — and well above the average.',  spark: [48,50,46,51,52,49,54,55,53,56,54,58,60,62] },
          { l: 'Total replies',  v: '492',   sub: 'Across last 6 issues', ann: '492 readers found something worth saying back.',   spark: [52,61,68,74,52,89,148] },
          { l: 'Avg click rate', v: '15.8%', sub: 'Linked to shop',       ann: 'One in six opens leads somewhere.',                spark: [11,12,11,13,12,13,14,13,15,14,16,15,16,18] },
        ].map((s) => (
          <div key={s.l} className={styles.statCell}>
            <div className={`label ${styles.statLabel}`}>{s.l}</div>
            <div className={`serif ${styles.statValue}`}>{s.v}</div>
            <div className={`serif ${styles.statAnnotation}`}>{s.ann}</div>
            <div className={styles.statBottom}>
              <span className={styles.statSub}>{s.sub}</span>
              <Spark values={s.spark} w={72} h={20} stroke="var(--accent)" />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <div className={styles.segmentsPanel}>
            <div className={`label ${styles.segmentsLabel}`}>Subscriber segments</div>
            <div className={styles.segmentsList}>
              {SEGMENTS.map(s => (
                <div key={s.key}>
                  <div className={styles.segmentHeader}>
                    <div>
                      <span className={styles.segmentName}>{s.label}</span>
                      <span className={`serif ${styles.segmentSub}`}>{s.sub}</span>
                    </div>
                    <span className={styles.segmentCount}>{s.n.toLocaleString()}</span>
                  </div>
                  <div className={styles.segmentBar}>
                    <div className={styles.segmentFill} style={{ width: `${s.pct * 100}%`, background: s.color }} />
                  </div>
                  <div className={styles.segmentPct}>{Math.round(s.pct * 100)}% of list</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.patronsPanel}>
            <div className={styles.patronsTop}>
              <div className="label">Patrons</div>
              <span className={`mono ${styles.patronCount}`}>{patrons.length}</span>
            </div>
            <div className={`serif ${styles.patronRevenue}`}>${patronRevenue}</div>
            <div className={styles.patronSub}>lifetime revenue from readers</div>
            <button className={styles.patronAction} onClick={onCompose}>
              Send patrons a note →
            </button>
          </div>

          <div className={styles.championsPanel}>
            <div className={styles.championsTop}>
              <div className="label">Champions</div>
              <span className={`mono ${styles.championsCount}`}>★ {champions.length}</span>
            </div>
            <div className={styles.championsSub}>Readers who write about your work in public.</div>
            <button className={styles.championsAction} onClick={onCompose}>
              Send champions early access →
            </button>
          </div>
        </div>

        <div className={styles.dispatchPanel}>
          {lastDispatch ? (
            <>
              <div className={styles.dispatchHeader}>
                <div className="label">Last dispatch</div>
                <span className={styles.dispatchDate}>{lastDispatch.date.toUpperCase()} · {lastDispatch.issue.toUpperCase()}</span>
              </div>
              <h3 className={`serif ${styles.dispatchTitle}`}>{lastDispatch.subject}</h3>
              {replyWindowOpen && (
                <p className={`serif ${styles.replyWindowNote}`}>The reply window is still open.</p>
              )}

              <div className={styles.dispatchMetrics}>
                {[
                  ['Open rate',  lastDispatch.openRate ?? '—',          'email engagement'],
                  ['Replies',    String(lastDispatch.replies ?? '—'),   'reader responses'],
                  ['Click rate', lastDispatch.clickRate ?? '—',         'linked to shop'],
                  ['Unsubs',     String(lastDispatch.unsubs ?? '—'),    'unsubscribes'],
                ].map(([l, v, sub]) => (
                  <div key={l} className={styles.metricBox}>
                    <div className={styles.metricLabel}>{l!.toUpperCase()}</div>
                    <div className={`serif ${styles.metricValue}`}>{v}</div>
                    <div className={styles.metricSub}>{sub}</div>
                  </div>
                ))}
              </div>

              <div className={styles.repliesSection}>
                <div className={`label ${styles.repliesLabel}`}>Reply excerpts</div>
                <div className={styles.replySnippets}>
                  {REPLY_SNIPPETS.map(t => (
                    <div key={t} className={styles.replySnippetWrap}>
                      <span className={`serif ${styles.replySnippet}`}>{t}</span>
                      <button className={styles.testimonialBtn}>Use as testimonial</button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.dispatchHeader}>
              <div className="label">Last dispatch</div>
              <p className={`serif ${styles.dispatchTitle}`}>No dispatches sent yet.</p>
            </div>
          )}
        </div>

        <div className={styles.rightCol}>
          <div className={styles.readersPanel}>
            <div className={`label ${styles.readersLabel}`}>Most engaged across channels</div>
            {topReaders.map((s) => (
              <div key={s.id} className={styles.readerRow}>
                <Avatar initials={s.initials} tone={s.tone} size={30} />
                <div className={styles.readerInfo}>
                  <div className={styles.readerName}>
                    {s.name}
                    {s.isChampion && <span className={styles.readerChampionMark}> ★</span>}
                  </div>
                  <div className={styles.readerStats}>
                    {s.opens} OPENS · {s.replies} REPLIES
                    {(s.channels?.length ?? 0) > 1 && ` · ${s.channels!.filter(c => c !== 'email').join(', ').toUpperCase()}`}
                  </div>
                </div>
                {s.spent !== '$0' && (
                  <div className={`serif ${styles.readerSpent}`}>{s.spent}</div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.nextDispatch}>
            <div className={styles.nextLabel}>NEXT DISPATCH</div>
            <div className={`serif ${styles.nextText}`}>
              {draftCount > 0 ? `${draftCount} draft${draftCount > 1 ? 's' : ''} in progress.` : 'No drafts yet.'}
              {parsed
                ? ` Your last issue was ${Math.floor((Date.now() - parsed.getTime()) / 86_400_000)} days ago.`
                : ' Start your first dispatch.'
              }
            </div>
            <Btn tone="accent" icon={<IconArrow size={13} />} onClick={onCompose}>
              Compose dispatch
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
