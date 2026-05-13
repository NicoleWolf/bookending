import { useState } from 'react';
import { Pill, Btn } from '../../shared/ui/atoms';
import { IconUpload } from '../../shared/ui/icons';
import { FILES, FILE_TONE, FILE_LABEL } from './data';
import styles from './FilesView.module.css';

const approvedFiles = FILES.filter(f => f.status === 'approved');

export function FilesView() {
  const [showApprovalLog, setShowApprovalLog] = useState(false);

  return (
    <div>
      <div style={{ padding: '6px 0 10px', borderBottom: '1px solid var(--rule)', marginBottom: '4px' }}>
        <span className="label" style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>
          PREVIEW DATA · Your uploaded files will appear here once distribution is configured
        </span>
      </div>
      <div className={styles.viewHeader}>
        <div>
          <div className={`serif ${styles.viewTitle}`}>Files & Assets</div>
          <div className={styles.viewSubtitle}>
            {FILES.length} FILES · 2 TITLES ·{' '}
            <button
              className={styles.approvedLink}
              onClick={() => setShowApprovalLog(v => !v)}
            >
              {approvedFiles.length} APPROVED
            </button>
          </div>
        </div>
        <Btn tone="ghost" icon={<IconUpload size={13} />}>Upload file</Btn>
      </div>

      {showApprovalLog && (
        <div className={styles.approvalLog}>
          <div className={styles.approvalLogHead}>Approval log</div>
          {approvedFiles.map(f => (
            <div key={f.id} className={styles.approvalLogRow}>
              <div className={styles.approvalLogFile}>{f.name}</div>
              <div className={styles.approvalLogMeta}>
                Approved by {f.approvedBy} · {f.approvedAt}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.tableHead}>
        {['Filename', 'Title', 'Type', 'Version', 'Channels', 'Size', 'Status', 'Updated'].map(h => (
          <div key={h} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {FILES.map((f) => (
        <div key={f.id} className={styles.fileRow}>
          <div>
            <div className={styles.fileName}>{f.name}</div>
            {f.note && (
              <div
                className={styles.fileNote}
                data-urgent={f.status === 'needs-review' ? 'true' : undefined}
              >
                {f.note.toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.fileTitle}>{f.title}</div>
          <div className={`serif ${styles.fileKind}`}>{f.kind}</div>
          <div className={styles.fileMeta}>{f.version}</div>
          <div className={styles.fileChannels}>
            {f.channels.length > 0
              ? f.channels.map(ch => (
                  <span key={ch} className={styles.channelTag}>{ch}</span>
                ))
              : <span className={styles.channelNone}>—</span>
            }
          </div>
          <div className={styles.fileSize}>{f.size}</div>
          <Pill tone={FILE_TONE[f.status]}>{FILE_LABEL[f.status]}</Pill>
          <div className={styles.fileMeta}>{f.updated}</div>
        </div>
      ))}

      <div className={styles.dropZone}>
        <IconUpload size={24} />
        <div className={styles.dropLabel}>Drop a PDF, EPUB, or audio file here</div>
        <div className={styles.dropOr}>OR</div>
        <Btn tone="ghost">Browse files</Btn>
        <div className={styles.dropSpec}>
          PDF · EPUB 2/3 · MP3 · M4A — MAX 500 MB per file · Audiobooks: upload per chapter
        </div>
      </div>
    </div>
  );
}
