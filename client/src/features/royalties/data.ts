import type { Channel, DailyRollup, TitleEarnings, Payout, TaxYearData } from './types';

export const CHANNEL_INFO: Record<Channel, { label: string; cut: number; schedule: string }> = {
  direct: { label: 'Bookending Direct', cut: 5,  schedule: 'Monthly · 15th'             },
  kdp:    { label: 'Amazon KDP',        cut: 30, schedule: '~60 days after month close'  },
  ingram: { label: 'IngramSpark',       cut: 55, schedule: 'Quarterly · Apr/Jul/Oct/Jan' },
  other:  { label: 'Other / Bundles',  cut: 10, schedule: 'As received'                 },
};

export const DAILY_ROLLUPS: DailyRollup[] = [
  { date: 'Apr 6',  channel: 'direct', units: 3, gross: 35.97, net: 34.17 },
  { date: 'Apr 7',  channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'Apr 8',  channel: 'direct', units: 2, gross: 23.98, net: 22.78 },
  { date: 'Apr 8',  channel: 'ingram', units: 1, gross: 16.99, net: 7.65  },
  { date: 'Apr 9',  channel: 'direct', units: 4, gross: 47.96, net: 45.56 },
  { date: 'Apr 10', channel: 'direct', units: 2, gross: 23.98, net: 22.78 },
  { date: 'Apr 10', channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'Apr 11', channel: 'ingram', units: 2, gross: 33.98, net: 15.29 },
  { date: 'Apr 12', channel: 'direct', units: 5, gross: 59.95, net: 56.95 },
  { date: 'Apr 13', channel: 'direct', units: 3, gross: 35.97, net: 34.17 },
  { date: 'Apr 14', channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'Apr 14', channel: 'other',  units: 2, gross: 19.98, net: 17.98 },
  { date: 'Apr 15', channel: 'direct', units: 4, gross: 47.96, net: 45.56 },
  { date: 'Apr 16', channel: 'direct', units: 2, gross: 23.98, net: 22.78 },
  { date: 'Apr 16', channel: 'ingram', units: 1, gross: 16.99, net: 7.65  },
  { date: 'Apr 17', channel: 'direct', units: 3, gross: 35.97, net: 34.17 },
  { date: 'Apr 18', channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'Apr 19', channel: 'direct', units: 4, gross: 47.96, net: 45.56 },
  { date: 'Apr 19', channel: 'ingram', units: 1, gross: 16.99, net: 7.65  },
  { date: 'Apr 20', channel: 'direct', units: 2, gross: 23.98, net: 22.78 },
  { date: 'Apr 21', channel: 'direct', units: 5, gross: 59.95, net: 56.95 },
  { date: 'Apr 21', channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'Apr 22', channel: 'direct', units: 3, gross: 35.97, net: 34.17 },
  { date: 'Apr 23', channel: 'ingram', units: 2, gross: 33.98, net: 15.29 },
  { date: 'Apr 24', channel: 'direct', units: 4, gross: 47.96, net: 45.56 },
  { date: 'Apr 25', channel: 'direct', units: 2, gross: 23.98, net: 22.78 },
  { date: 'Apr 25', channel: 'other',  units: 2, gross: 19.98, net: 17.98 },
  { date: 'Apr 26', channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'Apr 26', channel: 'ingram', units: 1, gross: 16.99, net: 7.65  },
  { date: 'Apr 27', channel: 'direct', units: 3, gross: 35.97, net: 34.17 },
  { date: 'Apr 28', channel: 'direct', units: 4, gross: 47.96, net: 45.56 },
  { date: 'Apr 29', channel: 'direct', units: 2, gross: 23.98, net: 22.78 },
  { date: 'Apr 29', channel: 'ingram', units: 1, gross: 16.99, net: 7.65  },
  { date: 'Apr 30', channel: 'direct', units: 3, gross: 35.97, net: 34.17 },
  { date: 'May 1',  channel: 'direct', units: 5, gross: 59.95, net: 56.95 },
  { date: 'May 1',  channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'May 2',  channel: 'ingram', units: 2, gross: 33.98, net: 15.29 },
  { date: 'May 3',  channel: 'direct', units: 4, gross: 47.96, net: 45.56 },
  { date: 'May 3',  channel: 'other',  units: 1, gross: 9.99,  net: 8.99  },
  { date: 'May 4',  channel: 'direct', units: 3, gross: 35.97, net: 34.17 },
  { date: 'May 4',  channel: 'kdp',    units: 1, gross: 4.99,  net: 3.49  },
  { date: 'May 5',  channel: 'direct', units: 2, gross: 23.98, net: 22.78 },
];

