export interface GenreNode {
  label: string;
  subgenres: string[];
}

export const GENRES: GenreNode[] = [
  {
    label: 'Literary Fiction',
    subgenres: [
      'Contemporary', 'Historical', 'Southern Gothic', 'Magical Realism',
      'Domestic Fiction', 'Satire', 'Bildungsroman', 'Experimental',
    ],
  },
  {
    label: 'Fantasy',
    subgenres: [
      'Epic Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'Romantic Fantasy',
      'Portal Fantasy', 'Fairy Tale Retelling', 'Grimdark', 'Sword & Sorcery',
      'Cozy Fantasy', 'Mythic Fantasy', 'Secondary World',
    ],
  },
  {
    label: 'Science Fiction',
    subgenres: [
      'Space Opera', 'Hard Science Fiction', 'Cyberpunk', 'Dystopian',
      'Climate Fiction', 'Near-Future', 'Military Sci-Fi', 'Biopunk',
      'Generation Ship', 'First Contact',
    ],
  },
  {
    label: 'Mystery & Thriller',
    subgenres: [
      'Psychological Thriller', 'Cozy Mystery', 'Historical Crime',
      'Legal Thriller', 'Crime Fiction', 'Noir', 'Heist', 'Spy Thriller',
      'Medical Thriller', 'Amateur Sleuth',
    ],
  },
  {
    label: 'Horror',
    subgenres: [
      'Folk Horror', 'Gothic Horror', 'Psychological Horror',
      'Supernatural Horror', 'Body Horror', 'Cosmic Horror', 'Cozy Horror',
      'Haunted House', 'Slasher',
    ],
  },
  {
    label: 'Romance',
    subgenres: [
      'Contemporary Romance', 'Historical Romance', 'Paranormal Romance',
      'Romantic Suspense', 'Romantic Comedy', 'Romantic Fantasy',
      'Sports Romance', 'Small Town Romance', 'Enemies to Lovers',
    ],
  },
  {
    label: 'Historical Fiction',
    subgenres: [
      'Ancient World', 'Medieval', 'Tudor & Stuart', 'Victorian',
      'World War I', 'World War II', 'Colonial', 'Regency', 'Viking Age',
    ],
  },
  {
    label: 'Young Adult',
    subgenres: [
      'Contemporary YA', 'Fantasy YA', 'Sci-Fi YA', 'Horror YA',
      'Romance YA', 'Historical YA', 'Thriller YA',
    ],
  },
  {
    label: 'Speculative Fiction',
    subgenres: [
      'Solarpunk', 'Slipstream', 'New Weird', 'Weird West',
      'Hopepunk', 'Steampunk', 'Gaslamp Fantasy', 'Hybrid / Uncategorisable',
    ],
  },
  {
    label: 'Creative Nonfiction',
    subgenres: [
      'Memoir', 'Personal Essays', 'Narrative Journalism',
      'Literary Biography', 'Travel Writing', 'Food Writing',
      'Nature Writing', 'Cultural Criticism',
    ],
  },
  {
    label: 'Self-Help & Narrative Nonfiction',
    subgenres: [
      'Personal Development', 'Mental Health', 'Business & Leadership',
      'Spirituality', 'Parenting', 'Relationships', 'Health & Wellness',
    ],
  },
  {
    label: 'Poetry & Hybrid',
    subgenres: [
      'Lyric Essay', 'Poetry Collection', 'Hybrid / Experimental',
      'Verse Novel', 'Prose Poetry', 'Epistolary',
    ],
  },
  {
    label: 'Graphic Novel & Comics',
    subgenres: [
      'Graphic Memoir', 'Superhero', 'Manga', 'Slice of Life',
      'Fantasy Comics', 'Horror Comics',
    ],
  },
  {
    label: "Children's",
    subgenres: [
      'Picture Book', 'Early Reader', 'Middle Grade', 'Middle Grade Fantasy',
      'Middle Grade Adventure',
    ],
  },
];
