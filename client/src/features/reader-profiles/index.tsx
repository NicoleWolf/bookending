import React, { useState, useMemo } from 'react';
import { Avatar, Pill, SectionHead } from '../../shared/ui/atoms';
import { useAuth } from '../auth';
import { READER_PROFILES, ALL_READER_GENRES } from './data';
import type { ReaderProfile } from './types';
import type { Manuscript } from '../editing/types';
import { MANUSCRIPT_META, DEFAULT_EDITING_META } from '../editing/data';
import type { BookMetadata } from '../library/data';
import styles from './ReaderProfiles.module.css';

// ── Helpers ───────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type LabelEntry = { category: string; label: string };

function getLabels(reader: ReaderProfile): LabelEntry[] {
  const { completionRate, avgInlineComments, booksCompleted, avgTurnaroundDays, authorsWorkedWith } = reader.stats;
  const entries: LabelEntry[] = [];

  if (completionRate >= 94)      entries.push({ category: 'Devotion',    label: 'Devout' });
  else if (completionRate >= 88) entries.push({ category: 'Devotion',    label: 'Steadfast' });
  else if (completionRate >= 82) entries.push({ category: 'Devotion',    label: 'Earnest' });

  if (avgInlineComments >= 48)      entries.push({ category: 'Scrutiny', label: 'Exacting' });
  else if (avgInlineComments >= 34) entries.push({ category: 'Scrutiny', label: 'Assiduous' });
  else if (avgInlineComments >= 22) entries.push({ category: 'Scrutiny', label: 'Attentive' });

  if (booksCompleted >= 32)      entries.push({ category: 'Experience', label: 'Seasoned' });
  else if (booksCompleted >= 18) entries.push({ category: 'Experience', label: 'Practised' });

  if (avgTurnaroundDays <= 11)      entries.push({ category: 'Celerity', label: 'Expeditious' });
  else if (avgTurnaroundDays <= 15) entries.push({ category: 'Celerity', label: 'Prompt' });
  else if (avgTurnaroundDays <= 22) entries.push({ category: 'Celerity', label: 'Measured' });

  if (authorsWorkedWith >= 19)      entries.push({ category: 'Range', label: 'Cosmopolitan' });
  else if (authorsWorkedWith >= 11) entries.push({ category: 'Range', label: 'Discerning' });

  return entries;
}

// ── Props ─────────────────────────────────────────────────────────

interface Props {
  savedBooks: Record<number, BookMetadata>;
}

// ── Invite modal ──────────────────────────────────────────────────

type InviteStep = 'form' | 'preview' | 'sent';

