import { useState, useRef, useEffect } from 'react';
import { Pill, Btn } from '../../shared/ui/atoms';
import { IconArrow } from '../../shared/ui/icons';
import { ISBNS as ISBNS_DATA, CHANNELS as CHANNELS_RAW, ISBN_TONE, STATUS_TONE } from './data';
import type { Isbn } from './types';
import styles from './IsbnView.module.css';

// ── EAN-13 encoder ───────────────────────────────────────────────── //
const L_CODE = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const G_CODE = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const R_CODE = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
const PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

function encodeEAN13(isbn: string): string | null {
  const d = isbn.replace(/\D/g, '');
  if (d.length !== 13) return null;
  const p = PARITY[+d[0]];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += p[i - 1] === 'G' ? G_CODE[+d[i]] : L_CODE[+d[i]];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R_CODE[+d[i]];
  return bits + '101';
}

const QUIET  = 9;
const MW     = 4;
const VPAD   = 6;
const BAR_H  = 90;
const TEXT_H = 24;

function drawBarcode(canvas: HTMLCanvasElement, isbn: string) {
  const bits   = encodeEAN13(isbn);
  const digits = isbn.replace(/\D/g, '');
  if (!bits) return;
  canvas.width  = (QUIET * 2 + 95) * MW;
  canvas.height = VPAD + BAR_H + TEXT_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  const xOff = QUIET * MW;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') ctx.fillRect(xOff + i * MW, VPAD, MW, BAR_H);
  }
  ctx.fillStyle = '#000000';
  ctx.font = '22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(digits, canvas.width / 2, VPAD + BAR_H + 4);
}

// ── Barcode canvas sub-component ─────────────────────────────────── //
type CopiedState = { id: number; type: 'img' | 'txt' } | null;

