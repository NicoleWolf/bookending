import { useState, useRef, useEffect } from 'react';
import type { CorrespondenceThread, Manuscript } from './types';
import { Avatar } from '../../shared/ui/atoms';
import styles from './Correspondence.module.css';

interface Props {
  threads: CorrespondenceThread[];
  manuscripts: Manuscript[];
  initialThreadId?: number | null;
  onReply: (threadId: number, body: string) => void;
}

export default function Correspondence({ threads, manuscripts, initialThreadId, onReply }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    initialThreadId ?? threads[0]?.id ?? null
  );
  const [replyBody, setReplyBody] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = threads.find(t => t.id === selectedId) ?? null;

  useEffect(() => {
    if (initialThreadId != null) setSelectedId(initialThreadId);
  }, [initialThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages.length]);

  function sendReply() {
    if (!replyBody.trim() || !selectedId) return;
    onReply(selectedId, replyBody.trim());
    setReplyBody('');
  }

  function manuscriptLabel(t: CorrespondenceThread): string {
    const ms = manuscripts.find(m => m.id === t.manuscriptId);
    return ms ? `${ms.title} · ${t.draftVersion}` : t.draftVersion;
  }

  function lastMessage(t: CorrespondenceThread) {
    return t.messages[t.messages.length - 1];
  }

  function isUnread(t: CorrespondenceThread): boolean {
    return lastMessage(t)?.author === 'reader';
  }

  const sorted = [...threads].sort((a, b) => b.id - a.id);

  return (
    <div className={styles.wrap}>

      {/* ── Thread list ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <span className={styles.sidebarTitle}>Correspondence</span>
          <span className={styles.sidebarCount}>{threads.length}</span>
        </div>
        {sorted.length === 0 ? (
          <div className={styles.sidebarEmpty}>
            <span>No letters yet</span>
          </div>
        ) : sorted.map(t => {
          const last = lastMessage(t);
          const unread = isUnread(t);
          return (
            <button
              key={t.id}
              className={styles.threadItem}
              data-selected={selectedId === t.id ? '' : undefined}
              data-unread={unread ? '' : undefined}
              onClick={() => setSelectedId(t.id)}
            >
              <div className={styles.threadItemHead}>
                <Avatar initials={t.reader.initials} tone={t.reader.tone} size={28} />
                <div className={styles.threadItemMeta}>
                  <div className={styles.threadItemName}>
                    {t.reader.name}
                    {unread && <span className={styles.unreadDot} />}
                  </div>
                  <div className={styles.threadItemMs}>{manuscriptLabel(t)}</div>
                </div>
              </div>
              <div className={styles.threadItemPreview}>
                {last?.body.slice(0, 72).replace(/\n/g, ' ')}…
              </div>
              <div className={styles.threadItemTime}>{last?.sentAt}</div>
            </button>
          );
        })}
      </div>

      {/* ── Message view ── */}
      {selected == null ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>Select a thread to read</span>
        </div>
      ) : (
        <div className={styles.main}>

          <div className={styles.mainHead}>
            <div className={styles.mainHeadLeft}>
              <Avatar initials={selected.reader.initials} tone={selected.reader.tone} size={32} />
              <div>
                <div className={styles.mainHeadName}>{selected.reader.name}</div>
                <div className={styles.mainHeadMs}>{manuscriptLabel(selected)}</div>
              </div>
            </div>
            <div className={styles.mainHeadMeta}>
              <span className={styles.mainHeadOpened}>
                Opened {selected.openedAt} · {selected.messages.length}{' '}
                {selected.messages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
          </div>

          <div className={styles.messages}>
            {selected.messages.map((msg, i) => (
              <div
                key={msg.id}
                className={styles.message}
                data-author={msg.author}
                data-first={i === 0 ? '' : undefined}
              >
                <div className={styles.messageMeta}>
                  <Avatar
                    initials={msg.author === 'reader' ? selected.reader.initials : 'BW'}
                    tone={msg.author === 'reader' ? selected.reader.tone : 'paper'}
                    size={24}
                  />
                  <span className={styles.messageAuthor}>{msg.authorName}</span>
                  <span className={styles.messageTime}>{msg.sentAt}</span>
                </div>
                <div className={styles.messageBody}>
                  {msg.body}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.replyArea}>
            {isUnread(selected) ? (
              <div className={styles.replyPrompt}>
                Reply from Billie Wolf
              </div>
            ) : (
              <div className={styles.replyWaiting}>
                Waiting for {selected.reader.name.split(' ')[0]}'s reply
              </div>
            )}
            <textarea
              className={styles.replyTextarea}
              placeholder="Write your reply…"
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply();
              }}
            />
            <div className={styles.replyFooter}>
              <span className={styles.replyHint}>⌘↵ to send</span>
              <button
                className={styles.replyBtn}
                data-disabled={!replyBody.trim() ? '' : undefined}
                onClick={sendReply}
              >
                Send reply →
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
