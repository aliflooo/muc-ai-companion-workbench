import { useEffect, useRef } from 'react';
import { BOXES, IMAGES, LAB3, READINGS, BANDS, sketch, serialLog } from '../../data/lab.js';
import { Tag, Status, Resistor, PartGlyph } from '../ui/Primitives.jsx';
import { CameraView } from './Camera.jsx';
import { BoardMap } from './BoardMap.jsx';

const TABS = {
  home: ['bench'],
  setup: ['camera'],
  plan: ['plan', 'map'],
  parts: ['bench', 'plan'],
  build: ['bench', 'map', 'plan'],
  test: ['bench', 'map', 'plan'],
  done: ['session', 'bench'],
  debug: ['code', 'bench'],
};
const TAB_LABEL = { bench: 'Bench', camera: 'Camera', plan: 'Plan', map: 'Board map', code: 'Code', session: 'Session' };

export function ContextPanel({ state, dispatch }) {
  const tabs = TABS[state.scene];
  const tab = tabs.includes(state.tab) ? state.tab : tabs[0];
  const ref = useRef(null);

  // "Show me on camera": on narrow screens the panel sits below the chat, so bring it into view.
  useEffect(() => {
    if (state.highlight && window.matchMedia('(max-width: 1000px)').matches) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.highlight]);

  return (
    <aside className="panel" aria-label="Context panel" ref={ref}>
      <div className="panel-head">
        <div role="tablist" aria-label="Panel" className="segmented">
          {tabs.map(t => (
            <button key={t} type="button" role="tab" aria-selected={t === tab} onClick={() => dispatch({ type: 'tab', tab: t })}>{TAB_LABEL[t]}</button>
          ))}
        </div>
        <span className="panel-meta">{meta(state, tab)}</span>
      </div>
      <div className="panel-body scroll">
        <PanelBody state={state} tab={tab} />
      </div>
    </aside>
  );
}

function meta(state, tab) {
  if (state.pending) return 'Checking…';
  if (state.scene === 'home') return 'All systems ready';
  if (state.scene === 'setup') return state.setup.done ? 'Calibrated' : 'Calibrating';
  if (tab === 'plan') return state.plan.choice ? <Tag color="green" dot>Validated</Tag> : <Tag>Draft</Tag>;
  if (state.scene === 'test') return 'Live';
  return '';
}

export function Section({ title, meta, children }) {
  return (
    <section className="section">
      {title && <div className="section-head"><h2>{title}</h2>{meta && <span>{meta}</span>}</div>}
      {children}
    </section>
  );
}

function PanelBody({ state, tab }) {
  if (tab === 'plan') return <PlanDoc />;
  if (tab === 'map') return <MapTab state={state} />;
  if (tab === 'code') return <CodeTab state={state} />;
  if (tab === 'session') return <SessionTab state={state} />;
  if (tab === 'camera') return <SetupTab state={state} />;
  switch (state.scene) {
    case 'home': return <HomeBench />;
    case 'parts': return <PartsBench state={state} />;
    case 'build': return <BuildBench state={state} />;
    case 'test': return <TestBench />;
    case 'done': return <TestBench />;
    case 'debug': return <Section title="Overhead camera" meta="pins 9, 10, 11">
      <CameraView src={IMAGES.lab4} alt="Three LEDs wired to an Arduino Uno" overlays={[
        { box: BOXES.lab4Led1, tone: 'good', label: 'Red' },
        { box: BOXES.lab4Led2, tone: 'good', label: 'Yellow' },
        { box: BOXES.lab4Led3, tone: state.debug.fixed ? 'good' : 'bad', label: state.debug.fixed ? 'Green' : 'Green · dark' },
      ]} />
    </Section>;
    default: return null;
  }
}

// ---------------------------------------------------------------- shared pieces

export function CheckRows({ rows }) {
  return <ul className="check-rows">{rows.map(([kind, title, sub, right], i) => (
    <li key={i}><Status kind={kind} /><span className="grow"><b>{title}</b>{sub && <small>{sub}</small>}</span>{right && <span className="muted-sm">{right}</span>}</li>
  ))}</ul>;
}

