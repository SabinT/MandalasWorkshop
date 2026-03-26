// ============================================================
// sketch.js — Your mandala design lives here!
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

    // Mandala-view radial grid (toggle with Show/Hide Grid in toolbar)
    drawPolarGrid(16, 0, width / 2);

    // This is where you can change the repitition and placement of motifs
    // Change the arguments to ring() to create different arrangements of your motif.
    // Add more lines like this to arrange more motifs.
    // Change color, thickness, etc before a ring() call to style that ring's motifs.
    ring({ shape: yourMotif, n: 24, r1: 100, r2: 130 });

    ring({ shape: yourMotif, n: 24, r1: 130, r2: 160, offset: 0.5 });

    // This block is activated when you enable "Enable Debug Draw" in the UI.
    if (UI.isDebugDrawEnabled()) {
        // Show isolated motif designs in debug mode.
        // Add more lines like this to preview multiple motifs at once.
        showMotif(yourMotif);
    }
}

/**
 * Create your custom motif here!
 * Design your motif in undistorted space: a square [-S,-S] to [S,S], where S is MOTIF_SIZE.
 *
 * TODO: Design your motif using mLine, mTriangle, mBox, mQuad,etc.
 */
function yourMotif() {
    mLine(-10, 10, 10, 10);
    mLine(-10, 10, 0, -10);
    mLine(10, 10, 0, -10);
}