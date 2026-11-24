import { useEffect, useRef, useState } from 'react';
import { Icon } from './ui/Icon.jsx';
import { Mark, Status, Tag } from './ui/Primitives.jsx';

const PROJECT = {
  home: ['home', 'Home', ''],
  setup: ['sliders', 'Bench setup', ''],
  plan: ['led', 'New project', 'LED circuit'],
  parts: ['led', 'Lab 3', 'LED circuit'],
  build: ['led', 'Lab 3', 'LED circuit'],
  test: ['led', 'Lab 3', 'LED circuit'],
  done: ['led', 'Lab 3', 'LED circuit'],
  debug: ['led', 'Lab 4', 'Three LEDs'],
};

const LAB_PHASES = ['Plan', 'Parts', 'Build', 'Test'];

function phases(state) {
  const { scene, build, setup } = state;
  if (scene === 'setup') {
    const current = setup.done ? null : setup.railConfirmed ? 'Sensing' : 'Calibrate';
    const done = setup.done ? ['Camera', 'Calibrate', 'Sensing', 'Arduino'] : setup.railConfirmed ? ['Camera', 'Calibrate'] : ['Camera'];
    return { list: ['Camera', 'Calibrate', 'Sensing', 'Arduino'], current, done };
  }
  const at = { plan: 0, parts: 1, build: 2, test: 3, debug: 3, done: 4 }[scene];
  if (at === undefined) return null;
  const progress = scene === 'build' ? `${Object.values(build.statuses).filter(v => v === 'done').length}/6` : null;
  return { list: LAB_PHASES, current: LAB_PHASES[at], done: LAB_PHASES.slice(0, at), progress };
}

function PhaseNav({ state }) {
  const p = phases(state);
  if (!p) return null;
  return (
    <nav className="phases" aria-label="Project phases">
      {p.list.map((name, i) => {
        const isCur = name === p.current;
        const isDone = p.done.includes(name);
        return (
          <span key={name} className="phase-wrap">
            <span className={`phase${isCur ? ' current' : ''}`} aria-current={isCur ? 'step' : undefined}>
              {isDone ? <Status kind="done" size={14} /> : <span className={`phase-dot${isCur ? ' on' : ''}`} />}
              {name}
              {isCur && p.progress && <span className="phase-meta">{p.progress}</span>}
            </span>
            {i < p.list.length - 1 && <span className="phase-sep" aria-hidden="true" />}
          </span>
        );
      })}
    </nav>
  );
}

function ProjectMenu({ state, dispatch }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [icon, label, sub] = PROJECT[state.scene];

  useEffect(() => {
    if (!open) return undefined;
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const go = action => { setOpen(false); dispatch(action); };
  const items = [
    ['home', 'Home', '', { type: 'go', scene: 'home' }],
    ['led', 'Lab 3', 'LED circuit', { type: 'preset', name: 'check' }],
    ['led', 'Lab 4', 'Three LEDs', { type: 'go', scene: 'debug' }],
    ['plus', 'New project', '', { type: 'go', scene: 'plan' }],
    ['sliders', 'Bench setup', '', { type: 'go', scene: 'setup' }],
  ];

  return (
    <div className="project" ref={ref}>
      <button type="button" className="project-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Icon name={icon} size={16} color="var(--text-2)" /><b>{label}</b>{sub && <span className="hide-sm muted">{sub}</span>}<Icon name="chev-down" size={14} stroke={2} color="var(--text-3)" />
      </button>
      {open && (
        <div className="menu" role="menu">
          {items.map(([ic, l, s, action]) => (
            <button key={l} type="button" role="menuitem" onClick={() => go(action)}>
              <Icon name={ic} size={15} color="var(--text-2)" /><span>{l}</span>{s && <span className="muted">{s}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AppBar({ state, dispatch }) {
  const settingUp = state.scene === 'setup' && !state.setup.done;
  return (
    <header className="appbar">
      <button type="button" className="home-btn" aria-label="Home" onClick={() => dispatch({ type: 'go', scene: 'home' })}><Mark size={24} /></button>
      <ProjectMenu state={state} dispatch={dispatch} />
      <div className="appbar-center"><PhaseNav state={state} /></div>
      <div className="appbar-right">
        <button type="button" className="bench-pill" onClick={() => dispatch({ type: 'go', scene: 'setup' })} title="Camera, board and Arduino — open bench setup">
          <span className="bench-dots" aria-hidden="true"><i /><i /><i /></span>{settingUp ? 'Setting up' : 'Bench live'}
        </button>
        <span className="hide-sm"><Tag>Demo data</Tag></span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'reset' })}><Icon name="rotate" size={14} stroke={1.9} />Reset demo</button>
      </div>
    </header>
  );
}
