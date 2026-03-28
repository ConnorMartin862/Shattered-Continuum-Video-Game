// ── Random Chunk (prototype) ──────────────────────────────────────
// Factor: Floor gaps — fixed at difficulty 12 (large gap tier)
// One large gap with a single flickering platform.
// Freeze ability holds the platform in place.
// Falling triggers death flash then full level reload.

import { freeze } from "../state/freezeState.js";

export const CHUNK_W = Math.floor(1280 * 2 / 3); // 853

const FLOOR_Y = 578;
const CEIL_H = 48;
const WALL_T = 82;
const H = 720;  // ← add this

const COL_WALL = [14, 12, 26];
const COL_FLOOR = [16, 13, 28];
const COL_TRIM = [22, 18, 40];

// Gap layout
const GAP_START = 280;  // x relative to xOff where gap begins
const GAP_WIDTH = 260;  // wide enough that Isaac can't jump across

// Flickering platform — sits in the middle of the gap
const PLAT_W = 80;
const PLAT_H = 10;
const PLAT_REL_X = GAP_START + (GAP_WIDTH / 2) - (PLAT_W / 2);
const PLAT_Y = FLOOR_Y - 8; // flush with floor level so jump timing matters

// Platform cycle — 1 second total, 0.5s visible, 0.5s invisible
const PLAT_CYCLE = 1.0;
const PLAT_VISIBLE = 0.5;

