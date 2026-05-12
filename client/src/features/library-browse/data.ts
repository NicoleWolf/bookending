export type { GenreNode } from '../../shared/genres';
export { GENRES } from '../../shared/genres';

export type ManuscriptStatus = 'open' | 'closed' | 'waitlist';
export type SlotState       = 'open' | 'filling' | 'full' | 'ongoing';
export type BetaMode        = 'PUBLIC' | 'REQUEST';

export interface PersonalizationSignal {
  kind: 'circle' | 'profile_match';
  text: string;
}

export interface ContentNotes {
  count: number;
  items: string[];
}

export interface CatalogManuscript {
  id:              number | string;
  title:           string;
  author:          string;
  genre:           string;
  subgenre:        string;
  description:     string;
  hook?:           string;
  keywords:        string[];
  status:          ManuscriptStatus;
  wordCount:       number;
  estimatedPages:  number;
  contentRating:   string;
  scheme:          number;
  featured?:       boolean;
  curatorNote?:    string;
  readerCount:     number;
  maxBetaReaders:  number | null;
  listedAt:        string; // ISO date
  themes:          string[];
  ownManuscript?:  boolean;
  coverUrl?:       string;
  betaMode:        BetaMode;
  slotState?:      SlotState;
  slotCounts?:     { filled: number; total: number };
  personalizationSignal?: PersonalizationSignal;
  contentNotes?:   ContentNotes;
  contentWarnings?: string[];
  pendingRequest?: boolean;
}

export function deriveSlotState(ms: CatalogManuscript): SlotState {
  if (ms.slotState) return ms.slotState;
  if (ms.status === 'closed' || ms.status === 'waitlist') return 'full';
  if (ms.maxBetaReaders === null) return 'ongoing';
  const remaining = ms.maxBetaReaders - ms.readerCount;
  if (remaining <= 0) return 'full';
  if (remaining <= 1) return 'filling';
  return 'open';
}

export function slotStatusText(state: SlotState, ms: CatalogManuscript): string {
  if (state === 'ongoing') return 'Open · no reader cap';
  if (state === 'full')    return 'Full · applications closed';
  const cap = ms.slotCounts?.total ?? ms.maxBetaReaders ?? 0;
  const filled = ms.slotCounts?.filled ?? ms.readerCount;
  const remaining = cap - filled;
  if (state === 'filling') return remaining === 1 ? 'Filling · 1 slot left' : `Filling · ${remaining} slots left`;
  return `Open · ${filled} of ${cap} slots`;
}


