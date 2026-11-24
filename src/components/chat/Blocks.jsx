import { BANDS } from '../../data/lab.js';
import { Rich } from '../../lib/text.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Button, Kbd, Resistor, Status, Tag } from '../ui/Primitives.jsx';
import { ZoomTile } from '../panel/Camera.jsx';

/** Which icon marks each evidence source in a run log. */
const SOURCE_ICON = { Camera: 'camera', Board: 'board', Plan: 'list', Serial: 'pulse', Code: 'code', Bench: 'zap' };

export function RunLog({ message, dispatch }) {
  const { summary, rows, open } = message;
  return (
    <div className="runlog">
      <button type="button" className="runlog-head" aria-expanded={open} onClick={() => dispatch({ type: 'toggle-runlog', id: message.id })}>
        <Icon name="scan" size={15} /><span>{summary}</span><Icon name={open ? 'chev-down' : 'chev-right'} size={14} stroke={2} />
      </button>
      {open && <ul>{rows.map(([source, status, text], i) => (
        <li key={i}>
          <Status kind={status} size={14} />
          <span className="runlog-src"><Icon name={SOURCE_ICON[source] || 'scan'} size={14} />{source}</span>
          <span><Rich text={text} /></span>
        </li>
      ))}</ul>}
    </div>
  );
}

function Options({ block, dispatch, busy }) {
  return (
    <div role="radiogroup" aria-label={block.question} className="options">
      {block.options.map((o, i) => {
        const selected = block.answer === o.id;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={selected} className={`option${selected ? ' selected' : ''}`}
            disabled={block.answer != null || busy} onClick={() => dispatch({ type: 'answer', key: block.key, value: o.id })}>
            <span className="radio" />
            <span className="option-text"><b>{o.title}</b>{o.sub && <small>{o.sub}</small>}</span>
            <Kbd>{i + 1}</Kbd>
          </button>
        );
      })}
      {block.hint && block.answer == null && <span className="hint">{block.hint}</span>}
    </div>
  );
}

function Actions({ block, dispatch, busy }) {
  return (
    <div className="row-8">
      {block.buttons.map(b => (
        <Button key={b.id} kind={b.primary ? 'primary' : 'secondary'} icon={b.icon} disabled={block.answer != null || busy}
          aria-pressed={block.answer === b.id || undefined} onClick={() => dispatch({ type: 'answer', key: block.key, value: b.id })}>
          {b.label}
        </Button>
      ))}
    </div>
  );
}

function Card({ title, tag, children, footer }) {
  return (
    <div className="card">
      <div className="card-head"><span>{title}</span>{tag}</div>
      <div className="card-body">{children}</div>
      {footer && <div className="card-foot">{footer}</div>}
    </div>
  );
}

function Metric({ label, value, expected, ok }) {
  return (
    <div className="metric">
      <Status kind={ok ? 'done' : 'fix'} size={14} />
      <span className="metric-label">{label}</span>
      <strong className={ok ? 'ok' : 'bad'}>{value}</strong>
      <span className="metric-exp">exp {expected}</span>
    </div>
  );
}

function CheckCard({ block, dispatch, busy }) {
  if (block.variant === 'pass') {
    return (
      <Card title="220Ω in place" tag={<Tag color="green" dot>Passed</Tag>}>
        <div className="grid-2"><ZoomTile zoom="goodResistor" label="On the board" value="220Ω" tone="good" /><ZoomTile zoom="litLed" label="LED" value="Lit" tone="good" /></div>
        <div className="row-8"><Metric label="Row 1 current" value="13.60 mA" expected="~13" ok /><Metric label="Row 3 voltage" value="2.01 V" expected="~2.0" ok /></div>
      </Card>
    );
  }
  const closed = block.answer != null || busy;
  return (
    <Card title="Swap the 10kΩ for a 220Ω" tag={<Tag color="red" dot>Wrong value</Tag>} footer={
      <div className="row-8">
        <Button kind="primary" icon="check" disabled={closed} onClick={() => dispatch({ type: 'answer', key: block.key, value: 'swapped' })}>I’ve swapped it</Button>
        <Button icon="camera" disabled={closed} onClick={() => dispatch({ type: 'answer', key: block.key, value: 'show' })}>Show me on camera</Button>
      </div>
    }>
      <div className="grid-2"><ZoomTile zoom="wrongResistor" label="On the board" value="10kΩ" tone="bad" /><ZoomTile zoom="spare220" label="Left of your table" value="220Ω ×2" /></div>
      <div className="row-8"><Metric label="Row 1 current" value="0.30 mA" expected="~13" /><Metric label="Row 3 voltage" value="1.83 V" expected="~2.0" /></div>
    </Card>
  );
}

