export type Cadence = 'instant' | 'daily' | 'weekly';

export interface NotificationRow {
  key:            string;
  label:          string;
  description:    string;
  section:        'writer' | 'reader';
  defaultEmail:   boolean;
  defaultInApp:   boolean;
  cadenceOptions: Cadence[];
}

export const WRITER_ROWS: NotificationRow[] = [
  {
    key:            'threaded_margin_replies',
    label:          'Threaded margin replies',
    description:    'A reader posts a note in the margin of your manuscript, or replies to one of your replies.',
    section:        'writer',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'beta_reader_requests',
    label:          'Beta reader requests',
    description:    'Someone applies to beta-read a work you\'ve opened to applications.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'beta_reader_submissions',
    label:          'Beta reader submissions',
    description:    'A confirmed beta reader submits their pass on a chapter or full work.',
    section:        'writer',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'dispatch_performance',
    label:          'Dispatch performance',
    description:    'Summary of how your last dispatch performed — opens, replies, new subscribers.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
  {
    key:            'new_subscribers',
    label:          'New subscribers',
    description:    'Someone subscribes to your dispatches.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
  {
    key:            'writing_circle_activity',
    label:          'Writing circle activity',
    description:    'New posts, threads, or scheduled meetings in circles you belong to.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
  {
    key:            'mentorship_messages',
    label:          'Mentorship messages',
    description:    'A mentor or mentee sends you a direct message.',
    section:        'writer',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'writing_challenges',
    label:          'Writing challenges',
    description:    'Challenges you\'ve joined post updates, prompts, or results.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
  {
    key:            'reader_qa_submissions',
    label:          'Reader Q&A submissions',
    description:    'A reader submits a question via your Q&A surface.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'stance_arc_milestones',
    label:          'Stance-arc milestones',
    description:    'A reader\'s stance sparkline reaches a notable inflection on your work.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
  {
    key:            'manuscript_mentions',
    label:          'Manuscript mentions',
    description:    'Someone in the community references or links your manuscript.',
    section:        'writer',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
];

export const READER_ROWS: NotificationRow[] = [
  {
    key:            'writer_replies_to_notes',
    label:          'Writer replies to your notes',
    description:    'A writer replies to a margin note you left on their manuscript.',
    section:        'reader',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'writer_dispatches',
    label:          'Writer dispatches',
    description:    'New dispatches from writers you subscribe to.',
    section:        'reader',
    defaultEmail:   true,
    defaultInApp:   false,
    cadenceOptions: ['instant', 'daily', 'weekly'],
  },
  {
    key:            'beta_read_invitations',
    label:          'Beta read invitations',
    description:    'A writer accepts your beta-read application, or invites you directly.',
    section:        'reader',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'beta_read_deadlines',
    label:          'Beta read deadlines',
    description:    'Reminders that a beta read pass is due soon.',
    section:        'reader',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'mentorship_messages_r',
    label:          'Mentorship messages',
    description:    'A mentor or mentee sends you a direct message.',
    section:        'reader',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'qa_responses',
    label:          'Q&A responses',
    description:    'A writer responds to a question you submitted.',
    section:        'reader',
    defaultEmail:   true,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily'],
  },
  {
    key:            'reader_qa_invitations',
    label:          'Reader Q&A invitations',
    description:    'A writer you subscribe to opens a Q&A.',
    section:        'reader',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
  {
    key:            'writing_challenge_invites',
    label:          'Writing challenge invitations',
    description:    'Reader-facing challenges from writers you subscribe to.',
    section:        'reader',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['daily', 'weekly'],
  },
  {
    key:            'new_work_subscriptions',
    label:          'New work from subscriptions',
    description:    'Writers you subscribe to publish a new chapter or work.',
    section:        'reader',
    defaultEmail:   false,
    defaultInApp:   true,
    cadenceOptions: ['instant', 'daily', 'weekly'],
  },
  {
    key:            'recommended_works',
    label:          'Recommended works',
    description:    'Editorial recommendations based on your reading.',
    section:        'reader',
    defaultEmail:   false,
    defaultInApp:   false,
    cadenceOptions: ['weekly'],
  },
];

export const ALL_ROWS = [...WRITER_ROWS, ...READER_ROWS];

export const ACCOUNT_SECURITY_ROWS = [
  'New sign-in from an unrecognized device',
  'Password or email change',
  'Two-factor authentication changes',
  'Suspicious account activity',
  'Legal or terms-of-service updates that require your action',
  'Payment failures',
];
