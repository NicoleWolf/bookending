import type { CSSProperties } from 'react';
import { useState, useEffect } from 'react';
import { SectionHead, Avatar, Pill, Btn } from '../../shared/ui/atoms';
import { IconArrow } from '../../shared/ui/icons';
import { useAuth } from '../auth';
import type { AuthorProfile, AuthorTone, ActivityType, QAEntry, PendingQuestion, ProfileTab, FeaturedProject } from './types';
import type { AppNotification } from '../notifications/data';
import { timeAgo } from '../notifications/data';
import styles from './AuthorProfiles.module.css';

import { api } from '../../lib/api';

const TONES: AuthorTone[] = ['accent', 'gold', 'muted', 'ink', 'paper'];
function toneForId(id: string): AuthorTone {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TONES[sum % TONES.length]!;
}

import type { AuthorRecord } from '@bookending/shared';

function recordToProfile(r: AuthorRecord): AuthorProfile {
  const words = r.name.trim().split(/\s+/);
  const initials = ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
  let genres: string[] = [];
  try { if (r.genres) genres = JSON.parse(r.genres) as string[]; } catch { /* noop */ }

  const featuredMs = r.featuredManuscriptId
    ? r.manuscripts.find(m => m.id === r.featuredManuscriptId)
    : undefined;
  const featuredProject: FeaturedProject | undefined = featuredMs ? {
    id:          featuredMs.id,
    title:       featuredMs.title,
    genre:       featuredMs.genre ?? null,
    subgenre:    featuredMs.subgenre ?? null,
    wordCount:   featuredMs.wordCount ?? 0,
    status:      featuredMs.status ?? 'DRAFTING',
    createdAt:   featuredMs.createdAt ?? r.createdAt,
    description: featuredMs.description ?? null,
    betaMode:    featuredMs.betaMode ?? 'CLOSED',
  } : undefined;

  return {
    id:             r.id,
    name:           r.name,
    initials,
    tone:           toneForId(r.id),
    location:       r.location ?? '',
    bio:            r.bio ?? '',
    writingProcess: r.writingProcess ?? '',
    genres,
    joinedAt:       r.createdAt,
    followerCount:  0,
    titles:         r.manuscripts.length,
    featuredProject,
    activity:       [],
    qa: r.authorQa
      .filter(q => q.answer && q.publishedAt)
      .map(q => ({ id: q.id, question: q.question, answer: q.answer!, askedAt: q.publishedAt! })),
    pendingQuestions: [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  drafting:      'Drafting',
  'in-revision': 'In Revision',
  'in_revision': 'In Revision',
  complete:      'Complete',
  published:     'Published',
};

const STATUS_TONE: Record<string, 'neutral' | 'accent' | 'good'> = {
  drafting:      'accent',
  'in-revision': 'neutral',
  'in_revision': 'neutral',
  complete:      'good',
  published:     'good',
};

const ACTIVITY_ICON: Record<ActivityType, string> = {
  started:     '◎',
  milestone:   '◈',
  chapter:     '▶',
  beta_opened: '◉',
  revision:    '◐',
  published:   '★',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function pct(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100));
}

// ── ARC affordance ────────────────────────────────────────────────

interface ArcProgramViewShared {
  id: string; isOpen: boolean; mode: 'MANUAL' | 'AUTO'; cap: number | null;
  reviewDeadline: string | null; launchDate: string | null; openedAt: string | null;
  acceptedCount: number; pendingCount: number;
  myApplication: {
    id: string; status: string; appliedAt: string;
    decidedAt: string | null; readingProgress: number;
  } | null;
}

function ArcAffordance({ program, authorFirstName, followed, followerCount, onApply, onContinueReading, onToggleFollow, onWithdraw }: {
  program: ArcProgramViewShared;
  authorFirstName: string;
  followed: boolean;
  followerCount: number;
  onApply: () => void;
  onContinueReading: () => void;
  onToggleFollow: () => void;
  onWithdraw: () => Promise<void>;
}) {
  const [withdrawing, setWithdrawing] = useState(false);
  const app = program.myApplication;
  const status = app?.status;
  const isFull = program.isOpen && program.cap !== null && program.acceptedCount >= program.cap;

  function fmtShort(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  function fmtSubmitted(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    await onWithdraw();
    setWithdrawing(false);
  }

  // ── State: ACCEPTED / reading ──────────────────────────────────
  if (status === 'ACCEPTED') {
    const progress = Math.round(app!.readingProgress);
    return (
      <div className={styles.arcBlock} data-arc-state="accepted">
        <div className={styles.arcRule} />
        <div className={styles.arcDotRow}>
          <span className={styles.arcDot} data-tone="good" />
          <span className={`label ${styles.arcEyebrow}`}>You&apos;re an early reader</span>
        </div>
        <p className={`serif ${styles.arcHeadline}`}>
          Welcome in. You&apos;re reading <em>{/* manuscript title not in scope here */}</em>
        </p>
        {(program.reviewDeadline || program.launchDate) && (
          <p className={styles.arcBody}>
            {program.reviewDeadline && <>Review due {fmtShort(program.reviewDeadline)}</>}
            {program.reviewDeadline && program.launchDate && ', '}
            {program.launchDate && <>ahead of the {fmtShort(program.launchDate)} launch</>}
            {'. Step back any time — it’s better than a missed deadline.'}
          </p>
        )}
        <div className={styles.arcCTARow}>
          <button className={styles.arcPrimaryBtn} onClick={onContinueReading}>
            Continue reading →
          </button>
          {progress > 0 && (
            <span className={styles.arcSocialProof}>{progress}% read</span>
          )}
        </div>
      </div>
    );
  }

  // ── State: PENDING / awaiting decision ─────────────────────────
  if (status === 'PENDING') {
    return (
      <div className={styles.arcBlock} data-arc-state="pending">
        <div className={styles.arcRule} />
        <div className={styles.arcDotRow}>
          <span className={styles.arcDot} data-tone="accent" />
          <span className={`label ${styles.arcEyebrow}`}>Application submitted</span>
        </div>
        <p className={`serif ${styles.arcHeadline}`}>
          Your application is with {authorFirstName}.
        </p>
        <p className={styles.arcBody}>
          {program.mode === 'MANUAL'
            ? `The author personally reviews each application.`
            : 'You’ll hear back soon.'}
          {program.reviewDeadline && ` You’ll hear back by ${fmtShort(program.reviewDeadline)}.`}
        </p>
        <div className={styles.arcCTARow}>
          <button
            className={styles.arcGhostBtn}
            onClick={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? '…' : 'Withdraw application'}
          </button>
          {app?.appliedAt && (
            <span className={styles.arcSocialProof}>Submitted {fmtSubmitted(app.appliedAt)}</span>
          )}
        </div>
      </div>
    );
  }

  // ── State: DECLINED ────────────────────────────────────────────
  if (status === 'DECLINED') {
    return (
      <div className={styles.arcBlock} data-arc-state="declined">
        <div className={styles.arcRule} />
        <div className={styles.arcDotRow}>
          <span className={styles.arcDot} data-tone="muted" />
          <span className={`label ${styles.arcEyebrow}`}>Not selected this time</span>
        </div>
        <p className={`serif ${styles.arcHeadline}`}>
          {authorFirstName} has the readers {authorFirstName === authorFirstName ? 'she' : 'they'} needs for this one.
        </p>
        <p className={styles.arcBody}>
          That&apos;s not a verdict on your reading — every program shapes its own group.
          Follow {authorFirstName}, and you&apos;ll be first in line when the next project opens.
        </p>
        <div className={styles.arcCTARow}>
          <button
            className={followed ? styles.arcGhostBtn : styles.arcPrimaryBtn}
            onClick={onToggleFollow}
          >
            {followed ? `Following ${authorFirstName}` : `Follow ${authorFirstName}`}
          </button>
          {app?.decidedAt && (
            <span className={styles.arcSocialProof}>Notified {fmtShort(app.decidedAt)}</span>
          )}
        </div>
      </div>
    );
  }

  // ── State: WITHDRAWN ───────────────────────────────────────────
  if (status === 'WITHDRAWN') {
    return (
      <div className={styles.arcBlock} data-arc-state="withdrawn">
        <div className={styles.arcRule} />
        <div className={styles.arcDotRow}>
          <span className={styles.arcDot} data-tone="muted" />
          <span className={`label ${styles.arcEyebrow}`}>You stepped back from this one</span>
        </div>
        {program.isOpen && !isFull ? (
          <>
            <p className={styles.arcBody}>Changed your mind? The program is still open.</p>
            <button className={styles.arcPrimaryBtn} onClick={onApply}>
              Apply again →
            </button>
          </>
        ) : (
          <p className={styles.arcBody}>
            Follow {authorFirstName} and you&apos;ll hear about the next one.
          </p>
        )}
      </div>
    );
  }

  // ── State: FULFILLED ───────────────────────────────────────────
  if (status === 'FULFILLED') {
    return (
      <div className={styles.arcBlock} data-arc-state="fulfilled">
        <div className={styles.arcRule} />
        <div className={styles.arcDotRow}>
          <span className={styles.arcDot} data-tone="good" />
          <span className={`label ${styles.arcEyebrow}`}>Early reader credit earned</span>
        </div>
        <p className={styles.arcBody}>Your review is posted. This credit stays with your profile.</p>
      </div>
    );
  }

  // ── State: PROGRAM IS FULL (no application, cap reached) ───────
  if (isFull) {
    return (
      <div className={styles.arcBlock} data-arc-state="full">
        <div className={styles.arcRule} />
        <div className={styles.arcDotRow}>
          <span className={styles.arcDot} data-tone="muted" />
          <span className={`label ${styles.arcEyebrow}`}>Early reader program is full</span>
        </div>
        <p className={`serif ${styles.arcHeadline}`}>
          {program.acceptedCount === 1 ? 'One reader is' : `${program.acceptedCount} readers are`} reading the manuscript right now.
        </p>
        <div className={styles.arcCTARow}>
          <button
            className={followed ? styles.arcGhostBtn : styles.arcPrimaryBtn}
            onClick={onToggleFollow}
          >
            {followed ? `Following ${authorFirstName}` : `Follow ${authorFirstName} for the launch`}
          </button>
          {followerCount > 0 && (
            <span className={styles.arcSocialProof}>{followerCount.toLocaleString()} followers</span>
          )}
        </div>
      </div>
    );
  }

  // ── State: OPEN & ELIGIBLE ────────────────────────────────────
  if (program.isOpen) {
    return (
      <div className={styles.arcBlock} data-arc-state="open">
        <div className={styles.arcRule} />
        <div className={styles.arcDotRow}>
          <span className={styles.arcDot} data-tone="accent" />
          <span className={`label ${styles.arcEyebrow}`}>Open for early readers</span>
        </div>
        <p className={`serif ${styles.arcHeadline}`}>Read it before anyone else does.</p>
        <p className={styles.arcBody}>
          {program.mode === 'MANUAL'
            ? `The author personally reviews each application.`
            : `Accepted on submission${program.cap ? ` — up to ${program.cap} readers` : ''}.`}
        </p>
        {(program.reviewDeadline || program.launchDate) && (
          <div className={styles.arcMetaGrid}>
            {program.reviewDeadline && (
              <div className={styles.arcMetaCell}>
                <span className={`label ${styles.arcMetaLabel}`}>Review due</span>
                <span className={styles.arcMetaVal}>{fmtShort(program.reviewDeadline)}</span>
              </div>
            )}
            {program.launchDate && (
              <div className={styles.arcMetaCell}>
                <span className={`label ${styles.arcMetaLabel}`}>Launches</span>
                <span className={styles.arcMetaVal}>{fmtShort(program.launchDate)}</span>
              </div>
            )}
          </div>
        )}
        <div className={styles.arcCTARow}>
          <button className={styles.arcPrimaryBtn} onClick={onApply}>
            Apply for early access →
          </button>
          {(program.acceptedCount > 0 || program.pendingCount > 0) && (
            <span className={styles.arcSocialProof}>
              {[
                program.acceptedCount > 0 && `${program.acceptedCount} reading`,
                program.pendingCount > 0 && `${program.pendingCount} under review`,
              ].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── State: NOT YET OPEN ────────────────────────────────────────
  return (
    <div className={styles.arcBlock} data-arc-state="not-open">
      <div className={styles.arcRule} />
      <div className={styles.arcDotRow}>
        <span className={styles.arcDot} data-tone="muted" />
        <span className={`label ${styles.arcEyebrow}`}>Early reader applications</span>
      </div>
      <p className={styles.arcBody}>
        {authorFirstName} hasn&apos;t opened applications for this project yet. Follow{' '}
        {authorFirstName} and we&apos;ll let you know the moment they do.
      </p>
      <button
        className={followed ? styles.arcGhostBtn : styles.arcPrimaryBtn}
        onClick={onToggleFollow}
      >
        {followed ? `Following ${authorFirstName}` : 'Follow to be notified'}
      </button>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────

interface Props {
  followedAuthors: Set<string>;
  onToggleFollow: (author: AuthorProfile) => void;
  onNotify: (n: AppNotification) => void;
  target?: { authorId: string; tab: ProfileTab } | null;
  onTargetConsumed?: () => void;
  onApplyForArc?: (manuscriptId: string) => void;
  onContinueArcReading?: (manuscriptId: string) => void;
}

// ── Directory card ────────────────────────────────────────────────

function AuthorCard({ author, followed, onFollow, onSelect }: {
  author: AuthorProfile;
  followed: boolean;
  onFollow: (e: React.MouseEvent) => void;
  onSelect: () => void;
}) {
  const progress = author.currentProject
    ? pct(author.currentProject.wordCount, author.currentProject.targetWordCount)
    : null;

  return (
    <div className={styles.card} onClick={onSelect}>
      <div className={styles.cardHead}>
        <Avatar initials={author.initials} tone={author.tone} size={48} />
        <div className={styles.cardHeadMeta}>
          <div className={styles.cardName}>{author.name}</div>
          <div className={styles.cardLocation}>{author.location}</div>
          <div className={styles.cardGenres}>
            {author.genres.map(g => (
              <span key={g} className={styles.genreTag}>{g}</span>
            ))}
          </div>
        </div>
      </div>

      <p className={styles.cardBio}>{author.bio}</p>

      {author.currentProject && (
        <div className={styles.cardProject}>
          <div className={styles.cardProjectLabel}>Currently writing</div>
          <div className={styles.cardProjectTitle}>{author.currentProject.title}</div>
          {progress !== null && (
            <div className={styles.cardProgress}>
              <div
                className={styles.cardProgressFill}
                style={{ '--pct': `${progress}%` } as CSSProperties}
              />
              <span className={styles.cardProgressPct}>{progress}%</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.cardFoot}>
        <div className={styles.cardStats}>
          <span className={styles.cardStat}>{author.titles} {author.titles === 1 ? 'title' : 'titles'}</span>
          <span className={styles.cardStatDot}>·</span>
          <span className={styles.cardStat}>{author.followerCount.toLocaleString()} followers</span>
        </div>
        <button
          className={styles.followBtn}
          data-following={followed ? '' : undefined}
          onClick={onFollow}
        >
          {followed ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );
}

// ── Profile page ──────────────────────────────────────────────────

function AuthorProfilePage({ author, followed, onToggleFollow, onBack, onNotify, initialTab, onApplyForArc, onContinueArcReading }: {
  author: AuthorProfile;
  followed: boolean;
  onToggleFollow: () => void;
  onBack: () => void;
  onNotify: (n: AppNotification) => void;
  initialTab?: ProfileTab;
  onApplyForArc?: (manuscriptId: string) => void;
  onContinueArcReading?: (manuscriptId: string) => void;
}) {
  const { currentUser, session } = useAuth();
  const [tab, setTab] = useState<ProfileTab>(initialTab ?? 'overview');
  const isOwnProfile = currentUser?.id === author.id;

  // Deep-link tab target (e.g. from notification CTA)
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const progress = author.currentProject
    ? pct(author.currentProject.wordCount, author.currentProject.targetWordCount)
    : null;

  const sortedActivity = [...author.activity].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ── ARC state ─────────────────────────────────────────────────
  interface ArcProgramView {
    id: string; isOpen: boolean; mode: 'MANUAL' | 'AUTO'; cap: number | null;
    reviewDeadline: string | null; launchDate: string | null; openedAt: string | null;
    acceptedCount: number; pendingCount: number;
    myApplication: {
      id: string; status: string; appliedAt: string;
      decidedAt: string | null; readingProgress: number;
    } | null;
  }
  const [arcProgram, setArcProgram] = useState<ArcProgramView | null>(null);

  useEffect(() => {
    if (!author.featuredProject) return;
    api.get<ArcProgramView | null>(`/api/manuscripts/${author.featuredProject.id}/arc/program`)
      .then(data => setArcProgram(data))
      .catch(() => {});
  }, [author.featuredProject?.id]);

  // ── Join state ────────────────────────────────────────────────
  const [joinState, setJoinState] = useState<'idle' | 'loading' | 'joined' | 'requested'>('idle');

  async function handleJoin() {
    if (!author.featuredProject || !session?.token) return;
    setJoinState('loading');
    try {
      await api.post(`/api/manuscripts/${author.featuredProject.id}/readers/join`);
      setJoinState('joined');
    } catch { setJoinState('idle'); }
  }

  async function handleRequest() {
    if (!author.featuredProject || !session?.token) return;
    setJoinState('loading');
    try {
      await api.post(`/api/manuscripts/${author.featuredProject.id}/readers/requests`, {});
      setJoinState('requested');
    } catch { setJoinState('idle'); }
  }

  // ── Q&A state ────────────────────────────────────────────────
  const [qaList,          setQaList]          = useState<QAEntry[]>(author.qa);
  const [pendingQs,       setPendingQs]       = useState<PendingQuestion[]>(author.pendingQuestions ?? []);
  const [answerDrafts,    setAnswerDrafts]    = useState<Record<string, string>>({});
  const [expandedAnswer,  setExpandedAnswer]  = useState<string | null>(null);

  // Load pending questions for own profile
  useEffect(() => {
    if (!isOwnProfile || !session?.token) return;
    void (async () => {
      try {
        const records = await api.get<{ id: string; question: string; askedByName: string | null; createdAt: string }[]>(
          `/api/authors/${author.id}/pending-questions`
        );
        if (records.length > 0) {
          setPendingQs(records.map(r => ({
            id: r.id,
            submitterId: '',
            submitterName: r.askedByName ?? 'Anonymous',
            question: r.question,
            submittedAt: r.createdAt,
          })));
        }
      } catch { /* local state remains */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnProfile, session?.token, author.id]);

  // Ask form state
  const [showAskForm,   setShowAskForm]   = useState(false);
  const [questionText,  setQuestionText]  = useState('');
  const [showThankYou,  setShowThankYou]  = useState(false);

  async function submitQuestion() {
    if (!questionText.trim() || !currentUser) return;
    const question = questionText.trim();
    if (session?.token) {
      try {
        const created = await api.post<{ id: string; createdAt: string }>(
          `/api/authors/${author.id}/questions`, { question }
        );
        setPendingQs(prev => [...prev, {
          id: created.id, submitterId: currentUser.id,
          submitterName: currentUser.name, question,
          submittedAt: created.createdAt,
        }]);
        setQuestionText(''); setShowAskForm(false); setShowThankYou(true);
        return;
      } catch { /* fall through */ }
    }
    // Fallback: local only
    setPendingQs(prev => [...prev, {
      id: String(Date.now()), submitterId: currentUser.id,
      submitterName: currentUser.name, question,
      submittedAt: new Date().toISOString(),
    }]);
    setQuestionText(''); setShowAskForm(false); setShowThankYou(true);
  }

  async function publishAnswer(q: PendingQuestion) {
    const answerText = answerDrafts[q.id]?.trim();
    if (!answerText) return;
    if (session?.token) {
      try {
        const updated = await api.patch<{ id: string; question: string; answer: string; publishedAt: string }>(
          `/api/authors/${author.id}/questions/${q.id}`, { answer: answerText }
        );
        setQaList(prev => [{ id: updated.id, question: updated.question, answer: updated.answer, askedAt: updated.publishedAt }, ...prev]);
        setPendingQs(prev => prev.filter(p => p.id !== q.id));
        setAnswerDrafts(prev => { const next = { ...prev }; delete next[q.id]; return next; });
        setExpandedAnswer(null);
        onNotify({
          id: `qa-answered-${q.id}-${Date.now()}`,
          type: 'QA_ANSWERED', stage: 'Author Profiles',
          message: `${author.name} answered your question: "${q.question.length > 65 ? q.question.slice(0, 65) + '…' : q.question}"`,
          read: false, receivedAt: new Date().toISOString(),
          cta: { label: 'View answer', authorId: author.id },
        });
        return;
      } catch { /* fall through */ }
    }
    // Fallback: local only
    setQaList(prev => [{ id: String(Date.now()), question: q.question, answer: answerText, askedAt: q.submittedAt }, ...prev]);
    setPendingQs(prev => prev.filter(p => p.id !== q.id));
    setAnswerDrafts(prev => { const next = { ...prev }; delete next[q.id]; return next; });
    setExpandedAnswer(null);
    onNotify({
      id: `qa-answered-${q.id}-${Date.now()}`,
      type: 'QA_ANSWERED', stage: 'Author Profiles',
      message: `${author.name} answered your question: "${q.question.length > 65 ? q.question.slice(0, 65) + '…' : q.question}"`,
      read: false, receivedAt: new Date().toISOString(),
      cta: { label: 'View answer', authorId: author.id },
    });
  }

  async function dismissQuestion(q: PendingQuestion) {
    setPendingQs(prev => prev.filter(p => p.id !== q.id));
    if (!session?.token) return;
    try {
      await api.patch(`/api/authors/${author.id}/questions/${q.id}`, { dismiss: true });
    } catch { /* already removed from local state */ }
  }

  return (
    <div className={styles.profileWrap}>
      {/* Back */}
      <button className={styles.backBtn} onClick={onBack}>
        ← All authors
      </button>

      {/* Header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileHeaderLeft}>
          <Avatar initials={author.initials} tone={author.tone} size={64} />
          <div>
            <div className={styles.profileName}>
              {author.name}
              {isOwnProfile && <span className={styles.profileYou}>you</span>}
            </div>
            <div className={styles.profileLocation}>{author.location}</div>
            <div className={styles.profileGenres}>
              {author.genres.map(g => (
                <span key={g} className={styles.genreTag}>{g}</span>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.profileHeaderRight}>
          <div className={styles.profileStats}>
            <div className={styles.profileStat}>
              <span className={`serif ${styles.profileStatVal}`}>{author.titles}</span>
              <span className={styles.profileStatLabel}>Titles</span>
            </div>
            <div className={styles.profileStat}>
              <span className={`serif ${styles.profileStatVal}`}>{author.followerCount.toLocaleString()}</span>
              <span className={styles.profileStatLabel}>Followers</span>
            </div>
            <div className={styles.profileStat}>
              <span className={`serif ${styles.profileStatVal}`}>{author.activity.length}</span>
              <span className={styles.profileStatLabel}>Updates</span>
            </div>
          </div>
          {!isOwnProfile && (
            <button
              className={styles.followBtnLarge}
              data-following={followed ? '' : undefined}
              onClick={onToggleFollow}
            >
              {followed ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.profileTabs}>
        {(['overview', 'activity', 'qa'] as ProfileTab[]).map(t => (
          <button
            key={t}
            className={styles.profileTab}
            data-active={tab === t ? '' : undefined}
            onClick={() => setTab(t)}
          >
            {t === 'overview'
              ? 'Overview'
              : t === 'activity'
              ? `Activity · ${author.activity.length}`
              : `Q&A · ${qaList.length}${isOwnProfile && pendingQs.length > 0 ? ` · ${pendingQs.length} pending` : ''}`}
          </button>
        ))}
        {arcProgram && (
          <button
            className={styles.profileTab}
            data-active={tab === 'arc' ? '' : undefined}
            onClick={() => setTab('arc')}
          >
            <span className={styles.arcTabDot} data-open={arcProgram.isOpen ? '' : undefined} />
            ARC
          </button>
        )}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className={styles.profileBody}>
          <div className={styles.profileGrid}>
            <div className={styles.profileMain}>
              <div className={styles.profileSection}>
                <div className={styles.profileSectionLabel}>About</div>
                <p className={`serif ${styles.profileBio}`}>{author.bio}</p>
                <div className={styles.profileMeta}>
                  <span className={styles.profileMetaItem}>Joined {fmtDate(author.joinedAt)}</span>
                  <span className={styles.profileMetaItem}>Based in {author.location}</span>
                </div>
              </div>

              <div className={styles.profileSection}>
                <div className={styles.profileSectionLabel}>Writing process</div>
                <p className={styles.profileProcess}>{author.writingProcess}</p>
              </div>
            </div>

            <div className={styles.profileSide}>
              {author.featuredProject && (
                <div className={styles.projectCard}>
                  <div className={styles.projectCardLabel}>Featured project</div>
                  <div className={`serif ${styles.projectTitle}`}>{author.featuredProject.title}</div>
                  {(author.featuredProject.genre || author.featuredProject.subgenre) && (
                    <div className={styles.projectGenre}>
                      {[author.featuredProject.genre, author.featuredProject.subgenre].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {author.featuredProject.description && (
                    <p className={styles.projectBlurb}>{author.featuredProject.description}</p>
                  )}
                  <div className={styles.projectStatus}>
                    <Pill tone={STATUS_TONE[author.featuredProject.status.toLowerCase().replace('_', '-')] ?? 'neutral'}>
                      {STATUS_LABEL[author.featuredProject.status.toLowerCase().replace('_', '-')] ?? author.featuredProject.status}
                    </Pill>
                    {author.featuredProject.wordCount > 0 && (
                      <span className={styles.projectStarted}>
                        {author.featuredProject.wordCount.toLocaleString()} words
                      </span>
                    )}
                  </div>
                  {!isOwnProfile && author.featuredProject.betaMode === 'PUBLIC' && (
                    <button
                      className={styles.joinBtn}
                      onClick={() => void handleJoin()}
                      disabled={joinState !== 'idle'}
                    >
                      {joinState === 'loading' ? '…' : joinState === 'joined' ? 'Reading' : 'Join beta read'}
                    </button>
                  )}
                  {!isOwnProfile && author.featuredProject.betaMode === 'REQUEST' && (
                    <button
                      className={styles.joinBtn}
                      onClick={() => void handleRequest()}
                      disabled={joinState !== 'idle'}
                    >
                      {joinState === 'loading' ? '…' : joinState === 'requested' ? 'Requested' : 'Request to read'}
                    </button>
                  )}
                  {!isOwnProfile && author.featuredProject.betaMode === 'INVITE_ONLY' && (
                    <div className={styles.inviteOnlyLabel}>Invite only</div>
                  )}

                  {/* ARC affordance — shown whenever the author has an ARC program on this project */}
                  {!isOwnProfile && arcProgram && (
                    <ArcAffordance
                      program={arcProgram}
                      authorFirstName={author.name.split(' ')[0] ?? author.name}
                      followed={followed}
                      followerCount={author.followerCount}
                      onApply={() => onApplyForArc?.(author.featuredProject!.id)}
                      onContinueReading={() => onContinueArcReading?.(author.featuredProject!.id)}
                      onToggleFollow={onToggleFollow}
                      onWithdraw={async () => {
                        try {
                          await api.post(`/api/manuscripts/${author.featuredProject!.id}/arc/withdraw`);
                          setArcProgram(prev => prev
                            ? { ...prev, myApplication: prev.myApplication
                                ? { ...prev.myApplication, status: 'WITHDRAWN' }
                                : null }
                            : null);
                        } catch { /* leave state as-is */ }
                      }}
                    />
                  )}
                </div>
              )}
              {!author.featuredProject && author.currentProject && (
                <div className={styles.projectCard}>
                  <div className={styles.projectCardLabel}>Current project</div>
                  <div className={`serif ${styles.projectTitle}`}>{author.currentProject.title}</div>
                  <div className={styles.projectGenre}>{author.currentProject.genre}</div>

                  <div className={styles.projectProgress}>
                    <div className={styles.projectProgressBar}>
                      <div
                        className={styles.projectProgressFill}
                        style={{ '--pct': `${progress}%` } as CSSProperties}
                      />
                    </div>
                    <div className={styles.projectProgressMeta}>
                      <span>{author.currentProject.wordCount.toLocaleString()} words</span>
                      <span>{progress}%</span>
                    </div>
                    <div className={styles.projectProgressTarget}>
                      of {author.currentProject.targetWordCount.toLocaleString()} target
                    </div>
                  </div>

                  <div className={styles.projectStatus}>
                    <Pill tone={STATUS_TONE[author.currentProject.status]}>
                      {STATUS_LABEL[author.currentProject.status]}
                    </Pill>
                    <span className={styles.projectStarted}>
                      Started {fmtDate(author.currentProject.startedAt)}
                    </span>
                  </div>
                </div>
              )}

              {sortedActivity.length > 0 && (
                <div className={styles.recentBox}>
                  <div className={styles.projectCardLabel}>Recent update</div>
                  <div className={styles.recentEvent}>
                    <span className={styles.recentIcon}>
                      {ACTIVITY_ICON[sortedActivity[0].type]}
                    </span>
                    <div>
                      <div className={styles.recentText}>{sortedActivity[0].text}</div>
                      <div className={styles.recentDate}>{timeAgo(sortedActivity[0].date)}</div>
                    </div>
                  </div>
                  <button className={styles.viewAllBtn} onClick={() => setTab('activity')}>
                    View all activity →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <div className={styles.profileBody}>
          {sortedActivity.length === 0 ? (
            <div className={styles.emptyState}>No activity posted yet.</div>
          ) : (
            <div className={styles.activityFeed}>
              {sortedActivity.map((event, i) => (
                <div key={event.id} className={styles.activityEvent} data-last={i === sortedActivity.length - 1 ? '' : undefined}>
                  <div className={styles.activityIconCol}>
                    <div className={styles.activityIcon}>{ACTIVITY_ICON[event.type]}</div>
                    {i < sortedActivity.length - 1 && <div className={styles.activityLine} />}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>{event.text}</div>
                    <div className={styles.activityDate}>{fmtDate(event.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Q&A */}
      {tab === 'qa' && (
        <div className={styles.profileBody}>

          {/* Owner: pending questions queue */}
          {isOwnProfile && pendingQs.length > 0 && (
            <div className={styles.pendingSection}>
              <div className={styles.pendingSectionHead}>
                <span className={styles.pendingLabel}>Pending questions</span>
                <span className={styles.pendingCount}>{pendingQs.length}</span>
              </div>
              {pendingQs.map(q => (
                <div key={q.id} className={styles.pendingCard}>
                  <div className={styles.pendingMeta}>
                    <span className={styles.pendingFrom}>from {q.submitterName}</span>
                    <span className={styles.pendingDate}>{fmtDate(q.submittedAt)}</span>
                  </div>
                  <p className={styles.pendingQuestion}>{q.question}</p>
                  {expandedAnswer === q.id ? (
                    <div className={styles.answerForm}>
                      <textarea
                        className={styles.answerTextarea}
                        placeholder="Write your answer…"
                        value={answerDrafts[q.id] ?? ''}
                        onChange={e => setAnswerDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                        rows={4}
                      />
                      <div className={styles.answerFormActions}>
                        <button
                          className={styles.answerPublishBtn}
                          onClick={() => void publishAnswer(q)}
                          disabled={!answerDrafts[q.id]?.trim()}
                        >
                          Publish answer
                        </button>
                        <button
                          className={styles.answerCancelBtn}
                          onClick={() => setExpandedAnswer(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.pendingActions}>
                      <button className={styles.answerBtn} onClick={() => setExpandedAnswer(q.id)}>
                        Answer
                      </button>
                      <button
                        className={styles.dismissQBtn}
                        onClick={() => void dismissQuestion(q)}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Visitor: ask form */}
          {!isOwnProfile && (
            <div className={styles.askSection}>
              {showAskForm ? (
                <div className={styles.askForm}>
                  <div className={styles.askFormLabel}>
                    Ask {author.name.split(' ')[0]} a question
                  </div>
                  <textarea
                    className={styles.askTextarea}
                    placeholder="What would you like to ask?"
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                    rows={3}
                    maxLength={500}
                    autoFocus
                  />
                  <div className={styles.askFormFoot}>
                    <span className={styles.askCharCount}>{questionText.length} / 500</span>
                    <div className={styles.askFormActions}>
                      <button
                        className={styles.askCancelBtn}
                        onClick={() => { setShowAskForm(false); setQuestionText(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.askSubmitBtn}
                        onClick={() => void submitQuestion()}
                        disabled={!questionText.trim()}
                      >
                        Submit question
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button className={styles.askToggleBtn} onClick={() => setShowAskForm(true)}>
                  + Ask {author.name.split(' ')[0]} a question
                </button>
              )}
            </div>
          )}

          {/* Published Q&As */}
          {qaList.length === 0 ? (
            <div className={styles.emptyState}>No questions answered yet.</div>
          ) : (
            <div className={styles.qaList}>
              {qaList.map(entry => (
                <div key={entry.id} className={styles.qaEntry}>
                  <div className={styles.qaQuestion}>
                    <span className={styles.qaQMark}>Q</span>
                    <p className={styles.qaQuestionText}>{entry.question}</p>
                  </div>
                  <div className={styles.qaAnswer}>
                    <span className={styles.qaAMark}>A</span>
                    <div className={styles.qaAnswerBody}>
                      <p className={`serif ${styles.qaAnswerText}`}>{entry.answer}</p>
                      <div className={styles.qaDate}>{fmtDate(entry.askedAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ARC tab */}
      {tab === 'arc' && arcProgram && (
        <div className={styles.profileBody}>
          <div className={styles.arcTabPage}>

            {/* Project context strip */}
            {author.featuredProject && (
              <div className={styles.arcTabProject}>
                <div className={styles.arcTabProjectMeta}>
                  <span className={`label ${styles.arcTabProjectLabel}`}>
                    {[author.featuredProject.genre, author.featuredProject.subgenre].filter(Boolean).join(' · ')}
                  </span>
                  <Pill tone={STATUS_TONE[author.featuredProject.status.toLowerCase().replace('_', '-')] ?? 'neutral'}>
                    {STATUS_LABEL[author.featuredProject.status.toLowerCase().replace('_', '-')] ?? author.featuredProject.status}
                  </Pill>
                </div>
                <div className={`serif ${styles.arcTabProjectTitle}`}>{author.featuredProject.title}</div>
                {author.featuredProject.description && (
                  <p className={styles.arcTabProjectDesc}>{author.featuredProject.description}</p>
                )}
              </div>
            )}

            {/* ARC block */}
            {isOwnProfile ? (
              <div className={styles.arcTabOwner}>
                <div className={styles.arcTabOwnerRow}>
                  <span className={`label ${styles.arcTabOwnerLabel}`}>
                    {arcProgram.isOpen ? 'Program is open' : 'Program is not open'}
                  </span>
                  <span className={styles.arcTabDot} data-open={arcProgram.isOpen ? '' : undefined} />
                </div>
                <div className={styles.arcTabOwnerGrid}>
                  <div className={styles.arcTabOwnerCell}>
                    <span className={`label ${styles.arcTabOwnerCellLabel}`}>Mode</span>
                    <span className={styles.arcTabOwnerCellVal}>
                      {arcProgram.mode === 'MANUAL' ? 'Manual review' : 'Auto-accept'}
                    </span>
                  </div>
                  {arcProgram.cap && (
                    <div className={styles.arcTabOwnerCell}>
                      <span className={`label ${styles.arcTabOwnerCellLabel}`}>Cap</span>
                      <span className={styles.arcTabOwnerCellVal}>{arcProgram.cap} readers</span>
                    </div>
                  )}
                  <div className={styles.arcTabOwnerCell}>
                    <span className={`label ${styles.arcTabOwnerCellLabel}`}>Reading now</span>
                    <span className={styles.arcTabOwnerCellVal}>{arcProgram.acceptedCount}</span>
                  </div>
                  <div className={styles.arcTabOwnerCell}>
                    <span className={`label ${styles.arcTabOwnerCellLabel}`}>Under review</span>
                    <span className={styles.arcTabOwnerCellVal}>{arcProgram.pendingCount}</span>
                  </div>
                  {arcProgram.reviewDeadline && (
                    <div className={styles.arcTabOwnerCell}>
                      <span className={`label ${styles.arcTabOwnerCellLabel}`}>Review due</span>
                      <span className={styles.arcTabOwnerCellVal}>
                        {new Date(arcProgram.reviewDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {arcProgram.launchDate && (
                    <div className={styles.arcTabOwnerCell}>
                      <span className={`label ${styles.arcTabOwnerCellLabel}`}>Launch date</span>
                      <span className={styles.arcTabOwnerCellVal}>
                        {new Date(arcProgram.launchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
                <p className={styles.arcTabOwnerNote}>
                  Manage applications, configure the program, and track reading progress in the ARC Hub.
                </p>
              </div>
            ) : (
              <ArcAffordance
                program={arcProgram}
                authorFirstName={author.name.split(' ')[0] ?? author.name}
                followed={followed}
                followerCount={author.followerCount}
                onApply={() => onApplyForArc?.(author.featuredProject!.id)}
                onContinueReading={() => onContinueArcReading?.(author.featuredProject!.id)}
                onToggleFollow={onToggleFollow}
                onWithdraw={async () => {
                  try {
                    await api.post(`/api/manuscripts/${author.featuredProject!.id}/arc/withdraw`);
                    setArcProgram(prev => prev
                      ? { ...prev, myApplication: prev.myApplication
                          ? { ...prev.myApplication, status: 'WITHDRAWN' }
                          : null }
                      : null);
                  } catch { /* leave state as-is */ }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Thank you modal */}
      {showThankYou && (
        <div className={styles.modalOverlay} onClick={() => setShowThankYou(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <span className={styles.modalTitle}>Question submitted</span>
              <button className={styles.modalClose} onClick={() => setShowThankYou(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p className={`serif ${styles.modalLead}`}>
                Thank you — your question is now with {author.name.split(' ')[0]}.
              </p>
              <div className={styles.processSteps}>
                <div className={styles.processStep}>
                  <span className={styles.processNum}>01</span>
                  <div>
                    <div className={styles.processStepLabel}>Review</div>
                    <p className={styles.processStepText}>
                      {author.name.split(' ')[0]} reads every question personally. They're not
                      filtered by anyone else before reaching them.
                    </p>
                  </div>
                </div>
                <div className={styles.processStep}>
                  <span className={styles.processNum}>02</span>
                  <div>
                    <div className={styles.processStepLabel}>Selection</div>
                    <p className={styles.processStepText}>
                      They select questions that would be valuable to the broader readership —
                      specific, thoughtful questions get priority over general ones.
                    </p>
                  </div>
                </div>
                <div className={styles.processStep}>
                  <span className={styles.processNum}>03</span>
                  <div>
                    <div className={styles.processStepLabel}>Answer & notify</div>
                    <p className={styles.processStepText}>
                      When your question is answered and published, you'll receive a notification
                      with a direct link back to this Q&A board.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.modalBtn} onClick={() => setShowThankYou(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────

export default function AuthorProfiles({ followedAuthors, onToggleFollow, onNotify, target, onTargetConsumed, onApplyForArc, onContinueArcReading }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targetTab,  setTargetTab]  = useState<ProfileTab | undefined>(undefined);
  const [profiles,   setProfiles]   = useState<AuthorProfile[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const records = await api.get<AuthorRecord[]>('/api/authors');
        setProfiles(records.map(recordToProfile));
      } catch { /* leave empty */ }
    })();
  }, []);

  useEffect(() => {
    if (target) {
      setSelectedId(target.authorId);
      setTargetTab(target.tab);
      onTargetConsumed?.();
    }
  }, [target]);

  const selected = selectedId ? profiles.find(a => a.id === selectedId) ?? null : null;

  if (selected) {
    return (
      <AuthorProfilePage
        author={selected}
        followed={followedAuthors.has(selected.id)}
        onToggleFollow={() => onToggleFollow(selected)}
        onBack={() => { setSelectedId(null); setTargetTab(undefined); }}
        onNotify={onNotify}
        initialTab={targetTab}
        onApplyForArc={onApplyForArc}
        onContinueArcReading={onContinueArcReading}
      />
    );
  }

  return (
    <section>
      <div className={styles.sectionHeader}>
        <SectionHead
          eyebrow="Reading · Author Profiles"
          title="Meet the authors"
          kicker={`${profiles.length} authors publishing on Bookending`}
        >
          <Btn tone="ghost" icon={<IconArrow size={13} />}>Suggest an author</Btn>
        </SectionHead>
      </div>

      <div className={styles.grid}>
        {profiles.map(author => (
          <AuthorCard
            key={author.id}
            author={author}
            followed={followedAuthors.has(author.id)}
            onFollow={e => { e.stopPropagation(); onToggleFollow(author); }}
            onSelect={() => setSelectedId(author.id)}
          />
        ))}
      </div>
    </section>
  );
}
