import { useState, useEffect } from 'react';
import { Pill, Btn } from '../../shared/ui/atoms';
import { IconArrow, IconMore } from '../../shared/ui/icons';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import type { SettingsPayload } from '@bookending/shared';
import styles from './SettingsView.module.css';

const DEFAULT_CONFIRMATION = `Hi {{first_name}},

Thank you for your order — {{order_number}} is confirmed and I'm getting it ready for you.

You'll receive a shipping notification with tracking details once it's on its way.

With gratitude,
Billie Wolf
bookending.press/billiewolf`;

const DEFAULT_PACKING = `Thank you for supporting my work directly.
Signed copies and zines ship from Portland, Oregon.
Handle with care — there's a letter inside.`;

const DEFAULT_LETTER = `Dear Reader,

Thank you for ordering directly from me — it means more than I can say. Every direct sale lets me keep writing without the intermediary.

[Write something personal here]

Warm regards,
Billie`;

const DEFAULT_REFUND_POLICY = `All sales are final on signed, personalised, and digital items. For standard print orders, I accept returns within 14 days of delivery provided the book is in original condition. Return shipping is at the buyer's cost. To initiate a return, use the return request form on your order page. Refunds are issued to the original payment method within 5 business days of receiving the returned item.`;

async function saveSettings(payload: SettingsPayload) {
  try {
    await api.put('/api/storefront/settings', payload);
  } catch { /* ignore network errors */ }
}

