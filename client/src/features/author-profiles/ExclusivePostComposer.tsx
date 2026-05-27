import { useState } from 'react';
import { api } from '../../lib/api';
import type { ExclusivePostType } from '../reading/exclusive-data';
import { EXCLUSIVE_TYPE_LABEL } from '../reading/exclusive-data';
import { timeAgo } from '../notifications/data';
import styles from './ExclusivePostComposer.module.css';

interface PostedItem {
  id:       string;
  type:     ExclusivePostType;
  title:    string;
  postedAt: string;
}

interface Props {
  manuscriptId:    string;
  manuscriptTitle: string;
}

const POST_TYPES: ExclusivePostType[] = ['deleted_scene', 'character_note', 'sequel_hint', 'reflection'];

const DEMO_POSTED: PostedItem[] = [
  { id: 'dp1', type: 'deleted_scene',  title: 'Ch. 7: Elena finds the letter — deleted', postedAt: new Date(Date.now() - 2  * 86_400_000).toISOString() },
  { id: 'dp2', type: 'character_note', title: 'Why I wrote Marcus the way I did',         postedAt: new Date(Date.now() - 9  * 86_400_000).toISOString() },
];

export default function ExclusivePostComposer({ manuscriptId, manuscriptTitle }: Props) {
  const [open,       setOpen]       = useState(false);
  const [type,       setType]       = useState<ExclusivePostType>('deleted_scene');
  const [title,      setTitle]      = useState('');
  const [body,       setBody]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [posted,     setPosted]     = useState<PostedItem[]>(DEMO_POSTED);

  async function submitPost() {
    if (submitting || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/manuscripts/${manuscriptId}/exclusive-posts`, { type, title: title.trim(), body: body.trim() });
    } catch { /* endpoint may not exist yet */ }
    setPosted(prev => [{ id: `local-${Date.now()}`, type, title: title.trim(), postedAt: new Date().toISOString() }, ...prev]);
    setTitle('');
    setBody('');
    setOpen(false);
    setSubmitting(false);
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>For your readers</span>
        {!open && (
          <button className={styles.composeBtn} type="button" onClick={() => setOpen(true)}>
            ◆ Post exclusive content
          </button>
        )}
      </div>

      {open && (
        <div className={styles.composer}>
          <p className={styles.composerNote}>
            Verified readers of <em>{manuscriptTitle}</em> — those who have submitted a review — will be notified.
          </p>

          <div className={styles.typeRow} role="group" aria-label="Content type">
            {POST_TYPES.map(t => (
              <button
                key={t}
                className={styles.typeBtn}
                data-active={type === t ? '' : undefined}
                type="button"
                onClick={() => setType(t)}
              >
                {EXCLUSIVE_TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <input
            className={styles.titleInput}
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
          />

          <textarea
            className={styles.bodyTextarea}
            placeholder="Write your exclusive content here…"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />

          <div className={styles.composerActions}>
            <button
              className={styles.postBtn}
              type="button"
              onClick={submitPost}
              disabled={submitting || !title.trim() || !body.trim()}
            >
              {submitting ? '…' : 'Post to verified readers →'}
            </button>
            <button className={styles.cancelBtn} type="button" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {posted.length > 0 && (
        <div className={styles.postedList}>
          {posted.map(item => (
            <div key={item.id} className={styles.postedItem}>
              <span className={styles.postedIcon}>◆</span>
              <span className={styles.postedType}>{EXCLUSIVE_TYPE_LABEL[item.type]}</span>
              <span className={styles.postedTitle}>{item.title}</span>
              <span className={styles.postedTime}>{timeAgo(item.postedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
