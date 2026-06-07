// ─── Z-layer legend ───────────────────────────────────────────────
//  0   room geometry (walls, floor, ceiling) + texture lines
//  5   light cone (below Isaac — brightens room centre)
//  8   desk + desk items + TV panel
//  9   TV screen face
//  10  Isaac + TV screen content
//  15  door frame + inner panel + handle
//  20  chalk text
//  80  vignette overlay (darkens edges, above all geometry)
//  90  door glow (above vignette so it punches through edge darkness)
//  91  E-prompts (above vignette)
//  100 fade-to-black rect
//  200 settings overlay / challenge overlay
// ─────────────────────────────────────────────────────────────────

import { createSettingsOverlay } from "./settings.js";
import { createChallengeOverlay } from "./challengeOverlay.js";
import { getChalkProgress, isGameComplete, setCurrentLevel } from "../state/progress.js";

const W = 1280;
const H = 720;

// Room geometry — bedroom-tight interior
const WALL_T  = 92;
const CEIL_H  = 78;
const FLOOR_Y = 490;
const FLOOR_H = H - FLOOR_Y;

const ROOM_LEFT  = WALL_T;
const ROOM_RIGHT = W - WALL_T;

// Door — flush with inner face of right wall
const DOOR_W = 76;
const DOOR_H = 192;
const DOOR_X = W - WALL_T - DOOR_W;
const DOOR_Y = FLOOR_Y - DOOR_H;

// Desk
const DESK_X         = 390;
const DESK_W         = 156;
const DESK_TOP_Y     = FLOOR_Y - 74;
const DESK_PROXIMITY = 160;

// TV panel (between door and desk, mounted on wall)
const TVX          = 720;
const TVY          = FLOOR_Y - 300;
const TVW          = 166;
const TVH          = 112;
const TV_PROXIMITY = 130;

// Isaac
const ISAAC_W       = 38;
const ISAAC_H       = 86;
const ISAAC_START_X = W / 2 - ISAAC_W / 2;
const ISAAC_START_Y = FLOOR_Y - ISAAC_H;

// Overhead light
const LIGHT_X      = W / 2;
const LIGHT_Y      = 220;
const LIGHT_RADIUS = 340;

const DOOR_PROXIMITY = 160;

// ── Colour palette ────────────────────────────────────────────────
const COL_WALL  = [14, 12, 26];
const COL_FLOOR = [16, 13, 28];
const COL_TRIM  = [22, 18, 40];

