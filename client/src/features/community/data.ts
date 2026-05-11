import type { Mentor, CircleMember, SharedPassage, WritingPrompt, WritingCircle } from './types';

export const MENTORS: Mentor[] = [
  { id: 1, name: 'Delphine Marsh',   initials: 'DM', tone: 'accent', books: 8,  specialties: ['Literary Fiction', 'Voice & Style'],       bio: 'Eight novels, four publishers, two decades. Particularly interested in helping authors find the register their story wants to be told in.',                                                                              available: 'available', mentees: 12 },
  { id: 2, name: 'Kwame Asante',     initials: 'KA', tone: 'gold',   books: 5,  specialties: ['Historical Fiction', 'Research Methods'],   bio: 'History academic turned novelist. I work best with authors who are terrified of getting the facts wrong and need someone to help them relax into the fiction.',                                                    available: 'available', mentees: 7  },
  { id: 3, name: 'Sylvia Kowalski',  initials: 'SK', tone: 'muted',  books: 12, specialties: ['Genre Fiction', 'Plotting & Structure'],    bio: 'Twelve novels across thriller, romance, and sci-fi under various names. Full roster at the moment but I open spaces in September.',                                                                                 available: 'full',      mentees: 31 },
  { id: 4, name: 'Jin-ho Park',      initials: 'JP', tone: 'ink',    books: 3,  specialties: ['Short Fiction', 'Scene-Level Craft'],       bio: 'Three collections, Pushcart-nominated. I focus on the sentence and the scene. If you\'re writing short fiction or want to strengthen your prose at a granular level, let\'s talk.',      available: 'available', mentees: 5  },
  { id: 5, name: 'Naomi Chen',       initials: 'NC', tone: 'paper',  books: 7,  specialties: ['Self-Publishing', 'Direct Sales'],          bio: 'Seven titles all self-published. I\'ve run every model — wide, KU, direct, hybrid. Happy to share what the numbers actually looked like.',                                                        available: 'available', mentees: 18 },
  { id: 6, name: 'Raúl Espinoza',    initials: 'RE', tone: 'accent', books: 4,  specialties: ['Memoir & Autofiction', 'Narrative Voice'],  bio: 'Four memoirs. I work specifically on the gap between what happened and how to tell it — the craft problem unique to true stories.',                                                          available: 'paused',    mentees: 9  },
];

export const CIRCLE_MEMBERS: CircleMember[] = [
  { name: 'Henrik Lund',      initials: 'HL', tone: 'ink',    role: 'Organiser' },
  { name: 'Marisol Vega',     initials: 'MV', tone: 'accent' },
  { name: 'Billie Wolf',      initials: 'BW', tone: 'paper',  role: 'You' },
  { name: 'Tomás Reyes',      initials: 'TR', tone: 'gold'   },
  { name: 'Celestine Morrow', initials: 'CM', tone: 'muted'  },
];

