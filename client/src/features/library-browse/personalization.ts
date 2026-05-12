import type { CatalogManuscript, PersonalizationSignal } from './data';
import { deriveSlotState } from './data';

/* ── Reader profile shape (future: from API) ─────────────────────── */

export interface ReaderProfile {
  genres:           string[];           // genres the reader has selected
  readHistory:      number[];           // manuscript IDs reader has read
  authorSubs:       string[];           // author IDs/names subscribed to
  circleIds:        string[];           // user IDs in reader's circle
  avoidList:        string[];           // content note items to exclude
  isNew:            boolean;            // no profile AND no circle
}

export const EMPTY_PROFILE: ReaderProfile = {
  genres: [], readHistory: [], authorSubs: [], circleIds: [],
  avoidList: [], isNew: true,
};

/* ── Signal precedence ────────────────────────────────────────────── */

type SignalKind = 'circle_named' | 'circle_count' | 'profile_author' | 'profile_taste' | 'author_rec';

function signalPriority(kind: SignalKind): number {
  const order: SignalKind[] = ['circle_named', 'circle_count', 'profile_author', 'profile_taste', 'author_rec'];
  return order.indexOf(kind);
}

export function getPersonalizationSignal(
  ms: CatalogManuscript,
  _profile: ReaderProfile,
): PersonalizationSignal | null {
  // If the manuscript already carries a signal (e.g. injected by API), use it
  if (ms.personalizationSignal) return ms.personalizationSignal;

  // Future: derive from profile. For now return null.
  void signalPriority; // suppress unused warning until wired
  return null;
}

/* ── Content notes — silent filter ───────────────────────────────── */

export function filterForReader(
  manuscripts: CatalogManuscript[],
  avoidList: string[],
): CatalogManuscript[] {
  if (avoidList.length === 0) return manuscripts;
  const avoid = new Set(avoidList.map(s => s.toLowerCase()));
  return manuscripts.filter(ms => {
    if (!ms.contentNotes) return true;
    return !ms.contentNotes.items.some(item => avoid.has(item.toLowerCase()));
  });
}

/* ── Shelf specs ──────────────────────────────────────────────────── */

export interface ShelfSpec {
  sectionNum:    string;
  name:          string;
  editorialLine: string;
  helperLine?:   string;
  cards:         CatalogManuscript[];
}

function isoAge(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function getVisibleShelves(
  manuscripts: CatalogManuscript[],
  profile: ReaderProfile,
): ShelfSpec[] {
  // Personalized pool: avoidList applied + full manuscripts excluded
  const available = filterForReader(manuscripts, profile.avoidList)
    .filter(ms => deriveSlotState(ms) !== 'full');

  // Editorial pool: avoidList applied but full manuscripts included — the
  // reading list is a discovery surface, not a join-queue, so full manuscripts
  // can still appear. This ensures § 02 is always present regardless of
  // how thin the joinable catalog is.
  const editorial = filterForReader(manuscripts, profile.avoidList);

  const shelves: ShelfSpec[] = [];

  /* § 01 — From your circle
     Trigger: reader has ≥1 circle person AND ≥1 manuscript with circle activity */
  const circleCards = available.filter(ms => ms.personalizationSignal?.kind === 'circle');
  if (profile.circleIds.length >= 1 && circleCards.length >= 1) {
    shelves.push({
      sectionNum: '01',
      name: 'From your circle',
      editorialLine: 'Three manuscripts joined by people in your circle this week.',
      cards: circleCards.slice(0, 6),
    });
  }

  /* § 02 — The reading list (editorial — always present while any manuscript exists) */
  const editorialCards = editorial.filter(ms => ms.featured !== true).slice(0, 6);
  if (editorialCards.length >= 1) {
    shelves.push({
      sectionNum: '02',
      name: 'The reading list',
      editorialLine: 'This month\'s editorial shelf — first novels and first-person leavings.',
      cards: editorialCards,
    });
  }

  /* § 03 — Matched to your reading
     Trigger: ≥3 genres OR ≥1 read history OR ≥1 author sub AND ≥2 matching manuscripts */
  const hasProfileInput =
    profile.genres.length >= 3 ||
    profile.readHistory.length >= 1 ||
    profile.authorSubs.length >= 1;

  const matchedCards = hasProfileInput
    ? available.filter(ms =>
        ms.personalizationSignal?.kind === 'profile_match' ||
        profile.genres.some(g => ms.genre.toLowerCase().includes(g.toLowerCase()))
      ).slice(0, 6)
    : [];

  if (hasProfileInput && matchedCards.length >= 2) {
    shelves.push({
      sectionNum: '03',
      name: 'Matched to your reading',
      editorialLine: 'Drawn from your reader profile — manuscripts where the author is looking for someone like you.',
      cards: matchedCards,
    });
  }

  /* § 04 — Closing soon (1–2 slots remaining) */
  const closingCards = available
    .filter(ms => {
      const state = deriveSlotState(ms);
      if (state !== 'filling') return false;
      const counts = ms.slotCounts ?? { filled: ms.readerCount, total: ms.maxReaders };
      return counts.total - counts.filled <= 2;
    })
    .slice(0, 6);

  if (closingCards.length >= 1) {
    shelves.push({
      sectionNum: '04',
      name: 'Closing soon',
      editorialLine: 'Manuscripts with one or two reader slots remaining.',
      cards: closingCards,
    });
  }

  /* § 05 — Just opened (listed in last 14 days) */
  const justOpenedCards = available
    .filter(ms => isoAge(ms.listedAt) <= 14)
    .sort((a, b) => b.listedAt.localeCompare(a.listedAt))
    .slice(0, 6);

  if (justOpenedCards.length >= 1) {
    shelves.push({
      sectionNum: '05',
      name: 'Just opened',
      editorialLine: 'Manuscripts that opened for readers in the last seven days.',
      cards: justOpenedCards,
    });
  }

  return shelves;
}

/* § 01 and § 03 both dropped due to thin reader inputs → show new-reader prompt */
export function shouldShowNewReaderPrompt(
  manuscripts: CatalogManuscript[],
  profile: ReaderProfile,
): boolean {
  if (!profile.isNew) return false;
  const shelves = getVisibleShelves(manuscripts, profile);
  const has01 = shelves.some(s => s.sectionNum === '01');
  const has03 = shelves.some(s => s.sectionNum === '03');
  return !has01 && !has03;
}
