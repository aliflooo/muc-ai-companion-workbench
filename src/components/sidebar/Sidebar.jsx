import { COURSE, LAB3, LAB4, BANDS } from '../../data/lab.js';
import { Icon } from '../ui/Icon.jsx';
import { Node, PartGlyph, Resistor, Tag } from '../ui/Primitives.jsx';

// ---------------------------------------------------------------- building blocks

const SEG_COLOR = { fix: 'var(--dot-red)', unsure: 'var(--dot-yellow)', progress: 'var(--accent)' };

/** Title block with a segmented progress bar: one segment per step. */
function SideHero({ eyebrow, title, done, total, unit, current }) {
  return (
    <div className="side-hero">
      <span className="side-eyebrow">{eyebrow}</span>
      <span className="side-title">{title}</span>
      <div className="segments" role="img" aria-label={`${done} of ${total} ${unit}`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} style={{ background: i < done ? 'var(--dot-green)' : i === done && current ? SEG_COLOR[current] : undefined }} />
        ))}
      </div>
      <span className="side-count">{done} of {total} {unit}</span>
    </div>
  );
}

/**
 * Vertical timeline. items: [{ kind: done|progress|fix|unsure|todo, text, active, sub, meta, onClick }]
 * The active item is lifted onto a card; finished items show the time they passed.
 */
function Timeline({ items, label }) {
  return (
    <ol className="timeline-list" aria-label={label}>
      {items.map((it, i) => {
        const next = items[i + 1];
        const line = it.kind === 'done' && next && (next.kind === 'done' || next.active) ? 'done' : '';
        const content = it.active
          ? <div className="tl-card"><b>{it.text}</b>{it.sub && <div className="tl-sub">{it.sub}</div>}</div>
          : <div className={`tl-row${it.kind === 'done' ? ' is-done' : ''}`}>
            <div className="grow"><span className="tl-text">{it.text}</span>{it.sub && <div className="tl-sub-inline">{it.sub}</div>}</div>
            {it.meta && <span className="tl-meta">{it.meta}</span>}
          </div>;
        return (
          <li key={i} aria-current={it.active ? 'step' : undefined}>
            {next && <span className={`tl-line ${line}`} aria-hidden="true" />}
            <Node kind={it.kind} n={i + 1} />
            {it.onClick ? <button type="button" className="tl-button" onClick={it.onClick}>{content}</button> : content}
          </li>
        );
      })}
    </ol>
  );
}

const Detail = ({ children }) => <span className="side-detail">{children}</span>;
const Label = ({ children }) => <h2 className="side-label">{children}</h2>;

function Tip({ icon, children }) {
  return <div className="side-tip"><span><Icon name={icon} size={15} color="var(--accent)" /></span><p>{children}</p></div>;
}

function Frame({ hero, label, children, tip }) {
  return (
    <nav className="sidebar scroll" aria-label={label}>
      {hero}
      <Label>{label}</Label>
      {children}
      {tip && <div className="side-foot">{tip}</div>}
    </nav>
  );
}

// ---------------------------------------------------------------- per scene

function HomeSide({ dispatch }) {
  const items = COURSE.map((lab, i) => {
    if (lab.state === 'done') return { kind: 'done', text: lab.title, sub: <Detail>{lab.detail}</Detail>, meta: lab.meta };
    if (lab.state === 'current') {
      return {
        kind: 'progress', active: true, text: lab.title, sub: <>
          <span className="mini-progress"><span><i style={{ width: '66.6%' }} /></span>4/6</span>
          <Detail>Paused at step 5 — swap the resistor</Detail>
          <button type="button" className="link" onClick={() => dispatch({ type: 'preset', name: 'check' })}>Resume →</button>
        </>,
      };
    }
    return { kind: 'todo', text: lab.title, sub: <Detail>{lab.detail}</Detail>, onClick: i === 3 ? () => dispatch({ type: 'go', scene: 'debug' }) : undefined };
  });
  return (
    <Frame label="Labs" hero={<SideHero eyebrow="Your progress" title="Course labs" done={2} total={4} unit="labs done" current="progress" />}
      tip={<Tip icon="book">Labs come from your course. Projects are anything you describe in your own words.</Tip>}>
      <Timeline items={items} label="Course labs" />
      <Label>Your projects</Label>
      <button type="button" className="new-project" onClick={() => dispatch({ type: 'go', scene: 'plan' })}><Icon name="plus" size={15} stroke={2} />New project</button>
    </Frame>
  );
}

