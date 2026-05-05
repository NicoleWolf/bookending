// Audience panel — mailing list, the long-term relationship.

const Audience = () => {
  const list = [
    {seg:'Devout — letter every issue', pct:0.42, n:1284, color:'var(--accent)'},
    {seg:'Warm — opens half', pct:0.31, n:947, color:'var(--paper)'},
    {seg:'Cool — drifting', pct:0.19, n:580, color:'var(--muted)'},
    {seg:'New — last 30 days', pct:0.08, n:244, color:'var(--accent-2)'},
  ];

  return (
    <section style={{padding:'40px 48px', borderBottom:'1px solid var(--rule)'}}>
      <SectionHead
        eyebrow="§ 04 · Audience · The Margin Letter"
        title="Your readers, gathered"
        kicker="3,055 readers, sorted not by data points but by how they read."
      >
        <Btn tone="ghost">Drafts · 2</Btn>
        <Btn tone="primary" icon={<IconArrow size={14}/>}>Compose letter</Btn>
      </SectionHead>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1.1fr', gap:0, border:'1px solid var(--rule)'}}>

        {/* Subscribers */}
        <div style={{padding:28, borderRight:'1px solid var(--rule)'}}>
          <div className="label" style={{marginBottom:14}}>Total subscribers</div>
          <div className="serif" style={{fontSize:74, fontWeight:300, lineHeight:1, letterSpacing:'-0.025em'}}>3,055</div>
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12, marginBottom:24}}>
            <Pill tone="good">+244 in 30d</Pill>
            <span className="mono" style={{fontSize:10.5, color:'var(--muted)', letterSpacing:'0.06em'}}>· 1.4% churn</span>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {list.map((s,i)=>(
              <div key={i}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:5}}>
                  <span style={{fontSize:12, fontWeight:500}}>{s.seg}</span>
                  <span className="mono" style={{fontSize:11, color:'var(--muted)'}}>{s.n.toLocaleString()}</span>
                </div>
                <div style={{height:3, background:'var(--rule)', position:'relative'}}>
                  <div style={{position:'absolute', inset:0, width:`${s.pct*100}%`, background:s.color}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last letter */}
        <div style={{padding:28, borderRight:'1px solid var(--rule)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <div className="label">Last letter sent</div>
            <span className="mono" style={{fontSize:10.5, color:'var(--muted)', letterSpacing:'0.06em'}}>26 APR · ISSUE №47</span>
          </div>
          <h3 className="serif" style={{
            fontFamily:'var(--serif)', fontStyle:'italic', fontWeight:400, fontSize:26,
            lineHeight:1.18, margin:'0 0 18px', letterSpacing:'-0.005em', textWrap:'balance'
          }}>On finishing the second draft &mdash; and the small grief of it</h3>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18}}>
            {[
              ['Open rate','62.4%','+8.1pt vs avg'],
              ['Replies','148','your highest yet'],
              ['Click rate','24.1%','linked to shop'],
              ['Unsubs','9','0.3%'],
            ].map(([l,v,sub])=>(
              <div key={l} style={{padding:14, border:'1px solid var(--rule)'}}>
                <div className="mono" style={{fontSize:9.5, color:'var(--muted)', letterSpacing:'0.1em', textTransform:'uppercase'}}>{l}</div>
                <div className="serif" style={{fontSize:24, marginTop:4, fontWeight:400, letterSpacing:'-0.01em'}}>{v}</div>
                <div className="mono" style={{fontSize:9.5, color:'var(--muted-2)', marginTop:4, letterSpacing:'0.04em'}}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{borderTop:'1px solid var(--rule)', paddingTop:14}}>
            <div className="label" style={{marginBottom:8}}>148 replies began with…</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {['"This made me…"', '"I cried at—"', '"Will there—"', '"My mother—"', '"The lighthouse—"', '"Please don\'t—"'].map(t=>(
                <span key={t} className="serif" style={{
                  fontStyle:'italic', fontSize:13, padding:'4px 10px',
                  border:'1px solid var(--rule)', color:'var(--paper)',
                  whiteSpace:'nowrap'
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top readers */}
        <div style={{padding:28}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
            <div className="label">Most-engaged readers</div>
            <span className="mono" style={{fontSize:10.5, color:'var(--muted)'}}>WORTH A LETTER BACK</span>
          </div>

          {[
            {n:'Aoife Brennan', i:'AB', t:'gold', last:'Replied to every letter for 11 issues', stat:'11/11'},
            {n:'Wendell Park', i:'WP', t:'accent', last:'Pre-ordered all three editions', stat:'$92'},
            {n:'Sade Adebayo', i:'SA', t:'paper', last:'Brought 4 friends from her bookclub', stat:'+4'},
            {n:'Joon Park', i:'JP', t:'muted', last:'Wrote a 1,400-word reply to issue 45', stat:'1.4k'},
            {n:'Beatriz Costa', i:'BC', t:'ink', last:'Bought signed copy + hosted reading', stat:'★'},
          ].map((p,i)=>(
            <div key={p.n} style={{
              display:'flex', alignItems:'center', gap:14, padding:'12px 0',
              borderBottom: i<4 ? '1px dashed var(--rule)' : 'none'
            }}>
              <Avatar initials={p.i} tone={p.t} size={32}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:600}}>{p.n}</div>
                <div className="serif" style={{fontStyle:'italic', fontSize:12.5, color:'var(--muted)', marginTop:2, textWrap:'pretty'}}>{p.last}</div>
              </div>
              <div className="mono" style={{fontSize:11, color:'var(--paper)', letterSpacing:'0.06em', textAlign:'right', minWidth:36}}>{p.stat}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

window.Audience = Audience;