function RowsTable({ data }) {
  const empty = [2, 5, 6, 7].filter(n => !data[n]);
  return (
    <table className="rows-table">
      <thead><tr><th scope="col">Row</th><th scope="col">V</th><th scope="col">mA</th><th scope="col">mW</th><th scope="col"><span className="sr-only">Status</span></th></tr></thead>
      <tbody>
        {[1, 3, 4, 8].map(n => {
          const [v, ma, mw, st] = data[n];
          const bad = st === 'bad';
          return <tr key={n} className={bad ? 'bad' : ''}>
            <th scope="row">{n}</th>
            <td className={bad && n === 3 ? 'hl' : ''}>{v}</td>
            <td className={bad && n === 1 ? 'hl' : ''}>{ma}</td>
            <td className="muted">{mw}</td>
            <td><Status kind={bad ? 'fix' : 'done'} size={14} /></td>
          </tr>;
        })}
        {empty.length > 0 && <tr><th scope="row" className="muted">2, 5–7</th><td colSpan="4" className="muted left">No connection</td></tr>}
      </tbody>
    </table>
  );
}

function PartsMatch({ rows }) {
  return <ul className="parts-match">{rows.map(([glyph, name, note, nh, tone], i) => (
    <li key={i} className={`tone-${tone}`}>{glyph}<span className="grow"><b>{name}</b> <span className="note">{note}</span></span><span className="nh">{nh}</span></li>
  ))}</ul>;
}

// ---------------------------------------------------------------- scene bodies

function HomeBench() {
  return <>
    <Section title="Bench check" meta="Ready">
      <CheckRows rows={[
        ['live', 'Overhead camera', 'Top-down · 30 fps', 'Live'],
        ['done', 'Board calibration', 'Grid, rows and rails found', 'Today'],
        ['done', 'Sensing breadboard', '16 strips responding', 'OK'],
        ['done', 'Arduino Uno', 'USB serial', 'Connected'],
      ]} />
    </Section>
    <Section title="On your table" meta="12 parts seen">
      <CameraView src={IMAGES.partsOnTable} alt="Parts laid out on the cutting mat next to an empty breadboard" overlays={[
        { box: BOXES.table220, label: 'Resistors ×3', dashed: true },
        { box: BOXES.tableLeds, label: 'LEDs ×2', dashed: true },
      ]} time="now" />
    </Section>
    <Section title="Recent sessions">
      <CheckRows rows={[
        ['progress', 'Lab 3 · LED circuit', 'Paused at step 5', 'Today'],
        ['done', 'Lab 2 · Button + LED', 'All tests passed', 'Nov 21'],
        ['done', 'Lab 1 · Blink', 'All tests passed', 'Nov 18'],
      ]} />
    </Section>
  </>;
}

function SetupTab({ state }) {
  const { railConfirmed, done } = state.setup;
  const scanned = state.messages.some(m => m.kind === 'runlog');
  return <>
    <Section title="Calibration frame" meta="empty board">
      <CameraView src={IMAGES.emptyBoard} alt="Empty breadboard with an Arduino Uno beside it, grid lines found by calibration" overlays={scanned ? [
        { box: BOXES.row1, tone: 'info', label: 'Row 1', place: 'bottom' },
        { box: BOXES.plusRail, tone: railConfirmed ? 'good' : 'bad', label: railConfirmed ? '+ rail' : '+ rail?' },
      ] : []} />
    </Section>
    <Section title="What I found" meta={scanned ? `${[1, 1, railConfirmed, 1, done].filter(Boolean).length} of 5` : 'waiting'}>
      <CheckRows rows={[
        [scanned ? 'done' : 'todo', 'Hole grid', '2.54 mm spacing · view flattened'],
        [scanned ? 'done' : 'todo', 'Orientation', 'Row 1 on the left'],
        [railConfirmed ? 'done' : scanned ? 'unsure' : 'todo', 'Power rails', '+ along the top edge', scanned && !railConfirmed ? 'Confirm' : ''],
        [scanned ? 'done' : 'todo', 'Arduino Uno', 'Left of the board'],
        [done ? 'done' : 'todo', 'Sensing strips', '16 strips · rows 1–16', done ? '' : 'Next'],
      ]} />
    </Section>
  </>;
}

