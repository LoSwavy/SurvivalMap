<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#14160f" />
<meta name="format-detection" content="telephone=no" />
<title>Field Map — TTRPG Battle Board</title>
<link rel="stylesheet" href="styles.css" />
</head>
<body>

<!-- ===================== TOP TOOLBAR ===================== -->
<header class="toolbar" id="toolbar">
  <div class="tb-inner">

    <div class="tb-brand">
      <span class="tb-title">FIELD MAP</span>
      <span class="tb-sub">Battle Board</span>
    </div>

    <!-- Add objects -->
    <div class="tb-group">
      <span class="tb-label">Add</span>
      <div class="tb-row">
        <button class="btn small" id="add-player-btn">+ Player</button>
        <div class="menu-wrap">
          <button class="btn small" id="add-enemy-btn">+ Enemy ▾</button>
          <div class="dropdown" id="enemy-menu" hidden></div>
        </div>
      </div>
    </div>

    <!-- Shapes -->
    <div class="tb-group">
      <span class="tb-label">Overlay</span>
      <div class="tb-row">
        <button class="btn small shape-btn" data-shape="cone">Cone</button>
        <button class="btn small shape-btn" data-shape="sphere">Sphere</button>
        <button class="btn small shape-btn" data-shape="cube">Cube</button>
        <button class="btn small shape-btn" data-shape="line">Line</button>
        <input type="color" id="next-shape-color" class="color-swatch" value="#b06a3a" title="Color for next overlay" />
      </div>
    </div>

    <!-- Background -->
    <div class="tb-group">
      <span class="tb-label">Background</span>
      <div class="tb-row">
        <button class="btn small ghost" id="upload-bg-btn">Upload Map</button>
        <button class="btn small ghost" id="clear-bg-btn">Clear</button>
      </div>
    </div>

    <!-- Grid -->
    <div class="tb-group grid-group">
      <span class="tb-label">Grid</span>
      <div class="tb-row grid-controls">
        <label class="mini-field">
          <span>Size</span>
          <input type="number" id="grid-size" min="8" max="400" step="1" value="60" />
        </label>
        <label class="mini-field">
          <span>X off</span>
          <input type="number" id="grid-offx" min="-400" max="400" step="1" value="0" />
        </label>
        <label class="mini-field">
          <span>Y off</span>
          <input type="number" id="grid-offy" min="-400" max="400" step="1" value="0" />
        </label>
        <input type="color" id="grid-color" class="color-swatch" value="#a7bd6e" title="Grid color" />
        <button class="toggle-btn active" id="grid-toggle" title="Show / hide grid">Grid</button>
        <button class="toggle-btn active" id="snap-toggle" title="Snap pieces to grid">Snap</button>
      </div>
    </div>

    <!-- View -->
    <div class="tb-group">
      <span class="tb-label">View</span>
      <div class="tb-row">
        <button class="btn small ghost zoom-btn" id="zoom-out">−</button>
        <button class="btn small ghost zoom-btn" id="zoom-in">+</button>
        <button class="btn small ghost" id="zoom-fit">Fit</button>
        <button class="btn small ghost" id="toggle-objects" title="Objects list">Objects</button>
      </div>
    </div>

    <!-- Data -->
    <div class="tb-group">
      <span class="tb-label">Data</span>
      <div class="tb-row">
        <button class="btn small ghost" id="export-btn">Export</button>
        <button class="btn small ghost" id="import-btn">Import</button>
        <button class="btn small danger-ghost" id="reset-btn">Reset</button>
      </div>
    </div>

    <button class="tb-collapse" id="tb-collapse" title="Hide toolbar">▲</button>

  </div>
</header>

<button class="toolbar-reopen" id="toolbar-reopen" title="Show toolbar" hidden>≡ Menu</button>

<!-- ===================== TAB STRIP ===================== -->
<div class="tab-strip" id="tab-strip"></div>

<!-- ===================== STAGE (board + enemy sidebar) ===================== -->
<div class="stage" id="stage">

<!-- ===================== BOARD ===================== -->
<div class="board" id="board">
  <div class="world" id="world">
    <img class="bg-image" id="bg-image" alt="" hidden />
    <svg class="grid-layer" id="grid-layer" xmlns="http://www.w3.org/2000/svg"></svg>
    <svg class="shape-layer" id="shape-layer" xmlns="http://www.w3.org/2000/svg"></svg>
    <div class="token-layer" id="token-layer"></div>
  </div>

  <div class="board-hint" id="board-hint">
    Upload a map, then add pieces &amp; overlays.<br />
    Drag empty space to pan · scroll / pinch to zoom · drag a piece to move it.
  </div>
</div>

<!-- ===================== ENEMY SIDEBAR ===================== -->
<aside class="enemy-sidebar" id="enemy-sidebar">
  <div class="es-head">
    <h3>Enemies</h3>
    <button class="es-collapse" id="es-collapse" title="Collapse sidebar">⟩</button>
  </div>
  <div class="es-amount">
    <span class="es-amount-lbl">Amount</span>
    <button class="amt-btn" id="amt-dec">−</button>
    <input type="number" id="es-amount" value="1" min="1" />
    <button class="amt-btn" id="amt-inc">+</button>
  </div>
  <div class="enemy-list" id="enemy-list"></div>
</aside>

</div><!-- /stage -->

<button class="sidebar-reopen" id="sidebar-reopen" hidden>‹ Enemies</button>

<!-- ===================== OBJECTS PANEL ===================== -->
<aside class="objects-panel" id="objects-panel" hidden>
  <div class="op-head">
    <h3>Objects</h3>
    <button class="modal-close" id="objects-close">✕</button>
  </div>
  <div class="op-section">
    <h4>Pieces</h4>
    <div class="op-list" id="op-pieces"></div>
  </div>
  <div class="op-section">
    <h4>Overlays</h4>
    <div class="op-list" id="op-shapes"></div>
  </div>
</aside>

<!-- ===================== SELECTION EDITOR ===================== -->
<aside class="editor" id="editor" hidden>
  <div class="ed-head">
    <h3 id="ed-title">Edit</h3>
    <button class="modal-close" id="ed-close">✕</button>
  </div>
  <div class="ed-body" id="ed-body"></div>
  <div class="ed-foot">
    <button class="btn danger-ghost small" id="ed-delete">Delete</button>
  </div>
</aside>

<!-- hidden inputs -->
<input type="file" id="bg-file" accept="image/*" hidden />
<input type="file" id="piece-file" accept="image/*" hidden />
<input type="file" id="import-file" accept="application/json" hidden />

<div class="toast" id="toast" hidden></div>

<script src="script.js"></script>
</body>
</html>
