import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import { Avatar } from '../../shared/ui/atoms';
import styles from './AuthorMessages.module.css';

interface AuthorMessage {
  id:              string;
  manuscriptTitle: string;
  authorId:        string;
  authorName:      string;
  authorInitials:  string;
  message:         string;
  sentAt:          string;
}

export default function AuthorMessages() {
  const { session } = useAuth();
  const [messages,    setMessages]    = useState<AuthorMessage[]>([]);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [drafts,      setDrafts]      = useState<Record<string, string>>({});
  const [repliedIds,  setRepliedIds]  = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.token) return;
    void api.get<AuthorMessage[]>('/api/author-checkins/received')
      .then(data => setMessages(data))
      .catch(() => setMessages([]));
  }, [session?.token]);

  if (messages.length === 0) return null;

  function sendReply(msgId: string) {
    const body = drafts[msgId]?.trim();
    if (!body) return;
    void api.post(`/api/author-checkins/${msgId}/reply`, { body }).catch(() => {});
    setRepliedIds(prev => new Set([...prev, msgId]));
    setExpandedId(null);
  }

  return (
    <section>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>Messages from authors</span>
        <span className={styles.sectionCount}>{messages.length}</span>
      </div>
      <div className={styles.messageList}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={styles.messageCard}
            data-replied={repliedIds.has(msg.id) ? '' : undefined}
          >
            <div className={styles.cardHead}>
              <Avatar initials={msg.authorInitials} tone="accent" size={20} />
              <span className={styles.authorName}>{msg.authorName}</span>
              <span className={styles.bookTitle}>{msg.manuscriptTitle}</span>
              <span className={styles.timestamp}>
                {new Date(msg.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className={`serif ${styles.messageText}`}>{msg.message}</p>
            {repliedIds.has(msg.id) ? (
              <p className={styles.repliedNote} role="status">Your reply has been sent.</p>
            ) : expandedId === msg.id ? (
              <div className={styles.replyForm}>
                <textarea
                  className={styles.replyArea}
                  placeholder="Your reply…"
                  value={drafts[msg.id] ?? ''}
                  onChange={e => setDrafts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                  rows={3}
                  aria-label={`Reply to ${msg.authorName}`}
                  autoFocus
                />
                <div className={styles.replyFoot}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setExpandedId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.replyBtn}
                    onClick={() => sendReply(msg.id)}
                    disabled={!drafts[msg.id]?.trim()}
                  >
                    Send reply
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={styles.replyToggle}
                onClick={() => setExpandedId(msg.id)}
              >
                Reply <span aria-hidden="true">↓</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
