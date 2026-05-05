// Storefront panel — direct sales, the author's own shop window.

const Storefront = () => {
  return (
    <section style={{padding:'40px 48px', borderBottom:'1px solid var(--rule)'}}>
      <SectionHead
        eyebrow="§ 03 · Storefront · winwoodbooks.press"
        title="Your own shop window"
        kicker="Direct sales keep 95¢ of every dollar. Your shop has been open 14 months."
      >
        <Btn tone="ghost">Theme</Btn>
        <Btn tone="ghost">Visit shop ↗</Btn>
        <Btn tone="primary" icon={<IconArrow size={14}/>}>New product</Btn>
      </SectionHead>

      <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:32}}>

        {/* Storefront preview */}
        <div style={{border:'1px solid var(--rule)', background:'var(--paper)', color:'var(--ink)', padding:'36px 32px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, paddingBottom:14, borderBottom:'1px solid #00000020'}}>
            <span className="serif" style={{fontFamily:'var(--serif)', fontStyle:'italic', fontSize:22, fontWeight:500}}>Winwood Books</span>
            <span className="mono" style={{fontSize:10, letterSpacing:'0.18em', color:'#00000088'}}>SHOP · ESSAYS · LETTER</span>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:14}}>
            {[
              {t:'The Lantern Keeper\'s Daughter', s:'Signed hardcover', p:'$28', tag:'NEW'},
              {t:'Saltgrass — Stories', s:'Paperback', p:'$16', tag:''},
              {t:'A Letter on Lighthouses', s:'Limited zine, ed. of 200', p:'$9', tag:'12 LEFT'},
              {t:'Bundle: All three', s:'Saves $7', p:'$46', tag:'BUNDLE'},
            ].map((b,i)=>(
              <div key={i}>
                <div style={{aspectRatio:'3/4', background:'#1a1612', position:'relative', marginBottom:10, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'18px 14px'}}>
                  {b.tag && <div className="mono" style={{position:'absolute', top:10, right:10, fontSize:8, letterSpacing:'0.2em', color:'#e8d9b8', border:'1px solid #8a7a5e', padding:'2px 6px'}}>{b.tag}</div>}
                  <div className="mono" style={{fontSize:7, letterSpacing:'0.2em', color:'#8a7a5e'}}>E. WINWOOD</div>
                  <div className="serif" style={{fontFamily:'var(--serif)', fontStyle:'italic', fontSize:14, color:'#e8d9b8', lineHeight:1.05, textWrap:'balance'}}>{b.t}</div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                  <div>
                    <div className="serif" style={{fontFamily:'var(--serif)', fontSize:14, fontWeight:500}}>{b.t}</div>
                    <div className="mono" style={{fontSize:10, letterSpacing:'0.06em', color:'#00000088', textTransform:'uppercase', marginTop:2}}>{b.s}</div>
                  </div>
                  <div className="serif" style={{fontStyle:'italic', fontSize:18}}>{b.p}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{textAlign:'center', marginTop:18, paddingTop:16, borderTop:'1px solid #00000020'}}>
            <span className="mono" style={{fontSize:9.5, letterSpacing:'0.2em', color:'#00000066'}}>SHIPS FROM PORTLAND · SIGNED ON REQUEST · FREE LETTER WITH ANY ORDER</span>
          </div>
        </div>

        {/* Stats column */}
        <div style={{display:'flex', flexDirection:'column', gap:20}}>

          <div style={{border:'1px solid var(--rule)', padding:24}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <div className="smallcaps">Direct sales · this month</div>
              <Pill tone="good">+34% MoM</Pill>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginTop:18, marginBottom:18}}>
              <div>
                <div className="serif" style={{fontSize:48, fontWeight:300, lineHeight:1, letterSpacing:'-0.02em'}}>$3,284</div>
                <div className="mono" style={{fontSize:10.5, color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:6}}>net · 124 orders</div>
              </div>
              <div>
                <div className="serif" style={{fontSize:48, fontWeight:300, lineHeight:1, letterSpacing:'-0.02em'}}>0.95</div>
                <div className="mono" style={{fontSize:10.5, color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:6}}>per dollar kept</div>
              </div>
            </div>
            <Bars values={[8,12,9,15,18,11,14,22,17,28,24,32,38,30]} w={300} h={50} color="var(--paper)"/>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
              <span className="mono" style={{fontSize:10, color:'var(--muted)'}}>20 APR</span>
              <span className="mono" style={{fontSize:10, color:'var(--muted)'}}>03 MAY</span>
            </div>
          </div>

          <div style={{border:'1px solid var(--rule)'}}>
            <div style={{padding:'14px 18px', borderBottom:'1px solid var(--rule)', display:'flex', justifyContent:'space-between'}}>
              <div className="smallcaps">Recent orders</div>
              <span className="mono" style={{fontSize:10, color:'var(--muted)'}}>LAST 24H · 11 ORDERS</span>
            </div>
            {[
              {who:'L. Marchetti · Milan', what:'Signed hardcover', amt:'$28', when:'14m'},
              {who:'D. Okonkwo · Lagos', what:'Bundle of three', amt:'$46', when:'42m'},
              {who:'A. Pham · Brooklyn', what:'Saltgrass — pb', amt:'$16', when:'1h'},
              {who:'R. Søndergaard · Aarhus', what:'Lighthouses zine', amt:'$9', when:'2h'},
            ].map((o,i)=>(
              <div key={i} style={{display:'grid', gridTemplateColumns:'1.6fr 1.4fr 0.5fr 0.4fr', padding:'12px 18px', borderBottom: i<3 ? '1px solid var(--rule)' : 'none', alignItems:'center', gap:8, fontSize:12.5}}>
                <span style={{fontWeight:500}}>{o.who}</span>
                <span className="serif" style={{fontStyle:'italic', color:'var(--muted)'}}>{o.what}</span>
                <span className="serif" style={{fontStyle:'italic', textAlign:'right'}}>{o.amt}</span>
                <span className="mono" style={{fontSize:10, color:'var(--muted)', textAlign:'right'}}>{o.when}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

window.Storefront = Storefront;
