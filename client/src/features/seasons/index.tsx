import { useState } from 'react';
import { Btn, Pill } from '../../shared/ui/atoms';
import { IconCheck, IconArrow } from '../../shared/ui/icons';
import { ACTIVE_SEASON } from '../audience/data';
import type { SeasonTask } from '../audience/types';
import styles from './Seasons.module.css';

const STATUS_TONE: Record<SeasonTask['status'], 'good' | 'accent' | 'neutral'> = {
  done:        'good',
  'in-progress': 'accent',
  upcoming:    'neutral',
};

const CHANNELS_LABEL: Record<string, string> = {
  email:     'Email',
  instagram: 'Instagram',
  x:         'X',
  goodreads: 'Goodreads',
  bookshop:  'Bookshop',
};

function TaskRow({ task }: { task: SeasonTask }) {
  return (
    <div className={styles.taskRow} data-status={task.status}>
      <div className={styles.taskCheck} data-status={task.status}>
        {task.status === 'done' && <IconCheck size={11} className={styles.iconInk} />}
      </div>
      <div className={styles.taskBody}>
        <div className={styles.taskWeek}>{task.week.toUpperCase()}</div>
        <div className={styles.taskText}>{task.task}</div>
        {task.dueDate && task.status !== 'done' && (
          <div className={styles.taskDue} data-this-week={task.dueDate === 'This week' ? 'true' : undefined}>
            {task.dueDate === 'This week' ? 'Due this week' : `Due ${task.dueDate}`}
          </div>
        )}
      </div>
      <div className={styles.taskRight}>
        <Pill tone={STATUS_TONE[task.status]}>
          {task.status === 'in-progress' ? 'In progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </Pill>
        {task.action && task.status !== 'done' && (
          <button className={styles.taskAction}>{task.action} →</button>
        )}
      </div>
    </div>
  );
}

export function SeasonsView({ onCompose }: { onCompose?: () => void }) {
  const season = ACTIVE_SEASON;
  const [tab, setTab] = useState<'checklist' | 'channels' | 'timeline'>('checklist');

  const done       = season.tasks.filter(t => t.status === 'done').length;
  const inProgress = season.tasks.filter(t => t.status === 'in-progress').length;

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <div className={styles.headerEyebrow}>ACTIVE SEASON · {season.objective.toUpperCase()}</div>
          <h2 className={`serif ${styles.headerTitle}`}>{season.title}</h2>
          <div className={styles.headerDates}>
            <span>{season.startDate}</span>
            <span className={styles.dateSep}>→</span>
            <span>{season.launchDate}</span>
            <span className={styles.dateLabel}>{season.weeksOut} WEEKS OUT</span>
          </div>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{done}</div>
            <div className={styles.statLabel}>Complete</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum} data-active="true">{inProgress}</div>
            <div className={styles.statLabel}>In progress</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>{season.tasks.length - done - inProgress}</div>
            <div className={styles.statLabel}>Upcoming</div>
          </div>
        </div>
      </div>

      <div className={styles.channelStrip}>
        <span className={styles.channelLabel}>CHANNELS</span>
        {season.channels.map(ch => (
          <span key={ch} className={styles.channelTag}>{CHANNELS_LABEL[ch] ?? ch}</span>
        ))}
      </div>

      <div className={styles.tabs}>
        {(['checklist', 'channels', 'timeline'] as const).map(t => (
          <button
            key={t}
            className={styles.tab}
            data-active={tab === t ? 'true' : undefined}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'checklist' && (
        <div className={styles.checklist}>
          {season.tasks.map((task, i) => (
            <TaskRow key={i} task={task} />
          ))}
        </div>
      )}

      {tab === 'channels' && (
        <div className={styles.channelsTab}>
          {season.channels.map(ch => (
            <div key={ch} className={styles.channelRow}>
              <div className={styles.channelRowName}>{CHANNELS_LABEL[ch] ?? ch}</div>
              <div className={`serif ${styles.channelRowNote}`}>
                {ch === 'email'     && 'Three dispatches planned: cover reveal, book essay, launch.'}
                {ch === 'instagram' && 'Cover image, behind-the-scenes, and launch-day posts.'}
                {ch === 'goodreads' && 'Giveaway live. Update author status weekly.'}
                {ch === 'bookshop'  && 'Pre-order link active. Champions list seeded.'}
                {ch === 'x'         && 'Coordinated with email dispatch on launch day.'}
              </div>
              {ch === 'email' && (
                <Btn tone="ghost" icon={<IconArrow size={12} />} onClick={onCompose}>
                  Draft dispatch
                </Btn>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'timeline' && (
        <div className={styles.timelineTab}>
          {season.tasks.map((task, i) => (
            <div key={i} className={styles.timelineRow} data-status={task.status}>
              <div className={styles.timelineWeek}>{task.week.replace('Week ', 'Wk ')}</div>
              <div className={styles.timelineLine}>
                <div className={styles.timelineDot} data-status={task.status} />
                {i < season.tasks.length - 1 && <div className={styles.timelineConnector} />}
              </div>
              <div className={styles.timelineTask}>{task.task}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
