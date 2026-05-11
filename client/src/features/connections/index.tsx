import { useState } from 'react';
import { Spark } from '../../shared/ui/atoms';
import styles from './Connections.module.css';

interface Platform {
  id:          string;
  name:        string;
  category:    'publishing' | 'social' | 'email' | 'retail' | 'community';
  desc:        string;
  editorial:   string;
  status:      'connected' | 'available' | 'coming-soon';
  handle?:     string;
  followers?:  number | null;
  spark?:      number[];
  delta?:      number;
  rating?:     number;
  ratingDelta?: number;
}

const PLATFORMS: Platform[] = [
  {
    id:        'newsletter',
    name:      'The Margin Letter',
    category:  'email',
    desc:      'Your newsletter on Bookending Press',
    editorial: 'Your primary channel. Every dispatch begins here.',
    status:    'connected',
    handle:    'bookending.press/billiewolf',
    followers: 3055,
    spark:     [2811,2830,2858,2872,2890,2910,2924,2948,2965,2974,2989,3010,3031,3055],
    delta:     244,
  },
  {
    id:        'instagram',
    name:      'Instagram',
    category:  'social',
    desc:      'Visual dispatches and writing life',
    editorial: 'Your highest-discovery channel. Readers find you here before they subscribe.',
    status:    'connected',
    handle:    '@billiewolf.writes',
    followers: 2841,
    spark:     [2794,2800,2805,2811,2818,2822,2825,2828,2830,2833,2835,2837,2839,2841],
    delta:     47,
  },
  {
    id:          'goodreads',
    name:        'Goodreads',
    category:    'community',
    desc:        'Author profile and reader reviews',
    editorial:   'Readers who discover you here tend to become your most devoted.',
    status:      'connected',
    handle:      'Billie Wolf',
    followers:   412,
    spark:       [388,392,394,396,398,400,403,405,407,408,409,410,411,412],
    delta:       24,
    rating:      4.0,
    ratingDelta: -0.2,
  },
  {
    id:       'bookshop',
    name:     'Bookshop.org',
    category: 'retail',
    desc:     'Direct book sales, independent bookshops',
    editorial: 'The safest retail channel for independent authors — and the most aligned.',
    status:   'connected',
    handle:   'billiewolf',
    spark:    [0,1,0,1,0,0,1,0,0,1,0,2,7,7],
  },
  {
    id:       'x',
    name:     'X / Twitter',
    category: 'social',
    desc:     'Short dispatches, literary conversation',
    editorial: 'Lower discovery than Instagram, but higher-signal conversation.',
    status:   'connected',
    handle:   '@billiewolf',
    followers: 1204,
    spark:    [1192,1194,1196,1197,1198,1199,1200,1200,1201,1201,1202,1202,1203,1204],
    delta:    12,
  },
  {
    id:       'substack',
    name:     'Substack',
    category: 'email',
    desc:     'Alternative newsletter platform',
    editorial: 'Many readers have Substack accounts — syncing lets you reach them there without splitting your list.',
    status:   'available',
  },
  {
    id:       'website',
    name:     'Author website',
    category: 'publishing',
    desc:     'billiewolf.com',
    editorial: 'Your canonical home. Press kits, backlist, and a dispatch archive all live here.',
    status:   'connected',
    handle:   'billiewolf.com',
  },
  {
    id:       'mailchimp',
    name:     'Mailchimp',
    category: 'email',
    desc:     'Import your existing list',
    editorial: 'Moving from Mailchimp? Import your subscribers, keep your history.',
    status:   'available',
  },
  {
    id:       'convertkit',
    name:     'Kit (ConvertKit)',
    category: 'email',
    desc:     'Import your existing list',
    editorial: 'If your list lives in Kit, you can sync subscribers or migrate completely.',
    status:   'available',
  },
  {
    id:       'amazon',
    name:     'Amazon Author Central',
    category: 'retail',
    desc:     'Sales data, author profile',
    editorial: 'Connecting Amazon Author Central surfaces sales signals alongside your other channels.',
    status:   'coming-soon',
  },
  {
    id:       'netgalley',
    name:     'NetGalley',
    category: 'publishing',
    desc:     'ARC distribution and early reviews',
    editorial: 'Tracks review counts and feedback from advance readers before launch.',
    status:   'coming-soon',
  },
  {
    id:       'storygraph',
    name:     'The StoryGraph',
    category: 'community',
    desc:     'Reader tracking, alternative to Goodreads',
    editorial: 'Growing fast among serious readers who left Goodreads. Worth claiming your profile.',
    status:   'available',
  },
];

