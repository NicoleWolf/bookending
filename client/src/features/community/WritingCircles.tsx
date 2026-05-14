import { useState } from 'react';
import { Btn, Avatar } from '../../shared/ui/atoms';
import { IconArrow, IconQuote } from '../../shared/ui/icons';
import type { WritingCircle, SharedPassage } from './types';
import styles from './WritingCircles.module.css';

// ── Circle card ──────────────────────────────────────────────────── //
function CircleCard({ circle, joined, requested, onOpen, onJoin, onRequest }: {
  circle: WritingCircle;
  joined: boolean;
  requested: boolean;
  onOpen: () => void;
  onJoin: () => void;
  onRequest: () => void;
}) {
  const full = circle.memberCount >= circle.maxMembers && !joined;
  return (
    <div className={styles.circleCard}>
      <div className={styles.circleCardMain}>
        <div className={styles.circleCardMeta}>
          <span className={styles.genreTag}>{circle.genre}</span>
          {circle.privacy === 'invite' && <span className={styles.inviteTag}>INVITE ONLY</span>}
        </div>
        <h3 className={`serif ${styles.circleName}`}>{circle.name}</h3>
        <p className={styles.circleDesc}>{circle.description}</p>
      </div>
      <div className={styles.circleCardFoot}>
        <div className={styles.circleStats}>
          <span className={styles.circleStat}>
            <span className={styles.circleStatVal}>{circle.memberCount}</span>/{circle.maxMembers}
          </span>
          <span className={styles.circleStatSep} />
          <span className={styles.circleStat}>{circle.frequency.toUpperCase()}</span>
          {circle.nextSession !== 'TBD' && <>
            <span className={styles.circleStatSep} />
            <span className={styles.circleStat}>{circle.nextSession}</span>
          </>}
        </div>
        <div className={styles.circleCardAction}>
          {joined ? (
            <Btn tone="ghost" icon={<IconArrow size={13} />} onClick={onOpen}>Open circle</Btn>
          ) : full ? (
            <span className={styles.circleFullLabel}>CIRCLE FULL</span>
          ) : circle.privacy === 'invite' ? (
            <Btn tone={requested ? 'ghost' : 'primary'} onClick={() => { if (!requested) onRequest(); }}>
              {requested ? 'Request sent' : 'Request to join'}
            </Btn>
          ) : (
            <Btn tone="primary" icon={<IconArrow size={13} />} onClick={onJoin}>Join circle</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create modal ─────────────────────────────────────────────────── //
function CreateCircleModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: Omit<WritingCircle, 'id' | 'members' | 'passages' | 'joined' | 'organiser'>) => void;
}) {
  const [name,       setName]       = useState('');
  const [desc,       setDesc]       = useState('');
  const [genre,      setGenre]      = useState('');
  const [freq,       setFreq]       = useState('Weekly');
  const [privacy,    setPrivacy]    = useState<'open' | 'invite'>('open');
  const [maxMembers, setMaxMembers] = useState('8');

  function submit() {
    if (!name.trim()) return;
    onCreate({
      name:        name.trim(),
      description: desc.trim(),
      genre:       genre.trim() || 'General Fiction',
      frequency:   freq,
      privacy,
      maxMembers:  parseInt(maxMembers, 10),
      memberCount: 1,
      nextSession: 'TBD',
    });
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>START A WRITING CIRCLE</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Circle name</label>
            <input
              autoFocus
              className={styles.input}
              placeholder="e.g. The Harbour Circle…"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Genre or focus&ensp;<span className={styles.fieldOpt}>(optional)</span>
            </label>
            <input
              className={styles.input}
              placeholder="e.g. Literary Fiction, Horror, Any Genre…"
              value={genre}
              onChange={e => setGenre(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              Description&ensp;<span className={styles.fieldOpt}>(optional)</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Tell potential members what this circle is about and how it works…"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Meeting frequency</label>
              <select className={styles.select} value={freq} onChange={e => setFreq(e.target.value)}>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Max members</label>
              <select className={styles.select} value={maxMembers} onChange={e => setMaxMembers(e.target.value)}>
                {[4, 6, 8, 10, 12].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Privacy</label>
            <div className={styles.privacyOpts}>
              {(['open', 'invite'] as const).map(p => (
                <div
                  key={p}
                  className={styles.privacyOpt}
                  data-active={privacy === p ? 'true' : undefined}
                  onClick={() => setPrivacy(p)}
                >
                  <input type="radio" className={styles.radio} readOnly checked={privacy === p} />
                  <div>
                    <div className={styles.optTitle}>{p === 'open' ? 'Open to all' : 'Invite only'}</div>
                    <div className={styles.optDesc}>
                      {p === 'open' ? 'Any member can join directly' : 'Members request to join; you approve'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.modalFoot}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button
            className={styles.btnPrimary}
            data-disabled={!name.trim() ? 'true' : undefined}
            onClick={submit}
          >
            Start circle →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Circle detail ────────────────────────────────────────────────── //
function CircleDetail({ circle, passages, onPassagesChange, onBack, onLeave }: {
  circle: WritingCircle;
  passages: SharedPassage[];
  onPassagesChange: (p: SharedPassage[]) => void;
  onBack: () => void;
  onLeave: () => void;
}) {
  const [showShare,   setShowShare]   = useState(false);
  const [shareSource, setShareSource] = useState('');
  const [shareText,   setShareText]   = useState('');
  const [replyingTo,  setReplyingTo]  = useState<number | null>(null);
  const [replyText,   setReplyText]   = useState('');

  function sharePassage() {
    if (!shareText.trim()) return;
    const p: SharedPassage = {
      id: Date.now(), author: 'Billie Wolf', initials: 'BW', tone: 'paper',
      source: shareSource.trim() || 'Untitled', time: 'just now',
      text: shareText.trim(), responses: [],
    };
    onPassagesChange([p, ...passages]);
    setShareSource(''); setShareText(''); setShowShare(false);
  }

  function postReply(passageId: number) {
    if (!replyText.trim()) return;
    onPassagesChange(passages.map(p => p.id === passageId
      ? { ...p, responses: [...p.responses, { author: 'Billie Wolf', initials: 'BW', tone: 'paper' as const, body: replyText.trim() }] }
      : p
    ));
    setReplyText(''); setReplyingTo(null);
  }

  const isOrganiser = circle.organiser === 'Billie Wolf';

  return (
    <div>
      <div className={styles.breadcrumb}>
        <button className={styles.backBtn} onClick={onBack}>← All circles</button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{circle.name}</span>
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.detailMain}>
          {showShare ? (
            <div className={styles.shareFormWrap}>
              <div className="label">Share a passage</div>
              <input
                placeholder="Source (e.g. The Lantern Keeper's Daughter, Ch. 3)…"
                value={shareSource}
                onChange={e => setShareSource(e.target.value)}
                className={styles.shareInput}
              />
              <textarea
                placeholder="Paste your passage here…"
                value={shareText}
                onChange={e => setShareText(e.target.value)}
                className={styles.shareTextarea}
              />
              <div className={styles.shareActions}>
                <Btn tone="primary" icon={<IconArrow size={14} />} onClick={sharePassage}>Share with circle</Btn>
                <Btn tone="ghost" onClick={() => { setShowShare(false); setShareText(''); setShareSource(''); }}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <div className={styles.shareTrigger}>
              <Btn tone="primary" icon={<IconQuote size={14} />} onClick={() => setShowShare(true)}>Share a passage</Btn>
            </div>
          )}

          <div className={styles.passageList}>
            {passages.length === 0 && (
              <div className={styles.emptyPassages}>
                <span className={styles.emptyLabel}>NO PASSAGES YET</span>
                <p className={styles.emptyText}>Be the first to share a passage with this circle.</p>
              </div>
            )}
            {passages.map(p => (
              <div key={p.id} className={styles.passageItem}>
                <div className={styles.passageHead}>
                  <Avatar initials={p.initials} tone={p.tone} size={30} />
                  <div>
                    <div className={styles.passageAuthor}>{p.author}</div>
                    <div className={styles.passageMeta}>{p.source} · {p.time}</div>
                  </div>
                </div>

                <p className={`serif ${styles.passageText}`}>{p.text}</p>

                {p.responses.length > 0 && (
                  <div className={styles.responses}>
                    {p.responses.map((r, ri) => (
                      <div key={ri} className={styles.responseRow}>
                        <Avatar initials={r.initials} tone={r.tone} size={24} />
                        <div>
                          <span className={styles.responseAuthor}>{r.author}</span>
                          <span className={styles.responseBody}>{r.body}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === p.id ? (
                  <div className={styles.replyFormRow}>
                    <Avatar initials="BW" tone="paper" size={24} />
                    <div className={styles.replyFormInner}>
                      <textarea
                        autoFocus
                        placeholder="Your response…"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className={styles.replyTextarea}
                      />
                      <div className={styles.replyBtnRow}>
                        <Btn tone="primary" className={styles.btnXs} onClick={() => postReply(p.id)}>Post</Btn>
                        <Btn tone="ghost"   className={styles.btnXs} onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Btn>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.replyBar}>
                    <span className={styles.replyCount}>{p.responses.length} {p.responses.length === 1 ? 'RESPONSE' : 'RESPONSES'}</span>
                    <button className={styles.replyBtn} onClick={() => { setReplyingTo(p.id); setReplyText(''); }}>Respond</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.detailSidebar}>
          <div className={styles.membersBox}>
            <div className={styles.membersHeader}>
              <div className={`label ${styles.membersName}`}>{circle.name}</div>
              <div className={styles.membersMeta}>{circle.members.length} MEMBERS · {circle.frequency.toUpperCase()}</div>
            </div>
            {circle.members.map(m => (
              <div key={m.name} className={styles.memberRow}>
                <Avatar initials={m.initials} tone={m.tone} size={26} />
                <span className={styles.memberName}>{m.name}</span>
                {m.role && <span className={styles.memberRole}>{m.role.toUpperCase()}</span>}
              </div>
            ))}
          </div>

          {circle.nextSession !== 'TBD' && (
            <div className={styles.sessionBox}>
              <div className="label">Next session</div>
              <p className={`serif ${styles.sessionTime}`}>{circle.nextSession}</p>
              <div className={styles.sessionMeta}>VIA VIDEO CALL · 90 MIN</div>
              <div className={styles.sessionDivider} />
              <Btn tone="ghost" className={styles.btnRsvp}>RSVP</Btn>
            </div>
          )}

          <div className={styles.queueBox}>
            <div className="label">Passage queue</div>
            <div className={styles.queueStats}>
              {passages.length} passage{passages.length !== 1 ? 's' : ''} shared this cycle<br />
              {passages.reduce((s, p) => s + p.responses.length, 0)} responses given
            </div>
          </div>

          {!isOrganiser && (
            <button className={styles.leaveBtn} onClick={onLeave}>Leave circle</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────── //
export default function WritingCircles() {
  const [circles,   setCircles]   = useState<WritingCircle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [requested,  setRequested]  = useState<Set<number>>(new Set());
  const [circlePassages, setCirclePassages] = useState<Map<number, SharedPassage[]>>(new Map());

  const selectedCircle = selectedId !== null ? circles.find(c => c.id === selectedId) ?? null : null;
  const myCircles      = circles.filter(c => c.joined);
  const openCircles    = circles.filter(c => !c.joined);

  function handleJoin(id: number) {
    setCircles(prev => prev.map(c => c.id === id
      ? { ...c, joined: true, memberCount: c.memberCount + 1, members: [...c.members, { name: 'Billie Wolf', initials: 'BW', tone: 'paper' as const }] }
      : c
    ));
    setSelectedId(id);
  }

  function handleRequest(id: number) {
    setRequested(prev => new Set(prev).add(id));
  }

  function handleLeave(id: number) {
    setCircles(prev => prev.map(c => c.id === id
      ? { ...c, joined: false, memberCount: c.memberCount - 1, members: c.members.filter(m => m.name !== 'Billie Wolf') }
      : c
    ));
    setSelectedId(null);
  }

  function handleCreate(data: Omit<WritingCircle, 'id' | 'members' | 'passages' | 'joined' | 'organiser'>) {
    const newCircle: WritingCircle = {
      ...data,
      id: Date.now(),
      members: [{ name: 'Billie Wolf', initials: 'BW', tone: 'paper', role: 'Organiser' }],
      passages: [],
      joined: true,
      organiser: 'Billie Wolf',
    };
    setCircles(prev => [...prev, newCircle]);
    setCirclePassages(prev => new Map(prev).set(newCircle.id, []));
    setShowCreate(false);
    setSelectedId(newCircle.id);
  }

  if (selectedCircle) {
    return (
      <CircleDetail
        circle={selectedCircle}
        passages={circlePassages.get(selectedCircle.id) ?? []}
        onPassagesChange={p => setCirclePassages(prev => new Map(prev).set(selectedCircle.id, p))}
        onBack={() => setSelectedId(null)}
        onLeave={() => handleLeave(selectedCircle.id)}
      />
    );
  }

  return (
    <div>
      {showCreate && (
        <CreateCircleModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      <div className={styles.listHeader}>
        <p className={styles.listIntro}>
          Small groups sharing work-in-progress and offering close reading. Each circle meets on its own schedule.
        </p>
        <Btn tone="primary" icon={<IconArrow size={14} />} onClick={() => setShowCreate(true)}>Start a circle</Btn>
      </div>

      {myCircles.length > 0 && (
        <div className={styles.listSection}>
          <div className={styles.listSectionHead}>
            <span className="label">Your circles</span>
            <span className={styles.listCount}>{myCircles.length}</span>
          </div>
          <div className={styles.cardGrid}>
            {myCircles.map(c => (
              <CircleCard key={c.id} circle={c} joined requested={requested.has(c.id)}
                onOpen={() => setSelectedId(c.id)} onJoin={() => handleJoin(c.id)} onRequest={() => handleRequest(c.id)} />
            ))}
          </div>
        </div>
      )}

      {openCircles.length > 0 && (
        <div className={styles.listSection}>
          <div className={styles.listSectionHead}>
            <span className="label">Discover circles</span>
            <span className={styles.listCount}>{openCircles.length}</span>
          </div>
          <div className={styles.cardGrid}>
            {openCircles.map(c => (
              <CircleCard key={c.id} circle={c} joined={false} requested={requested.has(c.id)}
                onOpen={() => setSelectedId(c.id)} onJoin={() => handleJoin(c.id)} onRequest={() => handleRequest(c.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