function BarcodeCanvas({ isbn, id, copied, onCopy }: {
  isbn: string; id: number; copied: CopiedState;
  onCopy: (id: number, type: 'img' | 'txt') => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (canvasRef.current) drawBarcode(canvasRef.current, isbn); }, [isbn]);

  function copyImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        onCopy(id, 'img');
      } catch { downloadPng(canvas, isbn); }
    }, 'image/png');
  }

  function downloadPng(canvas: HTMLCanvasElement, isbnStr: string) {
    const a = document.createElement('a');
    a.download = `isbn-${isbnStr.replace(/\D/g, '')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  function copyDigits() {
    navigator.clipboard.writeText(isbn.replace(/-/g, '')).then(() => onCopy(id, 'txt'));
  }

  const imgCopied = copied?.id === id && copied.type === 'img';
  const txtCopied = copied?.id === id && copied.type === 'txt';

  return (
    <div className={styles.barcodeWrap}>
      <canvas ref={canvasRef} className={styles.barcodeCanvas} />
      <div className={styles.barcodeActions}>
        <button className={styles.copyBtn} data-copied={imgCopied ? '' : undefined} onClick={copyImage}>
          {imgCopied ? '✓ Copied' : 'Copy image'}
        </button>
        <button className={styles.copyBtn} onClick={() => downloadPng(canvasRef.current!, isbn)}>
          Download PNG
        </button>
        <button className={styles.copyBtnTxt} data-copied={txtCopied ? '' : undefined} onClick={copyDigits}>
          {txtCopied ? '✓ Copied' : 'Copy digits'}
        </button>
      </div>
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────── //
const TITLES = [...new Set(ISBNS_DATA.map(i => i.title))];
const FORMATS = ['Print', 'eBook', 'Audio'] as const;

const CHECKLIST_ITEMS = [
  'Manuscript files approved and ready',
  'Channel account set up and verified',
  'Cover PDF includes barcode space for this ISBN',
  'List price confirmed for this format',
] as const;

function todayStr(): string {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getChannelNote(format: 'Print' | 'eBook' | 'Audio', channel: string): string | null {
  if (format === 'eBook' && channel.includes('KDP'))
    return 'KDP routes around this ISBN and assigns its own ASIN for Kindle delivery. Apple Books and Kobo use the ISBN for metadata matching.';
  if (format === 'Print' && (channel.includes('IngramSpark') || channel.includes('KDP')))
    return 'IngramSpark and KDP Print both embed this ISBN in barcode and interior metadata. Confirm the number in your interior PDF matches exactly.';
  return null;
}

// ── Component ────────────────────────────────────────────────────── //
export function IsbnView() {
  const [isbns,          setIsbns]          = useState<Isbn[]>(ISBNS_DATA);
  const [expanded,       setExpanded]       = useState<number | null>(null);
  const [copied,         setCopied]         = useState<CopiedState>(null);
  const [reservingId,    setReservingId]    = useState<number | null>(null);
  const [reserveTitle,   setReserveTitle]   = useState('');
  const [reserveFormat,  setReserveFormat]  = useState<'Print' | 'eBook' | 'Audio'>('Print');
  const [checkmarks,     setCheckmarks]     = useState<Record<number, Set<number>>>({});
  const [assigningId,    setAssigningId]    = useState<number | null>(null);
  const [assignChannels, setAssignChannels] = useState<string[]>([]);
  const [editingIsbnId,  setEditingIsbnId]  = useState<number | null>(null);
  const [editTitle,      setEditTitle]      = useState('');
  const [editFormat,     setEditFormat]     = useState<'Print' | 'eBook' | 'Audio'>('Print');
  const [editChannel,    setEditChannel]    = useState('');

  function onCopy(id: number, type: 'img' | 'txt') {
    setCopied({ id, type });
    setTimeout(() => setCopied(null), 2000);
  }

  function openReserveForm(isbn: Isbn) {
    setReserveTitle('');
    setReserveFormat(isbn.format);
    setReservingId(isbn.id);
  }

  function reserve(isbnId: number) {
    setIsbns(prev => prev.map(i =>
      i.id === isbnId
        ? { ...i, status: 'reserved' as const, title: reserveTitle, format: reserveFormat, registered: todayStr() }
        : i
    ));
    setReservingId(null);
  }

  function toggleCheck(isbnId: number, idx: number) {
    setCheckmarks(prev => {
      const set = new Set(prev[isbnId] ?? []);
      if (set.has(idx)) set.delete(idx); else set.add(idx);
      return { ...prev, [isbnId]: set };
    });
  }

  function toggleAssignChannel(name: string) {
    setAssignChannels(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  function confirmAssign(isbnId: number) {
    setIsbns(prev => prev.map(i =>
      i.id === isbnId
        ? { ...i, status: 'assigned' as const, channel: assignChannels.join(' · ') }
        : i
    ));
    setAssigningId(null);
    setAssignChannels([]);
  }

  function openEdit(isbn: Isbn) {
    setEditTitle(isbn.title);
    setEditFormat(isbn.format);
    setEditChannel(isbn.channel);
    setEditingIsbnId(isbn.id);
  }

  function saveEdit(isbnId: number) {
    setIsbns(prev => prev.map(i =>
      i.id === isbnId
        ? { ...i, title: editTitle.trim() || i.title, format: editFormat, channel: editChannel.trim() || i.channel }
        : i
    ));
    setEditingIsbnId(null);
  }

  return (
    <div>
      <div className={styles.viewHeader}>
        <div>
          <div className={`serif ${styles.viewTitle}`}>ISBN Registry</div>
          <div className={styles.viewSubtitle}>5 ISBNS · 2 TITLES · PREFIX 978-1-7398</div>
        </div>
        <Btn tone="ghost" icon={<IconArrow size={13} />}>Request ISBNs</Btn>
      </div>

      <div className={styles.tableHead}>
        {['ISBN', 'Title', 'Format', 'Status', 'Channel', 'Registered'].map(h => (
          <div key={h} className={styles.tableHeadCell}>{h}</div>
        ))}
      </div>

      {isbns.map((isbn) => (
        <div key={isbn.id}>
          <div
            className={styles.isbnRow}
            data-expanded={expanded === isbn.id ? 'true' : undefined}
            onClick={() => setExpanded(expanded === isbn.id ? null : isbn.id)}
          >
            <div className={styles.isbnCode}>{isbn.isbn}</div>
            <div className={styles.isbnTitle}>{isbn.title}</div>
            <div className={`serif ${styles.isbnFormat}`}>{isbn.format}</div>
            <Pill tone={ISBN_TONE[isbn.status]}>{isbn.status}</Pill>
            <div className={styles.isbnMeta}>{isbn.channel}</div>
            <div className={styles.isbnMeta}>{isbn.registered}</div>
          </div>

          {expanded === isbn.id && (
            <div className={styles.isbnExpanded}>

              {/* ── Edit form (replaces all content while active) ── */}
              {editingIsbnId === isbn.id ? (
                <>
                  <div className={styles.expandSection}>
                    <div className={styles.expandLabel}>Edit ISBN entry</div>
                    <div className={styles.editSection}>

                      <div className={styles.reserveField}>
                        <div className={styles.reserveFieldLabel}>Title</div>
                        <input
                          className={styles.editInput}
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                        />
                      </div>

                      <div className={styles.reserveField}>
                        <div className={styles.reserveFieldLabel}>Format</div>
                        <div className={styles.reserveFormatRow}>
                          {FORMATS.map(f => (
                            <label
                              key={f}
                              className={styles.reserveFormatOpt}
                              data-active={editFormat === f ? '' : undefined}
                            >
                              <input
                                type="radio"
                                name={`edit-format-${isbn.id}`}
                                className={styles.reserveRadio}
                                checked={editFormat === f}
                                onChange={() => setEditFormat(f)}
                              />
                              {f}
                            </label>
                          ))}
                        </div>
                      </div>

                      {isbn.status === 'assigned' && (
                        <div className={styles.reserveField}>
                          <div className={styles.reserveFieldLabel}>Channel</div>
                          <input
                            className={styles.editInput}
                            value={editChannel}
                            onChange={e => setEditChannel(e.target.value)}
                          />
                        </div>
                      )}

                    </div>
                  </div>
                  <div className={styles.reserveActions}>
                    <button className={styles.reserveCancel} onClick={() => setEditingIsbnId(null)}>
                      Cancel
                    </button>
                    <button
                      className={styles.reservePrimary}
                      data-disabled={!editTitle.trim() ? '' : undefined}
                      onClick={editTitle.trim() ? () => saveEdit(isbn.id) : undefined}
                    >
                      Save changes →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* ── Assigned ── */}
                  {isbn.status === 'assigned' && (
                    <>
                      {getChannelNote(isbn.format, isbn.channel) && (
                        <div className={styles.expandSection}>
                          <div className={styles.expandLabel}>Channel note</div>
                          <p className={styles.channelNote}>{getChannelNote(isbn.format, isbn.channel)}</p>
                        </div>
                      )}
                      {isbn.format === 'Print' && (
                        <div className={styles.expandSection}>
                          <div className={styles.expandLabel}>Barcode</div>
                          <BarcodeCanvas isbn={isbn.isbn} id={isbn.id} copied={copied} onCopy={onCopy} />
                          <div className={styles.barcodeNote}>
                            Copy or download to embed in your cover PDF. KDP and IngramSpark generate their own at upload — confirm this number matches what's in your file.
                          </div>
                        </div>
                      )}
                      <Btn tone="ghost" onClick={() => openEdit(isbn)}>Edit entry</Btn>
                    </>
                  )}

                  {/* ── Reserved ── */}
                  {isbn.status === 'reserved' && (
                    <>
                      <div className={styles.expandSection}>
                        <div className={styles.expandLabel}>Before you assign</div>
                        <div className={styles.checklist}>
                          {CHECKLIST_ITEMS.map((item, i) => {
                            const checked = checkmarks[isbn.id]?.has(i) ?? false;
                            return (
                              <div
                                key={i}
                                className={styles.checkItem}
                                data-checked={checked ? '' : undefined}
                                onClick={() => toggleCheck(isbn.id, i)}
                              >
                                <span className={styles.checkDot} data-checked={checked ? '' : undefined}>
                                  {checked ? '✓' : ''}
                                </span>
                                {item}
                              </div>
                            );
                          })}
                        </div>
                        <div className={styles.checklistNote}>Advisory — you can assign at any time.</div>
                      </div>

                      {isbn.format === 'Print' && (
                        <div className={styles.expandSection}>
                          <div className={styles.expandLabel}>Barcode</div>
                          <BarcodeCanvas isbn={isbn.isbn} id={isbn.id} copied={copied} onCopy={onCopy} />
                          <div className={styles.barcodeNote}>
                            The number is fixed at reservation and won't change after assignment. Embed it in your cover design now to complete step 3 above.
                          </div>
                        </div>
                      )}

                      {assigningId === isbn.id ? (
                        <div className={styles.expandSection}>
                          <div className={styles.expandLabel}>Select channels</div>
                          <div className={styles.assignChannelOptions}>
                            {CHANNELS_RAW.filter(c => c.formats.includes(isbn.format)).map(c => (
                              <label
                                key={c.id}
                                className={styles.assignChannelOpt}
                                data-active={assignChannels.includes(c.name) ? '' : undefined}
                              >
                                <input
                                  type="checkbox"
                                  className={styles.reserveRadio}
                                  checked={assignChannels.includes(c.name)}
                                  onChange={() => toggleAssignChannel(c.name)}
                                />
                                <div className={styles.assignChannelInfo}>
                                  <div className={styles.assignChannelName}>{c.name}</div>
                                  <div className={styles.assignChannelKind}>{c.kind}</div>
                                </div>
                                <Pill tone={STATUS_TONE[c.status]}>{c.status}</Pill>
                              </label>
                            ))}
                          </div>
                          <div className={styles.reserveActions}>
                            <button className={styles.reserveCancel} onClick={() => setAssigningId(null)}>
                              Cancel
                            </button>
                            <button
                              className={styles.reservePrimary}
                              data-disabled={assignChannels.length === 0 ? '' : undefined}
                              onClick={assignChannels.length > 0 ? () => confirmAssign(isbn.id) : undefined}
                            >
                              Confirm assignment →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.reservedActions}>
                          <Btn
                            tone="ghost"
                            icon={<IconArrow size={12} />}
                            onClick={() => { setAssigningId(isbn.id); setAssignChannels([]); }}
                          >
                            Assign to channel
                          </Btn>
                          <Btn tone="ghost" onClick={() => openEdit(isbn)}>Edit entry</Btn>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Unassigned ── */}
                  {isbn.status === 'unassigned' && (
                    <div className={styles.expandSection}>
                      {reservingId === isbn.id ? (
                        <>
                          <div className={styles.expandLabel}>Reserve for a title</div>

                          <div className={styles.reserveField}>
                            <div className={styles.reserveFieldLabel}>Title</div>
                            <div className={styles.reserveTitleOptions}>
                              {TITLES.map(t => (
                                <label
                                  key={t}
                                  className={styles.reserveTitleOption}
                                  data-active={reserveTitle === t ? '' : undefined}
                                >
                                  <input
                                    type="radio"
                                    name={`reserve-title-${isbn.id}`}
                                    className={styles.reserveRadio}
                                    checked={reserveTitle === t}
                                    onChange={() => setReserveTitle(t)}
                                  />
                                  <span className={`serif ${styles.reserveTitleText}`}>{t}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className={styles.reserveField}>
                            <div className={styles.reserveFieldLabel}>Format</div>
                            <div className={styles.reserveFormatRow}>
                              {FORMATS.map(f => (
                                <label
                                  key={f}
                                  className={styles.reserveFormatOpt}
                                  data-active={reserveFormat === f ? '' : undefined}
                                >
                                  <input
                                    type="radio"
                                    name={`reserve-format-${isbn.id}`}
                                    className={styles.reserveRadio}
                                    checked={reserveFormat === f}
                                    onChange={() => setReserveFormat(f)}
                                  />
                                  {f}
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className={styles.reserveActions}>
                            <button className={styles.reserveCancel} onClick={() => setReservingId(null)}>
                              Cancel
                            </button>
                            <button
                              className={styles.reservePrimary}
                              data-disabled={!reserveTitle ? '' : undefined}
                              onClick={reserveTitle ? () => reserve(isbn.id) : undefined}
                            >
                              Reserve ISBN →
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.expandLabel}>Not yet reserved</div>
                          <p className={styles.channelNote}>
                            This ISBN slot has not been reserved for a title. Reserve it when you're ready to assign it to a format and channel.
                          </p>
                          <Btn tone="ghost" icon={<IconArrow size={12} />} onClick={() => openReserveForm(isbn)}>
                            Reserve for a title
                          </Btn>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

            </div>
          )}
        </div>
      ))}

      <div className={styles.prefixBox}>
        <div className={`label ${styles.prefixLabel}`}>About your prefix</div>
        <p className={`serif ${styles.prefixText}`}>
          Your ISBN prefix <span className={styles.prefixCode}>978-1-7398</span> is registered
          to Billie Wolf Publishing. ISBNs issued under this prefix identify you as the publisher of record
          in all channel metadata and Bowker records.
        </p>
        <div className={styles.prefixBtns}>
          <Btn tone="ghost">View in Bowker ↗</Btn>
          <Btn tone="ghost">Export registry</Btn>
        </div>
      </div>
    </div>
  );
}
