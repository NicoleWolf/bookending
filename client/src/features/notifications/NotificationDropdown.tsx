import styles from './NotificationDropdown.module.css';
import type { AppNotification } from './data';
import { timeAgo } from './data';

interface Props {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onCta?: (authorId: string, tab?: string, bookId?: string) => void;
}

export default function NotificationDropdown({ notifications, onMarkRead, onMarkAllRead, onCta }: Props) {
  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className={styles.dropdown}>
      <div className={styles.head}>
        <span className={styles.headTitle}>Notifications</span>
        {hasUnread && (
          <button className={styles.markAll} onClick={onMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <p className={styles.empty}>All caught up.</p>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={styles.item}
              data-unread={!n.read ? '' : undefined}
              data-type={n.type}
              onClick={() => !n.read && onMarkRead(n.id)}
            >
              <div className={styles.dot} />
              <div className={styles.body}>
                <span className={styles.stage}>{n.stage}</span>
                <p className={styles.message}>{n.message}</p>
                <span className={styles.time}>{timeAgo(n.receivedAt)}</span>
                {n.cta && onCta && (
                  <button
                    className={styles.cta}
                    onClick={e => {
                      e.stopPropagation();
                      onMarkRead(n.id);
                      onCta(n.cta!.authorId, n.cta!.tab, n.cta!.bookId);
                    }}
                  >
                    {n.cta.label} <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
