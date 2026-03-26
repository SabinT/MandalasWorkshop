// ============================================================
// curves.js — Parametric curve definitions for motif drawing
// ============================================================
//
// Each curve exposes:
//   evaluate(t)  → vec2 in motif ("easy") space, t ∈ [0, 1]
//   divisions    → number of line segments used to sample the curve
//   closed       → whether the curve forms a closed loop
//
// Depends on: math.js (vec2)
// No p5.js dependency — uses Math.* throughout.
// ============================================================

/** Default number of sample divisions per curve type. */
const LINE_DIVISIONS   = 8;
const BEZIER_DIVISIONS = 32;
const CIRCLE_DIVISIONS = 32;
const ARC_DIVISIONS    = 32;

// ------------------------------------------------------------
// LineCurve
// ------------------------------------------------------------

/**
 * A straight line segment in motif space from (x1,y1) to (x2,y2).
 *
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
function LineCurve(x1, y1, x2, y2, divisions) {
    this.divisions = (divisions && divisions > 0) ? divisions : LINE_DIVISIONS;
    this.closed    = false;

    /**
     * Evaluate the line at parameter t ∈ [0, 1].
     * @param {number} t
     * @returns {{ x: number, y: number }}
     */
    this.evaluate = function (t) {
        return vec2(
            x1 + t * (x2 - x1),
            y1 + t * (y2 - y1)
        );
    };
}

// ------------------------------------------------------------
// BezierCurve
// ------------------------------------------------------------

/**
 * A cubic Bézier curve in motif space.
 * Arguments match p5.js bezier(): anchor1, control1, control2, anchor2.
 *
 * @param {number} x1   Anchor 1 x
 * @param {number} y1   Anchor 1 y
 * @param {number} cx1  Control 1 x
 * @param {number} cy1  Control 1 y
 * @param {number} cx2  Control 2 x
 * @param {number} cy2  Control 2 y
 * @param {number} x2   Anchor 2 x
 * @param {number} y2   Anchor 2 y
 */
function BezierCurve(x1, y1, cx1, cy1, cx2, cy2, x2, y2, divisions) {
    this.divisions = (divisions && divisions > 0) ? divisions : BEZIER_DIVISIONS;
    this.closed    = false;

    /**
     * Evaluate the cubic Bézier at parameter t ∈ [0, 1].
     * @param {number} t
     * @returns {{ x: number, y: number }}
     */
    this.evaluate = function (t) {
        const u = 1 - t;
        return vec2(
            u*u*u * x1  + 3*u*u*t * cx1 + 3*u*t*t * cx2 + t*t*t * x2,
            u*u*u * y1  + 3*u*u*t * cy1 + 3*u*t*t * cy2 + t*t*t * y2
        );
    };
}

// ------------------------------------------------------------
// CircleCurve
// ------------------------------------------------------------

/**
 * A full circle in motif space, centred at (cx, cy) with radius r.
 *
 * @param {number} cx  Centre x
 * @param {number} cy  Centre y
 * @param {number} r   Radius
 */
