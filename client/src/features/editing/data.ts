import type { Manuscript, Reader, Comment, CommentType, ReaderTone, BetaReader } from './types';
import type { ReaderImpression } from './WriterSparkline';

// Editing-specific metadata keyed by book id (title/id come from the catalog savedBooks).
export type ManuscriptMeta = Omit<Manuscript, 'id' | 'title'>;

export const MANUSCRIPT_META: Record<string, ManuscriptMeta> = {};

export const DEFAULT_EDITING_META: ManuscriptMeta = {
  draft: 'Draft 1', date: '—', words: 0, chapters: 0, pages: 0,
};

export const INTEGRATIONS = [
  { name: 'Grammarly',     tagline: 'Grammar & style checks',  initial: 'G', connected: false },
  { name: 'ProWritingAid', tagline: 'Deep manuscript analysis', initial: 'P', connected: false },
  { name: 'Scrivener',     tagline: 'Export .scriv project',    initial: 'S', connected: false },
  { name: 'Google Docs',   tagline: 'Sync & collaborate',       initial: 'D', connected: true  },
];

// Readers now come from the API — this is intentionally empty.
export const INITIAL_READERS: Record<string, Reader[]> = {};

export const INITIAL_INSTRUCTIONS: Record<string, string> = {};

export const typeTone: Record<CommentType, 'danger' | 'neutral' | 'good' | 'accent'> = {
  pacing: 'danger', character: 'neutral', prose: 'accent', plot: 'neutral',
  other: 'neutral', continuity: 'danger', praise: 'good',
};

export const verdictTone: Record<string, 'good' | 'danger' | 'neutral' | 'accent'> = {
  'enthralled': 'good', 'pacing flag': 'danger', 'on track': 'neutral',
  '4★ — sent letter': 'accent', 'sent letter': 'accent',
  'just started': 'neutral', 'just invited': 'neutral',
};