function PlanDoc() {
  return <>
    <Section>
      <div className="doc-head">
        <h2>{LAB3.title}</h2>
        <div className="row-6"><Tag color="blue">Stays on</Tag><Tag>No code</Tag><Tag>6 steps</Tag></div>
        <p>{LAB3.goal}</p>
      </div>
    </Section>
    <Section title="Parts" meta="5 parts">
      <table className="doc-table"><tbody>
        <tr><td><PartGlyph kind="led" /></td><td><b>Red LED</b></td><td className="muted">long leg is +</td><td className="muted right">×1</td></tr>
        <tr><td><Resistor bands={BANDS['220']} scale={0.7} /></td><td><b>220Ω resistor</b></td><td className="muted">red · red · brown</td><td className="muted right">×1</td></tr>
        <tr><td><PartGlyph kind="jumper" /></td><td><b>Jumper wires</b></td><td className="muted">any colors</td><td className="muted right">×3</td></tr>
      </tbody></table>
    </Section>
    <Section title="Wiring plan" meta="rows 1–8">
      <BoardMap parts={PLAN_PARTS} />
    </Section>
    <Section title="Steps" meta="6">
      <ol className="doc-steps">{LAB3.steps.map((s, i) => <li key={i}><span>{i + 1}</span>{s.text}</li>)}</ol>
    </Section>
  </>;
}

const PLAN_PARTS = [
  { kind: 'rail', rail: '+', a: 1, wire: '#C8312A' },
  { kind: 'rail', rail: '-', a: 8, wire: '#37352F' },
  { kind: 'res', a: 1, b: 3, y: 74 },
  { kind: 'led', a: 3, b: 4, y: 104 },
  { kind: 'jumper', a: 4, b: 8, y: 128 },
];

function PartsBench({ state }) {
  const scanned = state.parts.scanned;
  return <>
    <Section title="On your table" meta={scanned ? '12 parts' : 'waiting for you'}>
      <CameraView src={IMAGES.partsOnTable} alt="Parts laid out on the cutting mat" overlays={scanned ? [
        { box: BOXES.table220, tone: 'good', label: '220Ω ×2' },
        { box: BOXES.table10k, tone: 'warn', label: '10kΩ · set aside', place: 'right' },
        { box: BOXES.tableLeds, tone: 'good' },
        { box: BOXES.tableJumpers, tone: 'good' },
        { box: BOXES.tableButton, dashed: true },
        { box: BOXES.tableCap, dashed: true },
      ] : []} />
    </Section>
    <Section title="Matched to the plan" meta="need / have">
      {scanned ? <PartsMatch rows={[
        [<PartGlyph key="g" kind="led" />, 'Red LED', '×2 on the table', '1 / 2', 'ok'],
        [<Resistor key="g" bands={BANDS['220']} scale={0.8} />, '220Ω', '×2 on the table', '1 / 2', 'ok'],
        [<PartGlyph key="g" kind="jumper" />, 'Jumpers', '×5 on the table', '3 / 5', 'ok'],
        [<Resistor key="g" bands={BANDS['10k']} scale={0.8} />, '10kΩ', 'not in the plan — set aside', '0 / 1', 'warn'],
      ]} /> : <p className="empty-note">Lay your parts out and I’ll match them to the plan.</p>}
    </Section>
  </>;
}

function buildCamera(state) {
  const { step, statuses } = state.build;
  if (step <= 2) return { src: IMAGES.partsOnTable, alt: 'Empty breadboard; parts on the table', overlays: [] };
  if (step <= 4) {
    const unsure = statuses[3] === 'unsure';
    return {
      src: IMAGES.ledUnsure, alt: 'Breadboard with rail jumpers and the LED across rows 3 and 4',
      overlays: unsure ? [
        { box: BOXES.row3, tone: 'info', fill: 'rgba(35,131,226,.16)' },
        { box: BOXES.row4, tone: 'info', fill: 'rgba(35,131,226,.16)' },
        { box: BOXES.ledLeaning, tone: 'warn', label: 'Can’t see the legs', dashed: true },
      ] : [{ box: BOXES.ledLeaning, tone: 'good', label: 'LED · rows 3–4' }],
    };
  }
  if (statuses[5] === 'fix') {
    return {
      src: IMAGES.wrongResistor, alt: 'A 10k resistor in rows 1 to 3; two 220 ohm resistors on the left of the table',
      overlays: [
        { box: BOXES.resistor, tone: 'bad', label: '10kΩ · expected 220Ω' },
        { box: BOXES.spare220, dashed: true },
        { box: BOXES.led },
      ],
    };
  }
  return { src: IMAGES.ledLit, alt: 'The 220 ohm resistor in rows 1 to 3 and the LED lit', overlays: [{ box: BOXES.resistor, tone: 'good', label: '220Ω', place: 'bottom' }] };
}