export const MANUSCRIPTS: CatalogManuscript[] = [
  {
    id: 1,
    title: 'A Thousand Unlit Windows',
    author: 'M. Abara',
    genre: 'Literary Fiction',
    subgenre: 'Contemporary',
    hook: 'An immigrant family told in three voices across fifteen years — a novel about the inheritance of silence.',
    description: 'An immigrant family in 1990s Chicago navigates the widening distance between what they left behind and what they hoped to find. Told in three voices across fifteen years, it is a novel about the inheritance of silence — and the cost of finally speaking.',
    keywords: ['immigration', 'family', 'Chicago', 'Nigeria', 'diaspora'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 87000,
    estimatedPages: 340,
    contentRating: 'Adult',
    scheme: 2,
    featured: true,
    curatorNote: 'This manuscript stopped us on page four — the kind of opening that reminds you why we do this. Abara writes silence better than most writers write words.',
    readerCount: 3,
    maxBetaReaders: 5,
    listedAt: '2026-04-28',
    themes: ['family', 'immigration', 'memory', 'identity', 'silence', 'diaspora'],
    contentNotes: { count: 1, items: ['Grief and loss'] },
    contentWarnings: ['Mental Health/Self-Harm'],
  },
  {
    id: 2,
    title: 'The Weight of Salt',
    author: 'D. Osei',
    genre: 'Literary Fiction',
    subgenre: 'Historical',
    hook: 'A colonial clerk reads his grandfather\'s hidden letters and begins to understand what was lost before independence.',
    description: 'Gold Coast, 1947. A colonial clerk discovers his grandfather\'s letters hidden in a crumbling government archive and begins the slow project of understanding what was lost before independence. Part family saga, part colonial reckoning.',
    keywords: ['Ghana', 'colonial history', 'archive', 'letters', 'independence'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 94000,
    estimatedPages: 368,
    contentRating: 'Adult',
    scheme: 0,
    readerCount: 2,
    maxBetaReaders: 4,
    listedAt: '2026-04-22',
    themes: ['colonialism', 'history', 'family', 'archive', 'Ghana', 'identity'],
  },
  {
    id: 3,
    title: 'Foxglove',
    author: 'R. Beaumont',
    genre: 'Literary Fiction',
    subgenre: 'Southern Gothic',
    hook: 'Three sisters return to their mother\'s Louisiana estate and find the house has kept better records of the family\'s debts than any of them.',
    description: 'Three sisters return to their late mother\'s Louisiana estate to settle her affairs — and find that the house has kept better records of the family\'s debts than any of them remembered. A novel about land, blood, and the particular grief of difficult women.',
    keywords: ['Louisiana', 'sisters', 'inheritance', 'grief', 'gothic', 'family secrets'],
    status: 'waitlist',
    betaMode: 'PUBLIC',
    wordCount: 72000,
    estimatedPages: 284,
    contentRating: 'Adult',
    scheme: 3,
    readerCount: 5,
    maxBetaReaders: 5,
    listedAt: '2026-03-15',
    themes: ['family', 'Southern Gothic', 'grief', 'inheritance', 'women', 'Louisiana'],
  },
  {
    id: 4,
    title: 'After the Long Dark',
    author: 'A. Venn',
    genre: 'Speculative Fiction',
    subgenre: 'Science Fiction',
    hook: 'The last generation ship reaches its destination after 200 years — but the planet is not what the mission files promised.',
    description: 'The last generation ship reaches its destination after 200 years — but the planet is not what the mission files promised. The six remaining crew members must decide whether to wake the 4,000 colonists in cryo, or turn back into the dark.',
    keywords: ['generation ship', 'space', 'survival', 'colonization', 'crew', 'hard choices'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 108000,
    estimatedPages: 424,
    contentRating: 'Teen & Up',
    scheme: 1,
    readerCount: 4,
    maxBetaReaders: 6,
    listedAt: '2026-04-30',
    themes: ['space', 'survival', 'generation ship', 'colonization', 'decision', 'solitude'],
  },
  {
    id: 5,
    title: 'The Meridian Gate',
    author: 'C. Nakahara',
    genre: 'Speculative Fiction',
    subgenre: 'Fantasy',
    hook: 'In a world where maps create the territory they describe, a disgraced cartographer discovers someone has been quietly erasing coastal towns.',
    description: 'In a world where maps create the territory they describe, a disgraced cartographer discovers that someone has been quietly redrawing the coastal provinces — erasing towns before anyone notices they are gone.',
    keywords: ['cartography', 'maps', 'secondary world', 'magic', 'conspiracy', 'erasure'],
    status: 'open',
    betaMode: 'REQUEST',
    wordCount: 127000,
    estimatedPages: 498,
    contentRating: 'Teen & Up',
    scheme: 2,
    readerCount: 1,
    maxBetaReaders: 5,
    listedAt: '2026-05-01',
    themes: ['maps', 'magic', 'conspiracy', 'cartography', 'secondary world', 'power'],
  },
  {
    id: 6,
    title: 'Static',
    author: 'I. Flores',
    genre: 'Mystery & Thriller',
    subgenre: 'Psychological Thriller',
    hook: 'A radio producer begins receiving voicemails from her missing sister — dated three years in the past.',
    description: 'A radio producer begins receiving voicemails from her missing sister — dated three years in the past. The investigation into what they mean will unsettle everything she thought she understood about the night her sister disappeared.',
    keywords: ['missing person', 'unreliable narrator', 'radio', 'voicemail', 'sisters', 'memory'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 81000,
    estimatedPages: 318,
    contentRating: 'Adult',
    scheme: 4,
    readerCount: 3,
    maxBetaReaders: 4,
    listedAt: '2026-04-18',
    themes: ['missing person', 'memory', 'sisters', 'mystery', 'psychological', 'grief'],
    contentNotes: { count: 2, items: ['Missing person', 'Grief and loss'] },
  },
  {
    id: 7,
    title: 'The Alderman\'s Wife',
    author: 'P. Brennan',
    genre: 'Mystery & Thriller',
    subgenre: 'Historical Crime',
    hook: 'London, 1889: when a prominent alderman is found dead in the Thames, his wife begins her own quiet investigation.',
    description: 'London, 1889. When a prominent alderman is found dead in the Thames, his wife — whom everyone assumed knew nothing — begins her own quiet investigation. A novel about what Victorian women were permitted to notice.',
    keywords: ['Victorian', 'London', 'historical mystery', 'women', '1889', 'Thames'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 96000,
    estimatedPages: 378,
    contentRating: 'Adult',
    scheme: 3,
    readerCount: 2,
    maxBetaReaders: 5,
    listedAt: '2026-04-10',
    themes: ['Victorian', 'London', 'women', 'historical mystery', 'social commentary', 'class'],
  },
  {
    id: 8,
    title: 'Cartography of a Quiet Life',
    author: 'S. Chen',
    genre: 'Creative Nonfiction',
    subgenre: 'Memoir',
    hook: 'After a cancer diagnosis at 34, a landscape architect maps the places that shaped her — a memoir in the shape of a site plan.',
    description: 'After a cancer diagnosis at 34, a landscape architect begins mapping the places that shaped her — a childhood garden in Taipei, a hospital atrium in Seattle, a colleague\'s backyard where she finally learned to be still. A memoir in the shape of a site plan.',
    keywords: ['memoir', 'cancer', 'landscape', 'place', 'Taiwan', 'illness', 'recovery'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 68000,
    estimatedPages: 268,
    contentRating: 'Adult',
    scheme: 0,
    readerCount: 2,
    maxBetaReaders: 3,
    listedAt: '2026-05-02',
    themes: ['memoir', 'illness', 'landscape', 'place', 'survival', 'identity', 'stillness'],
    contentNotes: { count: 1, items: ['Illness / medical'] },
  },
  {
    id: 9,
    title: 'All the Songs I Forgot to Write',
    author: 'T. Mbeki',
    genre: 'Creative Nonfiction',
    subgenre: 'Personal Essays',
    hook: 'Twelve essays on music, fatherhood, grief, and what survives the crossing between Cape Town, New York, and Lagos.',
    description: 'Twelve essays on music, fatherhood, grief, and cultural inheritance. Moving between Cape Town, New York, and Lagos, they trace what gets passed down, what gets lost in translation, and what survives the crossing.',
    keywords: ['essays', 'music', 'fatherhood', 'grief', 'Black identity', 'Cape Town', 'diaspora'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 62000,
    estimatedPages: 246,
    contentRating: 'Adult',
    scheme: 1,
    readerCount: 1,
    maxBetaReaders: 4,
    listedAt: '2026-04-25',
    themes: ['essays', 'music', 'fatherhood', 'grief', 'diaspora', 'identity', 'inheritance'],
  },
  {
    id: 10,
    title: 'Perihelion',
    author: 'Z. Hartmann',
    genre: 'Speculative Fiction',
    subgenre: 'Climate Fiction',
    hook: 'By 2047, a mountain rescue guide leads one of the last climate tourist expeditions up a slope that will be closed forever the following season.',
    description: 'By 2047, a mountain rescue guide leads one of the last climate tourist expeditions up a slope that will be closed forever the following season. The route is familiar. Not everyone comes back.',
    keywords: ['climate change', 'Alps', 'Switzerland', 'near-future', 'survival', 'tourism'],
    status: 'closed',
    betaMode: 'PUBLIC',
    wordCount: 83000,
    estimatedPages: 326,
    contentRating: 'Teen & Up',
    scheme: 2,
    readerCount: 5,
    maxBetaReaders: 5,
    listedAt: '2026-03-01',
    themes: ['climate', 'survival', 'mountains', 'near future', 'loss', 'Alps'],
  },
  {
    id: 11,
    title: 'The Inheritance of Water',
    author: 'L. Dos Santos',
    genre: 'Literary Fiction',
    subgenre: 'Magical Realism',
    hook: 'Three generations of a Brazilian family have dreamed the floods before they come — until the youngest refuses to warn her village.',
    description: 'Three generations of a Brazilian family have lived on the same flood plain — and for three generations, the women have dreamed the floods before they come. When the youngest refuses to warn her village, she sets in motion a catastrophe she has already seen.',
    keywords: ['Brazil', 'magical realism', 'women', 'floods', 'family', 'prophecy', 'inheritance'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 91000,
    estimatedPages: 358,
    contentRating: 'Adult',
    scheme: 0,
    readerCount: 2,
    maxBetaReaders: 4,
    listedAt: '2026-04-15',
    themes: ['magical realism', 'family', 'women', 'water', 'Brazil', 'prophecy', 'climate'],
  },
  {
    id: 12,
    title: 'Night School',
    author: 'B. Patel',
    genre: 'Mystery & Thriller',
    subgenre: 'Cozy Mystery',
    hook: 'A retired librarian inherits a failing evening school in Bristol and discovers one of her adult learners has been poisoned using a method from her own shelves.',
    description: 'A retired librarian inherits a failing evening school in Bristol and discovers that one of the adult learners has been poisoned — using a method described in a book from her own shelves. She is the only one who would know where to look.',
    keywords: ['librarian', 'Bristol', 'cozy mystery', 'poison', 'adult education', 'books'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 74000,
    estimatedPages: 290,
    contentRating: 'All Ages',
    scheme: 4,
    readerCount: 3,
    maxBetaReaders: 5,
    listedAt: '2026-05-03',
    themes: ['mystery', 'librarian', 'cozy', 'community', 'books', 'Bristol', 'humor'],
  },
  {
    id: 13,
    title: 'Tender Coordinates',
    author: 'R. Ito',
    genre: 'Poetry & Hybrid',
    subgenre: 'Lyric Essay',
    hook: 'A lyric essay tracing a Japanese-American grandmother\'s internment through family photographs, census records, and failed translation.',
    description: 'A lyric essay in three movements tracing a Japanese-American grandmother\'s internment through family photographs, census records, and the author\'s own failed attempts at translation. Grief as archival practice.',
    keywords: ['Japanese-American', 'internment', 'lyric essay', 'family', 'translation', 'grief', 'archive'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 38000,
    estimatedPages: 152,
    contentRating: 'Adult',
    scheme: 3,
    readerCount: 1,
    maxBetaReaders: 3,
    listedAt: '2026-04-29',
    themes: ['grief', 'family', 'history', 'Japanese-American', 'archive', 'essay', 'translation'],
  },
  {
    id: 14,
    title: 'The Last Clean Shore',
    author: 'H. Andersson',
    genre: 'Creative Nonfiction',
    subgenre: 'Narrative Journalism',
    hook: 'A Norwegian journalist embeds with four fishing communities as they adapt — or refuse to — to a changing sea.',
    description: 'A Norwegian journalist embeds with four fishing communities as they adapt — or refuse to — to a changing sea. Part reportage, part elegy for an industry and a way of life that has lasted eight hundred years.',
    keywords: ['fishing', 'Norway', 'climate', 'reportage', 'community', 'sea', 'tradition'],
    status: 'waitlist',
    betaMode: 'PUBLIC',
    wordCount: 79000,
    estimatedPages: 312,
    contentRating: 'Adult',
    scheme: 1,
    readerCount: 4,
    maxBetaReaders: 4,
    listedAt: '2026-03-20',
    themes: ['journalism', 'Norway', 'fishing', 'climate', 'community', 'elegy', 'tradition'],
  },
  {
    id: 15,
    title: 'Bright Lines',
    author: 'K. Williams',
    genre: 'Literary Fiction',
    subgenre: 'Contemporary',
    hook: 'The summer before college, a Black teenager from rural Georgia maps agricultural land and traces ownership histories she is only beginning to understand.',
    description: 'The summer before college, a Black teenager from rural Georgia takes a survey job mapping local agricultural land — and spends four months tracing ownership histories she is only beginning, for the first time, to understand.',
    keywords: ['coming-of-age', 'Georgia', 'rural', 'mapping', 'race', 'land', 'summer', 'debut'],
    status: 'open',
    betaMode: 'PUBLIC',
    wordCount: 65000,
    estimatedPages: 256,
    contentRating: 'Teen & Up',
    scheme: 4,
    readerCount: 2,
    maxBetaReaders: 5,
    listedAt: '2026-05-04',
    themes: ['coming of age', 'race', 'land', 'summer', 'rural South', 'mapping', 'debut'],
  },
  {
    id: 16,
    title: 'Hollow Earth',
    author: 'M. Svensson',
    genre: 'Speculative Fiction',
    subgenre: 'Horror',
    hook: 'A Swedish family inherits a remote farmstead and discovers the cellar connects to something much older than the house above it.',
    description: 'A Swedish family inherits a remote farmstead and discovers the previous occupants left in a hurry — and that the farm\'s cellar connects to something much older than the house above it. Folk horror rendered in the flat prose of a police report.',
    keywords: ['folk horror', 'Sweden', 'farmhouse', 'cellar', 'inherited dread', 'Scandinavian'],
    status: 'open',
    betaMode: 'REQUEST',
    wordCount: 88000,
    estimatedPages: 346,
    contentRating: 'Adult',
    scheme: 3,
    readerCount: 2,
    maxBetaReaders: 4,
    listedAt: '2026-05-01',
    themes: ['horror', 'folk horror', 'Sweden', 'inheritance', 'dread', 'rural', 'Scandinavian'],
    contentNotes: { count: 3, items: ['Violence', 'Body horror', 'Psychological distress'] },
    contentWarnings: ['Violence', 'Medical/Graphic Content'],
  },
];

export function fuzzySearch(manuscripts: CatalogManuscript[], query: string): CatalogManuscript[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 1);
  if (tokens.length === 0) return [];

  return manuscripts
    .map(m => {
      let score = 0;
      const title  = m.title.toLowerCase();
      const author = m.author.toLowerCase();
      const genre  = (m.genre + ' ' + m.subgenre).toLowerCase();
      const body   = [m.description, ...m.keywords, ...m.themes].join(' ').toLowerCase();

      for (const token of tokens) {
        if (title.includes(token))  score += 3;
        if (author.includes(token)) score += 2;
        if (genre.includes(token))  score += 2;
        if (body.includes(token))   score += 1;
      }
      return { m, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ m }) => m);
}
