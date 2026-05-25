export interface CheckIn {
  readerId:       string;
  readerName:     string;
  readerInitials: string;
  finishedAt:     string;
  sentAt:         string | null;
  message:        string | null;
  reply:          string | null;
  repliedAt:      string | null;
}

export function defaultTemplate(readerFirstName: string, title: string): string {
  return `Hi ${readerFirstName},\n\nIt's been just over a week since you finished ${title}. I've been thinking a lot about the readers who made it all the way through.\n\nI'd love to hear what stayed with you — even just one moment that surprised you, or something that didn't quite land. And I wanted to share what I'm working on next.\n\nNo pressure at all — but it would mean a lot.`;
}

const now = Date.now();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();

export const DEMO_CHECKINS: CheckIn[] = [
  {
    readerId:       'r1',
    readerName:     'Margot Ellis',
    readerInitials: 'ME',
    finishedAt:     days(9),
    sentAt:         null,
    message:        null,
    reply:          null,
    repliedAt:      null,
  },
  {
    readerId:       'r2',
    readerName:     'James Okafor',
    readerInitials: 'JO',
    finishedAt:     days(14),
    sentAt:         days(3),
    message:        "Hi James,\n\nIt's been just over a week since you finished The Last Cartographer. I've been thinking a lot about the readers who made it all the way through.\n\nI'd love to hear what stayed with you. What surprised you, or what didn't quite land? And I wanted to share that I'm deep in the next book now — same world, new map.\n\nNo pressure at all.",
    reply:          null,
    repliedAt:      null,
  },
  {
    readerId:       'r3',
    readerName:     'Sam Priya',
    readerInitials: 'SP',
    finishedAt:     days(21),
    sentAt:         days(7),
    message:        "Hi Sam,\n\nA week on from The Last Cartographer — I hope the ending stayed with you the way it stayed with me. I'd love to hear your honest thoughts.\n\nI'm also starting something new. Would love to have you as a reader again when the time comes.",
    reply:          "The ending genuinely surprised me — I didn't see the map twist coming at all. The pacing in the middle dragged a little but the payoff was worth it. Would absolutely read the next one.",
    repliedAt:      days(2),
  },
];
