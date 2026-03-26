// ============================================================
// workshop-ui.js — Workshop toolbar and debug controls
// ============================================================

class WorkshopSketchUI {
    constructor({
        debugStorageKey = 'mandalasWorkshop.debugDraw',
        gridStorageKey = 'mandalasWorkshop.showMotifGrid'
    } = {}) {
        this.debugStorageKey = debugStorageKey;
        this.gridStorageKey = gridStorageKey;
        this.debugDraw = this._loadDebugDraw();
        this.showMotifGrid = this._loadShowMotifGrid();
        this.canvasContainer = null;
        this.toolbar = null;
        this.debugToggleButton = null;
        this.gridToggleButton = null;
        this.exportButton = null;
        this.canvas = null;

        // Wrap window.setup so our shims are installed after p5 fully initialises
        // its globals (which happens just before p5 calls setup()).
        // Function declarations in sketch.js are hoisted, so window.setup already
        // points to the user's function by the time this constructor runs.
        const ui = this;
        const userSetup = window.setup;
        window.setup = function () {
            // ── background shim ──────────────────────────────────────────
            // Intercept every background() call to remember the last arguments
            // so showMotif() can replay the same background colour.
            const origBackground = window.background;
            window.__mandalaLastBackgroundArgs = [0];
            window.background = function (...args) {
                if (args.length > 0) window.__mandalaLastBackgroundArgs = args;
                return origBackground.apply(this, args);
            };

            // ── createCanvas shim ────────────────────────────────────────
            // One-shot: auto-call attachCanvas() and restore the original.
            const origCreateCanvas = window.createCanvas;
            window.createCanvas = function (...args) {
                window.createCanvas = origCreateCanvas;         // restore first
                const canvas = origCreateCanvas.apply(this, args);
                ui.attachCanvas(canvas);
                return canvas;
            };

            if (typeof globalThis.setShowMotifGridVisible === 'function') {
                globalThis.setShowMotifGridVisible(ui.showMotifGrid);
            }

            if (userSetup) userSetup.call(this);
        };
    }

    attachCanvas(canvas) {
        this.canvas = canvas;
        this.canvasContainer = createDiv();
        this.canvasContainer.style('display', 'flex');
        this.canvasContainer.style('flex-direction', 'column');
        this.canvasContainer.style('align-items', 'center');
        this.canvasContainer.style('gap', '12px');

        this.toolbar = createDiv();
        this.toolbar.parent(this.canvasContainer);
        this.toolbar.style('display', 'flex');
        this.toolbar.style('justify-content', 'center');
        this.toolbar.style('align-items', 'center');
        this.toolbar.style('gap', '12px');
        this.toolbar.style('width', '100%');

        this.debugToggleButton = createButton('');
        this.debugToggleButton.parent(this.toolbar);
        this.debugToggleButton.mousePressed(() => this.toggleDebugDraw());

        this.gridToggleButton = createButton('');
        this.gridToggleButton.parent(this.toolbar);
        this.gridToggleButton.mousePressed(() => this.toggleShowMotifGrid());

        this.exportButton = createButton('Export PNG');
        this.exportButton.parent(this.toolbar);
        this.exportButton.mousePressed(() => this.exportPng());

        this._styleToolbarButton(this.debugToggleButton);
        this._styleToolbarButton(this.gridToggleButton);
        this._styleToolbarButton(this.exportButton);
        this._updateDebugToggleLabel();
        this._updateGridToggleLabel();

        this.canvas.parent(this.canvasContainer);
        return this.canvas;
    }

    isDebugDrawEnabled() {
        return this.debugDraw;
    }

    toggleDebugDraw() {
        this.debugDraw = !this.debugDraw;
        this._saveDebugDraw();
        this._updateDebugToggleLabel();
    }

    isShowMotifGridEnabled() {
        return this.showMotifGrid;
    }

    toggleShowMotifGrid() {
        this.showMotifGrid = !this.showMotifGrid;
        this._saveShowMotifGrid();
        if (typeof globalThis.setShowMotifGridVisible === 'function') {
            globalThis.setShowMotifGridVisible(this.showMotifGrid);
        }
        this._updateGridToggleLabel();
    }

    exportPng(filename = 'mandala') {
        saveCanvas(filename, 'png');
    }

    _loadDebugDraw() {
        return localStorage.getItem(this.debugStorageKey) === 'true';
    }

    _saveDebugDraw() {
        localStorage.setItem(this.debugStorageKey, String(this.debugDraw));
    }

    _loadShowMotifGrid() {
        const raw = localStorage.getItem(this.gridStorageKey);
        return raw === null ? true : raw === 'true';
    }

    _saveShowMotifGrid() {
        localStorage.setItem(this.gridStorageKey, String(this.showMotifGrid));
    }

    _updateDebugToggleLabel() {
        if (!this.debugToggleButton) return;
        this.debugToggleButton.html(this.debugDraw ? 'Disable Debug Draw' : 'Enable Debug Draw');
    }

    _updateGridToggleLabel() {
        if (!this.gridToggleButton) return;
        this.gridToggleButton.html(this.showMotifGrid ? 'Hide Grid' : 'Show Grid');
    }

    _styleToolbarButton(button) {
        button.style('appearance', 'none');
        button.style('border', '1px solid #7a8f86');
        button.style('background', '#f7faf8');
        button.style('color', '#1f2a26');
        button.style('padding', '0.55rem 0.9rem');
        button.style('border-radius', '999px');
        button.style('font-size', '14px');
        button.style('font-family', 'system-ui, sans-serif');
        button.style('cursor', 'pointer');
    }
}

globalThis.WorkshopSketchUI = WorkshopSketchUI;