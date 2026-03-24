// ============================================================
// sketch.js — Your mandala design lives here!
// ============================================================
//
// HOW IT WORKS
// ------------
// • Design your motif in "easy space": a normalized square [-1,-1] to [1,1].
//     x axis  →  angular position within one ring segment
//     y axis  →  radial position (-1 = inner edge, +1 = outer edge)
// • Call ring() to repeat the motif radially around a circle.
// • Use mLine(), mBezier(), mCircle() to draw inside a motif function.
// ============================================================

function setup() {
    createCanvas(1000, 1000);
    angleMode(RADIANS);
}

function draw() {
    background(255);
    translate(width / 2, height / 2);

    // Faint grid to visualize the ring segments
    drawPolarGrid(12, 80, 160);

    stroke(0);
    noFill();

    // ── Example motif ──────────────────────────────────────────
    ring({
        shape: motifLeaf,
        n: 12,
        r1: 80,
        r2: 160
    });

    // ── TODO: add your own ring below ──────────────────────────
    ring({
        shape: motifCustom,
        n: 8,
        r1: 170,
        r2: 280
    });
}

// ── Example: a simple leaf shape ───────────────────────────────
function motifLeaf() {
    mLine(0, -0.8, 0, 0.8);
    mBezier(
        0, -0.8,
        -0.8, -0.2,
        -0.8,  0.2,
        0,  0.8
    );
    mBezier(
        0, -0.8,
        0.8, -0.2,
        0.8,  0.2,
        0,  0.8
    );
    mCircle(0, 0, 0.15);
}

// ── TODO: design your own motif here ───────────────────────────
function motifCustom() {
    /** change this code **/

    // A simple diamond as a starting point — replace with your own design!
    mLine( 0, -0.9,  0.6, 0);
    mLine( 0.6, 0,   0,  0.9);
    mLine( 0,  0.9, -0.6, 0);
    mLine(-0.6, 0,   0, -0.9);

    /** change this code **/
}
