// ─── Z-layer legend ───────────────────────────────────────────────
//  0   room geometry (walls, floor, ceiling) + texture lines
//  5   light cone (below Isaac — brightens room centre)
//  8   desk + desk items
// 10   Isaac
// 15   door frame + inner panel + handle
// 20   chalk text
// 80   vignette overlay (darkens edges, above all geometry)
// 90   door glow (above vignette so it punches through edge darkness)
// 91   E-prompts (above vignette)
// 100  fade-to-black rect
// 200  settings overlay (see settings.js)
// ─────────────────────────────────────────────────────────────────

import { createSettingsOverlay } from "./settings.js";

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
const DOOR_W  = 54;
const DOOR_H  = 138;
const DOOR_X  = W - WALL_T + 1;
const DOOR_Y  = FLOOR_Y - DOOR_H;

// Desk — left-centre area
const DESK_X  = 390;
const DESK_W  = 112;
const DESK_TOP_Y = FLOOR_Y - 52;  // top surface y
const DESK_PROXIMITY = 130;

// Isaac
const ISAAC_W = 26;
const ISAAC_H = 58;
const ISAAC_START_X = W / 2 - ISAAC_W / 2;
const ISAAC_START_Y = FLOOR_Y - ISAAC_H;

// Overhead light
const LIGHT_X      = W / 2;
const LIGHT_Y      = CEIL_H;
const LIGHT_RADIUS = 420;

const DOOR_PROXIMITY = 140;

// ── Colour palette (cool blue-purple) ─────────────────────────────
const COL_WALL  = [14, 12, 26];   // dark blue-purple walls
const COL_FLOOR = [16, 13, 28];   // slightly lighter floor
const COL_TRIM  = [22, 18, 40];   // purple baseboard / crown

