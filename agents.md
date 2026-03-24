# MandalasWorkshop — Agent Context

> This file exists so a future AI agent (or human) can quickly understand
> the project and continue working without re-discovering the structure.

---

## Project Purpose

A p5.js starter project for a creative-coding workshop. Students radially
repeat decorative motifs (shapes) in polar space while designing them in a
simple normalized "easy space" coordinate system (−1 to 1).

---

## File Structure

```
MandalasWorkshop/
├── index.html           Main entry point. Loads p5.js (CDN), utility libs,
│                        and sketch.js. Centers the canvas with Flexbox.
├── sketch.js            Student's working file. Contains setup(), draw(),
│                        an example motif (motifLeaf), and a TODO motif
│                        (motifCustom) with /** change this code **/ markers.
├── utils/
│   ├── math.js          Pure JS math helpers (no p5 dependency):
│   │                      vec2(x,y), v2Add, v2Sub, v2Scale, v2Dot,
│   │                      v2Length, v2Normalize, v2Lerp,
│   │                      polarToCartesian, cartesianToPolar, remap
│   └── mandala.js       Ring / polar-mapping logic (requires p5.js globals):
│                          ring({ shape, n, r1, r2 })
│                          mLine, mBezier, mCircle  — motif drawing commands
│                          drawPolarGrid(n, r1, r2) — debug grid
│                          mapToRing, drawCommandsInRing,
│                          captureMotif, drawMappedCircle (internals)
├── .vscode/
│   └── extensions.json  Recommends the "Live Server" extension (ritwickdey).
├── agents.md            This file.
└── README.md            Brief project description.
```

---

## Key Concepts

### Easy Space
Motifs are designed in a normalized square: **x ∈ [−1, 1], y ∈ [−1, 1]**.
- **x** maps to *angular* position within one ring segment.
- **y** maps to *radial* position: −1 = inner radius, +1 = outer radius.

### Motif Functions
A motif is a plain JS function that calls the `m`-prefixed drawing commands:
- `mLine(x1,y1, x2,y2)` — straight line
- `mBezier(x1,y1, cx1,cy1, cx2,cy2, x2,y2)` — cubic Bézier
- `mCircle(x,y, r)` — circle (approximated as polygon for correct distortion)

These commands are **captured** (not drawn immediately) and replayed once per
ring segment with the `mapToRing` coordinate transformation.

### ring()
```js
ring({ shape: myMotifFn, n: 12, r1: 80, r2: 160 });
```
- `shape` — motif function reference
- `n`     — number of radial repetitions
- `r1`    — inner radius (pixels, from canvas centre)
- `r2`    — outer radius (pixels, from canvas centre)

### vec2
`vec2(x, y)` returns a plain `{ x, y }` object. It is interoperable with
p5.js vectors via `.x` / `.y` property access.

---

## How to Run

1. Open the project folder in VS Code.
2. Install the **Live Server** extension (recommended in `.vscode/extensions.json`).
3. Right-click `index.html` → **Open with Live Server**.
4. Edit `sketch.js` (specifically `motifCustom`) and save — the browser
   refreshes automatically.

---

## Extending the Project

- Add more motif functions in `sketch.js` and call `ring()` with different
  `n`, `r1`, `r2` values to build up concentric rings.
- Add new drawing primitives to `utils/mandala.js` (e.g., `mArc`, `mRect`)
  following the `_commands.push(...)` pattern.
- Add more math utilities to `utils/math.js` — it has no p5 dependency so
  it can be unit-tested independently.

---

## Dependencies

| Library | Version | How loaded |
|---------|---------|------------|
| p5.js   | 1.9.4   | CDN `<script>` in `index.html` |

No build step, no npm, no bundler — plain JS files loaded in order by the
browser.
