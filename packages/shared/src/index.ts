import { z } from 'zod';

// ─── Response schemas (derive the API record types) ───────────────────────────

export const BetaModeSchema = z.enum(['CLOSED', 'PUBLIC', 'REQUEST', 'INVITE_ONLY']);
export type BetaMode = z.infer<typeof BetaModeSchema>;

export const BetaRequestStatusSchema = z.enum(['PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN']);
export type BetaRequestStatus = z.infer<typeof BetaRequestStatusSchema>;

export const ManuscriptRecordSchema = z.object({
  id: z.string(), title: z.string(), subtitle: z.string().nullable(),
  status: z.string(), betaMode: BetaModeSchema, maxBetaReaders: z.number().nullable(),
  seriesName: z.string().nullable(), seriesNumber: z.number().nullable(),
  genre: z.string().nullable(), subgenre: z.string().nullable(),
  description: z.string().nullable(), targetAudience: z.string().nullable(),
  contentRating: z.string().nullable(), contentWarnings: z.array(z.string()),
  keywords: z.string().nullable(),
  isbnEbook: z.string().nullable(), isbnPrint: z.string().nullable(),
  isbnPending: z.boolean(), priceEbook: z.string().nullable(),
  pricePaperback: z.string().nullable(), language: z.string(),
  estimatedPages: z.number().nullable(), spineColor: z.string(),
  coverUrl: z.string().nullable(), readerInstructions: z.string().nullable(),
  authorId: z.string(), createdAt: z.string(), updatedAt: z.string(),
});
export type ManuscriptRecord = z.infer<typeof ManuscriptRecordSchema>;

export const NotificationRecordSchema = z.object({
  id: z.string(), type: z.string(), stage: z.string(), message: z.string(),
  status: z.string(), scheduledAt: z.string(),
});
export type NotificationRecord = z.infer<typeof NotificationRecordSchema>;

export const DispatchRecordSchema = z.object({
  id: z.string(), issue: z.string(), subject: z.string(), body: z.string(),
  recipients: z.string(), status: z.string(),
  sentAt: z.string().nullable(), createdAt: z.string(),
});
export type DispatchRecord = z.infer<typeof DispatchRecordSchema>;

export const SubscriberRecordSchema = z.object({
  id: z.string(), email: z.string(), name: z.string(), location: z.string(),
  segment: z.string(), joinedAt: z.string(),
});
export type SubscriberRecord = z.infer<typeof SubscriberRecordSchema>;

export const AuthorRecordSchema = z.object({
  id: z.string(), name: z.string(), bio: z.string().nullable(),
  location: z.string().nullable(), genres: z.string().nullable(),
  writingProcess: z.string().nullable(), createdAt: z.string(),
  featuredManuscriptId: z.string().nullable().optional(),
  manuscripts: z.array(z.object({
    id: z.string(), title: z.string(),
    genre: z.string().nullable().optional(),
    subgenre: z.string().nullable().optional(),
    wordCount: z.number().optional(),
    status: z.string().optional(),
    createdAt: z.string().optional(),
    description: z.string().nullable().optional(),
    betaMode: z.string().optional(),
  })),
  authorQa: z.array(z.object({
    id: z.string(), question: z.string(),
    answer: z.string().nullable(), publishedAt: z.string().nullable(),
  })),
});
export type AuthorRecord = z.infer<typeof AuthorRecordSchema>;

