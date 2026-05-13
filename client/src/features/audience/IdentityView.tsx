import { useState, useEffect } from 'react';
import { Pill, Btn, Avatar, Spark } from '../../shared/ui/atoms';
import { IconArrow } from '../../shared/ui/icons';
import { SOCIAL_LINKS, MEDIA_MENTIONS, KIND_TONE } from './data';
import type { SocialLink } from './types';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import styles from './Identity.module.css';

function SocialStat({ s }: { s: SocialLink }) {
  if (s.rating != null) {
    const isNegSignificant = s.ratingDelta != null && s.ratingDelta < -0.14;
    const isPos            = s.ratingDelta != null && s.ratingDelta > 0;
    return (
      <>
        <span>{s.rating.toFixed(1)} ★</span>
        {s.ratingDelta != null && (
          <span
            className={styles.socialDelta}
            data-negative={isNegSignificant ? '' : undefined}
            data-positive={isPos ? '' : undefined}
            data-muted={!isNegSignificant && !isPos ? '' : undefined}
          >
            {s.ratingDelta > 0 ? '+' : ''}{s.ratingDelta.toFixed(1)}
          </span>
        )}
      </>
    );
  }
  if (s.salesWindow != null) {
    return (
      <>
        <span>{s.salesWindow} sold</span>
        <span className={styles.socialStatSuffix}>· 30d</span>
      </>
    );
  }
  if (s.followers != null) {
    return (
      <>
        <span>{s.followers.toLocaleString()}</span>
        {s.delta != null && (
          <span
            className={styles.socialDelta}
            data-positive={s.delta > 0 ? '' : undefined}
            data-muted={s.delta <= 0 ? '' : undefined}
          >
            {s.delta > 0 ? '+' : ''}{s.delta.toLocaleString()}
          </span>
        )}
      </>
    );
  }
  return <span className={styles.socialStatSuffix}>—</span>;
}

