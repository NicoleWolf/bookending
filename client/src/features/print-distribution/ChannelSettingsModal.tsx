import { useState } from 'react';
import type { Channel, ChannelStatus } from './types';
import styles from './ChannelSettingsModal.module.css';

const STATUS_OPTIONS: { value: ChannelStatus; label: string; desc: string }[] = [
  { value: 'live',    label: 'Live',    desc: 'Active — selling on this channel' },
  { value: 'pending', label: 'Pending', desc: 'Awaiting channel approval or setup' },
  { value: 'draft',   label: 'Draft',   desc: 'Setup in progress — not yet submitted' },
  { value: 'paused',  label: 'Paused',  desc: 'Temporarily unlisted' },
];

const ALL_FORMATS = ['Print', 'eBook', 'Audio'] as const;

interface Props {
  channel: Channel;
  onSave: (updated: Channel) => void;
  onClose: () => void;
}

export default function ChannelSettingsModal({ channel, onSave, onClose }: Props) {
  const [status,    setStatus]    = useState<ChannelStatus>(channel.status);
  const [listPrice, setListPrice] = useState(channel.listPrice?.toFixed(2) ?? '');
  const [formats,   setFormats]   = useState<string[]>(channel.formats);
  const [sku,       setSku]       = useState(channel.sku);

  const parsedPrice = parseFloat(listPrice);
  const royaltyPct  = parseFloat(channel.royalty) / 100;
  const net = !isNaN(parsedPrice) && !isNaN(royaltyPct) && parsedPrice > 0
    ? (parsedPrice * royaltyPct).toFixed(2)
    : null;

  function toggleFormat(f: string) {
    setFormats(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  function save() {
    onSave({
      ...channel,
      status,
      listPrice: parsedPrice > 0 ? parsedPrice : undefined,
      formats,
      sku: sku.trim() || channel.sku,
    });
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.head}>
          <div className={styles.headLeft}>
            <span className={styles.headTitle}>Channel settings</span>
            <span className={styles.headSub}>{channel.name} · {channel.kind}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.formBody}>

          {/* Status */}
          <div className={styles.field}>
            <div className={styles.label}>Status</div>
            <div className={styles.statusOptions}>
              {STATUS_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={styles.statusOption}
                  data-active={status === opt.value ? '' : undefined}
                >
                  <input
                    type="radio"
                    name="status"
                    className={styles.radio}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                  />
                  <div className={styles.statusOptionText}>
                    <span className={styles.statusLabel}>{opt.label}</span>
                    <span className={styles.statusDesc}>{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* List price */}
          <div className={styles.field}>
            <div className={styles.label}>List price</div>
            <div className={styles.priceInputRow}>
              <span className={styles.priceCurrency}>$</span>
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
              />
            </div>
            {net && (
              <div className={styles.priceNet}>
                At {channel.royalty} royalty — net <strong>${net}</strong> per copy
              </div>
            )}
            {channel.reserves && (
              <div className={styles.priceReserves}>{channel.reserves}</div>
            )}
          </div>

          {/* Active formats */}
          <div className={styles.field}>
            <div className={styles.label}>Active formats</div>
            <div className={styles.formatOptions}>
              {ALL_FORMATS.map(f => (
                <label
                  key={f}
                  className={styles.formatOption}
                  data-active={formats.includes(f) ? '' : undefined}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={formats.includes(f)}
                    onChange={() => toggleFormat(f)}
                  />
                  {f}
                </label>
              ))}
            </div>
          </div>

          {/* SKU */}
          <div className={styles.field}>
            <div className={styles.label}>Channel identifier / SKU</div>
            <input
              className={styles.input}
              value={sku}
              onChange={e => setSku(e.target.value)}
            />
            <div className={styles.fieldHint}>
              How {channel.name} identifies your title in their system.
            </div>
          </div>

        </div>

        <div className={styles.foot}>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={save}>Save changes</button>
        </div>

      </div>
    </div>
  );
}
