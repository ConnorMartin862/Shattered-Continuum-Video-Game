// ── Random Chunk ──────────────────────────────────────────────────
import { freeze } from "../state/freezeState.js";

export const CHUNK_W = Math.floor(1280 * 2 / 3); // 853

const FLOOR_Y = 578;
const CEIL_H  = 48;
const WALL_T  = 82;
const H       = 720;
const offset = 25

const COL_WALL  = [14, 12, 26];
const COL_FLOOR = [16, 13, 28];
const COL_TRIM  = [22, 18, 40];

// Flickering platform dimensions
const PLAT_W       = 80;
const PLAT_H       = 10;
const PLAT_Y       = FLOOR_Y - 8;
const PLAT_CYCLE   = 1.0;
const PLAT_VISIBLE = 0.5;

// ── Helper: draw a floor section with collision ───────────────────
function addFloor(k, x, w) {
    k.add([k.rect(w, 20), k.pos(x, FLOOR_Y), k.color(...COL_FLOOR), k.area(), k.body({ isStatic: true }), k.z(0)]);
    k.add([k.rect(w, 2),  k.pos(x, FLOOR_Y), k.color(...COL_TRIM),  k.opacity(0.9), k.z(0)]);
}

// ── Helper: draw gap darkness ─────────────────────────────────────
function addGapDarkness(k, gapX, gapW) {
    k.add([k.pos(0, 0), k.z(1), {
        draw() {
            k.drawRect({ pos: k.vec2(gapX, FLOOR_Y), width: gapW, height: 200, color: k.rgb(4, 3, 9), opacity: 0.95 });
            for (let i = 0; i < 8; i++) {
                const t = i / 8;
                k.drawRect({ pos: k.vec2(gapX - (8 - i) * 3, FLOOR_Y), width: (8 - i) * 3, height: 200, color: k.rgb(4, 3, 9), opacity: (1 - t) * 0.6 });
                k.drawRect({ pos: k.vec2(gapX + gapW,         FLOOR_Y), width: (8 - i) * 3, height: 200, color: k.rgb(4, 3, 9), opacity: (1 - t) * 0.6 });
            }
        },
    }]);
}

// ── Helper: create a flickering platform ─────────────────────────
function addFlickerPlat(k, x, phaseOffset, cycleOverride, isDead) {
    let platTimer   = phaseOffset;
    let platVisible = platTimer < PLAT_VISIBLE;
    const platOnY   = PLAT_Y;
    const platOffY  = H + 200;
    const cycle     = cycleOverride || PLAT_CYCLE;

    const platBody = k.add([
        k.rect(PLAT_W, PLAT_H),
        k.pos(x, platVisible ? platOnY : platOffY),
        k.color(55, 44, 82),
        k.area(),
        k.body({ isStatic: true }),
        k.z(8),
    ]);

    k.add([k.pos(0, 0), k.z(9), {
        draw() {
            if (!platVisible) return;
            k.drawRect({ pos: k.vec2(x - 4, PLAT_Y - 4), width: PLAT_W + 8, height: PLAT_H + 8, color: k.rgb(120, 80, 200), opacity: 0.18, radius: 3 });
            k.drawRect({ pos: k.vec2(x,     PLAT_Y),     width: PLAT_W,     height: PLAT_H,     color: k.rgb(88, 62, 138),  opacity: 0.95, radius: 2 });
            k.drawRect({ pos: k.vec2(x + 2, PLAT_Y),     width: PLAT_W - 4, height: 2,          color: k.rgb(160, 130, 210), opacity: 0.6 });
        },
    }]);

    k.add([k.pos(0, 0), {
        update() {
            if (isDead()) return;
            if (freeze.active) return;
            platTimer += k.dt();
            if (platTimer >= cycle) platTimer = 0;
            const shouldBeVisible = platTimer < PLAT_VISIBLE;
            if (shouldBeVisible !== platVisible) {
                platVisible = shouldBeVisible;
                platBody.pos.y = platVisible ? platOnY : platOffY;
            }
        },
    }]);
}

