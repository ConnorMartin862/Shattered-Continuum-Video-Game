// ── Random Chunk ──────────────────────────────────────────────────
import { freeze } from "../state/freezeState.js";

export const CHUNK_W = Math.floor(1280 * 2 / 3); // 853

const FLOOR_Y = 578;
const CEIL_H  = 48;
const WALL_T  = 82;
const H       = 720;
const offset = 25;

let fogAdded = false;

const COL_WALL  = [14, 12, 26];
const COL_FLOOR = [16, 13, 28];
const COL_TRIM  = [22, 18, 40];

// Flickering platform dimensions
const PLAT_W       = 80;
const PLAT_H       = 10;
const PLAT_Y       = FLOOR_Y - 8;
const PLAT_CYCLE   = 1.0;
const PLAT_VISIBLE = 0.5;

// Catwalk
const CAT_Y       = CEIL_H + 160;
const CAT_BOARD_W = 200;
const CAT_BOARD_H = 12;

// ── Helper: roll within a [min, max] range (inclusive) ────────────
function rollInRange([min, max]) {
    return Math.floor(min + Math.random() * (max - min + 1));
}

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

// ── Helper: chunk lighting ────────────────────────────────────────
function addLighting(k, xOff, hasFog, getIsDead) {
    if (!hasFog) {
        const bulbX = xOff + CHUNK_W / 2;
        k.add([k.rect(6, 14), k.pos(bulbX - 3, CEIL_H - 14), k.color(38, 34, 55), k.z(0)]);
        k.add([k.circle(4), k.pos(bulbX, CEIL_H + 1), k.color(168, 162, 225), k.opacity(0.65), k.z(0)]);
        k.add([k.pos(0, 0), k.z(5), {
            draw() {
                for (let i = 28; i >= 0; i--) {
                    const t = i / 28;
                    k.drawCircle({
                        pos:     k.vec2(bulbX, CEIL_H),
                        radius:  420 * t,
                        color:   k.rgb(155, 162, 215),
                        opacity: Math.pow(1 - t, 2.2) * 0.2,
                    });
                }
            },
        }]);
        return;
    }

    if (fogAdded) return;
    fogAdded = true;

    let fogTimer = 0;
    k.add([k.pos(0, 0), k.z(78), k.fixed(), {
        update() {
            fogTimer += k.dt();
        },
        draw() {
            if (getIsDead && getIsDead()) return;

            const camX       = k.camPos().x;
            const chunkLeft  = xOff - 1280 / 2;
            const chunkRight = xOff + CHUNK_W + 1280 / 2;
            if (camX < chunkLeft || camX > chunkRight) return;

            k.drawRect({ pos: k.vec2(0, 0), width: 1280, height: 720, color: k.rgb(4, 3, 9), opacity: 0.55 });

            for (let i = 0; i < 5; i++) {
                const speed   = 0.08 + i * 0.03;
                const yPos    = 120 + i * 120;
                const drift   = Math.sin(fogTimer * speed + i * 1.8) * 40;
                const opacity = 0.06 + Math.sin(fogTimer * 0.4 + i) * 0.03;
                k.drawRect({
                    pos:     k.vec2(drift, yPos),
                    width:   1280,
                    height:  60,
                    color:   k.rgb(8, 6, 16),
                    opacity: Math.max(opacity, 0.03),
                });
            }

            const screenCX = 1280 / 2;
            const screenCY = 720 / 2;
            for (let i = 8; i >= 0; i--) {
                const t = i / 8;
                k.drawCircle({
                    pos:     k.vec2(screenCX, screenCY + 60),
                    radius:  80 * t,
                    color:   k.rgb(20, 16, 35),
                    opacity: (1 - t) * 0.35,
                });
            }
        },
    }]);
}

