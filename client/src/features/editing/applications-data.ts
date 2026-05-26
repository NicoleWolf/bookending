export interface BetaApplication {
  id:             string;
  readerId:       string;
  readerName:     string;
  readerInitials: string;
  readerGenres:   string[];
  bio:            string;
  appliedAt:      string;
  status:         'pending' | 'accepted' | 'declined';
  authorNote:     string | null;
}

const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export const DEMO_APPLICATIONS: BetaApplication[] = [
  {
    id:             'app1',
    readerId:       'r1',
    readerName:     'Margot Ellis',
    readerInitials: 'ME',
    readerGenres:   ['Fantasy', 'Historical Fiction', 'Literary Fiction'],
    bio:            "I've been reading fantasy and historical fiction for fifteen years. I give detailed, honest feedback and always finish what I start — even when I have notes about the middle.",
    appliedAt:      days(2),
    status:         'pending',
    authorNote:     null,
  },
  {
    id:             'app2',
    readerId:       'r2',
    readerName:     'James Okafor',
    readerInitials: 'JO',
    readerGenres:   ['Fantasy', 'Speculative Fiction'],
    bio:            "Secondary-world fantasy is my thing. I focus on worldbuilding consistency and plot pacing. I've read three other manuscripts on this platform.",
    appliedAt:      days(5),
    status:         'pending',
    authorNote:     null,
  },
  {
    id:             'app3',
    readerId:       'r4',
    readerName:     'Priya Chandra',
    readerInitials: 'PC',
    readerGenres:   ['Mystery & Thriller', 'Fantasy', 'Literary Fiction'],
    bio:            "I read broadly and have a particular eye for character voice and dialogue. I always give structured notes.",
    appliedAt:      days(7),
    status:         'accepted',
    authorNote:     "Loved your reading history — exactly the multi-genre perspective I was looking for.",
  },
];
