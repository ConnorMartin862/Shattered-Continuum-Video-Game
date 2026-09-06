// ── Challenge Overlay ─────────────────────────────────────────────
// Opens from the TV panel in the menu room (unlocked after level 10).
// Lets the player configure a custom level or launch true random (level 11).
// Mirrors the settings.js DOM mouse pattern exactly.

import { getCurrentLevel } from "../state/progress.js";

const W = 1280;
const H = 720;

const STORAGE_KEY = "sc_challenge";

// Panel
const PW = 580, PH = 620;
const PX = (W - PW) / 2;
const PY = (H - PH) / 2;

// Toggle
const TOG_Y      = PY + 68;
const TOG_W      = 200, TOG_H = 36;
const TOG_CX     = W / 2;
const CUS_X      = TOG_CX - TOG_W - 4;  // custom button x
const RND_X      = TOG_CX + 4;           // random button x

// Chunk count row
const CC_Y       = PY + 134;
const CC_BTN_W   = 28, CC_BTN_H = 28;
const CC_CX      = W / 2;

// Row keys / labels
const ROW_LABELS  = ["FLOOR", "BOX", "CATWALK", "SPIDER", "REAPER", "LIGHT"];
const ROW_KEYS    = ["floor", "box", "catwalk", "spider", "reaper", "light"];

const MIN_VAL     = 0;
const MAX_VAL     = 20;

// Grid layout for custom-mode value editors (3 wide x 2 tall)
const GRID_COLS  = 3;
const GRID_GAP_X = 15, GRID_GAP_Y = 20;
const CELL_W     = 170, CELL_H = 130;
const GRID_X     = PX + 20;
const GRID_Y     = PY + 190;
const BTN_W = 26, BTN_H = 22, BTN_GAP = 6;

function cellPos(i) {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    return {
        x: GRID_X + col * (CELL_W + GRID_GAP_X),
        y: GRID_Y + row * (CELL_H + GRID_GAP_Y),
    };
}

function drawGridButton(k, x, y, label, hovered) {
    k.drawRect({ pos: k.vec2(x, y), width: BTN_W, height: BTN_H,
                 color: hovered ? k.rgb(38, 26, 65) : k.rgb(20, 14, 38), opacity: 1 });
    k.drawText({ text: label, pos: k.vec2(x + (label.length > 1 ? 4 : 9), y + 4), size: 12,
                 font: "monospace", color: k.rgb(150, 128, 195), opacity: 1 });
}

// Enter button
const ENT_W = 200, ENT_H = 42;
const ENT_X = W / 2 - ENT_W / 2;
const ENT_Y = PY + PH - 68;

// Max Mode Button
const MAX_W = 160, MAX_H = 36;
const MAX_X = W / 2 - MAX_W / 2;
const MAX_Y = ENT_Y - 52;

function inRect(mx, my, x, y, w, h) {
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

function defaultSettings() {
    return {
        mode: "custom",  // "custom" or "random"
        chunkCount: 5,
        floor:   { min: 0, max: 20 },
        box:     { min: 0, max: 20 },
        catwalk: { min: 0, max: 20 },
        spider:  { min: 0, max: 20 },
        reaper:  { min: 0, max: 20 },
        light:   { min: 0, max: 20 },
    };
}

function loadSettings() {
    try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) return { ...defaultSettings(), ...JSON.parse(s) };
    } catch {}
    return defaultSettings();
}

