// ============================================================
// sketch.js — Your mandala design lives here!
// ============================================================
const UI = new WorkshopSketchUI();

// Change background color here!
const MANDALA_BG = "#accbbc";
const CANVAS_SIZE = 1000;
const MOTIF_SIZE = 10;

function setup() {
    createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    setMotifSize(MOTIF_SIZE);
    angleMode(DEGREES);
}

function draw() {
    background(MANDALA_BG);
    translate(width / 2, height / 2);

    // Mandala-view radial grid (toggle with Show/Hide Grid in toolbar)
    drawPolarGrid(UI.getPolarGridDivisions(), 0, width / 2);

    // This is where you can change the repitition and placement of motifs
    // Change the arguments to ring() to create different arrangements of your motif.
    // Add more lines like this to arrange more motifs.
    // Change color, thickness, etc before a ring() call to style that ring's motifs.
    ring({ shape: yourMotif, n: 24, r1: 250, r2: 300 });

    // Try 'offset' and 'gap' parameters to stagger / space out motifs!
    // ring({ shape: yourMotif, n: 24, r1: 300, r2: 320, offset: 0.5, gapDegrees: 10 });


    // This block is activated when you enable "Enable Debug Draw" in the UI.
    if (UI.showMotif) {
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
    // This is a reference of all the available motif drawing commands.
    // mLine(-10, -10, 10, 10, 1);

    mTriangle(-10, 10, 0, -10, 10, 10);

    // Try these other commands as well!
    // mBox(-10, -10, 20, 20, 1);

    // mQuad(-10, -10, -5, 10, 5, 10, 10, -10);

    // mBezier(-10, -10, -5, 5, 10, -10, 10, 10);

    // mArc(0, 0, 8, 0, 180);

    // mCircle(0, 0, 10);

    // Hexagon = circle approximated with 6 points!
    // mCircle(0, 0, 10, 6);

    // mDot(0, 0, 10);

    // mEllipse(0, 0, 5, 10);
}