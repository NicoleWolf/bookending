import { useLayoutEffect, useState, type RefObject } from 'react';
import { Btn } from '../../shared/ui/atoms';
import type { Highlight } from './types';
import styles from './MarginColumn.module.css';

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
}

interface PositionedCard { highlight: Highlight; top: number; }

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
}: Props) {
  const [positioned, setPositioned] = useState<PositionedCard[]>([]);

  useLayoutEffect(() => {
    if (!paraRefMap.current || highlights.length === 0) {
      setPositioned([]);
      return;
    }

    // Get anchor tops from paraRefMap
    const withTops = highlights.map(h => {
      const key = `${h.chapterId}-${h.paraId}`;
      const el  = paraRefMap.current?.get(key);
      const top = el ? el.offsetTop : 0;
      return { highlight: h, top };
    }).sort((a, b) => a.top - b.top);

    // No-overlap stacking: each card's top = max(anchorTop, prevBottom + gap)
    let prevBottom = 0;
    const result = withTops.map(({ highlight, top }) => {
      const cardTop = Math.max(top, prevBottom + CARD_GAP);
      prevBottom = cardTop + CARD_H_EST;
      return { highlight, top: cardTop };
    });

    setPositioned(result);
  }, [highlights, paraRefMap, chapterId]);

  if (highlights.length === 0) return <div className={styles.marginCol} />;

  return (
    <div className={styles.marginCol}>
      <div className={styles.marginInner}>
        {positioned.map(({ highlight: h, top }) => {
          const lastReply = h.thread[h.thread.length - 1];
          const hasWriterReply = h.thread.some(t => t.authorRole === 'writer');
          const isEditing = editingId === h.id;

          return (
            <div
              key={h.id}
              className={styles.noteCard}
              data-status={h.status}
              style={{ top }}
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
                    <Btn tone="primary" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => onSaveEdit(h.id)}>Save</Btn>
                    <Btn tone="ghost"   style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => onEdit('', '')}>Cancel</Btn>
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
