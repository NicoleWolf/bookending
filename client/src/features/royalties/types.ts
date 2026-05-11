export type Channel = 'direct' | 'kdp' | 'ingram' | 'other';
export type PayoutStatus = 'paid' | 'pending' | 'processing';

export interface DailyRollup {
  date: string;
  channel: Channel;
  units: number;
  gross: number;
  net: number;
}

export interface TitleChannelBreakdown {
  channel: Channel;
  units: number;
  price: number;
  gross: number;
  net: number;
}

export interface TitleEarnings {
  id: number;
  title: string;
  genre: string;
  channels: TitleChannelBreakdown[];
}

export interface Payout {
  id: number;
  channel: Channel;
  period: string;
  gross: number;
  net: number;
  status: PayoutStatus;
  date: string;
}

export interface TaxChannelRow {
  channel: Channel;
  gross: number;
  fees: number;
  net: number;
}

export interface TaxYearData {
  year: number;
  payoutsReceived: number;
  channels: TaxChannelRow[];
}
