export interface GenreNode {
  label: string;
  subgenres: string[];
}

export const GENRES: GenreNode[] = [
  {
    label: 'Literary Fiction',
    subgenres: ['Contemporary', 'Historical', 'Southern Gothic', 'Magical Realism'],
  },
  {
    label: 'Mystery & Thriller',
    subgenres: ['Psychological Thriller', 'Cozy Mystery', 'Historical Crime'],
  },
  {
    label: 'Speculative Fiction',
    subgenres: ['Science Fiction', 'Fantasy', 'Horror', 'Climate Fiction'],
  },
  {
    label: 'Creative Nonfiction',
    subgenres: ['Memoir', 'Personal Essays', 'Narrative Journalism'],
  },
  {
    label: 'Poetry & Hybrid',
    subgenres: ['Lyric Essay', 'Poetry Collection', 'Hybrid / Experimental'],
  },
];
