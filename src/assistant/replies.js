// Mock assistant answers for free-text questions. Replace with the real
// LLM/agent call once the backend exists; the return shape is what the chat renders.
//
// A reply is { text, blocks?, tab? }:
//   text   – assistant message (supports **bold**)
//   blocks – extra rich blocks rendered under the text (see components/chat/Blocks.jsx)
//   tab    – optional context-panel tab to switch to

const RULES = [
  {
    test: /band|colou?r|tell (them|it) apart|look the same/,
    reply: scene => ({
      text: 'Hold it so the gold band is on the right, then read left to right. The first two bands are digits; the third says how many zeros to add.',
      blocks: [{ type: 'decoder' }, { type: 'note', text: 'So the third band gives it away: **orange** adds three zeros, **brown** adds one.' }],
      tab: scene === 'build' ? 'map' : undefined,
    }),
  },
  {
    test: /gold/,
    reply: () => ({ text: 'The gold band is the tolerance: the real value is within ±5% of what the other bands say. It also tells you which end to start reading from.' }),
  },
  {
    test: /13\s*ma|current|ohm.?s law|why 220/,
    reply: () => ({ text: 'The LED drops about 2 V, which leaves about 3 V across the resistor. Ohm’s law: 3 V ÷ 220Ω ≈ **13.6 mA** — bright, and safely under the LED’s 20 mA limit.' }),
  },
  {
    test: /1\s*k|1000/,
    reply: () => ({ text: 'With 1kΩ you’d get 3 V ÷ 1000Ω ≈ **3 mA**. The LED would still light, just noticeably dimmer.' }),
  },
  {
    test: /2\s*(v|volt)|forward voltage/,
    reply: () => ({ text: 'A red LED drops about **2 V** when it’s on — its forward voltage. That’s why row 3 should read close to 2.0 V once the circuit works.' }),
  },
  {
    test: /where.*row|which row|find row|row \d/,
    reply: scene => ({
      text: 'Rows are the numbered columns of five connected holes. Row 1 is on your left — the numbers are printed along the top edge. I’ve highlighted them on the board map.',
      tab: scene === 'build' ? 'map' : undefined,
    }),
  },
  {
    test: /direction|polarity|which way|long leg/,
    reply: () => ({ text: 'LEDs only conduct one way. The longer leg is + (anode) and goes toward the 5V side — row 3 in this lab. If the legs were trimmed, the flat edge on the rim marks the − side.' }),
  },
  {
    test: /calibrat/,
    reply: () => ({ text: 'Calibration maps the camera picture onto the board: where each hole is, which way the rows count, and which rail is +. I redo it whenever the camera or the board moves.' }),
  },
  {
    test: /breadboard|how does .*board/,
    reply: () => ({ text: 'Each numbered row is a strip of five holes joined underneath, so anything plugged into the same row is connected. The long rails along the edges carry power: red is +, blue is −.' }),
  },
  {
    test: /what can i build|ideas|kit/,
    reply: () => ({ text: 'With your kit you can light an LED (Lab 3), blink it from code (Lab 1), control it with a button (Lab 2), or drive three LEDs from separate pins (Lab 4).' }),
  },
  {
    test: /missing/,
    reply: () => ({ text: 'Tell me which part. For this build, any resistor from 220Ω to 470Ω works, and any jumper colors are fine.' }),
  },
  {
    test: /loop|error|why didn/,
    reply: () => ({ text: 'Writing to a pin with nothing attached isn’t an error to the Arduino — it just sets pin 12 high and moves on. That’s why the sketch ran fine while the green LED stayed dark.' }),
  },
  {
    test: /what is it checking|what are you checking/,
    reply: () => ({ text: 'I compare three things: what the camera sees, what the sensing board measures in each row, and what the plan says should be there. If two of them disagree, I ask you.' }),
  },
];

export function reply(text, scene) {
  const query = text.toLowerCase();
  const rule = RULES.find(({ test }) => test.test(query));
  if (rule) return rule.reply(scene);
  return { text: 'I can help with this step, the parts or the readings. Try “How do I read bands?” or “Why 13 mA?”.' };
}
