import type { Channel, Isbn, FileAsset, ChannelStatus, IsbnStatus, FileStatus } from './types';

// Static seed data — used to populate DB on first login and as display overlay for mock fields
export const CHANNELS: Channel[] = [
  { id: 'static-1', name: 'Amazon KDP',        kind: 'Print + eBook',    status: 'live',    sku: 'B0CTQ4Z9R8',        royalty: '60%', moved: 412, revenue: '$4,890', last: '2h ago',  formats: ['Print','eBook'], listPrice: 14.99 },
  { id: 'static-2', name: 'IngramSpark',       kind: 'Print · global',   status: 'live',    sku: '978-1-7398-2841-1', royalty: '45%', moved: 184, revenue: '$2,106', last: '1d ago',  formats: ['Print'],         listPrice: 16.99, reserves: '$214 held · releases Jun 2026' },
  { id: 'static-3', name: 'Apple Books',       kind: 'eBook',            status: 'live',    sku: '1452119284',        royalty: '70%', moved:  88, revenue: '$  792', last: '3d ago',  formats: ['eBook'],         listPrice: 9.99 },
  { id: 'static-4', name: 'Kobo Writing Life', kind: 'eBook',            status: 'live',    sku: '9781739284121',     royalty: '70%', moved:  51, revenue: '$  459', last: '3d ago',  formats: ['eBook'],         listPrice: 9.99 },
  { id: 'static-5', name: 'Bookshop.org',      kind: 'Print · indie',    status: 'pending', sku: 'awaiting ISBN map', royalty: '30%', moved:   0, revenue: '—',      last: '—',       formats: ['Print'] },
  { id: 'static-6', name: 'Libro.fm',          kind: 'Audio',            status: 'draft',   sku: 'narrator unbooked', royalty: '—',   moved:   0, revenue: '—',      last: '—',       formats: ['Audio'] },
];

// Display-only fields (sales data, sync timestamps) indexed by channel name.
// These come from real integrations in production; for now they stay as mock.
export const CHANNEL_DISPLAY: Record<string, Pick<Channel, 'moved' | 'revenue' | 'last' | 'reserves'>> = {
  'Amazon KDP':        { moved: 412, revenue: '$4,890', last: '2h ago' },
  'IngramSpark':       { moved: 184, revenue: '$2,106', last: '1d ago',  reserves: '$214 held · releases Jun 2026' },
  'Apple Books':       { moved:  88, revenue: '$  792', last: '3d ago' },
  'Kobo Writing Life': { moved:  51, revenue: '$  459', last: '3d ago' },
  'Bookshop.org':      { moved:   0, revenue: '—',      last: '—' },
  'Libro.fm':          { moved:   0, revenue: '—',      last: '—' },
};

export const STATS = [
  { l: 'Copies in motion',    v: '735',      sub: '+62 this week',               spark: [12,18,15,22,28,24,32,38,42,35,40,52,62] },
  { l: 'Net royalties · 30d', v: '$8,412',   sub: '$1,184 pending settlement',   spark: [6,8,7,12,9,14,18,15,22,19,24,28,32] },
  { l: 'Active channels',     v: '4 of 6',   sub: '2 in setup',                  spark: [1,1,2,2,2,3,3,3,4,4,4,4,4] },
  { l: 'Avg. time to shelf',  v: '4.2 days', sub: 'KDP 2.1d · Ingram 6.8d',     spark: [7,6,5,5,4,5,4,4,3,4,4,3,4] },
];

export const ISBNS: Isbn[] = [
  { id: 1, isbn: '978-1-7398-2841-1', title: 'The Salt Roads',   format: 'Print',  status: 'assigned',   channel: 'IngramSpark · KDP',  registered: '14 Jan 2026' },
  { id: 2, isbn: '978-1-7398-2841-2', title: 'The Salt Roads',   format: 'eBook',  status: 'assigned',   channel: 'KDP · Apple · Kobo', registered: '14 Jan 2026' },
  { id: 3, isbn: '978-1-7398-2841-3', title: 'Hollow Meridian',  format: 'Print',  status: 'reserved',   channel: 'Unassigned',         registered: '2 Mar 2026' },
  { id: 4, isbn: '978-1-7398-2841-4', title: 'Hollow Meridian',  format: 'eBook',  status: 'reserved',   channel: 'Unassigned',         registered: '2 Mar 2026' },
  { id: 5, isbn: '978-1-7398-2841-5', title: 'Hollow Meridian',  format: 'Audio',  status: 'unassigned', channel: '—',                  registered: '—' },
];

export const FILES: FileAsset[] = [
  { id: 1, name: 'salt-roads-interior-v3.pdf', title: 'The Salt Roads',  kind: 'Interior PDF', version: 'v3 · final',  pages: 322, size: '4.2 MB', status: 'approved',     updated: '8 Jan 2026',  channels: ['IngramSpark', 'KDP'],            approvedBy: 'Billie Wolf', approvedAt: '8 Jan 2026' },
  { id: 2, name: 'salt-roads-cover-rgb.pdf',   title: 'The Salt Roads',  kind: 'Cover PDF',    version: 'approved',    size: '12.8 MB', status: 'approved',  updated: '8 Jan 2026',  channels: ['IngramSpark', 'KDP'],            approvedBy: 'Billie Wolf', approvedAt: '8 Jan 2026' },
  { id: 3, name: 'salt-roads-v2.epub',         title: 'The Salt Roads',  kind: 'EPUB',         version: 'v2',          size: '1.1 MB', status: 'approved',   updated: '15 Jan 2026', channels: ['KDP', 'Apple Books', 'Kobo'],    approvedBy: 'Billie Wolf', approvedAt: '15 Jan 2026', note: 'Validated · EPUB 3.0' },
  { id: 4, name: 'hollow-meridian-draft.pdf',  title: 'Hollow Meridian', kind: 'Interior PDF', version: 'v1 · draft',  pages: 267, size: '3.7 MB', status: 'needs-review', updated: '28 Apr 2026', channels: ['IngramSpark'],                   note: 'Margins outside spec — IngramSpark requires 0.5″ inner margin (current: 0.375″)' },
  { id: 5, name: 'hollow-meridian-cover.pdf',  title: 'Hollow Meridian', kind: 'Cover PDF',    version: 'draft',       size: '9.1 MB', status: 'draft',      updated: '1 May 2026',  channels: [] },
];

export const PROOF = {
  title: 'The Salt Roads',
  version: 'Proof #2',
  status: 'Review due',
  specs: [['Trim','6 × 9 in'],['Paper','55# cream'],['Cover','Matte laminate'],['Spine','0.81 in'],['Extent','322 pp'],['Bleed','0.125 in']] as [string, string][],
};

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
