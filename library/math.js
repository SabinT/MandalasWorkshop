// ============================================================
// math.js — Vector math and coordinate-space helpers
// ============================================================

/**
 * Create a 2D point / vector compatible with p5.js createVector().
 * Usage: vec2(0.5, -1)
 *
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function vec2(x, y) {
    return { x, y };
}

/**
 * Add two vec2 values and return a new vec2.
 */
function v2Add(a, b) {
    return vec2(a.x + b.x, a.y + b.y);
}

/**
 * Subtract vec2 b from a and return a new vec2.
 */
function v2Sub(a, b) {
    return vec2(a.x - b.x, a.y - b.y);
}

/**
 * Scale a vec2 by a scalar and return a new vec2.
 */
function v2Scale(v, s) {
    return vec2(v.x * s, v.y * s);
}

/**
 * Dot product of two vec2 values.
 */
function v2Dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

/**
 * Length (magnitude) of a vec2.
 */
function v2Length(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Normalize a vec2 to unit length. Returns vec2(0,0) for zero vectors.
 */
function v2Normalize(v) {
    const len = v2Length(v);
    return len > 0 ? v2Scale(v, 1 / len) : vec2(0, 0);
}

/**
 * Linear interpolation between two vec2 values.
 * t=0 → a, t=1 → b
 */
function v2Lerp(a, b, t) {
    return vec2(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t
    );
}

/**
 * Convert polar coordinates to a Cartesian vec2.
 * @param {number} angle  Angle in radians.
 * @param {number} radius
 */
function polarToCartesian(angle, radius) {
    return vec2(Math.cos(angle) * radius, Math.sin(angle) * radius);
}

/**
 * Convert Cartesian coordinates to polar { angle, radius }.
 */
function cartesianToPolar(x, y) {
    return { angle: Math.atan2(y, x), radius: Math.sqrt(x * x + y * y) };
}

/**
 * Re-map a value from one range to another (mirrors p5.js map()).
 * Provided here so utility files can be used independently of p5.
 */
function remap(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}
