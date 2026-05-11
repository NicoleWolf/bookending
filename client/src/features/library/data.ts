export type BookStatus = 'drafting' | 'in-revision' | 'published';
export type BookVisibility = 'private' | 'public';
export type SpineColor = 'spine-amber' | 'spine-slate' | 'spine-teal' | 'spine-dark' | 'spine-muted';

export interface BookMetadata {
  id: string;
  title: string;
  subtitle: string;
  seriesName: string;
  seriesNumber: number | null;
  genre: string;
  subgenre: string;
  description: string;
  targetAudience: string;
  contentRating: string;
  keywords: string;
  isbnEbook: string;
  isbnPrint: string;
  isbnPending: boolean;        // ISBN applied for but not yet received
  priceEbook: string;
  pricePaperback: string;
  language: string;
  estimatedPages: number | null;
  status: BookStatus;
  visibility: BookVisibility;
  coverUploaded: boolean;
  spineColor: SpineColor;
}

export const CONTENT_RATINGS = [
  'All Ages',
  'Teen (13+)',
  'Adult (18+)',
  'Mature',
] as const;

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
  'Dutch', 'Russian', 'Japanese', 'Korean', 'Chinese (Simplified)',
  'Chinese (Traditional)', 'Arabic', 'Hindi', 'Swedish', 'Norwegian',
  'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Romanian',
  'Turkish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese', 'Catalan',
  'Ukrainian', 'Indonesian', 'Malay',
] as const;

export const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
  { value: 'drafting',    label: 'Drafting'    },
  { value: 'in-revision', label: 'In Revision' },
  { value: 'published',   label: 'Published'   },
];

export const BOOKS: BookMetadata[] = [
  {
    id: '1',
    title: 'The Salt Roads',
    subtitle: '',
    seriesName: '',
    seriesNumber: null,
    genre: 'Literary Fiction',
    subgenre: 'Contemporary',
    description:
      'A sweeping story of migration, memory, and salt — set across three generations of a family navigating the tides of the American Southwest. Told in alternating voices, this novel asks who gets to claim the land they love, and what it costs to stay.',
    targetAudience: 'Adult readers of literary fiction, fans of Louise Erdrich and Hernan Diaz',
    contentRating: 'Adult',
    keywords: 'literary fiction, family saga, American Southwest, migration, identity, generational trauma',
    isbnEbook: '978-0-000000-00-0',
    isbnPrint: '978-0-000000-01-7',
    isbnPending: false,
    priceEbook: '9.99',
    pricePaperback: '17.99',
    language: 'English',
    estimatedPages: 340,
    status: 'in-revision',
    visibility: 'private',
    coverUploaded: false,
    spineColor: 'spine-amber',
  },
  {
    id: '2',
    title: 'Hollow Meridian',
    subtitle: 'A novel of deep time',
    seriesName: '',
    seriesNumber: null,
    genre: 'Speculative Fiction',
    subgenre: '',
    description: '',
    targetAudience: '',
    contentRating: '',
    keywords: '',
    isbnEbook: '',
    isbnPrint: '',
    isbnPending: false,
    priceEbook: '',
    pricePaperback: '',
    language: 'English',
    estimatedPages: null,
    status: 'drafting',
    visibility: 'private',
    coverUploaded: false,
    spineColor: 'spine-slate',
  },
  {
    id: '3',
    title: "The Lantern Keeper's Daughter",
    subtitle: 'A novel',
    seriesName: '',
    seriesNumber: null,
    genre: 'Literary Fiction',
    subgenre: 'Historical',
    description:
      "Set in the coastal villages of nineteenth-century Wales, this novel follows a lighthouse keeper's daughter who discovers a cache of letters that rewrite the story of her family — and the shipwreck her father has never spoken of.",
    targetAudience: 'Readers of Sarah Waters, Kate Atkinson, and Hilary Mantel',
    contentRating: 'Adult',
    keywords: 'historical fiction, Wales, lighthouse, family secrets, Victorian era, women\'s stories',
    isbnEbook: '',
    isbnPrint: '',
    isbnPending: false,
    priceEbook: '',
    pricePaperback: '',
    language: 'English',
    estimatedPages: 290,
    status: 'in-revision',
    visibility: 'private',
    coverUploaded: false,
    spineColor: 'spine-teal',
  },
];
