// Schematic map of breadboard rows 1–8: the plan vs. what camera + board detected.
// parts: [{ kind: 'rail'|'res'|'led'|'jumper', a, b?, rail?, state: 'ok'|'bad'|'warn'|'plan', label?, lx?, ly?, y?, wire?, bands? }]

const W = 344;
const x = row => 30 + (row - 1) * 40;
const COLOR = { plan: '#A5A49F', ok: '#3F9B63', bad: '#E0554D', warn: '#D7A020' };
const BAND = { brown: '#7A4426', black: '#1C1A18', orange: '#E2772E', red: '#C8312A' };

export function BoardMap({ parts, height = 168, highlight = [] }) {
  return (
    <svg className="board-map" viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Board map of rows 1 to 8: plan compared with detected parts">
      <line x1="22" y1="14" x2={W - 6} y2="14" stroke="#E0554D" strokeWidth="1.6" />
      <text x="6" y="18" className="bm-rail plus">+</text>
      <line x1="22" y1="30" x2={W - 6} y2="30" stroke="#2383E2" strokeWidth="1.6" strokeDasharray="3 3" />
      <text x="7" y="34" className="bm-rail minus">−</text>
      {Array.from({ length: 8 }, (_, i) => i + 1).map(r => (
        <g key={r}>
          <rect x={x(r) - 9} y="44" width="18" height="96" rx="5" fill={highlight.includes(r) ? '#DCEAFB' : '#F2F2F0'} />
          {[0, 1, 2, 3, 4].map(k => <circle key={k} cx={x(r)} cy={56 + k * 18} r="2.2" fill="#CFCDC7" />)}
          <text x={x(r)} y={height - 10} textAnchor="middle" className="bm-num">{r}</text>
        </g>
      ))}
      {parts.map((p, i) => <Part key={i} {...p} />)}
    </svg>
  );
}

function Part({ kind, a, b, rail, state = 'ok', label, lx = 0, ly = 0, y, wire, bands }) {
  const c = COLOR[state];
  const dash = state === 'plan' ? '4 3' : undefined;
  const emphasis = state === 'bad' || state === 'warn';
  let shape = null;
  if (kind === 'rail') {
    const ry = rail === '+' ? 14 : 30;
    const wc = wire || '#C8312A';
    shape = <><path d={`M${x(a)} ${ry} V56`} stroke={wc} strokeWidth="4" strokeLinecap="round" strokeDasharray={dash} /><circle cx={x(a)} cy="56" r="3.2" fill="#fff" stroke={wc} strokeWidth="1.5" /></>;
  } else if (kind === 'jumper') {
    const yy = y ?? 128;
    const wc = wire || '#E0AE25';
    shape = <><path d={`M${x(a)} ${yy} C ${x(a) + 10} ${yy + 14}, ${x(b) - 10} ${yy + 14}, ${x(b)} ${yy}`} fill="none" stroke={wc} strokeWidth="4" strokeLinecap="round" strokeDasharray={dash} />
      <circle cx={x(a)} cy={yy} r="3.2" fill="#fff" stroke={wc} strokeWidth="1.5" /><circle cx={x(b)} cy={yy} r="3.2" fill="#fff" stroke={wc} strokeWidth="1.5" /></>;
  } else if (kind === 'res') {
    const yy = y ?? 74;
    const mid = (x(a) + x(b)) / 2;
    const bs = bands || ['red', 'red', 'brown'];
    shape = <><line x1={x(a)} y1={yy} x2={x(b)} y2={yy} stroke="#8E949A" strokeWidth="1.6" />
      <rect x={mid - 20} y={yy - 7} width="40" height="14" rx="7" fill="#DDC193" stroke={c} strokeWidth={emphasis ? 2 : 0} strokeDasharray={dash} />
      {bs.map((bc, k) => <rect key={k} x={mid - 12 + k * 7} y={yy - 7} width="3.5" height="14" fill={BAND[bc]} />)}
      <circle cx={x(a)} cy={yy} r="2.6" fill="#8E949A" /><circle cx={x(b)} cy={yy} r="2.6" fill="#8E949A" /></>;
  } else if (kind === 'led') {
    const yy = y ?? 104;
    const mid = (x(a) + x(b)) / 2;
    shape = <><path d={`M${x(a)} ${yy} V${yy - 8} M${x(b)} ${yy} V${yy - 8}`} stroke="#8E949A" strokeWidth="1.6" />
      <circle cx={mid} cy={yy - 14} r="8" fill="#D8362B" stroke={emphasis ? c : 'none'} strokeWidth="2" strokeDasharray={dash} />
      <text x={x(a) - 7} y={yy + 4} className="bm-plus">+</text></>;
  }
  return <g>{shape}{label && <text x={lx} y={ly} className="bm-label" fill={emphasis ? c : '#37352F'}>{label}</text>}</g>;
}
