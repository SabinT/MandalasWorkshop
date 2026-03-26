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
// • Use mLine(), mBezier(), mCircle(), mTriangle(), mQuad(), mShape(),
//   mPath(), mArc(), mEllipse(), or mCurve() inside a motif function.
// ============================================================

// Change this one value to update both the full mandala view and showMotif().
// You can use grayscale numbers like 255 or hex colors like "#ffffff".
const MANDALA_BG = "#accbbc";
const CANVAS_SIZE = 1000;
const UI = new WorkshopSketchUI();

function setup() {
    createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    angleMode(RADIANS);
}

function draw() {
    background(MANDALA_BG);
    translate(width / 2, height / 2);

    // Faint grid to visualize the outermost ring segments
    drawPolarGrid(16, 0, 490);

    // ── Ring 1: Leaf (mLine, mBezier, mCircle) ──────────────
    stroke(0);
    fill("rgba(0, 180, 80, 0.3)");
    ring({ shape: motifLeaf,    n: 12, r1:  50, r2: 130 });

    // ── Ring 2: Feather (mTriangle, mArc) ───────────────────
    stroke("navy");
    fill("rgba(80, 120, 255, 0.35)");
    ring({ shape: motifFeather, n: 10, r1: 140, r2: 220 });

    // ── Ring 3: Petal (mEllipse, mPath) ─────────────────────
    stroke("purple");
    fill("rgba(200, 80, 200, 0.3)");
    ring({ shape: motifPetal,   n:  8, r1: 230, r2: 310 });

    // ── Ring 4: Star (mShape) ────────────────────────────────
    stroke("darkred");
    fill("rgba(255, 100, 30, 0.4)");
    ring({ shape: motifStar,    n: 12, r1: 320, r2: 400 });

    // ── Ring 5: Wave (mCurve) ────────────────────────────────
    stroke("teal");
    noFill();
    ring({ shape: motifWave,    n: 16, r1: 410, r2: 455 });

    // ── Ring 6: Tile (mQuad) ─────────────────────────────────
    stroke(0);
    fill("rgba(255, 200, 0, 0.5)");
    ring({ shape: motifTile,    n: 16, r1: 460, r2: 490 });

    if (UI.isDebugDrawEnabled()) {
        showMotif(motifPetal);
        showMotif(motifStar);
    }
}

// ── Ring 1: Leaf — mLine, mBezier, mCircle ───────────────────
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

// ── Ring 2: Feather — mTriangle, mArc ────────────────────────
function motifFeather() {
    // Arrowhead triangle at the outer edge
    mTriangle(-0.28, 0.45, 0.28, 0.45, 0, 0.92);
    // Curved arc forming the quill stem
    mArc(0, -0.5, 0.9, Math.PI * 0.36, Math.PI * 0.64);
}

// ── Ring 3: Petal — mEllipse, mPath ──────────────────────────
function motifPetal() {
    rotate(-PI / 6);
    // Tall ellipse petal
    mEllipse(0, 0, 0.52, 0.52);
    // Decorative vein running through the petal
    mPath([
        vec2( 0,   -0.7),
        vec2(-0.18,  0  ),
        vec2( 0.18,  0.3),
        vec2( 0,    0.7),
    ]);
}

// ── Ring 4: Star — mShape ────────────────────────────────────
function motifStar() {
    // 4-pointed star built from 8 vertices
    mShape([
        vec2( 0,   -0.92),
        vec2( 0.18, -0.18),
        vec2( 0.75,  0   ),
        vec2( 0.18,  0.18),
        vec2( 0,    0.92),
        vec2(-0.18,  0.18),
        vec2(-0.75,  0   ),
        vec2(-0.18, -0.18),
    ]);
}

// ── Ring 5: Wave — mCurve ────────────────────────────────────
function motifWave() {
    // Smooth S-curve spanning the full width of the segment
    mCurve([
        vec2(-1,    0  ),
        vec2(-0.5, -0.75),
        vec2( 0,    0.75),
        vec2( 0.5, -0.75),
        vec2( 1,    0  ),
    ]);
}

// ── Ring 6: Tile — mQuad ─────────────────────────────────────
function motifTile() {
    // Slightly tapered tile that follows the ring curvature
    mQuad(-0.65, -0.82,  0.65, -0.82,  0.82, 0.82, -0.82, 0.82);
}
