import { useState, useEffect, useRef } from 'react';
import { DEMO_LISTING } from './data';
import styles from './BookListingPage.module.css';

interface Props {
  bookId:    string;
  onBack:    () => void;
  isAuthor?: boolean;
}

function starStr(n: number): string {
  return '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function BookListingPage({ onBack, isAuthor = false }: Props) {
  const backRef = useRef<HTMLButtonElement>(null);
  const listing = DEMO_LISTING;

  const [pinnedIds,     setPinnedIds]     = useState<Set<string>>(
    () => new Set(listing.reviews.filter(r => r.featured).map(r => r.id))
  );
  const [reviewStars,   setReviewStars]   = useState(0);
  const [reviewBody,    setReviewBody]    = useState('');
  const [submitState,   setSubmitState]   = useState<'idle' | 'done'>('idle');

  useEffect(() => { backRef.current?.focus(); }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onBack();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onBack]);

  function togglePin(id: string) {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function submitReview() {
    if (!reviewStars || !reviewBody.trim()) return;
    setSubmitState('done');
  }

  const featuredReviews = listing.reviews.filter(r => pinnedIds.has(r.id));
  const allReviews      = listing.reviews;
  const avgRating = allReviews.length
    ? allReviews.reduce((s, r) => s + r.stars, 0) / allReviews.length
    : 0;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`${listing.title} — book listing`}>
      <div className={styles.page}>

        <button ref={backRef} className={styles.back} onClick={onBack} type="button">
          <span aria-hidden="true">←</span> Back
        </button>

        {/* ── Hero ── */}
        <div className={styles.hero}>
          <div className={styles.cover} aria-hidden="true">
            {listing.coverUrl
              ? <img src={listing.coverUrl} alt="" className={styles.coverImg} />
              : <div className={styles.coverPlaceholder} />
            }
          </div>

          <div className={styles.meta}>
            <div className={`label ${styles.metaGenre}`}>{listing.genre}</div>
            <h1 className={`serif ${styles.metaTitle}`}>{listing.title}</h1>
            <div className={styles.metaAuthor}>by {listing.authorName}</div>
            <p className={`serif ${styles.metaBlurb}`}>{listing.blurb}</p>
            <div className={`serif ${styles.metaPrice}`}>${listing.price.toFixed(2)}</div>
            <div className={`label ${styles.metaEdition}`}>{listing.edition}</div>
            <div className={styles.ctaRow}>
              <button className={styles.ctaBuy} type="button">
                Add to shelf <span aria-hidden="true">→</span>
              </button>
              <button className={styles.ctaSecondary} type="button">Gift this book</button>
            </div>
          </div>
        </div>

        {/* ── Author note ── */}
        <div className={styles.section}>
          <div className={`label ${styles.sectionLabel}`}>A note from the author</div>
          <blockquote className={`serif ${styles.authorNote}`}>
            {listing.authorNote}
          </blockquote>
        </div>

        {/* ── Featured reviews (pinned by author) ── */}
        {featuredReviews.length > 0 && (
          <div className={styles.section}>
            <div className={`label ${styles.sectionLabel}`}>
              What readers are saying
              {isAuthor && (
                <span className={styles.authorHint}> — click any review below to pin or unpin</span>
              )}
            </div>
            <div className={styles.featuredGrid}>
              {featuredReviews.map(r => (
                <div key={r.id} className={styles.featuredCard}>
                  <div className={styles.featuredStars} aria-label={`${r.stars} out of 5 stars`}>
                    {starStr(r.stars)}
                  </div>
                  <p className={`serif ${styles.featuredBody}`}>&ldquo;{r.body}&rdquo;</p>
                  <div className={styles.featuredByline}>
                    <span>{r.readerName} · {fmtDate(r.submittedAt)}</span>
                    {isAuthor && (
                      <button
                        className={styles.pinBtn}
                        data-pinned=""
                        type="button"
                        onClick={() => togglePin(r.id)}
                        aria-label={`Unpin review by ${r.readerName}`}
                      >
                        Unpin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── All reviews ── */}
        <div className={styles.section}>
          <div className={styles.reviewStats}>
            {allReviews.length > 0 ? (
              <>
                <span className={`serif ${styles.avgNum}`}>{avgRating.toFixed(1)}</span>
                <span className={styles.avgStars} aria-hidden="true">{starStr(avgRating)}</span>
                <span className={`label ${styles.reviewCount}`}>{allReviews.length} reviews</span>
              </>
            ) : (
              <span className={`label ${styles.reviewCount}`}>No reviews yet</span>
            )}
          </div>

          {allReviews.length === 0 ? (
            <div className={styles.emptyReviews} role="status">
              <p className={`serif ${styles.emptyHeadline}`}>Be the first to review.</p>
              <p className={styles.emptyBody}>
                Share your thoughts — your review helps other readers decide.
              </p>
            </div>
          ) : (
            <div className={styles.reviewList}>
              {allReviews.map(r => (
                <div
                  key={r.id}
                  className={styles.reviewCard}
                  data-featured={pinnedIds.has(r.id) ? '' : undefined}
                >
                  <div className={styles.reviewHead}>
                    <span
                      className={styles.reviewStars}
                      aria-label={`${r.stars} out of 5 stars`}
                    >
                      {starStr(r.stars)}
                    </span>
                    <div className={styles.reviewMeta}>
                      <span className={`label ${styles.reviewName}`}>{r.readerName}</span>
                      <span className={`label ${styles.reviewDate}`}>{fmtDate(r.submittedAt)}</span>
                      {isAuthor && (
                        <button
                          className={styles.pinBtn}
                          data-pinned={pinnedIds.has(r.id) ? '' : undefined}
                          type="button"
                          onClick={() => togglePin(r.id)}
                          aria-label={pinnedIds.has(r.id)
                            ? `Unpin review by ${r.readerName}`
                            : `Pin review by ${r.readerName} to listing`
                          }
                        >
                          {pinnedIds.has(r.id) ? 'Pinned to listing' : 'Pin to listing'}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={styles.reviewBody}>{r.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Review submission (readers only) */}
          {!isAuthor && (
            <div className={styles.submitForm}>
              <div className={`label ${styles.submitLabel}`}>Leave a review</div>
              {submitState === 'done' ? (
                <p className={`serif ${styles.submitDone}`} role="status">
                  Thank you — your review has been submitted.
                </p>
              ) : (
                <>
                  <div className={styles.starPicker} role="group" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={styles.starBtn}
                        data-lit={n <= reviewStars ? '' : undefined}
                        aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                        aria-pressed={n <= reviewStars}
                        onClick={() => setReviewStars(reviewStars === n ? 0 : n)}
                      >
                        {n <= reviewStars ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className={styles.submitTextarea}
                    placeholder="What did you think?"
                    value={reviewBody}
                    onChange={e => setReviewBody(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    aria-label="Your review"
                  />
                  <div className={styles.submitFoot}>
                    <span className={`label ${styles.charCount}`}>
                      {reviewBody.length} / 1000
                    </span>
                    <button
                      className={styles.submitBtn}
                      type="button"
                      onClick={submitReview}
                      disabled={!reviewStars || !reviewBody.trim()}
                    >
                      Submit review
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Community discussion (Q&A) ── */}
        <div className={styles.section}>
          <div className={`label ${styles.sectionLabel}`}>Community discussion</div>
          <div className={styles.qaList}>
            {listing.qa.map(q => (
              <div key={q.id} className={styles.qaItem}>
                <p className={`serif ${styles.qaQuestion}`}>Q: {q.question}</p>
                <p className={styles.qaAnswer}>{q.answer}</p>
              </div>
            ))}
          </div>
          <div className={styles.qaFoot}>
            <button className={styles.qaLink} type="button">
              See all discussion on {listing.authorName.split(' ')[0]}&apos;s profile <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
