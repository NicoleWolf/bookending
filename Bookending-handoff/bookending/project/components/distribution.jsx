// Print & Distribution panel — books moving into the world.

const CHANNELS = [
  { name:'Amazon KDP', kind:'Print + eBook', status:'live', sku:'B0CTQ4Z9R8', royalty:'60%', moved:412, color:'good' },
  { name:'IngramSpark', kind:'Print · global', status:'live', sku:'978-1-7398..', royalty:'45%', moved:184, color:'good' },
  { name:'Apple Books', kind:'eBook', status:'live', sku:'1452119', royalty:'70%', moved:88, color:'good' },
  { name:'Kobo Writing Life', kind:'eBook', status:'live', sku:'9781739..', royalty:'70%', moved:51, color:'good' },
  { name:'Bookshop.org', kind:'Print · indie', status:'pending', sku:'awaiting ISBN map', royalty:'30%', moved:0, color:'neutral' },
  { name:'Libro.fm', kind:'Audio', status:'draft', sku:'narrator unbooked', royalty:'—', moved:0, color:'danger' },
];

const Distribution = () => {
  return (
    <section style={{padding:'40px 48px', borderBottom:'1px solid var(--rule)', background:'var(--ink)'}}>
      <SectionHead
        eyebrow="§ 02 · Print & Distribution"
        title="Where the book lives"
        kicker="Six channels, one ISBN registry, royalty consolidation handled nightly at 02:00 UTC."
      >
        <Btn tone="ghost">ISBN registry</Btn>
        <Btn tone="primary" icon={<IconArrow size={14}/>}>Add channel</Btn>
      </SectionHead>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0, border:'1px solid var(--rule)', marginBottom:24}}>
        {[
          {l:'Copies in motion', v:'735', sub:'+62 this week', spark:[12,18,15,22,28,24,32,38,42,35,40,52,62]},
          {l:'Net royalties · 30d', v:'$8,412', sub:'$1,184 unsettled', spark:[6,8,7,12,9,14,18,15,22,19,24,28,32]},
          {l:'Time to shelf · avg', v:'4.2 days', sub:'IngramSpark 6.8d · KDP 2.1d', spark:[7,6,5,5,4,5,4,4,3,4,4,3,4]},
        ].map((s,i)=>(
          <div key={i} style={{padding:24, borderRight: i<2 ? '1px solid var(--rule)':'none'}}>
            <div className="label" style={{marginBottom:10}}>{s.l}</div>
            <div className="serif" style={{fontSize:46, fontWeight:300, lineHeight:1, letterSpacing:'-0.02em'}}>{s.v}</div>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14}}>
              <span className="mono" style={{fontSize:11, color:'var(--muted)'}}>{s.sub}</span>
              <Spark values={s.spark} w={92} h={22} stroke="var(--accent)"/>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.7fr 1fr', gap:32}}>

        {/* Channels table */}
        <div style={{border:'1px solid var(--rule)'}}>
          <div style={{
            display:'grid', gridTemplateColumns:'1.4fr 1.1fr 0.8fr 0.7fr 0.6fr 0.5fr',
            padding:'10px 18px', borderBottom:'1px solid var(--rule)',
            background:'var(--ink-2)'
          }}>
            <div className="label">Channel</div>
            <div className="label">Format</div>
            <div className="label">Status</div>
            <div className="label">Royalty</div>
            <div className="label">Moved</div>
            <div className="label" style={{textAlign:'right'}}>·</div>
          </div>
          {CHANNELS.map((c,i)=>(
            <div key={c.name} style={{
              display:'grid', gridTemplateColumns:'1.4fr 1.1fr 0.8fr 0.7fr 0.6fr 0.5fr',
              padding:'14px 18px', borderBottom: i<CHANNELS.length-1 ? '1px solid var(--rule)' : 'none',
              alignItems:'center', gap:12, fontSize:13,
            }}>
              <div>
                <div style={{fontWeight:600}}>{c.name}</div>
                <div className="mono" style={{fontSize:10, color:'var(--muted)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:2}}>{c.sku}</div>
              </div>
              <div className="serif" style={{fontStyle:'italic', color:'var(--muted)', fontSize:14}}>{c.kind}</div>
              <div><Pill tone={c.color}>{c.status}</Pill></div>
              <div className="mono" style={{fontSize:12.5}}>{c.royalty}</div>
              <div className="serif" style={{fontStyle:'italic', fontSize:18}}>{c.moved || '—'}</div>
              <button style={{color:'var(--muted)', justifySelf:'end'}}><IconMore size={16}/></button>
            </div>
          ))}
        </div>

        {/* Print preview / proof */}
        <div style={{border:'1px solid var(--rule)', padding:24}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:18}}>
            <div className="smallcaps">Latest proof</div>
            <Pill tone="accent">REVIEW DUE</Pill>
          </div>
          <div style={{display:'flex', gap:14, marginBottom:18}}>
            {/* Front cover */}
            <div style={{flex:1, aspectRatio:'2/3', background:'#1a1612', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'14px 12px'}}>
              <div className="mono" style={{fontSize:7, letterSpacing:'0.2em', color:'#8a7a5e'}}>E. WINWOOD</div>
              <div>
                <div className="serif" style={{fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14, color:'#e8d9b8', lineHeight:1.05}}>The<br/>Lantern<br/>Keeper's<br/>Daughter</div>
                <div style={{width:24, height:1, background:'#8a7a5e', margin:'10px 0 6px'}}/>
                <div className="mono" style={{fontSize:6.5, letterSpacing:'0.2em', color:'#8a7a5e'}}>A NOVEL</div>
              </div>
            </div>
            {/* Spine + back */}
            <div style={{flex:1.4, aspectRatio:'2/3', background:'var(--ink-2)', position:'relative', padding:14}}>
              <div className="mono" style={{fontSize:9, color:'var(--muted)', marginBottom:8}}>INTERIOR · 6×9 · 322pp</div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                {[60, 80, 75, 90, 50, 70, 85, 65, 55, 78, 70].map((w,i)=>(
                  <div key={i} style={{height:2, background:'var(--paper-dim)', width:`${w}%`, opacity:0.5}}/>
                ))}
                <div style={{height:6}}/>
                {[70, 85, 60, 78, 90].map((w,i)=>(
                  <div key={i} style={{height:2, background:'var(--paper-dim)', width:`${w}%`, opacity:0.5}}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{borderTop:'1px solid var(--rule)', paddingTop:14, display:'flex', flexDirection:'column', gap:10}}>
            {[
              ['Trim','6 × 9 in'],
              ['Paper','55# cream'],
              ['Cover','Matte'],
              ['Spine','0.81 in'],
              ['Extent','322 pp'],
            ].map(([k,v])=>(
              <div key={k} style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:12, fontSize:12}}>
                <span className="mono" style={{color:'var(--muted)', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap'}}>{k}</span>
                <span className="serif" style={{fontStyle:'italic', textAlign:'right'}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:8, marginTop:18}}>
            <Btn tone="ghost">Open proof</Btn>
            <Btn tone="primary">Approve & ship</Btn>
          </div>
        </div>
      </div>
    </section>
  );
};

window.Distribution = Distribution;
