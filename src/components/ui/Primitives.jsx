import { Icon } from './Icon.jsx';

/** Notion-style select tag. color: gray | red | green | blue | yellow */
export function Tag({ color = 'gray', dot = false, children }) {
  return <span className={`tag tag-${color}`}>{dot && <span className="tag-dot" />}{children}</span>;
}

export function Button({ kind = 'secondary', small = false, icon, children, ...props }) {
  return (
    <button type="button" className={`btn btn-${kind}${small ? ' btn-sm' : ''}`} {...props}>
      {icon && <Icon name={icon} size={15} stroke={1.9} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, ...props }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} {...props}>
      <Icon name={icon} size={16} />
    </button>
  );
}

export function Kbd({ children }) {
  return <kbd className="kbd">{children}</kbd>;
}

/** Small status icon used in run logs, check lists and tables. */
export function Status({ kind, size = 16 }) {
  const label = { done: 'Done', fix: 'Needs a fix', progress: 'In progress', unsure: 'Unsure', live: 'Live', todo: 'Not started' }[kind];
  return <span className={`status status-${kind}`} style={{ width: size, height: size }} role="img" aria-label={label}>
    {kind === 'done' && <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" /><path d="m5 8.2 2 2 4-4.2" /></svg>}
    {kind === 'fix' && <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" /><path d="M8 4.8v3.6" /><circle className="fill" cx="8" cy="10.9" r=".9" /></svg>}
    {kind === 'unsure' && <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" /><path d="M6.3 6.3a1.8 1.8 0 1 1 2.6 1.6c-.5.3-.9.6-.9 1.2" /><circle className="fill" cx="8" cy="11.2" r=".8" /></svg>}
    {kind === 'progress' && <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" /><path className="fill" d="M8 3.6a4.4 4.4 0 0 1 0 8.8z" /></svg>}
    {kind === 'live' && <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" opacity=".35" /><circle className="fill" cx="8" cy="8" r="3" /></svg>}
    {kind === 'todo' && <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" strokeDasharray="2.2 2" /></svg>}
  </span>;
}

/** Numbered marker for the sidebar timeline. */
export function Node({ kind, n }) {
  const label = { done: 'Done', fix: 'Needs a fix', unsure: 'Needs your answer', progress: 'Current', todo: 'Not started' }[kind];
  const glyph = { fix: '!', unsure: '?' }[kind] ?? n;
  return <span className={`node node-${kind}`} role="img" aria-label={label}>
    {kind === 'done'
      ? <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 6.2 2.3 2.3 4.7-4.9" /></svg>
      : glyph}
  </span>;
}

const BAND = { brown: '#7A4426', black: '#1C1A18', orange: '#E2772E', red: '#C8312A', gold: '#B48A3A' };

export function Resistor({ bands, scale = 1 }) {
  return <span className="resistor" style={{ '--s': scale }} aria-hidden="true">
    <span className="lead" />
    <span className="body">{bands.map((b, i) => <span key={i} style={{ background: BAND[b] }} />)}<span className="gold" style={{ background: BAND.gold }} /></span>
    <span className="lead" />
  </span>;
}

export function PartGlyph({ kind }) {
  if (kind === 'led') return <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true"><path d="M10 15V9M18 15V7" stroke="#A3A9AE" strokeWidth="1.4" /><circle cx="14" cy="6" r="5.5" fill="#D8362B" /><ellipse cx="12.3" cy="4.2" rx="1.6" ry="1.1" fill="#fff" fillOpacity=".6" /></svg>;
  if (kind === 'jumper') return <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true"><path d="M3 12 C 9 2, 19 2, 25 12" fill="none" stroke="#2F5FB3" strokeWidth="3" strokeLinecap="round" /></svg>;
  if (kind === 'button') return <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true"><rect x="7" y="1" width="14" height="14" rx="2" fill="#2B2B2A" /><circle cx="14" cy="8" r="4" fill="#151515" /></svg>;
  if (kind === 'cap') return <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true"><circle cx="14" cy="8" r="7" fill="#24427E" /><circle cx="14" cy="8" r="5" fill="#B9BEC4" /></svg>;
  if (kind === 'uno') return <svg width="28" height="16" viewBox="0 0 28 16" aria-hidden="true"><rect x="4" y="1" width="20" height="14" rx="2" fill="#0E7C86" /><rect x="7" y="0" width="5" height="4" fill="#BFC5CA" /></svg>;
  return null;
}

export function Mark({ size = 24 }) {
  return <svg className="mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="6.5" fill="var(--accent)" />
    <g fill="#fff"><circle cx="7.5" cy="9" r="1.7" /><circle cx="12" cy="9" r="1.7" /><circle cx="16.5" cy="9" r="1.7" fill="#FFD3A8" />
      <circle cx="7.5" cy="15" r="1.7" /><circle cx="12" cy="15" r="1.7" /><circle cx="16.5" cy="15" r="1.7" /></g>
  </svg>;
}
