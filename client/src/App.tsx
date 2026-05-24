import { useState, useEffect, useRef } from 'react';
import { useQuietMode } from './features/quiet-mode/QuietModeContext';
import Landing from './features/landing';
import Masthead from './features/masthead';
import Community from './features/community';
import PrintDistribution from './features/print-distribution';
import StorefrontTab from './features/storefront';
import AudienceTab from './features/audience';
import EditingHub from './features/editing';
import Reading from './features/reading';
import ReadingRoom from './features/reading/ReadingRoom';
import RoyaltiesTab from './features/royalties';
import { ConnectionsView } from './features/connections';
import { SeasonsView } from './features/seasons';
import Library from './features/library';
import LibraryBrowse from './features/library-browse';
import type { BookMetadata, BetaMode, SpineColor } from './features/library/data';
import ToastStack from './features/notifications/Toast';
import type { AppNotification } from './features/notifications/data';
import { useAuth } from './features/auth';
import { LoginView } from './features/auth';
import ProfileHub from './features/profile/ProfileHub';
import type { HubTab } from './features/profile/ProfileHub';
import AdminPanel from './features/admin';
import ReaderProfiles from './features/reader-profiles';
import DashboardPreview from './features/dashboard-v2';
import AuthorProfiles from './features/author-profiles';
import StorefrontHub from './features/storefront-hub';
import PurchasesView from './features/purchases/PurchasesView';
import FormatterHub from './features/formatter';
import ARCHub from './features/arc';
import ARCApplicationForm from './features/arc/ARCApplicationForm';
import MyARCs from './features/arc/MyARCs';
import ARCReviewComposer from './features/arc/ARCReviewComposer';
import type { AuthorProfile, ProfileTab } from './features/author-profiles/types';
import { api } from './lib/api';
import type { ManuscriptRecord, NotificationRecord } from '@bookending/shared';
import styles from './App.module.css';

type SavedBooks = Record<string, BookMetadata>;

const STATUS_TO_DB: Record<string, string> = {
  'drafting': 'DRAFTING', 'in-revision': 'IN_REVISION', 'published': 'PUBLISHED',
};
const STATUS_FROM_DB: Record<string, string> = {
  'DRAFTING': 'drafting', 'IN_REVISION': 'in-revision', 'PUBLISHED': 'published',
};

function toIntOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function bookToPayload(book: BookMetadata, coverUrl?: string): Record<string, unknown> {
  return {
    id:             typeof book.id === 'string' && book.id.length > 0 ? book.id : undefined,
    title:          book.title,
    subtitle:       book.subtitle      || null,
    status:         STATUS_TO_DB[book.status] ?? 'DRAFTING',
    betaMode:       book.betaMode ?? 'CLOSED',
    maxBetaReaders: book.maxBetaReaders ?? null,
    seriesName:     book.seriesName    || null,
    seriesNumber:   toIntOrNull(book.seriesNumber),
    genre:          book.genre         || null,
    subgenre:       book.subgenre      || null,
    description:    book.description   || null,
    targetAudience: book.targetAudience || null,
    contentRating:   book.contentRating   || null,
    contentWarnings: book.contentWarnings ?? [],
    keywords:        book.keywords        || null,
    isbnEbook:      book.isbnEbook      || null,
    isbnPrint:      book.isbnPrint      || null,
    isbnPending:    !!book.isbnPending,
    priceEbook:     book.priceEbook     || null,
    pricePaperback: book.pricePaperback || null,
    language:       book.language       || 'English',
    estimatedPages: toIntOrNull(book.estimatedPages),
    spineColor:     book.spineColor    || undefined,
    coverUrl:       coverUrl           ?? null,
  };
}

