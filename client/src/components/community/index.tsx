import { Btn } from '../atoms';
import { IconArrow } from '../icons';

const CARDS = [
  {
    kind: 'BORROWED READER',
    head: 'Jonas T. read your Ch. 14 because Naomi Aldridge vouched for him.',
    body: '"Tomás flagged the lighthouse pacing — I had the same instinct in my second book. Two suggestions in the margin."',
    who:  'Naomi A. · 4 books · sci-fi',
  },
  {
    kind: 'FAVOR · COVER CRIT',
    head: 'Three authors offered a 30-min cover critique this week.',
    body: "You've sent four critiques in the last six months — you have credit to spend. Wendy, Marc, and Asha are open Thursday.",
    who:  'Karma ledger · +4',
  },
  {
    kind: 'SHARED VENDOR',
    head: 'BookMobile (St. Paul) — vetted by 23 authors in your genre.',
    body: '"On time on the last six print runs, owner emails back same day. Use code PRESS-IND for $0.40 off per book."',
    who:  'Reviewed 23× · ★ 4.8',
  },
  {
    kind: 'OPEN INVITATION',
    head: 'Reading circle in your timezone, Tuesday 8pm PT.',
    body: 'Six authors workshopping middles this month. Bring 1,500 words; leave with three perspectives. Two seats left.',
    who:  'Hosted by Mira K.',
  },
];

export default function Community() {
  return (
    <section style={{ padding: '40px 48px 48px', background: 'var(--paper)', color: 'var(--ink)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 24 }}>
        <div>
          <div className="label" style={{ color: 'var(--ink)', opacity: 0.5, marginBottom: 8 }}>§ 05 · The Common Press · Community</div>
          <h2 className="serif" style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 46, lineHeight: 1, margin: 0, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
            Authors at your shoulder.
          </h2>
          <p className="serif" style={{ fontSize: 16, color: '#3a3530', margin: '10px 0 0', maxWidth: 520 }}>
            Other independents, working right now. Borrow a beta-reader, swap a cover critique, share a printer who didn't disappoint — built into every part of Bookending.
          </p>
        </div>
        <Btn tone="bare" icon={<IconArrow size={14} />} style={{ color: 'var(--ink)' }}>
          Open the common room
        </Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, borderTop: '1px solid #00000020' }}>
        {CARDS.map((c, i) => (
          <article key={i} style={{ padding: '24px 22px', borderRight: i < 3 ? '1px solid #00000020' : 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', color: '#00000066' }}>{c.kind}</div>
            <h3 className="serif" style={{ fontWeight: 500, fontSize: 19, lineHeight: 1.22, margin: 0, color: 'var(--ink)', letterSpacing: '-0.005em' }}>{c.head}</h3>
            <p className="serif" style={{ fontStyle: 'italic', fontSize: 14, lineHeight: 1.45, margin: 0, color: '#3a3530', flex: 1 }}>{c.body}</p>
            <div style={{ borderTop: '1px solid #00000020', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: '#00000088', textTransform: 'uppercase' }}>{c.who}</span>
              <button style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 3 }}>Accept ↗</button>
            </div>
          </article>
        ))}
      </div>

      {/* Karma footer */}
      <div style={{ marginTop: 28, padding: '18px 22px', background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span className="label" style={{ color: 'var(--muted)' }}>Your karma ledger</span>
          <span className="serif" style={{ fontStyle: 'italic', fontSize: 22 }}>+12</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>· 4 critiques given · 2 vendors reviewed · 1 reader vouched</span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em' }}>SPEND IT, DON'T SAVE IT</span>
      </div>
    </section>
  );
}
