import type { CSSProperties } from 'react';
import { Pill, Btn } from '../../shared/ui/atoms';
import { IconArrowUp } from '../../shared/ui/icons';
import type { Product, Order } from './types';
import {
  ORDER_STATUS_TONE, ORDER_STATUS_LABEL,
  REVENUE_SERIES, GEOGRAPHY, FUNNEL, REPEAT_RATE,
} from './data';
import styles from './OverviewView.module.css';

// ── Chart helpers ─────────────────────────────────────────────────

const CHART_W = 600;
const CHART_H = 72;
const revenueMax = Math.max(...REVENUE_SERIES.current, ...REVENUE_SERIES.prev);

function makePath(vals: number[]): string {
  const last = vals.length - 1;
  return vals
    .map((v, i) =>
      `${i === 0 ? 'M' : 'L'}${((i / last) * CHART_W).toFixed(1)},${(CHART_H - (v / revenueMax) * (CHART_H - 4)).toFixed(1)}`
    )
    .join(' ');
}

// ── Action queue data — populated from API (Phase 3) ─────────────

const liveSku: Product[]       = [];
const awaitingOrders: Order[]  = [];
const lowStockSkus: Product[]  = [];
const missingCovers: Product[] = [];
const pendingRefunds: Order[]  = [];

// ── Action cell ───────────────────────────────────────────────────

function ActionCell({ count, label, sub, tone, onClick }: {
  count: number; label: string; sub: string;
  tone: 'accent' | 'danger'; onClick?: () => void;
}) {
  return (
    <button
      className={styles.actionCell}
      data-tone={count === 0 ? undefined : tone}
      data-zero={count === 0 ? '' : undefined}
      onClick={count > 0 ? onClick : undefined}
    >
      <span className={`serif ${styles.actionCount}`}>{count}</span>
      <span className={styles.actionLabel}>{label}</span>
      <span className={styles.actionSub}>{sub}</span>
    </button>
  );
}

// ── Overview ──────────────────────────────────────────────────────

