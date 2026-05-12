import { useState } from 'react';
import { Btn } from '../../shared/ui/atoms';
import { IconArrow, IconCheck } from '../../shared/ui/icons';
import { SEGMENTS, SUBSCRIBERS, SOCIAL_LINKS } from './data';
import { useAuth } from '../auth';
import type { Dispatch } from './types';
import styles from './Compose.module.css';

import { api } from '../../lib/api';

interface ComposeOption {
  id:         string;
  title:      string;
  desc:       string;
  subject?:   string;
  body?:      string;
  winback?:   true;
}

function buildOptions(dispatches: Dispatch[]): ComposeOption[] {
  const opts: ComposeOption[] = [];

  const nextNum = dispatches.filter(d => d.status === 'sent').length + 1;
  opts.push({
    id:    'blank',
    title: 'Start blank',
    desc:  `A clean page. No. ${nextNum}.`,
  });

  const sent = dispatches.filter(d => d.status === 'sent' && d.openRate != null);
  if (sent.length > 0) {
    const avg = sent.reduce((s, d) => s + parseFloat(d.openRate!), 0) / sent.length;
    const best = sent[0];
    if (best.openRate && parseFloat(best.openRate) > avg + 5) {
      opts.push({
        id:      'followup',
        title:   `Follow up on ${best.issue}`,
        desc:    `Opened at ${best.openRate} — ${(parseFloat(best.openRate) - avg).toFixed(1)} points above your average. Reply momentum is still building.`,
        subject: `A follow-up — and something I forgot to say`,
        body:    `Dear reader,\n\nA few days ago I sent ${best.issue} about finishing a second draft. Several of you wrote back — thank you.\n\nI wanted to add something I left out of that letter…`,
      });
    }
  }

  const newSeg = SEGMENTS.find(s => s.key === 'new');
  if (newSeg && newSeg.n > 0) {
    opts.push({
      id:      'welcome',
      title:   `Welcome ${newSeg.n} new readers`,
      desc:    `${newSeg.n} readers joined this month and haven't received a welcome note.`,
      subject: `Welcome — glad you're here`,
      body:    `Dear reader,\n\nIf you're new to The Margin Letter: welcome. I write about the experience of making a book — not the advice, but the actual texture of it.\n\nEvery dispatch is sent as a letter. I hope this one finds you well.\n\n— Billie`,
    });
  }

  const patrons = SUBSCRIBERS.filter(s => s.spent !== '$0');
  if (patrons.length > 0) {
    opts.push({
      id:      'patrons',
      title:   `Note to ${patrons.length} Patrons`,
      desc:    'A private note to readers who\'ve bought your work — an acknowledgment they rarely receive.',
      subject: `For the readers who've supported the work`,
      body:    `Dear reader,\n\nThis note goes only to a small group — readers who've ordered a copy, or more than one. You've done something most readers don't.\n\nI wanted to say that directly, without fanfare.\n\n— Billie`,
    });
  }

  const coolSeg = SEGMENTS.find(s => s.key === 'cool');
  if (coolSeg && coolSeg.pct >= 0.15) {
    opts.push({
      id:      'winback',
      title:   `A note to ${coolSeg.n.toLocaleString()} drifting readers`,
      desc:    'A two-note sequence is drafted — check in quietly, then clear the list of readers who\'ve truly moved on.',
      winback: true,
    });
  }

  return opts;
}

interface Adaptation {
  platform:   'instagram' | 'goodreads' | 'bookshop';
  label:      string;
  body:       string;
  scheduled?: boolean;
}

function buildAdaptations(subject: string, body: string): Adaptation[] {
  const adaptations: Adaptation[] = [];
  const connectedPlatforms = SOCIAL_LINKS.map(s => s.platform);

  if (connectedPlatforms.includes('instagram')) {
    const words = body.trim().split(/\s+/).slice(0, 30).join(' ');
    adaptations.push({
      platform: 'instagram',
      label:    'Instagram caption',
      body:     `${words}…\n\nFull dispatch in the link in bio. ✉️`,
    });
  }

  if (connectedPlatforms.includes('goodreads')) {
    adaptations.push({
      platform: 'goodreads',
      label:    'Goodreads reading update',
      body:     `This week's dispatch — "${subject}" — went out to readers. Writing is slower than I'd like it to be, but the work is honest. Progress continues.`,
    });
  }

  if (connectedPlatforms.includes('bookshop')) {
    adaptations.push({
      platform: 'bookshop',
      label:    'Bookshop note',
      body:     `New dispatch: "${subject}". If you've been meaning to order a copy of The Salt Roads, now is as good a time as any.`,
    });
  }

  return adaptations;
}