export const INITIAL_PASSAGES: SharedPassage[] = [
  {
    id: 1, author: 'Tomás Reyes', initials: 'TR', tone: 'gold',
    source: 'The Salt Roads, Ch. 7', time: '2d ago',
    text: '"She kept the photographs in a tin her mother had used for tea, because it was the right size and because she liked the idea of them resting where something warm had been. Not sentimental — she was clear about that — just practical."',
    responses: [
      { author: 'Henrik Lund',  initials: 'HL', tone: 'ink',    body: 'The parenthetical denial is doing real work here. She doth protest too much and we love her for it.' },
      { author: 'Marisol Vega', initials: 'MV', tone: 'accent', body: 'The tin detail is perfect. I\'d resist explaining the "not sentimental" — we already know.' },
    ],
  },
  {
    id: 2, author: 'Marisol Vega', initials: 'MV', tone: 'accent',
    source: 'Salt & Ink, opening', time: '5d ago',
    text: '"The town had the quality of a place that had once expected something and then quietly stopped. You could see it in the shopfronts, in the angle of the church spire, in the way the older residents crossed the road — deliberate, unhurried, like people who had nowhere else to be and had made their peace with it."',
    responses: [
      { author: 'Tomás Reyes', initials: 'TR', tone: 'gold', body: 'This is the best opening I\'ve read in this circle in six months. The church spire detail does the most.' },
    ],
  },
];

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 1, kind: 'prompt', title: 'The Unopened Letter',
    body: 'Write the scene where your protagonist discovers a letter they were never meant to find. What does it contain, and what does their reaction reveal about who they\'ve become?',
    author: 'Delphine Marsh', initials: 'DM', tone: 'accent', time: '3d ago', responses: 14,
  },
  {
    id: 2, kind: 'prompt', title: 'The Last Time',
    body: 'Begin a scene with: "The last time I saw her, she was laughing." Continue for at least 300 words. What happened next? Where does that opening take you?',
    author: 'Jin-ho Park', initials: 'JP', tone: 'ink', time: '5d ago', responses: 23,
  },
  {
    id: 3, kind: 'prompt', title: 'What She Carried',
    body: 'Describe an object your protagonist carries with them everywhere. Don\'t name its significance — let the details speak for themselves. Show us through image alone.',
    author: 'Celestine M.', initials: 'CM', tone: 'muted', time: '1w ago', responses: 19,
  },
  {
    id: 4, kind: 'prompt', title: 'The Room After',
    body: 'Write the scene immediately following your story\'s most significant event. No action — only the quiet that follows. What does your character notice? What have they stopped seeing?',
    author: 'Henrik Lund', initials: 'HL', tone: 'ink', time: '2w ago', responses: 31,
  },
  {
    id: 5, kind: 'challenge', title: 'No Dialogue',
    body: 'Write a complete scene (300–500 words) in which no character speaks aloud. Convey everything through action, interiority, and the weight of environment. No speech marks. No dialogue tags.',
    author: 'Marisol Vega', initials: 'MV', tone: 'accent', time: '2d ago', responses: 9,
  },
  {
    id: 6, kind: 'challenge', title: 'The Minor Character',
    body: 'Find a minor character in your draft who appears only once. Write that character\'s version of your story\'s central event. What do they see that your protagonist misses?',
    author: 'Tomás Reyes', initials: 'TR', tone: 'gold', time: '6d ago', responses: 17,
  },
  {
    id: 7, kind: 'challenge', title: 'One Sentence Per Paragraph',
    body: 'Write a full page in which every paragraph is exactly one sentence. No exceptions. Notice what the white space does to your reader\'s pace — and to your own.',
    author: 'Kwame Asante', initials: 'KA', tone: 'gold', time: '1w ago', responses: 11,
  },
  {
    id: 8, kind: 'challenge', title: 'Reverse the Scene',
    body: 'Take a scene you\'ve already written and rewrite it in reverse chronological order — end first, then work back to the beginning. What shifts in meaning? What were you hiding?',
    author: 'Delphine Marsh', initials: 'DM', tone: 'accent', time: '2w ago', responses: 8,
  },
];