function SetupSide({ state }) {
  const { railConfirmed, done } = state.setup;
  const scanned = state.messages.some(m => m.kind === 'runlog');
  const calib = railConfirmed ? 'done' : scanned ? 'unsure' : 'progress';
  const count = 1 + (railConfirmed ? 1 : 0) + (done ? 2 : 0);
  const current = done ? null : railConfirmed ? 'progress' : calib;
  return (
    <Frame label="Checklist" hero={<SideHero eyebrow="Bench setup" title="Get your bench ready" done={count} total={4} unit="done" current={current} />}
      tip={<Tip icon="camera">Calibrate again whenever the camera or the board moves.</Tip>}>
      <Timeline label="Setup checklist" items={[
        { kind: 'done', text: 'Point the camera straight down at the board', sub: <Detail>Live · 30 fps</Detail> },
        calib === 'done'
          ? { kind: 'done', text: 'Calibrate on an empty board', sub: <Detail>Grid, rows and rails found</Detail> }
          : { kind: calib, active: true, text: 'Calibrate on an empty board', sub: scanned
            ? <><Tag color="yellow" dot>Confirm 1 thing</Tag><Detail>Which rail is + ?</Detail></>
            : <Detail>Clear the board, then tell me in the chat</Detail> },
        done ? { kind: 'done', text: 'Check the 16 sensing strips', sub: <Detail>All responding</Detail> } : { kind: railConfirmed ? 'progress' : 'todo', active: railConfirmed, text: 'Check the 16 sensing strips', sub: railConfirmed ? <Detail>Checking…</Detail> : null },
        { kind: done ? 'done' : 'todo', text: 'Plug in your Arduino over USB', sub: done ? <Detail>USB serial</Detail> : null },
      ]} />
    </Frame>
  );
}

function PlanSide({ state }) {
  const drafted = state.messages.some(m => m.kind === 'runlog');
  const items = drafted
    ? [
      { kind: 'done', text: 'Goal', sub: <Detail>Light a red LED, always on</Detail> },
      { kind: 'done', text: 'Parts list', sub: <Detail>3 kinds · 5 parts</Detail> },
      { kind: 'done', text: 'Wiring plan', sub: <Detail>Rows 1–8</Detail> },
      { kind: 'done', text: 'Assembly steps', sub: <Detail>6 steps</Detail> },
      { kind: 'progress', active: true, text: 'Review and approve', sub: <><Tag color="green" dot>Validated</Tag><Detail>Code isn’t needed — no Arduino in this build</Detail></> },
    ]
    : [
      { kind: 'progress', active: true, text: 'Goal', sub: <Detail>{state.pending ? 'Drafting…' : 'Answer the question in the chat'}</Detail> },
      { kind: 'todo', text: 'Parts list' },
      { kind: 'todo', text: 'Wiring plan' },
      { kind: 'todo', text: 'Assembly steps' },
      { kind: 'todo', text: 'Review and approve' },
    ];
  return (
    <Frame label="Build spec" hero={<SideHero eyebrow="New project · Plan" title="LED circuit" done={drafted ? 4 : 0} total={5} unit="parts of the spec" current="progress" />}
      tip={<Tip icon="list">The spec is shared: you, the camera and the board all check against it.</Tip>}>
      <Timeline items={items} label="Build spec" />
    </Frame>
  );
}

function PartRow({ glyph, name, sub, kind, muted }) {
  return (
    <li className={`part-row${muted ? ' muted-row' : ''}`}>
      <span className="part-chip">{glyph}</span>
      <span className="grow"><b>{name}</b><small className={kind === 'unsure' ? 'warn-text' : ''}>{sub}</small></span>
      {(kind === 'done' || kind === 'unsure') && <Node kind={kind} n={0} />}
    </li>
  );
}

function PartsSide({ state }) {
  const scanned = state.parts.scanned;
  const glyph = { led: <PartGlyph kind="led" />, 220: <Resistor bands={BANDS['220']} scale={0.7} />, jumper: <PartGlyph kind="jumper" />, '10k': <Resistor bands={BANDS['10k']} scale={0.7} />, button: <PartGlyph kind="button" />, cap: <PartGlyph kind="cap" /> };
  return (
    <Frame label="Needed for this build" hero={<SideHero eyebrow="Lab 3 · Parts" title={LAB3.title} done={scanned ? 3 : 0} total={3} unit="parts ready" current={scanned ? null : 'progress'} />}
      tip={<Tip icon="camera">I match parts by shape, color and bands. Spread them out so none overlap.</Tip>}>
      <ul className="part-list">{LAB3.parts.map(p => (
        <PartRow key={p.id} glyph={glyph[p.id]} name={p.name} sub={scanned ? `need ${p.need} · found ${p.have}` : `need ${p.need}`} kind={scanned ? 'done' : 'todo'} />
      ))}</ul>
      {scanned && <>
        <Label>Also on the table</Label>
        <ul className="part-list tight">{LAB3.extras.map(p => (
          <PartRow key={p.id} glyph={glyph[p.id]} name={p.name} sub={p.note} kind={p.id === '10k' ? 'unsure' : 'todo'} muted />
        ))}</ul>
      </>}
    </Frame>
  );
}