export function initMenuRoom(k) {
    k.scene("menuRoom", () => {

        // ── Settings overlay (registered first so it can grab ESC) ─
        const settings = createSettingsOverlay(k);

        // ── Ceiling ──────────────────────────────────────────────
        k.add([k.rect(W, CEIL_H), k.pos(0, 0), k.color(...COL_WALL), k.z(0)]);

        // Crown moulding
        k.add([k.rect(W, 3), k.pos(0, CEIL_H), k.color(...COL_TRIM), k.opacity(0.85), k.z(0)]);
        k.add([k.rect(W, 1), k.pos(0, CEIL_H + 3), k.color(4, 3, 10), k.opacity(0.7), k.z(0)]);

        // Light bulb housing
        k.add([k.rect(6, 14), k.pos(LIGHT_X - 3, CEIL_H - 14), k.color(38, 34, 55), k.z(0)]);
        // Bulb glow dot
        k.add([k.circle(4), k.pos(LIGHT_X, CEIL_H + 1), k.color(168, 162, 225), k.opacity(0.65), k.z(0)]);

        // ── Left wall ────────────────────────────────────────────
        k.add([k.rect(WALL_T, FLOOR_Y - CEIL_H), k.pos(0, CEIL_H), k.color(...COL_WALL), k.z(0)]);

        // ── Right wall (split around door opening) ────────────────
        k.add([k.rect(WALL_T, DOOR_Y - CEIL_H), k.pos(W - WALL_T, CEIL_H), k.color(...COL_WALL), k.z(0)]);
        const doorBottom = DOOR_Y + DOOR_H;
        if (doorBottom < FLOOR_Y) {
            k.add([k.rect(WALL_T, FLOOR_Y - doorBottom), k.pos(W - WALL_T, doorBottom), k.color(...COL_WALL), k.z(0)]);
        }

        // ── Floor slab ───────────────────────────────────────────
        k.add([k.rect(W, FLOOR_H), k.pos(0, FLOOR_Y), k.color(...COL_FLOOR), k.z(0)]);

        // Baseboard trim
        k.add([k.rect(W, 5), k.pos(0, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);
        k.add([k.rect(W, 1), k.pos(0, FLOOR_Y - 1), k.color(3, 2, 9), k.opacity(0.7), k.z(0)]);

        // Wall inner edge shadow lines
        k.add([k.rect(2, FLOOR_Y - CEIL_H), k.pos(WALL_T, CEIL_H), k.color(5, 4, 12), k.opacity(0.55), k.z(0)]);
        k.add([k.rect(2, FLOOR_Y - CEIL_H), k.pos(W - WALL_T - 2, CEIL_H), k.color(5, 4, 12), k.opacity(0.55), k.z(0)]);

        // Subtle horizontal back-wall texture lines
        for (let y = CEIL_H + 55; y < FLOOR_Y - 10; y += 68) {
            k.add([k.rect(W - WALL_T * 2, 1), k.pos(WALL_T, y), k.color(12, 10, 22), k.opacity(0.38), k.z(0)]);
        }

        // ── Desk ─────────────────────────────────────────────────
        // Legs
        k.add([k.rect(7, 44), k.pos(DESK_X + 8,  DESK_TOP_Y + 10), k.color(25, 20, 38), k.z(8)]);
        k.add([k.rect(7, 44), k.pos(DESK_X + DESK_W - 15, DESK_TOP_Y + 10), k.color(25, 20, 38), k.z(8)]);
        // Surface
        k.add([k.rect(DESK_W, 11), k.pos(DESK_X, DESK_TOP_Y), k.color(28, 24, 44), k.z(8)]);
        // Surface top highlight
        k.add([k.rect(DESK_W, 2), k.pos(DESK_X, DESK_TOP_Y), k.color(40, 34, 62), k.opacity(0.85), k.z(8)]);
        // Small notebook / paper on desk
        k.add([k.rect(34, 5), k.pos(DESK_X + 18, DESK_TOP_Y - 5), k.color(48, 44, 65), k.opacity(0.75), k.z(8)]);
        // Tiny pencil
        k.add([k.rect(2, 28), k.pos(DESK_X + DESK_W - 28, DESK_TOP_Y - 5), k.color(55, 50, 72), k.opacity(0.6), k.z(8)]);

        // ── Overhead light cone ───────────────────────────────────
        k.add([
            k.pos(0, 0),
            k.z(5),
            {
                draw() {
                    const steps = 28;
                    for (let i = steps; i >= 0; i--) {
                        const t = i / steps;
                        const radius = LIGHT_RADIUS * t;
                        const alpha  = Math.pow(1 - t, 2.2) * 0.2;
                        k.drawCircle({ pos: k.vec2(LIGHT_X, LIGHT_Y), radius, color: k.rgb(155, 162, 215), opacity: alpha });
                    }
                },
            },
        ]);

        // ── Door void ────────────────────────────────────────────
        k.add([k.rect(DOOR_W, DOOR_H), k.pos(DOOR_X, DOOR_Y), k.color(4, 3, 9), k.z(15)]);
        // Top bar
        k.add([k.rect(DOOR_W + 10, 6), k.pos(DOOR_X - 5, DOOR_Y - 6), k.color(36, 30, 50), k.z(15)]);
        // Left jamb
        k.add([k.rect(6, DOOR_H + 6), k.pos(DOOR_X - 6, DOOR_Y - 2), k.color(36, 30, 50), k.z(15)]);
        // Upper panel detail
        k.add([k.rect(DOOR_W - 12, DOOR_H / 2 - 14), k.pos(DOOR_X + 6, DOOR_Y + 8), k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
        // Lower panel detail
        k.add([k.rect(DOOR_W - 12, DOOR_H / 2 - 20), k.pos(DOOR_X + 6, DOOR_Y + DOOR_H / 2 + 4), k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
        // Handle
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
            if (settings.isOpen()) return;
            if (isaac.onGround) {
                isaac.vy = -JUMP_FORCE;
                isaac.onGround = false;
            }
        });

        isaac.onUpdate(() => {
            let moving = false;

            if (!settings.isOpen()) {
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

            // Vertical physics
            if (!isaac.onGround) {
                isaac.vy += GRAVITY * k.dt();
                isaac.pos.y += isaac.vy * k.dt();
                if (isaac.pos.y >= isaac.baseY) {
                    isaac.pos.y = isaac.baseY;
                    isaac.vy = 0;
                    isaac.onGround = true;
                }
            }

            // Idle bob (grounded + still)
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

        // ── Chalk text ───────────────────────────────────────────
        k.add([
            k.pos(0, 0),
            k.z(20),
            {
                draw() {
                    drawChalkText(k, "MY", 310, CEIL_H + 90, 78);
                },
            },
        ]);

        // ── Vignette overlay ─────────────────────────────────────
        k.add([k.pos(0, 0), k.z(80), { draw() { drawVignette(k); } }]);

        // ── Door glow (z=90, punches above vignette) ──────────────
        const doorGlow = k.add([
            k.pos(0, 0),
            k.z(90),
            {
                glowOpacity: 0.18,
                draw() {
                    const steps = 14;
                    const cx = DOOR_X + DOOR_W / 2;
                    const cy = DOOR_Y + DOOR_H / 2;
                    for (let i = steps; i >= 0; i--) {
                        const t = i / steps;
                        const w = (DOOR_W + 50) * t;
                        const h = (DOOR_H + 50) * t;
                        k.drawRect({ pos: k.vec2(cx - w / 2, cy - h / 2), width: w, height: h, color: k.rgb(95, 65, 148), opacity: (1 - t) * this.glowOpacity, r: 4 });
                    }
                },
            },
            "doorGlow",
        ]);

        // ── E-prompts (z=91) ─────────────────────────────────────
        const doorPrompt = k.add([
            k.pos(DOOR_X - 2, DOOR_Y - 34),
            k.z(91), k.opacity(0),
            {
                draw() {
                    k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14, font: "monospace", color: k.rgb(195, 175, 230), opacity: this.opacity });
                },
            },
        ]);

        const deskPrompt = k.add([
            k.pos(DESK_X + DESK_W / 2 - 18, DESK_TOP_Y - 34),
            k.z(91), k.opacity(0),
            {
                draw() {
                    k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14, font: "monospace", color: k.rgb(195, 175, 230), opacity: this.opacity });
                },
            },
        ]);

        // ── Proximity detection + interactions ────────────────────
        let nearDoor      = false;
        let nearDesk      = false;
        let transitioning = false;

        k.onUpdate(() => {
            if (transitioning) return;

            const isaacCX = isaac.pos.x + ISAAC_W / 2;
            nearDoor = Math.abs(isaacCX - (DOOR_X + DOOR_W / 2)) < DOOR_PROXIMITY;
            nearDesk = Math.abs(isaacCX - (DESK_X + DESK_W / 2)) < DESK_PROXIMITY;

            const rate = k.dt() * 5;
            const settingsOpen = settings.isOpen();

            doorGlow.glowOpacity += ((nearDoor && !settingsOpen ? 0.38 : 0.18) - doorGlow.glowOpacity) * rate;
            doorPrompt.opacity   += ((nearDoor && !settingsOpen ? 1 : 0) - doorPrompt.opacity) * rate;
            deskPrompt.opacity   += ((nearDesk && !settingsOpen ? 1 : 0) - deskPrompt.opacity) * rate;
        });

        k.onKeyPress("e", () => {
            if (settings.isOpen()) return;

            if (nearDoor && !transitioning) {
                transitioning = true;
                fadeToScene(k, "level");
                return;
            }

            if (nearDesk) {
                settings.open();
            }
        });

    });
}

// ─── Shared drawing helpers ──────────────────────────────────────────

export function drawChalkText(k, text, x, y, size) {
    const jitter = [
        [-1.8, -1.2], [ 1.2, -0.6], [-0.6,  1.8], [ 1.6,  0.4],
        [ 0.2, -1.6], [-1.2,  0.8], [ 0.8,  1.2], [-0.4, -0.4],
        [ 1.0, -1.0], [-0.8,  1.4], [ 1.4,  0.2], [-1.4, -0.8],
    ];

    for (const [ox, oy] of jitter) {
        k.drawText({ text, pos: k.vec2(x + ox, y + oy), size, font: "monospace", color: k.rgb(215, 212, 232), opacity: 0.055 });
    }

    k.drawText({ text, pos: k.vec2(x, y), size, font: "monospace", color: k.rgb(215, 210, 235), opacity: 0.78 });

    // Glow halo
    k.drawText({ text, pos: k.vec2(x, y), size: size + 3, font: "monospace", color: k.rgb(225, 220, 255), opacity: 0.07 });
}

export function drawVignette(k) {
    const steps = 10;

    // Left edge
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        k.drawRect({ pos: k.vec2(0, 0), width: 110 * (1 - t), height: H, color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.38 });
    }
    // Right edge (slightly lighter — door glow handles visibility there)
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const w = 95 * (1 - t);
        k.drawRect({ pos: k.vec2(W - w, 0), width: w, height: H, color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.32 });
    }
    // Top edge
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        k.drawRect({ pos: k.vec2(0, 0), width: W, height: 100 * (1 - t), color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.30 });
    }
    // Bottom edge
    for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const h = 80 * (1 - t);
        k.drawRect({ pos: k.vec2(0, H - h), width: W, height: h, color: k.rgb(0, 0, 0), opacity: (1 - t) * 0.30 });
    }

    // Subtle global tint
    k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(0, 0, 2), opacity: 0.14 });
}

// Fade to black then switch scene
export function fadeToScene(k, sceneName) {
    const fadeRect = k.add([k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0), k.z(100)]);
    let alpha = 0;
    const ev = k.onUpdate(() => {
        alpha += k.dt() * 2.8;
        fadeRect.opacity = Math.min(alpha, 1);
        if (alpha >= 1) { ev.cancel(); k.go(sceneName); }
    });
}