function CircleCurve(cx, cy, r, divisions) {
    this.divisions = (divisions && divisions > 0) ? divisions : CIRCLE_DIVISIONS;
    this.closed    = true;

    /**
     * Evaluate the circle at parameter t ∈ [0, 1].
     * t=0 and t=1 both map to the same point (0° / 360°).
     * @param {number} t
     * @returns {{ x: number, y: number }}
     */
    this.evaluate = function (t) {
        const a = t * (Math.PI * 2);
        return vec2(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    };
}

// ------------------------------------------------------------
// PolyCurve
// ------------------------------------------------------------

/**
 * A polyline (or closed polygon) through an ordered list of vec2 points.
 * Used by mTriangle, mQuad, mShape, and mPath.
 *
 * @param {Array<{x:number,y:number}>} points  Vertices in motif space.
 * @param {boolean}                    closed   Whether to connect the last point back to the first.
 */
function PolyCurve(points, closed, divisions) {
    const numSegments  = closed ? points.length : points.length - 1;
    const divPerEdge   = (divisions && divisions > 0) ? divisions : LINE_DIVISIONS;
    this.divisions     = numSegments * divPerEdge;
    this.closed        = closed;

    /**
     * Evaluate the polyline at parameter t ∈ [0, 1].
     * @param {number} t
     * @returns {{ x: number, y: number }}
     */
    this.evaluate = function (t) {
        if (numSegments === 0) return points[0] || vec2(0, 0);
        const scaled = t * numSegments;
        const i      = Math.min(Math.floor(scaled), numSegments - 1);
        const u      = scaled - i;
        const a      = points[i];
        const b      = closed ? points[(i + 1) % points.length] : points[i + 1];
        return vec2(a.x + u * (b.x - a.x), a.y + u * (b.y - a.y));
    };
}

// ------------------------------------------------------------
// ArcCurve
// ------------------------------------------------------------

/**
 * A circular arc in motif space (stroke only — not a closed shape).
 *
 * @param {number} cx          Centre x
 * @param {number} cy          Centre y
 * @param {number} r           Radius
 * @param {number} startAngle  Start angle in radians.
 * @param {number} endAngle    End angle in radians.
 */
function ArcCurve(cx, cy, r, startAngle, endAngle, divisions) {
    this.divisions = (divisions && divisions > 0) ? divisions : ARC_DIVISIONS;
    this.closed    = false;

    /**
     * Evaluate the arc at parameter t ∈ [0, 1].
     * @param {number} t
     * @returns {{ x: number, y: number }}
     */
    this.evaluate = function (t) {
        const a = startAngle + t * (endAngle - startAngle);
        return vec2(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    };
}

// ------------------------------------------------------------
// EllipseCurve
// ------------------------------------------------------------

/**
 * A full ellipse in motif space, centred at (cx, cy) with half-axes rx and ry.
 *
 * @param {number} cx  Centre x
 * @param {number} cy  Centre y
 * @param {number} rx  Horizontal radius
 * @param {number} ry  Vertical radius
 */
function EllipseCurve(cx, cy, rx, ry, divisions) {
    this.divisions = (divisions && divisions > 0) ? divisions : CIRCLE_DIVISIONS;
    this.closed    = true;

    /**
     * Evaluate the ellipse at parameter t ∈ [0, 1].
     * @param {number} t
     * @returns {{ x: number, y: number }}
     */
    this.evaluate = function (t) {
        const a = t * (Math.PI * 2);
        return vec2(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
    };
}

// ------------------------------------------------------------
// CatmullRomCurve
// ------------------------------------------------------------

/**
 * A smooth Catmull-Rom spline through an ordered list of vec2 points.
 * Ghost points are synthesised at both ends so the curve passes through
 * the first and last control points.
 *
 * @param {Array<{x:number,y:number}>} points  Control points in motif space.
 */
function CatmullRomCurve(points, divisions) {
    const numSegments   = Math.max(1, points.length - 1);
    const divPerSegment = (divisions && divisions > 0) ? divisions : BEZIER_DIVISIONS;
    this.divisions      = numSegments * divPerSegment;
    this.closed         = false;

    /**
     * Evaluate the Catmull-Rom spline at parameter t ∈ [0, 1].
     * @param {number} t
     * @returns {{ x: number, y: number }}
     */
    this.evaluate = function (t) {
        if (points.length < 2) return points[0] || vec2(0, 0);
        const scaled = t * numSegments;
        const i      = Math.min(Math.floor(scaled), numSegments - 1);
        const u      = scaled - i;

        const p1 = points[i];
        const p2 = points[i + 1];
        // Synthesise ghost control points at the two ends
        const p0 = i > 0        ? points[i - 1]     : vec2(2 * p1.x - p2.x, 2 * p1.y - p2.y);
        const p3 = i + 2 < points.length ? points[i + 2] : vec2(2 * p2.x - p1.x, 2 * p2.y - p1.y);

        const u2 = u * u;
        const u3 = u2 * u;
        // Catmull-Rom basis coefficients
        const c0 =  -u3 + 2*u2 - u;
        const c1 =   3*u3 - 5*u2 + 2;
        const c2 =  -3*u3 + 4*u2 + u;
        const c3 =   u3 - u2;
        return vec2(
            0.5 * (p0.x * c0 + p1.x * c1 + p2.x * c2 + p3.x * c3),
            0.5 * (p0.y * c0 + p1.y * c1 + p2.y * c2 + p3.y * c3)
        );
    };
}