interface Props {
  dispatches:       Dispatch[];
  onBack:           () => void;
  onRouteToWinBack: () => void;
  onSaved:          (dispatch: Dispatch) => void;
}

import type { DispatchRecord } from '@bookending/shared';

function recordToDispatch(r: DispatchRecord): Dispatch {
  return {
    id:        r.id,
    issue:     r.issue,
    subject:   r.subject,
    date:      r.sentAt ? new Date(r.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
    status:    r.status.toLowerCase() as Dispatch['status'],
    opens: null, openRate: null, replies: null, clickRate: null, unsubs: null, recipients: null,
  };
}

export function ComposeView({ dispatches, onBack, onRouteToWinBack, onSaved }: Props) {
  const { session } = useAuth();
  const [step,    setStep]    = useState<'choose' | 'write' | 'adapt'>('choose');
  const [subject, setSubject] = useState('');
  const [body,    setBody]    = useState('');
  const [recipients, setRecipients] = useState<'all' | 'devout' | 'warm'>('all');
  const [sent, setSent] = useState(false);
  const [adaptations, setAdaptations] = useState<Adaptation[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const recipientCount = recipients === 'all' ? 3055 : recipients === 'devout' ? 1284 : 2231;

  const sentCount  = dispatches.filter(d => d.status === 'sent').length;
  const nextIssue  = `No. ${sentCount + 1}`;

  const options = buildOptions(dispatches);

  async function saveDispatch(status: 'SENT' | 'DRAFT') {
    if (!session?.token) return;
    setIsSaving(true);
    try {
      const created = await api.post<DispatchRecord>('/api/dispatches', {
        issue:      status === 'SENT' ? nextIssue : 'Draft',
        subject:    subject.trim(),
        body:       body.trim(),
        recipients,
        status,
        sentAt:     status === 'SENT' ? new Date().toISOString() : null,
      });
      onSaved(recordToDispatch(created));
    } catch { /* network error — fall through */ }
    finally { setIsSaving(false); }
  }

  function selectOption(opt: ComposeOption) {
    if (opt.winback) { onRouteToWinBack(); return; }
    setSubject(opt.subject ?? '');
    setBody(opt.body ?? '');
    setStep('write');
  }

  if (step === 'choose') {
    return (
      <div className={styles.chooser}>
        <div className={styles.chooserHeader}>
          <div className={styles.chooserEyebrow}>NEW DISPATCH · {nextIssue.toUpperCase()}</div>
          <h2 className={`serif ${styles.chooserTitle}`}>How would you like to begin?</h2>
        </div>
        <div className={styles.optionList}>
          {options.map(opt => (
            <button key={opt.id} className={styles.option} onClick={() => selectOption(opt)}>
              <div className={styles.optionBody}>
                <div className={styles.optionTitle}>{opt.title}</div>
                <div className={`serif ${styles.optionDesc}`}>{opt.desc}</div>
              </div>
              <span className={styles.optionArrow}>→</span>
            </button>
          ))}
        </div>
        <button className={styles.chooserBackBtn} onClick={onBack}>← Back to dispatches</button>
      </div>
    );
  }

  if (sent) {
    return (
      <div className={styles.sentState}>
        <div className={styles.sentIcon}>
          <IconCheck size={22} />
        </div>
        <h2 className={`serif ${styles.sentTitle}`}>Dispatch sent.</h2>
        <p className={`serif ${styles.sentText}`}>
          Delivered to {recipientCount.toLocaleString()} readers. You'll see open rates within 24 hours.
        </p>
        <Btn tone="ghost" onClick={onBack}>Back to dispatches</Btn>
      </div>
    );
  }

  if (step === 'adapt') {
    return (
      <div className={styles.adaptScreen}>
        <div className={styles.adaptHeader}>
          <div className={styles.adaptEyebrow}>DISPATCH READY</div>
          <h2 className={`serif ${styles.adaptTitle}`}>Route to connected channels?</h2>
          <p className={`serif ${styles.adaptSub}`}>Your dispatch will go to {recipientCount.toLocaleString()} readers. The drafts below can go out alongside it.</p>
        </div>

        <div className={styles.adaptCards}>
          {adaptations.map((a, i) => (
            <div key={a.platform} className={styles.adaptCard}>
              <div className={styles.adaptCardTop}>
                <span className={styles.adaptPlatform}>{a.label.toUpperCase()}</span>
                <button
                  className={styles.adaptScheduleBtn}
                  data-scheduled={a.scheduled ? 'true' : undefined}
                  onClick={() => setAdaptations(prev =>
                    prev.map((x, j) => j === i ? { ...x, scheduled: !x.scheduled } : x)
                  )}
                >
                  {a.scheduled ? '✓ Scheduled' : 'Schedule →'}
                </button>
              </div>
              <textarea
                className={styles.adaptTextarea}
                value={a.body}
                rows={4}
                onChange={e => setAdaptations(prev =>
                  prev.map((x, j) => j === i ? { ...x, body: e.target.value } : x)
                )}
              />
            </div>
          ))}
        </div>

        <div className={styles.adaptFooter}>
          <Btn tone="accent" icon={<IconArrow size={13} />} disabled={isSaving} onClick={async () => { await saveDispatch('SENT'); setSent(true); }}>
            {isSaving ? 'Sending…' : 'Send dispatch'}
          </Btn>
          <Btn tone="ghost" disabled={isSaving} onClick={async () => { await saveDispatch('SENT'); setSent(true); }}>
            Send without routing
          </Btn>
          <Btn tone="ghost" onClick={() => setStep('write')}>
            ← Back to dispatch
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.composeGrid}>
      <div className={styles.editorPanel}>
        <div className={styles.editorHeader}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <span className={styles.dispatchLabel}>NEW DISPATCH</span>
        </div>

        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject line — make it worth opening"
          className={styles.subjectInput}
        />

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={`Dear reader,\n\nStart writing…`}
          rows={24}
          className={styles.bodyTextarea}
        />

        <div className={styles.editorFooter}>
          <Btn
            tone="accent"
            icon={<IconArrow size={13} />}
            disabled={isSaving}
            onClick={async () => {
              if (!subject || !body) return;
              const drafts = buildAdaptations(subject, body);
              if (drafts.length > 0) {
                setAdaptations(drafts);
                setStep('adapt');
              } else {
                await saveDispatch('SENT');
                setSent(true);
              }
            }}
          >
            {isSaving ? 'Sending…' : 'Send now'}
          </Btn>
          <Btn tone="ghost" disabled={isSaving} onClick={async () => { if (!subject) return; await saveDispatch('DRAFT'); }}>Save draft</Btn>
          <Btn tone="ghost">Schedule</Btn>
        </div>
      </div>

      <div className={styles.sidePanel}>
        <div>
          <div className={`label ${styles.sideSectionLabel}`}>Send to</div>
          <div className={styles.recipientList}>
            {[
              { v: 'all'    as const, label: 'All subscribers',  sub: '3,055 readers' },
              { v: 'devout' as const, label: 'Devout only',      sub: '1,284 readers' },
              { v: 'warm'   as const, label: 'Devout + warm',    sub: '2,231 readers' },
            ].map(opt => (
              <label
                key={opt.v}
                className={styles.recipientOption}
                data-active={recipients === opt.v ? 'true' : undefined}
              >
                <input
                  type="radio"
                  name="recipients"
                  value={opt.v}
                  checked={recipients === opt.v}
                  onChange={() => setRecipients(opt.v)}
                  className={styles.accentCheckbox}
                />
                <div>
                  <div className={styles.recipientLabel}>{opt.label}</div>
                  <div className={styles.recipientSub}>{opt.sub.toUpperCase()}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className={`label ${styles.checkSectionLabel}`}>Before you send</div>
          <div className={styles.checklistItems}>
            {[
              { done: subject.length > 0, text: 'Subject line written' },
              { done: body.length > 200,  text: 'Body over 200 characters' },
              { done: body.length > 0,    text: 'Preview text set' },
            ].map((item, i) => (
              <div
                key={i}
                className={styles.checklistItem}
                data-done={item.done ? 'true' : undefined}
              >
                <div className={styles.checkBox} data-done={item.done ? 'true' : undefined}>
                  {item.done && <IconCheck size={10} className={styles.iconInk} />}
                </div>
                <span className={styles.checkText}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.senderBox}>
          <div className={styles.senderLabel}>SENDING AS</div>
          <div className={styles.senderName}>The Margin Letter</div>
          <div className={styles.senderEmail}>letter@billiewolf.bookending.press</div>
          <div className={styles.issueBox}>
            <div className={styles.issueBoxLabel}>ISSUE NUMBER</div>
            <div className={styles.issueNum}>{nextIssue}</div>
          </div>
        </div>

        {body.length > 0 && (
          <div>
            <div className={`label ${styles.wordCountLabel}`}>Word count</div>
            <div className={`serif ${styles.wordValue}`}>
              {body.trim().split(/\s+/).filter(Boolean).length}
            </div>
            <div className={styles.wordAvg}>AVG DISPATCH: 620 WORDS</div>
          </div>
        )}
      </div>
    </div>
  );
}
