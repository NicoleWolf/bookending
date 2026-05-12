import { useState, useEffect, useRef } from 'react';
import styles from './Landing.module.css';

interface LandingProps {
  onEnter:  () => void;
  onLogin?: () => void;
}

export default function Landing({ onEnter, onLogin }: LandingProps) {
  const [role,     setRole]     = useState<'writer' | 'reader'>('writer');
  const [signedUp, setSignedUp] = useState(false);
  const landingRef = useRef<HTMLDivElement>(null);
  const signupRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = landingRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
      { threshold: 0.1 },
    );
    root.querySelectorAll(`.${styles.reveal}`).forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function scrollToSignup(e: React.FormEvent) {
    e.preventDefault();
    signupRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className={styles.landing} ref={landingRef}>
      <div className={styles.bgTexture} aria-hidden="true" />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroEyebrow}>A home for self-publishers · And the readers who find them</div>
          <h1 className={styles.heroTitle}>
            The publishing journey was never meant<br />
            to be walked <em className={styles.heroEm}>alone.</em>
          </h1>
          <p className={styles.heroSub}>
            Bookending brings writers and readers together at every stage — from the first uncertain draft
            to the book in someone's hands. Community, tools, and a path through, all in one place.
          </p>
          <form className={styles.heroForm} onSubmit={scrollToSignup}>
            <input type="email" placeholder="your@email.com" className={styles.heroInput} required />
            <button type="submit" className={styles.btnPrimary}>Join the early list</button>
          </form>

          <svg className={styles.heroDecoration} viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
            <path d="M20 60 Q100 40 100 60 L100 200 Q100 180 20 200 Z" stroke="#8b3a2f" strokeWidth="1.2" fill="rgba(255,255,255,0.2)" />
            <path d="M180 60 Q100 40 100 60 L100 200 Q100 180 180 200 Z" stroke="#8b3a2f" strokeWidth="1.2" fill="rgba(255,255,255,0.2)" />
            <line x1="35" y1="80"  x2="90"  y2="72"  stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
            <line x1="35" y1="95"  x2="90"  y2="87"  stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
            <line x1="35" y1="110" x2="85"  y2="102" stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
            <line x1="35" y1="125" x2="90"  y2="117" stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
            <line x1="110" y1="72"  x2="165" y2="80"  stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
            <line x1="110" y1="87"  x2="165" y2="95"  stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
            <line x1="110" y1="102" x2="160" y2="110" stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
            <line x1="110" y1="117" x2="165" y2="125" stroke="#8b3a2f" strokeWidth="0.6" opacity="0.5" />
          </svg>
        </div>
      </section>

      <div className={styles.ornament}><span>❦</span></div>

      {/* ── Promise ───────────────────────────────────────────────────── */}
      <section className={`${styles.promise} ${styles.reveal}`} id="promise">
        <div className={styles.container}>
          <div className={styles.promiseEyebrow}>Our belief</div>
          <p className={styles.promisePara}>
            Self-publishing has always been the brave choice — and the lonely one.
            We don't think it has to be both. The right people, at the right moments,
            change <em className={styles.promiseEm}>everything.</em>
          </p>
          <div className={styles.promiseSignature}>— a small note from the team</div>
        </div>
      </section>

      {/* ── Audiences ─────────────────────────────────────────────────── */}
      <section className={`${styles.audiences} ${styles.reveal}`}>
        <div className={styles.container}>
          <div className={styles.audienceGrid}>
            <div className={styles.audience}>
              <div className={styles.audienceTag}>For writers</div>
              <h3 className={styles.audienceTitle}>A workroom with the <em className={styles.audienceEm}>door open.</em></h3>
              <p className={styles.audiencePara}>
                Tools that carry you from manuscript to published book — and a community of writers and readers walking alongside.
              </p>
              <ul className={styles.audienceList}>
                {['Critique groups matched to your genre', 'Beta readers who actually finish', 'Publishing tools that don\'t get in the way', 'A reader audience built before launch day'].map(item => (
                  <li key={item} className={styles.audienceItem}>{item}</li>
                ))}
              </ul>
            </div>

            <div className={styles.audienceDivider} aria-hidden="true" />

            <div className={styles.audience}>
              <div className={styles.audienceTag}>For readers</div>
              <h3 className={styles.audienceTitle}>The book before <em className={styles.audienceEm}>everyone else.</em></h3>
              <p className={styles.audiencePara}>
                Find authors at the start, not the finish. Read works-in-progress, shape what they become, and stay close after launch.
              </p>
              <ul className={styles.audienceList}>
                {['Discover indie authors before the world does', 'Early access to chapters and ARCs', 'A real relationship with the writers you love', 'Genres, circles, and quiet corners to find your people'].map(item => (
                  <li key={item} className={styles.audienceItem}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Journey ───────────────────────────────────────────────────── */}
      <section className={`${styles.journey} ${styles.reveal}`} id="journey">
        <div className={styles.journeyInner}>
          <div className={styles.journeyHeader}>
            <div className={styles.journeyEyebrow}>The arc</div>
            <h2 className={styles.journeyTitle}>
              Every book is a <em className={styles.journeyEm}>journey.</em><br />
              Bookending walks it with you.
            </h2>
          </div>
          <div className={styles.stages}>
            {[
              { num: 'i',   title: 'Draft',   body: 'The blank page. Critique partners, writing circles, and the quiet work of finding your story.' },
              { num: 'ii',  title: 'Refine',  body: 'Beta readers who care. Feedback that lands. The slow polish from rough to ready.' },
              { num: 'iii', title: 'Publish', body: 'Print, distribution, and the small thousand details — handled, so you can keep your head in the work.' },
              { num: 'iv',  title: 'Connect', body: 'Launch into a readership that\'s already been waiting. And keep the conversation going long after.' },
            ].map(s => (
              <div key={s.num} className={styles.stage}>
                <div className={styles.stageNum}>{s.num}</div>
                <h4 className={styles.stageTitle}>{s.title}</h4>
                <p className={styles.stageBody}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ───────────────────────────────────────────────── */}
      <section className={`${styles.testimony} ${styles.reveal}`}>
        <div className={styles.container}>
          <div className={styles.quoteMark}>"</div>
          <blockquote className={styles.quote}>
            I stopped feeling like I was shouting into a void. For the first time, the people who would eventually read my book were already part of it.
          </blockquote>
          <div className={styles.attribution}>
            <strong className={styles.attributionName}>Maren Ellis</strong>
            {' · '}Author, <em>The Glassmaker's Daughter</em>
          </div>
        </div>
      </section>

      <div className={styles.ornament}><span>❦</span></div>

      {/* ── Signup ────────────────────────────────────────────────────── */}
      <section className={`${styles.signup} ${styles.reveal}`} id="signup" ref={signupRef}>
        <div className={styles.container}>
          <div className={styles.signupCard}>
            {signedUp ? (
              <>
                <h2 className={styles.signupTitle}>Welcome, <em className={styles.signupEm}>friend.</em></h2>
                <p className={`${styles.signupPara} ${styles.signupParaMt}`}>
                  We've got you down as a <strong className={styles.roleHighlight}>{role}</strong>. We'll write soon.
                </p>
                <div className={styles.signupTeam}>— The Bookending team</div>
              </>
            ) : (
              <>
                <h2 className={styles.signupTitle}>Find your <em className={styles.signupEm}>company</em><br />on the page.</h2>
                <p className={styles.signupPara}>We're opening the doors slowly. Tell us who you are and we'll save you a seat.</p>

                <div className={styles.roleToggle}>
                  <button
                    className={styles.roleBtn}
                    data-active={role === 'writer' ? 'true' : undefined}
                    onClick={() => setRole('writer')}
                  >I'm a writer</button>
                  <button
                    className={styles.roleBtn}
                    data-active={role === 'reader' ? 'true' : undefined}
                    onClick={() => setRole('reader')}
                  >I'm a reader</button>
                </div>

                <form
                  className={styles.signupForm}
                  onSubmit={e => { e.preventDefault(); setSignedUp(true); }}
                >
                  <input type="email" placeholder="your@email.com" className={styles.signupInput} required />
                  <button type="submit" className={styles.btnPrimary}>Save my seat</button>
                </form>

                <div className={styles.signupFineprint}>No spam. No noise. A short note when there's something worth saying.</div>

                <div className={styles.signupAlt}>
                  Already have an account?{' '}
                  <button className={styles.signupSignInLink} onClick={onLogin ?? onEnter}>Sign in</button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>Book<em className={styles.footerBrandEm}>ending</em></div>
            <div className={styles.footerLinks}>
              {['About', 'Writers', 'Readers', 'Journal', 'Contact'].map(l => (
                <a key={l} href="#" className={styles.footerLink}>{l}</a>
              ))}
            </div>
            <div className={styles.footerCopy}>© 2026 Bookending</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
