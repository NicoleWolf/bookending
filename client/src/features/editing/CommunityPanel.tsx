import { useState } from 'react';
import { Pill, Avatar } from '../../shared/ui/atoms';
import type { WritingPrompt, SharedPassage, CircleMember } from '../community/types';

const WRITING_PROMPTS: WritingPrompt[] = [];
const INITIAL_PASSAGES: SharedPassage[] = [];
const CIRCLE_MEMBERS: CircleMember[] = [];
import styles from './CommunityPanel.module.css';

type PanelTab = 'prompts' | 'challenges' | 'passages';

type DetailItem =
  | { kind: 'prompt' | 'challenge'; item: WritingPrompt }
  | { kind: 'passage';              item: SharedPassage };

const PROMPT_PILL_TONE  = { prompt: 'accent', challenge: 'paper' } as const;
const PROMPT_PILL_LABEL = { prompt: 'Prompt', challenge: 'Challenge' } as const;

// ── Detail view ───────────────────────────────────────────────────
function DetailView({ item, onBack }: { item: DetailItem; onBack: () => void }) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailBack}>
        <button className={styles.detailBackBtn} onClick={onBack}>← Back</button>
      </div>

      <div className={styles.detailBody}>
        {(item.kind === 'prompt' || item.kind === 'challenge') && (
          <>
            <div className={styles.detailKind}>
              <Pill tone={PROMPT_PILL_TONE[item.kind]}>{PROMPT_PILL_LABEL[item.kind]}</Pill>
            </div>
            <p className={styles.detailTitle}>{item.item.title}</p>
            <p className={styles.detailText}>{item.item.body}</p>
            <div className={styles.detailMeta}>
              <Avatar initials={item.item.initials} tone={item.item.tone} size={18} />
              <span className={styles.detailAuthor}>{item.item.author}</span>
              <span className={styles.detailMetaText}>
                {item.item.responses} responses · {item.item.time}
              </span>
            </div>
          </>
        )}

        {item.kind === 'passage' && (
          <>
            <div className={styles.detailKind}>
              <Avatar initials={item.item.initials} tone={item.item.tone} size={20} />
              <span className={styles.detailAuthor}>{item.item.author}</span>
            </div>
            <p className={styles.detailSource}>{item.item.source}</p>
            <p className={`serif ${styles.detailPassage}`}>{item.item.text}</p>
            <div className={styles.detailMeta}>
              <span className={styles.detailMetaText}>{item.item.time}</span>
            </div>

            {item.item.responses.length > 0 && (
              <>
                <hr className={styles.detailDivider} />
                <span className={styles.detailResponsesHead}>
                  {item.item.responses.length} response{item.item.responses.length !== 1 ? 's' : ''}
                </span>
                {item.item.responses.map((r, i) => (
                  <div key={i} className={styles.response}>
                    <div className={styles.responseAuthor}>
                      <Avatar initials={r.initials} tone={r.tone} size={18} />
                      <span className={styles.responseAuthorName}>{r.author}</span>
                    </div>
                    <p className={styles.responseBody}>{r.body}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────
export default function CommunityPanel() {
  const [tab,    setTab]    = useState<PanelTab>('prompts');
  const [detail, setDetail] = useState<DetailItem | null>(null);

  const prompts    = WRITING_PROMPTS.filter(p => p.kind === 'prompt');
  const challenges = WRITING_PROMPTS.filter(p => p.kind === 'challenge');

  if (detail) return <DetailView item={detail} onBack={() => setDetail(null)} />;

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.headTitle}>Writing Circle</span>
        <span className={styles.headCount}>{CIRCLE_MEMBERS.length} members</span>
      </div>

      <div className={styles.tabs}>
        {(['prompts', 'challenges', 'passages'] as PanelTab[]).map(t => (
          <button
            key={t}
            className={styles.tab}
            data-active={tab === t ? '' : undefined}
            onClick={() => setTab(t)}
          >
            {t === 'prompts'    ? 'Prompts'
             : t === 'challenges' ? 'Challenges'
             : 'Passages'}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {tab === 'prompts' && prompts.map(p => (
          <button
            key={p.id}
            className={styles.card}
            onClick={() => setDetail({ kind: 'prompt', item: p })}
          >
            <div className={styles.cardTop}>
              <Pill tone="accent">Prompt</Pill>
              <span className={styles.cardMeta}>{p.responses} responses · {p.time}</span>
            </div>
            <p className={styles.cardTitle}>{p.title}</p>
            <p className={styles.cardExcerpt}>{p.body.slice(0, 88)}…</p>
          </button>
        ))}

        {tab === 'challenges' && challenges.map(p => (
          <button
            key={p.id}
            className={styles.card}
            onClick={() => setDetail({ kind: 'challenge', item: p })}
          >
            <div className={styles.cardTop}>
              <Pill tone="paper">Challenge</Pill>
              <span className={styles.cardMeta}>{p.responses} responses · {p.time}</span>
            </div>
            <p className={styles.cardTitle}>{p.title}</p>
            <p className={styles.cardExcerpt}>{p.body.slice(0, 88)}…</p>
          </button>
        ))}

        {tab === 'passages' && INITIAL_PASSAGES.map(p => (
          <button
            key={p.id}
            className={styles.card}
            onClick={() => setDetail({ kind: 'passage', item: p })}
          >
            <div className={styles.cardTop}>
              <Avatar initials={p.initials} tone={p.tone} size={18} />
              <span className={styles.cardAuthor}>{p.author}</span>
              <span className={styles.cardMeta}>{p.responses.length} responses · {p.time}</span>
            </div>
            <p className={styles.cardSource}>{p.source}</p>
            <p className={`serif ${styles.cardPassage}`}>{p.text.slice(0, 88)}…</p>
          </button>
        ))}
      </div>
    </div>
  );
}
