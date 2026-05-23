import { useState } from 'react';
import { RoleTabs } from './components/RoleTabs';
import { CrossRoleNudge } from './components/CrossRoleNudge';
import { DeskHero } from './components/DeskHero';
import { DeskQueue } from './components/DeskQueue';
import { TodayRail } from './components/TodayRail';
import { WriteLane } from './components/WriteLane';
import { PrepareLane } from './components/PrepareLane';
import { SustainLane } from './components/SustainLane';
import { ReadLane } from './components/ReadLane';
import { DiscoverLane } from './components/DiscoverLane';
import { ConnectLane } from './components/ConnectLane';
import { WriterEmptyState } from './components/WriterEmptyState';
import { ReaderEmptyState } from './components/ReaderEmptyState';

import { adaptWritingData, adaptReadingData } from './adapters';
import { useDashboardV2 } from './useDashboardV2';
import styles from './index.module.css';

type Role = 'writing' | 'reading';

interface DashboardPreviewProps {
  writerEmpty?: boolean;
  readerEmpty?: boolean;
}

export default function DashboardPreview({ writerEmpty = false, readerEmpty = false }: DashboardPreviewProps) {
  const [role, setRole] = useState<Role>('writing');
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const { data, loading } = useDashboardV2();

  const writingData = data ? adaptWritingData(data.writing) : null;
  const readingData = data ? adaptReadingData(data.reading) : null;

  const effectiveWriterEmpty = loading ? writerEmpty : (data ? data.writing.manuscripts.length === 0 : writerEmpty);
  const effectiveReaderEmpty = loading ? readerEmpty : (data ? data.reading.activeBetaReads.length === 0 : readerEmpty);

  const isWriterEmpty = role === 'writing' && effectiveWriterEmpty;
  const isReaderEmpty = role === 'reading' && effectiveReaderEmpty;
  const hasNudge = !loading && writingData !== null && readingData !== null && !nudgeDismissed && (
    (role === 'writing' && readingData.unreadCount > 0) ||
    (role === 'reading' && writingData.unreadCount > 0)
  );

  return (
    <main className={styles.page}>
      <RoleTabs
        active={role}
        writingUnread={role === 'reading' ? (writingData?.unreadCount ?? 0) : 0}
        readingUnread={role === 'writing' ? (readingData?.unreadCount ?? 0) : 0}
        onSwitch={setRole}
      />

      {hasNudge && (
        <CrossRoleNudge
          role={role}
          message={role === 'writing' ? readingData.crossRoleMsg : writingData.crossRoleMsg}
          onSwitch={() => {
            setRole(role === 'writing' ? 'reading' : 'writing');
            setNudgeDismissed(true);
          }}
          onDismiss={() => setNudgeDismissed(true)}
        />
      )}

      {isWriterEmpty && (
        <WriterEmptyState onSwitch={() => setRole('reading')} />
      )}

      {isReaderEmpty && (
        <ReaderEmptyState onSwitch={() => setRole('writing')} />
      )}

      {!isWriterEmpty && !isReaderEmpty && writingData !== null && readingData !== null && (
        <>
          {/* Desk + Today rail grid */}
          <div className={styles.deskGrid}>
            <div className={styles.deskMain}>
              <div className={styles.deskEyebrow}>
                <span className={`mono ${styles.eyebrow}`}>
                  § The desk · {role === 'writing' ? 'what matters today' : "what's open right now"}
                </span>
                <span className={`mono ${styles.eyebrow}`}>
                  {role === 'writing' ? writingData.desk.count : readingData.desk.count}
                </span>
              </div>
              <DeskHero item={role === 'writing' ? writingData.desk.primary : readingData.desk.primary} />
              <div className={styles.queueWrap}>
                <DeskQueue rows={role === 'writing' ? writingData.desk.queue : readingData.desk.queue} />
              </div>
            </div>
            <TodayRail items={role === 'writing' ? writingData.rail : readingData.rail} />
          </div>

          {/* Lifecycle lanes */}
          {role === 'writing' ? (
            <>
              <WriteLane data={writingData.writeLane} />
              <div className={styles.compactLanes}>
                <PrepareLane data={writingData.prepareLane} />
                <SustainLane data={writingData.sustainLane} />
              </div>
            </>
          ) : (
            <>
              <ReadLane data={readingData.readLane} />
              <div className={styles.compactLanes}>
                <DiscoverLane data={readingData.discoverLane} />
                <ConnectLane data={readingData.connectLane} />
              </div>
            </>
          )}
        </>
      )}

      {/* Dev-only state toggles */}
      <div className={styles.devBar}>
        <span className={`mono ${styles.devLabel}`}>Preview controls</span>
        <a href="?preview&empty=writer" className={`mono ${styles.devLink}`}>Writer empty state</a>
        <a href="?preview&empty=reader" className={`mono ${styles.devLink}`}>Reader empty state</a>
        <a href="?preview" className={`mono ${styles.devLink}`}>Populated</a>
      </div>
    </main>
  );
}
