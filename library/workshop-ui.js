// ============================================================
// workshop-ui.js — Workshop toolbar and debug controls
// ============================================================

class WorkshopSketchUI {
    constructor({ debugStorageKey = 'mandalasWorkshop.debugDraw' } = {}) {
        this.debugStorageKey = debugStorageKey;
        this.debugDraw = this._loadDebugDraw();
        this.canvasContainer = null;
        this.toolbar = null;
        this.debugToggleButton = null;
        this.exportButton = null;
        this.canvas = null;
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

        this.exportButton = createButton('Export PNG');
        this.exportButton.parent(this.toolbar);
        this.exportButton.mousePressed(() => this.exportPng());

        this._styleToolbarButton(this.debugToggleButton);
        this._styleToolbarButton(this.exportButton);
        this._updateDebugToggleLabel();

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

    exportPng(filename = 'mandala') {
        saveCanvas(filename, 'png');
    }

    _loadDebugDraw() {
        return localStorage.getItem(this.debugStorageKey) === 'true';
    }

    _saveDebugDraw() {
        localStorage.setItem(this.debugStorageKey, String(this.debugDraw));
    }

    _updateDebugToggleLabel() {
        if (!this.debugToggleButton) return;
        this.debugToggleButton.html(this.debugDraw ? 'Disable Debug Draw' : 'Enable Debug Draw');
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