export function initMenuRoom(k) {
    k.scene("menuRoom", () => {

        // ── Overlays ──────────────────────────────────────────────
        const settings  = createSettingsOverlay(k);
        const challenge = createChallengeOverlay(k, (targetLevel) => {
            setCurrentLevel(targetLevel);
            challenge.close();
            k.go("level");
        });

        // ── Ceiling ───────────────────────────────────────────────
        k.add([k.rect(W, CEIL_H), k.pos(0, 0), k.color(...COL_WALL), k.z(0)]);
        k.add([k.rect(W, 3), k.pos(0, CEIL_H), k.color(...COL_TRIM), k.opacity(0.85), k.z(0)]);
        k.add([k.rect(W, 1), k.pos(0, CEIL_H + 3), k.color(4, 3, 10), k.opacity(0.7), k.z(0)]);

        // Hanging cord
        k.add([k.rect(2, LIGHT_Y - CEIL_H - 18), k.pos(LIGHT_X - 1, CEIL_H), k.color(10, 10, 10), k.z(5)]);
        // Socket
        k.add([k.rect(10, 10), k.pos(LIGHT_X - 5, LIGHT_Y - 18), k.color(32, 28, 48), k.z(5)]);
        // Bulb base
        k.add([k.rect(8, 6), k.pos(LIGHT_X - 4, LIGHT_Y - 10), k.color(42, 38, 58), k.z(5)]);
        // Bulb
        k.add([k.pos(0, 0), k.z(5), {
            draw() {
                k.drawCircle({ pos: k.vec2(LIGHT_X, LIGHT_Y + 6), radius: 12, color: k.rgb(180, 175, 220), opacity: 0.15 });
                k.drawCircle({ pos: k.vec2(LIGHT_X, LIGHT_Y + 6), radius: 7,  color: k.rgb(200, 195, 235), opacity: 0.9 });
                k.drawCircle({ pos: k.vec2(LIGHT_X, LIGHT_Y + 5), radius: 3,  color: k.rgb(240, 238, 255), opacity: 1 });
            },
        }]);

        // ── Left wall ─────────────────────────────────────────────
        k.add([k.rect(WALL_T, FLOOR_Y - CEIL_H), k.pos(0, CEIL_H), k.color(...COL_WALL), k.z(0)]);

        // ── Right wall (split around door) ────────────────────────
        k.add([k.rect(WALL_T, DOOR_Y - CEIL_H), k.pos(W - WALL_T, CEIL_H), k.color(...COL_WALL), k.z(0)]);
        const doorBottom = DOOR_Y + DOOR_H;
        if (doorBottom < FLOOR_Y) {
            k.add([k.rect(WALL_T, FLOOR_Y - doorBottom), k.pos(W - WALL_T, doorBottom), k.color(...COL_WALL), k.z(0)]);
        }

        // ── Floor slab ────────────────────────────────────────────
        const floorGradientSteps = 8;
        const floorStepH = FLOOR_H / floorGradientSteps;
        for (let i = 0; i < floorGradientSteps; i++) {
            const t = i / (floorGradientSteps - 1);
            const r = Math.round(80 - t * 55);
            const g = Math.round(65 - t * 45);
            const b = Math.round(110 - t * 70);
            k.add([
                k.rect(W, floorStepH + 1),
                k.pos(0, FLOOR_Y + i * floorStepH),
                k.color(r, g, b),
                k.z(80),
            ]);
        }
        k.add([k.rect(W, 5), k.pos(0, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);
        k.add([k.rect(W, 1), k.pos(0, FLOOR_Y - 1), k.color(3, 2, 9), k.opacity(0.7), k.z(0)]);

        // Wall inner edge shadow lines
        k.add([k.rect(2, FLOOR_Y - CEIL_H), k.pos(WALL_T, CEIL_H), k.color(5, 4, 12), k.opacity(0.55), k.z(0)]);
        k.add([k.rect(2, FLOOR_Y - CEIL_H), k.pos(W - WALL_T - 2, CEIL_H), k.color(5, 4, 12), k.opacity(0.55), k.z(0)]);

        // ── Plaster texture + cracks ──────────────────────────────
        k.add([k.pos(0, 0), k.z(1), {
            draw() {
                // Back wall plaster variation
                for (let i = 0; i < 6; i++) {
                    const t = i / 6;
                    const w = (ROOM_RIGHT - ROOM_LEFT) * (1 - t * 0.5);
                    const cx = W / 2;
                    k.drawRect({
                        pos:    k.vec2(cx - w / 2, CEIL_H),
                        width:  w,
                        height: FLOOR_Y - CEIL_H,
                        color:  k.rgb(45, 50, 78),
                        opacity: (1 - t) * 0.12,
                    });
                }

                // Brick-like bands
                const brickH   = 28;
                const brickGap = 6;
                const brickColorsPool = [
                    [38, 34, 52], [28, 25, 42], [35, 31, 50],
                    [25, 22, 40], [36, 32, 51], [27, 24, 42],
                ];
                let brickY = CEIL_H + 10;
                let brickIndex = 0;
                while (brickY < FLOOR_Y) {
                    k.drawRect({
                        pos:    k.vec2(WALL_T, brickY),
                        width:  W - WALL_T * 2,
                        height: brickH,
                        color:  k.rgb(...brickColorsPool[brickIndex % brickColorsPool.length]),
                        opacity: 0.7,
                    });
                    k.drawRect({
                        pos:    k.vec2(WALL_T, brickY + brickH),
                        width:  W - WALL_T * 2,
                        height: brickGap,
                        color:  k.rgb(14, 12, 24),
                        opacity: 0.7,
                    });
                    const brickW    = 120;
                    const rowOffset = (brickIndex % 2 === 0) ? 0 : brickW / 2;
                    for (let vx = WALL_T + rowOffset; vx < W - WALL_T; vx += brickW) {
                        k.drawRect({
                            pos:    k.vec2(vx, brickY),
                            width:  brickGap,
                            height: brickH,
                            color:  k.rgb(14, 12, 24),
                            opacity: 0.7,
                        });
                    }
                    brickY += brickH + brickGap;
                    brickIndex++;
                }

                // Cover brick overshoot at floor
                k.drawRect({
                    pos:    k.vec2(WALL_T, FLOOR_Y),
                    width:  W - WALL_T * 2,
                    height: 50,
                    color:  k.rgb(...COL_FLOOR),
                    opacity: 1,
                });

                // Ceiling plaster
                for (let i = 0; i < 4; i++) {
                    const t = i / 4;
                    k.drawRect({
                        pos:    k.vec2(0, i * (CEIL_H / 4)),
                        width:  W,
                        height: CEIL_H / 4 + 1,
                        color:  k.rgb(12, 10, 22),
                        opacity: t * 0.25,
                    });
                }

                // Left wall plaster
                for (let i = 0; i < 3; i++) {
                    k.drawRect({
                        pos:    k.vec2(0, CEIL_H + i * ((FLOOR_Y - CEIL_H) / 3)),
                        width:  WALL_T,
                        height: (FLOOR_Y - CEIL_H) / 3 + 1,
                        color:  k.rgb(25 + i, 28 + i, 44 + i),
                        opacity: 0.9,
                    });
                }

                // Right wall plaster
                for (let i = 0; i < 3; i++) {
                    k.drawRect({
                        pos:    k.vec2(W - WALL_T, CEIL_H + i * ((FLOOR_Y - CEIL_H) / 3)),
                        width:  WALL_T,
                        height: (FLOOR_Y - CEIL_H) / 3 + 1,
                        color:  k.rgb(25 + i, 28 + i, 44 + i),
                        opacity: 0.9,
                    });
                }

                // Crack 1 — back wall left side
                k.drawLine({ p1: k.vec2(320, CEIL_H + 30),  p2: k.vec2(335, CEIL_H + 86),  width: 1.5, color: k.rgb(6, 5, 14), opacity: 0.7 });
                k.drawLine({ p1: k.vec2(335, CEIL_H + 86),  p2: k.vec2(325, CEIL_H + 138), width: 1.2, color: k.rgb(6, 5, 14), opacity: 0.65 });
                k.drawLine({ p1: k.vec2(335, CEIL_H + 86),  p2: k.vec2(350, CEIL_H + 118), width: 1,   color: k.rgb(6, 5, 14), opacity: 0.55 });
                k.drawLine({ p1: k.vec2(330, CEIL_H + 52),  p2: k.vec2(322, CEIL_H + 72),  width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.4 });
                k.drawLine({ p1: k.vec2(326, CEIL_H + 114), p2: k.vec2(316, CEIL_H + 130), width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.35 });

                // Crack 2 — back wall right side
                k.drawLine({ p1: k.vec2(820, CEIL_H + 16),  p2: k.vec2(808, CEIL_H + 68),  width: 1.5, color: k.rgb(6, 5, 14), opacity: 0.65 });
                k.drawLine({ p1: k.vec2(808, CEIL_H + 68),  p2: k.vec2(798, CEIL_H + 114), width: 1.2, color: k.rgb(6, 5, 14), opacity: 0.6 });
                k.drawLine({ p1: k.vec2(808, CEIL_H + 68),  p2: k.vec2(822, CEIL_H + 98),  width: 1,   color: k.rgb(6, 5, 14), opacity: 0.5 });
                k.drawLine({ p1: k.vec2(812, CEIL_H + 40),  p2: k.vec2(820, CEIL_H + 56),  width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.35 });
                k.drawLine({ p1: k.vec2(800, CEIL_H + 90),  p2: k.vec2(792, CEIL_H + 105), width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.3 });

                // Crack 3 — ceiling
                k.drawLine({ p1: k.vec2(W / 2 + 40, 12),  p2: k.vec2(W / 2 + 120, 34),  width: 1.5, color: k.rgb(6, 5, 14), opacity: 0.6 });
                k.drawLine({ p1: k.vec2(W / 2 + 120, 34), p2: k.vec2(W / 2 + 200, 22),  width: 1.2, color: k.rgb(6, 5, 14), opacity: 0.55 });
                k.drawLine({ p1: k.vec2(W / 2 + 120, 34), p2: k.vec2(W / 2 + 140, 52),  width: 1,   color: k.rgb(6, 5, 14), opacity: 0.45 });
                k.drawLine({ p1: k.vec2(W / 2 + 70, 18),  p2: k.vec2(W / 2 + 80, 30),   width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.3 });
                k.drawLine({ p1: k.vec2(W / 2 + 160, 26), p2: k.vec2(W / 2 + 170, 42),  width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.3 });

                // Scattered hairlines
                k.drawLine({ p1: k.vec2(480, CEIL_H + 150), p2: k.vec2(490, CEIL_H + 174), width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.28 });
                k.drawLine({ p1: k.vec2(700, CEIL_H + 58),  p2: k.vec2(708, CEIL_H + 78),  width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.25 });
                k.drawLine({ p1: k.vec2(560, CEIL_H + 240), p2: k.vec2(552, CEIL_H + 260), width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.22 });
                k.drawLine({ p1: k.vec2(900, CEIL_H + 196), p2: k.vec2(910, CEIL_H + 212), width: 0.8, color: k.rgb(6, 5, 14), opacity: 0.22 });
            },
        }]);

        // ── Chalk text ────────────────────────────────────────────
        const FULL_TEXT = "MY NAME IS ISAAC";
        const chalkProgress = getChalkProgress();
        let letterCount = 0;
        const revealed = FULL_TEXT.split('').map(c => {
            if (c === ' ') return ' ';
            letterCount++;
            return letterCount <= chalkProgress ? c : ' ';
        }).join('');

        k.add([k.pos(0, 0), k.z(20), {
            draw() { drawChalkText(k, revealed, 170, CEIL_H + 210, 42); },
        }]);

        // ── Desk ──────────────────────────────────────────────────
        k.add([k.rect(9,  62),  k.pos(DESK_X + 12,          DESK_TOP_Y + 14), k.color(55, 35, 18), k.z(8)]);
        k.add([k.rect(9,  62),  k.pos(DESK_X + DESK_W - 21, DESK_TOP_Y + 14), k.color(55, 35, 18), k.z(8)]);
        k.add([k.rect(DESK_W, 15), k.pos(DESK_X, DESK_TOP_Y), k.color(72, 48, 24), k.z(8)]);
        k.add([k.rect(DESK_W, 2),  k.pos(DESK_X, DESK_TOP_Y), k.color(90, 62, 32), k.opacity(0.1), k.z(8)]);
        k.add([k.rect(46, 7),  k.pos(DESK_X + 20,          DESK_TOP_Y - 7), k.color(48, 44, 65), k.opacity(0.1), k.z(8)]);
        k.add([k.rect(2,  36),  k.pos(DESK_X + DESK_W - 34, DESK_TOP_Y - 7), k.color(55, 50, 72), k.opacity(0.1), k.z(8)]);

        // ── TV panel (unlocked after level 10) ────────────────────
        if (isGameComplete()) {
            k.add([k.rect(8, 56), k.pos(TVX + TVW / 2 - 4, TVY + TVH), k.color(22, 18, 38), k.z(8)]);
            k.add([k.rect(TVW + 10, TVH + 10), k.pos(TVX - 5, TVY - 5), k.color(18, 14, 32), k.z(8)]);
            k.add([k.pos(0, 0), k.z(7), {
                draw() {
                    for (let i = 5; i >= 0; i--) {
                        const t = i / 5;
                        k.drawRect({
                            pos:    k.vec2(TVX - 5 - i * 6, TVY - 5 - i * 4),
                            width:  TVW + 10 + i * 12,
                            height: TVH + 10 + i * 8,
                            color:  k.rgb(80, 50, 160),
                            opacity: (1 - t) * 0.08,
                            radius: 2,
                        });
                    }
                },
            }]);
            k.add([k.rect(TVW, TVH), k.pos(TVX, TVY), k.color(12, 8, 28), k.z(9)]);
            k.add([k.pos(0, 0), k.z(10), {
                draw() {
                    for (let y = TVY + 4; y < TVY + TVH; y += 8) {
                        k.drawRect({ pos: k.vec2(TVX + 2, y), width: TVW - 4, height: 1,
                                     color: k.rgb(100, 70, 180), opacity: 0.12 });
                    }
                    k.drawRect({ pos: k.vec2(TVX + 8, TVY + 8), width: TVW - 16, height: TVH - 16,
                                 color: k.rgb(80, 50, 155), opacity: 0.08, radius: 2 });
                    k.drawText({ text: "CHALLENGE", pos: k.vec2(TVX + 16, TVY + TVH / 2 - 8),
                                 size: 13, font: "monospace", color: k.rgb(155, 120, 220), opacity: 0.85 });
                },
            }]);
        }

        // ── Overhead light cone ───────────────────────────────────
        k.add([k.pos(0, 0), k.z(5), {
            draw() {
                for (let i = 28; i >= 0; i--) {
                    const t = i / 28;
                    k.drawCircle({ pos: k.vec2(LIGHT_X, LIGHT_Y), radius: LIGHT_RADIUS * t,
                                   color: k.rgb(155, 162, 215), opacity: Math.pow(1 - t, 3.5) * 0.12 });
                }
            },
        }]);

        // ── Door void + frame ─────────────────────────────────────
        k.add([k.rect(DOOR_W, DOOR_H), k.pos(DOOR_X, DOOR_Y), k.color(4, 3, 9), k.z(15)]);
        k.add([k.rect(DOOR_W + 10, 6), k.pos(DOOR_X - 5, DOOR_Y - 6), k.color(36, 30, 50), k.z(15)]);
        k.add([k.rect(6, DOOR_H + 6),  k.pos(DOOR_X - 6, DOOR_Y - 2), k.color(36, 30, 50), k.z(15)]);
        k.add([k.rect(DOOR_W - 16, DOOR_H / 2 - 18), k.pos(DOOR_X + 8, DOOR_Y + 10),
               k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
        k.add([k.rect(DOOR_W - 16, DOOR_H / 2 - 24), k.pos(DOOR_X + 8, DOOR_Y + DOOR_H / 2 + 6),
               k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
        k.add([k.rect(4, 18), k.pos(DOOR_X + 10, DOOR_Y + DOOR_H / 2 - 9), k.color(55, 46, 72), k.z(15)]);

        // ── Door visual ───────────────────────────────────────────
        k.add([k.rect(DOOR_W, DOOR_H), k.pos(DOOR_X, DOOR_Y), k.color(45, 28, 12), k.z(16)]);
        k.add([k.rect(DOOR_W, 2), k.pos(DOOR_X, DOOR_Y), k.color(62, 40, 18), k.opacity(0.9), k.z(16)]);
        k.add([k.rect(DOOR_W - 20, DOOR_H / 2 - 22), k.pos(DOOR_X + 10, DOOR_Y + 12),
            k.color(38, 22, 8), k.outline(1, k.rgb(55, 34, 14)), k.z(16)]);
        k.add([k.rect(DOOR_W - 20, DOOR_H / 2 - 28), k.pos(DOOR_X + 10, DOOR_Y + DOOR_H / 2 + 8),
            k.color(38, 22, 8), k.outline(1, k.rgb(55, 34, 14)), k.z(16)]);
        k.add([k.rect(5, 20), k.pos(DOOR_X + 10, DOOR_Y + DOOR_H / 2 - 10), k.color(85, 70, 40), k.z(16)]);
        k.add([k.circle(5),   k.pos(DOOR_X + 12, DOOR_Y + DOOR_H / 2 - 10), k.color(100, 82, 45), k.z(16)]);

        // ── Isaac ─────────────────────────────────────────────────
        const GRAVITY    = 1100;
        const JUMP_FORCE = 400;

        const isaac = k.add([
            k.sprite("isaac"),
            k.pos(ISAAC_START_X, FLOOR_Y),   // was ISAAC_START_Y
            k.scale(1.3),
            k.anchor("bot"),                  // add this
            k.z(40),
            {
                speed: 185,
                bobTimer: 0,
                baseY: FLOOR_Y,
                vy: 0,
                onGround: true,
                facingRight: true,
            },
        ]);
        isaac.play("idle");

        console.log("isaac pos:", isaac.pos, "scale:", ISAAC_H / 192);

        k.onKeyPress("space", () => {
            if (settings.isOpen() || challenge.isOpen()) return;
            if (isaac.onGround) {
                isaac.vy = -JUMP_FORCE;
                isaac.onGround = false;
                isaac.play("jump");   // add this
            }
        });

        isaac.onUpdate(() => {
            let moving = false;
            const blocked = settings.isOpen() || challenge.isOpen();

            if (!blocked) {
                if (k.isKeyDown("left") || k.isKeyDown("a")) {
                    isaac.pos.x -= isaac.speed * k.dt();
                    isaac.flipX = true;
                    if (isaac.onGround && isaac.curAnim() !== "run") isaac.play("run");
                    moving = true;
                } else if (k.isKeyDown("right") || k.isKeyDown("d")) {
                    isaac.pos.x += isaac.speed * k.dt();
                    isaac.flipX = false;
                    if (isaac.onGround && isaac.curAnim() !== "run") isaac.play("run");
                    moving = true;
                }
            }

            isaac.pos.x = Math.max(ROOM_LEFT + 2, Math.min(ROOM_RIGHT - ISAAC_W - 2, isaac.pos.x));

            if (!isaac.onGround) {
                isaac.vy += GRAVITY * k.dt();
                isaac.pos.y += isaac.vy * k.dt();
                if (isaac.pos.y >= isaac.baseY) {
                    isaac.pos.y = isaac.baseY;
                    isaac.vy = 0;
                    isaac.onGround = true;
                }
            }

            if (isaac.onGround && !moving) {
                if (isaac.curAnim() !== "idle") isaac.play("idle");
                isaac.bobTimer += k.dt();
                isaac.pos.y = isaac.baseY + Math.sin(isaac.bobTimer * 1.6) * 2.2;
            } else if (isaac.onGround) {
                isaac.pos.y = isaac.baseY;
                isaac.bobTimer = 0;
            }
        });

        // ── Vignette ──────────────────────────────────────────────
        k.add([k.pos(0, 0), k.z(80), { draw() { drawVignette(k); } }]);

        // ── Door glow ─────────────────────────────────────────────
        const doorGlow = k.add([k.pos(0, 0), k.z(90), {
            glowOpacity: 0.18,
            draw() {
                const cx = DOOR_X + DOOR_W / 2;
                const cy = DOOR_Y + DOOR_H / 2;
                for (let i = 14; i >= 0; i--) {
                    const t = i / 14;
                    const gw = (DOOR_W + 50) * t;
                    const gh = (DOOR_H + 50) * t;
                    k.drawRect({ pos: k.vec2(cx - gw / 2, cy - gh / 2), width: gw, height: gh,
                                 color: k.rgb(95, 65, 148), opacity: (1 - t) * this.glowOpacity, radius: 4 });
                }
            },
        }, "doorGlow"]);

        // ── E-prompts ─────────────────────────────────────────────
        const doorPrompt = k.add([k.pos(DOOR_X - 2, DOOR_Y - 34), k.z(91), k.opacity(0), {
            draw() { k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14, font: "monospace",
                                  color: k.rgb(195, 175, 230), opacity: this.opacity }); },
        }]);

        const deskPrompt = k.add([k.pos(DESK_X + DESK_W / 2 - 18, DESK_TOP_Y - 34), k.z(91), k.opacity(0), {
            draw() { k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14, font: "monospace",
                                  color: k.rgb(195, 175, 230), opacity: this.opacity }); },
        }]);

        const tvPrompt = isGameComplete() ? k.add([k.pos(TVX + TVW / 2 - 18, TVY - 34), k.z(91), k.opacity(0), {
            draw() { k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14, font: "monospace",
                                  color: k.rgb(195, 175, 230), opacity: this.opacity }); },
        }]) : null;

        // ── Proximity + update ────────────────────────────────────
        let nearDoor      = false;
        let nearDesk      = false;
        let nearTV        = false;
        let transitioning = false;

        k.onUpdate(() => {
            if (transitioning) return;

            const isaacCX       = isaac.pos.x + ISAAC_W / 2;
            const settingsOpen  = settings.isOpen();
            const challengeOpen = challenge.isOpen();
            const anyOpen       = settingsOpen || challengeOpen;

            nearDoor = Math.abs(isaacCX - (DOOR_X + DOOR_W / 2)) < DOOR_PROXIMITY;
            nearDesk = Math.abs(isaacCX - (DESK_X + DESK_W / 2)) < DESK_PROXIMITY;
            nearTV   = isGameComplete() && Math.abs(isaacCX - (TVX + TVW / 2)) < TV_PROXIMITY;

            const rate = k.dt() * 5;
            doorGlow.glowOpacity += ((nearDoor && !anyOpen ? 0.22 : 0.08) - doorGlow.glowOpacity) * rate;
            doorPrompt.opacity   += ((nearDoor && !anyOpen ? 1 : 0) - doorPrompt.opacity) * rate;
            deskPrompt.opacity   += ((nearDesk && !anyOpen ? 1 : 0) - deskPrompt.opacity) * rate;
            if (tvPrompt) {
                tvPrompt.opacity += ((nearTV && !anyOpen ? 1 : 0) - tvPrompt.opacity) * rate;
            }
        });

        // ── Key interactions ──────────────────────────────────────
        k.onKeyPress("e", () => {
            if (settings.isOpen() || challenge.isOpen()) return;

            if (nearDoor && !transitioning) {
                transitioning = true;
                fadeToScene(k, "level");
                return;
            }
            if (nearDesk) { settings.open(); return; }
            if (nearTV)   { challenge.open(); return; }
        });

    });
}

