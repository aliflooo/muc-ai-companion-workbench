import { useCallback, useEffect, useReducer } from 'react';
import { reducer, initFromPreset } from './state/session.js';
import { clock } from './lib/clock.js';
import { AppBar } from './components/AppBar.jsx';
import { Sidebar } from './components/sidebar/Sidebar.jsx';
import { Chat } from './components/chat/Chat.jsx';
import { ContextPanel } from './components/panel/ContextPanel.jsx';

/** How long a simulated check takes before its result appears. */
const CHECK_DELAY_MS = 1100;

function initialScene() {
  return new URLSearchParams(window.location.search).get('scene') || 'home';
}

/** The last numbered question in the thread that is still waiting for an answer. */
function openOptions(state) {
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const block = state.messages[i].blocks?.find(b => b.type === 'options' && b.answer == null);
    if (block) return block;
  }
  return null;
}

export default function App() {
  const [state, rawDispatch] = useReducer(reducer, null, () => initFromPreset(initialScene(), clock()));
  const dispatch = useCallback(action => rawDispatch({ ...action, time: clock() }), []);

  // Resolve simulated camera / board checks after a short delay.
  useEffect(() => {
    if (!state.pending) return undefined;
    const id = setTimeout(() => dispatch({ type: 'resolve' }), CHECK_DELAY_MS);
    return () => clearTimeout(id);
  }, [state.pending, dispatch]);

  // Number keys answer the open question, as the 1 / 2 / 3 hints promise.
  useEffect(() => {
    const onKey = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = e.target.closest?.('input, textarea, [contenteditable="true"]');
      if (typing && e.target.value) return;
      const block = openOptions(state);
      const option = block?.options[Number(e.key) - 1];
      if (!option || state.pending) return;
      e.preventDefault();
      dispatch({ type: 'answer', key: block.key, value: option.id });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, dispatch]);

  return (
    <div className="app">
      <AppBar state={state} dispatch={dispatch} />
      <div className="cols">
        <Sidebar state={state} dispatch={dispatch} />
        <Chat state={state} dispatch={dispatch} />
        <ContextPanel state={state} dispatch={dispatch} />
      </div>
    </div>
  );
}
