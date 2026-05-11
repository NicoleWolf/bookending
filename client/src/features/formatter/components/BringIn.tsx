import { useState, useEffect, useRef } from 'react';
import { Pill, Btn } from '../../../shared/ui/atoms';
import type {
  ManuscriptSummary,
  FormattingProjectRecord,
  IngestSettings,
  Encoding,
  SmartQuotes,
} from '../types';
import styles from './BringIn.module.css';

type Source = 'editor' | 'docx' | 'paste';

const ENCODINGS: { id: Encoding; label: string }[] = [
  { id: 'auto',    label: 'Auto' },
  { id: 'utf8',    label: 'UTF-8' },
  { id: 'win1252', label: 'Win-1252' },
];

const BRING_ACROSS = [
  'Headings H1 → chapters, H2 → scene breaks',
  'Italics, ordered lists, block quotes',
  'Part-header pattern (auto-detected)',
  'Em-dashes, smart quotes, en-dashes',
];

const WONT_BRING = [
  'Track-changes & comments — left in the editor',
  'Embedded images mid-chapter — v1 ignores',
  'Custom Word styles — flattened to plain',
];

function formatUpdatedAt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).toUpperCase();
}

function isDocx(file: File) {
  return (
    file.name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

interface Props {
  manuscripts:          ManuscriptSummary[];
  selectedManuscriptId: string | null;
  onManuscriptSelect:   (id: string) => void;
  project:              FormattingProjectRecord | null;
  projectLoading:       boolean;
  onPull:               (manuscriptId: string, settings: IngestSettings) => Promise<void>;
  onUpload:             (file: File, settings: IngestSettings) => Promise<void>;
  onPasteSubmit:        (text: string, settings: IngestSettings) => Promise<void>;
  onSettingsChange:     (settings: Partial<IngestSettings>) => void;
  onAdvance:            () => void;
}

export default function BringIn({
  manuscripts,
  selectedManuscriptId,
  onManuscriptSelect,
  project,
  projectLoading,
  onPull,
  onUpload,
  onPasteSubmit,
  onSettingsChange,
  onAdvance,
}: Props) {
  const [source,          setSource]         = useState<Source>('editor');
  const [encoding,        setEncoding]       = useState<Encoding>('auto');
  const [smartQuotes,     setSmartQuotes]    = useState<SmartQuotes>('convert');
  const [pulled,          setPulled]         = useState(false);
  const [pulling,         setPulling]        = useState(false);
  const [pullError,       setPullError]      = useState<string | null>(null);
  const [confirmRepull,   setConfirmRepull]  = useState(false);
  const [uploadedFile,    setUploadedFile]   = useState<File | null>(null);
  const [restoredDocxUrl, setRestoredDocxUrl] = useState<string | null>(null);
  const [uploading,       setUploading]      = useState(false);
  const [uploadError,     setUploadError]    = useState<string | null>(null);
  const [dragOver,        setDragOver]       = useState(false);
  const [pastedText,      setPastedText]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0;

  // Reset transient state whenever the selected manuscript changes
  useEffect(() => {
    setPulled(false);
    setPulling(false);
    setPullError(null);
    setUploadedFile(null);
    setRestoredDocxUrl(null);
    setUploading(false);
    setUploadError(null);
    setDragOver(false);
    setPastedText('');
    setEncoding('auto');
    setSmartQuotes('convert');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedManuscriptId]);

  // Restore from a saved FormattingProject once it loads
  useEffect(() => {
    if (!project) return;
    if (project.source === 'EDITOR') {
      setSource('editor');
      setPulled(true);
    } else if (project.source === 'DOCX') {
      setSource('docx');
      setRestoredDocxUrl(project.uploadedDocxUrl);
    } else if (project.source === 'PASTE') {
      setSource('paste');
      setPastedText(project.pastedContent ?? '');
    }
    const enc = project.encoding.toLowerCase() as Encoding;
    if (['auto', 'utf8', 'win1252'].includes(enc)) setEncoding(enc);
    const sq = project.smartQuotes.toLowerCase() as SmartQuotes;
    if (['convert', 'passthrough'].includes(sq)) setSmartQuotes(sq);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const canAdvance =
    (source === 'editor' && (pulled || project?.source === 'EDITOR')) ||
    (source === 'docx'   && (uploadedFile !== null || !!restoredDocxUrl)) ||
    (source === 'paste'  && pastedText.trim().length > 0);

  const selectedManuscript = manuscripts.find(m => m.id === selectedManuscriptId) ?? null;
  const chapterCount = selectedManuscript?._count?.chapters ?? 0;
  const partCount = (selectedManuscript?.chapters ?? []).filter(
    ch => /^part\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i.test(ch.title.trim())
  ).length;

  function handleEncodingChange(enc: Encoding) {
    setEncoding(enc);
    onSettingsChange({ encoding: enc });
  }

  function handleSmartQuotesChange(sq: SmartQuotes) {
    setSmartQuotes(sq);
    onSettingsChange({ smartQuotes: sq });
  }

  async function handlePull() {
    if (!selectedManuscriptId) return;
    setPulling(true);
    setPullError(null);
    try {
      await onPull(selectedManuscriptId, { encoding, smartQuotes });
      setPulled(true);
    } catch (err) {
      setPullError(err instanceof Error ? err.message : 'Failed to pull manuscript. Please try again.');
    } finally {
      setPulling(false);
    }
  }

  async function handleUploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      await onUpload(file, { encoding, smartQuotes });
      setUploadedFile(file);
      setRestoredDocxUrl(null);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!isDocx(file)) {
      setUploadError('We can\'t read .doc files — open in Word and Save As .docx first.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File is over 50 MB. Please reduce the file size and try again.');
      return;
    }
    void handleUploadFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isDocx(file)) {
      setUploadError('We can\'t read .doc files — open in Word and Save As .docx first.');
      return;
    }
    e.target.value = '';
    void handleUploadFile(file);
  }

  async function handleAdvance() {
    if (source === 'paste' && pastedText.trim()) {
      try {
        await onPasteSubmit(pastedText, { encoding, smartQuotes });
      } catch {
        // Non-critical — advance regardless
      }
    }
    onAdvance();
  }

  const alreadyPulled = pulled || project?.source === 'EDITOR';

  return (
    <div className={styles.root}>

      {/* ── Controls bar ──────────────────────────────────────── */}
      <div className={styles.controls}>
        <div className={styles.sourceSection}>
          <span className={`mono ${styles.ctrlLabel}`}>SOURCE</span>
          <div className={styles.sourceTabs}>
            {(['editor', 'docx', 'paste'] as Source[]).map(s => (
              <button
                key={s}
                className={`mono ${styles.sourceTab}`}
                data-active={source === s ? '' : undefined}
                onClick={() => setSource(s)}
              >
                {s === 'editor' ? 'From editor' : s === 'docx' ? 'Upload .docx' : 'Paste'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.rightControls}>
          <div className={styles.ctrlGroup}>
            <span className={`mono ${styles.ctrlLabel}`}>
              ENCODING <span className={styles.ctrlNote}>AUTO-DETECTED</span>
            </span>
            <div className={styles.pillRow}>
              {ENCODINGS.map(e => (
                <button
                  key={e.id}
                  className={`mono ${styles.togglePill}`}
                  data-active={encoding === e.id ? '' : undefined}
                  onClick={() => handleEncodingChange(e.id)}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.ctrlGroup}>
            <span className={`mono ${styles.ctrlLabel}`}>SMART QUOTES</span>
            <div className={styles.pillRow}>
              {(['convert', 'passthrough'] as SmartQuotes[]).map(sq => (
                <button
                  key={sq}
                  className={`mono ${styles.togglePill}`}
                  data-active={smartQuotes === sq ? '' : undefined}
                  onClick={() => handleSmartQuotesChange(sq)}
                >
                  {sq === 'convert' ? 'Convert' : 'Pass through'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className="rule" />

      {/* ── From editor tab ───────────────────────────────────── */}
      {source === 'editor' && (
        <div className={styles.body}>
          {manuscripts.length === 0 && !projectLoading ? (
            <div className={styles.emptyManuscripts}>
              <span className={`sans ${styles.emptyManuscriptsText}`}>
                No manuscripts found. Create one in Manuscripts first.
              </span>
            </div>
          ) : (
            <>
              <div className={styles.draftRow}>
                <div className={styles.draftLeft}>
                  {manuscripts.length > 1 && (
                    <select
                      className={`mono ${styles.manuscriptSelect}`}
                      value={selectedManuscriptId ?? ''}
                      onChange={e => onManuscriptSelect(e.target.value)}
                    >
                      {manuscripts.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  )}
                  {selectedManuscript && (
                    <>
                      <span className={`mono ${styles.ctrlLabel}`}>DRAFT</span>
                      <div className={styles.draftInfo}>
                        <span className={`sans ${styles.draftTitle}`}>{selectedManuscript.title}</span>
                        <span className={`mono ${styles.draftMeta}`}>
                          {selectedManuscript.wordCount.toLocaleString()}W ·
                          LAST EDITED {formatUpdatedAt(selectedManuscript.updatedAt)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {alreadyPulled && !pulling && !projectLoading ? (
                  <div className={styles.pulledGroup}>
                    <Btn
                      tone="accent"
                      icon={<span style={{ fontSize: 11 }}>✓</span>}
                      style={{ opacity: 0.45, pointerEvents: 'none' }}
                    >
                      Pulled
                    </Btn>
                    <button
                      className={`mono ${styles.repullBtn}`}
                      onClick={() => setConfirmRepull(true)}
                    >
                      Re-pull →
                    </button>
                  </div>
                ) : (
                  <Btn
                    tone="accent"
                    onClick={() => void handlePull()}
                    icon={<span style={{ fontSize: 11 }}>{pulling ? '…' : '→'}</span>}
                    style={{
                      opacity:       (!selectedManuscriptId || pulling || projectLoading) ? 0.45 : 1,
                      pointerEvents: (!selectedManuscriptId || pulling || projectLoading) ? 'none' : 'auto',
                    }}
                  >
                    {pulling ? 'Pulling…' : 'Pull manuscript'}
                  </Btn>
                )}
              </div>

              {pullError && (
                <p className={`mono ${styles.errorNote}`}>{pullError}</p>
              )}

              <hr className="rule" />

              <div className={styles.infoCard}>
                <div className={styles.infoCardTop}>
                  <Pill tone="good">FROM THE EDITOR</Pill>
                  <Pill tone="neutral">RECOMMENDED</Pill>
                </div>

                <div className={styles.infoCardBody}>
                  <div className={styles.infoCardLeft}>
                    <p className={`serif ${styles.infoCardHeadline}`}>
                      Pull from your draft, where you've been writing it.
                    </p>
                    <p className={`sans ${styles.infoCardCopy}`}>
                      The editor's structured content goes through unchanged. Italics,
                      scene breaks, parts and chapters are preserved. This is the path
                      with the fewest surprises.
                    </p>
                  </div>

                  <div className={styles.infoCardRight}>
                    <div className={styles.infoList}>
                      <span className={`mono ${styles.infoListLabel}`}>WHAT WE'LL BRING ACROSS</span>
                      <ul className={styles.infoListItems}>
                        {BRING_ACROSS.map(item => (
                          <li key={item} className={`sans ${styles.infoListItem}`}>
                            <span className={styles.infoListDash}>—</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={styles.infoList}>
                      <span className={`mono ${styles.infoListLabel}`}>WHAT WE WON'T</span>
                      <ul className={styles.infoListItems}>
                        {WONT_BRING.map(item => (
                          <li key={item} className={`sans ${styles.infoListItem} ${styles.infoListItemMuted}`}>
                            <span className={styles.infoListDash}>—</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <hr className={styles.infoCardRule} />

                <div className={styles.metaRow}>
                  {selectedManuscript && [
                    { label: 'TITLE',             value: selectedManuscript.title },
                    { label: 'WORDS',             value: selectedManuscript.wordCount.toLocaleString() },
                    { label: 'CHAPTERS DETECTED', value: String(chapterCount) },
                    { label: 'PARTS DETECTED',    value: String(partCount) },
                  ].map(({ label, value }) => (
                    <div key={label} className={styles.metaItem}>
                      <span className={`mono ${styles.metaLabel}`}>{label}</span>
                      <span className={`sans ${styles.metaValue}`}>{value}</span>
                    </div>
                  ))}
                </div>

                <p className={`mono ${styles.infoCardFooter}`}>
                  Once we pull, we'll show what we detected before changing anything.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Upload .docx tab ──────────────────────────────────── */}
      {source === 'docx' && (
        <div className={styles.body}>
          <div
            className={styles.dropZone}
            data-dragover={dragOver ? '' : undefined}
            data-filled={(uploadedFile || restoredDocxUrl) ? '' : undefined}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <span className={`mono ${styles.dropInstruction}`}>Uploading…</span>
            ) : (uploadedFile || restoredDocxUrl) ? (
              <div className={styles.uploadedFile}>
                <span className={`sans ${styles.uploadedFileName}`}>
                  {uploadedFile ? uploadedFile.name : 'Previously uploaded .docx'}
                </span>
                {uploadedFile && (
                  <span className={`mono ${styles.uploadedFileMeta}`}>
                    {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                )}
                <button
                  className={`mono ${styles.clearFile}`}
                  onClick={() => { setUploadedFile(null); setRestoredDocxUrl(null); }}
                >
                  ✕ Re-upload
                </button>
              </div>
            ) : (
              <>
                <span className={`sans ${styles.dropInstruction}`}>
                  Drop a .docx here, or browse.
                </span>
                <span className={`mono ${styles.dropMeta}`}>
                  UP TO 50 MB · DOCX ONLY
                </span>
                <span className={`mono ${styles.dropDocNote}`}>
                  .DOC: WE CAN'T READ .DOC → Save As .docx in Word first
                </span>
                <button
                  className={`mono ${styles.browseBtn}`}
                  onClick={() => fileRef.current?.click()}
                >
                  Browse files
                </button>
              </>
            )}
          </div>

          {uploadError && (
            <p className={`mono ${styles.errorNote}`}>{uploadError}</p>
          )}

          <div className={styles.recentUploads}>
            <span className={`mono ${styles.ctrlLabel}`}>RECENT UPLOADS</span>
            <hr className="rule" />
            <span className={`mono ${styles.recentEmpty}`}>—none yet</span>
          </div>

          <p className={`sans ${styles.guidance}`}>
            First-timers: pull from the editor. Upload only if you wrote elsewhere.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".docx"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* ── Paste tab ─────────────────────────────────────────── */}
      {source === 'paste' && (
        <div className={styles.body}>
          <div className={styles.pasteArea}>
            <textarea
              className={`mono ${styles.pasteTextarea}`}
              placeholder="Paste your manuscript text here…"
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
              spellCheck={false}
            />
            <div className={styles.pasteStats}>
              <span className={`mono ${styles.pasteStatText}`}>
                {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
              </span>
              <span className={`mono ${styles.pasteStatText}`}>
                {pastedText.length.toLocaleString()} characters
              </span>
            </div>
          </div>

          <p className={`sans ${styles.guidance}`}>
            Paste accepts plain text or HTML. Structure detection runs in the next step.
            For best results, draft in Bookending or upload a .docx.
          </p>
        </div>
      )}

      {/* ── Footer CTA ────────────────────────────────────────── */}
      <div className={styles.footer}>
        <Btn
          tone="accent"
          onClick={() => void handleAdvance()}
          icon={<span style={{ fontSize: 11 }}>→</span>}
          style={{
            opacity:       canAdvance ? 1 : 0.35,
            pointerEvents: canAdvance ? 'auto' : 'none',
          }}
        >
          Step 02 — Mark up
        </Btn>
      </div>

      {/* ── Re-pull confirmation modal ─────────────────────────── */}
      {confirmRepull && (
        <div
          className={styles.modalOverlay}
          onClick={e => { if (e.target === e.currentTarget) setConfirmRepull(false); }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true">
            <p className={`mono ${styles.modalEyebrow}`}>RE-PULL MANUSCRIPT</p>
            <h2 className={`serif ${styles.modalTitle}`}>Overwrite this pull?</h2>
            <p className={`sans ${styles.modalBody}`}>
              Re-pulling will reset the Bindery for this manuscript. All formatting
              progress will be discarded and you will need to start over from Step 01.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`mono ${styles.modalCancel}`}
                onClick={() => setConfirmRepull(false)}
                disabled={pulling}
              >
                Cancel
              </button>
              <button
                className={`mono ${styles.modalConfirm}`}
                disabled={pulling}
                onClick={() => { setConfirmRepull(false); void handlePull(); }}
              >
                {pulling ? 'Pulling…' : 'Re-pull'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
