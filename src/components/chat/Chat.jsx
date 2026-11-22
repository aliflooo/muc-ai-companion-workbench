import { useEffect, useRef, useState } from 'react';
import { Rich } from '../../lib/text.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Button, IconButton, Mark, Status, Tag, PartGlyph } from '../ui/Primitives.jsx';
import { ZoomTile } from '../panel/Camera.jsx';
import { Block, RunLog } from './Blocks.jsx';

function sessionState(state) {
  if (state.pending) return ['Checking…', 'blue'];
  if (state.scene === 'home') return ['Ready', 'gray'];
  if (state.scene === 'done') return ['Session complete', 'green'];
  const waiting = state.messages.some(m => m.blocks?.some(b => ['options', 'check', 'diff'].includes(b.type) && b.on && b.answer == null));
  return waiting ? ['Waiting for you', 'yellow'] : ['Watching the bench', 'green'];
}

function chipsFor(state) {
  const { scene, build, debug, setup, parts } = state;
  if (scene === 'home') return ['What can I build with my kit?', 'How does a breadboard work?'];
  if (scene === 'setup') return setup.started && !state.messages.some(m => m.kind === 'runlog') ? ['ok, it’s empty', 'What does calibration do?'] : ['What does calibration do?'];
  if (scene === 'plan') return ['Why 220Ω?', 'What can I build with my kit?'];
  if (scene === 'parts') return parts.scanned ? ['How can I tell them apart?', 'I’m missing a part'] : ['ok they’re all out', 'I’m missing a part'];
  if (scene === 'build') {
    if (build.statuses[5] === 'fix') return ['How do I read bands?', 'Why 13 mA?', 'Where is row 3?'];
    if (build.statuses[3] === 'unsure') return ['Why does direction matter?'];
    const q = { 2: 'How does a breadboard work?', 3: 'Why does direction matter?', 4: 'Where is row 4?', 5: 'How do I read bands?' }[build.step];
    return [build.statuses[build.step] === 'fix' ? 'Done — it’s flipped' : `Done with step ${build.step}`, q];
  }
  if (scene === 'test') return ['Why 2 volts?', 'What if I used a 1kΩ?'];
  if (scene === 'done') return ['What can I build with my kit?', 'Explain Ohm’s law again'];
  if (scene === 'debug') {
    if (!debug.reported) return ['The green one isn’t blinking', 'Explain the loop'];
    if (debug.movingWire && !debug.fixed) return ['Done — wire moved'];
    return ['Why didn’t it error?', 'Explain the loop'];
  }
  return [];
}

