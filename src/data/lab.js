// Demo data for the guided labs. Everything here is hardcoded; there is no
// connection to the computer-vision pipeline or the sensing breadboard yet.

const camera = name => `${import.meta.env.BASE_URL}camera/${name}.svg`;

export const IMAGES = {
  emptyBoard: camera('setup-empty-board'),
  partsOnTable: camera('parts-on-table'),
  ledUnsure: camera('build-led-unsure'),
  wrongResistor: camera('build-wrong-resistor'),
  ledLit: camera('build-led-lit'),
  lab4: camera('lab4-three-leds'),
};

// Overlay boxes are percentages of the camera frame (5:3).
export const BOXES = {
  resistor: { left: 43.71, top: 42.38, width: 14.29, height: 8.57 },
  spare220: { left: 2.86, top: 13.33, width: 30, height: 28.1 },
  led: { left: 54.57, top: 46.67, width: 8, height: 10.48 },
  ledLit: { left: 53.5, top: 44, width: 10.2, height: 14 },
  ledLeaning: { left: 55.14, top: 44.5, width: 10, height: 13.2 },
  row1: { left: 43.86, top: 27.14, width: 3.71, height: 39.05 },
  row3: { left: 54.14, top: 26.19, width: 3.71, height: 40.95 },
  row4: { left: 59.29, top: 26.19, width: 3.71, height: 40.95 },
  plusRail: { left: 44, top: 12.2, width: 54.57, height: 7.2 },
  table220: { left: 3.14, top: 9.52, width: 28, height: 21.43 },
  table10k: { left: 7.43, top: 36.67, width: 26, height: 11.43 },
  tableLeds: { left: 3.71, top: 57.14, width: 16.86, height: 20.48 },
  tableJumpers: { left: 1.43, top: 77.14, width: 27.14, height: 20.95 },
  tableButton: { left: 23.14, top: 57.62, width: 8, height: 13.33 },
  tableCap: { left: 30.29, top: 78.81, width: 6.86, height: 11.43 },
  lab4Led1: { left: 48, top: 43.33, width: 6.5, height: 9.17 },
  lab4Led2: { left: 66, top: 43.33, width: 6.5, height: 9.17 },
  lab4Led3: { left: 84, top: 43.33, width: 6.5, height: 9.17 },
};

// Zoomed crops used inside chat cards: image, centre x/y (% of frame), zoom.
export const ZOOMS = {
  wrongResistor: { src: IMAGES.wrongResistor, x: 50.85, y: 46.67, zoom: 3 },
  spare220: { src: IMAGES.wrongResistor, x: 17.86, y: 27.38, zoom: 2.8 },
  goodResistor: { src: IMAGES.ledLit, x: 50.85, y: 46.67, zoom: 3 },
  litLed: { src: IMAGES.ledLit, x: 58.57, y: 51.9, zoom: 3 },
  table220: { src: IMAGES.partsOnTable, x: 17.14, y: 20.24, zoom: 2.4 },
  table10k: { src: IMAGES.partsOnTable, x: 20, y: 42.38, zoom: 2.6 },
  lab4Red: { src: IMAGES.lab4, x: 51.25, y: 46.5, zoom: 3.2, aspect: 3.4 },
  lab4Green: { src: IMAGES.lab4, x: 84.4, y: 46.5, zoom: 3.2, aspect: 3.4 },
};

export const BANDS = {
  '10k': ['brown', 'black', 'orange'],
  '220': ['red', 'red', 'brown'],
};

