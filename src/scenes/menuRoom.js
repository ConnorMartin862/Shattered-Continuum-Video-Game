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

// Room geometry
const WALL_T  = 82;
const CEIL_H  = 48;
const FLOOR_Y = 578;
const FLOOR_H = H - FLOOR_Y;

const ROOM_LEFT  = WALL_T;
const ROOM_RIGHT = W - WALL_T;

// Door — flush with inner face of right wall
const DOOR_W = 54;
const DOOR_H = 138;
const DOOR_X = W - WALL_T + 1;
const DOOR_Y = FLOOR_Y - DOOR_H;

// Desk
const DESK_X        = 390;
const DESK_W        = 112;
const DESK_TOP_Y    = FLOOR_Y - 52;
const DESK_PROXIMITY = 130;

// TV panel (between door and desk, mounted on wall)
const TVX            = 220;
const TVY            = FLOOR_Y - 280;
const TVW            = 120;
const TVH            = 80;
const TV_PROXIMITY   = 110;

// Isaac
const ISAAC_W       = 26;
const ISAAC_H       = 58;
const ISAAC_START_X = W / 2 - ISAAC_W / 2;
const ISAAC_START_Y = FLOOR_Y - ISAAC_H;

// Overhead light
const LIGHT_X      = W / 2;
const LIGHT_Y      = CEIL_H;
const LIGHT_RADIUS = 420;