function Message({ message, state, dispatch }) {
  switch (message.kind) {
    case 'you':
      return <div className="msg-you">{message.text}</div>;
    case 'divider':
      return <div className="divider"><span /><span className="divider-text"><Status kind={message.tone} size={13} />{message.text}</span><span /></div>;
    case 'activity':
      return <div className="activity"><Icon name={message.icon} size={15} color={message.tone === 'ok' ? 'var(--dot-green)' : undefined} /><span>{message.text}</span><time>{message.time}</time></div>;
    case 'runlog':
      return <RunLog message={message} dispatch={dispatch} />;
    case 'assistant':
      return (
        <div className="msg-assistant">
          <AssistantAvatar />
          <div className="msg-body">
            <div className="msg-meta"><b>Lab assistant</b><time>{message.time}</time></div>
            <p><Rich text={message.text} /></p>
            {message.blocks?.map((b, i) => <Block key={b.key || i} block={b} state={state} dispatch={dispatch} />)}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function AssistantAvatar({ size = 28 }) {
  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24"><g fill="#fff"><circle cx="6" cy="8" r="2.3" /><circle cx="12" cy="8" r="2.3" /><circle cx="18" cy="8" r="2.3" fill="#FFD3A8" /><circle cx="6" cy="16" r="2.3" /><circle cx="12" cy="16" r="2.3" /><circle cx="18" cy="16" r="2.3" /></g></svg>
    </span>
  );
}

function Pending({ label }) {
  return (
    <div className="msg-assistant pending" role="status">
      <AssistantAvatar />
      <span className="typing"><i /><i /><i /></span>
      <span className="pending-label">{label}</span>
    </div>
  );
}

function HomeHero({ dispatch }) {
  return (
    <div className="home">
      <div className="home-hero">
        <Mark size={44} />
        <h2>What do you want to build today?</h2>
        <p>Describe it in your own words. I’ll plan the parts, wiring and steps — then watch your bench and check each step with you.</p>
      </div>
      <div className="resume">
        <div className="resume-thumb"><ZoomTile zoom="wrongResistor" /></div>
        <div className="grow">
          <span className="muted-sm">Continue where you left off</span>
          <b>Lab 3 · LED circuit</b>
          <span className="muted">Paused at step 5 — the resistor needs swapping</span>
          <span className="mini-progress"><span><i style={{ width: '66.6%' }} /></span>4 of 6</span>
        </div>
        <Button kind="primary" onClick={() => dispatch({ type: 'preset', name: 'check' })}>Resume</Button>
      </div>
      <span className="eyebrow">Or start one of the reference builds</span>
      <div className="starters">
        <button type="button" className="starter" onClick={() => dispatch({ type: 'go', scene: 'plan' })}>
          <span className="glyphs"><PartGlyph kind="led" /></span><b>Light an LED</b><span>A red LED on the 5V rail. No code needed.</span><Tag color="blue">Lab 3</Tag>
        </button>
        <button type="button" className="starter" onClick={() => dispatch({ type: 'go', scene: 'debug' })}>
          <span className="glyphs"><PartGlyph kind="uno" /><PartGlyph kind="led" /><PartGlyph kind="led" /></span><b>Three LEDs</b><span>Drive pins 9, 10 and 11 from one sketch.</span><Tag>Lab 4 · uses code</Tag>
        </button>
        <button type="button" className="starter" disabled>
          <span className="glyphs"><PartGlyph kind="uno" /><PartGlyph kind="led" /></span><b>Blink an LED</b><span>Pin 13 on and off, once a second.</span><Tag color="green" dot>Done</Tag>
        </button>
      </div>
    </div>
  );
}

export function Chat({ state, dispatch }) {
  const [draft, setDraft] = useState('');
  const thread = useRef(null);
  const [label, color] = sessionState(state);
  const title = { home: 'New conversation', setup: 'Setup assistant', plan: 'Planning' }[state.scene] || 'Lab assistant';

  useEffect(() => {
    const el = thread.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length, state.pending]);

  const send = text => {
    if (!text.trim()) return;
    dispatch({ type: 'say', text });
    setDraft('');
  };

  return (
    <main className="chat">
      <div className="chat-head">
        <h1>{title}</h1>
        <span className={`pill pill-${color}`}><i />{label}</span>
      </div>
      <div ref={thread} className="thread scroll" role="log" aria-label="Conversation" aria-live="polite">
        <div className={`thread-inner${state.scene === 'home' ? ' centered' : ''}`}>
          {state.scene === 'home' && <HomeHero dispatch={dispatch} />}
          {state.messages.map(m => <Message key={m.id} message={m} state={state} dispatch={dispatch} />)}
          {state.pending && <Pending label={state.pending.label} />}
        </div>
      </div>
      <form className="composer" onSubmit={e => { e.preventDefault(); send(draft); }}>
        <div className="chips">{chipsFor(state).map(c => (
          <button key={c} type="button" className="chip" disabled={Boolean(state.pending)} onClick={() => send(c)}>{c}</button>
        ))}</div>
        <div className="composer-box">
          <label className="grow"><span className="sr-only">Message the lab assistant</span>
            <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={state.scene === 'home' ? 'Describe a project, or ask about a part…' : 'Tell the assistant what you did…'} />
          </label>
          <IconButton icon="camera" label="Attach a camera snapshot" />
          <button type="submit" className="send" aria-label="Send" disabled={!draft.trim() || Boolean(state.pending)}><Icon name="arrow-up" size={16} color="#fff" stroke={2.2} /></button>
        </div>
      </form>
    </main>
  );
}