export const DashboardStatsSchema = z.object({
  totalWords: z.number(), betaReaderTotal: z.number(), betaReadersComplete: z.number(),
  subscriberCount: z.number(), sentDispatchCount: z.number(),
  orderCount: z.number(), productCount: z.number(),
  manuscripts: z.array(z.object({
    id: z.string(), title: z.string(), status: z.string(),
    wordCount: z.number(), betaReaderCount: z.number(),
  })),
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const BetaReaderRecordSchema = z.object({
  id: z.string(), name: z.string(), email: z.string(),
  progress: z.number(), verdict: z.string().nullable(), notesCount: z.number(),
  joinedAt: z.string(), lastSeenAt: z.string().nullable(), manuscriptId: z.string(),
});
export type BetaReaderRecord = z.infer<typeof BetaReaderRecordSchema>;

export const BrowseRecordSchema = z.object({
  id: z.string(), title: z.string(), subtitle: z.string().nullable(),
  genre: z.string().nullable(), subgenre: z.string().nullable(),
  description: z.string().nullable(), keywords: z.string().nullable(),
  status: z.string(), wordCount: z.number(),
  estimatedPages: z.number().nullable(), contentRating: z.string().nullable(),
  contentWarnings: z.array(z.string()),
  betaMode: BetaModeSchema, maxBetaReaders: z.number().nullable(),
  readerCount: z.number(), pendingRequest: z.boolean(), isEnrolled: z.boolean(),
  author: z.object({ id: z.string(), name: z.string() }),
});
export type BrowseRecord = z.infer<typeof BrowseRecordSchema>;

export const BetaRequestRecordSchema = z.object({
  id: z.string(), manuscriptId: z.string(), userId: z.string(),
  note: z.string().nullable(), status: BetaRequestStatusSchema,
  createdAt: z.string(), decidedAt: z.string().nullable(),
  user: z.object({ id: z.string(), name: z.string() }),
});
export type BetaRequestRecord = z.infer<typeof BetaRequestRecordSchema>;

export const PatchBetaRequestSchema = z.object({
  status: z.enum(['APPROVED', 'DECLINED']),
});
export type PatchBetaRequestInput = z.infer<typeof PatchBetaRequestSchema>;

export const ChannelRecordSchema = z.object({
  id: z.string(), name: z.string(), kind: z.string(), status: z.string(),
  sku: z.string().nullable(), royalty: z.string().nullable(), copiesSold: z.number(),
  listPrice: z.number().nullable(), formats: z.string(),
});
export type ChannelRecord = z.infer<typeof ChannelRecordSchema>;

export const OrderRecordSchema = z.object({
  id: z.string(), num: z.string(), customer: z.string(), location: z.string(),
  product: z.string(), amount: z.number(), status: z.string(), notes: z.string().nullable(),
  signedRequested: z.boolean(), letterRequested: z.boolean(), digital: z.boolean(),
  addressLine1: z.string().nullable(), addressCity: z.string().nullable(),
  addressCountry: z.string().nullable(), addressPostal: z.string().nullable(),
  createdAt: z.string(),
});
export type OrderRecord = z.infer<typeof OrderRecordSchema>;

export const ProductRecordSchema = z.object({
  id: z.string(), title: z.string(), type: z.string(), price: z.number(),
  status: z.string(), featured: z.boolean(), digital: z.boolean(),
  stockCount: z.number().nullable(), manuscriptId: z.string().nullable(),
});
export type ProductRecord = z.infer<typeof ProductRecordSchema>;

export const ThreadEntrySchema = z.object({
  id: z.string(),
  authorRole: z.enum(['reader', 'writer']),
  body: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type ThreadEntry = z.infer<typeof ThreadEntrySchema>;

export const AnnotationRecordSchema = z.object({
  id: z.string(), manuscriptRef: z.string(), chapterId: z.number(), paraId: z.number(),
  selectedText: z.string(), note: z.string(),
  status: z.enum(['draft', 'submitted']),
  replies: z.array(ThreadEntrySchema),
  createdAt: z.string(),
});
export type AnnotationRecord = z.infer<typeof AnnotationRecordSchema>;

export const ImpressionPointSchema = z.object({
  id: z.string(),
  chapterNum: z.number(),
  stance: z.string(),
  createdAt: z.string(),
});
export type ImpressionPointRecord = z.infer<typeof ImpressionPointSchema>;

export const ProgressRecordSchema = z.object({
  id: z.string(), manuscriptRef: z.string(), doneChapters: z.string(),
  mood: z.string().nullable(), stars: z.number().nullable(),
  message: z.string().nullable(), submittedAt: z.string().nullable(),
});
export type ProgressRecord = z.infer<typeof ProgressRecordSchema>;

export const ReaderChapterNoteSchema = z.object({
  id:            z.string(),
  chapterNum:    z.number(),
  body:          z.string(),
  status:        z.string(),
  createdAt:     z.string(),
});
export type ReaderChapterNoteRecord = z.infer<typeof ReaderChapterNoteSchema>;

export const AuthorReaderChapterNoteSchema = z.object({
  id:            z.string(),
  chapterNum:    z.number(),
  body:          z.string(),
  readerName:    z.string(),
  createdAt:     z.string(),
});
export type AuthorReaderChapterNoteRecord = z.infer<typeof AuthorReaderChapterNoteSchema>;

export const UpsertReaderChapterNoteSchema = z.object({
  body: z.string(),
});

// SettingsPayload doubles as the request schema for PUT /api/storefront/settings
export const SettingsPayloadSchema = z.object({
  shopName: z.string().optional(), shopSlug: z.string().optional(),
  shopTagline: z.string().optional(), shipsFrom: z.string().optional(),
  notifPerOrder: z.boolean().optional(), notifDigest: z.boolean().optional(),
  webhookUrl: z.string().optional(),
  collectVat: z.boolean().optional(), iossNumber: z.string().optional(),
  ukVatNumber: z.string().optional(), lowStockAt: z.number().optional(),
  emailTemplate: z.string().optional(), packingTemplate: z.string().optional(),
  letterTemplate: z.string().optional(), refundPolicy: z.string().optional(),
  returnWindow: z.number().optional(), returnShipping: z.string().optional(),
  digitalRefunds: z.boolean().optional(),
});
export type SettingsPayload = z.infer<typeof SettingsPayloadSchema>;

// ─── Reader profile ───────────────────────────────────────────────────────────

export const ReaderProfileRecordSchema = z.object({
  name:              z.string(),
  bio:               z.string().nullable(),
  location:          z.string().nullable(),
  genres:            z.string().nullable(),
  availableForReads: z.boolean(),
  avatarUrl:         z.string().nullable(),
});
export type ReaderProfileRecord = z.infer<typeof ReaderProfileRecordSchema>;

export const PatchReaderProfileSchema = z.object({
  name:              z.string().min(1).max(60).optional(),
  bio:               z.string().max(500).nullable().optional(),
  location:          z.string().max(80).nullable().optional(),
  genres:            z.string().nullable().optional(),
  availableForReads: z.boolean().optional(),
  avatarUrl:         z.string().nullable().optional(),
});
export type PatchReaderProfilePayload = z.infer<typeof PatchReaderProfileSchema>;

// ─── Request body schemas ─────────────────────────────────────────────────────

// Manuscripts
export const CreateManuscriptSchema = z.object({
  id: z.string().nullish(),
  title: z.string().min(1, 'title is required'),
  subtitle: z.string().nullish(),
  status: z.string().nullish(),
  betaMode: BetaModeSchema.nullish(),
  maxBetaReaders: z.number().int().positive().nullish(),
  seriesName: z.string().nullish(), seriesNumber: z.number().int().nullish(),
  genre: z.string().nullish(), subgenre: z.string().nullish(),
  description: z.string().nullish(), targetAudience: z.string().nullish(),
  contentRating: z.string().nullish(), contentWarnings: z.array(z.string()).nullish(),
  keywords: z.string().nullish(),
  isbnEbook: z.string().nullish(), isbnPrint: z.string().nullish(),
  isbnPending: z.boolean().nullish(),
  priceEbook: z.string().nullish(), pricePaperback: z.string().nullish(),
  language: z.string().nullish(),
  estimatedPages: z.number().int().nullish(),
  spineColor: z.string().nullish(), coverUrl: z.string().nullish(),
  readerInstructions: z.string().nullish(),
});
export type CreateManuscriptInput = z.infer<typeof CreateManuscriptSchema>;
export const UpdateManuscriptSchema = CreateManuscriptSchema.partial();
export type UpdateManuscriptInput = z.infer<typeof UpdateManuscriptSchema>;

// Beta enrollment
export const JoinBetaRequestSchema = z.object({
  note: z.string().max(500).optional(),
});
export type JoinBetaRequestInput = z.infer<typeof JoinBetaRequestSchema>;

// Dispatches
export const CreateDispatchSchema = z.object({
  issue: z.string().optional(),
  subject: z.string().min(1, 'subject is required'),
  body: z.string().optional(), recipients: z.string().optional(),
  status: z.string().optional(), sentAt: z.string().optional(),
});
export type CreateDispatchInput = z.infer<typeof CreateDispatchSchema>;
export const PatchDispatchSchema = z.object({
  subject: z.string().min(1).optional(),
  body: z.string().optional(), recipients: z.string().optional(),
  status: z.string().optional(), sentAt: z.string().optional(),
});
export type PatchDispatchInput = z.infer<typeof PatchDispatchSchema>;

// Subscribers
export const CreateSubscriberSchema = z.object({
  email: z.string().email('must be a valid email address'),
  name: z.string().optional(), location: z.string().optional(), segment: z.string().optional(),
});
export type CreateSubscriberInput = z.infer<typeof CreateSubscriberSchema>;
export const PatchSubscriberSchema = z.object({
  segment: z.string().min(1, 'segment is required'),
});
export type PatchSubscriberInput = z.infer<typeof PatchSubscriberSchema>;

// Distribution channels
export const CreateChannelSchema = z.object({
  name: z.string().min(1, 'name is required'),
  kind: z.string().min(1, 'kind is required'),
  status: z.string().optional(), sku: z.string().optional(),
  royalty: z.string().optional(), listPrice: z.number().optional(),
  formats: z.array(z.string()).optional(),
});
export type CreateChannelInput = z.infer<typeof CreateChannelSchema>;
export const PatchChannelSchema = z.object({
  status: z.string().optional(), sku: z.string().optional(),
  royalty: z.string().optional(), listPrice: z.number().optional(),
  formats: z.array(z.string()).optional(),
});
export type PatchChannelInput = z.infer<typeof PatchChannelSchema>;

// Orders
export const CreateOrderSchema = z.object({
  num: z.string().optional(),
  customer: z.string().min(1, 'customer is required'),
  location: z.string().optional(),
  product: z.string().min(1, 'product is required'),
  amount: z.number({ required_error: 'amount is required' }),
  status: z.string().optional(), notes: z.string().optional(),
  signedRequested: z.boolean().optional(), letterRequested: z.boolean().optional(),
  digital: z.boolean().optional(),
  addressLine1: z.string().optional(), addressCity: z.string().optional(),
  addressCountry: z.string().optional(), addressPostal: z.string().optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export const PatchOrderSchema = z.object({
  status: z.string().min(1, 'status is required'),
});
export type PatchOrderInput = z.infer<typeof PatchOrderSchema>;

// Products
export const CreateProductSchema = z.object({
  title: z.string().min(1, 'title is required'),
  type: z.string().min(1, 'type is required'),
  price: z.number({ required_error: 'price is required' }),
  status: z.string().optional(), featured: z.boolean().optional(),
  digital: z.boolean().optional(),
  stockCount: z.number().int().nullable().optional(),
  manuscriptId: z.string().nullable().optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// Reading progress
export const PatchProgressSchema = z.object({
  doneChapters: z.array(z.number().int()).optional(),
  mood: z.string().optional(),
  stars: z.number().int().min(1).max(5).optional(),
  message: z.string().optional(),
  submittedAt: z.string().nullable().optional(),
});
export type PatchProgressInput = z.infer<typeof PatchProgressSchema>;

// Annotations
export const CreateAnnotationSchema = z.object({
  chapterId: z.number().int(),
  paraId: z.number().int(),
  selectedText: z.string().min(1, 'selectedText is required'),
  note: z.string().optional(),
});
export type CreateAnnotationInput = z.infer<typeof CreateAnnotationSchema>;
export const PatchAnnotationSchema = z.object({
  note: z.string().optional(),
});
export type PatchAnnotationInput = z.infer<typeof PatchAnnotationSchema>;

export const CreateReplySchema = z.object({
  body: z.string().min(1, 'body is required'),
  authorRole: z.enum(['reader', 'writer']),
});
export type CreateReplyInput = z.infer<typeof CreateReplySchema>;

export const UpsertImpressionSchema = z.object({
  stance: z.enum(['Enthralled', 'Engaged', 'Curious', 'Drifting', 'Lost']),
});
export type UpsertImpressionInput = z.infer<typeof UpsertImpressionSchema>;

// Notifications
export const PatchNotificationSchema = z.object({
  status: z.enum(['SENT', 'DISMISSED']),
});
export type PatchNotificationInput = z.infer<typeof PatchNotificationSchema>;

// Author Q&A
export const SubmitQuestionSchema = z.object({
  question: z.string().min(1, 'question is required'),
});
export type SubmitQuestionInput = z.infer<typeof SubmitQuestionSchema>;
export const PatchQuestionSchema = z.object({
  answer: z.string().optional(),
  dismiss: z.boolean().optional(),
});
export type PatchQuestionInput = z.infer<typeof PatchQuestionSchema>;

// Chapter notes
export const ChapterNoteSchema = z.object({
  id: z.string(), chapterId: z.string(),
  anchor: z.string().nullable(), body: z.string(),
  status: z.enum(['ACTIVE', 'ARCHIVED']),
  createdAt: z.string(), updatedAt: z.string(),
});
export type ChapterNote = z.infer<typeof ChapterNoteSchema>;

export const CreateChapterNoteSchema = z.object({
  body: z.string().min(1, 'body is required'),
  anchor: z.string().optional(),
  chapterTitle: z.string().optional(),
});
export type CreateChapterNoteInput = z.infer<typeof CreateChapterNoteSchema>;

export const UpdateChapterNoteSchema = z.object({
  body: z.string().min(1).optional(),
  anchor: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});
export type UpdateChapterNoteInput = z.infer<typeof UpdateChapterNoteSchema>;

// ─── Dashboard V2 ─────────────────────────────────────────────────────────────

export const DashboardV2BetaReaderSchema = z.object({
  id: z.string(),
  name: z.string(),
  progress: z.number(),
  verdict: z.string().nullable(),
  notesCount: z.number(),
  joinedAt: z.string(),
  lastSeenAt: z.string().nullable(),
});

export const DashboardV2ManuscriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  status: z.enum(['DRAFTING', 'IN_REVISION', 'PUBLISHED']),
  wordCount: z.number(),
  updatedAt: z.string(),
  betaReaders: z.array(DashboardV2BetaReaderSchema),
  chapterCount: z.number(),
  hotspotChapters: z.array(z.object({ chapterId: z.number(), annotationCount: z.number() })),
});

export const DashboardV2ActiveReadSchema = z.object({
  betaReaderId: z.string(),
  manuscriptId: z.string(),
  manuscriptTitle: z.string(),
  authorName: z.string(),
  authorId: z.string(),
  progress: z.number(),
  notesCount: z.number(),
  joinedAt: z.string(),
  lastSeenAt: z.string().nullable(),
  chapterCount: z.number(),
  myAnnotations: z.array(z.object({ chapterId: z.number(), count: z.number() })),
  recentAuthorNotes: z.array(z.object({
    chapterNum: z.number(),
    chapterTitle: z.string(),
    body: z.string(),
    updatedAt: z.string(),
  })),
});

export const DashboardV2Schema = z.object({
  writing: z.object({
    manuscripts: z.array(DashboardV2ManuscriptSchema),
    subscriberCount: z.number(),
    orderCount: z.number(),
    unrepliedQaCount: z.number(),
  }),
  reading: z.object({
    activeBetaReads: z.array(DashboardV2ActiveReadSchema),
  }),
});
export type DashboardV2 = z.infer<typeof DashboardV2Schema>;
export type DashboardV2Manuscript = z.infer<typeof DashboardV2ManuscriptSchema>;
export type DashboardV2ActiveRead = z.infer<typeof DashboardV2ActiveReadSchema>;

// ─── Admin ────────────────────────────────────────────────────────────────────

export const AdminUserRecordSchema = z.object({
  id: z.string(), name: z.string(), email: z.string(),
  isAdmin: z.boolean(), status: z.string(), role: z.string(),
  lastLoginAt: z.string().nullable(), createdAt: z.string(),
});
export type AdminUserRecord = z.infer<typeof AdminUserRecordSchema>;

export const InviteRecordSchema = z.object({
  id: z.string(), email: z.string(), token: z.string(),
  expiresAt: z.string(), usedAt: z.string().nullable(),
  invitedBy: z.object({ name: z.string(), email: z.string() }),
  createdAt: z.string(),
  devInviteLink: z.string().optional(),
});
export type InviteRecord = z.infer<typeof InviteRecordSchema>;

export const PatchAdminUserSchema = z.object({
  name:  z.string().min(1).optional(),
  email: z.string().email().optional(),
});
export type PatchAdminUserInput = z.infer<typeof PatchAdminUserSchema>;

export const InviteUserSchema = z.object({
  email: z.string().email('must be a valid email address'),
});
export type InviteUserInput = z.infer<typeof InviteUserSchema>;

// ─── Reading Hub ─────────────────────────────────────────────────────────────

export const AddToShelfSchema = z.object({
  manuscriptRef:           z.string().min(1),
  source:                  z.enum(['self_saved', 'recommended_algo', 'recommended_editorial', 'recommended_circle']),
  recommendationDimension: z.string().optional(),
});
export type AddToShelfInput = z.infer<typeof AddToShelfSchema>;

export const FinishReadingSchema = z.object({
  verdict: z.string().min(1),
});
export type FinishReadingInput = z.infer<typeof FinishReadingSchema>;

export const DismissRecommendationSchema = z.object({
  manuscriptRef: z.string().nullable(),
  tier:          z.number().int().min(1).max(5),
});
export type DismissRecommendationInput = z.infer<typeof DismissRecommendationSchema>;

export interface HubWarmItem {
  manuscriptRef:   string;
  title:           string | null;
  authorName:      string | null;
  draftLabel:      string | null;
  genre:           string | null;
  totalChapters:   number;
  doneChapters:    number[];
  mood:            string | null;
  lastOpenedAt:    string | null;
  lastActivityAt:  string | null;
  isDormant:       boolean;
  newChapterCount: number;
  newNoteCount:    number;
  newAuthorNote:   { chapterNum: number; authorFirstName: string; body: string } | null;
}

export interface HubShelfItem {
  manuscriptRef:           string;
  title:                   string | null;
  authorName:              string | null;
  genre:                   string | null;
  totalChapters:           number;
  draftLabel:              string | null;
  source:                  string;
  recommendationDimension: string | null;
  circleCount:             number | null;
}

export interface HubFinishedItem {
  manuscriptRef: string;
  title:         string | null;
  authorName:    string | null;
  finishedAt:    string;
  verdict:       string | null;
  impression:    string | null;
  totalChapters: number;
}

export interface HubFollowingAuthor {
  id:           string;
  name:         string;
  activityType: 'chapter_shipped' | 'new_manuscript' | 'next_book_est' | 'no_activity';
  activityMeta: string | null;
}

export interface HubRailItem {
  category: 'editorial_pick' | 'from_circle' | 'nudge';
  body:     string;
}

export interface HubRecommendation {
  tier:          number;
  manuscriptRef: string | null;
  label:         string;
  action:        string;
  actionVerb:    string;
}

export interface HubResponse {
  warm:             HubWarmItem[];
  shelf:            HubShelfItem[];
  finished:         HubFinishedItem[];
  finishedAllTime:  number;
  finishedThisSeason: number;
  houseSuggests:    HubRecommendation | null;
  followingAuthors: HubFollowingAuthor[];
  houseRail:        HubRailItem[];
  readerProfile:    'new' | 'returning' | 'all_caught_up';
}
