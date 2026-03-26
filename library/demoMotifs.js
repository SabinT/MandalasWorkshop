// ============================================================
// demoMotifs.js — Example motif designs
// ============================================================
//
// These are reference motif implementations demonstrating
// different drawing techniques. Import and reference these
// in sketch.js to see them in action.
//
// Example usage in sketch.js:
//   ring({ shape: demoLeaf, n: 12, r1: 50, r2: 130 })
//   demoMandala();          // Draw complete demo mandala
//
// ============================================================

/**
 * A simple triangular gear tooth using mLine only.
 * Demonstrates: basic line drawing.
 */
function demoGeatTooth() {
    const s = MOTIF_SIZE;
    // Draws lines like this: _|"|_
    mLine(-s, s, -0.5 * s, s);  // Base line
    mLine(-0.5 * s, s, -0.5 * s, -s); // Left edge
    mLine(-0.5 * s, -s, 0.5 * s, -s); // Top edge
    mLine(0.5 * s, -s, 0.5 * s, s); // Right edge
    mLine(0.5 * s, s, s, s); // Base line
}

/**
 * A leaf shape using mBezier curves converging at the tip,
 * with a straight mLine base.
 * Demonstrates: Bézier curves and basic composition.
 */
function demoLeaf() {
    const s = MOTIF_SIZE;
    
    // Left side: curved edge from bottom-left to tip
    mBezier(
        -0.6 * s, -1 * s,      // anchor 1 (bottom-left)
        -0.8 * s, -0.3 * s,    // control 1 (bulge outward left)
        -0.3 * s,  0.5 * s,    // control 2 (curve toward center)
        0,         1 * s       // anchor 2 (tip)
    );
    
    // Right side: curved edge from tip to bottom-right
    mBezier(
        0,         1 * s,      // anchor 1 (tip)
        0.3 * s,   0.5 * s,    // control 1 (curve toward center)
        0.8 * s,  -0.3 * s,    // control 2 (bulge outward right)
        0.6 * s,  -1 * s       // anchor 2 (bottom-right)
    );
    
    // Base: straight line connecting bottom corners
    mLine(-0.6 * s, -1 * s, 0.6 * s, -1 * s);
}

/**
 * A small diamond (square rotated 45°) using mBox.
 * Demonstrates: axis-aligned box primitive.
 */
function demoDiamond() {
    const s = MOTIF_SIZE;
    mQuad(-s, 0, 0, s, s, 0, 0, -s);
}

/**
 * A large box that spans the entire design space using mBox.
 * Demonstrates: full coverage and coordinate system bounds.
 */
function demoBox() {
    const s = MOTIF_SIZE;
    // Draw a box from (-s, -s) to (s, s) — the full extent
    mBox(-s, -s, 2 * s, 2 * s);
}

function allCommands() {
    // This is a reference of all the available motif drawing commands.
    // mLine(-10, -10, 10, 10, 1);

    // mTriangle(-10, -10, 0, 10, 10, -10, 1);

    // mBox(-10, -10, 20, 20, 1);

    // mQuad(-10, -10, -5, 10, 5, 10, 10, -10);

    // mBezier(-10, -10, -5, 5, 10, -10, 10, 10);

    // let points = [];
    // points.push(vec2(-10, -10));
    // points.push(vec2(0, 10));
    // points.push(vec2(10, -10));
    // mCurve(points);
    // mPath(points);
    // mShape(points);

    // mArc(0, 0, 8, 0, 180);

    // mCircle(0, 0, 10, 6);

    // mDot(0, 0, 10);

    // mEllipse(0, 0, 5, 10);
}

/**
 * Draw a complete demo mandala showcasing all demo motifs.
 * Call this from draw() instead of individual ring() calls.
 *
 * Combines all demo motifs into a symmetric multi-ring design.
 */
function demoMandala() {
    // ── Ring 1: Gear Tooth (mLine only) ─────────────────────
    stroke(0);
    fill("rgba(200, 100, 50, 0.3)");
    ring({ shape: demoGeatTooth, n: 16, r1:  50, r2: 110 });

    // ── Ring 2: Leaf (mBezier + mLine) ─────────────────────
    stroke("darkgreen");
    fill("rgba(0, 180, 80, 0.3)");
    ring({ shape: demoLeaf, n: 12, r1: 120, r2: 180 });

    // ── Ring 3: Diamond (mBox) ──────────────────────────────
    stroke("navy");
    fill("rgba(80, 120, 255, 0.35)");
    ring({ shape: demoDiamond, n: 8, r1: 190, r2: 260 });

    // ── Ring 4: Large Box (mBox full span) ──────────────────
    stroke("purple");
    fill("rgba(200, 80, 200, 0.25)");
    ring({ shape: demoBox, n: 6, r1: 270, r2: 350 });

    // ── Ring 5: Gear Tooth (repeated) ──────────────────────
    stroke(0);
    fill("rgba(255, 200, 0, 0.3)");
    ring({ shape: demoGeatTooth, n: 12, r1: 360, r2: 430 });

    // ── Center dot ──────────────────────────────────────────
    stroke("darkred");
    fill("darkred");
    circle(0, 0, 30);
}