const STEP_TAG = {
  fix3: <><Tag color="red" dot>Flip it</Tag><Detail>Long leg goes in row 3</Detail></>,
  unsure3: <><Tag color="yellow" dot>Needs your answer</Tag><Detail>Rows 3–4 · which leg is long?</Detail></>,
  fix5: <><Tag color="red" dot>Wrong value</Tag><Detail>Rows 1 → 3 · found 10kΩ, needs 220Ω</Detail></>,
};

function lab3Items(build, complete) {
  return LAB3.steps.map((s, i) => {
    const n = i + 1;
    const status = complete ? 'done' : build.statuses[n];
    if (status === 'done') return { kind: 'done', text: s.text, meta: build.times[n] };
    if (!complete && n === build.step) {
      const kind = status || 'progress';
      return { kind, active: true, text: s.text, sub: STEP_TAG[`${kind}${n}`] || <><Tag color="blue" dot>In progress</Tag><Detail>Tell me in the chat when it’s done</Detail></> };
    }
    return { kind: 'todo', text: s.text };
  });
}

function BuildSide({ state }) {
  const { build } = state;
  const done = Object.values(build.statuses).filter(v => v === 'done').length;
  const current = build.statuses[build.step] || 'progress';
  return (
    <Frame label="Steps" hero={<SideHero eyebrow="Lab 3 · Build" title={LAB3.title} done={done} total={6} unit="steps" current={current} />}
      tip={<Tip icon="eye">I check each step when your hands leave the board — camera and board readings together.</Tip>}>
      <Timeline items={lab3Items(build)} label="Lab 3 steps" />
    </Frame>
  );
}

function TestSide({ state }) {
  const t = state.build.times[5];
  const lit = state.test.lit;
  return (
    <Frame label="Tests" hero={<SideHero eyebrow="Lab 3 · Test" title={LAB3.title} done={lit ? 3 : 2} total={3} unit="tests" current="progress" />}
      tip={<Tip icon="zap">Once power is on I switch from checking connections to watching live current.</Tip>}>
      <Timeline label="Lab 3 tests" items={LAB3.tests.map((x, i) => (i < 2
        ? { kind: 'done', text: x.text, sub: <Detail>{x.detail}</Detail>, meta: t }
        : { kind: 'progress', active: true, text: x.text, sub: <><Tag color="blue" dot>Your turn</Tag><Detail>{x.detail}</Detail></> }))} />
    </Frame>
  );
}

function DoneSide({ state }) {
  return (
    <Frame label="Steps" hero={<SideHero eyebrow="Lab 3 · Complete" title={LAB3.title} done={6} total={6} unit="steps" />}
      tip={<Tip icon="book">Your notes, photos and checks are saved with this session.</Tip>}>
      <Timeline items={lab3Items({ ...state.build, times: { ...state.build.times, 6: state.log.at(-1)?.time } }, true)} label="Lab 3 steps" />
    </Frame>
  );
}

function DebugSide({ state }) {
  const { reported, fixed } = state.debug;
  const green = fixed
    ? { kind: 'done', text: LAB4.tests[3].text, sub: <Detail>{state.debug.fixedBy === 'code' ? 'Sketch now drives pin 11' : 'Wire moved to pin 12'}</Detail> }
    : reported
      ? { kind: 'fix', active: true, text: LAB4.tests[3].text, sub: <><Tag color="red" dot>Stays dark</Tag><Detail>Sketch drives pin 12 instead</Detail></> }
      : { kind: 'progress', active: true, text: LAB4.tests[3].text, sub: <Detail>Watching — tell me if it looks wrong</Detail> };
  const done = 3 + (fixed ? 1 : 0);
  return (
    <Frame label="Tests" hero={<SideHero eyebrow="Lab 4 · Test" title={LAB4.title} done={done} total={4} unit="tests" current={fixed ? null : reported ? 'fix' : 'progress'} />}
      tip={<Tip icon="pulse">When you ask for help, I also read the serial output and how much current each row draws.</Tip>}>
      <Timeline label="Lab 4 tests" items={[
        ...LAB4.tests.slice(0, 3).map(x => ({ kind: 'done', text: x.text, sub: x.detail ? <Detail>{x.detail}</Detail> : null })),
        green,
      ]} />
    </Frame>
  );
}

export function Sidebar({ state, dispatch }) {
  switch (state.scene) {
    case 'home': return <HomeSide dispatch={dispatch} />;
    case 'setup': return <SetupSide state={state} />;
    case 'plan': return <PlanSide state={state} />;
    case 'parts': return <PartsSide state={state} />;
    case 'build': return <BuildSide state={state} />;
    case 'test': return <TestSide state={state} />;
    case 'done': return <DoneSide state={state} />;
    case 'debug': return <DebugSide state={state} />;
    default: return null;
  }
}
