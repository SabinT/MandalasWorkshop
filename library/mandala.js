// ============================================================
// mandala.js — Ring / polar mapping logic
// ============================================================
//
// Coordinate convention for motif ("easy space"):
//   x ∈ [-1, 1]  →  angular position within one ring segment
//   y ∈ [-1, 1]  →  radial position: -1 = inner radius, +1 = outer radius
//
// All mXxx() drawing functions record commands that are later
// replayed by ring() into polar space.
// ============================================================

/** @type {Array<object>} Captured drawing commands for the current motif. */
let _commands = [];

// ------------------------------------------------------------
// Motif capture helpers — call these inside your motif function
// ------------------------------------------------------------

/**
 * Draw a line in motif ("easy") space.
 * x ∈ [-1,1], y ∈ [-1,1]
 */
function mLine(x1, y1, x2, y2) {
    _commands.push({ type: "line", x1, y1, x2, y2 });
}

/**
 * Draw a circle in motif space.
 * The circle is approximated with vertices so it deforms correctly in polar space.
 */
function mCircle(x, y, r) {
    _commands.push({ type: "circle", x, y, r });
}

/**
 * Draw a cubic Bézier curve in motif space.
 * Arguments match p5.js bezier(): anchor1, control1, control2, anchor2
 */
function mBezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
    _commands.push({ type: "bezier", x1, y1, cx1, cy1, cx2, cy2, x2, y2 });
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
 * Replay all captured commands into a single ring segment.
 */
function drawCommandsInRing(commands, aCenter, aStep, r1, r2) {
    for (const cmd of commands) {
        if (cmd.type === "line") {
            const p1 = mapToRing(cmd.x1, cmd.y1, aCenter, aStep, r1, r2);
            const p2 = mapToRing(cmd.x2, cmd.y2, aCenter, aStep, r1, r2);
            line(p1.x, p1.y, p2.x, p2.y);
        } else if (cmd.type === "circle") {
            drawMappedCircle(cmd.x, cmd.y, cmd.r, aCenter, aStep, r1, r2);
        } else if (cmd.type === "bezier") {
            const p1 = mapToRing(cmd.x1, cmd.y1, aCenter, aStep, r1, r2);
            const c1 = mapToRing(cmd.cx1, cmd.cy1, aCenter, aStep, r1, r2);
            const c2 = mapToRing(cmd.cx2, cmd.cy2, aCenter, aStep, r1, r2);
            const p2 = mapToRing(cmd.x2, cmd.y2, aCenter, aStep, r1, r2);
            bezier(p1.x, p1.y, c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
        }
    }
}

/**
 * Approximate a circle defined in motif space as a polygon so it bends
 * correctly into polar space.
 */
function drawMappedCircle(x, y, r, aCenter, aStep, r1, r2) {
    beginShape();
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
        const a = map(i, 0, steps, 0, TWO_PI);
        const px = x + cos(a) * r;
        const py = y + sin(a) * r;
        const p = mapToRing(px, py, aCenter, aStep, r1, r2);
        vertex(p.x, p.y);
    }
    endShape();
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
