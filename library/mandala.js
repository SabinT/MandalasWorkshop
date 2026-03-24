// ============================================================
// mandala.js — Ring / polar mapping logic
// ============================================================
//
// Coordinate convention for motif ("easy space"):
//   x ∈ [-1, 1]  →  angular position within one ring segment
//   y ∈ [-1, 1]  →  radial position: -1 = inner radius, +1 = outer radius
//
// All mXxx() drawing functions record parametric curve objects
// (LineCurve, BezierCurve, CircleCurve from curves.js) that are
// later replayed by ring() into polar space.
// ============================================================

/** @type {Array<LineCurve|BezierCurve|CircleCurve>} Captured curves for the current motif. */
let _commands = [];

// ------------------------------------------------------------
// Motif capture helpers — call these inside your motif function
// ------------------------------------------------------------

/**
 * Draw a line in motif ("easy") space.
 * x ∈ [-1,1], y ∈ [-1,1]
 */
function mLine(x1, y1, x2, y2) {
    _commands.push(new LineCurve(x1, y1, x2, y2));
}

/**
 * Draw a circle in motif space.
 * The circle is approximated with vertices so it deforms correctly in polar space.
 */
function mCircle(x, y, r) {
    _commands.push(new CircleCurve(x, y, r));
}

/**
 * Draw a cubic Bézier curve in motif space.
 * Arguments match p5.js bezier(): anchor1, control1, control2, anchor2
 */
function mBezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
    _commands.push(new BezierCurve(x1, y1, cx1, cy1, cx2, cy2, x2, y2));
}

// ------------------------------------------------------------
// Core ring API
// ------------------------------------------------------------

/**
 * Draw a motif function n times, evenly distributed around a ring.
 *
 * @param {object} opts
 * @param {function} opts.shape  Motif function (calls mLine / mBezier / mCircle).
 * @param {number}   opts.n      Number of repetitions.
 * @param {number}   opts.r1     Inner radius in pixels.
 * @param {number}   opts.r2     Outer radius in pixels.
 */
function ring({ shape, n, r1, r2 }) {
    const commands = captureMotif(shape);
    const angleStep = TWO_PI / n;

    for (let i = 0; i < n; i++) {
        const aCenter = i * angleStep;
        drawCommandsInRing(commands, aCenter, angleStep, r1, r2);
    }
}

// ------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------

/**
 * Execute shapeFn() while capturing its drawing commands.
 * @param {function} shapeFn
 * @returns {Array<object>} List of recorded commands.
 */
function captureMotif(shapeFn) {
    _commands = [];
    shapeFn();
    return _commands;
}

/**
 * Map a motif-space point (x,y) into canvas coordinates inside one ring segment.
 *
 * @param {number} x        Motif-space x ∈ [-1, 1].
 * @param {number} y        Motif-space y ∈ [-1, 1].
 * @param {number} aCenter  Center angle of this segment (radians).
 * @param {number} aStep    Angular width of one segment (radians).
 * @param {number} r1       Inner radius.
 * @param {number} r2       Outer radius.
 * @returns {{ x: number, y: number }} Canvas-space point.
 */
function mapToRing(x, y, aCenter, aStep, r1, r2) {
    const angle = aCenter + map(x, -1, 1, -0.5 * aStep, 0.5 * aStep);
    const radius = map(y, -1, 1, r1, r2);
    return vec2(radius * cos(angle), radius * sin(angle));
}

/**
 * Replay all captured curves into a single ring segment.
 * Each curve is sampled at cmd.divisions steps via cmd.evaluate(t).
 * Closed curves (circles) are drawn with beginShape/endShape so they
 * correctly respect the active fill.  Open curves (lines, beziers) are
 * drawn as connected line() segments so they behave like stroke-only paths.
 */
function drawCommandsInRing(commands, aCenter, aStep, r1, r2) {
    for (const cmd of commands) {
        if (cmd.closed) {
            beginShape();
            for (let i = 0; i <= cmd.divisions; i++) {
                const p      = cmd.evaluate(i / cmd.divisions);
                const mapped = mapToRing(p.x, p.y, aCenter, aStep, r1, r2);
                vertex(mapped.x, mapped.y);
            }
            endShape(CLOSE);
        } else {
            let prev = null;
            for (let i = 0; i <= cmd.divisions; i++) {
                const p      = cmd.evaluate(i / cmd.divisions);
                const mapped = mapToRing(p.x, p.y, aCenter, aStep, r1, r2);
                if (prev !== null) {
                    line(prev.x, prev.y, mapped.x, mapped.y);
                }
                prev = mapped;
            }
        }
    }
}

// ------------------------------------------------------------
// Debug / visual helpers
// ------------------------------------------------------------

/**
 * Draw a faint polar grid to help design motifs.
 *
 * @param {number} n   Number of segments (should match ring n).
 * @param {number} r1  Inner radius.
 * @param {number} r2  Outer radius.
 */
function drawPolarGrid(n, r1, r2) {
    stroke(0, 25);
    noFill();

    circle(0, 0, r1 * 2);
    circle(0, 0, r2 * 2);

    const angleStep = TWO_PI / n;
    for (let i = 0; i < n; i++) {
        const a = i * angleStep;
        line(r1 * cos(a), r1 * sin(a), r2 * cos(a), r2 * sin(a));
    }
}
