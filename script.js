/* =========================================================
   FIELD MAP — TTRPG BATTLE BOARD
   Sparse, table-ready map tool. Independent project.

   Concept:
   - Multiple map TABS, each a self-contained board with its
     own background, grid, view, AoE overlays and pieces. Set
     up the next floor in a second tab and switch when ready.
   - Pieces are tagged Player or Enemy. Enemies carry presets
     (the bestiary below); every object keeps its own color so
     you can track molotovs vs spores, runners vs clickers, etc.
   - A collapsible Enemies sidebar lists every enemy on the
     active map: damage, heal and hide/show each one.
   - Everything persists to localStorage and exports as JSON.
   ========================================================= */

(() => {
  "use strict";

  /* ---------------------------------------------------------
     PRESETS — bestiary. Each entry pre-fills a token's name,
     a default color, and a quick stat readout shown in the
     editor. Edit freely: add/remove entries or tweak colors.
     --------------------------------------------------------- */
  const PRESETS = {
    player: [
      { id: "player",   name: "Player",    color: "#6f93a6", stats: "" },
    ],
    enemy: {
      Infected: [
        {
          id: "runner", name: "Runner", color: "#8fae4d",
          stats:
`RUNNER — Fodder · fast, sighted, no tactics
HP 14 · AC 11 · 35 ft · +4 · 50%=7 · 75%=11
Claw — melee, +4, 1d4+2 (~4), Medium
Shriek (1/enc): Very Loud, draws nearby infected
Shiv/chokeout if Unaware`
        },
        {
          id: "stalker", name: "Stalker", color: "#6f8a3f",
          stats:
`STALKER — Fodder (special) · ambush predator
HP 20 · AC 12 · 30 ft · +4/+5 · 50%=10 · 75%=15
Claw — melee, +4, 1d4+2 (~4), Medium
Flurry (recharge 1/3 rds): two claws same target, +4 each, 1d4+1 each (~7 total)
Slink (bonus): half-speed move toward cover, no opportunity attacks
Melt Away (reaction): when hurt but not dropped, 5 ft into cover
Patient Hunter: first strike from Hidden/Unaware has Advantage`
        },
        {
          id: "clicker", name: "Clicker", color: "#c9b27a",
          stats:
`CLICKER — Fodder (heavy) · blind, armored, lethal in a grab
HP 28 · AC 13 · 30 ft · +5 · 50%=14 · 75%=21
Blind — targets loudest sound; Disadvantage vs Quiet
Grab — melee, +5, 1d4+2 (~4), grapple escape DC 13
Lethal Bite (grappled only): DC 13 CON save or Downed; on success 2d4+2 (~7)
Echolocation Pulse (every other round): clicks; any sound within 15 ft is heard, even Silent (Stealth vs Perception +4). Loud.
Fungal Armor · can't be choked`
        },
        {
          id: "bloater", name: "Bloater", color: "#7c7a3a",
          stats:
`BLOATER — Fodder (heavy) · slow wall, devastating up close
HP 50 · AC 12 · 25 ft (no Dash) · +6 · 50%=25 · 75%=38
Smash — melee, +6, 2d4+4 (~9), Loud
Crushing Charge (recharge 5–6): straight-line full move + attack, +6, 2d4+6 (~11), DC 14 STR or prone
Spore Sac (recharge 5–6, 30 ft): DC 14 DEX, 2d4 (~5), leaves a 10-ft spore cloud
Fungal Armor · immune to shove/grapple/prone/choke`
        },
      ],
      Humans: [
        {
          id: "scavenger", name: "Scavenger", color: "#9c7b4f",
          stats:
`SCAVENGER — Fodder · desperate, breaks easily
HP 11 · AC 12 (14 cover) · 30 ft · +3 · 50%=6 · 75%=9
Pipe — melee, +3, 1d4+1 (~3.5), Medium
Pocket Pistol — ranged 40 ft, +3, 1d6+1 (~4.5), Very Loud
Out of Their Depth: after firing, d6 — on 1–2 they're out of bullets
Will Talk: surrenders/flees at half HP, on seeing an ally drop, or when Intimidated`
        },
        {
          id: "raider", name: "Raider", color: "#b06a3a",
          stats:
`RAIDER — Fodder · the cover-fighter baseline
HP 14 · AC 13 (15 cover) · 30 ft · +4 · 50%=7 · 75%=11
Pistol — ranged 50 ft, +4, 1d6+2 (~5.5), Very Loud
Knife — melee, +3, 1d4+1 (~3.5), Medium
Take Cover (bonus): reach cover, keeps AC even vs flankers until next turn
Suppressed Instinct (reaction): Dodge to cover when shot at from range`
        },
        {
          id: "marksman", name: "Marksman", color: "#c08a3a",
          stats:
`MARKSMAN — Fodder · punishes the open
HP 13 · AC 12 (14 cover) · 30 ft · +5 · 50%=7 · 75%=10
Hunting Rifle — ranged 120 ft, +5, 1d8+3 (~7.5), Very Loud
Knife — melee, +2, 1d4+1 (~3.5), Medium
Steady (bonus, if it didn't move): next rifle shot ignores light cover
Pick the Exposed: always targets the least-covered PC
Glass: only 13 HP, poor in melee — close the distance`
        },
        {
          id: "brute", name: "Brute", color: "#a8552f",
          stats:
`BRUTE — Fodder (heavy) · the human wall
HP 30 · AC 13 · 30 ft · +5 · 50%=15 · 75%=23
Sledge — melee, +5, 2d4+3 (~8), Loud, DC 13 STR or pushed 5 ft
Haymaker (recharge 5–6): +5, 2d4+5 (~10), DC 13 STR or prone
Grab (bonus): grapple after a hit (Athletics +5)
Shrug It Off (1/enc, reaction): reduce a Massive-Injury hit by 1d6+3
Immune to Frightened · can be shoved/choked but usually wins`
        },
        {
          id: "lieutenant", name: "Lieutenant", color: "#b8483a",
          stats:
`LIEUTENANT — Fodder (elite) · the squad's brain, kill first
HP 22 · AC 14 (16 cover) · 30 ft · +6 · 50%=11 · 75%=17
Rifle — ranged 100 ft, +6, 1d6+3 (~6.5), Very Loud
Sidearm — ranged 40 ft, +6, 1d6+2 (~5.5), Very Loud
Focus Fire (bonus): allies get Advantage vs one target until its next turn
Bark Orders (reaction, 1/round): a hit ally may Take Cover/Dodge
Veteran Nerve: Advantage vs Suppression/Frightened
Cohesion: squad ignores morale while it lives; its death triggers a morale check`
        },
      ],
    },
  };
  const CUSTOM_ENEMY = { id: "custom", name: "Enemy", color: "#b8483a", stats: "" };

  function findPreset(id) {
    if (id === "player") return PRESETS.player[0];
    if (id === "custom") return CUSTOM_ENEMY;
    for (const group of Object.values(PRESETS.enemy)) {
      const hit = group.find(p => p.id === id);
      if (hit) return hit;
    }
    return null;
  }
  function hpFromStats(stats) {
    if (!stats) return 0;
    const m = stats.match(/HP\s+(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  /* ---------------------------------------------------------
     STATE  — top level holds many maps (tabs)
     --------------------------------------------------------- */
  const FEET_PER_CELL = 5; // standard 5-ft squares; shapes are sized in feet
  const STORE_KEY = "fieldmap.v2";

  const state = {
    maps: [],          // [{id,name,bg,worldW,worldH,grid,view,pieces,shapes,selected}]
    activeMapId: null,
    seq: 1,
    enemiesOpen: true,
    editorOpen: false,   // info panel stays closed until you open it
    toolbarOpen: true,
    visionShow: true,
    // draw-mode runtime (not persisted)
    drawMode: false,
    drawTool: "line",
    selectedWall: null,
  };
  const blindPreset = id => id === "clicker" || id === "bloater";
  const defaultVision = presetId => ({ on: !blindPreset(presetId), range: 30, angle: 90, dir: 0 });
  const nextId = () => "o" + (state.seq++) + "_" + Math.random().toString(36).slice(2, 6);
  const cur = () => state.maps.find(m => m.id === state.activeMapId) || state.maps[0];

  function newMap(name) {
    return {
      id: nextId(),
      name: name || ("Map " + (state.maps.length + 1)),
      bg: null, worldW: 3000, worldH: 2000,
      grid: { size: 60, offX: 0, offY: 0, color: "#a7bd6e", show: true, snap: true },
      view: { tx: 60, ty: 60, scale: 1 },
      pieces: [], shapes: [], selected: null,
    };
  }

  /* ---------------------------------------------------------
     DOM
     --------------------------------------------------------- */
  const $ = sel => document.querySelector(sel);
  const board       = $("#board");
  const world       = $("#world");
  const bgImage     = $("#bg-image");
  const gridLayer   = $("#grid-layer");
  const visionLayer = $("#vision-layer");
  const shapeLayer  = $("#shape-layer");
  const wallLayer   = $("#wall-layer");
  const tokenLayer  = $("#token-layer");
  const drawBar     = $("#draw-bar");
  const boardHint   = $("#board-hint");
  const enemiesPanel = $("#enemies-panel");
  const editorPanel = $("#editor-panel");
  const edTitle     = $("#ed-title");
  const edBody      = $("#ed-body");
  const edDelete    = $("#ed-delete");
  const objectsPanel = $("#objects-panel");
  const enemyMenu   = $("#enemy-menu");
  const tabStrip    = $("#tab-strip");
  const enemyList   = $("#enemy-list");
  const toolbar     = $("#toolbar");
  const toolbarReopen = $("#toolbar-reopen");
  const toastEl     = $("#toast");

  /* ---------------------------------------------------------
     PERSISTENCE  (+ migration from v1 single-board format)
     --------------------------------------------------------- */
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify({
          maps: state.maps, activeMapId: state.activeMapId, seq: state.seq,
          enemiesOpen: state.enemiesOpen, editorOpen: state.editorOpen,
          toolbarOpen: state.toolbarOpen, visionShow: state.visionShow,
        }));
      } catch (e) {
        toast("Couldn't save — map image may be too large for storage.", true);
      }
    }, 250);
  }
  function normPiece(p) {
    let hpMax = p.hpMax;
    if (hpMax == null) hpMax = parseInt(p.hp, 10) || 0;
    let hp = (p.hp == null || typeof p.hp === "string") ? (parseInt(p.hp, 10)) : p.hp;
    if (isNaN(hp)) hp = hpMax;
    const vision = p.vision
      ? { on: p.vision.on !== false, range: p.vision.range ?? 30, angle: p.vision.angle ?? 90, dir: p.vision.dir ?? 0 }
      : (p.tag === "enemy" ? defaultVision(p.presetId) : null);
    return {
      id: p.id, tag: p.tag, presetId: p.presetId, name: p.name,
      color: p.color, img: p.img || null,
      hp, hpMax, hidden: !!p.hidden, vision, x: p.x, y: p.y,
    };
  }
  function normMap(m) {
    return {
      id: m.id || nextId(),
      name: m.name || "Map",
      bg: m.bg ?? null,
      worldW: m.worldW || 3000, worldH: m.worldH || 2000,
      grid: { size: 60, offX: 0, offY: 0, color: "#a7bd6e", show: true, snap: true, ...(m.grid || {}) },
      view: { tx: 60, ty: 60, scale: 1, ...(m.view || {}) },
      pieces: (m.pieces || []).map(normPiece),
      shapes: m.shapes || [],
      walls: m.walls || [],
      selected: null,
    };
  }
  function adopt(d) {
    if (d && Array.isArray(d.maps) && d.maps.length) {
      state.maps = d.maps.map(normMap);
      state.activeMapId = d.activeMapId && state.maps.some(m => m.id === d.activeMapId)
        ? d.activeMapId : state.maps[0].id;
      state.seq = d.seq || 1;
      state.enemiesOpen = d.enemiesOpen !== false;
      state.editorOpen = d.editorOpen === true;
      state.toolbarOpen = d.toolbarOpen !== false;
      state.visionShow = d.visionShow !== false;
    } else {
      // v1 single-board (or fresh) → wrap into one map
      const m = normMap({
        id: "m1", name: "Map 1",
        bg: d?.bg ?? null, worldW: d?.worldW, worldH: d?.worldH,
        grid: d?.grid, view: d?.view, pieces: d?.pieces, shapes: d?.shapes,
      });
      state.maps = [m];
      state.activeMapId = m.id;
      state.seq = d?.seq || 1;
      state.enemiesOpen = true;
      state.editorOpen = false;
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem("fieldmap.v1");
      if (raw) adopt(JSON.parse(raw));
    } catch (e) { /* ignore corrupt store */ }
  }

  /* ---------------------------------------------------------
     COORDINATE HELPERS
     --------------------------------------------------------- */
  function screenToWorld(sx, sy) {
    const v = cur().view, r = board.getBoundingClientRect();
    return { x: (sx - r.left - v.tx) / v.scale, y: (sy - r.top - v.ty) / v.scale };
  }
  function snapPoint(x, y) {
    const g = cur().grid;
    if (!g.snap) return { x, y };
    const col = Math.round((x - g.offX) / g.size - 0.5);
    const row = Math.round((y - g.offY) / g.size - 0.5);
    return { x: g.offX + (col + 0.5) * g.size, y: g.offY + (row + 0.5) * g.size };
  }
  const feetToPx = ft => (ft / FEET_PER_CELL) * cur().grid.size;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  /* ---------------------------------------------------------
     RENDER
     --------------------------------------------------------- */
  function applyView() {
    const v = cur().view;
    world.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.scale})`;
  }

  function renderBg() {
    const m = cur();
    if (m.bg) {
      bgImage.src = m.bg; bgImage.hidden = false; boardHint.hidden = true;
    } else {
      bgImage.removeAttribute("src"); bgImage.hidden = true;
      boardHint.hidden = !!(m.pieces.length || m.shapes.length);
    }
    world.style.width = m.worldW + "px";
    world.style.height = m.worldH + "px";
  }

  function renderGrid() {
    const m = cur(), g = m.grid;
    gridLayer.setAttribute("width", m.worldW);
    gridLayer.setAttribute("height", m.worldH);
    gridLayer.style.display = g.show ? "block" : "none";
    if (!g.show) return;
    gridLayer.innerHTML =
      `<defs>
        <pattern id="gridpat" width="${g.size}" height="${g.size}"
                 patternUnits="userSpaceOnUse"
                 patternTransform="translate(${g.offX},${g.offY})">
          <path d="M ${g.size} 0 L 0 0 0 ${g.size}" fill="none"
                stroke="${g.color}" stroke-width="1" opacity="0.55"/>
        </pattern>
      </defs>
      <rect width="${m.worldW}" height="${m.worldH}" fill="url(#gridpat)"/>`;
  }

  function shapeGeometry(s) {
    const c = s.color;
    const common = `fill="${c}" fill-opacity="0.28" stroke="${c}" stroke-width="2.5" stroke-opacity="0.95"`;
    if (s.type === "sphere") {
      const r = feetToPx(s.size) / 2;
      return `<circle cx="${s.x}" cy="${s.y}" r="${r}" ${common}/>`;
    }
    if (s.type === "cube") {
      const side = feetToPx(s.size);
      return `<rect x="${-side/2}" y="${-side/2}" width="${side}" height="${side}" ${common}
               transform="translate(${s.x},${s.y}) rotate(${s.rot})"/>`;
    }
    if (s.type === "line") {
      const len = feetToPx(s.size), w = feetToPx(s.width || 5);
      return `<rect x="0" y="${-w/2}" width="${len}" height="${w}" ${common}
               transform="translate(${s.x},${s.y}) rotate(${s.rot})"/>`;
    }
    // cone: 5e style, length == width at the far end
    const L = feetToPx(s.size), half = L / 2;
    return `<polygon points="0,0 ${L},${-half} ${L},${half}" ${common}
             transform="translate(${s.x},${s.y}) rotate(${s.rot})"/>`;
  }

  function renderShapes() {
    const m = cur();
    shapeLayer.setAttribute("width", m.worldW);
    shapeLayer.setAttribute("height", m.worldH);
    let svg = "";
    for (const s of m.shapes) {
      svg += `<g data-shape-id="${s.id}" style="pointer-events:auto;cursor:grab;">${shapeGeometry(s)}</g>`;
    }
    shapeLayer.innerHTML = svg;
    if (m.selected && m.selected.kind === "shape") {
      const g = shapeLayer.querySelector(`[data-shape-id="${m.selected.id}"] > *`);
      if (g) { g.setAttribute("stroke-width", "4"); g.setAttribute("fill-opacity", "0.38"); }
    }
    renderShapeLabels();
  }

  function renderShapeLabels() {
    tokenLayer.querySelectorAll(".shape-tag").forEach(n => n.remove());
    for (const s of cur().shapes) {
      if (!s.label) continue;
      const el = document.createElement("div");
      el.className = "shape-tag";
      el.textContent = s.label;
      el.style.left = s.x + "px";
      el.style.top = s.y + "px";
      el.style.color = s.color;
      el.style.borderColor = s.color;
      tokenLayer.appendChild(el);
    }
  }

  function renderTokens() {
    const m = cur();
    tokenLayer.querySelectorAll(".token").forEach(n => n.remove());
    const size = Math.max(20, m.grid.size);
    for (const p of m.pieces) {
      if (p.hidden) continue; // hidden pieces live only in the sidebar
      const down = p.hpMax > 0 && p.hp <= 0;
      const el = document.createElement("div");
      el.className = "token " + p.tag + (isSelected("piece", p.id) ? " selected" : "") + (down ? " downed" : "");
      el.dataset.pieceId = p.id;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = (p.x - size / 2) + "px";
      el.style.top = (p.y - size / 2) + "px";
      el.style.borderColor = down ? "#8c8c84" : p.color;
      if (p.img) {
        el.style.backgroundImage = `url(${p.img})`;
      } else {
        const initial = (p.name || "?").trim().charAt(0).toUpperCase() || "?";
        el.innerHTML = `<span class="tk-initial" style="font-size:${size*0.5}px">${initial}</span>`;
      }
      if (p.name) {
        const lbl = document.createElement("span");
        lbl.className = "tk-label";
        lbl.textContent = p.name;
        el.appendChild(lbl);
      }
      if (p.hpMax > 0 && !down) {
        const hp = document.createElement("span");
        hp.className = "tk-hp";
        hp.textContent = `${p.hp}/${p.hpMax}`;
        el.appendChild(hp);
      }
      tokenLayer.appendChild(el);
    }
  }

  function isSelected(kind, id) {
    const m = cur();
    return m.selected && m.selected.kind === kind && m.selected.id === id;
  }

  function renderAll() {
    renderBg(); renderGrid(); renderVision(); renderShapes(); renderWalls(); renderTokens();
    applyView(); renderObjects(); renderSidebar();
  }

  /* ---------------------------------------------------------
     WALLS — geometry. Each wall reduces to line segments that
     block line of sight. Only shown while in Draw mode.
     --------------------------------------------------------- */
  function wallToSegments(w) {
    if (w.type === "seg") return [[w.x1, w.y1, w.x2, w.y2]];
    if (w.type === "rect") {
      const hw = w.w / 2, hh = w.h / 2, a = (w.rot || 0) * Math.PI / 180;
      const ca = Math.cos(a), sa = Math.sin(a);
      const corner = (dx, dy) => [w.x + dx * ca - dy * sa, w.y + dx * sa + dy * ca];
      const c = [corner(-hw, -hh), corner(hw, -hh), corner(hw, hh), corner(-hw, hh)];
      return [
        [c[0][0], c[0][1], c[1][0], c[1][1]],
        [c[1][0], c[1][1], c[2][0], c[2][1]],
        [c[2][0], c[2][1], c[3][0], c[3][1]],
        [c[3][0], c[3][1], c[0][0], c[0][1]],
      ];
    }
    if (w.type === "circle") {
      const segs = [], N = 24;
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * 2 * Math.PI, a1 = ((i + 1) / N) * 2 * Math.PI;
        segs.push([w.x + Math.cos(a0) * w.r, w.y + Math.sin(a0) * w.r,
                   w.x + Math.cos(a1) * w.r, w.y + Math.sin(a1) * w.r]);
      }
      return segs;
    }
    return [];
  }
  function mapSegments(m) {
    const out = [];
    for (const w of m.walls) for (const s of wallToSegments(w)) out.push(s);
    return out;
  }

  // nearest hit distance of a ray (origin px,py, unit dir dx,dy) against segments
  function rayHit(px, py, dx, dy, maxDist, segs) {
    let best = maxDist;
    for (const s of segs) {
      const x1 = s[0], y1 = s[1], x2 = s[2], y2 = s[3];
      const ex = x2 - x1, ey = y2 - y1;
      const denom = dx * ey - dy * ex;
      if (Math.abs(denom) < 1e-9) continue;
      const t = ((x1 - px) * ey - (y1 - py) * ex) / denom; // along ray
      const u = ((x1 - px) * dy - (y1 - py) * dx) / denom; // along segment
      if (t >= 0 && t <= best && u >= 0 && u <= 1) best = t;
    }
    return best;
  }

  // visibility polygon for an enemy's cone, occluded by walls
  function visionPolygon(p, segs) {
    const v = p.vision;
    const range = feetToPx(v.range);
    const half = v.angle / 2;
    const base = v.dir;
    const offsets = [];
    const coarse = Math.max(1.5, v.angle / 90); // arc smoothness
    for (let o = -half; o <= half; o += coarse) offsets.push(o);
    offsets.push(half);
    // aim extra rays just past each wall endpoint inside the cone for crisp shadows
    const norm = a => { a %= 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; };
    for (const s of segs) {
      for (const pt of [[s[0], s[1]], [s[2], s[3]]]) {
        const d = Math.hypot(pt[0] - p.x, pt[1] - p.y);
        if (d > range + 2) continue;
        const off = norm(Math.atan2(pt[1] - p.y, pt[0] - p.x) * 180 / Math.PI - base);
        if (Math.abs(off) <= half) { offsets.push(off - 0.35, off, off + 0.35); }
      }
    }
    offsets.sort((a, b) => a - b);
    const pts = [[p.x, p.y]];
    for (const off of offsets) {
      if (off < -half - 0.5 || off > half + 0.5) continue;
      const ang = (base + off) * Math.PI / 180;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const t = rayHit(p.x, p.y, dx, dy, range, segs);
      pts.push([p.x + dx * t, p.y + dy * t]);
    }
    return pts;
  }

  function renderVision() {
    const m = cur();
    visionLayer.setAttribute("width", m.worldW);
    visionLayer.setAttribute("height", m.worldH);
    if (!state.visionShow) { visionLayer.innerHTML = ""; return; }
    const segs = mapSegments(m);
    let svg = "";
    for (const p of m.pieces) {
      if (p.tag !== "enemy" || p.hidden || !p.vision || !p.vision.on) continue;
      if (p.hpMax > 0 && p.hp <= 0) continue; // the dead don't see
      const poly = visionPolygon(p, segs);
      const d = poly.map(pt => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(" ");
      svg += `<polygon points="${d}" fill="#f2e27a" fill-opacity="0.13" stroke="#f2e27a" stroke-opacity="0.22" stroke-width="1"/>`;
    }
    visionLayer.innerHTML = svg;
  }

  function renderWalls() {
    const m = cur();
    wallLayer.setAttribute("width", m.worldW);
    wallLayer.setAttribute("height", m.worldH);
    if (!state.drawMode) { wallLayer.innerHTML = ""; wallLayer.style.pointerEvents = "none"; return; }
    wallLayer.style.pointerEvents = state.drawTool === "select" ? "auto" : "none";
    let svg = `<rect width="${m.worldW}" height="${m.worldH}" fill="rgba(20,30,45,0.18)"/>`;
    for (const w of m.walls) {
      const sel = state.selectedWall === w.id;
      const stroke = sel ? "#7fd0ff" : "#bcd2e6";
      const sw = sel ? 5 : 3.5;
      for (const s of wallToSegments(w)) {
        svg += `<line x1="${s[0]}" y1="${s[1]}" x2="${s[2]}" y2="${s[3]}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" data-wall-id="${w.id}"/>`;
      }
    }
    if (drawPreview) svg += drawPreview;
    wallLayer.innerHTML = svg;
  }

  /* ---------------------------------------------------------
     DRAW MODE — walls editor (tools, undo/redo, eraser)
     --------------------------------------------------------- */
  let drawPreview = "";                 // SVG string for the in-progress shape
  const histStore = {};                 // mapId -> {past:[], future:[]} (session only)
  const hist = id => (histStore[id] || (histStore[id] = { past: [], future: [] }));
  function snapshot() {
    const m = cur(), h = hist(m.id);
    h.past.push(JSON.stringify(m.walls));
    if (h.past.length > 60) h.past.shift();
    h.future.length = 0;
    updateUndoRedo();
  }
  function undo() {
    const m = cur(), h = hist(m.id);
    if (!h.past.length) return;
    h.future.push(JSON.stringify(m.walls));
    m.walls = JSON.parse(h.past.pop());
    state.selectedWall = null;
    renderWalls(); renderVision(); updateWallEditUI(); updateUndoRedo(); save();
  }
  function redo() {
    const m = cur(), h = hist(m.id);
    if (!h.future.length) return;
    h.past.push(JSON.stringify(m.walls));
    m.walls = JSON.parse(h.future.pop());
    state.selectedWall = null;
    renderWalls(); renderVision(); updateWallEditUI(); updateUndoRedo(); save();
  }
  function updateUndoRedo() {
    const h = hist(cur().id);
    $("#wall-undo").disabled = !h.past.length;
    $("#wall-redo").disabled = !h.future.length;
  }
  function setDrawMode(on) {
    state.drawMode = on;
    state.selectedWall = null;
    drawBar.hidden = !on;
    board.classList.toggle("draw-mode", on);
    $("#draw-walls-btn").classList.toggle("active", on);
    if (on) deselect();
    updateWallEditUI(); updateUndoRedo();
    renderWalls(); renderTokens();
  }
  function setDrawTool(tool) {
    state.drawTool = tool;
    state.selectedWall = null;
    drawBar.querySelectorAll(".draw-tool").forEach(b => b.classList.toggle("active", b.dataset.tool === tool));
    updateWallEditUI();
    renderWalls();
  }
  function selectedWallObj() { return cur().walls.find(w => w.id === state.selectedWall) || null; }
  function updateWallEditUI() {
    const w = selectedWallObj();
    const canRotate = w && (w.type === "rect" || w.type === "seg");
    $("#wall-rot-wrap").hidden = !canRotate;
    $("#wall-delete").hidden = !w;
    if (canRotate) $("#wall-rot").value = wallRotation(w);
  }
  function wallRotation(w) {
    if (w.type === "rect") return w.rot || 0;
    if (w.type === "seg") { let a = Math.atan2(w.y2 - w.y1, w.x2 - w.x1) * 180 / Math.PI; return ((a % 360) + 360) % 360; }
    return 0;
  }
  function rotateWall(w, deg) {
    if (w.type === "rect") { w.rot = deg; }
    else if (w.type === "seg") {
      const cx = (w.x1 + w.x2) / 2, cy = (w.y1 + w.y2) / 2;
      const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1) / 2;
      const a = deg * Math.PI / 180, ca = Math.cos(a) * len, sa = Math.sin(a) * len;
      w.x1 = cx - ca; w.y1 = cy - sa; w.x2 = cx + ca; w.y2 = cy + sa;
    }
  }
  function eraseAt(wx, wy) {
    const m = cur(), tol = Math.max(8, m.grid.size * 0.25);
    const before = m.walls.length;
    m.walls = m.walls.filter(w => !wallToSegments(w).some(s => pointSegDist(wx, wy, s) <= tol));
    return m.walls.length !== before;
  }
  function pointSegDist(px, py, s) {
    const x1 = s[0], y1 = s[1], x2 = s[2], y2 = s[3];
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
    let t = L2 ? ((px - x1) * dx + (py - y1) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function wallHitAt(wx, wy) {
    const tol = 10;
    for (let i = cur().walls.length - 1; i >= 0; i--) {
      const w = cur().walls[i];
      if (wallToSegments(w).some(s => pointSegDist(wx, wy, s) <= tol)) return w;
    }
    return null;
  }

  /* ---------------------------------------------------------
     ADD OBJECTS
     --------------------------------------------------------- */
  function centerWorld() {
    const r = board.getBoundingClientRect();
    return screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
  }

  function addPiece(tag, presetId) {
    const m = cur();
    const preset = findPreset(presetId) || (tag === "enemy" ? CUSTOM_ENEMY : PRESETS.player[0]);
    const c = centerWorld();
    const pos = snapPoint(c.x, c.y);
    const same = m.pieces.filter(p => p.presetId === presetId).length;
    const hpMax = hpFromStats(preset.stats);
    const piece = {
      id: nextId(), tag, presetId,
      name: preset.name + (same ? " " + (same + 1) : ""),
      color: preset.color, img: null,
      hp: hpMax, hpMax, hidden: false,
      vision: tag === "enemy" ? defaultVision(presetId) : null,
      x: pos.x, y: pos.y,
    };
    m.pieces.push(piece);
    select("piece", piece.id);
    renderAll(); save();
  }

  function addShape(type) {
    const m = cur();
    const c = centerWorld();
    const color = $("#next-shape-color").value;
    const defaults = { cone: 15, sphere: 20, cube: 15, line: 30 };
    const shape = {
      id: nextId(), type, color, label: "",
      x: c.x, y: c.y, rot: 0, size: defaults[type] || 15, width: 5,
    };
    m.shapes.push(shape);
    select("shape", shape.id);
    renderAll(); save();
  }

  /* ---------------------------------------------------------
     SELECTION + EDITOR
     --------------------------------------------------------- */
  function select(kind, id) {
    cur().selected = { kind, id };
    renderShapes(); renderTokens(); renderObjects(); renderSidebar(); openEditor();
  }
  function deselect() {
    cur().selected = null;
    renderShapes(); renderTokens(); renderObjects(); renderSidebar(); openEditor();
  }
  function getSelectedObj() {
    const m = cur();
    if (!m.selected) return null;
    const arr = m.selected.kind === "piece" ? m.pieces : m.shapes;
    return arr.find(o => o.id === m.selected.id) || null;
  }
  // Rebuilds the docked Info panel's contents for the current selection.
  // Does NOT pop the panel open — that's controlled by its header toggle.
  function openEditor() {
    const obj = getSelectedObj();
    if (!obj) {
      edTitle.textContent = "Info";
      edBody.innerHTML = `<div class="op-empty">Select a piece or overlay to edit it here.</div>`;
      edDelete.hidden = true;
      return;
    }
    edDelete.hidden = false;
    if (cur().selected.kind === "piece") buildPieceEditor(obj);
    else buildShapeEditor(obj);
  }

  function buildPieceEditor(p) {
    edTitle.textContent = p.tag === "enemy" ? "Enemy Piece" : "Player Piece";
    const preset = findPreset(p.presetId);
    edBody.innerHTML = "";

    // Tag toggle
    const tagField = field("Tag");
    const tagRow = document.createElement("div");
    tagRow.className = "tb-row";
    ["player", "enemy"].forEach(t => {
      const b = document.createElement("button");
      b.className = "toggle-btn" + (p.tag === t ? " active" : "");
      b.textContent = t;
      b.onclick = () => {
        p.tag = t;
        if (t === "player") { p.presetId = "player"; p.vision = null; }
        else if (p.presetId === "player") p.presetId = "custom";
        if (t === "enemy" && !p.vision) p.vision = defaultVision(p.presetId);
        const np = findPreset(p.presetId);
        if (np && np.color) p.color = np.color;
        renderAll(); save(); openEditor();
      };
      tagRow.appendChild(b);
    });
    tagField.appendChild(tagRow);
    edBody.appendChild(tagField);

    // Preset picker (enemies only)
    if (p.tag === "enemy") {
      const pf = field("Preset");
      const grid = document.createElement("div");
      grid.className = "preset-grid";
      const all = [];
      for (const list of Object.values(PRESETS.enemy)) list.forEach(pr => all.push(pr));
      all.push(CUSTOM_ENEMY);
      all.forEach(pr => {
        const chip = document.createElement("button");
        chip.className = "preset-chip" + (p.presetId === pr.id ? " active" : "");
        chip.innerHTML = `<span class="pc-dot" style="background:${pr.color}"></span>${pr.name === "Enemy" ? "Custom" : pr.name}`;
        chip.onclick = () => {
          p.presetId = pr.id;
          p.color = pr.color;
          const hpMax = hpFromStats(pr.stats);
          p.hpMax = hpMax; p.hp = hpMax;
          if (pr.id !== "custom") p.name = pr.name;
          if (!p.vision) p.vision = defaultVision(pr.id);
          p.vision.on = !blindPreset(pr.id); // blind presets (clicker/bloater) default to no cone
          renderAll(); save(); openEditor();
        };
        grid.appendChild(chip);
      });
      pf.appendChild(grid);
      edBody.appendChild(pf);
    }

    // Name
    const nameF = field("Label");
    nameF.appendChild(inputText(p.name, v => { p.name = v; renderTokens(); renderSidebar(); save(); }));
    edBody.appendChild(nameF);

    // Color + Visibility
    const row = document.createElement("div");
    row.className = "field-row";
    const colorF = field("Color");
    const cr = document.createElement("div");
    cr.className = "ed-color-row";
    const sw = document.createElement("input");
    sw.type = "color"; sw.className = "color-swatch"; sw.value = toHex(p.color);
    sw.oninput = () => { p.color = sw.value; renderTokens(); renderSidebar(); save(); };
    cr.appendChild(sw);
    colorF.appendChild(cr);
    row.appendChild(colorF);

    const visF = field("Visibility");
    const visBtn = document.createElement("button");
    visBtn.className = "toggle-btn" + (p.hidden ? "" : " active");
    visBtn.textContent = p.hidden ? "Hidden" : "Shown";
    visBtn.onclick = () => { p.hidden = !p.hidden; renderTokens(); renderVision(); renderSidebar(); save(); openEditor(); };
    visF.appendChild(visBtn);
    row.appendChild(visF);
    edBody.appendChild(row);

    // HP current / max
    const hpRow = document.createElement("div");
    hpRow.className = "field-row";
    const hpF = field("HP (current)");
    const hpI = numInput(p.hp, v => { p.hp = v; renderTokens(); renderVision(); renderSidebar(); save(); });
    hpF.appendChild(hpI);
    hpRow.appendChild(hpF);
    const maxF = field("HP (max)");
    const maxI = numInput(p.hpMax, v => { p.hpMax = v; if (p.hp > v) p.hp = v; renderTokens(); renderVision(); renderSidebar(); save(); });
    maxF.appendChild(maxI);
    hpRow.appendChild(maxF);
    edBody.appendChild(hpRow);

    // Vision cone (enemies)
    if (p.tag === "enemy") {
      if (!p.vision) p.vision = defaultVision(p.presetId);
      const visF = field("Line of Sight");
      const onBtn = document.createElement("button");
      onBtn.className = "toggle-btn" + (p.vision.on ? " active" : "");
      onBtn.textContent = p.vision.on ? "Vision On" : "Vision Off (disabled)";
      onBtn.onclick = () => { p.vision.on = !p.vision.on; renderVision(); save(); openEditor(); };
      visF.appendChild(onBtn);
      edBody.appendChild(visF);
      if (p.vision.on) {
        edBody.appendChild(rangeField("Sight range (ft)", p.vision.range, 5, 120, 5, v => { p.vision.range = v; renderVision(); save(); }));
        edBody.appendChild(rangeField("Field of view (°)", p.vision.angle, 10, 360, 5, v => { p.vision.angle = v; renderVision(); save(); }));
        edBody.appendChild(rangeField("Facing (°)", Math.round(((p.vision.dir % 360) + 360) % 360), 0, 355, 5, v => { p.vision.dir = v; renderVision(); save(); }));
        const hint = document.createElement("p");
        hint.style.cssText = "font-size:0.7rem;color:var(--text-faint);text-transform:none;margin-top:-4px;";
        hint.textContent = "Tip: right-click + drag an enemy to aim its cone. Cones are blocked by walls (Draw Walls).";
        edBody.appendChild(hint);
      }
    }

    // Image
    const imgF = field("Token Image");
    const imgRow = document.createElement("div");
    imgRow.className = "tb-row";
    const up = document.createElement("button");
    up.className = "btn small ghost";
    up.textContent = p.img ? "Replace Image" : "Upload Image";
    up.onclick = () => { pieceFileTarget = p.id; pieceFileInput.click(); };
    imgRow.appendChild(up);
    if (p.img) {
      const rm = document.createElement("button");
      rm.className = "btn small ghost";
      rm.textContent = "Remove";
      rm.onclick = () => { p.img = null; renderTokens(); save(); openEditor(); };
      imgRow.appendChild(rm);
    }
    imgF.appendChild(imgRow);
    edBody.appendChild(imgF);

    // Stat readout
    if (preset && preset.stats) {
      const sb = document.createElement("div");
      sb.className = "statblock";
      sb.textContent = preset.stats;
      edBody.appendChild(sb);
    }
  }

  function buildShapeEditor(s) {
    const titles = { cone: "Cone", sphere: "Sphere", cube: "Cube", line: "Line" };
    edTitle.textContent = (titles[s.type] || "Overlay") + " Overlay";
    edBody.innerHTML = "";

    const lblF = field("Label (e.g. Molotov, Spores)");
    lblF.appendChild(inputText(s.label, v => { s.label = v; renderShapeLabels(); save(); }));
    edBody.appendChild(lblF);

    const colorF = field("Color");
    const cr = document.createElement("div");
    cr.className = "ed-color-row";
    const sw = document.createElement("input");
    sw.type = "color"; sw.className = "color-swatch"; sw.value = toHex(s.color);
    sw.oninput = () => { s.color = sw.value; renderShapes(); save(); };
    cr.appendChild(sw);
    const note = document.createElement("span");
    note.style.cssText = "font-size:0.72rem;color:var(--text-faint);text-transform:none;";
    note.textContent = "Each overlay keeps its own color.";
    cr.appendChild(note);
    colorF.appendChild(cr);
    edBody.appendChild(colorF);

    const sizeLabel = s.type === "sphere" ? "Diameter (ft)" : s.type === "cube" ? "Side (ft)" : "Length (ft)";
    edBody.appendChild(rangeField(sizeLabel, s.size, 5, 120, 5, v => { s.size = v; renderShapes(); save(); }));
    if (s.type === "line")
      edBody.appendChild(rangeField("Width (ft)", s.width, 5, 30, 5, v => { s.width = v; renderShapes(); save(); }));
    if (s.type !== "sphere")
      edBody.appendChild(rangeField("Rotation (°)", s.rot, 0, 350, 5, v => { s.rot = v; renderShapes(); save(); }));
  }

  /* ---- small editor builders ---- */
  function field(label) {
    const f = document.createElement("label");
    f.className = "field";
    const s = document.createElement("span");
    s.className = "field-label";
    s.textContent = label;
    f.appendChild(s);
    return f;
  }
  function inputText(val, onInput) {
    const i = document.createElement("input");
    i.type = "text"; i.value = val || "";
    i.oninput = () => onInput(i.value);
    return i;
  }
  function numInput(val, onInput) {
    const i = document.createElement("input");
    i.type = "number"; i.value = val ?? 0;
    i.oninput = () => onInput(parseInt(i.value, 10) || 0);
    return i;
  }
  function rangeField(label, val, min, max, step, onInput) {
    const f = field(label);
    const row = document.createElement("div");
    row.className = "range-row";
    const r = document.createElement("input");
    r.type = "range"; r.min = min; r.max = max; r.step = step; r.value = val;
    const out = document.createElement("span");
    out.className = "range-val"; out.textContent = val;
    r.oninput = () => { out.textContent = r.value; onInput(parseFloat(r.value)); };
    row.appendChild(r); row.appendChild(out);
    f.appendChild(row);
    return f;
  }
  function toHex(c) {
    if (!c) return "#a7bd6e";
    if (c[0] === "#") return c.length === 4 ? "#" + c.slice(1).split("").map(x => x + x).join("") : c.slice(0, 7);
    return "#a7bd6e";
  }

  /* ---------------------------------------------------------
     RIGHT RAIL PANELS (Enemies + Info) — collapse in place;
     the header toggle stays put, so open == close location.
     --------------------------------------------------------- */
  function applyPanels() {
    enemiesPanel.classList.toggle("collapsed", !state.enemiesOpen);
    editorPanel.classList.toggle("collapsed", !state.editorOpen);
  }
  function toggleEnemies() { state.enemiesOpen = !state.enemiesOpen; applyPanels(); save(); }
  function toggleEditor()  { state.editorOpen = !state.editorOpen;  applyPanels(); save(); }
  function applyToolbar() {
    toolbar.classList.toggle("collapsed", !state.toolbarOpen);
    toolbarReopen.hidden = state.toolbarOpen;
  }
  function setToolbar(open) {
    state.toolbarOpen = open;
    applyToolbar(); save();
  }
  function amount() {
    return Math.max(1, parseInt($("#es-amount").value, 10) || 1);
  }
  function renderSidebar() {
    const m = cur();
    const enemies = m.pieces.filter(p => p.tag === "enemy");
    enemyList.innerHTML = "";
    if (!enemies.length) {
      enemyList.innerHTML = `<div class="op-empty">No enemies on this map yet. Use “+ Enemy”.</div>`;
      return;
    }
    enemies.forEach(p => {
      const down = p.hpMax > 0 && p.hp <= 0;
      const pct = p.hpMax > 0 ? clamp(p.hp / p.hpMax, 0, 1) * 100 : 0;
      const row = document.createElement("div");
      row.className = "enemy-row" + (p.hidden ? " hidden-row" : "") + (down ? " down-row" : "") + (isSelected("piece", p.id) ? " sel" : "");

      const head = document.createElement("div");
      head.className = "er-head";
      head.innerHTML =
        `<span class="er-dot" style="background:${p.color}"></span>
         <span class="er-name">${escapeHtml(p.name || "Enemy")}</span>
         <span class="er-hp">${p.hpMax > 0 ? `${Math.max(0, p.hp)}/${p.hpMax}` : "—"}</span>`;
      head.onclick = () => focusObj("piece", p.id);
      row.appendChild(head);

      if (p.hpMax > 0) {
        const bar = document.createElement("div");
        bar.className = "er-bar";
        bar.innerHTML = `<div class="er-fill" style="width:${pct}%;background:${down ? "var(--red)" : p.color}"></div>`;
        row.appendChild(bar);
      }

      const ctr = document.createElement("div");
      ctr.className = "er-controls";
      ctr.appendChild(rowBtn("dmg", "−" + amount(), () => { p.hp = clamp(p.hp - amount(), 0, p.hpMax || 9999); renderTokens(); renderVision(); renderSidebar(); save(); }));
      ctr.appendChild(rowBtn("heal", "+" + amount(), () => { p.hp = clamp(p.hp + amount(), 0, p.hpMax || 9999); renderTokens(); renderVision(); renderSidebar(); save(); }));
      ctr.appendChild(rowBtn("eye" + (p.hidden ? " off" : ""), p.hidden ? "Show" : "Hide", () => { p.hidden = !p.hidden; renderTokens(); renderVision(); renderSidebar(); save(); if (getSelectedObj() === p) openEditor(); }));
      row.appendChild(ctr);

      enemyList.appendChild(row);
    });
  }
  function rowBtn(cls, label, onClick) {
    const b = document.createElement("button");
    b.className = "er-btn " + cls;
    b.textContent = label;
    b.onclick = (e) => { e.stopPropagation(); onClick(); };
    return b;
  }

  /* ---------------------------------------------------------
     TABS
     --------------------------------------------------------- */
  function renderTabs() {
    tabStrip.innerHTML = "";
    state.maps.forEach(m => {
      const tab = document.createElement("div");
      tab.className = "tab" + (m.id === state.activeMapId ? " active" : "");
      const name = document.createElement("span");
      name.className = "tab-name";
      name.textContent = m.name;
      name.title = "Click to open · double-click to rename";
      name.onclick = () => switchMap(m.id);
      name.ondblclick = () => renameMap(m.id);
      tab.appendChild(name);
      const x = document.createElement("button");
      x.className = "tab-x";
      x.textContent = "✕";
      x.title = "Close tab";
      x.onclick = (e) => { e.stopPropagation(); closeMap(m.id); };
      tab.appendChild(x);
      tabStrip.appendChild(tab);
    });
    const add = document.createElement("button");
    add.className = "tab-add";
    add.textContent = "+ Map";
    add.title = "New blank map (e.g. the next floor)";
    add.onclick = addMap;
    tabStrip.appendChild(add);
  }
  function switchMap(id) {
    if (id === state.activeMapId) return;
    state.activeMapId = id;
    openEditor();
    syncGridInputs();
    renderTabs(); renderAll();
    save();
  }
  function addMap() {
    const m = newMap();
    state.maps.push(m);
    state.activeMapId = m.id;
    openEditor();
    syncGridInputs();
    renderTabs(); renderAll(); fitView();
    save();
  }
  function renameMap(id) {
    const m = state.maps.find(x => x.id === id);
    if (!m) return;
    const name = prompt("Rename map:", m.name);
    if (name != null && name.trim()) { m.name = name.trim(); renderTabs(); save(); }
  }
  function closeMap(id) {
    if (state.maps.length === 1) { toast("Keep at least one map.", true); return; }
    const m = state.maps.find(x => x.id === id);
    if (!confirm(`Close “${m.name}”? Its pieces and overlays are removed.`)) return;
    const idx = state.maps.findIndex(x => x.id === id);
    state.maps.splice(idx, 1);
    if (state.activeMapId === id) state.activeMapId = state.maps[Math.max(0, idx - 1)].id;
    openEditor();
    syncGridInputs();
    renderTabs(); renderAll(); save();
  }

  /* ---------------------------------------------------------
     OBJECTS PANEL
     --------------------------------------------------------- */
  function renderObjects() {
    if (objectsPanel.hidden) return;
    const m = cur();
    const pl = $("#op-pieces"), sl = $("#op-shapes");
    pl.innerHTML = ""; sl.innerHTML = "";
    if (!m.pieces.length) pl.innerHTML = `<div class="op-empty">No pieces yet.</div>`;
    if (!m.shapes.length) sl.innerHTML = `<div class="op-empty">No overlays yet.</div>`;
    m.pieces.forEach(p => pl.appendChild(objRow(p.color, p.name || "Unnamed", p.tag + (p.hidden ? " · hidden" : ""), () => focusObj("piece", p.id))));
    m.shapes.forEach(s => sl.appendChild(objRow(s.color, s.label || cap(s.type), s.type, () => focusObj("shape", s.id))));
  }
  function objRow(color, name, kind, onClick) {
    const row = document.createElement("div");
    row.className = "op-row";
    row.innerHTML = `<span class="op-dot" style="background:${color}"></span>
                     <span class="op-name">${escapeHtml(name)}</span>
                     <span class="op-kind">${escapeHtml(kind)}</span>`;
    row.onclick = onClick;
    return row;
  }
  function focusObj(kind, id) {
    const m = cur();
    const obj = (kind === "piece" ? m.pieces : m.shapes).find(o => o.id === id);
    if (!obj) return;
    const r = board.getBoundingClientRect();
    m.view.tx = r.width / 2 - obj.x * m.view.scale;
    m.view.ty = r.height / 2 - obj.y * m.view.scale;
    applyView();
    select(kind, id);
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* ---------------------------------------------------------
     POINTER — pan / zoom / drag
     --------------------------------------------------------- */
  const pointers = new Map();
  let drag = null, pinch = null;

  board.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  function onPointerDown(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      drag = null;
      const pts = [...pointers.values()];
      pinch = { dist: dist(pts[0], pts[1]), scale: cur().view.scale, cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2 };
      return;
    }
    if (state.drawMode) { startDraw(e); return; }
    // right-click on an enemy → aim/rotate its vision cone by moving the mouse
    if (e.button === 2) {
      const t = e.target.closest(".token");
      const p = t && cur().pieces.find(o => o.id === t.dataset.pieceId);
      if (p && p.tag === "enemy" && p.vision) {
        drag = { kind: "cone", id: p.id };
        if (!p.vision.on) { p.vision.on = true; renderVision(); }
        aimCone(p, e.clientX, e.clientY);
        return;
      }
      drag = { kind: "pan", startTx: cur().view.tx, startTy: cur().view.ty, startX: e.clientX, startY: e.clientY, moved: false };
      board.classList.add("panning");
      return;
    }
    const tokenEl = e.target.closest(".token");
    const shapeEl = e.target.closest("[data-shape-id]");
    if (tokenEl) {
      const id = tokenEl.dataset.pieceId;
      const p = cur().pieces.find(o => o.id === id);
      const w = screenToWorld(e.clientX, e.clientY);
      drag = { kind: "piece", id, dx: w.x - p.x, dy: w.y - p.y, moved: false, startX: e.clientX, startY: e.clientY };
      tokenEl.classList.add("dragging");
      tokenEl.setPointerCapture?.(e.pointerId);
    } else if (shapeEl) {
      const id = shapeEl.dataset.shapeId;
      const s = cur().shapes.find(o => o.id === id);
      const w = screenToWorld(e.clientX, e.clientY);
      drag = { kind: "shape", id, dx: w.x - s.x, dy: w.y - s.y, moved: false, startX: e.clientX, startY: e.clientY };
    } else {
      drag = { kind: "pan", startTx: cur().view.tx, startTy: cur().view.ty, startX: e.clientX, startY: e.clientY, moved: false };
      board.classList.add("panning");
      closeEnemyMenu();
    }
  }

  function onPointerMove(e) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const pts = [...pointers.values()];
      zoomAround(pinch.cx, pinch.cy, clampScale(pinch.scale * (dist(pts[0], pts[1]) / pinch.dist)));
      return;
    }
    if (!drag) return;
    if (drag.kind === "pan") {
      const v = cur().view;
      v.tx = drag.startTx + (e.clientX - drag.startX);
      v.ty = drag.startTy + (e.clientY - drag.startY);
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 3) drag.moved = true;
      applyView();
      return;
    }
    if (drag.kind === "cone") {
      const p = cur().pieces.find(o => o.id === drag.id);
      if (p) aimCone(p, e.clientX, e.clientY);
      return;
    }
    const w = screenToWorld(e.clientX, e.clientY);
    if (drag.kind === "erase") {
      if (eraseAt(w.x, w.y)) { renderWalls(); renderVision(); }
      return;
    }
    if (drag.kind === "create") {
      drag.x1 = w.x; drag.y1 = w.y;
      drawPreview = previewSVG(drag.tool, drag.x0, drag.y0, w.x, w.y);
      renderWalls();
      return;
    }
    if (drag.kind === "wallmove") {
      const wl = cur().walls.find(x => x.id === drag.id);
      if (!wl) return;
      if (!drag.snapped) { snapshot(); drag.snapped = true; }
      const dx = w.x - drag.startWX, dy = w.y - drag.startWY;
      drag.startWX = w.x; drag.startWY = w.y; drag.moved = true;
      moveWall(wl, dx, dy);
      renderWalls(); renderVision();
      return;
    }
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 3) drag.moved = true;
    if (drag.kind === "piece") {
      const p = cur().pieces.find(o => o.id === drag.id);
      if (!p) return;
      p.x = w.x - drag.dx; p.y = w.y - drag.dy;
      const el = tokenLayer.querySelector(`[data-piece-id="${drag.id}"]`);
      if (el) { const size = parseFloat(el.style.width); el.style.left = (p.x - size / 2) + "px"; el.style.top = (p.y - size / 2) + "px"; }
    } else if (drag.kind === "shape") {
      const s = cur().shapes.find(o => o.id === drag.id);
      if (!s) return;
      s.x = w.x - drag.dx; s.y = w.y - drag.dy;
      renderShapes();
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    board.classList.remove("panning");
    tokenLayer.querySelectorAll(".dragging").forEach(n => n.classList.remove("dragging"));
    if (!drag) return;
    const d = drag; drag = null;
    if (d.kind === "cone") { renderVision(); save(); return; }
    if (d.kind === "erase") { renderVision(); save(); return; }
    if (d.kind === "wallmove") { if (d.moved) { renderVision(); save(); } updateWallEditUI(); return; }
    if (d.kind === "create") {
      drawPreview = "";
      const wall = commitWall(d);
      if (wall) { snapshot(); cur().walls.push(wall); state.selectedWall = null; }
      renderWalls(); renderVision(); updateWallEditUI(); save();
      return;
    }
    if (d.kind === "pan") { if (!d.moved && !state.drawMode) deselect(); else save(); return; }
    if (d.kind === "piece") {
      const p = cur().pieces.find(o => o.id === d.id);
      if (p) {
        if (!d.moved) select("piece", p.id);
        else { const sp = snapPoint(p.x, p.y); p.x = sp.x; p.y = sp.y; renderTokens(); renderVision(); save(); }
      }
    } else if (d.kind === "shape") {
      const s = cur().shapes.find(o => o.id === d.id);
      if (s) { if (!d.moved) select("shape", s.id); else { renderShapes(); save(); } }
    }
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clampScale = s => Math.min(4, Math.max(0.15, s));

  function zoomAround(cx, cy, newScale) {
    const v = cur().view, r = board.getBoundingClientRect();
    const wx = (cx - r.left - v.tx) / v.scale;
    const wy = (cy - r.top - v.ty) / v.scale;
    v.scale = newScale;
    v.tx = cx - r.left - wx * newScale;
    v.ty = cy - r.top - wy * newScale;
    applyView(); save();
  }
  board.addEventListener("wheel", e => {
    e.preventDefault();
    zoomAround(e.clientX, e.clientY, clampScale(cur().view.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  }, { passive: false });
  board.addEventListener("contextmenu", e => e.preventDefault()); // free up right-drag for cone aim

  /* ---- vision aim + draw helpers ---- */
  let visionRAF = 0;
  function renderVisionThrottled() {
    if (visionRAF) return;
    visionRAF = requestAnimationFrame(() => { visionRAF = 0; renderVision(); });
  }
  function aimCone(p, cx, cy) {
    const w = screenToWorld(cx, cy);
    p.vision.dir = Math.atan2(w.y - p.y, w.x - p.x) * 180 / Math.PI;
    renderVisionThrottled();
  }
  function startDraw(e) {
    const w = screenToWorld(e.clientX, e.clientY);
    if (e.button === 2 || e.button === 1) { // pan inside draw mode
      drag = { kind: "pan", startTx: cur().view.tx, startTy: cur().view.ty, startX: e.clientX, startY: e.clientY, moved: false };
      board.classList.add("panning");
      return;
    }
    const tool = state.drawTool;
    if (tool === "eraser") {
      drag = { kind: "erase" };
      snapshot();
      if (eraseAt(w.x, w.y)) { renderWalls(); renderVision(); }
      return;
    }
    if (tool === "select") {
      const hitEl = e.target.closest("[data-wall-id]");
      const wl = hitEl ? cur().walls.find(x => x.id === hitEl.dataset.wallId) : wallHitAt(w.x, w.y);
      if (wl) {
        state.selectedWall = wl.id;
        drag = { kind: "wallmove", id: wl.id, startWX: w.x, startWY: w.y, moved: false, snapped: false };
      } else {
        state.selectedWall = null;
        drag = { kind: "pan", startTx: cur().view.tx, startTy: cur().view.ty, startX: e.clientX, startY: e.clientY, moved: false };
        board.classList.add("panning");
      }
      updateWallEditUI(); renderWalls();
      return;
    }
    drag = { kind: "create", tool, x0: w.x, y0: w.y, x1: w.x, y1: w.y };
  }
  function previewSVG(tool, x0, y0, x1, y1) {
    const fill = 'fill="rgba(127,208,255,0.12)"';
    if (tool === "line") return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#7fd0ff" stroke-width="3.5" stroke-linecap="round"/>`;
    if (tool === "rect") { const x = Math.min(x0, x1), y = Math.min(y0, y1), w = Math.abs(x1 - x0), h = Math.abs(y1 - y0); return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${fill} stroke="#7fd0ff" stroke-width="3.5"/>`; }
    if (tool === "circle") { const r = Math.hypot(x1 - x0, y1 - y0); return `<circle cx="${x0}" cy="${y0}" r="${r}" ${fill} stroke="#7fd0ff" stroke-width="3.5"/>`; }
    return "";
  }
  function commitWall(d) {
    const x0 = d.x0, y0 = d.y0, x1 = d.x1, y1 = d.y1;
    if (d.tool === "line") { if (Math.hypot(x1 - x0, y1 - y0) < 6) return null; return { id: nextId(), type: "seg", x1: x0, y1: y0, x2: x1, y2: y1 }; }
    if (d.tool === "rect") { const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0); if (w < 6 || h < 6) return null; return { id: nextId(), type: "rect", x: (x0 + x1) / 2, y: (y0 + y1) / 2, w, h, rot: 0 }; }
    if (d.tool === "circle") { const r = Math.hypot(x1 - x0, y1 - y0); if (r < 6) return null; return { id: nextId(), type: "circle", x: x0, y: y0, r }; }
    return null;
  }
  function moveWall(w, dx, dy) {
    if (w.type === "seg") { w.x1 += dx; w.y1 += dy; w.x2 += dx; w.y2 += dy; }
    else { w.x += dx; w.y += dy; }
  }

  /* ---------------------------------------------------------
     FILE UPLOADS
     --------------------------------------------------------- */
  const bgFileInput = $("#bg-file");
  const pieceFileInput = $("#piece-file");
  const importFileInput = $("#import-file");
  let pieceFileTarget = null;

  $("#upload-bg-btn").onclick = () => bgFileInput.click();
  bgFileInput.onchange = () => {
    const f = bgFileInput.files[0];
    if (!f) return;
    readImage(f, (dataUrl, w, h) => {
      const m = cur();
      m.bg = dataUrl; m.worldW = w; m.worldH = h;
      const r = board.getBoundingClientRect();
      const s = clampScale(Math.min(r.width / w, r.height / h, 1) * 0.92);
      m.view.scale = s; m.view.tx = (r.width - w * s) / 2; m.view.ty = (r.height - h * s) / 2;
      renderAll(); save();
      toast("Map loaded. Set grid Size to match the squares.");
    });
    bgFileInput.value = "";
  };
  $("#clear-bg-btn").onclick = () => { cur().bg = null; renderAll(); save(); };

  pieceFileInput.onchange = () => {
    const f = pieceFileInput.files[0];
    if (!f || !pieceFileTarget) return;
    readImage(f, (dataUrl) => {
      const p = cur().pieces.find(o => o.id === pieceFileTarget);
      if (p) { p.img = dataUrl; renderTokens(); save(); openEditor(); }
      pieceFileTarget = null;
    });
    pieceFileInput.value = "";
  };

  function readImage(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => cb(reader.result, img.naturalWidth, img.naturalHeight);
      img.onerror = () => cb(reader.result, 1200, 800);
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------------------------------------------------------
     TOOLBAR WIRING
     --------------------------------------------------------- */
  $("#add-player-btn").onclick = () => addPiece("player", "player");

  const addEnemyBtn = $("#add-enemy-btn");
  addEnemyBtn.onclick = (e) => {
    e.stopPropagation();
    if (!enemyMenu.hidden) { closeEnemyMenu(); return; }
    buildEnemyMenu();
    enemyMenu.hidden = false;
    const r = addEnemyBtn.getBoundingClientRect();
    enemyMenu.style.left = r.left + "px";
    enemyMenu.style.top = (r.bottom + 6) + "px";
  };
  function buildEnemyMenu() {
    let html = "";
    for (const [group, list] of Object.entries(PRESETS.enemy)) {
      html += `<div class="dd-group-label">${group}</div>`;
      list.forEach(p => {
        html += `<button class="dd-item" data-preset="${p.id}">
                   <span class="dd-dot" style="background:${p.color}"></span>${p.name}
                   <span class="dd-meta">HP ${hpFromStats(p.stats)}</span></button>`;
      });
    }
    html += `<div class="dd-group-label">Custom</div>
             <button class="dd-item" data-preset="custom">
               <span class="dd-dot" style="background:${CUSTOM_ENEMY.color}"></span>Custom Enemy</button>`;
    enemyMenu.innerHTML = html;
    enemyMenu.querySelectorAll(".dd-item").forEach(b => {
      b.onclick = () => { addPiece("enemy", b.dataset.preset); closeEnemyMenu(); };
    });
  }
  function closeEnemyMenu() { enemyMenu.hidden = true; }
  document.addEventListener("click", e => {
    if (!e.target.closest("#enemy-menu") && !e.target.closest("#add-enemy-btn")) closeEnemyMenu();
  });

  document.querySelectorAll(".shape-btn").forEach(b => { b.onclick = () => addShape(b.dataset.shape); });

  // Grid controls
  const gridSize = $("#grid-size"), gridOffX = $("#grid-offx"), gridOffY = $("#grid-offy"), gridColor = $("#grid-color");
  function syncGridInputs() {
    const g = cur().grid;
    gridSize.value = g.size; gridOffX.value = g.offX; gridOffY.value = g.offY; gridColor.value = toHex(g.color);
    $("#grid-toggle").classList.toggle("active", g.show);
    $("#snap-toggle").classList.toggle("active", g.snap);
  }
  gridSize.oninput = () => { cur().grid.size = clampNum(gridSize.value, 8, 400, 60); renderGrid(); renderTokens(); save(); };
  gridOffX.oninput = () => { cur().grid.offX = clampNum(gridOffX.value, -1000, 1000, 0); renderGrid(); save(); };
  gridOffY.oninput = () => { cur().grid.offY = clampNum(gridOffY.value, -1000, 1000, 0); renderGrid(); save(); };
  gridColor.oninput = () => { cur().grid.color = gridColor.value; renderGrid(); save(); };
  $("#grid-toggle").onclick = () => { cur().grid.show = !cur().grid.show; syncGridInputs(); renderGrid(); save(); };
  $("#snap-toggle").onclick = () => { cur().grid.snap = !cur().grid.snap; syncGridInputs(); save(); };
  const clampNum = (v, lo, hi, dflt) => { const n = parseFloat(v); return isNaN(n) ? dflt : Math.min(hi, Math.max(lo, n)); };

  // Zoom
  $("#zoom-in").onclick = () => zoomCenter(1.2);
  $("#zoom-out").onclick = () => zoomCenter(1 / 1.2);
  $("#zoom-fit").onclick = fitView;
  function zoomCenter(f) {
    const r = board.getBoundingClientRect();
    zoomAround(r.left + r.width / 2, r.top + r.height / 2, clampScale(cur().view.scale * f));
  }
  function fitView() {
    const m = cur(), r = board.getBoundingClientRect();
    const s = clampScale(Math.min(r.width / m.worldW, r.height / m.worldH) * 0.94);
    m.view.scale = s; m.view.tx = (r.width - m.worldW * s) / 2; m.view.ty = (r.height - m.worldH * s) / 2;
    applyView(); save();
  }

  // Objects panel
  $("#toggle-objects").onclick = () => { objectsPanel.hidden = !objectsPanel.hidden; renderObjects(); };
  $("#objects-close").onclick = () => { objectsPanel.hidden = true; };

  // Rail panels (Enemies + Info) collapse via their headers
  $("#enemies-toggle").onclick = toggleEnemies;
  $("#editor-toggle").onclick = toggleEditor;
  edDelete.onclick = () => {
    const m = cur();
    if (!m.selected) return;
    const { kind, id } = m.selected;
    if (kind === "piece") m.pieces = m.pieces.filter(p => p.id !== id);
    else m.shapes = m.shapes.filter(s => s.id !== id);
    deselect(); renderAll(); save();
  };

  // Toolbar collapse
  $("#tb-collapse").onclick = () => setToolbar(false);
  toolbarReopen.onclick = () => setToolbar(true);

  // Sight: vision cones + wall draw mode
  $("#vision-toggle").onclick = () => {
    state.visionShow = !state.visionShow;
    $("#vision-toggle").classList.toggle("active", state.visionShow);
    renderVision(); save();
  };
  $("#draw-walls-btn").onclick = () => setDrawMode(!state.drawMode);
  $("#draw-done").onclick = () => setDrawMode(false);
  drawBar.querySelectorAll(".draw-tool").forEach(b => { b.onclick = () => setDrawTool(b.dataset.tool); });
  $("#wall-undo").onclick = undo;
  $("#wall-redo").onclick = redo;
  $("#wall-rot").oninput = () => {
    const w = selectedWallObj();
    if (!w) return;
    if (!$("#wall-rot").dataset.snapped) { snapshot(); $("#wall-rot").dataset.snapped = "1"; }
    rotateWall(w, parseFloat($("#wall-rot").value));
    renderWalls(); renderVision(); save();
  };
  $("#wall-rot").onchange = () => { delete $("#wall-rot").dataset.snapped; };
  $("#wall-delete").onclick = () => {
    const w = selectedWallObj();
    if (!w) return;
    snapshot();
    cur().walls = cur().walls.filter(x => x.id !== w.id);
    state.selectedWall = null;
    updateWallEditUI(); renderWalls(); renderVision(); save();
  };
  $("#amt-dec").onclick = () => { const i = $("#es-amount"); i.value = Math.max(1, (parseInt(i.value, 10) || 1) - 1); renderSidebar(); };
  $("#amt-inc").onclick = () => { const i = $("#es-amount"); i.value = (parseInt(i.value, 10) || 1) + 1; renderSidebar(); };
  $("#es-amount").oninput = renderSidebar;

  // Data
  $("#export-btn").onclick = exportData;
  $("#import-btn").onclick = () => importFileInput.click();
  importFileInput.onchange = () => {
    const f = importFileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        adopt(JSON.parse(reader.result));
        setDrawMode(false);
        $("#vision-toggle").classList.toggle("active", state.visionShow);
        applyPanels(); applyToolbar(); syncGridInputs(); renderTabs(); renderAll(); save();
        toast("Map imported.");
      } catch (err) { toast("Import failed — invalid file.", true); }
    };
    reader.readAsText(f);
    importFileInput.value = "";
  };
  function exportData() {
    const blob = new Blob([JSON.stringify({
      maps: state.maps, activeMapId: state.activeMapId, seq: state.seq, sidebarOpen: state.sidebarOpen,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "field-map.json"; a.click();
    URL.revokeObjectURL(url);
  }

  $("#reset-btn").onclick = () => {
    if (!confirm("Clear everything? All tabs, maps, pieces and overlays are removed.")) return;
    const m = newMap("Map 1");
    state.maps = [m]; state.activeMapId = m.id;
    openEditor();
    syncGridInputs(); renderTabs(); renderAll(); fitView(); save();
    toast("Board cleared.");
  };

  // Keyboard
  window.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea, select")) return;
    const z = (e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z");
    const y = (e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y");
    if (state.drawMode && (z || y)) {
      e.preventDefault();
      if (y || (z && e.shiftKey)) redo(); else undo();
      return;
    }
    if (state.drawMode && (e.key === "Delete" || e.key === "Backspace") && state.selectedWall) {
      e.preventDefault(); $("#wall-delete").click(); return;
    }
    if (e.key === "Escape" && state.drawMode) { setDrawMode(false); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && cur().selected) { e.preventDefault(); $("#ed-delete").click(); }
    else if (e.key === "Escape") { deselect(); closeEnemyMenu(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); cycleEnemy(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); cycleEnemy(-1); }
    else if (e.key === "v" || e.key === "V") { e.preventDefault(); toggleSelectedVisibility(); }
  });

  /* ---------------------------------------------------------
     ENEMY CYCLING (arrow keys) + visibility (V)
     Only cycles enemies currently within the viewport. Visible
     ones get a white selection ring (see CSS); hidden ones get
     a brief, subtle pulse at their spot — easy to miss unless
     you're already watching that part of the map.
     --------------------------------------------------------- */
  function enemiesInView() {
    const m = cur(), v = m.view, r = board.getBoundingClientRect();
    const x0 = -v.tx / v.scale, y0 = -v.ty / v.scale;
    const x1 = (r.width - v.tx) / v.scale, y1 = (r.height - v.ty) / v.scale;
    return m.pieces
      .filter(p => p.tag === "enemy" && p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1)
      .sort((a, b) => a.x - b.x || a.y - b.y);
  }
  function cycleEnemy(dir) {
    const list = enemiesInView();
    if (!list.length) return;
    const sel = cur().selected;
    let idx = (sel && sel.kind === "piece") ? list.findIndex(p => p.id === sel.id) : -1;
    const next = idx === -1
      ? (dir > 0 ? list[0] : list[list.length - 1])
      : list[(idx + dir + list.length) % list.length];
    selectEnemy(next);
  }
  function selectEnemy(p) {
    select("piece", p.id);
    if (p.hidden) pulseAt(p);
  }
  function toggleSelectedVisibility() {
    const m = cur();
    if (!m.selected || m.selected.kind !== "piece") return;
    const p = m.pieces.find(o => o.id === m.selected.id);
    if (!p || p.tag !== "enemy") return;
    p.hidden = !p.hidden;
    renderTokens(); renderVision(); renderSidebar(); save(); openEditor();
    if (p.hidden) pulseAt(p); // it just vanished — flash where it went
  }
  function pulseAt(p) {
    const size = Math.max(20, cur().grid.size);
    const el = document.createElement("div");
    el.className = "select-pulse";
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.style.width = el.style.height = size + "px";
    tokenLayer.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  /* ---------------------------------------------------------
     TOAST
     --------------------------------------------------------- */
  let toastTimer = null;
  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
  }

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */
  load();
  if (!state.maps.length) { const m = newMap("Map 1"); state.maps.push(m); state.activeMapId = m.id; }
  if (!cur()) state.activeMapId = state.maps[0].id;
  applyPanels();
  applyToolbar();
  $("#vision-toggle").classList.toggle("active", state.visionShow);
  renderTabs();
  syncGridInputs();
  renderAll();
  openEditor();
  const m0 = cur();
  if (!m0.bg && !m0.pieces.length && !m0.shapes.length) fitView();
})();
