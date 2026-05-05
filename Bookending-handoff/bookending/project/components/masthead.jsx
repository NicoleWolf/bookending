// Masthead — the top-of-page hero, modeled after a literary magazine masthead.

const HEADLINES = [
  { h: "A workbench for self-publishers.", k: "Edit, print, sell, and gather your readers — without juggling six tools." },
  { h: "Your book, from manuscript to mailbox.", k: "One quiet workspace for every step that comes after the first draft." },
  { h: "Bookending, for the work between drafts and readers.", k: "Beta-readers, distribution, storefront, and audience — held together by other authors." },
  { h: "Every author needs a colophon.", k: "We built the back-of-house so you can stay at the desk." },
  { h: "Independent, but not alone.", k: "A workbench for self-publishers, run with fellow authors at your shoulder." },
];

const Masthead = ({tweaks}) => {
  const idx = Math.max(0, Math.min(HEADLINES.length-1, tweaks.headline ?? 0));
  const { h, k } = HEADLINES[idx];

  return (
    <header style={{borderBottom:'2px solid var(--paper)', padding:'24px 48px 0'}}>
      {/* Top bar — the colophon */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:14}}>
        <div style={{display:'flex', alignItems:'center', gap:18}}>
          <div className="mono" style={{fontSize:11, color:'var(--muted)', letterSpacing:'0.18em'}}>VOL. III · NO. 47</div>
          <div className="mono" style={{fontSize:11, color:'var(--muted)', letterSpacing:'0.18em'}}>MON · 04 MAY 2026</div>
          <div className="mono" style={{fontSize:11, color:'var(--muted)', letterSpacing:'0.18em'}}>EST. 2024</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:18}}>
          <button style={navBtn}><IconSearch size={14}/> Search</button>
          <button style={navBtn}><IconBell size={14}/> 3 dispatches</button>
          <div style={{display:'flex', alignItems:'center', gap:10, paddingLeft:18, borderLeft:'1px solid var(--rule)'}}>
            <Avatar initials="EW" tone="paper" size={28}/>
            <div style={{display:'flex', flexDirection:'column', lineHeight:1.1}}>
              <span style={{fontSize:12, fontWeight:600}}>Esther Winwood</span>
              <span className="mono" style={{fontSize:10, color:'var(--muted)', letterSpacing:'0.1em'}}>3 TITLES · INDIE</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="rule"/>

      {/* Title block */}
      <div style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:48, padding:'40px 0 36px', alignItems:'flex-end'}}>
        <div>
          <div className="label" style={{marginBottom:18}}>The Self-Publisher's Workbench</div>
          <h1 className="serif" style={{
            fontFamily:'var(--serif)', fontStyle:'italic', fontWeight:400,
            fontSize:'clamp(56px, 7vw, 104px)', lineHeight:0.95, margin:0,
            letterSpacing:'-0.02em', color:'var(--paper)',
          }}>Bookending</h1>
          <div style={{marginTop:18, display:'flex', alignItems:'center', gap:14}}>
            <span className="mono" style={{fontSize:11, color:'var(--muted)', letterSpacing:'0.18em'}}>FROM MANUSCRIPT TO READER —</span>
            <span style={{flex:1, height:1, background:'var(--rule)'}}/>
          </div>
        </div>

        <div style={{borderLeft:'1px solid var(--rule)', paddingLeft:32}}>
          <div className="label" style={{marginBottom:14}}>Today's leader</div>
          <p className="serif" style={{
            fontFamily:'var(--serif)', fontWeight:400, fontSize:28, lineHeight:1.2,
            margin:0, letterSpacing:'-0.005em', textWrap:'balance'
          }}>{h}</p>
          <p className="serif" style={{
            fontFamily:'var(--serif)', fontStyle:'italic', color:'var(--muted)',
            fontSize:15.5, lineHeight:1.45, margin:'14px 0 0', textWrap:'pretty'
          }}>{k}</p>
        </div>
      </div>

      <hr className="rule-thick"/>

      {/* Section nav — like a newspaper's section list */}
      <nav style={{display:'flex', alignItems:'center', gap:0, padding:'14px 0', overflowX:'auto'}}>
        {[
          {label:'Workbench', active:true},
          {label:'Editing & Beta-readers'},
          {label:'Print & Distribution'},
          {label:'Storefront'},
          {label:'Audience'},
          {label:'Community'},
          {label:'Royalties'},
        ].map((s,i)=>(
          <a key={s.label} style={{
            padding:'4px 18px',
            borderRight: i<6 ? '1px solid var(--rule)' : 'none',
            fontFamily:'var(--sans)', fontSize:12, fontWeight: s.active?600:400,
            color: s.active ? 'var(--paper)' : 'var(--muted)',
            letterSpacing:'0.02em', cursor:'pointer', whiteSpace:'nowrap',
            display:'inline-flex', alignItems:'center', gap:8,
          }}>
            {s.active && <span style={{width:6, height:6, background:'var(--accent)', borderRadius:0}}/>}
            {s.label}
          </a>
        ))}
        <div style={{flex:1}}/>
        <Btn tone="accent" icon={<IconArrow size={14}/>}>New manuscript</Btn>
      </nav>
    </header>
  );
};

const navBtn = {
  display:'inline-flex', alignItems:'center', gap:6,
  padding:'6px 10px', background:'transparent', border:'1px solid var(--rule)',
  color:'var(--muted)', fontSize:11.5, fontFamily:'var(--sans)',
  letterSpacing:'0.02em', cursor:'pointer', borderRadius:0
};

window.Masthead = Masthead;
window.HEADLINES = HEADLINES;