function BuildBench({ state }) {
  const cam = buildCamera(state);
  const { step, statuses } = state.build;
  const powered = step >= 5 && statuses[5] !== undefined;
  return <>
    <Section title="Overhead camera" meta="rows 1–8 in view">
      <CameraView {...cam} flash={state.highlight} />
    </Section>
    {powered
      ? <Section title="Rows 1–8" meta="5.02 V supply"><RowsTable data={statuses[5] === 'fix' ? READINGS.wrong : READINGS.fixed} /></Section>
      : <Section title="Board connections" meta="not powered yet">
        <CheckRows rows={[
          [step > 2 ? 'done' : 'todo', '+ rail → row 1', 'Red jumper', step > 2 ? 'connected' : ''],
          [step > 2 ? 'done' : 'todo', '− rail → row 8', 'Black jumper', step > 2 ? 'connected' : ''],
          [statuses[3] === 'unsure' ? 'unsure' : statuses[3] === 'done' ? 'done' : 'todo', 'Row 3 ↔ row 4', 'The LED', statuses[3] === 'unsure' ? '?' : ''],
          [statuses[4] === 'done' ? 'done' : 'todo', 'Row 4 → row 8', 'Yellow jumper'],
        ]} />
        <p className="empty-note">Live current readings start when you power the circuit.</p>
      </Section>}
    <Section title="Parts" meta="need / have">
      {statuses[5] === 'fix'
        ? <PartsMatch rows={[
          [<Resistor key="g" bands={BANDS['10k']} scale={0.8} />, '10kΩ', 'on board, not in the plan', '0 / 1', 'bad'],
          [<Resistor key="g" bands={BANDS['220']} scale={0.8} />, '220Ω', 'needed in rows 1 → 3', '1 / 2', 'bad'],
        ]} />
        : <PartsMatch rows={[
          [<PartGlyph key="g" kind="led" />, 'Red LED', step >= 3 ? 'on the board' : 'on the table', '1 / 2', 'ok'],
          [<Resistor key="g" bands={BANDS['220']} scale={0.8} />, '220Ω', statuses[5] === 'done' ? 'on the board' : 'on the table', '1 / 2', 'ok'],
          [<PartGlyph key="g" kind="jumper" />, 'Jumpers', '3 needed', '3 / 5', 'ok'],
        ]} />}
    </Section>
  </>;
}

function TestBench() {
  return <>
    <Section title="Overhead camera" meta="LED glowing">
      <CameraView src={IMAGES.ledLit} alt="The LED is lit" overlays={[
        { box: BOXES.resistor, tone: 'good', label: '220Ω' },
        { box: BOXES.ledLit, tone: 'good', label: 'Lit · 13.6 mA', place: 'right' },
      ]} />
    </Section>
    <Section title="Rows 1–8" meta="live · 5.02 V supply"><RowsTable data={READINGS.fixed} /></Section>
    <Section title="Power">
      <dl className="kv">
        <dt>Supply</dt><dd>5.02 V from USB</dd>
        <dt>Total draw</dt><dd>13.6 mA · 68 mW</dd>
        <dt>LED limit</dt><dd>20 mA <Tag color="green">68% of max</Tag></dd>
      </dl>
    </Section>
  </>;
}

function mapParts(state) {
  if (state.scene !== 'build') {
    return PLAN_PARTS.map(p => ({ ...p, state: 'ok' }));
  }
  const { step, statuses } = state.build;
  const parts = [];
  if (step > 2) parts.push({ kind: 'rail', rail: '+', a: 1, wire: '#C8312A' }, { kind: 'rail', rail: '-', a: 8, wire: '#37352F' });
  if (step >= 3) parts.push({ kind: 'led', a: 3, b: 4, y: 124, state: statuses[3] === 'unsure' ? 'warn' : 'ok', ...(statuses[3] === 'unsure' ? { label: 'which leg is long?', lx: 168, ly: 116 } : {}) });
  if (statuses[4] === 'done') parts.push({ kind: 'jumper', a: 4, b: 8, y: 138 });
  if (statuses[5] === 'fix') parts.push({ kind: 'res', a: 1, b: 3, y: 74, state: 'bad', bands: BANDS['10k'], label: '10kΩ — plan says 220Ω', lx: 40, ly: 96 });
  if (statuses[5] === 'done') parts.push({ kind: 'res', a: 1, b: 3, y: 74 });
  if (step <= 5 && statuses[5] !== 'fix' && statuses[5] !== 'done') parts.push({ kind: 'res', a: 1, b: 3, y: 74, state: 'plan' });
  return parts;
}