const DOOR_PROXIMITY = 140;

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

        // Light bulb housing
        k.add([k.rect(6, 14), k.pos(LIGHT_X - 3, CEIL_H - 14), k.color(38, 34, 55), k.z(0)]);
        k.add([k.circle(4), k.pos(LIGHT_X, CEIL_H + 1), k.color(168, 162, 225), k.opacity(0.65), k.z(0)]);

        // ── Left wall ─────────────────────────────────────────────
        k.add([k.rect(WALL_T, FLOOR_Y - CEIL_H), k.pos(0, CEIL_H), k.color(...COL_WALL), k.z(0)]);

        // ── Right wall (split around door) ────────────────────────
        k.add([k.rect(WALL_T, DOOR_Y - CEIL_H), k.pos(W - WALL_T, CEIL_H), k.color(...COL_WALL), k.z(0)]);
        const doorBottom = DOOR_Y + DOOR_H;
        if (doorBottom < FLOOR_Y) {
            k.add([k.rect(WALL_T, FLOOR_Y - doorBottom), k.pos(W - WALL_T, doorBottom), k.color(...COL_WALL), k.z(0)]);
        }

        // ── Floor slab ────────────────────────────────────────────
        k.add([k.rect(W, FLOOR_H), k.pos(0, FLOOR_Y), k.color(...COL_FLOOR), k.z(0)]);
        k.add([k.rect(W, 5), k.pos(0, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);
        k.add([k.rect(W, 1), k.pos(0, FLOOR_Y - 1), k.color(3, 2, 9), k.opacity(0.7), k.z(0)]);

        // Wall inner edge shadow lines
        k.add([k.rect(2, FLOOR_Y - CEIL_H), k.pos(WALL_T, CEIL_H), k.color(5, 4, 12), k.opacity(0.55), k.z(0)]);
        k.add([k.rect(2, FLOOR_Y - CEIL_H), k.pos(W - WALL_T - 2, CEIL_H), k.color(5, 4, 12), k.opacity(0.55), k.z(0)]);

        // Back-wall texture lines
        for (let y = CEIL_H + 55; y < FLOOR_Y - 10; y += 68) {
            k.add([k.rect(W - WALL_T * 2, 1), k.pos(WALL_T, y), k.color(12, 10, 22), k.opacity(0.38), k.z(0)]);
        }

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
            draw() { drawChalkText(k, revealed, 310, CEIL_H + 90, 78); },
        }]);

        // ── Desk ──────────────────────────────────────────────────
        k.add([k.rect(7, 44), k.pos(DESK_X + 8,           DESK_TOP_Y + 10), k.color(25, 20, 38), k.z(8)]);
        k.add([k.rect(7, 44), k.pos(DESK_X + DESK_W - 15, DESK_TOP_Y + 10), k.color(25, 20, 38), k.z(8)]);
        k.add([k.rect(DESK_W, 11), k.pos(DESK_X, DESK_TOP_Y), k.color(28, 24, 44), k.z(8)]);
        k.add([k.rect(DESK_W, 2),  k.pos(DESK_X, DESK_TOP_Y), k.color(40, 34, 62), k.opacity(0.85), k.z(8)]);
        k.add([k.rect(34, 5), k.pos(DESK_X + 18,           DESK_TOP_Y - 5), k.color(48, 44, 65), k.opacity(0.75), k.z(8)]);
        k.add([k.rect(2,  28), k.pos(DESK_X + DESK_W - 28, DESK_TOP_Y - 5), k.color(55, 50, 72), k.opacity(0.6),  k.z(8)]);

        // ── TV panel (unlocked after level 10) ────────────────────
        if (isGameComplete()) {
            // Mount bracket
            k.add([k.rect(8, 40), k.pos(TVX + TVW / 2 - 4, TVY + TVH), k.color(22, 18, 38), k.z(8)]);
            // Screen surround
            k.add([k.rect(TVW + 10, TVH + 10), k.pos(TVX - 5, TVY - 5), k.color(18, 14, 32), k.z(8)]);
            // Ambient glow behind screen
            k.add([k.pos(0, 0), k.z(7), {
                draw() {
                    for (let i = 5; i >= 0; i--) {
                        const t = i / 5;
                        k.drawRect({
                            pos:     k.vec2(TVX - 5 - i * 6, TVY - 5 - i * 4),
                            width:   TVW + 10 + i * 12,
                            height:  TVH + 10 + i * 8,
                            color:   k.rgb(80, 50, 160),
                            opacity: (1 - t) * 0.08,
                            radius:  2,
                        });
                    }
                },
            }]);
            // Screen face
            k.add([k.rect(TVW, TVH), k.pos(TVX, TVY), k.color(12, 8, 28), k.z(9)]);
            // Scanlines + label
            k.add([k.pos(0, 0), k.z(10), {
                draw() {
                    for (let y = TVY + 4; y < TVY + TVH; y += 8) {
                        k.drawRect({ pos: k.vec2(TVX + 2, y), width: TVW - 4, height: 1,
                                     color: k.rgb(100, 70, 180), opacity: 0.12 });
                    }
                    k.drawRect({ pos: k.vec2(TVX + 8, TVY + 8), width: TVW - 16, height: TVH - 16,
                                 color: k.rgb(80, 50, 155), opacity: 0.08, radius: 2 });
                    k.drawText({ text: "CHALLENGE", pos: k.vec2(TVX + 10, TVY + TVH / 2 - 8),
                                 size: 11, font: "monospace", color: k.rgb(155, 120, 220), opacity: 0.85 });
                },
            }]);
        }

        // ── Overhead light cone ───────────────────────────────────
        k.add([k.pos(0, 0), k.z(5), {
            draw() {
                for (let i = 28; i >= 0; i--) {
                    const t = i / 28;
                    k.drawCircle({ pos: k.vec2(LIGHT_X, LIGHT_Y), radius: LIGHT_RADIUS * t,
                                   color: k.rgb(155, 162, 215), opacity: Math.pow(1 - t, 2.2) * 0.2 });
                }
            },
        }]);

        // ── Door void + frame ─────────────────────────────────────
        k.add([k.rect(DOOR_W, DOOR_H), k.pos(DOOR_X, DOOR_Y), k.color(4, 3, 9), k.z(15)]);
        k.add([k.rect(DOOR_W + 10, 6), k.pos(DOOR_X - 5, DOOR_Y - 6), k.color(36, 30, 50), k.z(15)]);
        k.add([k.rect(6, DOOR_H + 6), k.pos(DOOR_X - 6, DOOR_Y - 2), k.color(36, 30, 50), k.z(15)]);
        k.add([k.rect(DOOR_W - 12, DOOR_H / 2 - 14), k.pos(DOOR_X + 6, DOOR_Y + 8),
               k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
        k.add([k.rect(DOOR_W - 12, DOOR_H / 2 - 20), k.pos(DOOR_X + 6, DOOR_Y + DOOR_H / 2 + 4),
               k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
        k.add([k.rect(4, 14), k.pos(DOOR_X + 8, DOOR_Y + DOOR_H / 2 - 7), k.color(55, 46, 72), k.z(15)]);

        // ── Isaac ─────────────────────────────────────────────────
        const GRAVITY    = 1100;
        const JUMP_FORCE = 400;

        const isaac = k.add([
            k.rect(ISAAC_W, ISAAC_H),
            k.pos(ISAAC_START_X, ISAAC_START_Y),
            k.color(50, 45, 68),
            k.z(10),
            {
                speed: 185,
                bobTimer: 0,
                baseY: ISAAC_START_Y,
                vy: 0,
                onGround: true,
            },
        ]);

        const isaacHead = k.add([
            k.rect(20, 20),
            k.pos(0, 0),
            k.color(62, 56, 82),
            k.z(10),
        ]);

        k.onKeyPress("space", () => {
            if (settings.isOpen() || challenge.isOpen()) return;
            if (isaac.onGround) {
                isaac.vy = -JUMP_FORCE;
                isaac.onGround = false;
            }
        });

        isaac.onUpdate(() => {
            let moving = false;
            const blocked = settings.isOpen() || challenge.isOpen();

            if (!blocked) {
                if (k.isKeyDown("left") || k.isKeyDown("a")) {
                    isaac.pos.x -= isaac.speed * k.dt();
                    moving = true;
                }
                if (k.isKeyDown("right") || k.isKeyDown("d")) {
                    isaac.pos.x += isaac.speed * k.dt();
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
                isaac.bobTimer += k.dt();
                isaac.pos.y = isaac.baseY + Math.sin(isaac.bobTimer * 1.6) * 2.2;
            } else if (isaac.onGround) {
                isaac.pos.y = isaac.baseY;
                isaac.bobTimer = 0;
            }

            isaacHead.pos.x = isaac.pos.x + ISAAC_W / 2 - 10;
            isaacHead.pos.y = isaac.pos.y - 22;
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

            const isaacCX    = isaac.pos.x + ISAAC_W / 2;
            const settingsOpen  = settings.isOpen();
            const challengeOpen = challenge.isOpen();
            const anyOpen       = settingsOpen || challengeOpen;

            nearDoor = Math.abs(isaacCX - (DOOR_X + DOOR_W / 2)) < DOOR_PROXIMITY;
            nearDesk = Math.abs(isaacCX - (DESK_X + DESK_W / 2)) < DESK_PROXIMITY;
            nearTV   = isGameComplete() && Math.abs(isaacCX - (TVX + TVW / 2)) < TV_PROXIMITY;

            const rate = k.dt() * 5;
            doorGlow.glowOpacity += ((nearDoor && !anyOpen ? 0.38 : 0.18) - doorGlow.glowOpacity) * rate;
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
        [-1.8, -1.2], [ 1.2, -0.6], [-0.6,  1.8], [ 1.6,  0.4],
        [ 0.2, -1.6], [-1.2,  0.8], [ 0.8,  1.2], [-0.4, -0.4],
        [ 1.0, -1.0], [-0.8,  1.4], [ 1.4,  0.2], [-1.4, -0.8],
    ];
    for (const [ox, oy] of jitter) {
        k.drawText({ text, pos: k.vec2(x + ox, y + oy), size, font: "monospace",
                     color: k.rgb(215, 212, 232), opacity: 0.055 });
    }
    k.drawText({ text, pos: k.vec2(x, y), size, font: "monospace",
                 color: k.rgb(215, 210, 235), opacity: 0.78 });
    k.drawText({ text, pos: k.vec2(x, y), size: size + 3, font: "monospace",
                 color: k.rgb(225, 220, 255), opacity: 0.07 });
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