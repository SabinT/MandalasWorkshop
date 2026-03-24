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
function LineCurve(x1, y1, x2, y2) {
    this.divisions = LINE_DIVISIONS;
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
function BezierCurve(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
    this.divisions = BEZIER_DIVISIONS;
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
function CircleCurve(cx, cy, r) {
    this.divisions = CIRCLE_DIVISIONS;
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
