import { useState } from 'react';
import { Pill, Btn, Avatar, BookCover } from '../../shared/ui/atoms';
import { IconArrow, IconArrowUp, IconUpload } from '../../shared/ui/icons';
import { PK_ASSETS, BIO_SHORT, BIO_LONG } from './data';
import type { PKAsset } from './types';
import type { BookMetadata } from '../library/data';
import styles from './PressKit.module.css';

const BOOK_SCHEMES: Record<number, number> = {
  1: 0,
  2: 1,
};

interface ImageEditorProps {
  asset: PKAsset;
  savedBooks: Record<number, BookMetadata>;
}

function ImageEditor({ asset, savedBooks }: ImageEditorProps) {
  const isCover = asset.id.startsWith('cover');
  const [overrideMode, setOverrideMode] = useState(false);
  const catalogBook = asset.bookId ? savedBooks[asset.bookId] : undefined;

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.editorHeader}>
        <div className="label">{asset.name}</div>
        <Pill tone={asset.status === 'ready' ? 'good' : 'paper'}>{asset.status}</Pill>
      </div>

      {catalogBook && !overrideMode && (
        <div className={styles.sourceBox}>
          <div className={styles.sourceContent}>
            <div className={styles.sourceInfo}>
              <div className={styles.sourceTag}>SOURCED FROM STOREFRONT</div>
              <div className={styles.sourceText}>
                This cover is managed under <strong>Storefront → Cover images</strong>.
                Upload it once there and it appears here automatically.
              </div>
              <div className={styles.sourceStatus}>
                <div className={styles.statusDot} data-good={catalogBook.coverUploaded ? 'true' : undefined} />
                <span className={styles.statusLabel} data-good={catalogBook.coverUploaded ? 'true' : undefined}>
                  {catalogBook.coverUploaded
                    ? 'COVER UPLOADED IN STOREFRONT · READY'
                    : 'NO COVER UPLOADED YET — GO TO STOREFRONT TO ADD IT'}
                </span>
              </div>
            </div>
            <div className={styles.coverThumb}>
              <BookCover title={catalogBook.title} scheme={BOOK_SCHEMES[catalogBook.id] ?? 3} />
            </div>
          </div>
          <div className={styles.sourceActions}>
            <Btn tone="ghost" icon={<IconArrow size={11} />}>Manage in Storefront →</Btn>
            {catalogBook.coverUploaded && (
              <Btn tone="ghost" icon={<IconArrowUp size={11} />}>Download ↗</Btn>
            )}
            <button className={styles.overrideLink} onClick={() => setOverrideMode(true)}>
              Use a different image for press only
            </button>
          </div>
        </div>
      )}

      {catalogBook && overrideMode && (
        <div className={styles.overrideBanner}>
          <span className={styles.overrideNote}>
            PRESS KIT OVERRIDE — UPLOAD BELOW REPLACES STOREFRONT SOURCE FOR PRESS USE ONLY
          </span>
          <button className={styles.overrideRevert} onClick={() => setOverrideMode(false)}>
            Revert to storefront source
          </button>
        </div>
      )}

      {(!catalogBook || overrideMode) && (
        <>
          <div className={styles.fileGrid} data-cover={isCover ? 'true' : undefined}>
            <div>
              <div className={styles.editorFieldLabelLg}>CURRENT FILE</div>
              <div
                className={styles.currentFile}
                style={{
                  background: isCover ? '#1a1612' : 'color-mix(in srgb, var(--ink) 70%, var(--paper))',
                  aspectRatio: isCover ? '2/3' : '1/1',
                }}
              >
                {isCover ? (
                  <>
                    <div className={styles.currentFileLabel}>B. WOLF</div>
                    <div className={`serif ${styles.currentFileTitleText}`}>
                      {asset.id === 'cover-salt' ? 'The Salt\nRoads' : 'Hollow\nMeridian'}
                    </div>
                  </>
                ) : (
                  <Avatar initials="BW" tone="paper" size={64} />
                )}
              </div>
              <div className={styles.fileFormat}>{asset.format}</div>
            </div>

            <div className={styles.replaceCol}>
              <div>
                <div className={styles.editorFieldLabelLg}>REPLACE FILE</div>
                <div className={styles.dropZone}>
                  <IconUpload size={20} />
                  <div className={styles.dropText}>Drop file here or click to browse</div>
                  <div className={styles.dropSpec}>
                    {isCover ? 'PNG or JPG · 2400×3600 minimum · RGB' : 'JPG or PNG · 2400×2400 minimum · RGB'}
                  </div>
                </div>
              </div>

              <div>
                <div className={styles.editorFieldLabel}>CAPTION / ALT TEXT</div>
                <input
                  defaultValue={isCover
                    ? `Cover of ${asset.id === 'cover-salt' ? 'The Salt Roads' : 'Hollow Meridian'} by Billie Wolf`
                    : `Author photo — Billie Wolf${asset.id === 'headshot-bw' ? ' (black & white)' : ''}`
                  }
                  className={styles.field}
                />
              </div>

              <div>
                <div className={styles.editorFieldLabel}>PHOTO CREDIT</div>
                <input
                  defaultValue={asset.id.startsWith('headshot') ? 'Photo © Marcus Tan, 2025' : ''}
                  placeholder="e.g. Photo © Photographer Name, Year"
                  className={styles.field}
                />
              </div>
            </div>
          </div>

          <div className={styles.usageSection}>
            <div className={styles.editorFieldLabelLg}>USAGE NOTE FOR PRESS</div>
            <textarea
              defaultValue={isCover
                ? 'For editorial use only in connection with coverage of the title. Do not crop, alter, or overprint.'
                : 'For editorial use only. Please credit the photographer. Do not crop below the shoulders.'}
              rows={2}
              className={`${styles.ta} ${styles.taSm}`}
            />
          </div>

          <div className={styles.editActions}>
            <Btn tone="primary">Save changes</Btn>
            <Btn tone="ghost" icon={<IconArrowUp size={12} />}>Download ↗</Btn>
          </div>
        </>
      )}
    </div>
  );
}