export const MOCK_CIRCLES: WritingCircle[] = [
  {
    id: 1,
    name: 'The Harbour Circle',
    description: 'A small group of literary fiction writers sharing work-in-progress passages and offering close reading. We focus on prose at the sentence level.',
    genre: 'Literary Fiction',
    memberCount: 5,
    maxMembers: 8,
    privacy: 'open',
    frequency: 'Weekly',
    nextSession: 'Thursday, 8pm PT',
    members: CIRCLE_MEMBERS,
    passages: INITIAL_PASSAGES,
    joined: true,
    organiser: 'Henrik Lund',
  },
  {
    id: 2,
    name: 'Midnight Genre',
    description: 'Horror, dark fantasy, and supernatural fiction. We workshop everything from cosy gothic to full body horror. No squeamishness required.',
    genre: 'Horror & Dark Fantasy',
    memberCount: 7,
    maxMembers: 10,
    privacy: 'open',
    frequency: 'Bi-weekly',
    nextSession: 'Saturday, 9pm ET',
    members: [
      { name: 'Sylvia Kowalski',  initials: 'SK', tone: 'muted',  role: 'Organiser' },
      { name: 'Raúl Espinoza',    initials: 'RE', tone: 'accent' },
      { name: 'Jin-ho Park',      initials: 'JP', tone: 'ink'    },
      { name: 'Priya Anand',      initials: 'PA', tone: 'paper'  },
      { name: 'Wendy Cross',      initials: 'WC', tone: 'gold'   },
      { name: 'Dmitri Vaslov',    initials: 'DV', tone: 'muted'  },
      { name: 'Ana Lima',         initials: 'AL', tone: 'accent' },
    ],
    passages: [],
    joined: false,
    organiser: 'Sylvia Kowalski',
  },
  {
    id: 3,
    name: 'The Long Form',
    description: 'Dedicated to novels and novellas. We workshop full chapters on a rotating schedule — structure over sentences, always. Invite-only to keep the pace.',
    genre: 'Novels & Long Fiction',
    memberCount: 4,
    maxMembers: 6,
    privacy: 'invite',
    frequency: 'Monthly',
    nextSession: 'First Sunday, 3pm PT',
    members: [
      { name: 'Delphine Marsh',    initials: 'DM', tone: 'accent', role: 'Organiser' },
      { name: 'Kwame Asante',      initials: 'KA', tone: 'gold'   },
      { name: 'Celestine Morrow',  initials: 'CM', tone: 'muted'  },
      { name: 'Naomi Chen',        initials: 'NC', tone: 'paper'  },
    ],
    passages: [],
    joined: false,
    organiser: 'Delphine Marsh',
  },
  {
    id: 4,
    name: 'First Draft Club',
    description: 'A pressure-free circle for writers in the middle of messy first drafts. Bring your roughest work. We are here to move the work forward, not to polish.',
    genre: 'Any Genre',
    memberCount: 3,
    maxMembers: 12,
    privacy: 'open',
    frequency: 'Weekly',
    nextSession: 'Monday, 6pm PT',
    members: [
      { name: 'Imani Osei',    initials: 'IO', tone: 'paper',  role: 'Organiser' },
      { name: 'Tomás Reyes',   initials: 'TR', tone: 'gold'   },
      { name: 'Marisol Vega',  initials: 'MV', tone: 'accent' },
    ],
    passages: [],
    joined: false,
    organiser: 'Imani Osei',
  },
];

export const CARDS = [
  { kind: 'BORROWED READER',    head: 'Jonas T. read your Ch. 14 because Naomi Aldridge vouched for him.',     body: '"Tomás flagged the lighthouse pacing — I had the same instinct in my second book. Two suggestions in the margin."',          who: 'Naomi A. · 4 books · sci-fi' },
  { kind: 'FAVOR · COVER CRIT', head: 'Three authors offered a 30-min cover critique this week.',               body: "You've sent four critiques in the last six months — you have credit to spend. Wendy, Marc, and Asha are open Thursday.",    who: 'Karma ledger · +4'            },
  { kind: 'SHARED VENDOR',       head: 'BookMobile (St. Paul) — vetted by 23 authors in your genre.',           body: '"On time on the last six print runs, owner emails back same day. Use code PRESS-IND for $0.40 off per book."',              who: 'Reviewed 23× · ★ 4.8'         },
  { kind: 'OPEN INVITATION',     head: 'Reading circle in your timezone, Tuesday 8pm PT.',                      body: 'Six authors workshopping middles this month. Bring 1,500 words; leave with three perspectives. Two seats left.',          who: 'Hosted by Mira K.'            },
];