// 30 daily net totals Apr 6 – May 5, channels aggregated per day
export const OVERVIEW_CHART_VALUES: number[] = [
  34.17, 3.49, 30.43, 45.56, 26.27, 15.29, 56.95, 34.17, 21.47, 45.56,
  30.43, 34.17, 3.49, 53.21, 22.78, 60.44, 34.17, 15.29, 45.56, 40.76,
  11.14, 34.17, 45.56, 30.43, 34.17, 60.44, 15.29, 54.55, 37.66, 22.78,
];

export const OVERVIEW_STATS: { label: string; value: string; sub: string; detail: string }[] = [
  { label: 'This month',    value: '$191',    sub: 'NET · MAY 2026',         detail: '45 units' },
  { label: 'Year to date',  value: '$1,412',  sub: 'NET · JAN – MAY 2026',  detail: '147 units' },
  { label: 'All-time net',  value: '$2,466',  sub: 'SINCE JAN 2025',        detail: '221 units total' },
  { label: 'Pending payout', value: '$584',   sub: 'EXPECTED BY JUN 15',    detail: '3 channels' },
];

export const TITLE_EARNINGS: TitleEarnings[] = [
  {
    id: 1,
    title: 'The Salt Roads',
    genre: 'Literary Fiction',
    channels: [
      { channel: 'direct', units: 91, price: 11.99, gross: 1091.09, net: 1036.54 },
      { channel: 'kdp',    units: 15, price: 4.99,  gross: 74.85,   net: 52.40   },
      { channel: 'ingram', units: 34, price: 16.99, gross: 577.66,  net: 259.95  },
      { channel: 'other',  units: 7,  price: 9.99,  gross: 69.93,   net: 62.94   },
    ],
  },
  {
    id: 2,
    title: 'Hollow Meridian',
    genre: 'Speculative Fiction',
    channels: [],
  },
];

export const PAYOUTS: Payout[] = [
  { id: 1,  channel: 'direct', period: 'April 2026',   gross: 447.29, net: 424.93, status: 'pending',    date: 'May 15, 2026'  },
  { id: 2,  channel: 'kdp',    period: 'April 2026',   gross: 14.97,  net: 10.48,  status: 'pending',    date: 'Jun 1, 2026'   },
  { id: 3,  channel: 'ingram', period: 'Q2 2026',      gross: 190.22, net: 85.60,  status: 'pending',    date: 'Jul 31, 2026'  },
  { id: 4,  channel: 'other',  period: 'Mar–May 2026', gross: 69.93,  net: 62.94,  status: 'processing', date: 'Est. May 20'   },
  { id: 5,  channel: 'direct', period: 'March 2026',   gross: 643.80, net: 611.61, status: 'paid',       date: 'Apr 15, 2026'  },
  { id: 6,  channel: 'ingram', period: 'Q1 2026',      gross: 387.44, net: 174.35, status: 'paid',       date: 'Apr 30, 2026'  },
  { id: 7,  channel: 'kdp',    period: 'March 2026',   gross: 34.93,  net: 24.45,  status: 'paid',       date: 'May 1, 2026'   },
  { id: 8,  channel: 'kdp',    period: 'Feb 2026',     gross: 24.95,  net: 17.47,  status: 'paid',       date: 'Apr 1, 2026'   },
  { id: 9,  channel: 'direct', period: 'Feb 2026',     gross: 486.19, net: 461.88, status: 'paid',       date: 'Mar 15, 2026'  },
  { id: 10, channel: 'direct', period: 'Jan 2026',     gross: 359.70, net: 341.72, status: 'paid',       date: 'Feb 15, 2026'  },
];

export const TAX_DATA: TaxYearData[] = [
  {
    year: 2026,
    payoutsReceived: 1631.48,
    channels: [
      { channel: 'direct', gross: 1091.09, fees: 54.55,  net: 1036.54 },
      { channel: 'kdp',    gross: 74.85,   fees: 22.46,  net: 52.40   },
      { channel: 'ingram', gross: 577.66,  fees: 317.71, net: 259.95  },
      { channel: 'other',  gross: 69.93,   fees: 6.99,   net: 62.94   },
    ],
  },
  {
    year: 2025,
    payoutsReceived: 1020.00,
    channels: [
      { channel: 'direct', gross: 892.40, fees: 44.62,  net: 847.78  },
      { channel: 'kdp',    gross: 119.76, fees: 35.93,  net: 83.83   },
      { channel: 'ingram', gross: 271.84, fees: 149.51, net: 122.33  },
      { channel: 'other',  gross: 0,      fees: 0,      net: 0       },
    ],
  },
];
