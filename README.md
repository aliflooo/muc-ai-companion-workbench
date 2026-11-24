# AI Workbench — lab assistant

A chat-first lab assistant for beginners building breadboard circuits. It plans the build,
watches the bench through an overhead camera and a sensing breadboard, and checks each step
with the student.

> **Demo data only.** There is no backend yet. Camera frames are SVG stand-ins, board readings
> are fixed numbers, and the assistant's replies are scripted. Everything runs in the browser,
> and nothing leaves it.

## Layout

| Column | What it does |
| --- | --- |
| **Sidebar** (left) | Where you are: course labs, setup checklist, build spec, parts, steps or tests, with a progress bar. |
| **Chat** (centre) | The conversation. Every check posts a collapsible *run log* (camera / board / plan / serial / code) before its verdict. Questions are numbered options (press **1**, **2** or **3**). Suggested replies sit above the composer. |
| **Context panel** (right) | Evidence for the current step: camera with detections, the row-by-row readings, a board map of plan vs. reality, the plan, code and serial, and a session timeline. |

The app bar shows the project switcher, the phases (Plan · Parts · Build · Test), bench status
(click it to open bench setup) and **Reset demo**.

## Getting started

### Option 1 — Dev container (recommended)

1. Install Docker plus VS Code with the *Dev Containers* extension (or use GitHub Codespaces).
2. Open the folder and choose **Reopen in Container**.
3. Dependencies are installed automatically (`npm ci`). Then run:

   ```sh
   npm run dev
   ```

   Port 5173 is forwarded and opens in your browser.

### Option 2 — Local Node

Requires Node 20.19+ (Node 22 recommended; see `.nvmrc`).

```sh
npm ci
npm run dev        # http://localhost:5173
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload (port 5173). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build (port 4173). |
| `npm run lint` | ESLint (flat config). |
| `npm run check` | Lint + build. Run this before committing. |

## Walking through the demo

Start on **Home** and click **Light an LED**, or open any scene directly with `?scene=`:

| URL | Scene |
| --- | --- |
| `/?scene=home` | Home: resume card, reference builds, bench check |
| `/?scene=setup` | Bench setup: calibration from one frame; asks you to confirm the + rail |
| `/?scene=plan` | Planning: the assistant drafts and validates a build spec |
| `/?scene=parts` | Parts check: matches the table against the plan and flags the look-alike 10kΩ |
| `/?scene=unsure` | Build step 3: the camera can't see the LED legs, so it asks you |
| `/?scene=check` | Build step 5: wrong resistor caught by camera + current reading |
| `/?scene=map` | Same failure, explained with a band decoder and the board map |
| `/?scene=test` | Power on: live current chart, last check is yours |
| `/?scene=done` | Session summary, what you practised, difficulty rating |
| `/?scene=debug` | Lab 4: debugging a sketch that drives the wrong pin |

Things to try during a build: type *done* (or click the suggested reply), answer with the
number keys, ask *"how do I read bands?"* or *"why 13 mA?"*, click **Show me on camera**,
or mark a check as **Wrong call**.

## Project structure

```
.devcontainer/          Dev container (Node 22, npm ci, ports 5173/4173)
public/camera/          Stand-in overhead camera frames (SVG)
src/
  main.jsx              Entry: fonts, styles, <App />
  App.jsx               Shell: reducer, simulated check timer, number-key shortcuts
  state/session.js      The whole demo flow as a reducer (scenes, handlers, ?scene= presets)
  assistant/replies.js  Scripted answers to free-text questions
  data/lab.js           Lab content, camera boxes and crops, readings, sketch
  components/
    AppBar.jsx          Project switcher, phases, bench status, reset
    sidebar/            Per-scene sidebars (timeline, progress, tips)
    chat/               Thread, message kinds, rich blocks (cards, options, chart, diff…)
    panel/              Context panel tabs, camera view, board map
    ui/                 Icons and primitives (tags, buttons, status, resistor…)
  styles/
    tokens.css          Colours, type, sizes
    app.css             Component styles and responsive rules (stacks below 1000px)
```

### How the flow works

Every user action is dispatched to `reducer` in `src/state/session.js`, which appends chat
messages. Messages are `assistant`, `you`, `activity`, `divider` or `runlog`, and assistant
messages carry typed `blocks`. A long-running check sets `state.pending`, and `App` resolves it
after ~1 s so the UI can show *Checking…*. Because the session is a pure reducer, each
`?scene=` preset is just a list of actions replayed from the start.

To connect real hardware later, replace the `RESOLVERS` in `session.js` with calls to the
camera and board services. The message and block shapes can stay the same.