function recordToBook(m: ManuscriptRecord): BookMetadata {
  return {
    id:             m.id,
    title:          m.title,
    subtitle:       m.subtitle       ?? '',
    seriesName:     m.seriesName     ?? '',
    seriesNumber:   m.seriesNumber   ?? null,
    genre:          m.genre          ?? '',
    subgenre:       m.subgenre       ?? '',
    description:    m.description    ?? '',
    targetAudience: m.targetAudience ?? '',
    contentRating:   m.contentRating   ?? '',
    contentWarnings: m.contentWarnings ?? [],
    keywords:        m.keywords        ?? '',
    isbnEbook:      m.isbnEbook      ?? '',
    isbnPrint:      m.isbnPrint      ?? '',
    isbnPending:    m.isbnPending,
    priceEbook:     m.priceEbook     ?? '',
    pricePaperback: m.pricePaperback ?? '',
    language:       m.language,
    estimatedPages: m.estimatedPages ?? null,
    status:         (STATUS_FROM_DB[m.status] ?? 'drafting') as BookMetadata['status'],
    betaMode:       (m.betaMode ?? 'CLOSED') as BetaMode,
    maxBetaReaders: m.maxBetaReaders ?? null,
    coverUploaded:  !!m.coverUrl,
    spineColor:     (m.spineColor as SpineColor) || 'spine-amber',
    editorialNote:  m.editorialNote ?? null,
    revisionPausedAt: m.revisionPausedAt ?? null,
  };
}

// ── Notification record mapping ───────────────────────────────
function recordToNotification(r: NotificationRecord): AppNotification {
  return {
    id:         r.id,
    type:       r.type as AppNotification['type'],
    stage:      r.stage,
    message:    r.message,
    read:       r.status === 'SENT',
    receivedAt: r.scheduledAt,
  };
}

async function fetchAndMigrateManuscripts(userId: string): Promise<{ books: BookMetadata[]; apiError: string | null }> {
  let dbBooks:  BookMetadata[] = [];
  let dbIds:    Set<string>    = new Set();
  let apiError: string | null  = null;

  // Phase 1: Try to fetch from the API (non-fatal if it fails)
  try {
    const records = await api.get<ManuscriptRecord[]>('/api/manuscripts');
    dbBooks = records.map(recordToBook);
    dbIds   = new Set(records.map(r => r.id));
  } catch (e) {
    apiError = e instanceof Error ? e.message : 'Could not connect to server';
  }

  // Phase 2: Read localStorage (always — works even when API is down)
  let localBooks: BookMetadata[] = [];
  try {
    const raw = localStorage.getItem(`bookending_library_v1:${userId}`);
    if (raw) localBooks = Object.values(JSON.parse(raw) as Record<string, BookMetadata>);
  } catch { /* corrupt data — ignore */ }

  // Phase 3: Sync localStorage-only books to DB if the API is up
  // Skip books the user explicitly deleted — stored in a blocklist so they don't re-appear on next login
  let deletedIds: Set<string> = new Set();
  try {
    const raw = localStorage.getItem(`bookending_deleted_ids:${userId}`);
    if (raw) deletedIds = new Set(JSON.parse(raw) as string[]);
  } catch { /* corrupt — ignore */ }

  // Titles already in DB — used to skip stale local entries that share a title with a synced book
  const dbTitles = new Set(dbBooks.map(b => b.title.trim().toLowerCase()));

  const unsynced = localBooks.filter(b =>
    typeof b.id === 'string' && b.id.length > 0 &&
    !dbIds.has(b.id) &&
    !deletedIds.has(b.id) &&
    !dbTitles.has(b.title?.trim().toLowerCase() ?? '') &&
    !!b.title?.trim(),
  );
  for (const book of unsynced) {
    if (!apiError) {
      const coverUrl = localStorage.getItem(`bookending_cover_${book.id}`) ?? undefined;
      try {
        const created = await api.post<ManuscriptRecord>('/api/manuscripts', bookToPayload(book, coverUrl));
        dbBooks.push(recordToBook(created));
        continue;
      } catch (e) {
        console.warn('[migrate] sync failed for', book.id, e instanceof Error ? e.message : e);
      }
    }
    // API unavailable or failed — show the book from localStorage anyway
    dbBooks.push(book);
  }

  return { books: dbBooks.filter(b => typeof b.id === 'string' && b.id.length > 0), apiError };
}

