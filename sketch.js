// --------- SYSTEM CODE: Don't change this! ----------
const UI = new WorkshopSketchUI();
const CANVAS_SIZE = 1000;
const MOTIF_SIZE = 10;

function setup() {
    createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    setMotifSize(MOTIF_SIZE);
    angleMode(DEGREES);
}
// --------- END OF SYSTEM CODE -----------------------

// Change background color here! It has to be a hex code
const MANDALA_BG = "#accbbc";

function draw() {
    // ------------ Setup code: don't change this block ----------
    background(MANDALA_BG);
    translate(width / 2, height / 2);
    drawPolarGrid(UI.getPolarGridDivisions(), 0, width / 2);

    // ------------- YOUR MANDALA DESIGN HERE! ------------------
    // Set stroke and fill colors
    stroke("black");
    fill("white");

    // Syntax: ring({ shape: motifFunction, n: [reptition count], r1: [start radius], r2: [end radius] });
    ring({ shape: yourMotif, n: 24, r1: 250, r2: 300 });

    // Try optional 'offset' and 'gapDegrees' parameters to stagger / space out motifs within a ring!
    // ring({ shape: yourMotif, n: 24, r1: 300, r2: 320, offset: 0.5, gapDegrees: 10 });

    // ------------- END OF YOUR DESIGN ------------------

    if (UI.showMotif) {
        // Preview a motif when you click the "Show motif" button in the UI.
        // Change 'yourMotif' to the name of any motif function you want to preview!
        showMotif(yourMotif);
    }
}

// A motif is a simple function that used commands like mLine(), mTriangle(), etc.
// The design space is a 20x20 box centered at (0,0)
function yourMotif() {
    mTriangle(-10, 10, 0, -10, 10, 10);
}

// Add new motif functions here! You can create as many as you like.
// Try these other drawing commands inside your motif functions!
// mLine(-10, -10, 10, 10);
// mCircle(0, 0, 10);
// mQuad(-10, -10, -5, 10, 5, 10, 10, -10);    
// mDot(0, 0, 10);
// mEllipse(0, 0, 5, 10);
// mBezier(-10, -10, -5, 5, 10, -10, 10, 10);
