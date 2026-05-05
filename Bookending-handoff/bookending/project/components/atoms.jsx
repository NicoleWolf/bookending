// Shared small components.

const Folio = ({n, of}) => (
  <span className="mono" style={{color:'var(--muted)', fontSize:11, letterSpacing:'0.18em'}}>
    {String(n).padStart(2,'0')} <span style={{opacity:0.4}}>/</span> {String(of).padStart(2,'0')}
  </span>
);

const SectionHead = ({eyebrow, title, kicker, children}) => (
  <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:24, marginBottom:18}}>
    <div>
      <div className="label" style={{marginBottom:8}}>{eyebrow}</div>
      <h2 className="serif" style={{
        fontFamily:'var(--serif)', fontWeight:400, fontStyle:'normal',
        fontSize:34, lineHeight:1.05, margin:0, letterSpacing:'-0.01em', color:'var(--paper)'
      }}>{title}</h2>
      {kicker && <div className="serif" style={{fontStyle:'italic', color:'var(--muted)', marginTop:6, fontSize:15}}>{kicker}</div>}
    </div>
    <div style={{display:'flex', alignItems:'center', gap:10}}>{children}</div>
  </div>
);

const Pill = ({tone='neutral', children}) => {
  const tones = {
    neutral:{bg:'transparent', bd:'var(--rule)', fg:'var(--muted)'},
    paper:{bg:'var(--paper)', bd:'var(--paper)', fg:'var(--ink)'},
    accent:{bg:'transparent', bd:'var(--accent)', fg:'var(--accent)'},
    good:{bg:'transparent', bd:'var(--good)', fg:'var(--good)'},
    danger:{bg:'transparent', bd:'var(--danger)', fg:'var(--danger)'},
    solid:{bg:'var(--ink-3)', bd:'var(--ink-3)', fg:'var(--paper)'},
  }[tone];
  return (
    <span className="mono" style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'3px 8px', border:`1px solid ${tones.bd}`, background:tones.bg, color:tones.fg,
      fontSize:10.5, letterSpacing:'0.06em', textTransform:'uppercase', borderRadius:0,
    }}>{children}</span>
  );
};

const Btn = ({tone='ghost', children, icon, onClick, ...rest}) => {
  const styles = {
    primary:{bg:'var(--paper)', fg:'var(--ink)', bd:'var(--paper)'},
    accent:{bg:'var(--accent)', fg:'var(--ink)', bd:'var(--accent)'},
    ghost:{bg:'transparent', fg:'var(--paper)', bd:'var(--rule)'},
    bare:{bg:'transparent', fg:'var(--muted)', bd:'transparent'},
  }[tone];
  return (
    <button onClick={onClick} {...rest} style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'8px 14px', border:`1px solid ${styles.bd}`,
      background:styles.bg, color:styles.fg,
      fontFamily:'var(--sans)', fontSize:12.5, fontWeight:500,
      letterSpacing:'0.02em', borderRadius:0, cursor:'pointer',
      transition:'all 0.15s'
    }}>
      {children}{icon}
    </button>
  );
};

// Decorative inline SVG placeholder for "imagery"
const Placeholder = ({label='IMAGE', w='100%', h=120, tone='dark'}) => {
  const isDark = tone === 'dark';
  return (
    <div style={{
      width:w, height:h, position:'relative', overflow:'hidden',
      background: isDark ? 'var(--ink-2)' : 'var(--paper-dim)',
      backgroundImage: isDark
        ? 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(255,255,255,0.025) 8px 9px)'
        : 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(0,0,0,0.06) 8px 9px)',
      border:`1px solid ${isDark? 'var(--rule)':'transparent'}`,
      display:'flex', alignItems:'center', justifyContent:'center'
    }}>
      <span className="mono" style={{
        fontSize:10, letterSpacing:'0.18em', color: isDark ? 'var(--muted-2)' : 'var(--ink)', opacity:0.7
      }}>{label}</span>
    </div>
  );
};

// Tiny sparkline
const Spark = ({values=[], w=120, h=28, stroke='var(--paper)'}) => {
  if(!values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max-min || 1;
  const pts = values.map((v,i)=>{
    const x = (i/(values.length-1))*w;
    const y = h - ((v-min)/range)*h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{display:'block'}}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinejoin="round"/>
    </svg>
  );
};

// Bar fragment
const Bars = ({values=[], w=160, h=36, color='var(--paper)'}) => {
  const max = Math.max(...values, 1);
  const bw = w / (values.length*1.6);
  const gap = bw*0.6;
  return (
    <svg width={w} height={h}>
      {values.map((v,i)=>{
        const bh = (v/max)*h;
        return <rect key={i} x={i*(bw+gap)} y={h-bh} width={bw} height={bh} fill={color} opacity={0.4 + 0.6*(v/max)}/>;
      })}
    </svg>
  );
};

const Avatar = ({initials, tone='ink', size=28}) => {
  const colors = {
    ink:{bg:'var(--ink-3)', fg:'var(--paper)'},
    paper:{bg:'var(--paper)', fg:'var(--ink)'},
    accent:{bg:'var(--accent)', fg:'var(--ink)'},
    gold:{bg:'var(--accent-2)', fg:'var(--ink)'},
    muted:{bg:'#3a3530', fg:'var(--paper)'},
  }[tone];
  return (
    <div style={{
      width:size, height:size, background:colors.bg, color:colors.fg,
      borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--serif)', fontSize:size*0.42, fontWeight:500, fontStyle:'italic',
      flexShrink:0
    }}>{initials}</div>
  );
};

Object.assign(window, { Folio, SectionHead, Pill, Btn, Placeholder, Spark, Bars, Avatar });