function LoggedOutShell() {
  const { passwordRecovery } = useAuth();
  const [view,     setView]     = useState<'landing' | 'login'>(passwordRecovery ? 'login' : 'landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  function goAuth(mode: 'login' | 'register') {
    setAuthMode(mode);
    setView('login');
  }

  return (
    <div>
      <Masthead
        activeTab={view === 'landing' ? 'Landing' : 'Login'}
        onTabChange={(tab) => { if (tab === 'Landing') setView('landing'); }}
        notifications={[]}
        onMarkRead={() => {}}
        onMarkAllRead={() => {}}
        onLogin={() => goAuth('login')}
      />
      {view === 'landing'
        ? <Landing onSignIn={() => goAuth('login')} onRegister={() => goAuth('register')} />
        : <LoginView initialMode={authMode} />
      }
    </div>
  );
}

// ── Reader shell ──────────────────────────────────────────────────────────────

function ReaderApp() {
  const { logout } = useAuth();
  const [activeTab,         setActiveTab]         = useState('Dashboard');
  const [profileInitialTab, setProfileInitialTab] = useState<HubTab>('Profile');
  const [notifications,     setNotifications]     = useState<AppNotification[]>([]);
  const [toasts,            setToasts]            = useState<AppNotification[]>([]);
  const [followedAuthors,         setFollowedAuthors]         = useState<Set<string>>(new Set());
  const [authorTarget,            setAuthorTarget]            = useState<{ authorId: string; tab: ProfileTab } | null>(null);
  const [arcApplicationManuscriptId, setArcApplicationManuscriptId] = useState<string | null>(null);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (activeTab !== 'Profile') setProfileInitialTab('Profile');
  }, [activeTab]);

  function addToast(n: AppNotification) {
    setToasts(prev => [...prev, n]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== n.id));
      toastTimers.current.delete(n.id);
    }, 5000);
    toastTimers.current.set(n.id, timer);
  }

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) { clearTimeout(timer); toastTimers.current.delete(id); }
  }

  function addNotification(n: AppNotification) {
    setNotifications(prev => [n, ...prev]);
    addToast(n);
  }

  function handleNotifCta(authorId: string, tab?: string) {
    setAuthorTarget({ authorId, tab: (tab as ProfileTab) ?? 'qa' });
    setActiveTab('Author Profiles');
  }

  function handleMarkRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function handleToggleFollow(author: AuthorProfile) {
    const isFollowing = followedAuthors.has(author.id);
    setFollowedAuthors(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(author.id) : next.add(author.id);
      return next;
    });
    addNotification({
      id: `follow-${author.id}-${Date.now()}`,
      type: 'AUTHOR_FOLLOW',
      stage: 'Reading',
      message: isFollowing
        ? `You unfollowed ${author.name}.`
        : `You're now following ${author.name}. You'll be notified when they post updates.`,
      read: false,
      receivedAt: new Date().toISOString(),
    });
  }

  return (
    <div>
      <Masthead
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onLogout={logout}
        onNotifCta={handleNotifCta}
        navMode="reader"
      />

      {activeTab === 'Dashboard' && <DashboardPreview />}
      {activeTab === 'Reading' && <Reading />}
      {activeTab === 'Library' && (
        <LibraryBrowse
          savedBooks={{}}
          onEditProfile={() => { setProfileInitialTab('My Reader Profile'); setActiveTab('Profile'); }}
        />
      )}
      {activeTab === 'Author Profiles' && (
        <AuthorProfiles
          followedAuthors={followedAuthors}
          onToggleFollow={handleToggleFollow}
          onNotify={addNotification}
          target={authorTarget}
          onTargetConsumed={() => setAuthorTarget(null)}
          onApplyForArc={id => { setArcApplicationManuscriptId(id); setActiveTab('ARC Application'); }}
          onContinueArcReading={id => { setArcApplicationManuscriptId(id); setActiveTab('ARC Reading'); }}
        />
      )}
      {activeTab === 'Purchases' && <PurchasesView />}
      {activeTab === 'Community' && <Community section="mentorship" />}
      {activeTab === 'Profile' && (
        <ProfileHub onBack={() => setActiveTab('Reading')} onToast={addToast} initialTab={profileInitialTab} />
      )}
      {activeTab === 'ARC Application' && arcApplicationManuscriptId && (
        <ARCApplicationForm
          manuscriptId={arcApplicationManuscriptId}
          onBack={() => setActiveTab('Author Profiles')}
          onSubmitted={() => setActiveTab('My ARCs')}
        />
      )}
      {activeTab === 'My ARCs' && (
        <MyARCs
          onReadArc={id => { setArcApplicationManuscriptId(id); setActiveTab('ARC Reading'); }}
          onReview={id => { setArcApplicationManuscriptId(id); setActiveTab('ARC Review'); }}
        />
      )}
      {activeTab === 'ARC Reading' && arcApplicationManuscriptId && (
        <ReadingRoom
          msRef={arcApplicationManuscriptId}
          onBack={() => setActiveTab('My ARCs')}
          arcMode
          onArcFinished={() => { setActiveTab('ARC Review'); }}
        />
      )}
      {activeTab === 'ARC Review' && arcApplicationManuscriptId && (
        <ARCReviewComposer
          manuscriptId={arcApplicationManuscriptId}
          onBack={() => setActiveTab('My ARCs')}
          onPosted={() => setActiveTab('My ARCs')}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} onCta={handleNotifCta} />

      <footer className={styles.footer}>
        <span className={`mono ${styles.footerMeta}`}>BOOKENDING · A COMMUNITY FOR READERS & WRITERS · MMXXVI</span>
        <span className={`mono ${styles.footerMeta}`}>SET IN NEWSREADER & INTER · PRINTED FROM PORTLAND</span>
      </footer>
    </div>
  );
}

