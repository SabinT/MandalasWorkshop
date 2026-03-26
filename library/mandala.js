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

/** @type {Array<LineCurve|BezierCurve|CircleCurve|PolyCurve|ArcCurve|EllipseCurve|CatmullRomCurve>} Captured curves for the current motif. */
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

/**
 * Draw a closed triangle in motif space.
 * Fill is respected because the shape is closed.
 *
 * @param {number} x1  Vertex 1 x
 * @param {number} y1  Vertex 1 y
 * @param {number} x2  Vertex 2 x
 * @param {number} y2  Vertex 2 y
 * @param {number} x3  Vertex 3 x
 * @param {number} y3  Vertex 3 y
 */
function mTriangle(x1, y1, x2, y2, x3, y3) {
    _commands.push(new PolyCurve([vec2(x1, y1), vec2(x2, y2), vec2(x3, y3)], true));
}

/**
 * Draw a closed quadrilateral in motif space.
 * Vertices should be specified in order (e.g. clockwise or counter-clockwise).
 * Fill is respected because the shape is closed.
 *
 * @param {number} x1  Vertex 1 x
 * @param {number} y1  Vertex 1 y
 * @param {number} x2  Vertex 2 x
 * @param {number} y2  Vertex 2 y
 * @param {number} x3  Vertex 3 x
 * @param {number} y3  Vertex 3 y
 * @param {number} x4  Vertex 4 x
 * @param {number} y4  Vertex 4 y
 */
function mQuad(x1, y1, x2, y2, x3, y3, x4, y4) {
    _commands.push(new PolyCurve([vec2(x1, y1), vec2(x2, y2), vec2(x3, y3), vec2(x4, y4)], true));
}

/**
 * Draw a closed polygon in motif space from an array of vec2 points.
 * Fill is respected because the shape is closed.
 *
 * @param {Array<{x:number,y:number}>} points  Vertices in motif space.
 */
function mShape(points) {
    _commands.push(new PolyCurve(points, true));
}

/**
 * Draw an open polyline in motif space from an array of vec2 points (stroke only).
 *
 * @param {Array<{x:number,y:number}>} points  Vertices in motif space.
 */
function mPath(points) {
    _commands.push(new PolyCurve(points, false));
}

/**
 * Draw a circular arc in motif space (stroke only).
 *
 * @param {number} cx          Centre x in motif space.
 * @param {number} cy          Centre y in motif space.
 * @param {number} r           Radius in motif space.
 * @param {number} startAngle  Start angle in the sketch's current angleMode.
 * @param {number} endAngle    End angle in the sketch's current angleMode.
 */
function mArc(cx, cy, r, startAngle, endAngle) {
    _commands.push(new ArcCurve(cx, cy, r, _toRadians(startAngle), _toRadians(endAngle)));
}

/** Convert an angle from the sketch's current angleMode to radians. */
function _toRadians(a) {
    return (angleMode() === DEGREES) ? a * (Math.PI / 180) : a;
}

/**
 * Draw a closed ellipse in motif space.
 * Fill is respected because the shape is closed.
 *
 * @param {number} cx  Centre x in motif space.
 * @param {number} cy  Centre y in motif space.
 * @param {number} rx  Horizontal radius.
 * @param {number} ry  Vertical radius.
 */
function mEllipse(cx, cy, rx, ry) {
    _commands.push(new EllipseCurve(cx, cy, rx, ry));
}

/**
 * Draw a smooth Catmull-Rom spline through a list of vec2 points (stroke only).
 *
 * @param {Array<{x:number,y:number}>} points  Control points in motif space.
 */
function mCurve(points) {
    _commands.push(new CatmullRomCurve(points));
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
    const angleStep = (Math.PI * 2) / n;

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
    return vec2(radius * Math.cos(angle), radius * Math.sin(angle));
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
    stroke(_smGetContrastBrightness(), 60);
    noFill();

    circle(0, 0, r1 * 2);
    circle(0, 0, r2 * 2);

    const angleStep = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
        const a = i * angleStep;
        line(r1 * Math.cos(a), r1 * Math.sin(a), r2 * Math.cos(a), r2 * Math.sin(a));
    }
}

// ============================================================
// showMotif — Interactive motif debugger / preview
// ============================================================

let _smZoom        = 1;       // current zoom level  (1 = default fit)
let _smPanX        = 0;       // pan offset X in screen pixels
let _smPanY        = 0;       // pan offset Y in screen pixels
let _smDragging    = false;   // left-drag in progress?
let _smDragAnchorX = 0;
let _smDragAnchorY = 0;
let _smDragPanX0   = 0;
let _smDragPanY0   = 0;
let _smLastFrame   = -1;      // frameCount when background was last cleared
let _smActive      = false;   // true once showMotif() has been called

/**
 * Preview / debug a motif function on the current canvas.
 *
 * - Shared sketch background color with a faint coordinate grid (4 major / 8 minor divisions).
 * - Faint border outlining the [-1, 1] × [-1, 1] drawing space.
 * - Grid lines outside the drawing space are dimmer than those inside.
 * - Displays 1.25× the drawing space extents by default.
 * - Mouse wheel: zoom toward cursor.  Left-drag: pan.
 * - Crosshair lines and motif-space (x, y) shown at the cursor.
 * - Multiple calls in the same frame layer over each other (no background clear).
 *
 * @param {function} motifFn  A motif function (uses mLine / mBezier / mCircle / …).
 */