function BioEditor({ asset }: { asset: PKAsset }) {
  const isShort = asset.id === 'bio-short';
  const [text, setText] = useState(isShort ? BIO_SHORT : BIO_LONG);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const target = isShort ? 80 : 250;
  const over = words > target * 1.15;

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.bioHeader}>
        <div className="label">{asset.name}</div>
        <Pill tone="good">{asset.status}</Pill>
      </div>
      <div className={`serif ${styles.bioSub}`}>
        {isShort
          ? 'Used in event programmes, review roundups, and wherever space is tight. Target: ~80 words.'
          : 'Used in full press releases, author pages, and feature profiles. Target: ~250 words.'}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={isShort ? 5 : 12}
        className={styles.ta}
      />

      <div className={styles.bioFooter}>
        <div className={styles.bioFooterLeft}>
          <span className={styles.bioProgress} data-over={over ? 'true' : undefined}>
            {words} / {target} WORDS
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${Math.min(100, (words / target) * 100)}%`,
                background: over ? 'var(--danger)' : words > target * 0.85 ? 'var(--good)' : 'var(--accent)',
              }}
            />
          </div>
        </div>
        <div className={styles.bioActions}>
          <Btn tone="ghost">Copy text</Btn>
          <Btn tone="ghost" icon={<IconArrowUp size={12} />}>Download .txt</Btn>
        </div>
      </div>

      <div className={styles.voiceGuide}>
        <div className={styles.voiceLabel}>THIRD-PERSON VOICE GUIDE</div>
        <div className={styles.voiceGrid}>
          {[
            { l: 'Always refer to author as', v: '"Billie Wolf" or "Wolf"' },
            { l: 'Genre descriptor',           v: '"literary and speculative fiction"' },
            { l: 'Location',                   v: '"Portland, Oregon"' },
            { l: 'Debut title',                v: '"The Salt Roads (2025)"' },
          ].map(g => (
            <div key={g.l} className={styles.voiceItem}>
              <div className={styles.voiceItemLabel}>{g.l.toUpperCase()}</div>
              <div className={`serif ${styles.voiceItemVal}`}>{g.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bioSaveBtn}>
        <Btn tone="primary">Save bio</Btn>
      </div>
    </div>
  );
}

function PressReleaseEditor() {
  const [embargo, setEmbargo] = useState(false);
  const [embargoDate, setEmbargoDate] = useState('');
  const [headline, setHeadline] = useState('Portland Author Billie Wolf Debuts with The Salt Roads');
  const [subhead, setSubhead] = useState('Shortlisted for the Newcomer Prize, praised for "prose of quiet precision"');
  const [dateline, setDateline] = useState('Portland, OR');
  const [body1, setBody1] = useState(`Billie Wolf, an independent author based in Portland, Oregon, announces the publication of her debut novel The Salt Roads, available now in paperback, hardcover, and digital editions. The novel has been shortlisted for the Newcomer Prize and received advance praise from The Literary Review, which called it "prose of quiet precision."`);
  const [body2, setBody2] = useState(`The Salt Roads follows three women across three centuries, connected by a coastline and an inheritance they cannot name. Spanning 322 pages, the novel is set and self-published from Portland and distributed globally through IngramSpark and Amazon KDP.`);
  const [body3, setBody3] = useState(`Wolf writes The Margin Letter, a fortnightly dispatch on craft and the writing life read by over 3,000 subscribers. Her second novel, Hollow Meridian, is forthcoming.`);
  const [quote, setQuote] = useState(`I wrote this book in the margins of everything else. The fact that readers are finding it, and finding each other through it, is more than I expected from any first novel.`);
  const [contactName, setContactName] = useState('Billie Wolf');
  const [contactEmail, setContactEmail] = useState('press@billiewolf.bookending.press');

  return (
    <div className={styles.prGrid}>
      <div className={styles.prPanel}>
        <div className={styles.prHeader}>
          <div className="label">Press release — The Salt Roads</div>
          <Pill tone="good">ready</Pill>
        </div>

        <div className={styles.prToggle}>
          <div className={styles.prToggleBtns} data-embargo={embargo ? 'true' : undefined}>
            <button
              onClick={() => setEmbargo(false)}
              className={styles.releaseBtn}
              data-active={!embargo ? 'true' : undefined}
            >FOR IMMEDIATE RELEASE</button>
            <button
              onClick={() => setEmbargo(true)}
              className={styles.releaseBtn}
              data-active={embargo ? 'true' : undefined}
            >EMBARGOED UNTIL</button>
          </div>
          {embargo && (
            <input
              value={embargoDate}
              onChange={e => setEmbargoDate(e.target.value)}
              placeholder="e.g. 12:01 AM ET, June 1, 2026"
              className={`${styles.field} ${styles.fieldMono}`}
            />
          )}
        </div>

        <div className={styles.prFields}>
          <div>
            <div className={styles.editorFieldLabel}>HEADLINE</div>
            <input value={headline} onChange={e => setHeadline(e.target.value)} className={`${styles.field} ${styles.fieldLarge}`} />
          </div>
          <div>
            <div className={styles.editorFieldLabel}>SUBHEADLINE</div>
            <input value={subhead} onChange={e => setSubhead(e.target.value)} className={`${styles.field} ${styles.fieldSerif}`} />
          </div>
          <div>
            <div className={styles.editorFieldLabel}>DATELINE</div>
            <input value={dateline} onChange={e => setDateline(e.target.value)} className={`${styles.field} ${styles.fieldDateline}`} />
          </div>
          <div>
            <div className={styles.editorFieldLabel}>OPENING PARAGRAPH</div>
            <textarea value={body1} onChange={e => setBody1(e.target.value)} rows={4} className={styles.ta} />
          </div>
          <div>
            <div className={styles.editorFieldLabel}>BODY PARAGRAPH 2</div>
            <textarea value={body2} onChange={e => setBody2(e.target.value)} rows={3} className={styles.ta} />
          </div>
          <div>
            <div className={styles.editorFieldLabel}>BODY PARAGRAPH 3</div>
            <textarea value={body3} onChange={e => setBody3(e.target.value)} rows={3} className={styles.ta} />
          </div>

          <div className={styles.quoteBox}>
            <div className={styles.quoteBoxLabel}>AUTHOR QUOTE</div>
            <textarea value={quote} onChange={e => setQuote(e.target.value)} rows={3} className={`${styles.ta} ${styles.taQuote}`} />
            <div className={styles.quoteAttr}>— BILLIE WOLF, author</div>
          </div>

          <div className={styles.aboutBox}>
            <div className={styles.aboutBoxLabel}>ABOUT THE AUTHOR</div>
            <div className={`serif ${styles.aboutBio}`}>{BIO_SHORT}</div>
            <button className={styles.editLink}>Edit in Identity →</button>
          </div>
        </div>

        <div className={styles.prActions}>
          <Btn tone="primary">Save release</Btn>
          <Btn tone="ghost" icon={<IconArrowUp size={12} />}>Export PDF ↗</Btn>
          <Btn tone="ghost">Copy text</Btn>
        </div>
      </div>

      <div className={styles.prSidePanel}>
        <div>
          <div className={`label ${styles.labelLg}`}>Media contact</div>
          <div className={styles.contactList}>
            {[
              { l: 'NAME',  v: contactName,  set: setContactName },
              { l: 'EMAIL', v: contactEmail, set: setContactEmail },
            ].map(f => (
              <div key={f.l}>
                <div className={styles.editorFieldLabel}>{f.l}</div>
                <input
                  value={f.v}
                  onChange={e => f.set(e.target.value)}
                  className={styles.field}
                  style={{ fontFamily: f.l === 'EMAIL' ? 'var(--mono)' : 'var(--sans)', fontSize: 12 }}
                />
              </div>
            ))}
            <div>
              <div className={styles.editorFieldLabel}>PHONE (OPTIONAL)</div>
              <input placeholder="+" className={`${styles.field} ${styles.fieldMono}`} />
            </div>
          </div>
        </div>

        <div>
          <div className={`label ${styles.labelMd}`}>Document preview</div>
          <div className={styles.previewBox}>
            <div className={styles.previewRelease}>
              {embargo ? `EMBARGOED UNTIL ${embargoDate || '—'}` : 'FOR IMMEDIATE RELEASE'}
            </div>
            <div className={styles.previewHeadline}>{headline}</div>
            <div className={styles.previewSubhead}>{subhead}</div>
            <div className={styles.previewDateline}>{dateline} —</div>
            <div className={styles.previewLines}>
              {[80, 72, 88, 65, 78].map((w, i) => (
                <div key={i} className={styles.previewLine} style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className={styles.previewQuoteSection}>
              <div className={styles.previewQuoteMark}>"</div>
              <div className={styles.previewQuoteLines}>
                {[70, 76, 50].map((w, i) => (
                  <div key={i} className={styles.previewQuoteLine} style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className={`label ${styles.labelSm}`}>Send to press list</div>
          <div className={`serif ${styles.pressListText}`}>
            Share directly with journalists and reviewers in your contacts.
          </div>
          <Btn tone="ghost" icon={<IconArrow size={12} />}>Send to press contacts</Btn>
        </div>
      </div>
    </div>
  );
}

interface PressKitViewProps {
  savedBooks: Record<number, BookMetadata>;
}

export function PressKitView({ savedBooks }: PressKitViewProps) {
  const [selected, setSelected] = useState('headshot');
  const selectedAsset = PK_ASSETS.find(a => a.id === selected)!;
  const groups = ['Photos', 'Covers', 'Text', 'Documents'];

  return (
    <div className={styles.pkGrid}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={`label ${styles.sidebarKitLabel}`}>Kit assets</div>
          <Btn tone="ghost" icon={<IconArrowUp size={11} />}>Export all</Btn>
        </div>
        {groups.map(group => (
          <div key={group}>
            <div className={styles.groupLabel}>{group.toUpperCase()}</div>
            {PK_ASSETS.filter(a => a.group === group).map(a => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={styles.assetBtn}
                data-selected={selected === a.id ? 'true' : undefined}
              >
                <div className={styles.assetDot} data-ready={a.status === 'ready' ? 'true' : undefined} />
                <div>
                  <div className={styles.assetName}>{a.name}</div>
                  <div className={styles.assetFormat}>{a.format}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div>
        {selectedAsset.kind === 'image'        && <ImageEditor asset={selectedAsset} savedBooks={savedBooks} />}
        {selectedAsset.kind === 'bio'          && <BioEditor asset={selectedAsset} />}
        {selectedAsset.kind === 'pressrelease' && <PressReleaseEditor />}
      </div>
    </div>
  );
}