// ─── Shared drawing helpers ───────────────────────────────────────

export function drawChalkText(k, text, x, y, size) {
    const jitter = [
        [-2.4, -1.6], [ 1.8, -0.8], [-0.8,  2.4], [ 2.2,  0.6],
        [ 0.4, -2.2], [-1.6,  1.2], [ 1.2,  1.8], [-0.6, -0.6],
        [ 1.4, -1.4], [-1.2,  2.0], [ 2.0,  0.4], [-2.0, -1.0],
        [ 0.8,  1.6], [-1.8, -0.4], [ 1.6, -1.8], [-0.4,  1.0],
    ];
    for (let s = 0; s < 3; s++) {
        k.drawText({ text, pos: k.vec2(x + s * 0.8, y + 0.3), size, font: "chalk",
                     color: k.rgb(210, 208, 228), opacity: 0.04 });
    }
    for (const [ox, oy] of jitter) {
        k.drawText({ text, pos: k.vec2(x + ox, y + oy), size, font: "chalk",
                     color: k.rgb(215, 212, 232), opacity: 0.045 });
    }
    k.drawText({ text, pos: k.vec2(x, y), size, font: "chalk",
                 color: k.rgb(218, 214, 238), opacity: 0.60 });
    k.drawText({ text, pos: k.vec2(x - 0.5, y + 2.5), size, font: "chalk",
                 color: k.rgb(200, 196, 220), opacity: 0.03 });
    k.drawText({ text, pos: k.vec2(x + 2.0, y - 0.5), size, font: "chalk",
                 color: k.rgb(200, 196, 220), opacity: 0.03 });
}

export function drawVignette(k) {
    const steps = 10;
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        k.drawRect({ pos: k.vec2(0, 0), width: 110 * (1 - t), height: H,
                     color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.38 });
    }
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const w = 95 * (1 - t);
        k.drawRect({ pos: k.vec2(W - w, 0), width: w, height: H,
                     color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.32 });
    }
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        k.drawRect({ pos: k.vec2(0, 0), width: W, height: 100 * (1 - t),
                     color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.30 });
    }
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const h = 80 * (1 - t);
        k.drawRect({ pos: k.vec2(0, H - h), width: W, height: h,
                     color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.30 });
    }
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(0, 0, 2), opacity: 0.14 });
}

export function fadeToScene(k, sceneName) {
    const fadeRect = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0), k.z(100)]);
    let alpha = 0;
    const ev = k.onUpdate(() => {
        alpha += k.dt() * 2.8;
        fadeRect.opacity = Math.min(alpha, 1);
        if (alpha >= 1) { ev.cancel(); k.go(sceneName); }
    });
}