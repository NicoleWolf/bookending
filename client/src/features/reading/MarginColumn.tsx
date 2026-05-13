import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Btn } from '../../shared/ui/atoms';
import type { Highlight } from './types';
import styles from './MarginColumn.module.css';

interface PendingDraftProps {
  pending:      { chapterId: number; paraId: number; text: string };
  draftNote:    string;
  onNoteChange: (v: string) => void;
  onSave:       () => void;
  onDismiss:    () => void;
}

interface Props {
  highlights:      Highlight[];
  paraRefMap:      RefObject<Map<string, HTMLElement>>;
  chapterId:       number | null;
  onEdit:          (id: string, draft: string) => void;
  onSaveEdit:      (id: string) => void;
  onDelete:        (id: string) => void;
  editingId:       string | null;
  editDraft:       string;
  setEditDraft:    (v: string) => void;
  authorFirstName: string;
  focusedHighlightId?: string | null;
  onClearFocus?: () => void;
  pendingDraft?:   PendingDraftProps;
  layout?: 'sheet';
}

type PositionedCard =
  | { type: 'highlight'; highlight: Highlight; top: number }
  | { type: 'pending';   top: number };

function relativeTime(isoOrLabel: string): string {
  if (isoOrLabel === 'just now') return 'just now';
  const d = new Date(isoOrLabel);
  if (isNaN(d.getTime())) return isoOrLabel;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function truncateAtWord(str: string, max: number): string {
  if (str.length <= max) return str;
  const cut = str.lastIndexOf(' ', max);
  return str.slice(0, cut > 0 ? cut : max) + '…';
}

const CARD_GAP  = 12;
const CARD_H_EST = 120; // conservative minimum card height

export default function MarginColumn({
  highlights, paraRefMap, chapterId,
  onEdit, onSaveEdit, onDelete,
  editingId, editDraft, setEditDraft, authorFirstName,
  focusedHighlightId, onClearFocus, pendingDraft, layout,
}: Props) {
  const [positioned, setPositioned] = useState<PositionedCard[]>([]);
  const marginRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const hasPending = !!pendingDraft?.pending;
    if (!paraRefMap.current || (highlights.length === 0 && !hasPending)) {
      setPositioned([]);
      return;
    }

    const containerTop = marginRef.current ? marginRef.current.getBoundingClientRect().top : 0;

    type RawItem = { key: string; top: number; isPending: boolean; highlight?: Highlight };
    const items: RawItem[] = highlights.map(h => {
      const key = `${h.chapterId}-${h.paraId}`;
      const el  = paraRefMap.current?.get(key);
      const top = el ? el.getBoundingClientRect().top - containerTop : 0;
      return { key: h.id, top, isPending: false, highlight: h };
    });

    if (hasPending && pendingDraft) {
      const { chapterId: cId, paraId: pId } = pendingDraft.pending;
      const el  = paraRefMap.current?.get(`${cId}-${pId}`);
      const top = el ? el.getBoundingClientRect().top - containerTop : 0;
      items.push({ key: 'pending', top, isPending: true });
    }

    items.sort((a, b) => a.top - b.top);

    let prevBottom = 0;
    const result: PositionedCard[] = items.map(({ isPending, highlight, top }) => {
      const cardTop = Math.max(top, prevBottom + CARD_GAP);
      prevBottom = cardTop + CARD_H_EST;
      if (isPending) return { type: 'pending', top: cardTop };
      return { type: 'highlight', highlight: highlight!, top: cardTop };
    });

    setPositioned(result);
  }, [highlights, paraRefMap, chapterId, pendingDraft]);

  const hasPending = !!pendingDraft?.pending;
  if (highlights.length === 0 && !hasPending) return <div className={styles.marginCol} />;

  const displayCards = focusedHighlightId
    ? positioned.filter(c => c.type === 'pending' || (c.type === 'highlight' && c.highlight.id === focusedHighlightId))
    : positioned;

  return (
    <div className={styles.marginCol} data-layout={layout}>
      <div className={styles.marginInner} ref={marginRef}>
        {displayCards.map((card) => {
          if (card.type === 'pending') {
            if (!pendingDraft) return null;
            const pd = pendingDraft;
            return (
              <div
                key="pending"
                className={styles.composeCard}
                style={{ top: card.top }}
              >
                <div className={styles.connectorTick} />
                <blockquote className={`serif ${styles.anchorQuote}`}>
                  "{truncateAtWord(pd.pending.text, 120)}"
                </blockquote>
                <textarea
                  autoFocus
                  className={styles.composeTextarea}
                  placeholder={`Your note to ${authorFirstName}…`}
                  value={pd.draftNote}
                  onChange={e => pd.onNoteChange(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) pd.onSave(); }}
                />
                <div className={styles.composeActions}>
                  <Btn tone="primary" className={styles.btnXxs} onClick={pd.onSave}>Save note</Btn>
                  <Btn tone="ghost"   className={styles.btnXxs} onClick={pd.onDismiss}>Dismiss</Btn>
                </div>
              </div>
            );
          }

          const h = card.highlight;
          const lastReply = h.thread[h.thread.length - 1];
          const hasWriterReply = h.thread.some(t => t.authorRole === 'writer');
          const isEditing = editingId === h.id;

          return (
            <div
              key={h.id}
              className={styles.noteCard}
              data-status={h.status}
              data-focused={focusedHighlightId === h.id ? 'true' : undefined}
              style={{ top: card.top }}
            >
              {/* Connector tick */}
              <div className={styles.connectorTick} />

              {/* Anchor quote */}
              <blockquote className={`serif ${styles.anchorQuote}`}>
                "{truncateAtWord(h.selectedText, 120)}"
              </blockquote>

              {/* Reader's initial note */}
              {isEditing ? (
                <div className={styles.editArea}>
                  <textarea
                    autoFocus
                    className={styles.editTextarea}
                    value={editDraft}
                    onChange={e => setEditDraft(e.target.value)}
                  />
                  <div className={styles.editActions}>
                    <Btn tone="primary" className={styles.btnXxs} onClick={() => onSaveEdit(h.id)}>Save</Btn>
                    <Btn tone="ghost"   className={styles.btnXxs} onClick={() => onEdit('', '')}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                h.note && (
                  <p className={styles.readerBody}>{h.note}</p>
                )
              )}

              {/* Thread: writer replies */}
              {h.thread.map(t => (
                <div key={t.id} className={styles.threadTurn} data-role={t.authorRole}>
                  <span className={styles.threadAvatar}>
                    {t.authorRole === 'writer' ? authorFirstName[0].toUpperCase() : 'M'}
                  </span>
                  {t.authorRole === 'writer'
                    ? <em className={`serif ${styles.writerBody}`}>{t.body}</em>
                    : <span className={styles.readerThreadBody}>{t.body}</span>
                  }
                </div>
              ))}

              {/* Footer */}
              <div className={styles.noteFooter}>
                {focusedHighlightId === h.id && onClearFocus && (
                  <button className={styles.clearFocusBtn} onClick={onClearFocus}>← all notes</button>
                )}
                {lastReply ? (
                  <span className={styles.footerActivity}>
                    {lastReply.authorRole === 'writer' ? authorFirstName : 'You'} replied · {relativeTime(lastReply.createdAt)}
                  </span>
                ) : (
                  <span className={styles.footerStatus} data-status={h.status}>
                    {h.status === 'draft' ? 'Draft — not yet sent' : `Sent · ${h.time}`}
                  </span>
                )}
                <div className={styles.footerActions}>
                  {!isEditing && h.status === 'draft' && (
                    <button className={styles.editBtn} onClick={() => onEdit(h.id, h.note)}>Edit</button>
                  )}
                  {!isEditing && (
                    <button className={styles.deleteBtn} onClick={() => onDelete(h.id)}>✕</button>
                  )}
                  {hasWriterReply && (
                    <button className={styles.replyBtn}>Reply ›</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
