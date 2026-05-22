import { useState, useRef, useEffect } from 'react';
import { Btn, Avatar } from '../../shared/ui/atoms';
import { IconSearch, IconBell, IconArrow } from '../../shared/ui/icons';
import NotificationDropdown from '../notifications/NotificationDropdown';
import type { AppNotification } from '../notifications/data';
import type { BookMetadata } from '../library/data';
import { useAuth } from '../auth';
import { useQuietMode } from '../quiet-mode/QuietModeContext';
import styles from './Masthead.module.css';

const HEADLINES = [
  { h: 'A community for self-publishers.', k: 'Edit, print, sell, and gather your readers — without juggling six tools.' },
  { h: 'Your book, from manuscript to mailbox.', k: 'One quiet workspace for every step that comes after the first draft.' },
  { h: 'Bookending, for the work between drafts and readers.', k: 'Beta-readers, distribution, storefront, and audience — held together by other authors.' },
  { h: 'Every author needs a colophon.', k: 'We built the back-of-house so you can stay at the desk.' },
  { h: 'Independent, but not alone.', k: 'A workbench for self-publishers, run with fellow authors at your shoulder.' },
];

type NavItem =
  | { label: string; children?: undefined }
  | { label: string; children: { label: string }[] };

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard' },
  {
    label: 'Writing',
    children: [
      { label: 'Manuscripts' },
      { label: 'Editing & Beta-readers' },
      { label: 'Readers' },
      { label: 'The Bindery' },
      { label: 'ARC' },
      { label: 'Print & Distribution' },
      { label: 'My Store' },
      { label: 'Audience' },
      { label: 'Seasons' },
      { label: 'Connections' },
      { label: 'Royalties' },
    ],
  },
  {
    label: 'Reading',
    children: [
      { label: 'Reading' },
      { label: 'Library' },
      { label: 'Author Profiles' },
      { label: 'My ARCs' },
      { label: 'Storefront' },
      { label: 'Purchases' },
    ],
  },
  {
    label: 'Community',
    children: [
      { label: 'Mentorship' },
      { label: 'Writing Circle' },
    ],
  },
];

const READER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard' },
  { label: 'Reading' },
  { label: 'Library' },
  { label: 'Author Profiles' },
  { label: 'Purchases' },
  { label: 'Community' },
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface MastheadProps {
  headlineIndex?: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  savedBooks?: Record<number, BookMetadata>;
  onNewManuscript?: () => void;
  onLogout?: () => void;
  onNotifCta?: (authorId: string) => void;
  navMode?: 'author' | 'reader';
  onLogin?: () => void;
}

