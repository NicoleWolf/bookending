// Beta-readers panel — the editorial heart, where community manifests.

const READERS = [
  { name:'Marisol Vega', initials:'MV', tone:'accent', progress: 0.78, chapter:'Ch. 14', verdict:'enthralled', last:'2h', feedback:14, since:'4 books' },
  { name:'Tomás Reyes', initials:'TR', tone:'gold', progress: 0.92, chapter:'Ch. 17', verdict:'pacing flag', last:'5h', feedback:31, since:'2 books' },
  { name:'Imani Okafor', initials:'IO', tone:'muted', progress: 0.41, chapter:'Ch. 8', verdict:'on track', last:'1d', feedback:7, since:'first book' },
  { name:'Henrik Lund', initials:'HL', tone:'ink', progress: 1.00, chapter:'Done', verdict:'4★ — sent letter', last:'2d', feedback:42, since:'7 books' },
  { name:'Priya Anand', initials:'PA', tone:'paper', progress: 0.23, chapter:'Ch. 4', verdict:'just started', last:'6h', feedback:2, since:'first book' },
];

const verdictTone = {
  'enthralled':'good', 'pacing flag':'danger', 'on track':'neutral',
  '4★ — sent letter':'accent', 'just started':'neutral'
};

const BetaReaders = () => {
  return (
    <section style={{padding:'40px 48px', borderBottom:'1px solid var(--rule)'}}>
      <SectionHead
        eyebrow="§ 01 · Editing & Beta-readers"
        title="The reading room"
        kicker="Five trusted readers are inside The Lantern Keeper's Daughter — your second draft, dated April 28."
      >
        <Btn tone="ghost"><IconQuote size={14}/> Feedback inbox · 96</Btn>
        <Btn tone="primary" icon={<IconArrow size={14}/>}>Invite reader</Btn>
      </SectionHead>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:32}}>

        {/* Left: reader table */}
        <div style={{border:'1px solid var(--rule)'}}>
          <div style={{
            display:'grid', gridTemplateColumns:'1.6fr 1.4fr 1fr 0.7fr 0.4fr',
            padding:'10px 18px', borderBottom:'1px solid var(--rule)',
            background:'var(--ink-2)'
          }}>
            <div className="label">Reader</div>
            <div className="label">Where they are</div>
            <div className="label">Verdict so far</div>
            <div className="label">Feedback</div>
            <div className="label" style={{textAlign:'right'}}>·</div>
          </div>
          {READERS.map((r,i)=>(
            <div key={r.name} style={{
              display:'grid', gridTemplateColumns:'1.6fr 1.4fr 1fr 0.7fr 0.4fr',
              padding:'18px', borderBottom: i<READERS.length-1 ? '1px solid var(--rule)' : 'none',
              alignItems:'center', gap:12,
            }}>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <Avatar initials={r.initials} tone={r.tone} size={34}/>
                <div>
                  <div style={{fontSize:13, fontWeight:600}}>{r.name}</div>
                  <div className="mono" style={{fontSize:10, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase'}}>{r.since} · last seen {r.last} ago</div>
                </div>
              </div>

              <div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                  <span className="mono" style={{fontSize:11, color:'var(--paper)'}}>{r.chapter}</span>
                  <span className="mono" style={{fontSize:11, color:'var(--muted)'}}>{Math.round(r.progress*100)}%</span>
                </div>
                <div style={{height:2, background:'var(--rule)', position:'relative'}}>
                  <div style={{
                    position:'absolute', left:0, top:0, bottom:0,
                    width:`${r.progress*100}%`, background:'var(--paper)'
                  }}/>
                </div>
              </div>

              <div>
                <Pill tone={verdictTone[r.verdict] || 'neutral'}>{r.verdict}</Pill>
              </div>

              <div className="serif" style={{fontStyle:'italic', fontSize:18, color:'var(--paper)'}}>{r.feedback}</div>
              <button style={{color:'var(--muted)', justifySelf:'end'}}><IconMore size={16}/></button>
            </div>
          ))}
        </div>

        {/* Right: latest margin note + manuscript heat */}
        <div style={{display:'flex', flexDirection:'column', gap:24}}>

          {/* Margin note */}
          <article style={{border:'1px solid var(--rule)', padding:24, position:'relative', display:'flex', flexDirection:'column', gap:18}}>
            <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
              <Pill tone="solid">Latest margin note</Pill>
              <span className="mono" style={{fontSize:10, color:'var(--muted)', letterSpacing:'0.08em'}}>P. 184 · CH. 17 · 11 MIN AGO</span>
            </div>
            <p className="serif" style={{
              fontFamily:'var(--serif)', fontSize:20, lineHeight:1.32, fontStyle:'italic',
              margin:0, color:'var(--paper)', textWrap:'pretty', letterSpacing:'-0.005em'
            }}>
              "The lighthouse scene is doing too much heavy lifting. We learn about Cora's mother
              <em> and</em> the storm <em>and</em> the betrayal in three pages — let it breathe."
            </p>
            <div style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
              <Avatar initials="TR" tone="gold" size={28}/>
              <div style={{minWidth:0, flex:1}}>
                <div style={{fontSize:12.5, fontWeight:600}}>Tomás Reyes</div>
                <div className="mono" style={{fontSize:9.5, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:2}}>+ 2 readers flagged this</div>
              </div>
              <div style={{display:'flex', gap:6}}>
                <button style={ghostBtn}>Reply</button>
                <button style={ghostBtn}>Apply</button>
              </div>
            </div>
            <div style={{position:'absolute', top:0, right:0, width:1, height:'100%', background:'var(--accent)'}}/>
          </article>

          {/* Manuscript heat */}
          <div style={{border:'1px solid var(--rule)', padding:24}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:18}}>
              <div className="smallcaps">Manuscript heat</div>
              <span className="mono" style={{fontSize:10, color:'var(--muted)'}}>96 FEEDBACK · 22 CHAPTERS</span>
            </div>
            <div style={{display:'flex', alignItems:'flex-end', gap:3, height:60}}>
              {[3,5,2,8,12,4,6,9,15,11,3,7,14,18,9,4,2,5,8,3,1,2].map((v,i)=>(
                <div key={i} style={{
                  flex:1, height:`${(v/18)*100}%`, minHeight:3,
                  background: v >= 12 ? 'var(--accent)' : v >= 6 ? 'var(--paper)' : 'var(--muted-2)',
                  opacity: v >= 6 ? 1 : 0.5
                }}/>
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
              <span className="mono" style={{fontSize:10, color:'var(--muted)'}}>CH. 1</span>
              <span className="mono" style={{fontSize:10, color:'var(--accent)'}}>CH. 14 ⤴ HOTSPOT</span>
              <span className="mono" style={{fontSize:10, color:'var(--muted)'}}>CH. 22</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const ghostBtn = {
  padding:'5px 10px', border:'1px solid var(--rule)', background:'transparent',
  color:'var(--paper)', fontFamily:'var(--sans)', fontSize:11.5, cursor:'pointer'
};

window.BetaReaders = BetaReaders;