export function buildRandomChunk(k, xOff = 0, onDeath) {
    let isDead = false;


    // ── Floor mode ────────────────────────────────────────────────
    // 0 = solid floor, no obstacles
    // 1 = large gap with flickering platform (freeze required)
    // 2 = small gap, jumpable without ability
    const floorMode = 2; // ← change this to test different modes

    // ── Floor layout based on floorMode ──────────────────────────
    if (floorMode === 0) {
        // Solid floor — nothing special, full floor across chunk
        k.add([
            k.rect(CHUNK_W, 20),
            k.pos(xOff, FLOOR_Y),
            k.color(...COL_FLOOR),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
        k.add([k.rect(CHUNK_W , 2), k.pos(xOff, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);

    } else if (floorMode === 1) {
        // Large gap — flickering platform, freeze required
        // ── Left floor section ────────────────────────────────────
        k.add([
            k.rect(GAP_START, 20),
            k.pos(xOff + WALL_T, FLOOR_Y),
            k.color(...COL_FLOOR),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
        k.add([k.rect(GAP_START, 2), k.pos(xOff + WALL_T, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);

        // ── Right floor section ───────────────────────────────────
        const rightStart = GAP_START + GAP_WIDTH;
        const rightWidth = CHUNK_W - WALL_T - rightStart;
        k.add([
            k.rect(rightWidth, 20),
            k.pos(xOff + WALL_T + rightStart, FLOOR_Y),
            k.color(...COL_FLOOR),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
        k.add([k.rect(rightWidth, 2), k.pos(xOff + WALL_T + rightStart, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);

        // ── Gap darkness + flickering platform ────────────────────
        // ── Flickering platform ───────────────────────────────────────
        let platTimer = 0;
        let platVisible = true;

        const platBody = k.add([
            k.rect(PLAT_W, PLAT_H),
            k.pos(xOff + WALL_T + PLAT_REL_X, PLAT_Y),
            k.color(55, 44, 82),
            k.area(),
            k.body({ isStatic: true }),
            k.z(8),
            "flickerPlat",
        ]);

        // Visual glow on platform
        const platVisual = k.add([
            k.pos(0, 0),
            k.z(9),
            {
                draw() {
                    if (!platVisible) return;
                    const px = xOff + WALL_T + PLAT_REL_X;
                    const py = PLAT_Y;
                    // Platform glow
                    k.drawRect({
                        pos: k.vec2(px - 4, py - 4),
                        width: PLAT_W + 8,
                        height: PLAT_H + 8,
                        color: k.rgb(120, 80, 200),
                        opacity: 0.18,
                        radius: 3,
                    });
                    // Platform surface
                    k.drawRect({
                        pos: k.vec2(px, py),
                        width: PLAT_W,
                        height: PLAT_H,
                        color: k.rgb(88, 62, 138),
                        opacity: 0.95,
                        radius: 2,
                    });
                    // Top highlight
                    k.drawRect({
                        pos: k.vec2(px + 2, py),
                        width: PLAT_W - 4,
                        height: 2,
                        color: k.rgb(160, 130, 210),
                        opacity: 0.6,
                    });
                },
            },
        ]);

        // Store the on and off positions
        const platOnY = PLAT_Y;
        const platOffY = H + 200; // far below screen, effectively removed

        // Platform update — handles flicker cycle
        k.add([k.pos(0, 0), {
            update() {
                if (isDead) return;
                if (freeze.active) return;

                platTimer += k.dt();
                if (platTimer >= PLAT_CYCLE) platTimer = 0;

                const shouldBeVisible = platTimer < PLAT_VISIBLE;

                if (shouldBeVisible !== platVisible) {
                    platVisible = shouldBeVisible;
                    if (platVisible) {
                        platBody.pos.y = platOnY;
                    } else {
                        platBody.pos.y = platOffY;
                    }
                }
            },
        }]);


        // ── Gap visual — darkness in the pit ─────────────────────────
        k.add([
            k.pos(0, 0),
            k.z(1),
            {
                draw() {
                    // Dark pit
                    k.drawRect({
                        pos: k.vec2(xOff + WALL_T + GAP_START, FLOOR_Y),
                        width: GAP_WIDTH,
                        height: 200,
                        color: k.rgb(4, 3, 9),
                        opacity: 0.95,
                    });
                    // Pit edge fade left
                    for (let i = 0; i < 8; i++) {
                        const t = i / 8;
                        k.drawRect({
                            pos: k.vec2(xOff + WALL_T + GAP_START - (8 - i) * 3, FLOOR_Y),
                            width: (8 - i) * 3,
                            height: 200,
                            color: k.rgb(4, 3, 9),
                            opacity: (1 - t) * 0.6,
                        });
                    }
                    // Pit edge fade right
                    for (let i = 0; i < 8; i++) {
                        const t = i / 8;
                        k.drawRect({
                            pos: k.vec2(xOff + WALL_T + GAP_START + GAP_WIDTH, FLOOR_Y),
                            width: (8 - i) * 3,
                            height: 200,
                            color: k.rgb(4, 3, 9),
                            opacity: (1 - t) * 0.6,
                        });
                    }
                },
            },
        ]);

        // ... all your existing gap visual and platform code stays here unchanged

    } else if (floorMode === 2) {
        // Small gap — jumpable, no platform needed
        const SMALL_GAP_START = 402;
        const SMALL_GAP_WIDTH = 90; // narrow enough to jump across

        // Left section
        k.add([
            k.rect(SMALL_GAP_START, 20),
            k.pos(xOff, FLOOR_Y),
            k.color(...COL_FLOOR),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
        k.add([k.rect(SMALL_GAP_START, 2), k.pos(xOff, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);

        // Right section
        const smallRightStart = SMALL_GAP_START + SMALL_GAP_WIDTH;
        const smallRightWidth = CHUNK_W - smallRightStart;
        k.add([
            k.rect(smallRightWidth, 20),
            k.pos(xOff + smallRightStart, FLOOR_Y),
            k.color(...COL_FLOOR),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
        k.add([k.rect(smallRightWidth, 2), k.pos(xOff + smallRightStart, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);

        // Gap darkness
        k.add([k.pos(0, 0), k.z(1), {
            draw() {
                k.drawRect({
                    pos: k.vec2(xOff + SMALL_GAP_START, FLOOR_Y),
                    width: SMALL_GAP_WIDTH,
                    height: 200,
                    color: k.rgb(4, 3, 9),
                    opacity: 0.95,
                });
            },
        }]);
    }

    // ── Kill zone (invisible floor below screen) ──────────────────
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
                    freeze.timer = 0;
                    if (onDeath) onDeath();
                    else k.go("level");
                }
            }
        });
    }

    // Return API for level.js
    return {
        checkDeath(isaac) {
            if (isDead) return;
            // Isaac fell below the floor
            if (isaac.pos.y > FLOOR_Y + 80) {
                triggerDeath();
            }
        },
    };
}