export const COMMENTS: Comment[] = [
  { id: 1,  manuscriptId: 3, reader: { name: 'Tomás Reyes',   initials: 'TR', tone: 'gold'   }, chapter: 'Ch. 17', page: 184, passage: '"The lighthouse door swung open — salt and smoke and something older than either — and Cora stepped through into her mother\'s past."',      note: 'The lighthouse scene is doing too much heavy lifting. We learn about Cora\'s mother and the storm and the betrayal in three pages — let it breathe.',                                            type: 'pacing',     resolvedDefault: false, flaggedBy: 2, time: '11 min ago' },
  { id: 2,  manuscriptId: 3, reader: { name: 'Marisol Vega',  initials: 'MV', tone: 'accent' }, chapter: 'Ch. 9',  page: 97,  passage: '"She hadn\'t spoken to her father in six years, and now here he was, occupying the same twelve feet of platform, waiting with his hands in his jacket pockets, looking at a point somewhere past her left shoulder — the gesture she had once mistaken for shyness, which she now understood was something closer to its opposite."',                             note: 'I keep losing track of the timeline on their estrangement. A small anchor — even just a season — would help.',                                                                                   type: 'continuity', resolvedDefault: false, flaggedBy: 1, time: '3h ago'    },
  { id: 3,  manuscriptId: 3, reader: { name: 'Henrik Lund',   initials: 'HL', tone: 'ink'    }, chapter: 'Ch. 5',  page: 51,  passage: '"the smell of rust and low tide and something she could only call regret."',                                             note: 'This sentence is doing exactly what the whole book does at its best — keep it, and use it as a yardstick.',                                                                                      type: 'praise',     resolvedDefault: false, flaggedBy: 3, time: '1d ago'    },
  { id: 4,  manuscriptId: 3, reader: { name: 'Imani Okafor',  initials: 'IO', tone: 'muted'  }, chapter: 'Ch. 8',  page: 84,  passage: '"Daniel moved through the crowd like he owned it, which of course he did, or thought he did, or had once."',                                    note: 'Daniel feels underwritten compared to Cora. Every scene he\'s in reads like he\'s waiting for the real characters to arrive.',                                                                    type: 'character',  resolvedDefault: false, flaggedBy: 0, time: '1d ago'    },
  { id: 5,  manuscriptId: 3, reader: { name: 'Tomás Reyes',   initials: 'TR', tone: 'gold'   }, chapter: 'Ch. 12', page: 131, passage: '"She folded the letter twice, then a third time, until it was small enough to lose."',                                                           note: 'Gorgeous. Best single image in the book so far.',                                                                                                                                                 type: 'praise',     resolvedDefault: true,  flaggedBy: 1, time: '2d ago'    },
  { id: 6,  manuscriptId: 3, reader: { name: 'Priya Anand',   initials: 'PA', tone: 'paper'  }, chapter: 'Ch. 3',  page: 28,  passage: '"The village of Kestwick had the particular quality of places that know they are being watched."',                                               note: "The atmosphere is thick here in a way that feels earned. But I wasn't sure if 'watched' meant by us, the readers, or by something in the story.",                                                 type: 'prose',      resolvedDefault: false, flaggedBy: 0, time: '6h ago'    },
  { id: 7,  manuscriptId: 3, reader: { name: 'Marisol Vega',  initials: 'MV', tone: 'accent' }, chapter: 'Ch. 14', page: 152, passage: '"The hearing lasted four hours. Cora had been expecting three."',                                                                                 note: "This chapter moves fast — almost too fast after the slowness of Ch. 13. The whiplash is effective but I wonder if it's intentional?",                                                             type: 'pacing',     resolvedDefault: true,  flaggedBy: 0, time: '2d ago'    },
  { id: 8,  manuscriptId: 3, reader: { name: 'Henrik Lund',   initials: 'HL', tone: 'ink'    }, chapter: 'Ch. 19', page: 204, passage: '"The ending comes back to this: trust, and the particular violence of its removal."',                                                             note: "This line almost works as the thematic thesis but you've buried it in the penultimate chapter. Consider whether it belongs at the front.",                                                         type: 'character',  resolvedDefault: false, flaggedBy: 2, time: '2d ago'    },
  { id: 9,  manuscriptId: 1, reader: { name: 'Celestine Morrow', initials: 'CM', tone: 'gold'   }, chapter: 'Ch. 4',  page: 38,  passage: '"Adaeze pressed her thumb to the glass and the city looked back at her, indifferent as water."',                                              note: "The Lagos chapters are more alive than the Bordeaux ones right now — Adaeze's voice has a specificity that Miriam's hasn't found yet. The imbalance is noticeable.",                             type: 'character',  resolvedDefault: false, flaggedBy: 1, time: '3h ago'    },
  { id: 10, manuscriptId: 1, reader: { name: 'Yuki Tanaka',      initials: 'YT', tone: 'accent' }, chapter: 'Ch. 7',  page: 71,  passage: '"The market smelled of cardamom and something sweeter, something she remembered without knowing why."',                                        note: 'The sensory writing in this chapter is excellent. The thematic echo with Ch. 6 (Miriam in the kitchen) is earning its parallel structure — this is the book working at its best.',               type: 'praise',     resolvedDefault: false, flaggedBy: 0, time: '1d ago'    },
  { id: 11, manuscriptId: 1, reader: { name: 'Celestine Morrow', initials: 'CM', tone: 'gold'   }, chapter: 'Ch. 2',  page: 19,  passage: '"The chapter alternates between 1943 and 2024 within a single scene — a choice that feels bold but risks losing the reader in the seams."', note: "I had to re-read the transition twice to understand where I was in time. Consider a subtle typographic signal — even a date in the margin — to anchor each shift.",                               type: 'continuity', resolvedDefault: false, flaggedBy: 1, time: '2d ago'    },
];

export const TONES: ReaderTone[] = ['accent', 'gold', 'muted', 'ink', 'paper'];

