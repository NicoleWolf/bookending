import Masthead from './components/masthead';
import BetaReaders from './components/beta-readers';
import Distribution from './components/distribution';
import Storefront from './components/storefront';
import Audience from './components/audience';
import Community from './components/community';

export default function App() {
  return (
    <div>
      <Masthead />
      <BetaReaders />
      <Distribution />
      <Storefront />
      <Audience />
      <Community />

      <footer style={{ padding: '30px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--rule)' }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.18em' }}>BOOKENDING · A WORKBENCH FOR SELF-PUBLISHERS · MMXXVI</span>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.18em' }}>SET IN NEWSREADER & INTER · PRINTED FROM PORTLAND</span>
      </footer>
    </div>
  );
}
