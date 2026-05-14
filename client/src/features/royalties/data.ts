import type { Channel, DailyRollup, TitleEarnings, Payout, TaxYearData } from './types';

export const CHANNEL_INFO: Record<Channel, { label: string; cut: number; schedule: string }> = {
  direct: { label: 'Bookending Direct', cut: 5,  schedule: 'Monthly · 15th'             },
  kdp:    { label: 'Amazon KDP',        cut: 30, schedule: '~60 days after month close'  },
  ingram: { label: 'IngramSpark',       cut: 55, schedule: 'Quarterly · Apr/Jul/Oct/Jan' },
  other:  { label: 'Other / Bundles',  cut: 10, schedule: 'As received'                 },
};

export const DAILY_ROLLUPS: DailyRollup[] = [];

export const OVERVIEW_CHART_VALUES: number[] = [];

export const OVERVIEW_STATS: { label: string; value: string; sub: string; detail: string }[] = [];

export const TITLE_EARNINGS: TitleEarnings[] = [];

export const PAYOUTS: Payout[] = [];

export const TAX_DATA: TaxYearData[] = [];