export const INITIAL_CONTENT: Record<number, string> = {
  3: `<h1>The Lantern Keeper's Daughter</h1>
<h2>Part One: What the Water Remembers</h2>
<h3>Chapter One</h3>
<p>The village of Kestwick had the particular quality of places that know they are being watched. From the harbour, the lighthouse caught the first and last of every sun, its beam sweeping east to west like a question no one had thought to answer. Cora Melling had grown up inside that question. She had not answered it either.</p>
<p>She came back on the last ferry of September, when the summer visitors had gone and Kestwick had recovered its true face: shuttered ice cream shops, boats pulled up from the water, the smell of rust and low tide and something she could only call regret. She stood on the pier and watched the lighthouse turn. It had a different keeper now. The light was the same.</p>
<p>She hadn't spoken to her father in six years, and now here he was, occupying the same twelve feet of platform, waiting with his hands in his jacket pockets, looking at a point somewhere past her left shoulder — the gesture she had once mistaken for shyness, which she now understood was something closer to its opposite.</p>
<p>"You got the train," he said.</p>
<p>"I got the train."</p>
<p>He picked up her bag without asking. She let him.</p>
<h3>Chapter Two</h3>
<p>The lighthouse door swung open — salt and smoke and something older than either — and Cora stepped through into her mother's past.</p>
<p>She had not expected it to look so small. In the stories her father had told her when she was very young — before the telling stopped — the lighthouse had been enormous, a world unto itself, fourteen floors of purpose and weather. What she found was a staircase with a practical number of steps, a lens room the size of a large bathroom, and a logbook that her father had apparently continued keeping, in the same neat hand, for thirty-one years after her mother had stopped reading it.</p>
<p>The last entry in her mother's hand was dated March 4th. The month was not given. Neither was the year. <em>Visibility poor. Wind NNW. The light held.</em></p>`,

  1: `<h1>The Salt Roads</h1>
<h2>Part One: Lagos, 2024</h2>
<h3>Chapter One — Adaeze</h3>
<p>Adaeze pressed her thumb to the glass and the city looked back at her, indifferent as water.</p>
<p>It was the twenty-third floor of a building that had been, five years ago, a fish cannery. Now it was a co-working space for people who could afford to rent the view. Through the floor-to-ceiling window, Lagos resolved into a puzzle of orange rooftops and construction cranes and the blue particular to the Atlantic when it was being diplomatic. She could see the island and the mainland and the bridge connecting them, and she understood, as she often did from this height, why the city needed its bridges.</p>
<p>The files were in a green folder on the desk behind her. She was not ready to open them.</p>
<p>Her phone showed a message from her mother: <em>Have you eaten?</em> She had not. She typed <em>Yes</em> and turned back to the window.</p>
<h2>Interlude: Bordeaux, 1943</h2>
<h3>Chapter Two — Miriam</h3>
<p>She was in the kitchen when the knock came. Not the front door — people who came to the front door had legitimate reasons to be there — but the service entrance, three light taps that meant: <em>I have been here before. I know your rhythms. I need you to let me in.</em></p>
<p>The market had been that morning. She had bought cardamom and something sweeter, something that reminded her, without her knowing why, of a house she had visited once in her childhood, whose name she could no longer recall. She had set it on the counter and looked at it for longer than was reasonable.</p>
<p>She opened the service door. The woman on the other side was perhaps sixty, perhaps eighty, wearing a coat that had been expensive once and was now precisely the colour of rain.</p>
<p>"You are Miriam Kessler," the woman said. It was not a question.</p>
<p>"I was," said Miriam. Which was also not quite true, but was all she could offer at that moment.</p>`,
};

export const MANUSCRIPT_GENRES: Record<string, string[]> = {};

