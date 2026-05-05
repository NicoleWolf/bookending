import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Icon = ({ children, size = 16, ...rest }: IconProps) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round" {...rest}
  >
    {children}
  </svg>
);

export const IconQuill   = (p: IconProps) => <Icon {...p}><path d="M4 20s2-9 9-15c4-3 7-3 7-3s0 3-3 7c-6 7-15 9-15 9z"/><path d="M4 20l5-5"/></Icon>;
export const IconReaders = (p: IconProps) => <Icon {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.2"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><path d="M15 18c0-2 2-3.5 4-3.5s2 1 2 1"/></Icon>;
export const IconPress   = (p: IconProps) => <Icon {...p}><rect x="4" y="4" width="16" height="6"/><path d="M6 10v8h12v-8"/><path d="M9 14h6"/></Icon>;
export const IconStore   = (p: IconProps) => <Icon {...p}><path d="M3 8l1.5-4h15L21 8"/><path d="M4 8v12h16V8"/><path d="M9 13h6"/></Icon>;
export const IconMail    = (p: IconProps) => <Icon {...p}><rect x="3" y="6" width="18" height="12"/><path d="M3 7l9 7 9-7"/></Icon>;
export const IconArrow   = (p: IconProps) => <Icon {...p}><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></Icon>;
export const IconArrowUp = (p: IconProps) => <Icon {...p}><path d="M7 17L17 7"/><path d="M9 7h8v8"/></Icon>;
export const IconCheck   = (p: IconProps) => <Icon {...p}><path d="M4 12l5 5 11-12"/></Icon>;
export const IconDot     = (p: IconProps) => <Icon {...p}><circle cx="12" cy="12" r="3" fill="currentColor"/></Icon>;
export const IconSpark   = (p: IconProps) => <Icon {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/></Icon>;
export const IconBook    = (p: IconProps) => <Icon {...p}><path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/></Icon>;
export const IconSearch  = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/></Icon>;
export const IconBell    = (p: IconProps) => <Icon {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1 2H5z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>;
export const IconMore    = (p: IconProps) => <Icon {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></Icon>;
export const IconQuote   = (p: IconProps) => <Icon {...p}><path d="M7 7h4v6c0 2-2 4-4 4"/><path d="M15 7h4v6c0 2-2 4-4 4"/></Icon>;