function ReaderInviteModal({ reader, manuscripts, onClose }: {
  reader: ReaderProfile;
  manuscripts: Manuscript[];
  onClose: () => void;
}) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<InviteStep>('form');
  const [msId, setMsId] = useState(manuscripts[0]?.id ?? 0);
  const [note, setNote] = useState('');

  const ms = manuscripts.find(m => m.id === msId) ?? manuscripts[0];

  // No manuscripts — prompt to add one first
  if (!manuscripts.length) {
    return (
      <div className={styles.inviteOverlay} onClick={onClose}>
        <div className={styles.inviteModal} onClick={e => e.stopPropagation()}>
          <div className={styles.inviteHead}>
            <span className={styles.inviteHeadTitle}>Invite to beta read</span>
            <button className={styles.inviteClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.inviteFormBody}>
            <p className={styles.inviteNoMs}>
              You don't have any manuscripts yet. Add one from the Manuscripts section first, then come back to invite beta readers.
            </p>
          </div>
          <div className={styles.inviteFoot}>
            <button className={styles.inviteBtnGhost} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sent ──────────────────────────────────────────────────────
  if (step === 'sent') {
    return (
      <div className={styles.inviteOverlay} onClick={onClose}>
        <div className={styles.inviteModal} onClick={e => e.stopPropagation()}>
          <div className={styles.inviteSentBody}>
            <div className={styles.inviteSentIcon}>✓</div>
            <p className={styles.inviteSentTitle}>Invite sent to {reader.name.split(' ')[0]}</p>
            <p className={styles.inviteSentSub}>
              They'll appear in your readers list as pending until they accept and log in to Bookending.
            </p>
            <div className={styles.inviteSentActions}>
              <button className={styles.inviteBtnGhost} onClick={onClose}>Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview ───────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <div className={styles.inviteOverlay} onClick={onClose}>
        <div className={styles.inviteModal} onClick={e => e.stopPropagation()}>
          <div className={styles.inviteHead}>
            <span className={styles.inviteHeadTitle}>Preview invite</span>
            <button className={styles.inviteClose} onClick={onClose}>✕</button>
          </div>
          <div className={styles.invitePreviewBody}>
            <p className={styles.invitePreviewHint}>This is what {reader.name.split(' ')[0]} will receive.</p>
            <div className={styles.inviteCard}>
              <div className={styles.inviteCardHead}>
                <span className={styles.inviteCardBrand}>Bookending</span>
              </div>
              <div className={styles.inviteCardBody}>
                <p className={styles.inviteCardHeading}>You've been invited to read a manuscript.</p>
                <div className={styles.inviteCardMs}>
                  <div className={styles.inviteCardMsTitle}>{ms?.title}</div>
                  <div className={styles.inviteCardMsMeta}>
                    {ms?.draft.toUpperCase()} · {ms?.words.toLocaleString()} words · {ms?.chapters} chapters
                  </div>
                </div>
                {note.trim() && (
                  <blockquote className={styles.inviteCardNote}>"{note.trim()}"</blockquote>
                )}
                <p className={styles.inviteCardFrom}>
                  Invited by <strong>{currentUser?.name ?? 'the author'}</strong>
                </p>
                <div className={styles.inviteCardCta}>Accept invitation →</div>
              </div>
            </div>
          </div>
          <div className={styles.inviteFoot}>
            <button className={styles.inviteBtnGhost} onClick={() => setStep('form')}>← Back</button>
            <button className={styles.inviteBtnPrimary} onClick={() => setStep('sent')}>Send invite</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div className={styles.inviteOverlay} onClick={onClose}>
      <div className={styles.inviteModal} onClick={e => e.stopPropagation()}>
        <div className={styles.inviteHead}>
          <span className={styles.inviteHeadTitle}>Invite {reader.name} to beta read</span>
          <button className={styles.inviteClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.inviteFormBody}>
          <div className={styles.inviteReaderRow}>
            <Avatar initials={reader.initials} tone={reader.tone} size={36} />
            <div>
              <div className={styles.inviteReaderName}>{reader.name}</div>
              <div className={styles.inviteReaderMeta}>
                {reader.location} · {reader.stats.booksCompleted} books · {reader.stats.completionRate}% completion
              </div>
            </div>
          </div>

          <div className={styles.inviteField}>
            <label className={styles.inviteLabel}>Manuscript to share</label>
            <div className={styles.inviteMsOptions}>
              {manuscripts.map(m => (
                <label
                  key={m.id}
                  className={styles.inviteMsOption}
                  data-active={msId === m.id ? '' : undefined}
                >
                  <input
                    type="radio"
                    name="ms"
                    className={styles.inviteRadio}
                    checked={msId === m.id}
                    onChange={() => setMsId(m.id)}
                  />
                  <div className={styles.inviteMsOptionText}>
                    <span className={styles.inviteMsTitle}>{m.title}</span>
                    <span className={styles.inviteMsMeta}>
                      {m.draft} · {m.words.toLocaleString()} words · {m.chapters} chapters
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.inviteField}>
            <label className={styles.inviteLabel}>
              Personal note <span className={styles.inviteLabelOpt}>(optional)</span>
            </label>
            <textarea
              className={styles.inviteTextarea}
              placeholder="Tell them what kind of feedback you're looking for…"
              value={note}
              rows={3}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.inviteFoot}>
          <button className={styles.inviteBtnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.inviteBtnPrimary} onClick={() => setStep('preview')}>
            Preview invite →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reader card ───────────────────────────────────────────────────

function ReaderCard({ reader, onSelect, onInvite }: {
  reader: ReaderProfile;
  onSelect: () => void;
  onInvite: (e: React.MouseEvent) => void;
}) {
  return (
    <div className={styles.card} onClick={onSelect}>
      <div className={styles.cardHead}>
        <div className={styles.cardAvatarWrap}>
          <Avatar initials={reader.initials} tone={reader.tone} size={44} />
          <span className={styles.availPip} data-open={reader.availability === 'open' ? '' : undefined} />
        </div>
        <div className={styles.cardMeta}>
          <div className={styles.cardName}>{reader.name}</div>
          <div className={styles.cardLocation}>{reader.location}</div>
          <div className={styles.cardGenres}>
            {reader.genrePreferences.map(g => (
              <span key={g} className={styles.genreTag}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      <p className={styles.cardBio}>{reader.bio}</p>

      <div className={styles.labelsRow}>
        {getLabels(reader).map((e, i, arr) => (
          <span key={e.category}>
            <span className={`serif ${styles.readerLabel}`}>{e.label}</span>
            {i < arr.length - 1 && <span className={styles.labelDot}> · </span>}
          </span>
        ))}
      </div>

      <div className={styles.cardFoot}>
        <Pill tone={reader.availability === 'open' ? 'good' : 'neutral'}>
          {reader.availability === 'open' ? 'Open' : 'Closed'}
        </Pill>
        <button
          className={styles.cardInviteBtn}
          data-disabled={reader.availability === 'closed' ? '' : undefined}
          onClick={onInvite}
        >
          Invite to beta →
        </button>
      </div>
    </div>
  );
}

// ── Profile page ──────────────────────────────────────────────────

function ReaderProfilePage({ reader, manuscripts, onBack, onInvite }: {
  reader: ReaderProfile;
  manuscripts: Manuscript[];
  onBack: () => void;
  onInvite: () => void;
}) {
  const { currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === reader.id;

  return (
    <div className={styles.profileWrap}>
      <button className={styles.backBtn} onClick={onBack}>← All readers</button>

      {/* Header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileHeaderLeft}>
          <div className={styles.profileAvatarWrap}>
            <Avatar initials={reader.initials} tone={reader.tone} size={64} />
            <span
              className={styles.profileAvailPip}
              data-open={reader.availability === 'open' ? '' : undefined}
            />
          </div>
          <div>
            <div className={styles.profileName}>
              {reader.name}
              {isOwnProfile && <span className={styles.profileYou}>you</span>}
            </div>
            <div className={styles.profileLocation}>{reader.location}</div>
            <div className={styles.profileGenres}>
              {reader.genrePreferences.map(g => (
                <span key={g} className={styles.genreTag}>{g}</span>
              ))}
            </div>
            <div className={styles.profileJoined}>Beta reader since {fmtDate(reader.joinedAt)}</div>
          </div>
        </div>
        <div className={styles.profileHeaderRight}>
          <Pill tone={reader.availability === 'open' ? 'good' : 'neutral'}>
            {reader.availability === 'open' ? 'Open to requests' : 'Not accepting manuscripts'}
          </Pill>
          {!isOwnProfile && (
            <button
              className={styles.inviteBtnLarge}
              data-disabled={reader.availability === 'closed' ? '' : undefined}
              onClick={reader.availability === 'open' ? onInvite : undefined}
            >
              Invite to beta read
            </button>
          )}
        </div>
      </div>

      {/* Character labels strip */}
      {(() => {
        const labels = getLabels(reader);
        if (!labels.length) return null;
        return (
          <div className={styles.profileLabelsStrip}>
            {labels.map((e, i) => (
              <React.Fragment key={e.category}>
                {i > 0 && <div className={styles.stripDiv} />}
                <div className={styles.profileLabelCell}>
                  <span className={styles.profileLabelCategory}>{e.category}</span>
                  <span className={`serif ${styles.profileLabelValue}`}>{e.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        );
      })()}

      {/* Body */}
      <div className={styles.profileBody}>
        <div className={styles.profileSection}>
          <div className={styles.profileSectionLabel}>About</div>
          <p className={`serif ${styles.profileBio}`}>{reader.bio}</p>
        </div>

        <div className={styles.profileSection}>
          <div className={styles.profileSectionLabel}>Genre preferences</div>
          <div className={styles.genreList}>
            {reader.genrePreferences.map(g => (
              <div key={g} className={styles.genreListItem}>
                <span className={styles.genreListName}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────

export default function ReaderProfiles({ savedBooks }: Props) {
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [inviteTarget, setInviteTarget] = useState<ReaderProfile | null>(null);
  const [filters, setFilters] = useState<{
    genre: string | null;
    availability: 'all' | 'open';
  }>({ genre: null, availability: 'all' });

  const manuscripts = useMemo<Manuscript[]>(
    () => Object.values(savedBooks).map(b => ({
      id: b.id,
      title: b.title,
      ...(MANUSCRIPT_META[b.id] ?? DEFAULT_EDITING_META),
    })),
    [savedBooks],
  );

  const filtered = READER_PROFILES.filter(r => {
    if (filters.availability === 'open' && r.availability !== 'open') return false;
    if (filters.genre && !r.genrePreferences.includes(filters.genre)) return false;
    return true;
  });

  const selected = selectedId
    ? READER_PROFILES.find(r => r.id === selectedId) ?? null
    : null;

  function handleInviteFromCard(e: React.MouseEvent, reader: ReaderProfile) {
    e.stopPropagation();
    if (reader.availability === 'closed') return;
    setInviteTarget(reader);
  }

  return (
    <>
      {selected ? (
        <ReaderProfilePage
          reader={selected}
          manuscripts={manuscripts}
          onBack={() => setSelectedId(null)}
          onInvite={() => setInviteTarget(selected)}
        />
      ) : (
        <section>
          <div className={styles.sectionHeader}>
            <SectionHead
              eyebrow="Writing · Readers"
              title="Beta reader directory"
              kicker={`${filtered.length} of ${READER_PROFILES.length} readers · ${READER_PROFILES.filter(r => r.availability === 'open').length} open`}
            />
          </div>

          {/* Filter bar */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Genre</span>
              <div className={styles.filterPills}>
                <button
                  className={styles.filterPill}
                  data-active={filters.genre === null ? '' : undefined}
                  onClick={() => setFilters(f => ({ ...f, genre: null }))}
                >
                  All
                </button>
                {ALL_READER_GENRES.map(g => (
                  <button
                    key={g}
                    className={styles.filterPill}
                    data-active={filters.genre === g ? '' : undefined}
                    onClick={() => setFilters(f => ({ ...f, genre: f.genre === g ? null : g }))}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Availability</span>
              <div className={styles.filterToggle}>
                <button
                  className={styles.filterToggleBtn}
                  data-active={filters.availability === 'all' ? '' : undefined}
                  onClick={() => setFilters(f => ({ ...f, availability: 'all' }))}
                >
                  All
                </button>
                <button
                  className={styles.filterToggleBtn}
                  data-active={filters.availability === 'open' ? '' : undefined}
                  onClick={() => setFilters(f => ({ ...f, availability: 'open' }))}
                >
                  Open only
                </button>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={styles.emptyState}>No readers match the current filters.</div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(r => (
                <ReaderCard
                  key={r.id}
                  reader={r}
                  onSelect={() => setSelectedId(r.id)}
                  onInvite={e => handleInviteFromCard(e, r)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {inviteTarget && (
        <ReaderInviteModal
          reader={inviteTarget}
          manuscripts={manuscripts}
          onClose={() => setInviteTarget(null)}
        />
      )}
    </>
  );
}