export default function Masthead({
  headlineIndex = 0,
  activeTab,
  onTabChange,
  notifications,
  onMarkRead,
  onMarkAllRead,
  savedBooks,
  onNewManuscript,
  onLogout,
  onNotifCta,
  navMode = 'author',
  onLogin,
}: MastheadProps) {
  const { currentUser }  = useAuth();
  const { isQuiet }      = useQuietMode();
  const idx = Math.max(0, Math.min(HEADLINES.length - 1, headlineIndex));
  const { h, k } = HEADLINES[idx];

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu,      setShowUserMenu]      = useState(false);
  const [openMenu,          setOpenMenu]          = useState<string | null>(null);
  const [mobileNavOpen,     setMobileNavOpen]     = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const navRef  = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const isLoggedIn  = !!currentUser;
  const initials    = currentUser ? getInitials(currentUser.name) : '';
  const titleCount  = savedBooks ? Object.keys(savedBooks).length : 0;

  const baseItems = navMode === 'reader' ? READER_NAV_ITEMS : NAV_ITEMS;
  const navItems: NavItem[] = currentUser?.isAdmin && navMode === 'author'
    ? [...baseItems, { label: 'Admin' }]
    : baseItems;

  return (
    <header className={styles.header} data-quiet={isQuiet ? '' : undefined}>
      <div className={styles.topNav}>
        <span className={`serif ${styles.wordmark}`} onClick={() => onTabChange('Landing')}>
          Bookending
        </span>

        {isLoggedIn && (
          <nav className={styles.nav} ref={navRef}>
            {navItems.map((item) => {
              if (!item.children) {
                return (
                  <a
                    key={item.label}
                    onClick={() => { setOpenMenu(null); onTabChange(item.label); }}
                    className={styles.navLink}
                    data-active={item.label === activeTab ? 'true' : undefined}
                  >
                    {item.label}
                  </a>
                );
              }
              const isChildActive = item.children.some(c => c.label === activeTab);
              const isOpen = openMenu === item.label;
              return (
                <div key={item.label} className={styles.navGroup}>
                  <button
                    className={styles.navLink}
                    data-active={isChildActive ? 'true' : undefined}
                    data-open={isOpen ? 'true' : undefined}
                    onClick={() => setOpenMenu(isOpen ? null : item.label)}
                  >
                    {item.label}
                    <span className={styles.navChevron}>▾</span>
                  </button>
                  {isOpen && (
                    <div className={styles.navDropdown}>
                      {item.children.map(child => (
                        <button
                          key={child.label}
                          className={styles.navDropdownItem}
                          data-active={child.label === activeTab ? 'true' : undefined}
                          onClick={() => { setOpenMenu(null); onTabChange(child.label); }}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {!isLoggedIn && onLogin && (
          <button className={styles.loginBtn} onClick={onLogin}>
            Log in
          </button>
        )}

        {isLoggedIn && (
          <div className={styles.navActions}>
            {navMode === 'author' && (
              <Btn tone="ghost" icon={<IconArrow size={13} />} onClick={onNewManuscript}>New manuscript</Btn>
            )}
            <div className={styles.divider} />
            <button className={styles.iconBtn}><IconSearch size={13} /></button>

            <div ref={bellRef} className={styles.notifWrap}>
              <button
                className={styles.iconBtn}
                data-active={showNotifDropdown ? '' : undefined}
                onClick={() => setShowNotifDropdown(s => !s)}
              >
                <IconBell size={13} />
                {unreadCount > 0 && <span className={styles.notifCount}>{unreadCount}</span>}
              </button>
              {showNotifDropdown && (
                <NotificationDropdown
                  notifications={notifications}
                  onMarkRead={onMarkRead}
                  onMarkAllRead={onMarkAllRead}
                  onCta={onNotifCta}
                />
              )}
            </div>

            <div ref={userRef} className={styles.userWrap}>
              <button
                className={styles.user}
                onClick={() => setShowUserMenu(s => !s)}
                data-active={showUserMenu ? '' : undefined}
              >
                <Avatar initials={initials} tone="paper" size={26} src={currentUser.avatarUrl} />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{currentUser.displayName || currentUser.name}</span>
                  <span className={styles.userMeta}>
                    {navMode === 'reader'
                      ? 'READER'
                      : `${titleCount} ${titleCount === 1 ? 'TITLE' : 'TITLES'} · INDIE`}
                  </span>
                </div>
              </button>

              {showUserMenu && (
                <div className={styles.userMenu}>
                  <button
                    className={styles.userMenuProfile}
                    onClick={() => { setShowUserMenu(false); onTabChange('Profile'); }}
                  >
                    <span className={styles.userMenuName}>{currentUser.displayName || currentUser.name}</span>
                    <span className={styles.userMenuEmail}>{currentUser.email}</span>
                  </button>
                  <div className={styles.userMenuRule} />
                  <button
                    className={styles.userMenuSignOut}
                    onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isLoggedIn && (
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label="Open navigation menu"
          >
            ≡
          </button>
        )}
      </div>

      {isLoggedIn && mobileNavOpen && (
        <div className={styles.mobileNav}>
          <div className={styles.mobileNavBar}>
            <span className={`serif ${styles.mobileNavWordmark}`}>Bookending</span>
            <button
              className={styles.mobileNavClose}
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
            >
              ×
            </button>
          </div>
          <nav className={styles.mobileNavList}>
            {navItems.map(item =>
              item.children ? (
                <div key={item.label} className={styles.mobileNavGroup}>
                  <span className={styles.mobileNavGroupLabel}>{item.label}</span>
                  {item.children.map(child => (
                    <button
                      key={child.label}
                      className={styles.mobileNavItem}
                      data-active={child.label === activeTab ? 'true' : undefined}
                      onClick={() => { setMobileNavOpen(false); onTabChange(child.label); }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  key={item.label}
                  className={styles.mobileNavItem}
                  data-active={item.label === activeTab ? 'true' : undefined}
                  onClick={() => { setMobileNavOpen(false); onTabChange(item.label); }}
                >
                  {item.label}
                </button>
              )
            )}
          </nav>
          <div className={styles.mobileNavFooter}>
            <div className={styles.mobileNavUser}>
              <span className={styles.mobileNavUserName}>{currentUser?.displayName || currentUser?.name}</span>
              <span className={styles.mobileNavUserEmail}>{currentUser?.email}</span>
            </div>
            <button
              className={styles.mobileNavSignOut}
              onClick={() => { setMobileNavOpen(false); onLogout?.(); }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Phase 1: editorial block moved to logged-out Landing page only (removed from logged-in dashboard) */}
      {activeTab === 'Landing' && (
        <div className={styles.editorial}>
          <div className={styles.colophon}>
            <span className={styles.colophonItem}>VOL. III · NO. 47</span>
            <span className={styles.colophonItem}>{dateStr}</span>
            <span className={styles.colophonItem}>EST. 2024</span>
          </div>

          <hr className="rule" />

          <div className={styles.titleBlock}>
            <div>
              <div className={`label ${styles.titleLabel}`}>Your Publishing Journey, Complete</div>
              <h1 className={`serif ${styles.titleH1}`}>Bookending</h1>
              <div className={styles.tagline}>
                <span className={styles.taglineText}>FROM MANUSCRIPT TO READER —</span>
                <span className={styles.taglineLine} />
              </div>
            </div>

            <div className={styles.titleRight}>
              <div className={`label ${styles.todaysLeader}`}>Today's leader</div>
              <p className={`serif ${styles.leaderTitle}`}>{h}</p>
              <p className={`serif ${styles.leaderKicker}`}>{k}</p>
            </div>
          </div>

          <hr className="rule-thick" />
        </div>
      )}
    </header>
  );
}

export { HEADLINES };
