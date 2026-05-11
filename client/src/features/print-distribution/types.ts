export type ChannelStatus = 'live' | 'pending' | 'draft' | 'paused';
export type IsbnStatus    = 'assigned' | 'reserved' | 'unassigned';
export type FileStatus    = 'approved' | 'uploaded' | 'needs-review' | 'draft';

export interface Channel {
  id: string; name: string; kind: string; status: ChannelStatus;
  sku: string; royalty: string; moved: number; revenue: string;
  last: string; formats: string[];
  listPrice?: number; reserves?: string;
}

export interface Isbn {
  id: number; isbn: string; title: string; format: 'Print' | 'eBook' | 'Audio';
  status: IsbnStatus; channel: string; registered: string;
}

export interface FileAsset {
  id: number; name: string; title: string; kind: 'Interior PDF' | 'Cover PDF' | 'EPUB' | 'Audio';
  version: string; pages?: number; size: string; status: FileStatus; updated: string; note?: string;
  channels: string[]; approvedBy?: string; approvedAt?: string;
}