export function buildRandomChunk(k, xOff = 0, onDeath) {
    let isDead = false;

    // 0 = solid floor
    // 1 = large gap, one flickering platform
    // 2 = small gap, jumpable
    // 3 = extreme gap, three flickering platforms
    const floorRoll = Math.floor(Math.random() * 21); // 0-20 inclusive

    let floorMode;
    if (floorRoll <= 3)       floorMode = 0; // solid floor
    else if (floorRoll <= 8)  floorMode = 2; // small gap
    else if (floorRoll <= 15) floorMode = 1; // large gap, one platform
    else                 floorMode = 3; // extreme gap, three platforms

    if (floorMode === 0) {
        // ── Solid floor ───────────────────────────────────────────
        addFloor(k, xOff, CHUNK_W);

    } else if (floorMode === 1) {
        // ── Large gap — one flickering platform ───────────────────
        const GAP_START = 280;
        const GAP_WIDTH = 260;
        const GAP_END   = GAP_START + GAP_WIDTH;

        addFloor(k, xOff,              GAP_START - offset);
        addFloor(k, xOff + GAP_END + offset,    CHUNK_W - GAP_END - offset);
        addGapDarkness(k, xOff + GAP_START, GAP_WIDTH);

        const platX = xOff + GAP_START + (GAP_WIDTH / 2) - (PLAT_W / 2);
        addFlickerPlat(k, platX, 0, PLAT_CYCLE, () => isDead);

    } else if (floorMode === 2) {
        // ── Small gap — jumpable ──────────────────────────────────
        const GAP_START = 380;
        const GAP_WIDTH = 90;
        const GAP_END   = GAP_START + GAP_WIDTH;

        addFloor(k, xOff,              GAP_START - offset);
        addFloor(k, xOff + GAP_END + offset,    CHUNK_W - GAP_END - offset);
        addGapDarkness(k, xOff + GAP_START, GAP_WIDTH);

    } else if (floorMode === 3) {
        // ── Extreme gap — three flickering platforms ──────────────
        const GAP_START = 160;
        const GAP_WIDTH = 480;
        const GAP_END   = GAP_START + GAP_WIDTH;

        addFloor(k, xOff,              GAP_START - offset);
        addFloor(k, xOff + GAP_END + offset,    CHUNK_W - GAP_END - offset);
        addGapDarkness(k, xOff + GAP_START, GAP_WIDTH);

        const spacing = GAP_WIDTH / 4;
        const platDefs = [
            { offset: spacing * 1, phase: 0,    cycle: 1.6 },
            { offset: spacing * 2, phase: 0.33, cycle: 1.0 },
            { offset: spacing * 3, phase: 0.66, cycle: 1.0 },
        ];

        for (const pd of platDefs) {
            const platX = xOff + GAP_START + pd.offset - PLAT_W / 2;
            addFlickerPlat(k, platX, pd.phase, pd.cycle, () => isDead);
        }
    }

    // ── Kill zone ─────────────────────────────────────────────────
    k.add([
        k.rect(CHUNK_W, 20),
        k.pos(xOff, H + 40),
        k.area(),
        k.body({ isStatic: true }),
        k.z(0),
        "killZone",
    ]);

    // ── Death trigger ─────────────────────────────────────────────
    function triggerDeath() {
        if (isDead) return;
        isDead = true;

        const flash = k.add([
            k.rect(1280, 720),
            k.pos(0, 0),
            k.color(180, 60, 60),
            k.opacity(0),
            k.z(150),
            k.fixed(),
        ]);

        let phase = 0;
        let timer = 0;

        const ev = k.onUpdate(() => {
            timer += k.dt();
            if (phase === 0) {
                flash.opacity = Math.min(timer / 0.1, 0.85);
                if (timer >= 0.1) { phase = 1; timer = 0; }
            } else if (phase === 1) {
                if (timer >= 0.15) { phase = 2; timer = 0; }
            } else {
                flash.opacity = Math.max(0.85 - timer / 0.3, 0);
                if (timer >= 0.3) {
                    ev.cancel();
                    freeze.active = false;
                    freeze.timer  = 0;
                    if (onDeath) onDeath();
                    else k.go("level");
                }
            }
        });
    }

    return {
        checkDeath(isaac) {
            if (isDead) return;
            if (isaac.pos.y > FLOOR_Y + 80) triggerDeath();
        },
    };
}