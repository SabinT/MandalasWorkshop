// ============================================================
// mandala.js — Ring / polar mapping logic
// ============================================================
//
// Coordinate convention for motif ("easy space"):
//   x ∈ [-s, s]  →  angular position within one ring segment
//   y ∈ [-s, s]  →  radial position: -s = outer radius, +s = inner radius
//   s defaults to 1. Call setMotifSize(s) to change it.
//
// All mXxx() drawing functions record parametric curve objects
// (LineCurve, BezierCurve, CircleCurve from curves.js) that are
// later replayed by ring() into polar space.
// ============================================================

/** @type {Array<LineCurve|BezierCurve|CircleCurve|PolyCurve|ArcCurve|EllipseCurve|CatmullRomCurve|DotCommand>} Captured curves/commands for the current motif. */
let _commands = [];

/** Capture-time motif transform state (translate/rotate/scale within motif functions). */
let _isCapturingMotif = false;
let _motifMatrix = _mfIdentity();
let _motifStack = [];

/** Half-extent of the design (motif) space. Default 1 → [-1, 1] × [-1, 1]. */
let _designSpaceSize = 1;

/**
 * Set the design-space half-extent.
 * setMotifSize(100) means motif coordinates run from -100 to 100 on both axes.
 * The showMotif() grid labels and all ring mappings update automatically.
 * @param {number} size  Half-extent (default 1).
 */
function setMotifSize(size) {
    _designSpaceSize = size;
}

// ------------------------------------------------------------
// Motif capture helpers — call these inside your motif function
// ------------------------------------------------------------

/**
 * Draw a line in motif ("easy") space.
 * Coordinates are in [-s, s] where s is set by setMotifSize() (default 1).
 */
function mLine(x1, y1, x2, y2, divisions) {
    _pushCommand(new LineCurve(x1, y1, x2, y2, divisions));
}

/**
 * Draw a circle in motif space.
 * The circle is approximated with vertices so it deforms correctly in polar space.
 */
function mCircle(x, y, r, divisions) {
    _pushCommand(new CircleCurve(x, y, r, divisions));
}

/**
 * Draw an undistorted dot in motif space.
 *
 * Unlike mCircle(), this remains a true screen-space circle inside ring() output.
 * The center is mapped through mapToRing(), and radius is mapped against ring
 * thickness so motif radius ds maps to half the radial thickness.
 *
 * @param {number} x  Centre x in motif space.
 * @param {number} y  Centre y in motif space.
 * @param {number} r  Radius in motif-space units.
 */
function mDot(x, y, r) {
    _pushCommand(new DotCommand(x, y, r));
}

/**
 * Draw a cubic Bézier curve in motif space.
 * Arguments match p5.js bezier(): anchor1, control1, control2, anchor2
 */
function mBezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2, divisions) {
    _pushCommand(new BezierCurve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, divisions));
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
function mTriangle(x1, y1, x2, y2, x3, y3, divisions) {
    _pushCommand(new PolyCurve([vec2(x1, y1), vec2(x2, y2), vec2(x3, y3)], true, divisions));
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
function mQuad(x1, y1, x2, y2, x3, y3, x4, y4, divisions) {
    _pushCommand(new PolyCurve([vec2(x1, y1), vec2(x2, y2), vec2(x3, y3), vec2(x4, y4)], true, divisions));
}

/**
 * Draw a closed polygon in motif space from an array of vec2 points.
 * Fill is respected because the shape is closed.
 *
 * @param {Array<{x:number,y:number}>} points  Vertices in motif space.
 */
function mShape(points, divisions) {
    _pushCommand(new PolyCurve(points, true, divisions));
}

/**
 * Draw an open polyline in motif space from an array of vec2 points (stroke only).
 *
 * @param {Array<{x:number,y:number}>} points  Vertices in motif space.
 */
function mPath(points, divisions) {
    _pushCommand(new PolyCurve(points, false, divisions));
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
function mArc(cx, cy, r, startAngle, endAngle, divisions) {
    _pushCommand(new ArcCurve(cx, cy, r, _toRadians(startAngle), _toRadians(endAngle), divisions));
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
function mEllipse(cx, cy, rx, ry, divisions) {
    _pushCommand(new EllipseCurve(cx, cy, rx, ry, divisions));
}

/**
 * Draw a smooth Catmull-Rom spline through a list of vec2 points (stroke only).
 *
 * @param {Array<{x:number,y:number}>} points  Control points in motif space.
 */
function mCurve(points, divisions) {
    _pushCommand(new CatmullRomCurve(points, divisions));
}


/**
 * Draw an axis-aligned rectangle (box) in motif space.
 * Fill is respected because the shape is closed.
 *
 * @param {number} x  Left edge x.
 * @param {number} y  Top edge y.
 * @param {number} w  Width.
 * @param {number} h  Height.
 */
function mBox(x, y, w, h, divisions) {
    const x2 = x + w;
    const y2 = y + h;
    _pushCommand(new PolyCurve([vec2(x, y), vec2(x2, y), vec2(x2, y2), vec2(x, y2)], true, divisions));
}

// ------------------------------------------------------------
// Core ring API
// ------------------------------------------------------------

/**
 * Draw a motif function n times, evenly distributed around a ring.
 *
 * @param {object} opts
 * @param {function} opts.shape  Motif function.  Called once per segment with an optional
 *                               context argument: `function myMotif(ctx) { … }`.
 *                               Context properties:
 *                                 - `ctx.index` {number}  Zero-based segment index (0 … n-1).
 *                                 - `ctx.a1`    {number}  Start angle of the segment in degrees.
 *                                 - `ctx.a2`    {number}  End angle of the segment in degrees.
 *                                 - `ctx.r1`    {number}  Inner radius of the ring in pixels.
 *                                 - `ctx.r2`    {number}  Outer radius of the ring in pixels.
 *                               Motif functions that ignore context need no parameters:
 *                               `function myMotif() { … }` is equally valid.
 * @param {number}   opts.n      Number of repetitions.
 * @param {number}   opts.r1     Inner radius in pixels.
 * @param {number}   opts.r2     Outer radius in pixels.
 * @param {number}   [opts.offset=0]  Segment offset in units of (360 / n) degrees.
 *                                     Example: 1 shifts by one full segment; 0.5 gives a half-step repeat.
 * @param {number}   [opts.gapDegrees=0]  Angular gap between adjacent elements, in degrees.
 *                                         Maximum useful value is 360 / n.
 */
function ring({ shape, n, r1, r2, offset = 0, gapDegrees = 0 }) {
    const angleStep = (Math.PI * 2) / n;
    const angleOffset = offset * angleStep;
    const maxGapDegrees = 360 / n;
    const clampedGapDegrees = Math.max(0, Math.min(gapDegrees, maxGapDegrees));
    const occupiedAngleStep = angleStep - (clampedGapDegrees * (Math.PI / 180));
    const toDeg = 180 / Math.PI;

    for (let i = 0; i < n; i++) {
        const aCenter = (i + 0.5) * angleStep + angleOffset;
        // Build context available to the motif function.
        const ctx = {
            index: i,
            a1: (aCenter - occupiedAngleStep / 2) * toDeg,
            a2: (aCenter + occupiedAngleStep / 2) * toDeg,
            r1: r1,
            r2: r2,
        };
        // Capture fresh per segment so that calls like random() and noise()
        // inside the motif function produce independent values each repetition.
        const commands = captureMotif(shape, ctx);
        drawCommandsInRing(commands, aCenter, occupiedAngleStep, r1, r2);
    }
}

// ------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------

/**
 * Execute shapeFn() while capturing its drawing commands.
 * @param {function} shapeFn
 * @param {object}   [ctx]  Optional context object passed to the motif function.
 * @returns {Array<object>} List of recorded commands.
 */
function captureMotif(shapeFn, ctx) {
    _commands = [];
    _captureWithMotifTransforms(shapeFn, ctx);
    return _commands;
}

/** Push a curve command, applying the current motif transform when capturing. */
function _pushCommand(cmd) {
    if (_isCapturingMotif) {
        if (cmd.kind === 'dot') {
            const m = _mfClone(_motifMatrix);
            const c = _mfApply(m, cmd.x, cmd.y);
            const sx = Math.hypot(m.a, m.b);
            const sy = Math.hypot(m.c, m.d);
            const scaleAvg = 0.5 * (sx + sy);
            _commands.push(new DotCommand(c.x, c.y, cmd.r * scaleAvg));
        } else {
            _commands.push(new TransformedCurve(cmd, _mfClone(_motifMatrix)));
        }
    } else {
        _commands.push(cmd);
    }
}

/** Simple command record for mDot. */
function DotCommand(x, y, r) {
    this.kind = 'dot';
    this.x = x;
    this.y = y;
    this.r = r;
}

/** Execute motif code with local transform shims for translate/rotate/scale/push/pop/resetMatrix. */
function _captureWithMotifTransforms(shapeFn, ctx) {
    _isCapturingMotif = true;
    _motifMatrix = _mfIdentity();
    _motifStack = [];

    const prevTranslate = globalThis.translate;
    const prevRotate = globalThis.rotate;
    const prevScale = globalThis.scale;
    const prevPush = globalThis.push;
    const prevPop = globalThis.pop;
    const prevResetMatrix = globalThis.resetMatrix;

    globalThis.translate = function (tx, ty = 0) {
        _motifMatrix = _mfMultiply(_motifMatrix, _mfTranslate(tx, ty));
    };
    globalThis.rotate = function (a) {
        _motifMatrix = _mfMultiply(_motifMatrix, _mfRotate(_toRadians(a)));
    };
    globalThis.scale = function (sx, sy) {
        const syResolved = (typeof sy === 'number') ? sy : sx;
        _motifMatrix = _mfMultiply(_motifMatrix, _mfScale(sx, syResolved));
    };
    globalThis.push = function () {
        _motifStack.push(_mfClone(_motifMatrix));
    };
    globalThis.pop = function () {
        if (_motifStack.length > 0) {
            _motifMatrix = _motifStack.pop();
        }
    };
    globalThis.resetMatrix = function () {
        _motifMatrix = _mfIdentity();
    };

    try {
        shapeFn(ctx);
    } finally {
        globalThis.translate = prevTranslate;
        globalThis.rotate = prevRotate;
        globalThis.scale = prevScale;
        globalThis.push = prevPush;
        globalThis.pop = prevPop;
        globalThis.resetMatrix = prevResetMatrix;
        _isCapturingMotif = false;
        _motifMatrix = _mfIdentity();
        _motifStack = [];
    }
}

/** Curve wrapper that evaluates the base curve, then applies an affine transform. */
function TransformedCurve(base, matrix) {
    this.base      = base;
    this.matrix    = matrix;
    this.divisions = base.divisions;
    this.closed    = base.closed;
    this.evaluate  = function (t) {
        const p = base.evaluate(t);
        return _mfApply(matrix, p.x, p.y);
    };
}

/** @returns {{a:number,b:number,c:number,d:number,e:number,f:number}} */
function _mfIdentity() {
    return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

/** @param {{a:number,b:number,c:number,d:number,e:number,f:number}} m */
function _mfClone(m) {
    return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f };
}

/**
 * Multiply two 2D affine transforms (m1 × m2), represented as:
 * [a c e]
 * [b d f]
 * [0 0 1]
 */
function _mfMultiply(m1, m2) {
    return {
        a: m1.a * m2.a + m1.c * m2.b,
        b: m1.b * m2.a + m1.d * m2.b,
        c: m1.a * m2.c + m1.c * m2.d,
        d: m1.b * m2.c + m1.d * m2.d,
        e: m1.a * m2.e + m1.c * m2.f + m1.e,
        f: m1.b * m2.e + m1.d * m2.f + m1.f,
    };
}

function _mfTranslate(tx, ty) {
    return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
}

function _mfRotate(aRadians) {
    const c = Math.cos(aRadians);
    const s = Math.sin(aRadians);
    return { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
}

function _mfScale(sx, sy) {
    return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
}

function _mfApply(m, x, y) {
    return vec2(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
}

/**
 * Map a motif-space point (x,y) into canvas coordinates inside one ring segment.
 *
 * @param {number} x        Motif-space x (range set by setMotifSize, default [-1, 1]).
 * @param {number} y        Motif-space y (range set by setMotifSize, default [-1, 1]).
 * @param {number} aCenter  Center angle of this segment (radians).
 * @param {number} aStep    Angular width of one segment (radians).
 * @param {number} r1       Inner radius.
 * @param {number} r2       Outer radius.
 * @returns {{ x: number, y: number }} Canvas-space point.
 */
function mapToRing(x, y, aCenter, aStep, r1, r2) {
    const ds = _designSpaceSize;
    const angle = aCenter + map(x, -ds, ds, -0.5 * aStep, 0.5 * aStep);
    const radius = map(y, -ds, ds, r2, r1);
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
    const ds = _designSpaceSize;
    for (const cmd of commands) {
        if (cmd.kind === 'dot') {
            const c = mapToRing(cmd.x, cmd.y, aCenter, aStep, r1, r2);
            const radiusPx = _mapMotifRadiusToRingRadius(cmd.r, r1, r2, aStep, Math.hypot(c.x, c.y));
            circle(c.x, c.y, radiusPx);
            continue;
        }

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

/**
 * Convert a motif-space radius into an undistorted screen-space radius for the current ring.
 *
 * Primary mapping uses radial thickness (r2-r1), as requested.
 * For degenerate rings where r1===r2, fall back to angular spacing at the mapped center radius.
 */
function _mapMotifRadiusToRingRadius(r, r1, r2, aStep, centerRadiusPx) {
    const thickness = Math.abs(r2 - r1);
    const unitsToEdge = _designSpaceSize;
    if (unitsToEdge <= 0) return 0;
    const radialPxPerUnit = thickness / unitsToEdge;
    if (radialPxPerUnit > 0) {
        return Math.abs(r) * radialPxPerUnit;
    }

    // Zero-thickness ring fallback: derive scale from arc width per motif unit.
    const angularPxPerUnit = Math.abs(centerRadiusPx) * Math.abs(aStep) / (2 * unitsToEdge);
    return Math.abs(r) * angularPxPerUnit;
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
    if (!_smGridLinesVisible) return;

    push();

    const bg = _smGetBackgroundBrightness();
    const majorTone = _smGetContrastBrightness();
    const minorTone = lerp(bg, majorTone, 0.65);
    const labelTone = _smGetContrastBrightness(2);

    noFill();

    const majorDivisions = 5;
    const minorPerMajor = 4;
    const radialSpan = r2 - r1;
    const majorStep = radialSpan / majorDivisions;
    const minorStep = majorStep / minorPerMajor;

    // Concentric circles: major + minor
    for (let i = 0; i <= majorDivisions * minorPerMajor; i++) {
        const r = r1 + i * minorStep;
        const isMajor = (i % minorPerMajor) === 0;
        stroke(isMajor ? majorTone : minorTone, isMajor ? 90 : 50);
        strokeWeight(isMajor ? 1.2 : 1);
        circle(0, 0, Math.abs(r) * 2);
    }

    // Radial spokes
    const angleStep = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
        const a = i * angleStep;
        stroke(majorTone, 70);
        strokeWeight(1);
        line(r1 * Math.cos(a), r1 * Math.sin(a), r2 * Math.cos(a), r2 * Math.sin(a));
    }

    // Mouse hover helper: show current radius circle + radius readout
    const mx = mouseX - width / 2;
    const my = mouseY - height / 2;
    const hoverR = Math.sqrt(mx * mx + my * my);

    stroke(labelTone, 80);
    strokeWeight(1);
    noFill();
    circle(0, 0, hoverR * 2);
    line(0, 0, mx, my);

    noStroke();
    fill(labelTone);
    textFont('monospace');
    textAlign(LEFT, TOP);
    const tx = mx + 8;
    const ty = (my - 22 < -height / 2) ? my + 8 : my - 22;
    text('r=' + hoverR.toFixed(1), tx, ty);

    pop();
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
let _smGridLinesVisible = true; // toggle only grid lines (box/labels stay visible)
let _smDebugDraw   = false;   // show control-point handles for bezier/catmullrom

/** Control whether showMotif() draws grid lines (box and labels are always shown). */
function setShowMotifGridVisible(visible) {
    _smGridLinesVisible = !!visible;
}

/** Read current showMotif() grid-line visibility state. */
function isShowMotifGridVisible() {
    return _smGridLinesVisible;
}

/** Control whether showMotif() draws Bézier and Catmull-Rom control-point handles. */
function setMotifDebugDraw(enabled) {
    _smDebugDraw = !!enabled;
}

/** Read current debug-draw state. */
function isMotifDebugDrawEnabled() {
    return _smDebugDraw;
}

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
    if (_smGridLinesVisible) {
        push();
        resetMatrix();
        _smDrawOverlay();
        pop();
    }
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

/** Pixel scale: maps one design-space unit to this many canvas pixels at the current zoom. */
function _smScale() {
    return (Math.min(width, height) / (2 * _designSpaceSize * 1.25)) * _smZoom;
}

/** Draw the background grid and the motif-space boundary box. */
function _smDrawGrid() {
    const sc = _smScale();
    const ox = width  / 2 + _smPanX;
    const oy = height / 2 + _smPanY;
    const bg = _smGetBackgroundBrightness();
    const majorTone = _smGetContrastBrightness();
    const minorTone = lerp(bg, majorTone, 0.65);
    const halfAxisTone = _smGetContrastBrightness(1.35);
    const outsideTone = lerp(bg, majorTone, 0.35);
    const boxTone = lerp(bg, majorTone, 0.85);
    const ds = _designSpaceSize;
    const xLeft = -ds * sc + ox;
    const xRight = ds * sc + ox;
    const yTop = -ds * sc + oy;
    const yBottom = ds * sc + oy;

    // Visible motif-space range
    const mxMin = (0      - ox) / sc;
    const mxMax = (width  - ox) / sc;
    const myMin = (0      - oy) / sc;
    const myMax = (height - oy) / sc;

    // Grid: 20 divisions across full design space (10 per side from the center).
    const minorStep = ds > 0 ? ds / 10 : 1;
    const majorPer  = 5;     // every 5 units: ... -10, -5, 0, 5, 10 for ds=10
    const halfAxis = ds * 0.5;
    const epsilon = minorStep * 0.001;

    noFill();
    strokeWeight(1);

    const ixMin = Math.floor(mxMin / minorStep);
    const ixMax = Math.ceil(mxMax  / minorStep);
    const iyMin = Math.floor(myMin / minorStep);
    const iyMax = Math.ceil(myMax  / minorStep);

    if (_smGridLinesVisible) {
        // Vertical grid lines
        for (let i = ixMin; i <= ixMax; i++) {
            const mx     = i * minorStep;
            const inside = mx >= -ds && mx <= ds;
            const major  = (i % majorPer === 0);
            const halfAxisLine = Math.abs(Math.abs(mx) - halfAxis) <= epsilon;
            const sx = mx * sc + ox;

            if (inside) {
                stroke(outsideTone);
                line(sx, 0, sx, yTop);
                line(sx, yBottom, sx, height);

                stroke(halfAxisLine ? halfAxisTone : (major ? majorTone : minorTone));
                line(sx, yTop, sx, yBottom);
            } else {
                stroke(outsideTone);
                line(sx, 0, sx, height);
            }
        }

        // Horizontal grid lines
        for (let j = iyMin; j <= iyMax; j++) {
            const my     = j * minorStep;
            const inside = my >= -ds && my <= ds;
            const major  = (j % majorPer === 0);
            const halfAxisLine = Math.abs(Math.abs(my) - halfAxis) <= epsilon;
            const sy = my * sc + oy;

            if (inside) {
                stroke(outsideTone);
                line(0, sy, xLeft, sy);
                line(xRight, sy, width, sy);

                stroke(halfAxisLine ? halfAxisTone : (major ? majorTone : minorTone));
                line(xLeft, sy, xRight, sy);
            } else {
                stroke(outsideTone);
                line(0, sy, width, sy);
            }
        }
    }

    // Faint box outlining the design space
    stroke(boxTone);
    strokeWeight(1);
    rect(-ds * sc + ox, -ds * sc + oy, 2 * ds * sc, 2 * ds * sc);

    _smDrawReferenceLabels(xLeft, xRight, yTop, yBottom);
}

/** Draw fixed coordinate labels for corners and side midpoints outside the motif box. */
function _smDrawReferenceLabels(xLeft, xRight, yTop, yBottom) {
    const tone = _smGetContrastBrightness(2);
    const pad = 10;
    const ds = _designSpaceSize;
    const hs = ds * 0.5;
    // Format a coordinate value: integers display without decimals, others use toFixed(2)
    const fv = v => Number.isInteger(v) ? String(v) : parseFloat(v.toFixed(2)).toString();
    const n = fv(ds);
    const h = fv(hs);

    noStroke();
    fill(tone);
    textSize(12);
    textFont('monospace');

    textAlign(RIGHT, BOTTOM);
    text(`(-${n}, -${n})`, xLeft - pad, yTop - pad);

    textAlign(CENTER, BOTTOM);
    text(`(-${h}, -${n})`, xLeft + (xRight - xLeft) * 0.25, yTop - pad);
    text(`(${h}, -${n})`, xLeft + (xRight - xLeft) * 0.75, yTop - pad);
    text(`(0, -${n})`, (xLeft + xRight) / 2, yTop - pad);

    textAlign(LEFT, BOTTOM);
    text(`(${n}, -${n})`, xRight + pad, yTop - pad);

    textAlign(RIGHT, CENTER);
    text(`(-${n}, -${h})`, xLeft - pad, yTop + (yBottom - yTop) * 0.25);
    text(`(-${n}, 0)`, xLeft - pad, (yTop + yBottom) / 2);
    text(`(-${n}, ${h})`, xLeft - pad, yTop + (yBottom - yTop) * 0.75);

    textAlign(LEFT, CENTER);
    text(`(${n}, -${h})`, xRight + pad, yTop + (yBottom - yTop) * 0.25);
    text(`(${n}, 0)`, xRight + pad, (yTop + yBottom) / 2);
    text(`(${n}, ${h})`, xRight + pad, yTop + (yBottom - yTop) * 0.75);

    textAlign(RIGHT, TOP);
    text(`(-${n}, ${n})`, xLeft - pad, yBottom + pad);

    textAlign(CENTER, TOP);
    text(`(-${h}, ${n})`, xLeft + (xRight - xLeft) * 0.25, yBottom + pad);
    text(`(0, ${n})`, (xLeft + xRight) / 2, yBottom + pad);
    text(`(${h}, ${n})`, xLeft + (xRight - xLeft) * 0.75, yBottom + pad);

    textAlign(LEFT, TOP);
    text(`(${n}, ${n})`, xRight + pad, yBottom + pad);
}

/** Replay captured motif commands in screen space. */
function _smDrawCommands(commands, sc, ox, oy) {
    for (const cmd of commands) {
        if (cmd.kind === 'dot') {
            circle(cmd.x * sc + ox, cmd.y * sc + oy, Math.abs(cmd.r) * sc * 2);
            continue;
        }

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

    // Debug-draw control-point handles on top of the curves
    if (_smDebugDraw) {
        for (const cmd of commands) {
            _smDrawDebugCmd(cmd, sc, ox, oy);
        }
    }
}

/**
 * Draw control-point handles for a single command when debug draw is enabled.
 * Handles TransformedCurve wrappers by applying their stored matrix.
 */
function _smDrawDebugCmd(cmd, sc, ox, oy) {
    // Unwrap a TransformedCurve to access raw base data
    const base   = (cmd.base !== undefined) ? cmd.base   : cmd;
    const matrix = (cmd.base !== undefined) ? cmd.matrix : null;

    const toScreen = (x, y) => {
        const p = matrix ? _mfApply(matrix, x, y) : vec2(x, y);
        return vec2(p.x * sc + ox, p.y * sc + oy);
    };

    push();

    if (base.kind === 'bezier') {
        const p1  = toScreen(base.x1,  base.y1);
        const cp1 = toScreen(base.cx1, base.cy1);
        const cp2 = toScreen(base.cx2, base.cy2);
        const p2  = toScreen(base.x2,  base.y2);

        stroke(255, 120, 0, 180);
        strokeWeight(1);
        noFill();
        line(p1.x, p1.y, cp1.x, cp1.y);
        line(p2.x, p2.y, cp2.x, cp2.y);

        noStroke();
        fill(255, 120, 0, 220);
        circle(cp1.x, cp1.y, 8);
        circle(cp2.x, cp2.y, 8);

    } else if (base.kind === 'catmullrom') {
        const pts = base.points;
        if (!pts || pts.length < 2) { pop(); return; }

        stroke(255, 120, 0, 180);
        strokeWeight(1);
        noFill();
        for (let i = 0; i < pts.length - 1; i++) {
            const a = toScreen(pts[i].x,     pts[i].y);
            const b = toScreen(pts[i + 1].x, pts[i + 1].y);
            line(a.x, a.y, b.x, b.y);
        }

        noStroke();
        fill(255, 120, 0, 220);
        for (const pt of pts) {
            const p = toScreen(pt.x, pt.y);
            circle(p.x, p.y, 8);
        }
    }

    pop();
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