function MapTab({ state }) {
  const fail = state.scene === 'build' && state.build.statuses[5] === 'fix';
  return <>
    <Section title="Plan vs. what I see" meta="rows 1–8">
      <BoardMap parts={mapParts(state)} height={176} highlight={fail ? [1, 3] : []} />
      <div className="legend"><span><i className="sw ok" />Matches plan</span><span><i className="sw bad" />Doesn’t match</span><span><i className="sw plan" />Not placed yet</span></div>
    </Section>
    {fail && <Section title="Row by row" meta="camera + board">
      <table className="fusion">
        <thead><tr><th scope="col">Row</th><th scope="col">Plan</th><th scope="col">Camera</th><th scope="col">Board</th><th scope="col"><span className="sr-only">Match</span></th></tr></thead>
        <tbody>
          <tr className="bad"><th scope="row">1</th><td className="muted">+ rail, 220Ω</td><td>jumper, 10kΩ</td><td>0.30 mA</td><td><Status kind="fix" size={14} /></td></tr>
          <tr className="bad"><th scope="row">3</th><td className="muted">220Ω, LED +</td><td>10kΩ, LED +</td><td>1.83 V</td><td><Status kind="fix" size={14} /></td></tr>
          <tr><th scope="row">4</th><td className="muted">LED −, jumper</td><td>LED −, jumper</td><td>0.00 V</td><td><Status kind="done" size={14} /></td></tr>
          <tr><th scope="row">8</th><td className="muted">jumper, − rail</td><td>jumper, − rail</td><td>0.00 V</td><td><Status kind="done" size={14} /></td></tr>
        </tbody>
      </table>
    </Section>}
    {fail && <Section title="How sure I am">
      <CheckRows rows={[
        ['done', '10kΩ leads in h1 and h3', 'Camera sees both leads clearly', 'High'],
        ['done', 'LED legs in g3 and g4', 'Long leg in row 3, confirmed at step 3', 'High'],
      ]} />
    </Section>}
  </>;
}

function CodeTab({ state }) {
  const pin = state.debug.fixedBy === 'code' ? 11 : 12;
  const bad = !state.debug.fixed;
  return <>
    <Section title="sketch.ino" meta={<>Uploaded · <Tag>Uno</Tag></>}>
      <pre className="code" aria-label="Arduino sketch">{sketch(pin).map((line, i) => (
        <div key={i} className={i === 0 && bad && state.debug.reported ? 'bad' : i === 0 && state.debug.fixedBy === 'code' ? 'good' : ''}>
          <span className="ln">{i + 1}</span><span>{line || '​'}</span>
        </div>
      ))}</pre>
    </Section>
    <Section title="Serial monitor" meta="9600 baud">
      <pre className="serial" aria-label="Serial output">{serialLog(pin).map(([t, line], i) => (
        <div key={i} className={line.includes('pin 12') && bad ? 'bad' : ''}><span className="ts">{t}</span><span>{line}</span></div>
      ))}</pre>
    </Section>
  </>;
}

function SessionTab({ state }) {
  return <>
    <Section title="Finished circuit" meta={state.log.at(-1)?.time}>
      <CameraView src={IMAGES.ledLit} alt="The finished circuit with the LED lit" overlays={[{ box: BOXES.ledLit, tone: 'good', label: 'Lit' }]} live={false} />
    </Section>
    <Section title="Session timeline" meta={state.log.length ? `${state.log[0].time} – ${state.log.at(-1).time}` : ''}>
      <ul className="timeline">{state.log.map((e, i) => (
        <li key={i}><Status kind={e.status} size={14} /><span className="ts">{e.time}</span><span><b>{e.title}</b><small>{e.sub}</small></span></li>
      ))}</ul>
    </Section>
  </>;
}