export const BETA_READER_POOL: BetaReader[] = [
  {
    id: 'pool-101', name: 'Rosa Pereira',    initials: 'RP', tone: 'accent',
    email: 'rosa.pereira@readerslist.io',
    genres: ['Literary Fiction', 'Historical Fiction'],
    booksRead: 41, avgRating: 4.9, responseTime: '1–2 weeks', availability: 'available',
    bio: 'Particularly attentive to voice consistency and historical detail across period fiction. Former archivist, now reads full-time.',
  },
  {
    id: 'pool-102', name: 'Amir Hassan',     initials: 'AH', tone: 'gold',
    email: 'a.hassan@writersnetwork.co',
    genres: ['Literary Fiction', 'Diaspora Fiction', 'Translation'],
    booksRead: 28, avgRating: 4.7, responseTime: '2 weeks', availability: 'available',
    bio: 'Strong focus on cultural authenticity and character interiority. Reads widely in Arabic, French, and English literary fiction.',
  },
  {
    id: 'pool-103', name: 'Cate Willoughby', initials: 'CW', tone: 'muted',
    email: 'cate.w@betareaders.net',
    genres: ['Historical Fiction', 'Literary Fiction', 'Crime Fiction'],
    booksRead: 35, avgRating: 4.6, responseTime: '10–14 days', availability: 'available',
    bio: 'Former librarian. Notes structural issues clearly and has a sharp eye for period anachronism. Gives detailed, chapter-level notes.',
  },
  {
    id: 'pool-104', name: 'Priya Sharma',    initials: 'PS', tone: 'ink',
    email: 'priya.sharma@postcolonial.org',
    genres: ['Diaspora Fiction', 'Literary Fiction', 'Historical Fiction'],
    booksRead: 31, avgRating: 4.9, responseTime: '2–3 weeks', availability: 'available',
    bio: 'Academic background in postcolonial literature. Specialises in cross-cultural narratives and dual-timeline structures.',
  },
  {
    id: 'pool-105', name: 'Yuki Adebayo',    initials: 'YA', tone: 'paper',
    email: 'yuki.adebayo@inbox.com',
    genres: ['Literary Fiction', 'Speculative Fiction'],
    booksRead: 22, avgRating: 4.8, responseTime: '2 weeks', availability: 'available',
    bio: 'Particular interest in narrative voice shifts and unreliable perspectives. Reads for both craft and emotional resonance.',
  },
  {
    id: 'pool-106', name: 'Lena Brandt',     initials: 'LB', tone: 'accent',
    email: 'lena.brandt@readingclub.de',
    genres: ['Historical Fiction', 'Literary Fiction', 'Translation'],
    booksRead: 27, avgRating: 4.6, responseTime: '2 weeks', availability: 'available',
    bio: 'Reads widely in European historical fiction. Useful perspective on how stories travel across borders and what gets lost.',
  },
  {
    id: 'pool-107', name: 'Marcus Osei',     initials: 'MO', tone: 'gold',
    email: 'marcus.osei@readers.co',
    genres: ['Literary Fiction', 'Crime Fiction', 'Memoir'],
    booksRead: 19, avgRating: 4.5, responseTime: '3 weeks', availability: 'available',
    bio: 'Fast reader, thorough notes on plot logic and character motivation. Former book reviewer. Direct in his feedback.',
  },
  {
    id: 'pool-108', name: 'Sabine Molière',  initials: 'SM', tone: 'muted',
    email: 'sabine.m@lecteurs.fr',
    genres: ['Literary Fiction', 'Diaspora Fiction', 'Historical Fiction'],
    booksRead: 24, avgRating: 4.7, responseTime: '1–2 weeks', availability: 'busy',
    bio: 'Bilingual French/English reader with a focus on how memory and place function in literary fiction. Currently at capacity.',
  },
];