function Decoder() {
  const sw = c => <i className="swatch" style={{ background: c }} />;
  return (
    <div className="decoder">
      <table>
        <thead><tr><th scope="col">Resistor</th><th scope="col">1st digit</th><th scope="col">2nd digit</th><th scope="col">Add zeros</th><th scope="col" className="right">Value</th></tr></thead>
        <tbody>
          <tr className="bad"><td><Resistor bands={BANDS['10k']} /></td><td>{sw('#7A4426')}1</td><td>{sw('#1C1A18')}0</td><td>{sw('#E2772E')}000</td><td className="right bad-text">10,000Ω</td></tr>
          <tr><td><Resistor bands={BANDS['220']} /></td><td>{sw('#C8312A')}2</td><td>{sw('#C8312A')}2</td><td>{sw('#7A4426')}0</td><td className="right ok-text">220Ω</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function CurrentChart() {
  const W = 600, H = 120;
  const y = ma => 100 - (ma / 20) * 88;
  const xs = t => 10 + (t * (W - 20)) / 60;
  const pts = Array.from({ length: 61 }, (_, t) => {
    const v = t < 24 ? 0.3 : t === 24 ? 6 : 13.6 + [0.08, -0.05, 0][t % 3];
    return `${xs(t).toFixed(1)},${y(v).toFixed(1)}`;
  }).join(' ');
  return (
    <Card title={<>Row 1 current <span className="muted">· last minute</span></>} tag={<Tag color="green" dot>Live</Tag>}>
      <div className="big-number"><strong>13.60</strong><span>mA</span></div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Row 1 current over the last minute: 0.30 milliamps until the swap, then steady at 13.6, inside the 10 to 20 milliamp safe range">
        <rect x="10" y={y(20)} width={W - 20} height={y(10) - y(20)} className="chart-band" />
        <text x={W - 14} y={y(20) + 13} textAnchor="end" className="chart-band-label">safe range 10–20 mA</text>
        <line x1="10" y1="100" x2={W - 10} y2="100" className="chart-axis" />
        <polyline points={pts} className="chart-line" />
        <circle cx={W - 10} cy={y(13.6)} r="4" className="chart-dot" />
        <line x1={xs(24)} y1="14" x2={xs(24)} y2="100" className="chart-marker" />
        <text x={xs(24) + 4} y="24" className="chart-text">swapped to 220Ω</text>
        <text x="10" y="116" className="chart-text">−60 s</text>
        <text x={W - 10} y="116" textAnchor="end" className="chart-text">now</text>
      </svg>
    </Card>
  );
}

function Diff({ block, dispatch, busy }) {
  const closed = block.answer != null || busy;
  return (
    <Card title={<>sketch.ino <span className="muted">· line 1</span></>} tag={<Tag color="blue">1 change</Tag>} footer={
      <div className="row-8">
        <Button kind="primary" icon="arrow-up" disabled={closed} onClick={() => dispatch({ type: 'answer', key: block.key, value: 'fix' })}>Fix the code and upload</Button>
        <Button disabled={closed} onClick={() => dispatch({ type: 'answer', key: block.key, value: 'wire' })}>I’ll move the wire to pin 12</Button>
      </div>
    }>
      <div className="diff">
        <div className="del"><span>−</span><code>const int leds[] = {'{'}9, 10, <mark>12</mark>{'}'};</code></div>
        <div className="add"><span>+</span><code>const int leds[] = {'{'}9, 10, <mark>11</mark>{'}'};</code></div>
      </div>
    </Card>
  );
}

function minutesBetween(a, b) {
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  return Math.max(1, toMin(b) - toMin(a));
}

function Summary({ state }) {
  const fixes = state.log.filter(e => e.status === 'fix').length;
  const mins = state.log.length > 1 ? minutesBetween(state.log[0].time, state.log.at(-1).time) : 1;
  return (
    <Card title="LED circuit · summary" tag={<Tag color="green" dot>Complete</Tag>}>
      <div className="stats">
        <div><strong>6 / 6</strong><span>steps</span></div>
        <div><strong>{fixes}</strong><span>{fixes === 1 ? 'fix caught' : 'fixes caught'}</span></div>
        <div><strong>{mins} min</strong><span>start to finish</span></div>
      </div>
      <div>
        <span className="eyebrow">What you practiced</span>
        <ul className="learned">
          <li><Icon name="list" color="var(--accent)" /><span><b>Reading resistor bands</b><small>brown–black–orange is 10kΩ; red–red–brown is 220Ω</small></span></li>
          <li><Icon name="led" color="var(--accent)" /><span><b>LED direction</b><small>the long leg goes toward + (row 3)</small></span></li>
          <li><Icon name="zap" color="var(--accent)" /><span><b>Ohm’s law</b><small>(5 V − 2 V) ÷ 220Ω ≈ 13.6 mA</small></span></li>
        </ul>
      </div>
    </Card>
  );
}

function Rating({ block, dispatch }) {
  return (
    <div className="rating">
      <div className="rating-scale">{[1, 2, 3, 4, 5, 6, 7].map(n => (
        <button key={n} type="button" aria-label={`${n} of 7`} aria-pressed={block.answer === n} disabled={block.answer != null}
          className={block.answer === n ? 'selected' : ''} onClick={() => dispatch({ type: 'answer', key: block.key, value: n })}>{n}</button>
      ))}</div>
      <div className="rating-ends"><span>Very easy</span><span>Very hard</span></div>
    </div>
  );
}

function Feedback({ block, dispatch }) {
  if (block.answer) return <p className="feedback done">{block.answer === 'right' ? 'Thanks — marked as correct.' : 'Thanks — flagged for review. Wrong calls help us tune the checks.'}</p>;
  return (
    <div className="feedback">
      <span>Was this check right?</span>
      <Button kind="ghost" small onClick={() => dispatch({ type: 'feedback', key: block.key, value: 'right' })}>Yes</Button>
      <Button kind="ghost" small onClick={() => dispatch({ type: 'feedback', key: block.key, value: 'wrong' })}>Wrong call</Button>
    </div>
  );
}

export function Block({ block, state, dispatch }) {
  const busy = Boolean(state.pending);
  switch (block.type) {
    case 'options': return <Options block={block} dispatch={dispatch} busy={busy} />;
    case 'actions': return <Actions block={block} dispatch={dispatch} busy={busy} />;
    case 'check': return <CheckCard block={block} dispatch={dispatch} busy={busy} />;
    case 'tiles': return <div className="grid-2">{block.tiles.map((t, i) => <ZoomTile key={i} {...t} />)}</div>;
    case 'decoder': return <Decoder />;
    case 'note': return <p className="note-text"><Rich text={block.text} /></p>;
    case 'chart': return <CurrentChart />;
    case 'diff': return <Diff block={block} dispatch={dispatch} busy={busy} />;
    case 'summary': return <Summary state={state} />;
    case 'rating': return <Rating block={block} dispatch={dispatch} />;
    case 'feedback': return <Feedback block={block} dispatch={dispatch} />;
    default: return null;
  }
}
