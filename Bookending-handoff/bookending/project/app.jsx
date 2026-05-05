// App shell — composes everything, wires the Tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "headline": 0
}/*EDITMODE-END*/;

function App(){
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  return (
    <div>
      <Masthead tweaks={tweaks}/>
      <BetaReaders/>
      <Distribution/>
      <Storefront/>
      <Audience/>
      <Community/>

      <footer style={{padding:'30px 48px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--rule)'}}>
        <span className="mono" style={{fontSize:10.5, color:'var(--muted)', letterSpacing:'0.18em'}}>BOOKENDING · A WORKBENCH FOR SELF-PUBLISHERS · MMXXVI</span>
        <span className="mono" style={{fontSize:10.5, color:'var(--muted)', letterSpacing:'0.18em'}}>SET IN NEWSREADER & INTER · PRINTED FROM PORTLAND</span>
      </footer>

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Hero copy">
          <window.TweakSelect
            label="Headline"
            value={tweaks.headline}
            options={window.HEADLINES.map((h, i) => ({
              value: i,
              label: h.h.length > 40 ? h.h.slice(0, 38) + '…' : h.h
            }))}
            onChange={(v) => setTweak('headline', Number(v))}
          />
          <div style={{
            fontFamily:'var(--serif)', fontStyle:'italic', fontSize:13, lineHeight:1.4,
            color:'var(--muted)', padding:'10px 12px', background:'var(--ink-2)', border:'1px solid var(--rule)',
            marginTop:8
          }}>
            "{window.HEADLINES[tweaks.headline]?.h}"
          </div>
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