function addSmiley(k, xOff, getIsaac, triggerDeath) {
    const SPEED      = 185 * 1.5;
    const RADIUS     = 22;
    const SPAWN_X    = xOff;
    const SPAWN_Y    = CAT_Y - 40;

    let smileyX   = SPAWN_X;
    let smileyY   = SPAWN_Y;
    let spawned   = false;
    let dead      = false;
    let despawned = false;

    let spawnTimer  = 0;
    const SPAWN_DUR = 1.2;
    let glitchX     = 0;
    let glitchY     = 0;
    let glitchTimer = 0;
    let opacity     = 0;

    k.add([k.pos(0, 0), k.z(22), {
        update() {
            if (dead || despawned) return;

            const isaac = getIsaac();
            if (!isaac) return;

            if (!spawned && isaac.pos.x > xOff) spawned = true;
            if (!spawned) return;

            if (spawnTimer < SPAWN_DUR) {
                spawnTimer  += k.dt();
                glitchTimer += k.dt();
                opacity      = Math.min(spawnTimer / SPAWN_DUR, 1);

                if (glitchTimer > 0.05) {
                    glitchTimer = 0;
                    const glitching = Math.random() < 0.7;
                    glitchX = glitching ? (Math.random() - 0.5) * 18 : 0;
                    glitchY = glitching ? (Math.random() - 0.5) * 12 : 0;
                }
                return;
            }

            glitchX = 0;
            glitchY = 0;
            opacity = 1;

            if (freeze.active) return;

            const dx   = isaac.pos.x + 13 - smileyX;
            const dy   = isaac.pos.y + 29 - smileyY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                smileyX += (dx / dist) * SPEED * k.dt();
                smileyY += (dy / dist) * SPEED * k.dt();
            }

            if (dist < RADIUS + 13) {
                dead = true;
                triggerDeath();
                return;
            }

            const camX   = k.camPos().x;
            const screenX = smileyX - (camX - 640);
            if (screenX < -100 || screenX > 1380) despawned = true;
        },

        draw() {
            if (despawned || !spawned) return;

            const sx = smileyX + glitchX;
            const sy = smileyY + glitchY;

            if (spawnTimer < SPAWN_DUR) {
                k.drawCircle({ pos: k.vec2(sx + 4, sy), radius: RADIUS, color: k.rgb(180, 0, 0),   opacity: opacity * 0.3 });
                k.drawCircle({ pos: k.vec2(sx - 4, sy), radius: RADIUS, color: k.rgb(0, 0, 180),   opacity: opacity * 0.3 });
            }

            k.drawCircle({ pos: k.vec2(sx, sy), radius: RADIUS, color: k.rgb(0, 0, 0), opacity: opacity * 0.95 });

            for (let i = 3; i >= 0; i--) {
                const t = i / 3;
                k.drawCircle({ pos: k.vec2(sx, sy), radius: RADIUS + (3 - i) * 3, color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.12 * opacity });
            }

            k.drawCircle({ pos: k.vec2(sx - 8, sy - 6), radius: 4, color: k.rgb(240, 240, 240), opacity: opacity });
            k.drawCircle({ pos: k.vec2(sx + 8, sy - 6), radius: 4, color: k.rgb(240, 240, 240), opacity: opacity });
            k.drawCircle({ pos: k.vec2(sx - 8, sy - 5), radius: 2, color: k.rgb(10, 8, 16), opacity: opacity });
            k.drawCircle({ pos: k.vec2(sx + 8, sy - 5), radius: 2, color: k.rgb(10, 8, 16), opacity: opacity });

            const smilePoints = [[-10, 6], [-7, 9], [-3, 11], [0, 12], [3, 11], [7, 9], [10, 6]];
            for (let i = 0; i < smilePoints.length - 1; i++) {
                const [x1, y1] = smilePoints[i];
                const [x2, y2] = smilePoints[i + 1];
                k.drawLine({ p1: k.vec2(sx + x1, sy + y1), p2: k.vec2(sx + x2, sy + y2), width: 2, color: k.rgb(240, 240, 240), opacity: opacity });
            }
        },
    }]);
}