// ── Author shell ──────────────────────────────────────────────────────────────

function AuthorApp() {
  const { currentUser, logout } = useAuth();
  const { isQuiet, deferred, clearDeferred, addDeferred } = useQuietMode();

  const [activeTab,         setActiveTab]         = useState('Dashboard');
  const [profileInitialTab, setProfileInitialTab] = useState<HubTab>('Profile');
  const [savedBooks,        setSavedBooks]        = useState<SavedBooks>({});
  const [dbBookIds,         setDbBookIds]         = useState<Set<string>>(new Set());
  const [manuscriptsDirty,  setManuscriptsDirty]  = useState(false);
  const [loadError,         setLoadError]         = useState<string | null>(null);
  const [pendingTab,        setPendingTab]        = useState<string | null>(null);
  const [openNewManuscript, setOpenNewManuscript] = useState(false);
  const [notifications,     setNotifications]     = useState<AppNotification[]>([]);
  const [toasts,            setToasts]            = useState<AppNotification[]>([]);
  const [followedAuthors,            setFollowedAuthors]            = useState<Set<string>>(new Set());
  const [authorTarget,               setAuthorTarget]               = useState<{ authorId: string; tab: ProfileTab } | null>(null);
  const [arcApplicationManuscriptId, setArcApplicationManuscriptId] = useState<string | null>(null);
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (activeTab !== 'Profile') setProfileInitialTab('Profile');
  }, [activeTab]);

  // Load manuscripts + goal from API whenever the logged-in user changes
  useEffect(() => {
    if (!currentUser) {
      setSavedBooks({}); setDbBookIds(new Set()); return;
    }
    setLoadError(null);
    const userId = currentUser.id;
    void (async () => {
      const { books, apiError } = await fetchAndMigrateManuscripts(userId);
      setSavedBooks(Object.fromEntries(books.map(b => [b.id, b])));
      setDbBookIds(new Set(books.map(b => b.id)));
      if (apiError) setLoadError(apiError);

      try {
        const notifs = await api.get<NotificationRecord[]>('/api/notifications').catch(() => [] as NotificationRecord[]);
        setNotifications(notifs.map(recordToNotification));
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  function addToast(n: AppNotification) {
    setToasts(prev => [...prev, n]);
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== n.id));
      toastTimers.current.delete(n.id);
    }, 5000);
    toastTimers.current.set(n.id, timer);
  }

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }

  useEffect(() => {
    if (!currentUser) return;
    const incoming: AppNotification = {
      id: 'n-live',
      type: 'DEADLINE_WARNING',
      stage: 'Publish',
      message: "You're 14 days from your publish deadline. Is your file upload ready?",
      read: false,
      receivedAt: new Date().toISOString(),
    };
    const timer = setTimeout(() => {
      setNotifications(prev => [incoming, ...prev]);
      addToast(incoming);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  function addNotification(n: AppNotification) {
    setNotifications(prev => [n, ...prev]);
    if (isQuiet) {
      addDeferred(n);
    } else {
      addToast(n);
    }
  }

  // Flush deferred toasts when quiet mode ends
  const wasQuietRef = useRef(false);
  useEffect(() => {
    if (wasQuietRef.current && !isQuiet && deferred.length > 0) {
      deferred.forEach(n => addToast(n));
      clearDeferred();
    }
    wasQuietRef.current = isQuiet;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuiet]);

  function handleNotifCta(authorId: string, tab?: string) {
    setAuthorTarget({ authorId, tab: (tab as ProfileTab) ?? 'qa' });
    setActiveTab('Author Profiles');
  }

  function patchNotification(id: string) {
    void api.patch(`/api/notifications/${id}`, { status: 'SENT' }).catch(() => {});
  }

  function handleMarkRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    patchNotification(id);
  }

  function handleMarkAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    unreadIds.forEach(patchNotification);
  }

  function handleTabChange(tab: string) {
    if (activeTab === 'Manuscripts' && tab !== 'Manuscripts' && manuscriptsDirty) {
      setPendingTab(tab);
      return;
    }
    setActiveTab(tab);
  }

  function handleNewManuscript() {
    setActiveTab('Manuscripts');
    setOpenNewManuscript(true);
  }

  function handleToggleFollow(author: AuthorProfile) {
    const isFollowing = followedAuthors.has(author.id);
    setFollowedAuthors(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(author.id) : next.add(author.id);
      return next;
    });
    addNotification({
      id: `follow-${author.id}-${Date.now()}`,
      type: 'AUTHOR_FOLLOW',
      stage: 'Reading',
      message: isFollowing
        ? `You unfollowed ${author.name}.`
        : `You're now following ${author.name}. You'll be notified when they post updates.`,
      read: false,
      receivedAt: new Date().toISOString(),
    });
  }

  function handleBookDelete(id: string) {
    if (!currentUser) return;
    const userId = currentUser.id;

    setSavedBooks(prev => { const next = { ...prev }; delete next[id]; return next; });
    setDbBookIds(prev => { const next = new Set(prev); next.delete(id); return next; });

    try {
      const stored = JSON.parse(localStorage.getItem(`bookending_library_v1:${userId}`) ?? '{}') as Record<string, BookMetadata>;
      delete stored[id];
      localStorage.setItem(`bookending_library_v1:${userId}`, JSON.stringify(stored));
    } catch { /* non-fatal */ }

    try {
      const raw      = localStorage.getItem(`bookending_deleted_ids:${userId}`);
      const deleted  = new Set<string>(raw ? JSON.parse(raw) as string[] : []);
      deleted.add(id);
      localStorage.setItem(`bookending_deleted_ids:${userId}`, JSON.stringify([...deleted]));
    } catch { /* non-fatal */ }

    localStorage.removeItem(`bookending_cover_${id}`);
    localStorage.removeItem(`bookending_import_${id}`);
    localStorage.removeItem(`bookending_import_name_${id}`);

    void api.del(`/api/manuscripts/${id}`).catch(err => {
      console.error('Delete manuscript failed:', err);
    });
  }

  function handleBookSave(id: string, book: BookMetadata) {
    if (!currentUser) return;
    const userId = currentUser.id;

    setSavedBooks(prev => ({ ...prev, [id]: book }));

    try {
      const stored = JSON.parse(localStorage.getItem(`bookending_library_v1:${userId}`) ?? '{}') as Record<string, BookMetadata>;
      stored[id] = book;
      localStorage.setItem(`bookending_library_v1:${userId}`, JSON.stringify(stored));
    } catch { /* quota or parse error — non-fatal */ }

    const coverUrl = localStorage.getItem(`bookending_cover_${id}`) ?? undefined;
    const payload  = bookToPayload(book, coverUrl);

    if (dbBookIds.has(id)) {
      void api.patch(`/api/manuscripts/${id}`, payload).catch(err => {
        console.error('Update manuscript failed:', err);
        addNotification({
          id: `save-err-${id}-${Date.now()}`,
          type: 'STAGE_NUDGE',
          stage: 'Manuscripts',
          message: `Could not save "${book.title}". Check your connection and try again.`,
          read: false,
          receivedAt: new Date().toISOString(),
        });
      });
    } else {
      void api.post<ManuscriptRecord>('/api/manuscripts', payload)
        .then(() => setDbBookIds(prev => new Set([...prev, id])))
        .catch(err => {
          console.error('Create manuscript failed:', err);
          addNotification({
            id: `save-err-${id}-${Date.now()}`,
            type: 'STAGE_NUDGE',
            stage: 'Manuscripts',
            message: `Could not save "${book.title}". Your changes are visible but not yet stored — try saving again.`,
            read: false,
            receivedAt: new Date().toISOString(),
          });
        });
    }
  }

  return (
    <div>
      <Masthead
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        savedBooks={savedBooks}
        onNewManuscript={handleNewManuscript}
        onLogout={logout}
        onNotifCta={handleNotifCta}
        navMode="author"
      />
      {loadError && (
        <div role="alert" className={styles.errorAlert}>
          <span>Could not load your manuscripts: {loadError}</span>
          <button onClick={() => setLoadError(null)} className={styles.errorDismiss}>×</button>
        </div>
      )}

      {activeTab === 'Landing' && <Landing onSignIn={() => setActiveTab('Dashboard')} onRegister={() => setActiveTab('Dashboard')} />}
      {activeTab === 'Dashboard' && <DashboardPreview />}
      {activeTab === 'Manuscripts' && (
        <Library
          savedBooks={savedBooks}
          onSave={handleBookSave}
          onDelete={handleBookDelete}
          openNewManuscript={openNewManuscript}
          onOpenNewHandled={() => setOpenNewManuscript(false)}
          onDirtyChange={setManuscriptsDirty}
          onPublish={(manuscriptId) => {
            const book = savedBooks[manuscriptId];
            const title = book?.title ?? 'your book';
            addNotification({
              id: `book-published-${manuscriptId}-${Date.now()}`,
              type: 'BOOK_PUBLISHED',
              stage: 'Publish',
              message: `Your followers were notified that "${title}" is now live.`,
              read: false,
              receivedAt: new Date().toISOString(),
              cta: { label: 'View listing', authorId: currentUser?.id ?? '', tab: 'overview' },
            });
            setActiveTab('My Store');
          }}
        />
      )}
      {activeTab === 'Editing & Beta-readers' && <EditingHub savedBooks={savedBooks} onTabChange={setActiveTab} />}
      {activeTab === 'Reading' && <Reading />}
      {activeTab === 'Library' && (
        <LibraryBrowse
          savedBooks={savedBooks}
          onEditProfile={() => { setProfileInitialTab('My Reader Profile'); setActiveTab('Profile'); }}
        />
      )}
      {activeTab === 'Readers' && <ReaderProfiles savedBooks={savedBooks} />}
      {activeTab === 'The Bindery' && <FormatterHub />}
      {activeTab === 'Storefront' && <StorefrontHub />}
      {activeTab === 'Purchases' && <PurchasesView />}
      {activeTab === 'Author Profiles' && (
        <AuthorProfiles
          followedAuthors={followedAuthors}
          onToggleFollow={handleToggleFollow}
          onNotify={addNotification}
          target={authorTarget}
          onTargetConsumed={() => setAuthorTarget(null)}
          onApplyForArc={id => { setArcApplicationManuscriptId(id); setActiveTab('ARC Application'); }}
          onContinueArcReading={id => { setArcApplicationManuscriptId(id); setActiveTab('ARC Reading'); }}
        />
      )}
      {(activeTab === 'Community' || activeTab === 'Mentorship' || activeTab === 'Writing Circle') && (
        <section style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p className="label" style={{ color: 'var(--muted)', marginBottom: '8px' }}>§ 05 · COMMUNITY</p>
          <p className="serif" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Coming soon</p>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
            Writing circles, mentorship, and the reader community are on their way.
          </p>
        </section>
      )}
      {activeTab === 'ARC' && <ARCHub />}
      {activeTab === 'ARC Application' && arcApplicationManuscriptId && (
        <ARCApplicationForm
          manuscriptId={arcApplicationManuscriptId}
          onBack={() => setActiveTab('Author Profiles')}
          onSubmitted={() => setActiveTab('My ARCs')}
        />
      )}
      {activeTab === 'Print & Distribution' && <PrintDistribution />}
      {activeTab === 'My Store' && <StorefrontTab savedBooks={savedBooks} onTabChange={setActiveTab} onBookSave={handleBookSave} />}
      {activeTab === 'Audience' && <AudienceTab savedBooks={savedBooks} onOpenSeasons={() => setActiveTab('Seasons')} />}
      {activeTab === 'Seasons' && <SeasonsView onCompose={() => setActiveTab('Audience')} />}
      {activeTab === 'Connections' && <ConnectionsView />}
      {activeTab === 'Royalties' && <RoyaltiesTab savedBooks={savedBooks} />}
      {activeTab === 'Profile' && (
        <ProfileHub onBack={() => setActiveTab('Dashboard')} onToast={addToast} initialTab={profileInitialTab} savedBooks={savedBooks} />
      )}
      {activeTab === 'Admin' && currentUser?.isAdmin && <AdminPanel />}

      {pendingTab && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Unsaved changes</div>
            <p className={styles.modalBody}>
              You have unsaved changes to your manuscript. If you leave, all changes will be lost.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.modalStay} onClick={() => setPendingTab(null)}>
                Stay and save
              </button>
              <button
                className={styles.modalDiscard}
                onClick={() => { setActiveTab(pendingTab!); setPendingTab(null); setManuscriptsDirty(false); }}
              >
                Discard changes
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} onCta={handleNotifCta} />

      <footer className={styles.footer}>
        <span className={`mono ${styles.footerMeta}`}>BOOKENDING · A WORKBENCH FOR SELF-PUBLISHERS · MMXXVI</span>
        <span className={`mono ${styles.footerMeta}`}>SET IN NEWSREADER & INTER · PRINTED FROM PORTLAND</span>
      </footer>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { currentUser, isLoading } = useAuth();

  const params = new URLSearchParams(window.location.search);
  if (params.has('preview')) {
    const empty = params.get('empty');
    return (
      <DashboardPreview
        writerEmpty={empty === 'writer'}
        readerEmpty={empty === 'reader'}
      />
    );
  }

  if (isLoading) return (
    <div className={styles.authLoading}>
      <span className={styles.authLoadingText}>One moment…</span>
    </div>
  );

  if (!currentUser) return <LoggedOutShell />;

  return currentUser.role === 'READER' ? <ReaderApp /> : <AuthorApp />;
}