// Mock impression curves — used as initial state until the API returns real data.
// Keys match the numeric manuscript IDs used in COMMENTS (coerced to string by activeId).
export const INITIAL_IMPRESSIONS: Record<string, ReaderImpression[]> = {
  '3': [
    {
      readerId: 'mock-tr', readerName: 'Tomás Reyes', readerInitials: 'TR',
      points: [
        { chapterNum: 1,  stance: 'Engaged'    },
        { chapterNum: 2,  stance: 'Curious'    },
        { chapterNum: 3,  stance: 'Engaged'    },
        { chapterNum: 4,  stance: 'Enthralled' },
        { chapterNum: 5,  stance: 'Enthralled' },
        { chapterNum: 6,  stance: 'Engaged'    },
        { chapterNum: 7,  stance: 'Curious'    },
        { chapterNum: 8,  stance: 'Drifting'   },
        { chapterNum: 9,  stance: 'Curious'    },
        { chapterNum: 10, stance: 'Engaged'    },
        { chapterNum: 11, stance: 'Enthralled' },
        { chapterNum: 12, stance: 'Enthralled' },
        { chapterNum: 13, stance: 'Engaged'    },
        { chapterNum: 14, stance: 'Curious'    },
        { chapterNum: 15, stance: 'Engaged'    },
        { chapterNum: 16, stance: 'Enthralled' },
        { chapterNum: 17, stance: 'Drifting'   },
        { chapterNum: 18, stance: 'Curious'    },
        { chapterNum: 19, stance: 'Engaged'    },
      ],
    },
    {
      readerId: 'mock-mv', readerName: 'Marisol Vega', readerInitials: 'MV',
      points: [
        { chapterNum: 1,  stance: 'Curious'    },
        { chapterNum: 2,  stance: 'Engaged'    },
        { chapterNum: 3,  stance: 'Engaged'    },
        { chapterNum: 4,  stance: 'Curious'    },
        { chapterNum: 5,  stance: 'Enthralled' },
        { chapterNum: 6,  stance: 'Engaged'    },
        { chapterNum: 7,  stance: 'Curious'    },
        { chapterNum: 8,  stance: 'Curious'    },
        { chapterNum: 9,  stance: 'Drifting'   },
        { chapterNum: 10, stance: 'Engaged'    },
        { chapterNum: 11, stance: 'Curious'    },
        { chapterNum: 12, stance: 'Engaged'    },
        { chapterNum: 13, stance: 'Enthralled' },
        { chapterNum: 14, stance: 'Engaged'    },
      ],
    },
    {
      readerId: 'mock-hl', readerName: 'Henrik Lund', readerInitials: 'HL',
      points: [
        { chapterNum: 1,  stance: 'Engaged'    },
        { chapterNum: 2,  stance: 'Engaged'    },
        { chapterNum: 3,  stance: 'Curious'    },
        { chapterNum: 4,  stance: 'Engaged'    },
        { chapterNum: 5,  stance: 'Enthralled' },
        { chapterNum: 6,  stance: 'Engaged'    },
        { chapterNum: 7,  stance: 'Engaged'    },
        { chapterNum: 8,  stance: 'Curious'    },
        { chapterNum: 9,  stance: 'Engaged'    },
        { chapterNum: 10, stance: 'Enthralled' },
        { chapterNum: 11, stance: 'Enthralled' },
        { chapterNum: 12, stance: 'Engaged'    },
        { chapterNum: 13, stance: 'Engaged'    },
        { chapterNum: 14, stance: 'Curious'    },
        { chapterNum: 15, stance: 'Engaged'    },
        { chapterNum: 16, stance: 'Enthralled' },
        { chapterNum: 17, stance: 'Engaged'    },
        { chapterNum: 18, stance: 'Enthralled' },
        { chapterNum: 19, stance: 'Enthralled' },
      ],
    },
  ],
  '1': [
    {
      readerId: 'mock-cm', readerName: 'Celestine Morrow', readerInitials: 'CM',
      points: [
        { chapterNum: 1, stance: 'Curious'    },
        { chapterNum: 2, stance: 'Engaged'    },
        { chapterNum: 3, stance: 'Engaged'    },
        { chapterNum: 4, stance: 'Enthralled' },
        { chapterNum: 5, stance: 'Engaged'    },
        { chapterNum: 6, stance: 'Curious'    },
        { chapterNum: 7, stance: 'Engaged'    },
      ],
    },
    {
      readerId: 'mock-yt', readerName: 'Yuki Tanaka', readerInitials: 'YT',
      points: [
        { chapterNum: 1, stance: 'Engaged'    },
        { chapterNum: 2, stance: 'Curious'    },
        { chapterNum: 3, stance: 'Enthralled' },
        { chapterNum: 4, stance: 'Enthralled' },
        { chapterNum: 5, stance: 'Enthralled' },
        { chapterNum: 6, stance: 'Enthralled' },
        { chapterNum: 7, stance: 'Enthralled' },
      ],
    },
  ],
};

export const RATING_TAGS = [
  { label: 'Insightful',         positive: true  },
  { label: 'Thorough',           positive: true  },
  { label: 'Prompt',             positive: true  },
  { label: 'Detailed notes',     positive: true  },
  { label: 'Great communicator', positive: true  },
  { label: 'Brief notes',        positive: false },
  { label: 'Slow to respond',    positive: false },
  { label: 'Partial read',       positive: false },
];