const CATEGORY_LABEL: Record<Platform['category'], string> = {
  publishing: 'Publishing',
  social:     'Social',
  email:      'Newsletter & email',
  retail:     'Retail',
  community:  'Community',
};

const CATEGORIES = ['email', 'social', 'community', 'retail', 'publishing'] as const;

function PlatformCard({ p, onConnect }: { p: Platform; onConnect: (id: string) => void }) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className={styles.card}
      data-status={p.status}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className={styles.cardTop}>
        <div>
          <div className={styles.cardName}>{p.name}</div>
          <div className={styles.cardDesc}>{p.desc}</div>
        </div>
        <div className={styles.cardStatus} data-status={p.status}>
          {p.status === 'connected'   ? 'Connected'    :
           p.status === 'available'   ? 'Available'    :
                                        'Coming soon'}
        </div>
      </div>

      {p.status === 'connected' && (
        <div className={styles.cardStats}>
          {p.handle && <span className={styles.cardHandle}>{p.handle}</span>}
          {p.followers != null && (
            <span className={styles.cardFollowers}>
              {p.followers.toLocaleString()}
              {p.delta != null && (
                <span className={styles.cardDelta} data-positive={p.delta > 0 ? 'true' : undefined}>
                  {p.delta > 0 ? ` +${p.delta}` : ` ${p.delta}`}
                </span>
              )}
            </span>
          )}
          {p.rating != null && (
            <span className={styles.cardRating} data-danger={p.ratingDelta != null && p.ratingDelta < -0.14 ? 'true' : undefined}>
              {p.rating.toFixed(1)} ★
              {p.ratingDelta != null && (
                <span className={styles.cardRatingDelta} data-negative={p.ratingDelta < 0 ? 'true' : undefined}>
                  {p.ratingDelta > 0 ? ` +${p.ratingDelta.toFixed(1)}` : ` ${p.ratingDelta.toFixed(1)}`}
                </span>
              )}
            </span>
          )}
          {p.spark && (
            <Spark values={p.spark} w={60} h={16} stroke="var(--muted)" />
          )}
        </div>
      )}

      <p className={`serif ${styles.cardEditorial}`} data-visible={hovering || p.status !== 'connected' ? 'true' : undefined}>
        {p.editorial}
      </p>

      {p.status === 'available' && (
        <button className={styles.connectBtn} onClick={() => onConnect(p.id)}>
          Connect →
        </button>
      )}
      {p.status === 'coming-soon' && (
        <div className={styles.notifyBtn}>Notify me when available</div>
      )}
    </div>
  );
}

export function ConnectionsView() {
  const [filter, setFilter] = useState<Platform['category'] | 'all'>('all');

  const connected = PLATFORMS.filter(p => p.status === 'connected');
  const visible   = filter === 'all' ? PLATFORMS : PLATFORMS.filter(p => p.category === filter);

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerEyebrow}>INTEGRATIONS</div>
          <h2 className={`serif ${styles.headerTitle}`}>Connected channels</h2>
          <p className={`serif ${styles.headerSub}`}>
            {connected.length} platforms connected. Your reader graph draws from all of them.
          </p>
        </div>
      </div>

      <div className={styles.filterBar}>
        {(['all', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            className={styles.filterBtn}
            data-active={filter === cat ? 'true' : undefined}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {visible.map(p => (
          <PlatformCard
            key={p.id}
            p={p}
            onConnect={id => console.log('connect', id)}
          />
        ))}
      </div>
    </div>
  );
}