function saveSettings(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function loadChallengeSettings() {
    return loadSettings();
}

export function createChallengeOverlay(k, onEnter) {
    let mouseX = 0, mouseY = 0, mouseBtn = false;

    let isOpen = false;

    const cfg = loadSettings();

    // Hover states
    let cusHover = false, rndHover = false;
    let ccMinHover = false, ccMaxHover = false;
    let entHover = false;
    let maxModeHover = false;

    const btnHover = {};
    for (const key of ROW_KEYS) {
        btnHover[key] = { maxZero: false, maxDec: false, maxInc: false, maxTwenty: false,
                           minZero: false, minDec: false, minInc: false, minTwenty: false };
    }

    function onMove(e) {
        const canvas = document.querySelector("canvas");
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        mouseX = (e.clientX - r.left) / r.width  * W;
        mouseY = (e.clientY - r.top)  / r.height * H;
    }

    function onDown(e) {
        if (e.button !== 0 || !isOpen) return;
        mouseBtn = true;

        // Mode toggle
        if (inRect(mouseX, mouseY, CUS_X, TOG_Y, TOG_W, TOG_H)) {
            cfg.mode = "custom"; saveSettings(cfg); return;
        }
        if (inRect(mouseX, mouseY, RND_X, TOG_Y, TOG_W, TOG_H)) {
            cfg.mode = "random"; saveSettings(cfg); return;
        }

        // Chunk count
        const ccMinX = CC_CX - 60 - CC_BTN_W;
        const ccMaxX = CC_CX + 60;
        if (inRect(mouseX, mouseY, ccMinX, CC_Y - CC_BTN_H / 2, CC_BTN_W, CC_BTN_H)) {
            cfg.chunkCount = Math.max(1, cfg.chunkCount - 1); saveSettings(cfg); return;
        }
        if (inRect(mouseX, mouseY, ccMaxX, CC_Y - CC_BTN_H / 2, CC_BTN_W, CC_BTN_H)) {
            cfg.chunkCount = Math.min(20, cfg.chunkCount + 1); saveSettings(cfg); return;
        }

        // Max
        if (inRect(mouseX, mouseY, MAX_X, MAX_Y, MAX_W, MAX_H)) {
            cfg.mode = "custom";
            cfg.chunkCount = 20;
            cfg.floor   = { min: 20, max: 20 };
            cfg.box     = { min: 20, max: 20 };
            cfg.catwalk = { min: 20, max: 20 };
            cfg.spider  = { min: 20, max: 20 };
            cfg.reaper  = { min: 20, max: 20 };
            cfg.light   = { min: 20, max: 20 };
            saveSettings(cfg);
            return;
        }

        // Enter
        if (inRect(mouseX, mouseY, ENT_X, ENT_Y, ENT_W, ENT_H)) {
            onEnter(cfg.mode === "custom" ? -2 : 11);
            return;
        }

        if (cfg.mode !== "custom") return;

        // Grid button clicks (min/max value editors)
        for (let i = 0; i < ROW_KEYS.length; i++) {
            const key = ROW_KEYS[i];
            const { x: cx, y: cy } = cellPos(i);
            const maxBtnY = cy + 34;
            const minBtnY = cy + 96;
            const btnRowX = cx + (CELL_W - (BTN_W * 4 + BTN_GAP * 3)) / 2;
            const bx0 = btnRowX, bx1 = bx0 + BTN_W + BTN_GAP, bx2 = bx1 + BTN_W + BTN_GAP, bx3 = bx2 + BTN_W + BTN_GAP;

            if (inRect(mouseX, mouseY, bx0, maxBtnY, BTN_W, BTN_H)) {
                cfg[key].max = 0;
                if (cfg[key].min > cfg[key].max) cfg[key].min = cfg[key].max;
                saveSettings(cfg); return;
            }
            if (inRect(mouseX, mouseY, bx1, maxBtnY, BTN_W, BTN_H)) {
                cfg[key].max = Math.max(cfg[key].min, cfg[key].max - 1);
                saveSettings(cfg); return;
            }
            if (inRect(mouseX, mouseY, bx2, maxBtnY, BTN_W, BTN_H)) {
                cfg[key].max = Math.min(MAX_VAL, cfg[key].max + 1);
                saveSettings(cfg); return;
            }
            if (inRect(mouseX, mouseY, bx3, maxBtnY, BTN_W, BTN_H)) {
                cfg[key].max = MAX_VAL;
                saveSettings(cfg); return;
            }

            if (inRect(mouseX, mouseY, bx0, minBtnY, BTN_W, BTN_H)) {
                cfg[key].min = 0;
                saveSettings(cfg); return;
            }
            if (inRect(mouseX, mouseY, bx1, minBtnY, BTN_W, BTN_H)) {
                cfg[key].min = Math.max(0, cfg[key].min - 1);
                saveSettings(cfg); return;
            }
            if (inRect(mouseX, mouseY, bx2, minBtnY, BTN_W, BTN_H)) {
                cfg[key].min = Math.min(cfg[key].max, cfg[key].min + 1);
                saveSettings(cfg); return;
            }
            if (inRect(mouseX, mouseY, bx3, minBtnY, BTN_W, BTN_H)) {
                cfg[key].min = MAX_VAL;
                if (cfg[key].max < cfg[key].min) cfg[key].max = cfg[key].min;
                saveSettings(cfg); return;
            }
        }
    }

    function onUp(e) {
        if (e.button !== 0) return;
        mouseBtn = false;
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);

    // ── Kaboom object ─────────────────────────────────────────────
    const overlay = k.add([k.pos(0, 0), k.z(200), k.fixed(), {
        update() {
            if (!isOpen) return;

            // Hover states
            cusHover = inRect(mouseX, mouseY, CUS_X, TOG_Y, TOG_W, TOG_H);
            rndHover = inRect(mouseX, mouseY, RND_X, TOG_Y, TOG_W, TOG_H);
            entHover = inRect(mouseX, mouseY, ENT_X, ENT_Y, ENT_W, ENT_H);

            const ccMinX = CC_CX - 60 - CC_BTN_W;
            const ccMaxX = CC_CX + 60;
            ccMinHover = inRect(mouseX, mouseY, ccMinX, CC_Y - CC_BTN_H / 2, CC_BTN_W, CC_BTN_H);
            ccMaxHover = inRect(mouseX, mouseY, ccMaxX, CC_Y - CC_BTN_H / 2, CC_BTN_W, CC_BTN_H);

            maxModeHover = inRect(mouseX, mouseY, MAX_X, MAX_Y, MAX_W, MAX_H);

            if (cfg.mode === "custom") {
                for (let i = 0; i < ROW_KEYS.length; i++) {
                    const key = ROW_KEYS[i];
                    const { x: cx, y: cy } = cellPos(i);
                    const maxBtnY = cy + 34;
                    const minBtnY = cy + 96;
                    const btnRowX = cx + (CELL_W - (BTN_W * 4 + BTN_GAP * 3)) / 2;
                    const bx0 = btnRowX, bx1 = bx0 + BTN_W + BTN_GAP, bx2 = bx1 + BTN_W + BTN_GAP, bx3 = bx2 + BTN_W + BTN_GAP;                    const h = btnHover[key];
                    h.maxZero   = inRect(mouseX, mouseY, bx0, maxBtnY, BTN_W, BTN_H);
                    h.maxDec    = inRect(mouseX, mouseY, bx1, maxBtnY, BTN_W, BTN_H);
                    h.maxInc    = inRect(mouseX, mouseY, bx2, maxBtnY, BTN_W, BTN_H);
                    h.maxTwenty = inRect(mouseX, mouseY, bx3, maxBtnY, BTN_W, BTN_H);
                    h.minZero   = inRect(mouseX, mouseY, bx0, minBtnY, BTN_W, BTN_H);
                    h.minDec    = inRect(mouseX, mouseY, bx1, minBtnY, BTN_W, BTN_H);
                    h.minInc    = inRect(mouseX, mouseY, bx2, minBtnY, BTN_W, BTN_H);
                    h.minTwenty = inRect(mouseX, mouseY, bx3, minBtnY, BTN_W, BTN_H);
                }
            }
        },

        draw() {
            if (!isOpen) return;

            // Scrim
            k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(0, 0, 0), opacity: 0.78 });

            // Panel border + fill
            k.drawRect({ pos: k.vec2(PX - 1, PY - 1), width: PW + 2, height: PH + 2, color: k.rgb(55, 40, 88), opacity: 0.85 });
            k.drawRect({ pos: k.vec2(PX, PY), width: PW, height: PH, color: k.rgb(10, 8, 22), opacity: 0.97 });
            k.drawRect({ pos: k.vec2(PX, PY), width: PW, height: 3, color: k.rgb(88, 60, 138), opacity: 0.9 });

            // Title
            k.drawText({ text: "CHALLENGE MODE", pos: k.vec2(W / 2 - 90, PY + 24), size: 20, font: "monospace", color: k.rgb(190, 182, 220), opacity: 0.92 });

            // Divider
            k.drawRect({ pos: k.vec2(PX + 22, PY + 56), width: PW - 44, height: 1, color: k.rgb(42, 30, 65), opacity: 0.9 });

            // ── Mode toggle ───────────────────────────────────────
            const cusActive = cfg.mode === "custom";
            const rndActive = cfg.mode === "random";

            // Custom button
            k.drawRect({ pos: k.vec2(CUS_X - 1, TOG_Y - 1), width: TOG_W + 2, height: TOG_H + 2,
                         color: k.rgb(55, 40, 88), opacity: cusActive ? 0.9 : 0.4 });
            k.drawRect({ pos: k.vec2(CUS_X, TOG_Y), width: TOG_W, height: TOG_H,
                         color: cusActive ? k.rgb(38, 26, 65) : k.rgb(14, 10, 28), opacity: 1 });
            k.drawText({ text: "CUSTOM", pos: k.vec2(CUS_X + TOG_W / 2 - 36, TOG_Y + 10), size: 14,
                         font: "monospace", color: cusActive ? k.rgb(175, 145, 230) : k.rgb(90, 75, 120), opacity: 1 });

            // Random button
            k.drawRect({ pos: k.vec2(RND_X - 1, TOG_Y - 1), width: TOG_W + 2, height: TOG_H + 2,
                         color: k.rgb(55, 40, 88), opacity: rndActive ? 0.9 : 0.4 });
            k.drawRect({ pos: k.vec2(RND_X, TOG_Y), width: TOG_W, height: TOG_H,
                         color: rndActive ? k.rgb(38, 26, 65) : k.rgb(14, 10, 28), opacity: 1 });
            k.drawText({ text: "RANDOM", pos: k.vec2(RND_X + TOG_W / 2 - 38, TOG_Y + 10), size: 14,
                         font: "monospace", color: rndActive ? k.rgb(175, 145, 230) : k.rgb(90, 75, 120), opacity: 1 });

            // ── Chunk count ───────────────────────────────────────
            k.drawText({ text: "CHUNKS", pos: k.vec2(W / 2 - 28, CC_Y - 22), size: 11,
                         font: "monospace", color: k.rgb(110, 95, 145), opacity: 0.8 });

            const ccMinX = CC_CX - 60 - CC_BTN_W;
            const ccMaxX = CC_CX + 60;

            // minus button
            k.drawRect({ pos: k.vec2(ccMinX, CC_Y - CC_BTN_H / 2), width: CC_BTN_W, height: CC_BTN_H,
                         color: ccMinHover ? k.rgb(38, 26, 65) : k.rgb(20, 14, 38), opacity: 1 });
            k.drawText({ text: "-", pos: k.vec2(ccMinX + 8, CC_Y - 10), size: 18,
                         font: "monospace", color: k.rgb(160, 135, 205), opacity: 1 });

            // count display
            k.drawText({ text: cfg.chunkCount.toString(), pos: k.vec2(CC_CX - 6, CC_Y - 10), size: 18,
                         font: "monospace", color: k.rgb(195, 180, 225), opacity: 1 });

            // plus button
            k.drawRect({ pos: k.vec2(ccMaxX, CC_Y - CC_BTN_H / 2), width: CC_BTN_W, height: CC_BTN_H,
                         color: ccMaxHover ? k.rgb(38, 26, 65) : k.rgb(20, 14, 38), opacity: 1 });
            k.drawText({ text: "+", pos: k.vec2(ccMaxX + 6, CC_Y - 10), size: 18,
                         font: "monospace", color: k.rgb(160, 135, 205), opacity: 1 });

            // Divider below chunk count
            k.drawRect({ pos: k.vec2(PX + 22, CC_Y + 24), width: PW - 44, height: 1,
                         color: k.rgb(42, 30, 65), opacity: 0.7 });

            // ── Value grid (custom mode only) ──────────────────────
            if (cfg.mode === "custom") {
                for (let i = 0; i < ROW_KEYS.length; i++) {
                    const key   = ROW_KEYS[i];
                    const label = ROW_LABELS[i];
                    const range = cfg[key];
                    const { x: cx, y: cy } = cellPos(i);
                    const h = btnHover[key];

                    k.drawRect({ pos: k.vec2(cx - 6, cy - 6), width: CELL_W + 12, height: CELL_H + 12,
                                 color: k.rgb(18, 14, 32), opacity: 0.5 });

                    k.drawText({ text: label, pos: k.vec2(cx + (CELL_W - label.length * 8) / 2, cy), size: 13,
             font: "monospace", color: k.rgb(150, 130, 190), opacity: 0.9 });

                    const maxBtnY = cy + 34;
                    const btnRowX = cx + (CELL_W - (BTN_W * 4 + BTN_GAP * 3)) / 2;
                    const bx0 = btnRowX, bx1 = bx0 + BTN_W + BTN_GAP, bx2 = bx1 + BTN_W + BTN_GAP, bx3 = bx2 + BTN_W + BTN_GAP;
                   k.drawText({ text: "Max:", pos: k.vec2(cx + (CELL_W - 4 * 11) / 2, cy + 20), size: 15,
             font: "monospace", color: k.rgb(160, 145, 205), opacity: 0.95 });
                    drawGridButton(k, bx0, maxBtnY, "0",  h.maxZero);
                    drawGridButton(k, bx1, maxBtnY, "<",  h.maxDec);
                    drawGridButton(k, bx2, maxBtnY, ">",  h.maxInc);
                    drawGridButton(k, bx3, maxBtnY, "20", h.maxTwenty);
                    k.drawText({ text: range.max.toString(), pos: k.vec2(cx + (CELL_W - range.max.toString().length * 9) / 2, maxBtnY + 30), size: 14,
             font: "monospace", color: k.rgb(195, 180, 225), opacity: 1 });

                    const minBtnY = cy + 96;
                    k.drawText({ text: "Min:", pos: k.vec2(cx + (CELL_W - 4 * 11) / 2, cy + 82), size: 15,
             font: "monospace", color: k.rgb(160, 145, 205), opacity: 0.95 });
                    drawGridButton(k, bx0, minBtnY, "0",  h.minZero);
                    drawGridButton(k, bx1, minBtnY, "<",  h.minDec);
                    drawGridButton(k, bx2, minBtnY, ">",  h.minInc);
                    drawGridButton(k, bx3, minBtnY, "20", h.minTwenty);
                    k.drawText({ text: range.min.toString(), pos: k.vec2(cx + (CELL_W - range.min.toString().length * 9) / 2, minBtnY + 30), size: 14,
             font: "monospace", color: k.rgb(195, 180, 225), opacity: 1 });
                }
            } else {
                // Random mode — just show a note
                k.drawText({ text: "Fully random — all rolls 0 to 20",
                             pos: k.vec2(W / 2 - 148, GRID_Y + 20),
                             size: 13, font: "monospace", color: k.rgb(100, 88, 130), opacity: 0.7 });
            }

            // Max Button

            k.drawRect({ pos: k.vec2(MAX_X - 1, MAX_Y - 1), width: MAX_W + 2, height: MAX_H + 2,
                        color: k.rgb(88, 40, 40), opacity: maxModeHover ? 0.95 : 0.6 });
            k.drawRect({ pos: k.vec2(MAX_X, MAX_Y), width: MAX_W, height: MAX_H,
                        color: maxModeHover ? k.rgb(65, 22, 22) : k.rgb(28, 10, 10), opacity: 1 });
            k.drawText({ text: "MAX MODE", pos: k.vec2(MAX_X + MAX_W / 2 - 46, MAX_Y + 11),
                        size: 14, font: "monospace",
                        color: maxModeHover ? k.rgb(235, 90, 90) : k.rgb(175, 60, 60), opacity: 1 });

            // ── Enter button ──────────────────────────────────────
            k.drawRect({ pos: k.vec2(ENT_X - 1, ENT_Y - 1), width: ENT_W + 2, height: ENT_H + 2,
                         color: k.rgb(55, 40, 88), opacity: entHover ? 0.95 : 0.6 });
            k.drawRect({ pos: k.vec2(ENT_X, ENT_Y), width: ENT_W, height: ENT_H,
                         color: entHover ? k.rgb(38, 26, 65) : k.rgb(18, 12, 35), opacity: 1 });
            k.drawText({ text: "ENTER", pos: k.vec2(ENT_X + ENT_W / 2 - 30, ENT_Y + 13),
                         size: 14, font: "monospace", color: entHover ? k.rgb(185, 155, 235) : k.rgb(130, 105, 175), opacity: 1 });

            // Close hint
            k.drawText({ text: "[ ESC ]  close", pos: k.vec2(PX + PW / 2 - 58, PY + PH - 24),
                         size: 12, font: "monospace", color: k.rgb(68, 58, 88), opacity: 0.55 });
        },
    }]);

    overlay.onDestroy(() => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("mouseup",   onUp);
    });

    k.onKeyPress("escape", () => {
        if (isOpen) { isOpen = false; saveSettings(cfg); }
    });

    return {
        open()    { isOpen = true; },
        close()   { isOpen = false; saveSettings(cfg); },
        isOpen()  { return isOpen; },
    };
}