function showMotif(motifFn) {
    _smActive = true;

    // First call this frame → shared background + coordinate grid
    if (frameCount !== _smLastFrame) {
        _smLastFrame = frameCount;
        push();
        resetMatrix();
        _smApplyStoredBackground();
        _smDrawGrid();
        pop();
    }

    // Draw the motif using the caller's current stroke / fill settings
    const commands = captureMotif(motifFn);
    push();
    resetMatrix();
    _smDrawCommands(commands, _smScale(),
                    width / 2 + _smPanX, height / 2 + _smPanY);
    pop();

    // Overlay: crosshair lines + coordinate label at the cursor
    push();
    resetMatrix();
    _smDrawOverlay();
    pop();
}

// ---- showMotif internal helpers ----------------------------------------

/** The most recent background() arguments, captured by the workshop shim. */
function _smGetBackgroundArgs() {
    if (Array.isArray(globalThis.__mandalaLastBackgroundArgs) && globalThis.__mandalaLastBackgroundArgs.length > 0) {
        return globalThis.__mandalaLastBackgroundArgs;
    }
    return [0];
}

/** Re-apply the sketch's last background() call. */
function _smApplyStoredBackground() {
    background(..._smGetBackgroundArgs());
}

/** Approximate perceived brightness (0..255) of the configured background color. */
function _smGetBackgroundBrightness() {
    const bgArgs = _smGetBackgroundArgs();

    if (bgArgs.length === 1 && typeof bgArgs[0] === 'number') {
        return constrain(bgArgs[0], 0, 255);
    }

    try {
        const c = color(...bgArgs);
        return 0.2126 * red(c) + 0.7152 * green(c) + 0.0722 * blue(c);
    } catch (_err) {
        return 0;
    }
}

/**
 * Grid/overlay target brightness with configurable contrast from background.
 * Dark backgrounds get lighter overlays; light backgrounds get darker overlays.
 */
function _smGetContrastBrightness(multiplier = 1) {
    const bg = _smGetBackgroundBrightness();
    const delta = 255 * 0.30 * multiplier;
    const sign = bg <= (255 * 0.5) ? 1 : -1;
    return constrain(bg + sign * delta, 0, 255);
}

/** Pixel scale: maps 1 motif unit to this many pixels at the current zoom. */
function _smScale() {
    return (Math.min(width, height) / (2 * 1.25)) * _smZoom;
}

/** Draw the background grid and the motif-space boundary box. */
function _smDrawGrid() {
    const sc = _smScale();
    const ox = width  / 2 + _smPanX;
    const oy = height / 2 + _smPanY;
    const bg = _smGetBackgroundBrightness();
    const majorTone = _smGetContrastBrightness();
    const minorTone = lerp(bg, majorTone, 0.65);
    const outsideTone = lerp(bg, majorTone, 0.35);
    const boxTone = lerp(bg, majorTone, 0.85);
    const xLeft = -1 * sc + ox;
    const xRight = 1 * sc + ox;
    const yTop = -1 * sc + oy;
    const yBottom = 1 * sc + oy;

    // Visible motif-space range
    const mxMin = (0      - ox) / sc;
    const mxMax = (width  - ox) / sc;
    const myMin = (0      - oy) / sc;
    const myMax = (height - oy) / sc;

    // Grid: minor step 0.25 (8 divisions in [-1,1]),
    //       major step 0.50 (4 divisions in [-1,1], every 2 minor steps)
    const minorStep = 0.25;
    const majorPer  = 2;     // major line every majorPer minor steps

    noFill();
    strokeWeight(1);

    const ixMin = Math.floor(mxMin / minorStep);
    const ixMax = Math.ceil(mxMax  / minorStep);
    const iyMin = Math.floor(myMin / minorStep);
    const iyMax = Math.ceil(myMax  / minorStep);

    // Vertical grid lines
    for (let i = ixMin; i <= ixMax; i++) {
        const mx     = i * minorStep;
        const inside = mx >= -1 && mx <= 1;
        const major  = (i % majorPer === 0);
        const sx = mx * sc + ox;

        if (inside) {
            stroke(outsideTone);
            line(sx, 0, sx, yTop);
            line(sx, yBottom, sx, height);

            stroke(major ? majorTone : minorTone);
            line(sx, yTop, sx, yBottom);
        } else {
            stroke(outsideTone);
            line(sx, 0, sx, height);
        }
    }

    // Horizontal grid lines
    for (let j = iyMin; j <= iyMax; j++) {
        const my     = j * minorStep;
        const inside = my >= -1 && my <= 1;
        const major  = (j % majorPer === 0);
        const sy = my * sc + oy;

        if (inside) {
            stroke(outsideTone);
            line(0, sy, xLeft, sy);
            line(xRight, sy, width, sy);

            stroke(major ? majorTone : minorTone);
            line(xLeft, sy, xRight, sy);
        } else {
            stroke(outsideTone);
            line(0, sy, width, sy);
        }
    }

    // Faint box outlining the [-1, 1] × [-1, 1] drawing space
    stroke(boxTone);
    strokeWeight(1);
    rect(-1 * sc + ox, -1 * sc + oy, 2 * sc, 2 * sc);

    _smDrawReferenceLabels(xLeft, xRight, yTop, yBottom);
}

