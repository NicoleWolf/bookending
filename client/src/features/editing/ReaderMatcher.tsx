import { useState, useMemo, useEffect } from 'react';
import { Avatar, Pill } from '../../shared/ui/atoms';
import type { BetaReader } from './types';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import styles from './ReaderMatcher.module.css';

type MatcherState = 'idle' | 'searching' | 'results';

interface MatchedReader extends BetaReader {
  matchScore: number;
  matchedGenres: string[];
}

interface Props {
  manuscriptId: string;
  manuscriptTitle: string;
  genres: string[];
  onInvite: (reader: BetaReader) => void;
}

export default function ReaderMatcher({ manuscriptId: _manuscriptId, manuscriptTitle, genres, onInvite }: Props) {
  const { session }             = useAuth();
  const [state, setState]       = useState<MatcherState>('idle');
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [pool, setPool]         = useState<BetaReader[]>([]);

  useEffect(() => {
    if (!session?.token) return;
    void api.get<BetaReader[]>('/api/authors/readers/available')
      .then(readers => { if (readers.length > 0) setPool(readers); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  const matches = useMemo<MatchedReader[]>(() => (
    pool
      .filter(r => r.availability === 'available')
      .map(r => ({
        ...r,
        matchedGenres: r.genres.filter(g => genres.includes(g)),
        matchScore:    r.genres.filter(g => genres.includes(g)).length,
      }))
      .filter(r => r.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore || b.booksRead - a.booksRead)
      .slice(0, 5)
  ), [pool, genres.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  function runSearch() {
    setState('searching');
    setTimeout(() => setState('results'), 1500);
  }

  function invite(reader: BetaReader) {
    onInvite(reader);
    setInvitedIds(prev => new Set([...prev, reader.id]));
  }

  function reset() {
    setState('idle');
    setInvitedIds(new Set());
  }

  // ── Idle ──────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className={styles.box}>
        <div className={styles.idleRow}>
          <div className={styles.idleText}>
            <div className="label">Beta reader matching</div>
            <p className={styles.idleTagline}>
              Find readers with experience in{' '}
              {genres.map((g, i) => (
                <span key={g}>
                  {i > 0 && ' & '}<strong>{g}</strong>
                </span>
              ))}.
            </p>
          </div>
          <button className={styles.findBtn} onClick={runSearch}>
            Find matches →
          </button>
        </div>
      </div>
    );
  }

  // ── Searching ─────────────────────────────────────────────────
  if (state === 'searching') {
    return (
      <div className={styles.box}>
        <div className={styles.searching}>
          <div className={styles.searchingTrack}>
            <div className={styles.searchingBar} />
          </div>
          <p className={styles.searchingText}>
            Scanning readers in {genres.join(', ')}…
          </p>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────
  return (
    <div className={styles.box}>
      <div className={styles.resultsHead}>
        <span className={styles.resultsCount}>
          {matches.length} readers matched
        </span>
        <span className={styles.resultsFor}>
          <em>{manuscriptTitle}</em> · {genres.join(' · ')}
        </span>
        <button className={styles.closeBtn} onClick={reset}>✕</button>
      </div>

      <div className={styles.resultsList}>
        {matches.map(r => {
          const invited = invitedIds.has(r.id);
          const isStrong = r.matchScore >= 2;
          return (
            <div
              key={r.id}
              className={styles.card}
              data-invited={invited ? '' : undefined}
            >
              <div className={styles.cardHead}>
                <Avatar initials={r.initials} tone={r.tone} size={36} />
                <div className={styles.cardMeta}>
                  <div className={styles.cardNameRow}>
                    <span className={styles.cardName}>{r.name}</span>
                    <Pill tone={isStrong ? 'good' : 'neutral'}>
                      {isStrong ? 'Strong match' : 'Good match'}
                    </Pill>
                  </div>
                  <div className={styles.cardGenres}>
                    {r.genres.map(g => (
                      <span
                        key={g}
                        className={styles.genreTag}
                        data-match={(r as MatchedReader).matchedGenres.includes(g) ? '' : undefined}
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                  <div className={styles.cardStats}>
                    {r.booksRead} books read · ★ {r.avgRating} · responds in {r.responseTime}
                  </div>
                </div>
              </div>

              <p className={styles.cardBio}>{r.bio}</p>

              {invited ? (
                <div className={styles.sentRow}>
                  <span className={styles.sentLabel}>Notification sent ✓</span>
                  <span className={styles.sentSub}>
                    {r.name.split(' ')[0]} will receive details about {manuscriptTitle}.
                  </span>
                </div>
              ) : (
                <button className={styles.inviteBtn} onClick={() => invite(r)}>
                  Invite to read →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
