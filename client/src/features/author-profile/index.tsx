import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { api } from '../../lib/api';
import type { AppNotification } from '../notifications/data';
import type { QAEntry, PendingQuestion } from '../author-profiles/types';
import type { AuthorProfileData } from './useAuthorProfileSave';
import { AuthorProfileEdit } from './AuthorProfileEdit';

interface ManuscriptOption {
  id: string;
  title: string;
}

interface ApiAuthorProfile {
  id:                   string;
  name:                 string;
  bio:                  string | null;
  location:             string | null;
  genres:               string | null;
  subgenres:            string | null;
  writingProcess:       string | null;
  avatarUrl:            string | null;
  featuredManuscriptId: string | null;
  showActivityPublicly: boolean;
  manuscripts:          ManuscriptOption[];
  authorQa: { id: string; question: string; answer: string | null; publishedAt: string | null }[];
}

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    // Comma-separated fallback
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  } catch {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
}

interface Props {
  onDone: () => void;
  onToast: (n: AppNotification) => void;
}

export default function AuthorProfilePage({ onDone, onToast }: Props) {
  const { currentUser } = useAuth();
  const [profile,  setProfile]  = useState<AuthorProfileData | null>(null);
  const [mss,      setMss]      = useState<ManuscriptOption[]>([]);
  const [qaList,   setQaList]   = useState<QAEntry[]>([]);
  const [pending,  setPending]  = useState<PendingQuestion[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ApiAuthorProfile>('/api/author-profile'),
      api.get<{ id: string; question: string; askedByName: string | null; createdAt: string }[]>(
        currentUser?.id ? `/api/authors/${currentUser.id}/pending-questions` : '/api/authors/me/pending-questions'
      ).catch(() => [] as { id: string; question: string; askedByName: string | null; createdAt: string }[]),
    ]).then(([ap, pqs]) => {
      const data: AuthorProfileData = {
        id:                   ap.id,
        name:                 ap.name,
        location:             ap.location,
        bio:                  ap.bio,
        writingProcess:       ap.writingProcess,
        genres:               parseJsonArray(ap.genres),
        subgenres:            parseJsonArray(ap.subgenres),
        featuredManuscriptId: ap.featuredManuscriptId,
        showActivityPublicly: ap.showActivityPublicly,
        avatarUrl:            ap.avatarUrl,
      };
      setProfile(data);
      setMss(ap.manuscripts);
      setQaList(ap.authorQa
        .filter(q => q.answer && q.publishedAt)
        .map(q => ({ id: q.id, question: q.question, answer: q.answer!, askedAt: q.publishedAt! }))
      );
      setPending(pqs.map(r => ({
        id:            r.id,
        submitterId:   '',
        submitterName: r.askedByName ?? 'Anonymous',
        question:      r.question,
        submittedAt:   r.createdAt,
      })));
    }).catch(() => {
      if (currentUser) {
        setProfile({
          id:                   currentUser.id,
          name:                 currentUser.name,
          location:             null,
          bio:                  null,
          writingProcess:       null,
          genres:               [],
          subgenres:            [],
          featuredManuscriptId: null,
          showActivityPublicly: true,
          avatarUrl:            currentUser.avatarUrl ?? null,
        });
      }
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !profile) return null;

  return (
    <AuthorProfileEdit
      profile={profile}
      manuscripts={mss}
      qaList={qaList}
      pendingQuestions={pending}
      onProfileChange={setProfile}
      onQaChange={setQaList}
      onPendingChange={setPending}
      onDone={onDone}
      onToast={onToast}
    />
  );
}
