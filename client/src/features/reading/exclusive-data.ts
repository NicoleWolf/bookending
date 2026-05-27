export type ExclusivePostType = 'deleted_scene' | 'character_note' | 'sequel_hint' | 'reflection';

export const EXCLUSIVE_TYPE_LABEL: Record<ExclusivePostType, string> = {
  deleted_scene:  'Deleted scene',
  character_note: 'Character note',
  sequel_hint:    'Sequel hint',
  reflection:     'Reflection',
};

export interface ExclusivePost {
  id:             string;
  authorId:       string;
  authorName:     string;
  authorInitials: string;
  bookTitle:      string;
  manuscriptId:   string;
  type:           ExclusivePostType;
  title:          string;
  body:           string | null; // null when isUnlocked is false
  postedAt:       string;        // ISO
  isUnlocked:     boolean;       // true = reader has submitted a review for this book
}

const NOW = Date.now();
function daysAgo(d: number): string {
  return new Date(NOW - d * 86_400_000).toISOString();
}

export const DEMO_EXCLUSIVE_POSTS: ExclusivePost[] = [
  {
    id:             'xp1',
    authorId:       'demo-author-1',
    authorName:     'Margot Voss',
    authorInitials: 'MV',
    bookTitle:      'The Marginal Hours',
    manuscriptId:   'demo-ms-1',
    type:           'deleted_scene',
    title:          'Ch. 7: Elena finds the letter — deleted',
    body:           "This scene was cut from the final manuscript because it gave too much away too soon. But I always loved it.\n\nElena stood at the foot of the stairs, the letter still in her hand. She had read it twice before she understood what it meant — not for her, but for everyone who had trusted him. The weight of it wasn't in the words but in the dates. The dates that made everything else impossible.",
    postedAt:       daysAgo(2),
    isUnlocked:     true,
  },
  {
    id:             'xp2',
    authorId:       'demo-author-1',
    authorName:     'Margot Voss',
    authorInitials: 'MV',
    bookTitle:      'The Marginal Hours',
    manuscriptId:   'demo-ms-1',
    type:           'character_note',
    title:          'Why I wrote Marcus the way I did',
    body:           "Marcus was originally the antagonist. Then he became a mirror for Elena, and finally he became the character I'd been trying to write for ten years — someone who does the right thing for entirely the wrong reasons, and has to live with what that costs him.\n\nThe version of Marcus you met is the third draft of him. The first was too clean. The second was too broken. This one I finally believed.",
    postedAt:       daysAgo(9),
    isUnlocked:     true,
  },
  {
    id:             'xp3',
    authorId:       'demo-author-2',
    authorName:     'James Okafor',
    authorInitials: 'JO',
    bookTitle:      'Saltwater',
    manuscriptId:   'demo-ms-2',
    type:           'sequel_hint',
    title:          'What comes after Saltwater',
    body:           null,
    postedAt:       daysAgo(4),
    isUnlocked:     false,
  },
];
