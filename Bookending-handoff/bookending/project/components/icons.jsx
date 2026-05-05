// Minimal stroke icons. 1.5 stroke, currentColor.
const Icon = ({children, size=16, ...rest}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children}
  </svg>
);

const IconQuill = (p) => <Icon {...p}><path d="M4 20s2-9 9-15c4-3 7-3 7-3s0 3-3 7c-6 7-15 9-15 9z"/><path d="M4 20l5-5"/></Icon>;
const IconReaders = (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.2"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M15 18c0-2 2-3.5 4-3.5s2 1 2 1"/></Icon>;
const IconPress = (p) => <Icon {...p}><rect x="4" y="4" width="16" height="6"/><path d="M6 10v8h12v-8"/><path d="M9 14h6"/></Icon>;
const IconStore = (p) => <Icon {...p}><path d="M3 8l1.5-4h15L21 8"/><path d="M4 8v12h16V8"/><path d="M9 13h6"/></Icon>;
const IconMail = (p) => <Icon {...p}><rect x="3" y="6" width="18" height="12"/><path d="M3 7l9 7 9-7"/></Icon>;
const IconArrow = (p) => <Icon {...p}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></Icon>;
const IconArrowUp = (p) => <Icon {...p}><path d="M7 17L17 7"/><path d="M9 7h8v8"/></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M4 12l5 5 11-12"/></Icon>;
const IconDot = (p) => <Icon {...p}><circle cx="12" cy="12" r="3" fill="currentColor"/></Icon>;
const IconSpark = (p) => <Icon {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></Icon>;
const IconBook = (p) => <Icon {...p}><path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></Icon>;
const IconBell = (p) => <Icon {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1 2H5z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>;
const IconMore = (p) => <Icon {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></Icon>;
const IconQuote = (p) => <Icon {...p}><path d="M7 7h4v6c0 2-2 4-4 4"/><path d="M15 7h4v6c0 2-2 4-4 4"/></Icon>;

Object.assign(window, {
  Icon, IconQuill, IconReaders, IconPress, IconStore, IconMail,
  IconArrow, IconArrowUp, IconCheck, IconDot, IconSpark, IconBook,
  IconSearch, IconBell, IconMore, IconQuote
});