export function SettingsView() {
  const { session } = useAuth();

  const [shopName,   setShopName]   = useState('Billie Wolf');
  const [shopSlug,   setShopSlug]   = useState('billiewolf');
  const [tagline,    setTagline]    = useState('Signed on request · Free letter with any order · Ships from Portland');
  const [shipsFrom,  setShipsFrom]  = useState('Portland, OR · USA');

  const [notifPerOrder, setNotifPerOrder] = useState(true);
  const [notifDigest,   setNotifDigest]   = useState(false);
  const [webhookUrl,    setWebhookUrl]    = useState('');

  const [collectVat,  setCollectVat]  = useState(false);
  const [iossNumber,  setIossNumber]  = useState('');
  const [ukVatNumber, setUkVatNumber] = useState('');

  const [lowStockAt, setLowStockAt] = useState(5);

  const [emailTpl,   setEmailTpl]   = useState(DEFAULT_CONFIRMATION);
  const [packingTpl, setPackingTpl] = useState(DEFAULT_PACKING);
  const [letterTpl,  setLetterTpl]  = useState(DEFAULT_LETTER);

  const [refundPolicy,   setRefundPolicy]   = useState(DEFAULT_REFUND_POLICY);
  const [returnWindow,   setReturnWindow]   = useState(14);
  const [returnShipping, setReturnShipping] = useState<'buyer' | 'seller'>('buyer');
  const [digitalRefunds, setDigitalRefunds] = useState(false);

  // Load settings from API on mount
  useEffect(() => {
    if (!session?.token) return;
    void (async () => {
      try {
        const s = await api.get<SettingsPayload | null>('/api/storefront/settings');
        if (!s) return;
        if (s.shopName       != null) setShopName(s.shopName);
        if (s.shopSlug       != null) setShopSlug(s.shopSlug);
        if (s.shopTagline    != null) setTagline(s.shopTagline);
        if (s.shipsFrom      != null) setShipsFrom(s.shipsFrom);
        if (s.notifPerOrder  != null) setNotifPerOrder(s.notifPerOrder);
        if (s.notifDigest    != null) setNotifDigest(s.notifDigest);
        if (s.webhookUrl     != null) setWebhookUrl(s.webhookUrl);
        if (s.collectVat     != null) setCollectVat(s.collectVat);
        if (s.iossNumber     != null) setIossNumber(s.iossNumber);
        if (s.ukVatNumber    != null) setUkVatNumber(s.ukVatNumber);
        if (s.lowStockAt     != null) setLowStockAt(s.lowStockAt);
        if (s.emailTemplate  && s.emailTemplate  !== '') setEmailTpl(s.emailTemplate);
        if (s.packingTemplate && s.packingTemplate !== '') setPackingTpl(s.packingTemplate);
        if (s.letterTemplate && s.letterTemplate  !== '') setLetterTpl(s.letterTemplate);
        if (s.refundPolicy   && s.refundPolicy    !== '') setRefundPolicy(s.refundPolicy);
        if (s.returnWindow   != null) setReturnWindow(s.returnWindow);
        if (s.returnShipping != null) setReturnShipping(s.returnShipping as 'buyer' | 'seller');
        if (s.digitalRefunds != null) setDigitalRefunds(s.digitalRefunds);
      } catch { /* API down — defaults remain */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  function save(payload: SettingsPayload) {
    void saveSettings(payload);
  }

  return (
    <div className={styles.settingsGrid}>

      {/* ── Row 1 — Shop identity | Payment + Shipping + Inventory ── */}

      <div className={styles.leftCol}>
        <div className={`label ${styles.sectionLabel}`}>Shop identity</div>
        <div className={styles.fields}>
          <div>
            <div className={styles.fieldLabel}>SHOP NAME</div>
            <input value={shopName} onChange={e => setShopName(e.target.value)} className={styles.input} />
          </div>
          <div>
            <div className={styles.fieldLabel}>SHOP URL</div>
            <div className={styles.urlField}>
              <span className={styles.urlPrefix}>bookending.press/</span>
              <input value={shopSlug} onChange={e => setShopSlug(e.target.value)} className={styles.urlInput} />
            </div>
          </div>
          <div>
            <div className={styles.fieldLabel}>SHOP TAGLINE</div>
            <textarea value={tagline} onChange={e => setTagline(e.target.value)} rows={2} className={styles.textarea} />
          </div>
          <div>
            <div className={styles.fieldLabel}>SHIPS FROM</div>
            <input value={shipsFrom} onChange={e => setShipsFrom(e.target.value)} className={styles.input} />
          </div>
        </div>
        <div className={styles.saveBtn}>
          <Btn tone="primary" onClick={() => save({ shopName, shopSlug, shopTagline: tagline, shipsFrom })}>
            Save changes
          </Btn>
        </div>
      </div>

      <div className={styles.rightCol}>

        <div>
          <div className={`label ${styles.subSectionLabel}`}>Payment</div>
          <div className={styles.paymentList}>
            {[
              { name: 'Stripe', sub: 'Credit & debit · Apple Pay · Google Pay', connected: true  },
              { name: 'PayPal', sub: 'PayPal · Venmo',                           connected: false },
            ].map(p => (
              <div key={p.name} className={styles.paymentItem}>
                <div>
                  <div className={styles.paymentName}>{p.name}</div>
                  <div className={styles.paymentSub}>{p.sub}</div>
                </div>
                {p.connected ? <Pill tone="good">Connected</Pill> : <Btn tone="ghost">Connect</Btn>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className={`label ${styles.subSectionLabel}`}>Shipping zones</div>
          <div className={styles.shippingList}>
            {[
              { zone: 'United States',  rate: 'Free over $30 · $4.99 standard', days: '3–5 days'   },
              { zone: 'United Kingdom', rate: '$8.99 flat',                      days: '7–10 days'  },
              { zone: 'Europe',         rate: '$10.99 flat',                     days: '7–14 days'  },
              { zone: 'Rest of world',  rate: '$14.99 flat',                     days: '10–21 days' },
            ].map(z => (
              <div key={z.zone} className={styles.shippingRow}>
                <div className={styles.shippingZone}>{z.zone}</div>
                <div className={styles.shippingRate}>{z.rate}</div>
                <div className={styles.shippingDays}>{z.days}</div>
                <button className={styles.shippingMore}><IconMore size={14} /></button>
              </div>
            ))}
          </div>
          <div className={styles.addZoneBtn}>
            <Btn tone="ghost" icon={<IconArrow size={12} />}>Add zone</Btn>
          </div>
        </div>

        <div>
          <div className={`label ${styles.subSectionLabel}`}>Inventory</div>
          <div className={styles.inventoryRow}>
            <div>
              <div className={styles.fieldLabel}>LOW STOCK THRESHOLD</div>
              <div className={styles.inventoryHint}>Products at or below this count show a "Low stock" badge in your store and on the Products tab.</div>
            </div>
            <div className={styles.inventoryInputWrap}>
              <input
                type="number" min={1} value={lowStockAt}
                onChange={e => setLowStockAt(Math.max(1, Number(e.target.value)))}
                className={`${styles.input} ${styles.inputNarrow}`}
              />
              <span className={styles.inventoryUnit}>units</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Row 2 — Notifications | Tax & VAT ── */}

      <div className={styles.leftSection}>
        <div className={`label ${styles.sectionLabel}`}>Order notifications</div>

        <div className={styles.toggleList}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleTitle}>Per-order email</div>
              <div className={styles.toggleSub}>Send me an email for every new order as it comes in.</div>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" checked={notifPerOrder} onChange={e => setNotifPerOrder(e.target.checked)} />
              <span className={styles.toggleTrack} />
            </label>
          </div>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleTitle}>Daily digest</div>
              <div className={styles.toggleSub}>One summary email each morning covering overnight orders.</div>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" checked={notifDigest} onChange={e => setNotifDigest(e.target.checked)} />
              <span className={styles.toggleTrack} />
            </label>
          </div>
        </div>

        <div className={styles.webhookBlock}>
          <div className={styles.fieldLabel}>WEBHOOK URL</div>
          <div className={styles.webhookHint}>POST a JSON payload to this URL on every new order. Leave blank to disable.</div>
          <input
            type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://…" className={styles.input}
          />
        </div>

        <div className={styles.saveBtn}>
          <Btn tone="primary" onClick={() => save({ notifPerOrder, notifDigest, webhookUrl, lowStockAt })}>
            Save
          </Btn>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={`label ${styles.sectionLabel}`}>Tax & VAT</div>

        <div className={styles.vatCallout}>
          <div className={styles.vatCalloutTitle}>You're shipping to the UK and EU</div>
          <p className={styles.vatCalloutBody}>
            UK VAT registration is required once annual UK sales exceed the £85,000 threshold.
            For EU parcels under €150, you must register for the EU IOSS scheme or collect VAT parcel-by-parcel at the border.
            Consult a tax adviser before enabling collection.
          </p>
        </div>

        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleTitle}>Collect VAT at checkout</div>
            <div className={styles.toggleSub}>Display and collect VAT for UK and EU buyers. Requires active IOSS or UK VAT registration below.</div>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={collectVat} onChange={e => setCollectVat(e.target.checked)} />
            <span className={styles.toggleTrack} />
          </label>
        </div>

        <div className={styles.fields}>
          <div>
            <div className={styles.fieldLabel}>EU IOSS NUMBER</div>
            <input value={iossNumber} onChange={e => setIossNumber(e.target.value)} placeholder="IM000 0000 00" className={styles.input} />
          </div>
          <div>
            <div className={styles.fieldLabel}>UK VAT NUMBER</div>
            <input value={ukVatNumber} onChange={e => setUkVatNumber(e.target.value)} placeholder="GB 000 0000 00" className={styles.input} />
          </div>
        </div>

        <div>
          <Btn tone="primary" onClick={() => save({ collectVat, iossNumber, ukVatNumber })}>Save</Btn>
        </div>
      </div>

      {/* ── Row 3 — Templates (full width) ── */}

      <div className={styles.fullSection}>
        <div className={`label ${styles.sectionLabel}`}>Templates</div>
        <div className={styles.templatesGrid}>

          <div className={styles.templateCol}>
            <div className={styles.templateHead}>
              <div className={styles.templateTitle}>Order confirmation</div>
              <div className={styles.templateSub}>
                Sent automatically when an order is placed.
                Use <code>{'{{first_name}}'}</code> and <code>{'{{order_number}}'}</code>.
              </div>
            </div>
            <textarea value={emailTpl} onChange={e => setEmailTpl(e.target.value)} rows={11} className={styles.textarea} />
          </div>

          <div className={styles.templateCol}>
            <div className={styles.templateHead}>
              <div className={styles.templateTitle}>Packing slip note</div>
              <div className={styles.templateSub}>
                Printed at the bottom of every packing slip. Keep it to two or three lines.
              </div>
            </div>
            <textarea value={packingTpl} onChange={e => setPackingTpl(e.target.value)} rows={11} className={styles.textarea} />
          </div>

          <div className={styles.templateCol}>
            <div className={styles.templateHead}>
              <div className={styles.templateTitle}>Free letter</div>
              <div className={styles.templateSub}>
                Default text for orders with "free letter" requested. Personalise per order in the order detail view.
              </div>
            </div>
            <textarea value={letterTpl} onChange={e => setLetterTpl(e.target.value)} rows={11} className={styles.textarea} />
          </div>

        </div>
        <div className={styles.saveBtn}>
          <Btn tone="primary" onClick={() => save({ emailTemplate: emailTpl, packingTemplate: packingTpl, letterTemplate: letterTpl })}>
            Save templates
          </Btn>
        </div>
      </div>

      {/* ── Row 4 — Refunds & returns (full width) ── */}

      <div className={styles.fullSection}>
        <div className={`label ${styles.sectionLabel}`}>Refunds & returns</div>
        <div className={styles.refundGrid}>

          <div className={styles.refundLeft}>
            <div className={styles.fieldLabel}>REFUND POLICY</div>
            <div className={styles.refundHint}>Shown to customers on product pages and at checkout.</div>
            <textarea value={refundPolicy} onChange={e => setRefundPolicy(e.target.value)} rows={8} className={styles.textarea} />
          </div>

          <div className={styles.refundRight}>
            <div className={styles.refundSettings}>

              <div>
                <div className={styles.fieldLabel}>RETURN WINDOW</div>
                <div className={styles.inventoryInputWrap}>
                  <input
                    type="number" min={0} value={returnWindow}
                    onChange={e => setReturnWindow(Math.max(0, Number(e.target.value)))}
                    className={`${styles.input} ${styles.inputNarrow}`}
                  />
                  <span className={styles.inventoryUnit}>days after delivery</span>
                </div>
              </div>

              <div>
                <div className={styles.fieldLabel}>RETURN SHIPPING COST</div>
                <div className={styles.radioGroup}>
                  {(['buyer', 'seller'] as const).map(who => (
                    <label key={who} className={styles.radioRow}>
                      <input
                        type="radio" name="returnShipping" value={who}
                        checked={returnShipping === who} onChange={() => setReturnShipping(who)}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioLabel}>{who === 'buyer' ? 'Buyer pays' : 'Seller pays'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleTitle}>Allow digital refunds</div>
                  <div className={styles.toggleSub}>Permit refund requests on eBook and PDF orders within the return window.</div>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={digitalRefunds} onChange={e => setDigitalRefunds(e.target.checked)} />
                  <span className={styles.toggleTrack} />
                </label>
              </div>

              <div className={styles.refundFlowNote}>
                Customers initiate returns from their order detail page. Requests appear in your Orders tab for review and approval.
              </div>

            </div>
          </div>

        </div>
        <div className={styles.saveBtn}>
          <Btn tone="primary" onClick={() => save({ refundPolicy, returnWindow, returnShipping, digitalRefunds })}>
            Save refund policy
          </Btn>
        </div>
      </div>

    </div>
  );
}
