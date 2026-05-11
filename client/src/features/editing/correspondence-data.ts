import type { CorrespondenceThread } from './types';

export const INITIAL_THREADS: CorrespondenceThread[] = [
  {
    id: 1,
    manuscriptId: 1,
    draftVersion: 'Draft 2',
    reader: { id: 'mock-4', name: 'Henrik Lund', initials: 'HL', tone: 'ink' },
    openedAt: '2 days ago',
    messages: [
      {
        id: 1,
        author: 'reader',
        authorName: 'Henrik Lund',
        body: `Dear Billie,

I finished The Lantern Keeper's Daughter last night, and I've been sitting with it since.

First: the prose. There are sentences in this book that read like they were carved, not written — the salt marshes at dusk passage in Chapter 5 is going to stay with me for a long time. That's the yardstick I marked, as you asked.

But I want to be honest about Part 2, because I think you already know something is off there and you're probably waiting to see if your readers notice. They will. The lighthouse chapter is doing too much. You've stacked the mother's history, the storm, the betrayal, and Cora's confrontation with what she's become — all in three pages. Each of those revelations deserves room. The scene is structurally strong; it just needs to breathe.

What I think this book is doing, at its best, is asking whether the things we inherit from people we love can be separated from those people. Cora can't stop loving her mother, but she also can't stop being damaged by her. The ending lands that — but Chapter 19 almost gives the thesis away too early. "Trust, and the particular violence of its removal" is your epigraph, if you let it be.

Thank you for trusting me with this. It's the kind of manuscript that makes you feel like a better reader.

Henrik`,
        sentAt: '2 days ago',
      },
      {
        id: 2,
        author: 'writer',
        authorName: 'Billie Wolf',
        body: `Henrik,

Thank you. I mean that — this is exactly the kind of reading I was hoping for.

You're right about the lighthouse chapter. I've known since the second draft that something was wrong there, and I kept telling myself I'd fix it in revision, and then revision came and I told myself the same thing. Hearing it from you makes it real in a way my own editing doesn't.

The Chapter 19 note is particularly sharp. I've been debating whether to move that line for months. You may have just made the decision for me.

Can I ask — did the timeline ever feel genuinely lost to you, or just momentarily disorienting? There's a version of that confusion I want to preserve; there's another that's just careless. I'm not sure I can tell them apart from inside the book.

Billie`,
        sentAt: '1 day ago',
      },
      {
        id: 3,
        author: 'reader',
        authorName: 'Henrik Lund',
        body: `Billie,

The honest answer: both. Chapter 9 — Cora at the station — confused me in a way that felt careless. There's no contextual anchor, and I spent a page recalibrating. But the slow dissolve between past and present in Chapter 15? That confusion is load-bearing. Don't touch it.

If I had to draw a line: whenever the disorientation requires external effort — re-reading, flipping back — it's working against you. When it's just the reading brain learning to trust a new rhythm, it's the book teaching you how to read it. Chapter 9 is the former. Chapter 15 is the latter.

H`,
        sentAt: '18 hours ago',
      },
    ],
  },
  {
    id: 2,
    manuscriptId: 1,
    draftVersion: 'Draft 2',
    reader: { id: 2, name: 'Tomás Reyes', initials: 'TR', tone: 'gold' },
    openedAt: '5 hours ago',
    messages: [
      {
        id: 4,
        author: 'reader',
        authorName: 'Tomás Reyes',
        body: `Billie,

I've been thinking about how to write this letter for a few days, because this is a book that makes you want to be careful with your words about it.

I'll start with what the book does brilliantly, because it's a lot: the relationship between Cora and the landscape is unlike anything I've read recently. You've built an emotional geography. The marsh is grief. The lighthouse is reckoning. I knew that from around Chapter 4 and I spent the rest of the book watching you prove it, and you did.

The pacing flag I raised in Chapter 17 stands. The lighthouse scene is compressed in a way that undercuts what should be the book's most expansive emotional moment. But this is a structural problem, not a prose problem — the bones are there. It needs space, not surgery.

Here's what surprised me: the character I found most interesting wasn't Cora. It was Daniel. Every scene he appears in, he's vibrating with something that never quite gets named. I don't know if that's intentional, but if you gave him one more scene — just one — to be wrong about something in a way that matters, I think it would change the entire moral geometry of the book.

Thank you for this. It's a generous book, and it made me want to write.

Tomás`,
        sentAt: '5 hours ago',
      },
    ],
  },
  {
    id: 3,
    manuscriptId: 2,
    draftVersion: 'Draft 1',
    reader: { id: 7, name: 'Celestine Morrow', initials: 'CM', tone: 'gold' },
    openedAt: '1 day ago',
    messages: [
      {
        id: 5,
        author: 'reader',
        authorName: 'Celestine Morrow',
        body: `Dear Billie,

The Salt Roads is a book I've been waiting to read — not this book specifically, but a book that does what this one is trying to do: hold two women in different centuries in the same light, and refuse to let either one be merely the other's metaphor.

You're mostly succeeding. Adaeze's chapters have a texture and urgency that Miriam's don't yet share. Adaeze feels like a person who exists between the pages; Miriam feels like a person the book has constructed. I think this is a voice problem more than a structural one — Miriam's interiority is described from the outside, where Adaeze's is inhabited from within. The alternating structure will sing once the voices are equally embodied.

The typographic problem in Chapter 2 is real. I reread that transition twice. A date, a section break, a single word — something needs to anchor us in time.

What I want to tell you, above the craft notes: this book is necessary. The thematic echo between the chapters is earned. The market scene in Chapter 7 and Miriam's kitchen in Chapter 6 — that parallel is doing exactly what the whole book promises. Hold to that.

With admiration,
Celestine`,
        sentAt: '1 day ago',
      },
      {
        id: 6,
        author: 'writer',
        authorName: 'Billie Wolf',
        body: `Celestine,

Thank you for the precision of this. "Miriam's interiority is described from the outside, where Adaeze's is inhabited from within" — I've read that sentence six times. It's exactly right, and now that I can see it I don't know how I didn't before.

I've been wrestling with Miriam since the first draft. I think I've been writing her from research rather than instinct, and it shows. The distance I thought was historical texture is just absence.

The typographic note is on the list. I'm leaning toward a small date stamp — year only — at each chapter head. Clean, but enough.

What you said at the end means a great deal to me. That's the thing I most needed to hear.

Billie`,
        sentAt: '20 hours ago',
      },
    ],
  },
];