export const LAB3 = {
  id: 'lab3',
  label: 'Lab 3',
  title: 'LED circuit',
  goal: 'Light a red LED from the 5V rail, with a 220Ω resistor keeping the current at a safe ~13 mA.',
  steps: [
    { text: 'Get components: 1× red LED, 1× 220Ω, 3 jumpers', ask: 'get the parts on the list' },
    { text: 'Jumper 5V rail → row 1, GND rail → row 8', ask: 'jumper the 5V rail to row 1 and the GND rail to row 8' },
    { text: 'Place LED across rows 3–4, long leg in row 3', ask: 'place the LED across rows 3–4, with the long leg in row 3' },
    { text: 'Jumper row 4 → row 8', ask: 'jumper row 4 to row 8' },
    { text: 'Connect a 220Ω resistor from row 1 to row 3', ask: 'connect a 220Ω resistor from row 1 to row 3' },
    { text: 'Check the LED is lit, row 3 ≈ 2.0 V', ask: 'check the LED is lit' },
  ],
  parts: [
    { id: 'led', name: 'Red LED', note: 'long leg is +', need: 1, have: 2 },
    { id: '220', name: '220Ω resistor', note: 'red · red · brown', need: 1, have: 2 },
    { id: 'jumper', name: 'Jumper wires', note: 'any colors', need: 3, have: 5 },
  ],
  extras: [
    { id: '10k', name: '10kΩ resistor', note: 'looks like a 220Ω — set aside' },
    { id: 'button', name: 'Push button', note: 'not needed' },
    { id: 'cap', name: 'Capacitor', note: 'not needed' },
  ],
  tests: [
    { text: 'LED draws current', detail: '13.6 mA · inside 10–20 mA' },
    { text: 'Row 3 ≈ 2.0 V', detail: '2.01 V' },
    { text: 'LED is lit', detail: 'Look at the LED and answer in the chat' },
  ],
};

export const READINGS = {
  wrong: {
    1: ['5.02', '0.30', '1.51', 'bad'],
    3: ['1.83', '0.30', '0.55', 'bad'],
    4: ['0.00', '0.30', '0.00', 'ok'],
    8: ['0.00', '0.30', '0.00', 'ok'],
  },
  fixed: {
    1: ['5.02', '13.60', '68.27', 'ok'],
    3: ['2.01', '13.60', '27.34', 'ok'],
    4: ['0.00', '13.60', '0.00', 'ok'],
    8: ['0.00', '13.60', '0.00', 'ok'],
  },
};

export const LAB4 = {
  id: 'lab4',
  label: 'Lab 4',
  title: 'Three LEDs',
  tests: [
    { text: 'Sketch uploads', detail: 'Arduino Uno' },
    { text: 'Red LED blinks · pin 9' },
    { text: 'Yellow LED blinks · pin 10' },
    { text: 'Green LED blinks · pin 11' },
  ],
};

export const sketch = pin => [
  `const int leds[] = {9, 10, ${pin}};`,
  '',
  'void setup() {',
  '  Serial.begin(9600);',
  '  for (int i = 0; i < 3; i++) {',
  '    pinMode(leds[i], OUTPUT);',
  '  }',
  '}',
  '',
  'void loop() {',
  '  for (int i = 0; i < 3; i++) {',
  '    digitalWrite(leds[i], HIGH);',
  '    Serial.print("LED ");',
  '    Serial.print(i + 1);',
  '    Serial.print(" on (pin ");',
  '    Serial.print(leds[i]);',
  '    Serial.println(")");',
  '    delay(500);',
  '  }',
  '  for (int i = 0; i < 3; i++) {',
  '    digitalWrite(leds[i], LOW);',
  '  }',
  '  Serial.println("all off");',
  '  delay(500);',
  '}',
];

export const serialLog = pin => [
  ['14:32:58.204', 'LED 1 on (pin 9)'],
  ['14:32:58.705', 'LED 2 on (pin 10)'],
  ['14:32:59.206', `LED 3 on (pin ${pin})`],
  ['14:32:59.707', 'all off'],
  ['14:33:00.208', 'LED 1 on (pin 9)'],
  ['14:33:00.709', 'LED 2 on (pin 10)'],
  ['14:33:01.210', `LED 3 on (pin ${pin})`],
];

export const COURSE = [
  { title: 'Lab 1 · Blink', state: 'done', detail: 'All tests passed', meta: 'Nov 18' },
  { title: 'Lab 2 · Button + LED', state: 'done', detail: 'All tests passed', meta: 'Nov 21' },
  { title: 'Lab 3 · LED circuit', state: 'current' },
  { title: 'Lab 4 · Three LEDs', state: 'todo', detail: 'Three LEDs on pins 9, 10, 11' },
];
