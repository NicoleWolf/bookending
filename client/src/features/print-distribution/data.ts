import type { Channel, Isbn, FileAsset, ChannelStatus, IsbnStatus, FileStatus } from './types';

export const CHANNELS: Channel[] = [];

export const CHANNEL_DISPLAY: Record<string, Pick<Channel, 'moved' | 'revenue' | 'last' | 'reserves'>> = {};

export const STATS: { l: string; v: string; sub: string; spark: number[] }[] = [];

export const ISBNS: Isbn[] = [];

export const FILES: FileAsset[] = [];

export const PROOF: { title: string; version: string; status: string; specs: [string, string][] } | null = null;

export const STATUS_TONE: Record<ChannelStatus, 'good' | 'neutral' | 'danger' | 'paper'> = {
  live: 'good', pending: 'neutral', draft: 'danger', paused: 'paper',
};

export const ISBN_TONE: Record<IsbnStatus, 'good' | 'accent' | 'neutral'> = {
  assigned: 'good', reserved: 'accent', unassigned: 'neutral',
};

export const FILE_TONE: Record<FileStatus, 'good' | 'neutral' | 'danger' | 'paper'> = {
  approved: 'good', uploaded: 'neutral', 'needs-review': 'danger', draft: 'paper',
};

export const FILE_LABEL: Record<FileStatus, string> = {
  approved: 'Approved', uploaded: 'Uploaded', 'needs-review': 'Needs review', draft: 'Draft',
};
