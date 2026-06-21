/* =========================================================
   FIELD MAP — TTRPG BATTLE BOARD
   Sparse, table-ready map tool. Independent project.

   Concept:
   - A pan/zoom "world" holds a background image, a grid, AoE
     overlays (cone/sphere/cube/line) and piece tokens.
   - Pieces are tagged Player or Enemy. Enemies carry presets
     (the bestiary below); every object keeps its own color so
     you can track molotovs vs spores, runners vs clickers, etc.
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

  /* ---------------------------------------------------------
     STATE
     --------------------------------------------------------- */
  const FEET_PER_CELL = 5; // standard 5-ft squares; shapes are sized in feet
  const STORE_KEY = "fieldmap.v1";

  const state = {
    bg: null,                 // dataURL of background image
    worldW: 3000,
    worldH: 2000,
    grid: { size: 60, offX: 0, offY: 0, color: "#a7bd6e", show: true, snap: true },
    view: { tx: 60, ty: 60, scale: 1 },
    pieces: [],               // {id, tag, presetId, name, color, img, hp, x, y}
    shapes: [],               // {id, type, color, label, x, y, rot, size, width}
    selected: null,           // {kind:'piece'|'shape', id}
    seq: 1,
  };
  const nextId = () => "o" + (state.seq++) + "_" + Math.random().toString(36).slice(2, 6);

  /* ---------------------------------------------------------
     DOM
     --------------------------------------------------------- */
  const $ = sel => document.querySelector(sel);
  const board       = $("#board");
  const world       = $("#world");
  const bgImage     = $("#bg-image");
  const gridLayer   = $("#grid-layer");
  const shapeLayer  = $("#shape-layer");
  const tokenLayer  = $("#token-layer");
  const boardHint   = $("#board-hint");
  const editor      = $("#editor");
  const edTitle     = $("#ed-title");
  const edBody      = $("#ed-body");
  const objectsPanel = $("#objects-panel");
  const enemyMenu   = $("#enemy-menu");
  const toastEl     = $("#toast");
  const NS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------
     PERSISTENCE
     --------------------------------------------------------- */
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const out = {
          bg: state.bg, worldW: state.worldW, worldH: state.worldH,
          grid: state.grid, view: state.view,
          pieces: state.pieces, shapes: state.shapes, seq: state.seq,
        };
        localStorage.setItem(STORE_KEY, JSON.stringify(out));
      } catch (e) {
        toast("Couldn't save — map image may be too large for storage.", true);
      }
    }, 250);
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      Object.assign(state, {
        bg: d.bg ?? null,
        worldW: d.worldW ?? 3000,
        worldH: d.worldH ?? 2000,
        grid: { ...state.grid, ...(d.grid || {}) },
        view: { ...state.view, ...(d.view || {}) },
        pieces: d.pieces || [],
        shapes: d.shapes || [],
        seq: d.seq || 1,
      });
    } catch (e) { /* ignore corrupt store */ }
  }

  /* ---------------------------------------------------------
     COORDINATE HELPERS
     --------------------------------------------------------- */
  function screenToWorld(sx, sy) {
    const r = board.getBoundingClientRect();
    return {
      x: (sx - r.left - state.view.tx) / state.view.scale,
      y: (sy - r.top - state.view.ty) / state.view.scale,
    };
  }
  function snapPoint(x, y) {
    if (!state.grid.snap) return { x, y };
    const g = state.grid;
    const col = Math.round((x - g.offX) / g.size - 0.5);
    const row = Math.round((y - g.offY) / g.size - 0.5);
    return {
      x: g.offX + (col + 0.5) * g.size,
      y: g.offY + (row + 0.5) * g.size,
    };
  }
  const feetToPx = ft => (ft / FEET_PER_CELL) * state.grid.size;

  /* ---------------------------------------------------------
     RENDER — view transform
     --------------------------------------------------------- */
  function applyView() {
    world.style.transform =
      `translate(${state.view.tx}px, ${state.view.ty}px) scale(${state.view.scale})`;
  }

  /* ---------------------------------------------------------
     RENDER — background
     --------------------------------------------------------- */
  function renderBg() {
    if (state.bg) {
      bgImage.src = state.bg;
      bgImage.hidden = false;
      boardHint.hidden = true;
    } else {
      bgImage.removeAttribute("src");
      bgImage.hidden = true;
      boardHint.hidden = state.pieces.length || state.shapes.length;
    }
    world.style.width = state.worldW + "px";
    world.style.height = state.worldH + "px";
  }

  /* ---------------------------------------------------------
     RENDER — grid
     --------------------------------------------------------- */
  function renderGrid() {
    const g = state.grid;
    gridLayer.setAttribute("width", state.worldW);
    gridLayer.setAttribute("height", state.worldH);
    gridLayer.style.display = g.show ? "block" : "none";
    if (!g.show) return;
    const patId = "gridpat";
    gridLayer.innerHTML =
      `<defs>
        <pattern id="${patId}" width="${g.size}" height="${g.size}"
                 patternUnits="userSpaceOnUse"
                 patternTransform="translate(${g.offX},${g.offY})">
          <path d="M ${g.size} 0 L 0 0 0 ${g.size}" fill="none"
                stroke="${g.color}" stroke-width="1" opacity="0.55"/>
        </pattern>
      </defs>
      <rect width="${state.worldW}" height="${state.worldH}" fill="url(#${patId})"/>`;
  }

  /* ---------------------------------------------------------
     RENDER — shapes (AoE overlays)
     --------------------------------------------------------- */
  function shapeGeometry(s) {
    // returns an SVG element string for the shape body, in world px
    const c = s.color;
    const fill = c, stroke = c;
    const common = `fill="${fill}" fill-opacity="0.28" stroke="${stroke}" stroke-width="2.5" stroke-opacity="0.95"`;
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
      const len = feetToPx(s.size);
      const w = feetToPx(s.width || 5);
      return `<rect x="0" y="${-w/2}" width="${len}" height="${w}" ${common}
               transform="translate(${s.x},${s.y}) rotate(${s.rot})"/>`;
    }
    // cone: 5e style, length == width at the far end (half-angle ~26.57°)
    const L = feetToPx(s.size);
    const half = L / 2;
    const pts = `0,0 ${L},${-half} ${L},${half}`;
    return `<polygon points="${pts}" ${common}
             transform="translate(${s.x},${s.y}) rotate(${s.rot})"/>`;
  }

  function renderShapes() {
    shapeLayer.setAttribute("width", state.worldW);
    shapeLayer.setAttribute("height", state.worldH);
    let svg = "";
    for (const s of state.shapes) {
      const sel = state.selected && state.selected.kind === "shape" && state.selected.id === s.id;
      svg += `<g data-shape-id="${s.id}" style="pointer-events:auto;cursor:grab;"
                ${sel ? 'class="shape-selected"' : ""}>${shapeGeometry(s)}</g>`;
    }
    shapeLayer.innerHTML = svg;
    // selected outline emphasis
    if (state.selected && state.selected.kind === "shape") {
      const g = shapeLayer.querySelector(`[data-shape-id="${state.selected.id}"] > *`);
      if (g) { g.setAttribute("stroke-width", "4"); g.setAttribute("fill-opacity", "0.38"); }
    }
    // labels live in token layer space; render as HTML for crispness
    renderShapeLabels();
  }

  function renderShapeLabels() {
    tokenLayer.querySelectorAll(".shape-tag").forEach(n => n.remove());
    for (const s of state.shapes) {
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

  /* ---------------------------------------------------------
     RENDER — tokens (pieces)
     --------------------------------------------------------- */
  function renderTokens() {
    tokenLayer.querySelectorAll(".token").forEach(n => n.remove());
    const size = Math.max(20, state.grid.size);
    for (const p of state.pieces) {
      const el = document.createElement("div");
      el.className = "token " + p.tag + (isSelected("piece", p.id) ? " selected" : "");
      el.dataset.pieceId = p.id;
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.left = (p.x - size / 2) + "px";
      el.style.top = (p.y - size / 2) + "px";
      el.style.borderColor = p.color;
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
      if (p.hp != null && p.hp !== "") {
        const hp = document.createElement("span");
        hp.className = "tk-hp";
        hp.textContent = "HP " + p.hp;
        el.appendChild(hp);
      }
      tokenLayer.appendChild(el);
    }
  }

  function isSelected(kind, id) {
    return state.selected && state.selected.kind === kind && state.selected.id === id;
  }

  function renderAll() {
    renderBg();
    renderGrid();
    renderShapes();
    renderTokens();
    applyView();
    renderObjects();
  }

  /* ---------------------------------------------------------
     ADD OBJECTS
     --------------------------------------------------------- */
  function centerWorld() {
    const r = board.getBoundingClientRect();
    return screenToWorld(r.left + r.width / 2, r.top + r.height / 2);
  }

  function addPiece(tag, presetId) {
    const preset = findPreset(presetId) || (tag === "enemy" ? CUSTOM_ENEMY : PRESETS.player[0]);
    const c = centerWorld();
    const pos = snapPoint(c.x, c.y);
    // count existing of this preset to auto-number
    const sameName = state.pieces.filter(p => p.presetId === presetId).length;
    const piece = {
      id: nextId(),
      tag,
      presetId,
      name: preset.name + (sameName ? " " + (sameName + 1) : ""),
      color: preset.color,
      img: null,
      hp: extractHP(preset.stats),
      x: pos.x, y: pos.y,
    };
    state.pieces.push(piece);
    select("piece", piece.id);
    renderAll();
    save();
  }

  function extractHP(stats) {
    if (!stats) return "";
    const m = stats.match(/HP\s+(\d+)/);
    return m ? m[1] : "";
  }

  function addShape(type) {
    const c = centerWorld();
    const color = $("#next-shape-color").value;
    const defaults = { cone: 15, sphere: 20, cube: 15, line: 30 };
    const shape = {
      id: nextId(),
      type,
      color,
      label: "",
      x: c.x, y: c.y,
      rot: 0,
      size: defaults[type] || 15,
      width: 5,
    };
    state.shapes.push(shape);
    select("shape", shape.id);
    renderAll();
    save();
  }

  /* ---------------------------------------------------------
     SELECTION + EDITOR
     --------------------------------------------------------- */
  function select(kind, id) {
    state.selected = { kind, id };
    renderShapes();
    renderTokens();
    renderObjects();
    openEditor();
  }
  function deselect() {
    state.selected = null;
    editor.hidden = true;
    renderShapes();
    renderTokens();
    renderObjects();
  }

  function getSelectedObj() {
    if (!state.selected) return null;
    const arr = state.selected.kind === "piece" ? state.pieces : state.shapes;
    return arr.find(o => o.id === state.selected.id) || null;
  }

  function openEditor() {
    const obj = getSelectedObj();
    if (!obj) { editor.hidden = true; return; }
    editor.hidden = false;
    if (state.selected.kind === "piece") buildPieceEditor(obj);
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
        if (t === "player") p.presetId = "player";
        else if (p.presetId === "player") p.presetId = "custom";
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
      for (const [group, list] of Object.entries(PRESETS.enemy)) {
        list.forEach(pr => all.push(pr));
      }
      all.push(CUSTOM_ENEMY);
      all.forEach(pr => {
        const chip = document.createElement("button");
        chip.className = "preset-chip" + (p.presetId === pr.id ? " active" : "");
        chip.innerHTML = `<span class="pc-dot" style="background:${pr.color}"></span>${pr.name === "Enemy" ? "Custom" : pr.name}`;
        chip.onclick = () => {
          p.presetId = pr.id;
          p.color = pr.color;
          p.hp = extractHP(pr.stats);
          if (pr.id !== "custom") p.name = pr.name;
          renderAll(); save(); openEditor();
        };
        grid.appendChild(chip);
      });
      pf.appendChild(grid);
      edBody.appendChild(pf);
    }

    // Name
    const nameF = field("Label");
    const name = inputText(p.name, v => { p.name = v; renderTokens(); save(); });
    nameF.appendChild(name);
    edBody.appendChild(nameF);

    // Color + HP row
    const row = document.createElement("div");
    row.className = "field-row";
    const colorF = field("Color");
    const colorRow = document.createElement("div");
    colorRow.className = "ed-color-row";
    const sw = document.createElement("input");
    sw.type = "color"; sw.className = "color-swatch"; sw.value = toHex(p.color);
    sw.oninput = () => { p.color = sw.value; renderTokens(); save(); };
    colorRow.appendChild(sw);
    colorF.appendChild(colorRow);
    row.appendChild(colorF);

    const hpF = field("HP (optional)");
    const hp = document.createElement("input");
    hp.type = "text"; hp.value = p.hp ?? "";
    hp.oninput = () => { p.hp = hp.value; renderTokens(); save(); };
    styleInput(hp);
    hpF.appendChild(hp);
    row.appendChild(hpF);
    edBody.appendChild(row);

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

    // Label + color
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

    // Size (ft)
    const sizeLabel = s.type === "sphere" ? "Diameter (ft)"
      : s.type === "cube" ? "Side (ft)"
      : s.type === "line" ? "Length (ft)" : "Length (ft)";
    edBody.appendChild(rangeField(sizeLabel, s.size, 5, 120, 5, v => { s.size = v; renderShapes(); save(); }));

    if (s.type === "line") {
      edBody.appendChild(rangeField("Width (ft)", s.width, 5, 30, 5, v => { s.width = v; renderShapes(); save(); }));
    }

    // Rotation (not for sphere)
    if (s.type !== "sphere") {
      edBody.appendChild(rangeField("Rotation (°)", s.rot, 0, 350, 5, v => { s.rot = v; renderShapes(); save(); }));
    }
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
  function styleInput(el) { /* class-based; relies on .field input */ }
  function inputText(val, onInput) {
    const i = document.createElement("input");
    i.type = "text"; i.value = val || "";
    i.oninput = () => onInput(i.value);
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
    if (c[0] === "#") return c.length === 4
      ? "#" + c.slice(1).split("").map(x => x + x).join("")
      : c.slice(0, 7);
    return "#a7bd6e";
  }

  /* ---------------------------------------------------------
     OBJECTS PANEL
     --------------------------------------------------------- */
  function renderObjects() {
    if (objectsPanel.hidden) return;
    const pl = $("#op-pieces");
    const sl = $("#op-shapes");
    pl.innerHTML = "";
    sl.innerHTML = "";
    if (!state.pieces.length) pl.innerHTML = `<div class="op-empty">No pieces yet.</div>`;
    if (!state.shapes.length) sl.innerHTML = `<div class="op-empty">No overlays yet.</div>`;
    state.pieces.forEach(p => pl.appendChild(objRow(p.color, p.name || "Unnamed", p.tag, () => focusObj("piece", p.id))));
    state.shapes.forEach(s => sl.appendChild(objRow(s.color, s.label || cap(s.type), s.type, () => focusObj("shape", s.id))));
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
    const obj = (kind === "piece" ? state.pieces : state.shapes).find(o => o.id === id);
    if (!obj) return;
    // center the view on it
    const r = board.getBoundingClientRect();
    state.view.tx = r.width / 2 - obj.x * state.view.scale;
    state.view.ty = r.height / 2 - obj.y * state.view.scale;
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
  const pointers = new Map(); // id -> {x,y}
  let drag = null;            // active drag descriptor
  let pinch = null;

  board.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  function onPointerDown(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // two-finger pinch
    if (pointers.size === 2) {
      drag = null;
      const pts = [...pointers.values()];
      pinch = {
        dist: dist(pts[0], pts[1]),
        scale: state.view.scale,
        cx: (pts[0].x + pts[1].x) / 2,
        cy: (pts[0].y + pts[1].y) / 2,
      };
      return;
    }

    const tokenEl = e.target.closest(".token");
    const shapeEl = e.target.closest("[data-shape-id]");

    if (tokenEl) {
      const id = tokenEl.dataset.pieceId;
      const p = state.pieces.find(o => o.id === id);
      const w = screenToWorld(e.clientX, e.clientY);
      drag = { kind: "piece", id, dx: w.x - p.x, dy: w.y - p.y, moved: false, startX: e.clientX, startY: e.clientY };
      tokenEl.classList.add("dragging");
      tokenEl.setPointerCapture?.(e.pointerId);
    } else if (shapeEl) {
      const id = shapeEl.dataset.shapeId;
      const s = state.shapes.find(o => o.id === id);
      const w = screenToWorld(e.clientX, e.clientY);
      drag = { kind: "shape", id, dx: w.x - s.x, dy: w.y - s.y, moved: false, startX: e.clientX, startY: e.clientY };
    } else {
      // pan
      drag = { kind: "pan", startTx: state.view.tx, startTy: state.view.ty, startX: e.clientX, startY: e.clientY, moved: false };
      board.classList.add("panning");
      closeEnemyMenu();
    }
  }

  function onPointerMove(e) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch && pointers.size >= 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const ratio = d / pinch.dist;
      zoomAround(pinch.cx, pinch.cy, clampScale(pinch.scale * ratio));
      return;
    }
    if (!drag) return;

    if (drag.kind === "pan") {
      state.view.tx = drag.startTx + (e.clientX - drag.startX);
      state.view.ty = drag.startTy + (e.clientY - drag.startY);
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 3) drag.moved = true;
      applyView();
      return;
    }

    const w = screenToWorld(e.clientX, e.clientY);
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 3) drag.moved = true;

    if (drag.kind === "piece") {
      const p = state.pieces.find(o => o.id === drag.id);
      if (!p) return;
      p.x = w.x - drag.dx;
      p.y = w.y - drag.dy;
      // live move without full rebuild
      const el = tokenLayer.querySelector(`[data-piece-id="${drag.id}"]`);
      if (el) {
        const size = parseFloat(el.style.width);
        el.style.left = (p.x - size / 2) + "px";
        el.style.top = (p.y - size / 2) + "px";
      }
    } else if (drag.kind === "shape") {
      const s = state.shapes.find(o => o.id === drag.id);
      if (!s) return;
      s.x = w.x - drag.dx;
      s.y = w.y - drag.dy;
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

    if (d.kind === "pan") {
      if (!d.moved) deselect();   // tap empty space clears selection
      else save();
      return;
    }

    if (d.kind === "piece") {
      const p = state.pieces.find(o => o.id === d.id);
      if (p) {
        if (!d.moved) {
          select("piece", p.id);
        } else {
          const sp = snapPoint(p.x, p.y);
          p.x = sp.x; p.y = sp.y;
          renderTokens();
          save();
        }
      }
    } else if (d.kind === "shape") {
      const s = state.shapes.find(o => o.id === d.id);
      if (s) {
        if (!d.moved) select("shape", s.id);
        else { renderShapes(); save(); }
      }
    }
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clampScale = s => Math.min(4, Math.max(0.15, s));

  function zoomAround(cx, cy, newScale) {
    const r = board.getBoundingClientRect();
    const wx = (cx - r.left - state.view.tx) / state.view.scale;
    const wy = (cy - r.top - state.view.ty) / state.view.scale;
    state.view.scale = newScale;
    state.view.tx = cx - r.left - wx * newScale;
    state.view.ty = cy - r.top - wy * newScale;
    applyView();
    save();
  }

  board.addEventListener("wheel", e => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAround(e.clientX, e.clientY, clampScale(state.view.scale * factor));
  }, { passive: false });

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
      state.bg = dataUrl;
      state.worldW = w; state.worldH = h;
      // center the new map
      const r = board.getBoundingClientRect();
      const s = Math.min(r.width / w, r.height / h, 1) * 0.92;
      state.view.scale = clampScale(s);
      state.view.tx = (r.width - w * state.view.scale) / 2;
      state.view.ty = (r.height - h * state.view.scale) / 2;
      renderAll();
      save();
      toast("Map loaded. Set grid Size to match the squares.");
    });
    bgFileInput.value = "";
  };
  $("#clear-bg-btn").onclick = () => {
    state.bg = null;
    renderAll(); save();
  };

  pieceFileInput.onchange = () => {
    const f = pieceFileInput.files[0];
    if (!f || !pieceFileTarget) return;
    readImage(f, (dataUrl) => {
      const p = state.pieces.find(o => o.id === pieceFileTarget);
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
        const hp = extractHP(p.stats);
        html += `<button class="dd-item" data-preset="${p.id}">
                   <span class="dd-dot" style="background:${p.color}"></span>${p.name}
                   <span class="dd-meta">${hp ? "HP " + hp : ""}</span></button>`;
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

  document.querySelectorAll(".shape-btn").forEach(b => {
    b.onclick = () => addShape(b.dataset.shape);
  });

  // Grid controls
  const gridSize = $("#grid-size"), gridOffX = $("#grid-offx"), gridOffY = $("#grid-offy"), gridColor = $("#grid-color");
  function syncGridInputs() {
    gridSize.value = state.grid.size;
    gridOffX.value = state.grid.offX;
    gridOffY.value = state.grid.offY;
    gridColor.value = toHex(state.grid.color);
    $("#grid-toggle").classList.toggle("active", state.grid.show);
    $("#snap-toggle").classList.toggle("active", state.grid.snap);
  }
  gridSize.oninput = () => { state.grid.size = clampNum(gridSize.value, 8, 400, 60); renderGrid(); renderTokens(); save(); };
  gridOffX.oninput = () => { state.grid.offX = clampNum(gridOffX.value, -1000, 1000, 0); renderGrid(); save(); };
  gridOffY.oninput = () => { state.grid.offY = clampNum(gridOffY.value, -1000, 1000, 0); renderGrid(); save(); };
  gridColor.oninput = () => { state.grid.color = gridColor.value; renderGrid(); save(); };
  $("#grid-toggle").onclick = () => { state.grid.show = !state.grid.show; syncGridInputs(); renderGrid(); save(); };
  $("#snap-toggle").onclick = () => { state.grid.snap = !state.grid.snap; syncGridInputs(); save(); };
  const clampNum = (v, lo, hi, dflt) => { const n = parseFloat(v); return isNaN(n) ? dflt : Math.min(hi, Math.max(lo, n)); };

  // Zoom
  $("#zoom-in").onclick = () => zoomCenter(1.2);
  $("#zoom-out").onclick = () => zoomCenter(1 / 1.2);
  $("#zoom-fit").onclick = fitView;
  function zoomCenter(f) {
    const r = board.getBoundingClientRect();
    zoomAround(r.left + r.width / 2, r.top + r.height / 2, clampScale(state.view.scale * f));
  }
  function fitView() {
    const r = board.getBoundingClientRect();
    const w = state.worldW, h = state.worldH;
    const s = clampScale(Math.min(r.width / w, r.height / h) * 0.94);
    state.view.scale = s;
    state.view.tx = (r.width - w * s) / 2;
    state.view.ty = (r.height - h * s) / 2;
    applyView(); save();
  }

  // Objects panel
  $("#toggle-objects").onclick = () => {
    objectsPanel.hidden = !objectsPanel.hidden;
    renderObjects();
  };
  $("#objects-close").onclick = () => { objectsPanel.hidden = true; };

  // Editor
  $("#ed-close").onclick = deselect;
  $("#ed-delete").onclick = () => {
    if (!state.selected) return;
    const { kind, id } = state.selected;
    if (kind === "piece") state.pieces = state.pieces.filter(p => p.id !== id);
    else state.shapes = state.shapes.filter(s => s.id !== id);
    deselect();
    renderAll(); save();
  };

  // Data
  $("#export-btn").onclick = exportData;
  $("#import-btn").onclick = () => importFileInput.click();
  importFileInput.onchange = () => {
    const f = importFileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        Object.assign(state, {
          bg: d.bg ?? null, worldW: d.worldW ?? 3000, worldH: d.worldH ?? 2000,
          grid: { ...state.grid, ...(d.grid || {}) },
          view: { ...state.view, ...(d.view || {}) },
          pieces: d.pieces || [], shapes: d.shapes || [], seq: d.seq || 1,
        });
        state.selected = null;
        syncGridInputs(); renderAll(); save();
        toast("Map imported.");
      } catch (err) { toast("Import failed — invalid file.", true); }
    };
    reader.readAsText(f);
    importFileInput.value = "";
  };
  function exportData() {
    const out = {
      bg: state.bg, worldW: state.worldW, worldH: state.worldH,
      grid: state.grid, view: state.view,
      pieces: state.pieces, shapes: state.shapes, seq: state.seq,
    };
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "field-map.json"; a.click();
    URL.revokeObjectURL(url);
  }

  $("#reset-btn").onclick = () => {
    if (!confirm("Clear the whole board? This removes the map, pieces and overlays.")) return;
    state.bg = null; state.pieces = []; state.shapes = []; state.selected = null;
    state.worldW = 3000; state.worldH = 2000;
    state.view = { tx: 60, ty: 60, scale: 1 };
    deselect(); renderAll(); save();
    toast("Board cleared.");
  };

  // Keyboard: Delete removes selection, Esc deselects
  window.addEventListener("keydown", e => {
    if (e.target.matches("input, textarea, select")) return;
    if ((e.key === "Delete" || e.key === "Backspace") && state.selected) {
      e.preventDefault(); $("#ed-delete").click();
    } else if (e.key === "Escape") {
      deselect(); closeEnemyMenu();
    }
  });

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
  syncGridInputs();
  renderAll();
  if (!state.bg && !state.pieces.length && !state.shapes.length) {
    // fresh start — center default world
    fitView();
  }
})();