// ── buildRandomChunk ──────────────────────────────────────────────
// rollRanges: optional object to bound each roll { floor, box, catwalk, light }
// Each entry is a [min, max] tuple. Omitted entries default to [0, 20].
export function buildRandomChunk(k, xOff = 0, onDeath, getIsaac, rollRanges = {}) {
    let isDead = false;

    const floorRange   = rollRanges.floor   ?? [0, 20];
    const boxRange     = rollRanges.box     ?? [0, 20];
    const catwalkRange = rollRanges.catwalk ?? [0, 20];
    const lightRange   = rollRanges.light   ?? [0, 20];

    // ── Lighting roll ─────────────────────────────────────────────
    const lightRoll = rollInRange(lightRange);
    const hasFog    = lightRoll > 13;
    const hasSmiley = lightRoll > 17;

    addLighting(k, xOff, hasFog, () => isDead);
    if (hasSmiley) addSmiley(k, xOff, getIsaac, () => triggerDeath());

    // ── Floor roll ────────────────────────────────────────────────
    // 0 = solid floor
    // 1 = large gap, one flickering platform
    // 2 = small gap, jumpable
    // 3 = extreme gap, three flickering platforms
    const floorRoll = rollInRange(floorRange);

    let floorMode;
    if (floorRoll <= 3)       floorMode = 0;
    else if (floorRoll <= 8)  floorMode = 2;
    else if (floorRoll <= 15) floorMode = 1;
    else                      floorMode = 3;

    if (floorMode === 0) {
        addFloor(k, xOff, CHUNK_W);

    } else if (floorMode === 1) {
        const GAP_START = 280;
        const GAP_WIDTH = 260;
        const GAP_END   = GAP_START + GAP_WIDTH;

        addFloor(k, xOff,                        GAP_START - offset);
        addFloor(k, xOff + GAP_END + offset,     CHUNK_W - GAP_END - offset);
        addGapDarkness(k, xOff + GAP_START, GAP_WIDTH);

        const platX = xOff + GAP_START + (GAP_WIDTH / 2) - (PLAT_W / 2);
        addFlickerPlat(k, platX, 0, PLAT_CYCLE, () => isDead);

    } else if (floorMode === 2) {
        const GAP_START = 380;
        const GAP_WIDTH = 90;
        const GAP_END   = GAP_START + GAP_WIDTH;

        addFloor(k, xOff,                        GAP_START - offset);
        addFloor(k, xOff + GAP_END + offset,     CHUNK_W - GAP_END - offset);
        addGapDarkness(k, xOff + GAP_START, GAP_WIDTH);

    } else if (floorMode === 3) {
        const GAP_START = 160;
        const GAP_WIDTH = 480;
        const GAP_END   = GAP_START + GAP_WIDTH;

        addFloor(k, xOff,                        GAP_START - offset);
        addFloor(k, xOff + GAP_END + offset,     CHUNK_W - GAP_END - offset);
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

    // ── Helper: check if x position is over a gap ─────────────────
    function isOverGap(x, floorMode) {
        if (floorMode === 0) return false;
        if (floorMode === 1) {
            const GAP_START = 280;
            const GAP_END   = GAP_START + 260;
            return x > GAP_START && x < GAP_END;
        }
        if (floorMode === 2) {
            const GAP_START = 380;
            const GAP_END   = GAP_START + 90;
            return x > GAP_START && x < GAP_END;
        }
        if (floorMode === 3) {
            const GAP_START = 160;
            const GAP_END   = GAP_START + 480;
            return x > GAP_START && x < GAP_END;
        }
        return false;
    }

    function addBoxes(k, xOff, numBoxes, shakingBoxNum, ghostBoxNum, floorMode) {
        const BOX_W     = 36;
        const BOX_H     = 36;
        const MARGIN    = WALL_T + BOX_W;
        const MAX_TRIES = 10;

        const spawnedX = [];

        // ── Regular boxes ─────────────────────────────────────────
        for (let i = 0; i < numBoxes; i++) {
            let boxX = null;

            for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
                const candidate = MARGIN + Math.random() * (CHUNK_W - MARGIN * 2);
                if (!isOverGap(candidate, floorMode)) {
                    boxX = candidate;
                    break;
                }
            }

            if (boxX === null) continue;

            const nearby = spawnedX.filter(sx => Math.abs(sx - boxX) < BOX_W * 2).length;
            const mass   = nearby > 0 ? 999 : 1;
            spawnedX.push(boxX);

            const box = k.add([
                k.rect(BOX_W, BOX_H),
                k.pos(xOff + boxX, FLOOR_Y - BOX_H),
                k.color(38, 30, 52),
                k.area(),
                k.body({ mass }),
                k.z(8),
            ]);

            k.add([k.pos(0, 0), k.z(9), {
                draw() {
                    const bx = box.pos.x;
                    const by = box.pos.y;
                    k.drawRect({ pos: k.vec2(bx, by), width: BOX_W, height: BOX_H, color: k.rgb(48, 38, 65), opacity: 0.95 });
                    k.drawRect({ pos: k.vec2(bx + 4, by + 4), width: BOX_W - 8, height: BOX_H - 8, color: k.rgb(32, 25, 45), opacity: 0.85 });
                    k.drawRect({ pos: k.vec2(bx + BOX_W / 2 - 1, by + 4), width: 2, height: BOX_H - 8, color: k.rgb(55, 44, 72), opacity: 0.6 });
                    k.drawRect({ pos: k.vec2(bx + 4, by + BOX_H / 2 - 1), width: BOX_W - 8, height: 2, color: k.rgb(55, 44, 72), opacity: 0.6 });
                },
            }]);
        }

        // ── Shaking boxes ─────────────────────────────────────────
        for (let i = 0; i < shakingBoxNum; i++) {
            let boxX = null;

            for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
                const candidate = MARGIN + Math.random() * (CHUNK_W - MARGIN * 2);
                if (!isOverGap(candidate, floorMode)) {
                    boxX = candidate;
                    break;
                }
            }

            if (boxX === null) continue;
            spawnedX.push(boxX);

            const baseX  = xOff + boxX;
            const baseY  = FLOOR_Y - BOX_H;

            const sBox = k.add([
                k.rect(BOX_W, BOX_H),
                k.pos(baseX, baseY),
                k.color(28, 20, 40),
                k.area(),
                k.body(),
                k.z(8),
            ]);

            let shakeTimer   = 0;
            let cycleTimer   = 0;
            const CYCLE      = 3.0;
            const SHAKE_DUR  = 1.0;
            let isShaking    = false;
            let shakeOffsetX = 0;
            let falling      = false;
            let fallVelY     = 0;
            let currentBaseX = baseX;

            k.add([k.pos(0, 0), k.z(9), {
                update() {
                    if (freeze.active) return;

                    if (!isShaking && !falling) {
                        currentBaseX = sBox.pos.x;
                        cycleTimer += k.dt();
                        if (cycleTimer >= CYCLE) {
                            isShaking  = true;
                            shakeTimer = 0;
                            cycleTimer = 0;
                        }
                    }

                    if (isShaking) {
                        shakeTimer += k.dt();
                        sBox.pos.x = currentBaseX + Math.sin(shakeTimer * 35) * 5;

                        const isaac = getIsaac ? getIsaac() : null;
                        if (isaac) {
                            const isaacLeft   = isaac.pos.x;
                            const isaacRight  = isaac.pos.x + 26;
                            const isaacTop    = isaac.pos.y;
                            const isaacBottom = isaac.pos.y + 58;
                            const boxLeft     = sBox.pos.x;
                            const boxRight    = sBox.pos.x + BOX_W;
                            const boxTop      = sBox.pos.y;
                            const boxBottom   = sBox.pos.y + BOX_H;

                            const touching = boxLeft < isaacRight &&
                                            boxRight > isaacLeft &&
                                            boxTop < isaacBottom &&
                                            boxBottom > isaacTop;

                            if (touching) {
                                const isaacCX = isaacLeft + 13;
                                const boxCX   = boxLeft + BOX_W / 2;

                                const isaacOnTop = isaacBottom <= boxTop + 8 &&
                                                isaacCX > boxLeft &&
                                                isaacCX < boxRight;

                                if (isaacOnTop) {
                                    isaac.jump(600);
                                    const pushDir = isaacCX < boxCX ? -1 : 1;
                                    isaac.move(pushDir * 800, 0);
                                } else {
                                    const pushDir = isaacCX < boxCX ? -1 : 1;
                                    let pushTimer = 0;
                                    const pushEv = k.onUpdate(() => {
                                        pushTimer += k.dt();
                                        isaac.move(pushDir * 2400, 0);
                                        if (pushTimer >= 0.18) pushEv.cancel();
                                    });
                                }
                            }
                        }

                        if (shakeTimer >= SHAKE_DUR) {
                            isShaking = false;
                            if (isOverGap(sBox.pos.x - xOff, floorMode)) {
                                falling = true;
                            }
                        }
                    }
                },

                draw() {
                    const bx = sBox.pos.x;
                    const by = sBox.pos.y;
                    k.drawRect({ pos: k.vec2(bx, by), width: BOX_W, height: BOX_H, color: isShaking ? k.rgb(65, 28, 28) : k.rgb(35, 26, 48), opacity: 0.95 });
                    k.drawRect({ pos: k.vec2(bx + 4, by + 4), width: BOX_W - 8, height: BOX_H - 8, color: k.rgb(24, 18, 35), opacity: 0.85 });
                    k.drawRect({ pos: k.vec2(bx + BOX_W / 2 - 1, by + 4), width: 2, height: BOX_H - 8, color: k.rgb(48, 36, 62), opacity: 0.6 });
                    k.drawRect({ pos: k.vec2(bx + 4, by + BOX_H / 2 - 1), width: BOX_W - 8, height: 2, color: k.rgb(48, 36, 62), opacity: 0.6 });
                },
            }]);
        }

        // ── Ghost boxes ───────────────────────────────────────────
        for (let i = 0; i < ghostBoxNum; i++) {
            let boxX = null;

            for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
                const candidate = MARGIN + Math.random() * (CHUNK_W - MARGIN * 2);
                if (!isOverGap(candidate, floorMode)) {
                    boxX = candidate;
                    break;
                }
            }

            if (boxX === null) continue;
            spawnedX.push(boxX);

            const absX = xOff + boxX;
            const absY = FLOOR_Y - BOX_H;

            const PULL_RANGE = BOX_W * 2.5;
            const PULL_FORCE = 1800;
            const GLOW_DUR   = 2.0;
            const RED_DUR    = 1.0;

            let ghostPhase = "white";
            let ghostTimer = 0;
            let whiteDur   = 3 + Math.random() * 7;

            const gBox = k.add([
                k.rect(BOX_W, BOX_H),
                k.pos(absX, absY),
                k.color(220, 215, 235),
                k.area(),
                k.body({ mass: 999 }),
                k.z(8),
            ]);

            k.add([k.pos(0, 0), k.z(9), {
                update() {
                    if (freeze.active) return;

                    ghostTimer += k.dt();

                    if (ghostPhase === "white") {
                        if (ghostTimer >= whiteDur) {
                            ghostPhase = "glowing";
                            ghostTimer = 0;
                        }
                    } else if (ghostPhase === "glowing") {
                        if (ghostTimer >= GLOW_DUR) {
                            ghostPhase = "red";
                            ghostTimer = 0;
                        }
                    } else if (ghostPhase === "red") {
                        const isaac = getIsaac ? getIsaac() : null;
                        if (isaac) {
                            const isaacCX = isaac.pos.x + 13;
                            const boxCX   = gBox.pos.x + BOX_W / 2;
                            const dist    = Math.abs(isaacCX - boxCX);

                            if (dist < PULL_RANGE) {
                                const pullDir = isaacCX < boxCX ? 1 : -1;
                                isaac.move(pullDir * PULL_FORCE * k.dt() * 60, 0);

                                const isaacLeft   = isaac.pos.x;
                                const isaacRight  = isaac.pos.x + 26;
                                const isaacTop    = isaac.pos.y;
                                const isaacBottom = isaac.pos.y + 58;
                                const boxLeft     = gBox.pos.x;
                                const boxRight    = gBox.pos.x + BOX_W;
                                const boxTop      = gBox.pos.y;
                                const boxBottom   = gBox.pos.y + BOX_H;

                                const touching = boxLeft < isaacRight &&
                                                boxRight > isaacLeft &&
                                                boxTop < isaacBottom &&
                                                boxBottom > isaacTop;

                                const onTop = isaacBottom >= boxTop - 4 &&
                                            isaacBottom <= boxTop + 8 &&
                                            isaacRight > boxLeft &&
                                            isaacLeft < boxRight;

                                if (touching || onTop) triggerDeath();
                            }
                        }

                        if (ghostTimer >= RED_DUR) {
                            ghostPhase = "white";
                            ghostTimer = 0;
                            whiteDur   = 3 + Math.random() * 7;
                        }
                    }
                },

                draw() {
                    const bx = gBox.pos.x;
                    const by = gBox.pos.y;

                    if (ghostPhase === "white") {
                        k.drawRect({ pos: k.vec2(bx, by), width: BOX_W, height: BOX_H, color: k.rgb(220, 215, 235), opacity: 0.92 });
                        k.drawRect({ pos: k.vec2(bx + 4, by + 4), width: BOX_W - 8, height: BOX_H - 8, color: k.rgb(200, 195, 218), opacity: 0.7 });
                    } else if (ghostPhase === "glowing") {
                        const pulse = (Math.sin(ghostTimer * 4) + 1) / 2;
                        for (let g = 3; g >= 0; g--) {
                            const spread = (g + 1) * 6;
                            k.drawRect({
                                pos:     k.vec2(bx - spread, by - spread),
                                width:   BOX_W + spread * 2,
                                height:  BOX_H + spread * 2,
                                color:   k.rgb(140, 80, 200),
                                opacity: (0.04 + pulse * 0.06) * (4 - g) / 4,
                                radius:  2,
                            });
                        }
                        k.drawRect({ pos: k.vec2(bx, by), width: BOX_W, height: BOX_H, color: k.rgb(220, 215, 235), opacity: 0.92 });
                        k.drawRect({ pos: k.vec2(bx + 4, by + 4), width: BOX_W - 8, height: BOX_H - 8, color: k.rgb(200, 195, 218), opacity: 0.7 });
                    } else if (ghostPhase === "red") {
                        for (let g = 3; g >= 0; g--) {
                            const spread = (g + 1) * 8;
                            k.drawRect({
                                pos:     k.vec2(bx - spread, by - spread),
                                width:   BOX_W + spread * 2,
                                height:  BOX_H + spread * 2,
                                color:   k.rgb(200, 40, 40),
                                opacity: 0.08 * (4 - g) / 4,
                                radius:  2,
                            });
                        }
                        k.drawRect({
                            pos:     k.vec2(bx + BOX_W / 2 - PULL_RANGE, by + BOX_H),
                            width:   PULL_RANGE * 2,
                            height:  4,
                            color:   k.rgb(200, 40, 40),
                            opacity: 0.25,
                        });
                        k.drawRect({ pos: k.vec2(bx, by), width: BOX_W, height: BOX_H, color: k.rgb(200, 40, 40), opacity: 0.95 });
                        k.drawRect({ pos: k.vec2(bx + 4, by + 4), width: BOX_W - 8, height: BOX_H - 8, color: k.rgb(160, 20, 20), opacity: 0.85 });
                    }
                },
            }]);
        }
    }

    // ── Box roll ──────────────────────────────────────────────────
    // 0 = no boxes
    // 1 = normal boxes
    // 2 = shaking boxes
    // 3 = ghost boxes
    const boxRoll = rollInRange(boxRange);

    let boxMode;
    if (boxRoll <= 4)       boxMode = 0;
    else if (boxRoll <= 9)  boxMode = 1;
    else if (boxRoll <= 14) boxMode = 2;
    else                    boxMode = 3;

    if (boxMode === 1) {
        addBoxes(k, xOff, boxRoll - 4, 0, 0, floorMode);
    } else if (boxMode === 2) {
        addBoxes(k, xOff, 5 - (boxRoll - 9), boxRoll - 9, 0, floorMode);
    } else if (boxMode === 3) {
        addBoxes(k, xOff, 2, 3, (boxRoll - 14) / 2, floorMode);
    }

    // ── Catwalk helpers ───────────────────────────────────────────
    function addCatwalk(k, xOff, getIsDead, triggerDeath, getIsaac) {
        let triggered = false;

        const boards = [
            { relX: CHUNK_W * 0.2 - CAT_BOARD_W / 2 },
            { relX: CHUNK_W * 0.5 - CAT_BOARD_W / 2 },
            { relX: CHUNK_W * 0.8 - CAT_BOARD_W / 2 },
        ];

        for (const board of boards) {
            const absX    = xOff + board.relX;
            const endTime = 1 + Math.random() * 7;

            let timer      = 0;
            let phase      = "waiting";
            let shakeTimer = 0;
            let velY       = 0;
            let boardY     = CAT_Y;
            let shakeX     = 0;
            let destroyed  = false;

            const boardBody = k.add([
                k.rect(CAT_BOARD_W, CAT_BOARD_H),
                k.pos(absX, CAT_Y + 14),
                k.color(35, 28, 52),
                k.area(),
                k.body({ isStatic: true }),
                k.z(8),
            ]);

            const boardVisual = k.add([k.pos(0, 0), k.z(9), {
                update() {
                    if (destroyed || getIsDead()) return;
                    if (!triggered) return;

                    if (phase === "waiting") {
                        timer += k.dt();
                        if (timer >= endTime) {
                            phase = "shaking";
                            shakeTimer = 0;
                        }
                    } else if (phase === "shaking") {
                        shakeTimer += k.dt();
                        shakeX = Math.sin(shakeTimer * 40) * 4;
                        boardBody.pos.x = absX + shakeX;

                        if (shakeTimer >= 1.0) {
                            phase = "falling";
                            shakeX = 0;
                            boardBody.pos.x = absX;
                        }
                    } else if (phase === "falling") {
                        velY += 980 * k.dt();
                        boardBody.pos.y += velY * k.dt();

                        const isaac = getIsaac();
                        if (isaac) {
                            const boardLeft   = boardBody.pos.x;
                            const boardRight  = boardBody.pos.x + CAT_BOARD_W;
                            const boardTop    = boardBody.pos.y;
                            const boardBottom = boardBody.pos.y + CAT_BOARD_H;
                            const isaacLeft   = isaac.pos.x;
                            const isaacRight  = isaac.pos.x + 26;
                            const isaacTop    = isaac.pos.y;
                            const isaacBottom = isaac.pos.y + 58;

                            const overlapping = boardLeft < isaacRight &&
                                            boardRight > isaacLeft &&
                                            boardTop < isaacBottom &&
                                            boardBottom > isaacTop;

                            if (overlapping) triggerDeath();
                        }

                        if (boardBody.pos.y > H + 100) {
                            boardVisual.destroy();
                            boardBody.destroy();
                            destroyed = true;
                        }
                    }
                },

                draw() {
                    if (destroyed) return;
                    const bx = boardBody.pos.x;
                    const by = boardBody.pos.y;

                    k.drawRect({ pos: k.vec2(bx, by), width: CAT_BOARD_W, height: CAT_BOARD_H, color: k.rgb(42, 34, 62), opacity: 0.95 });
                    k.drawRect({ pos: k.vec2(bx + 2, by), width: CAT_BOARD_W - 4, height: 2, color: k.rgb(68, 54, 95), opacity: 0.7 });
                    if (phase === "shaking") {
                        k.drawRect({ pos: k.vec2(bx, by), width: CAT_BOARD_W, height: CAT_BOARD_H, color: k.rgb(180, 40, 40), opacity: 0.3 });
                    }
                },
            }]);
        }

        return { trigger() { triggered = true; } };
    }

    function addCatwalkRailing(k, xOff) {
        k.add([k.pos(0, 0), k.z(7), {
            draw() {
                k.drawRect({ pos: k.vec2(xOff, CAT_Y), width: CHUNK_W, height: 3, color: k.rgb(48, 38, 68), opacity: 0.85 });
                k.drawRect({ pos: k.vec2(xOff, CAT_Y - 14), width: CHUNK_W, height: 1, color: k.rgb(72, 58, 98), opacity: 0.5 });
                for (let px = xOff; px < xOff + CHUNK_W; px += 150) {
                    k.drawRect({ pos: k.vec2(px, CAT_Y - 14), width: 4, height: CAT_BOARD_H + 28, color: k.rgb(42, 32, 60), opacity: 0.75 });
                }
            },
        }]);
    }

    function addCatwalkSpider(k, xOff, getIsaac, triggerDeath) {
        const TOP_Y        = CAT_Y - 14;
        const BOTTOM_Y     = CAT_Y + CAT_BOARD_H + 10;
        const LEFT_X       = xOff;
        const RIGHT_X      = xOff + CHUNK_W - 20;
        const CRAWL_SPEED  = 120;
        const DROP_SPEED   = 1500;
        const DETECT_RANGE = 60;

        let spiderX    = xOff + CHUNK_W / 2;
        let spiderY    = BOTTOM_Y;
        let phase      = "bottom-left";
        let loopTimer  = 0;
        let skitterTimer = 0;
        let skitterOX  = 0;
        let skitterOY  = 0;
        let triggered  = false;
        let dead       = false;

        k.add([k.pos(0, 0), k.z(20), {
            update() {
                if (dead) return;
                if (!triggered) return;
                if (freeze.active) return;

                skitterTimer += k.dt();
                if (skitterTimer > 0.06) {
                    skitterTimer = 0;
                    skitterOX = (Math.random() - 0.5) * 5;
                    skitterOY = (Math.random() - 0.5) * 3;
                }

                if (phase === "top-right") {
                    spiderX += CRAWL_SPEED * k.dt();
                    spiderY = TOP_Y;
                    if (spiderX >= RIGHT_X) {
                        spiderX = RIGHT_X;
                        phase = "loop-right";
                        loopTimer = 0;
                    }
                } else if (phase === "loop-right") {
                    loopTimer += k.dt();
                    const t = Math.min(loopTimer / 0.4, 1);
                    spiderY = TOP_Y + (BOTTOM_Y - TOP_Y) * t;
                    if (loopTimer >= 0.4) phase = "bottom-left";
                } else if (phase === "bottom-left") {
                    spiderX -= CRAWL_SPEED * k.dt();
                    spiderY = BOTTOM_Y;

                    const isaac = getIsaac();
                    if (isaac) {
                        const inRange    = isaac.pos.x + 13 > spiderX - 20 &&
                                          isaac.pos.x + 13 < spiderX + 20;
                        const isaacBelow = isaac.pos.y > CAT_Y;
                        if (inRange && isaacBelow) phase = "dropping";
                    }

                    if (spiderX <= LEFT_X) {
                        spiderX = LEFT_X;
                        phase = "loop-left";
                        loopTimer = 0;
                    }
                } else if (phase === "loop-left") {
                    loopTimer += k.dt();
                    const t = Math.min(loopTimer / 0.4, 1);
                    spiderY = BOTTOM_Y + (TOP_Y - BOTTOM_Y) * t;
                    if (loopTimer >= 0.4) {
                        phase = "top-right";
                        spiderX = LEFT_X;
                    }
                } else if (phase === "dropping") {
                    spiderY += DROP_SPEED * k.dt();

                    const isaac = getIsaac();
                    if (isaac) {
                        const spiderLeft   = spiderX - 20;
                        const spiderRight  = spiderX + 20;
                        const spiderTop    = spiderY - 14;
                        const spiderBottom = spiderY + 14;
                        const isaacLeft    = isaac.pos.x;
                        const isaacRight   = isaac.pos.x + 26;
                        const isaacTop     = isaac.pos.y;
                        const isaacBottom  = isaac.pos.y + 58;

                        const hit = spiderLeft < isaacRight &&
                                    spiderRight > isaacLeft &&
                                    spiderTop < isaacBottom &&
                                    spiderBottom > isaacTop;

                        if (hit) { dead = true; triggerDeath(); }
                    }

                    if (spiderY > FLOOR_Y + 50) {
                        spiderY = TOP_Y;
                        spiderX = LEFT_X;
                        phase = "top-right";
                    }
                }
            },

            draw() {
                if (dead) return;
                const sx = spiderX + skitterOX;
                const sy = spiderY + skitterOY;

                k.drawRect({ pos: k.vec2(sx - 14, sy - 14), width: 28, height: 28, color: k.rgb(28, 22, 40), opacity: 0.95, radius: 5 });
                k.drawRect({ pos: k.vec2(sx - 7, sy - 6), width: 5, height: 5, color: k.rgb(180, 40, 40), opacity: 1 });
                k.drawRect({ pos: k.vec2(sx + 3, sy - 6), width: 5, height: 5, color: k.rgb(180, 40, 40), opacity: 1 });

                const legPairs = [[-20, -8], [-18, 0], [-18, 8], [-20, 16],
                                  [ 20, -8], [ 18, 0], [ 18, 8], [ 20, 16]];
                for (const [lx, ly] of legPairs) {
                    k.drawRect({ pos: k.vec2(sx + (lx > 0 ? 14 : lx), sy + ly), width: Math.abs(lx) - 14, height: 3, color: k.rgb(40, 30, 55), opacity: 0.85 });
                }

                if (phase === "bottom-left") {
                    const isaac = getIsaac();
                    if (isaac && Math.abs(isaac.pos.x - spiderX) < DETECT_RANGE && isaac.pos.y > CAT_Y) {
                        k.drawRect({ pos: k.vec2(sx - 12, sy + 8), width: 24, height: FLOOR_Y - sy, color: k.rgb(180, 40, 40), opacity: 0.06 });
                    }
                }
            },
        }]);

        return { trigger() { triggered = true; } };
    }

    // ── Catwalk roll ──────────────────────────────────────────────
    const catwalkRoll = rollInRange(catwalkRange);

    let catwalkMode;
    if (catwalkRoll <= 5)       catwalkMode = 0;
    else if (catwalkRoll <= 13) catwalkMode = 1;
    else                        catwalkMode = 2;

    let catwalk = null;
    if (catwalkMode === 1) {
        catwalk = addCatwalk(k, xOff, () => isDead, () => triggerDeath(), getIsaac);
        addCatwalkRailing(k, xOff);
    } else if (catwalkMode === 2) {
        addCatwalkRailing(k, xOff);
        const boards = [
            CHUNK_W * 0.2 - CAT_BOARD_W / 2,
            CHUNK_W * 0.5 - CAT_BOARD_W / 2,
            CHUNK_W * 0.8 - CAT_BOARD_W / 2,
        ];
        for (const relX of boards) {
            k.add([
                k.rect(CAT_BOARD_W, CAT_BOARD_H),
                k.pos(xOff + relX, CAT_Y),
                k.color(35, 28, 52),
                k.area(),
                k.body({ isStatic: true }),
                k.z(8),
            ]);
        }
        const spider = addCatwalkSpider(k, xOff, getIsaac, () => triggerDeath());
        catwalk = { trigger() { spider.trigger(); } };
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

            if (catwalk && isaac.pos.x > xOff) {
                catwalk.trigger();
            }

            if (isaac.pos.y > FLOOR_Y + 80) triggerDeath();
        },
    };
}

export function resetFog() {
    fogAdded = false;
}