export function IdentityView() {
  const { session, currentUser, updateProfile } = useAuth();
  const [bioMode, setBioMode] = useState<'short' | 'long'>('long');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [tagline, setTagline] = useState('From manuscript to reader — with room for the work in between.');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    void api.get<{ bio?: string | null; location?: string | null }>('/api/author-profile')
      .then(p => {
        if (p.bio)      setBio(p.bio);
        if (p.location) setLocation(p.location);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  async function saveBio() {
    setSaving(true);
    try {
      await api.patch('/api/author-profile', { bio });
    } finally {
      setSaving(false);
    }
  }

  function saveName(name: string) {
    updateProfile({ name });
  }

  const [subWhat,     setSubWhat]     = useState('A fortnightly letter on the experience of writing a book — not the advice, but the actual texture of it. The doubt, the revision, the strange grief of finishing.');
  const [subFreq,     setSubFreq]     = useState('Every two weeks, on a Sunday.');
  const [subDistinct, setSubDistinct] = useState('Over 3,000 readers have found something true in it. Some write back. A few have said it kept them writing.');

  return (
    <div className={styles.identityGrid}>
      <div className={styles.leftPane}>
        <div className={styles.identitySection}>
          <div className={`label ${styles.sectionLabel}`}>Author identity</div>
          <div className={styles.authorHeader}>
            <div className={styles.avatarBox}>
              <Avatar initials="BW" tone="paper" size={48} />
              <span className={styles.avatarLabel}>CHANGE</span>
            </div>
            <div className={styles.authorFields}>
              <div className={styles.nameGrid}>
                <div>
                  <div className={styles.fieldLabel}>DISPLAY NAME</div>
                  <input
                    value={currentUser?.name ?? ''}
                    onChange={e => saveName(e.target.value)}
                    className={styles.field}
                  />
                </div>
                <div>
                  <div className={styles.fieldLabel}>PEN NAME</div>
                  <input placeholder="Same as display name" className={styles.field} />
                </div>
              </div>
              <div>
                <div className={styles.fieldLabel}>TAGLINE</div>
                <input
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className={`${styles.field} ${styles.fieldSerif}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bioSection}>
          <div className={styles.bioHeader}>
            <div className="label">Author bio</div>
            <div className={styles.bioModeBtns}>
              {(['short', 'long'] as const).map(m => (
                <button
                  key={m}
                  className={styles.bioModeBtn}
                  data-active={bioMode === m ? 'true' : undefined}
                  onClick={() => setBioMode(m)}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={bioMode === 'short' ? 3 : 7}
            className={styles.ta}
          />
          <div className={styles.bioFooter}>
            <span className={styles.bioCount}>
              {bio.trim().split(/\s+/).filter(Boolean).length} WORDS · TARGET {bioMode === 'short' ? 80 : 250}
            </span>
            <Btn tone="ghost" onClick={() => { void saveBio(); }}>{saving ? 'Saving…' : 'Save bio'}</Btn>
          </div>
        </div>

        <div className={styles.genreSection}>
          <div className={`label ${styles.genreLabel}`}>Genre & positioning</div>
          <div className={styles.genreGrid}>
            {[
              { l: 'Primary genre',   v: 'Literary Fiction' },
              { l: 'Secondary genre', v: 'Speculative Fiction' },
              { l: 'Based in',        v: location || 'Portland, OR · USA' },
              { l: 'Published since', v: '2024' },
              { l: 'Titles',          v: '2 (1 forthcoming)' },
              { l: 'Imprint',         v: 'Self-published' },
            ].map(f => (
              <div key={f.l}>
                <div className={styles.fieldLabel}>{f.l.toUpperCase()}</div>
                <input defaultValue={f.v} className={`${styles.field} ${styles.fieldSm}`} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.socialSection}>
          <div className={styles.socialHeader}>
            <div className="label">Social presence</div>
            <Btn tone="ghost" icon={<IconArrow size={12} />}>Add platform</Btn>
          </div>
          {SOCIAL_LINKS.map((s) => (
            <div key={s.platform} className={styles.socialRow}>
              <div className={styles.socialPlatform}>{s.platform.toUpperCase()}</div>
              <div
                className={styles.socialHandle}
                data-inactive={s.status === 'not-set-up' ? 'true' : undefined}
              >
                {s.handle}
              </div>
              <div className={styles.socialSpark}>
                {s.spark && s.status === 'live' && (
                  <Spark values={s.spark} w={36} h={16} stroke="var(--muted)" />
                )}
              </div>
              <div className={styles.socialStat}>
                <SocialStat s={s} />
              </div>
              <Pill tone={s.status === 'live' ? 'good' : 'neutral'}>
                {s.status === 'not-set-up' ? 'not set up' : 'live'}
              </Pill>
            </div>
          ))}
        </div>
        <div className={styles.subscribeSection}>
          <div className={`label ${styles.subscribeLabel}`}>Subscribe page copy</div>
          <p className={`serif ${styles.subscribeSub}`}>
            How your newsletter reads to a first-time visitor. Keep the literary voice — just make it a promise, not a description.
          </p>

          <div className={styles.subscribeGrid}>
            <div className={styles.subscribeFields}>
              <div className={styles.subscribeField}>
                <div className={styles.fieldLabel}>WHAT THE DISPATCH COVERS</div>
                <textarea
                  value={subWhat}
                  onChange={e => setSubWhat(e.target.value)}
                  rows={4}
                  className={styles.ta}
                />
              </div>
              <div className={styles.subscribeField}>
                <div className={styles.fieldLabel}>HOW OFTEN</div>
                <input
                  value={subFreq}
                  onChange={e => setSubFreq(e.target.value)}
                  className={styles.field}
                />
              </div>
              <div className={styles.subscribeField}>
                <div className={styles.fieldLabel}>WHAT MAKES IT WORTH THEIR INBOX</div>
                <textarea
                  value={subDistinct}
                  onChange={e => setSubDistinct(e.target.value)}
                  rows={3}
                  className={styles.ta}
                />
              </div>
              <div className={styles.subscribeSaveRow}>
                <Btn tone="primary">Save copy</Btn>
                <Btn tone="ghost">Copy share link</Btn>
              </div>
            </div>

            <div className={styles.subscribePreviewWrap}>
              <div className={styles.previewEyebrow}>READER PREVIEW</div>
              <div className={styles.previewCard}>
                <div className={styles.previewNewsletter}>The Margin Letter</div>
                <div className={styles.previewAuthor}>by Billie Wolf</div>
                <div className={styles.previewRule} />
                <p className={styles.previewWhat}>{subWhat || 'What your dispatch covers…'}</p>
                <p className={styles.previewFreq}>{subFreq || 'How often…'}</p>
                <p className={styles.previewDistinct}>{subDistinct || 'What makes it worth their inbox…'}</p>
                <div className={styles.previewCta}>Subscribe — it's free</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightPane}>
        <div className={styles.mentionsHeader}>
          <div className="label">Media mentions</div>
          <Btn tone="ghost" icon={<IconArrow size={12} />}>Add mention</Btn>
        </div>
        {MEDIA_MENTIONS.map((m, i) => (
          <div key={i} className={styles.mention}>
            <div className={styles.mentionHead}>
              <div className={styles.mentionOutlet}>{m.outlet.toUpperCase()}</div>
              <Pill tone={KIND_TONE[m.kind]}>{m.kind}</Pill>
            </div>
            <div className={`serif ${styles.mentionPiece}`}>{m.piece}</div>
            <div className={styles.mentionDate}>{m.date.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