export function OverviewView({ onViewChange }: { onViewChange?: (v: string) => void }) {
  const currentPath = makePath(REVENUE_SERIES.current);
  const prevPath    = makePath(REVENUE_SERIES.prev);

  const toRate = (n: number) => FUNNEL.visitors > 0 ? +(n / FUNNEL.visitors * 100).toFixed(1) : 0;
  const funnelSteps = [
    { label: 'Visitors',      n: FUNNEL.visitors,     rate: null },
    { label: 'Product page',  n: FUNNEL.productViews, rate: toRate(FUNNEL.productViews) },
    { label: 'Added to cart', n: FUNNEL.cartAdds,     rate: toRate(FUNNEL.cartAdds) },
    { label: 'Checkout',      n: FUNNEL.checkouts,    rate: toRate(FUNNEL.checkouts) },
  ] as { label: string; n: number; rate: number | null }[];

  return (
    <div>
      <div style={{ padding: '6px 0 10px', borderBottom: '1px solid var(--rule)', marginBottom: '4px' }}>
        <span className="label" style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>
          PREVIEW DATA · Live sales analytics coming soon
        </span>
      </div>
      {/* ── Action queue + secondary revenue ── */}
      <div className={styles.actionRow}>
        <div className={styles.actionQueue}>
          <ActionCell
            count={awaitingOrders.length}
            label="Awaiting fulfillment"
            sub={awaitingOrders.length === 0 ? 'All clear' : `${awaitingOrders.filter(o => o.status === 'new').length} new · ${awaitingOrders.filter(o => o.status === 'processing').length} processing`}
            tone="accent"
            onClick={() => onViewChange?.('orders')}
          />
          <ActionCell
            count={lowStockSkus.length}
            label="Low-stock SKUs"
            sub={lowStockSkus.length > 0 ? lowStockSkus.map(p => p.title).join(', ') : 'All products stocked'}
            tone="accent"
            onClick={() => onViewChange?.('products')}
          />
          <ActionCell
            count={missingCovers.length}
            label="Missing cover images"
            sub="Live products without artwork"
            tone="danger"
            onClick={() => onViewChange?.('products')}
          />
          <ActionCell
            count={pendingRefunds.length}
            label="Pending refunds"
            sub={pendingRefunds.length > 0 ? `$${pendingRefunds.reduce((s, o) => s + o.total, 0)} total` : 'All clear'}
            tone="danger"
            onClick={() => onViewChange?.('orders')}
          />
        </div>
        <div className={styles.revenueCallout}>
          <div className={styles.revenueCalloutLabel}>Revenue · 30d</div>
          <div className={`serif ${styles.revenueCalloutValue}`}>$3,284</div>
          <div className={styles.revenueCalloutSub}>+34% from last period</div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* ── Left panel ── */}
        <div className={styles.leftPanel}>

          {/* Cumulative revenue line chart */}
          <div className={styles.chartSection}>
            <div className={styles.chartHeader}>
              <div className="label">Cumulative revenue</div>
              <div className={styles.chartLegend}>
                <span className={styles.legendThis}>This period</span>
                <span className={styles.legendPrev}>Last period</span>
              </div>
            </div>
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className={styles.lineChart}
              preserveAspectRatio="none"
            >
              <path d={prevPath}    className={styles.lineChartPrev}    vectorEffect="non-scaling-stroke" />
              <path d={currentPath} className={styles.lineChartCurrent} vectorEffect="non-scaling-stroke" />
            </svg>
            <div className={styles.chartDates}>
              <span className={styles.chartDate}>21 APR</span>
              <span className={styles.chartDate}>4 MAY</span>
            </div>
          </div>

          {/* Conversion funnel */}
          <div className={styles.funnelSection}>
            <div className={`label ${styles.labelMb18}`}>Conversion funnel · 30 days</div>
            {funnelSteps.map((step, i) => (
              <div key={i} className={styles.funnelStep}>
                <span className={styles.funnelLabel}>{step.label}</span>
                <div
                  className={styles.funnelBar}
                  style={{ '--w': `${FUNNEL.visitors > 0 ? (step.n / FUNNEL.visitors) * 100 : 0}%` } as CSSProperties}
                />
                <span className={`serif ${styles.funnelNum}`}>{step.n.toLocaleString()}</span>
                <span className={styles.funnelRate}>{step.rate !== null ? `${step.rate}%` : ''}</span>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div>
            <div className={styles.ordersHeader}>
              <div className="label">Recent orders</div>
              <span className={styles.ordersHeaderSub}>LAST 24H · 11 ORDERS</span>
            </div>
            {awaitingOrders.slice(0, 5).map(o => (
              <div key={o.id} className={styles.orderRow}>
                <div className={styles.orderNum}>{o.num}</div>
                <div className={styles.orderCustomer}>{o.customer}</div>
                <div className={styles.orderLocation}>{o.location}</div>
                <div className={`serif ${styles.orderItems}`}>{o.items}</div>
                <div className={`serif ${styles.orderTotal}`}>${o.total}</div>
                <Pill tone={ORDER_STATUS_TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Pill>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={styles.rightPanel}>
          <div className={styles.rightHeader}>
            <div className="label">Your storefront</div>
            <button className={styles.visitLink} onClick={() => onViewChange?.('storefront')}>Visit ↗</button>
          </div>

          {missingCovers.length > 0 && (
            <div className={styles.coverWarning}>
              <span className={styles.coverWarningIcon}>!</span>
              <span className={styles.coverWarningText}>
                {missingCovers.length} of {liveSku.length} live products have no cover image — this is what customers see.
              </span>
            </div>
          )}

          <div className={styles.storePreview}>
            <div className={styles.previewNav}>
              <span className={`serif ${styles.previewNavTitle}`}>Billie Wolf</span>
              <span className={styles.previewNavLinks}>SHOP · ESSAYS · LETTER</span>
            </div>
            <div className={styles.previewGrid}>
              {liveSku.slice(0, 4).map(p => (
                <div key={p.id}>
                  <div className={styles.productCover}>
                    {!p.coverUrl && <div className={styles.productNoCover}>NO COVER</div>}
                    {p.status === 'low-stock' && (
                      <div className={styles.productStockTag}>{p.stock.toUpperCase()}</div>
                    )}
                    <div className={styles.productAuthor}>B. WOLF</div>
                    <div className={`serif ${styles.productTitle}`}>{p.title}</div>
                  </div>
                  <div className={styles.productMeta}>
                    <div className={styles.productType}>{p.type}</div>
                    <div className={`serif ${styles.productPrice}`}>${p.price}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.previewFooter}>
              <span className={styles.previewFooterText}>SIGNED ON REQUEST · SHIPS FROM PORTLAND</span>
            </div>
          </div>

          <div className={styles.previewActions}>
            <Btn tone="ghost">Edit theme</Btn>
            <Btn tone="ghost" icon={<IconArrowUp size={12} />} onClick={() => onViewChange?.('storefront')}>Open live ↗</Btn>
          </div>

          <div className={styles.urlBar}>
            <div>
              <div className={styles.urlLabel}>SHOP URL</div>
              <div className={styles.urlValue}>billiewolf.bookending.press</div>
            </div>
            <Pill tone="good">Live</Pill>
          </div>

          {/* Geography */}
          <div className={styles.geoSection}>
            <div className={`label ${styles.labelMb14}`}>Geography · 30d</div>
            {GEOGRAPHY.map(g => (
              <div key={g.country} className={styles.geoRow}>
                <span className={styles.geoCountry}>{g.country}</span>
                <div className={styles.geoBar}>
                  <div className={styles.geoBarFill} style={{ '--pct': `${g.pct}%` } as CSSProperties} />
                </div>
                <span className={styles.geoPct}>{g.pct}%</span>
              </div>
            ))}
          </div>

          {/* Repeat customers */}
          <div className={styles.repeatSection}>
            <div className={`label ${styles.labelMb14}`}>Repeat customers · 30d</div>
            <div className={styles.repeatDisplay}>
              <span className={`serif ${styles.repeatRate}`}>{REPEAT_RATE.rate}%</span>
              <span className={styles.repeatSub}>
                {REPEAT_RATE.repeatOrders} repeat orders
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
