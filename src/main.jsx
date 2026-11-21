import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import './style.css';

const steps = [
  'Get components: 1× red LED, 1× 220Ω, 3 jumpers',
  'Jumper 5V rail → row 1, GND rail → row 8',
  'Place LED across rows 3–4, long leg in row 3',
  'Jumper row 4 → row 8',
  'Connect a 220Ω resistor from row 1 to row 3',
  'Check the LED is lit, row 3 ≈ 2.0 V',
];
const suggestions = [
  'I’m done with step 5',
  'How do I read bands?',
  'Why 13 mA?',
];

function Steps({ checked, onToggle }) {
  const active = checked.indexOf(false);
  return <nav className="steps" aria-label="Lab steps">
    <h2>Lab steps</h2>
    <ol>{steps.map((step, index) => (
      <li key={step} className={index === active ? 'active' : checked[index] ? 'checked' : ''}>
        <label>
          <input type="checkbox" checked={checked[index]} onChange={() => onToggle(index)} />
          <span>{step}{index === 4 && index === active && <small className="error">Resistor needs replacing</small>}</span>
        </label>
      </li>
    ))}</ol>
    {active === -1 && <p role="status">All steps complete.</p>}
  </nav>;
}

function Assistant({ verified, onVerify, onReset }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const end = useRef(null);
  useEffect(() => {
    if (messages.length) end.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  function send(value) {
    const message = value.trim();
    if (!message) return;
    const query = message.toLowerCase();
    let reply = 'Try asking about resistor bands or the expected current. Tell me when you’ve swapped in the 220Ω resistor.';
    if (/band|colou?r/.test(query)) {
      reply = 'A four-band 220Ω resistor is red–red–brown, often followed by gold for tolerance. The 10kΩ resistor is brown–black–orange.';
    } else if (/13\s*ma|current|ohm.s law/.test(query)) {
      reply = 'The LED drops about 2 V, leaving about 3 V across the resistor. By Ohm’s law, 3 V ÷ 220Ω ≈ 13.6 mA.';
    } else if (/done|swapp?ed|replaced|installed|220\s*(ω|ohm)/.test(query)) {
      onVerify();
      reply = 'Demo check passed. The 220Ω resistor is in place and row 3 reads 2.01 V. Check that the LED is lit, then mark the final step complete.';
    }
    setMessages(previous => [...previous, { message, reply }]);
    setDraft('');
  }

  return <main className="assistant">
    <header className="panel-title"><span className="assistant-icon" aria-hidden="true">✦</span><div><h2>Lab assistant</h2><small>Camera & breadboard diagnostics</small></div></header>
    <div className="conversation" role="log" aria-label="Lab assistant conversation">
      <div className="timeline">Step 4 verified · 14:20</div>
      <div className="bubble first">Step 5: connect a 220Ω resistor from row 1 to row 3. Tell me when it’s in.</div>
      <div className="bubble own">done, resistor is in</div>
      <div className="note">Camera and rows 1–8 checked</div>
      <div className="bubble diagnosis">
        <h3>Wrong resistor detected</h3><p>The placement is correct. The board has a 10kΩ resistor (brown–black–orange), so row 1 is drawing 0.30 mA. With 220Ω, expect about 13 mA.</p>
        <div className="samples">
          <div className="sample wrong"><Resistor /><span>On board <strong>10kΩ</strong></span></div>
          <div className="sample"><Resistor correct /><span>On table <strong>220Ω</strong></span></div>
        </div>
        <div className="metrics"><span>Row 1 <b>0.30 mA</b></span><span>Row 3 <b>1.83 V</b></span></div>
        <p>Swap in a 220Ω resistor, then let me know.</p>
      </div>
      {messages.map(({ message, reply }, index) => <React.Fragment key={index}>
        <div className="bubble own">{message}</div><div className="bubble">{reply}</div>
      </React.Fragment>)}
      <div ref={end} />
    </div>
    <div className="composer">
      <div className="suggestions">{suggestions.map((suggestion, index) => (
        <button key={suggestion} type="button" onClick={() => send(suggestion)} disabled={index === 0 && verified}>{suggestion}</button>
      ))}{messages.length > 0 && <button type="button" onClick={onReset}>Reset demo</button>}</div>
      <form onSubmit={event => { event.preventDefault(); send(draft); }}>
        <input aria-label="Message" placeholder="Tell the assistant what you did…" value={draft} onChange={event => setDraft(event.target.value)} />
        <button className="send" type="submit" disabled={!draft.trim()}>Send</button>
      </form>
    </div>
  </main>;
}

function Resistor({ correct = false }) {
  return <span aria-hidden="true" className={correct ? 'component correct' : 'component'}><i /><i /><i /><i /></span>;
}

function Diagnostics({ verified }) {
  const current = verified ? '13.60' : '0.30';
  const rows = {
    1: ['5.02', current, verified ? '68.27' : '1.51', verified ? '✓' : '!'],
    3: [verified ? '2.01' : '1.83', current, verified ? '27.34' : '0.55', verified ? '✓' : '!'],
    4: ['0.00', current, '0.00', '✓'],
    8: ['0.00', current, '0.00', '✓'],
  };
  return <aside className="diagnostics" aria-label="Camera, measurements and parts">
    <section className="camera-panel" aria-labelledby="camera-title">
      <div className="section-title"><h2 id="camera-title">Overhead camera</h2><small>Simulated</small></div>
      <figure className="camera" aria-label="Simulated overhead view showing row and resistor locations">
        <div className="board" aria-hidden="true">
          <span className="region region-led" />
          <span className={verified ? 'region region-resistor verified' : 'region region-resistor'} />
        </div>
      </figure>
    </section>
    <section aria-labelledby="rows-title">
      <div className="section-title"><h2 id="rows-title">Board readings</h2><small>Rows 1–8</small></div>
      <div className="readings-summary">
        <span><strong>5.02</strong> V</span><span><strong>{current}</strong> mA</span><span><strong>{verified ? '68.3' : '1.5'}</strong> mW</span>
      </div>
      <table aria-label="Simulated breadboard readings">
        <thead><tr><th scope="col">Row</th><th scope="col">V</th><th scope="col">mA</th><th scope="col">mW</th><th scope="col"><span className="sr-only">Status</span></th></tr></thead>
        <tbody>{Array.from({ length: 8 }, (_, index) => {
          const row = index + 1;
          const [volts, milliamps, milliwatts, status] = rows[row] ?? ['—', '—', '—', ''];
          return <tr key={row}><th scope="row">{row}</th><td>{volts}</td><td>{milliamps}</td><td>{milliwatts}</td>
            <td className={status === '!' ? 'error' : ''} aria-label={status === '!' ? 'Check reading' : status === '✓' ? 'Verified' : undefined}>{status}</td></tr>;
        })}</tbody>
      </table>
    </section>
    <section className="parts" aria-labelledby="parts-title">
      <div className="section-title"><h2 id="parts-title">Parts</h2><small>12 on table</small></div>
      <small className={verified ? '' : 'error'}>{verified ? 'Resistor verified' : 'Needs attention'}</small>
      <div className="part"><span className="swatch"><Resistor /></span><span>{verified ? '10kΩ — returned to table' : '10kΩ — on board, not needed'}</span><code>0 / 1</code></div>
      <div className="part"><span className="swatch"><Resistor correct /></span><span>{verified ? '220Ω — on board' : '220Ω — needed on board'}</span><code>1 / 2</code></div>
      <small>Available parts · need / have</small>
      <div className="tags"><span><i>LED</i> LED 1/2</span><span><i>W</i> jumper 3/5</span></div>
      <small>Extras</small>
      <div className="tags extra"><span><i>SW</i> button ×1</span><span><i>C</i> cap ×1</span></div>
    </section>
  </aside>;
}

function App() {
  const initialSteps = [true, true, true, true, false, false];
  const [checked, setChecked] = useState(initialSteps);
  const [session, setSession] = useState(0);
  const completed = checked.filter(Boolean).length;
  return <div className="workbench">
    <header className="topbar">
      <h1><span aria-hidden="true" className="brand-mark">⌁</span>AI Workbench</h1>
      <select aria-label="Lab"><option>Lab 3 · LED circuit</option></select>
      <div className="progress"><progress aria-label="Lab progress" max={steps.length} value={completed} /><span>{completed} of {steps.length} steps</span></div>
      <span className="mode" title="Simulated readings and assistant responses"><i /> Demo mode</span>
    </header>
    <div className="layout">
      <Steps checked={checked} onToggle={index => setChecked(previous => previous.map((value, i) => i === index ? !value : value))} />
      <Assistant key={session} verified={checked[4]}
        onVerify={() => setChecked(previous => previous.map((value, i) => i === 4 || value))}
        onReset={() => { setChecked(initialSteps); setSession(previous => previous + 1); }} />
      <Diagnostics verified={checked[4]} />
    </div>
  </div>;
}

const theme = new URLSearchParams(window.location.search).get('theme');
if (theme === 'teal') document.documentElement.dataset.theme = 'teal';

createRoot(document.getElementById('root')).render(<App />);