/** Draw fixed coordinate labels for corners and side midpoints outside the motif box. */
function _smDrawReferenceLabels(xLeft, xRight, yTop, yBottom) {
    const tone = _smGetContrastBrightness(2);
    const pad = 10;

    noStroke();
    fill(tone);
    textSize(12);
    textFont('monospace');

    textAlign(RIGHT, BOTTOM);
    text('(-1, -1)', xLeft - pad, yTop - pad);

    textAlign(CENTER, BOTTOM);
    text('(0, -1)', (xLeft + xRight) / 2, yTop - pad);

    textAlign(LEFT, BOTTOM);
    text('(1, -1)', xRight + pad, yTop - pad);

    textAlign(RIGHT, CENTER);
    text('(-1, 0)', xLeft - pad, (yTop + yBottom) / 2);

    textAlign(LEFT, CENTER);
    text('(1, 0)', xRight + pad, (yTop + yBottom) / 2);

    textAlign(RIGHT, TOP);
    text('(-1, 1)', xLeft - pad, yBottom + pad);

    textAlign(CENTER, TOP);
    text('(0, 1)', (xLeft + xRight) / 2, yBottom + pad);

    textAlign(LEFT, TOP);
    text('(1, 1)', xRight + pad, yBottom + pad);
}

/** Replay captured motif commands in screen space. */
function _smDrawCommands(commands, sc, ox, oy) {
    for (const cmd of commands) {
        if (cmd.closed) {
            beginShape();
            for (let i = 0; i <= cmd.divisions; i++) {
                const p = cmd.evaluate(i / cmd.divisions);
                vertex(p.x * sc + ox, p.y * sc + oy);
            }
            endShape(CLOSE);
        } else {
            let prev = null;
            for (let i = 0; i <= cmd.divisions; i++) {
                const p  = cmd.evaluate(i / cmd.divisions);
                const sx = p.x * sc + ox;
                const sy = p.y * sc + oy;
                if (prev !== null) line(prev.x, prev.y, sx, sy);
                prev = vec2(sx, sy);
            }
        }
    }
}

/** Draw the crosshair lines and coordinate label at the current cursor position. */
function _smDrawOverlay() {
    const sc  = _smScale();
    const ox  = width  / 2 + _smPanX;
    const oy  = height / 2 + _smPanY;
    const mxM = (mouseX - ox) / sc;
    const myM = (mouseY - oy) / sc;
    const overlayTone = _smGetContrastBrightness();
    const labelTone = _smGetContrastBrightness(2);

    // Crosshair lines
    stroke(overlayTone);
    strokeWeight(1);
    noFill();
    line(mouseX, 0, mouseX, height);
    line(0, mouseY, width, mouseY);

    // Coordinate label
    const label = '(' + mxM.toFixed(2) + ', ' + myM.toFixed(2) + ')';
    noStroke();
    fill(labelTone);
    textSize(13);
    textFont('monospace');
    textAlign(LEFT, TOP);
    let tx = mouseX + 10;
    let ty = mouseY + 10;
    if (tx + 120 > width)  tx = mouseX - 130;
    if (ty + 22  > height) ty = mouseY - 32;
    text(label, tx, ty);
}

// ---- Mouse / window event handlers for showMotif -----------------------
// These handlers are defined here so showMotif works out of the box.
// If sketch.js defines its own mouseWheel / mousePressed / mouseReleased /
// mouseDragged / windowResized, those definitions will take precedence
// (script tags are executed in order, so sketch.js loads after mandala.js).

function mouseWheel(event) {
    if (!_smActive) return;
    const factor = event.delta > 0 ? 0.9 : 1.1;
    const oldSc  = _smScale();
    _smZoom      = Math.max(0.05, Math.min(50, _smZoom * factor));
    const ratio  = _smScale() / oldSc;
    _smPanX = mouseX - width  / 2 - ratio * (mouseX - width  / 2 - _smPanX);
    _smPanY = mouseY - height / 2 - ratio * (mouseY - height / 2 - _smPanY);
    return false;
}

function mousePressed() {
    if (!_smActive) return;
    if (mouseButton === LEFT) {
        _smDragging    = true;
        _smDragAnchorX = mouseX;
        _smDragAnchorY = mouseY;
        _smDragPanX0   = _smPanX;
        _smDragPanY0   = _smPanY;
    }
}

function mouseReleased() {
    if (!_smActive) return;
    _smDragging = false;
}

function mouseDragged() {
    if (_smDragging) {
        _smPanX = _smDragPanX0 + (mouseX - _smDragAnchorX);
        _smPanY = _smDragPanY0 + (mouseY - _smDragAnchorY);
    }
}

function windowResized() {}
