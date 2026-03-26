// ============================================================
// sketch.js — Your mandala design lives here!
// ============================================================
//
// HOW IT WORKS
// ------------
// • Design your motif in "easy space": a square [-S,-S] to [S,S], where S is
//   MOTIF_SIZE (set to 10 below).
//     x axis  →  angular position within one ring segment
//     y axis  →  radial position (-S = inner edge, +S = outer edge)
// • Call ring() to repeat the motif radially around a circle.
// • Use mLine(), mBezier(), mCircle(), mTriangle(), mQuad(), mShape(),
//   mPath(), mArc(), mEllipse(), mBox(), mCurve(), or mDot() inside a motif.
//
// TIPS
// ----
// • See demoMotifs.js for example motif implementations.
// • Call demoMandala() to see a complete example.
// • Use showMotif(yourMotif) in debug mode to preview your motif design.
// ============================================================

const MANDALA_BG = "#accbbc";
const CANVAS_SIZE = 1000;
const MOTIF_SIZE = 10;
const UI = new WorkshopSketchUI();

function setup() {
    createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    setMotifSize(MOTIF_SIZE);
    angleMode(DEGREES);
}

function draw() {
    background(MANDALA_BG);
    translate(width / 2, height / 2);

    // This is where you can change the repitition and placement of motifs
    // Add more ring() calls to combine multiple rings with different parameters.
    ring({ shape: yourMotif, n: 12, r1: 50, r2: 130 });

    if (UI.isDebugDrawEnabled()) {
        // Show isolated motif designs in debug mode.
        // Add more lines like this to preview multiple motifs at once.
        showMotif(yourMotif);
    }
}

// ── Your motif — change this! ────────────────────────────────

/**
 * Create your custom motif here!
 *
 * TODO: Design your motif using mLine, mBezier, mBox, etc.
 * Coordinates are in [-MOTIF_SIZE, MOTIF_SIZE].
 *
 * @change Design your own shape below
 */
function yourMotif() {
    mLine(-10, 10, 10, 10);
    mLine(-10, 10, 0, -10);
    mLine(10, 10, 0, -10);
}