// ── Level scene ───────────────────────────────────────────────────

import { createSettingsOverlay } from "./settings.js";
import { drawVignette, fadeToScene } from "./menuRoom.js";
import { buildChunk1, CHUNK_W, WALL_T } from "../chunks/chunk1.js";
import { buildChunk20 } from "../chunks/chunk20.js";
import { buildRandomChunk } from "../chunks/chunkRandom.js";
import { freeze } from "../state/freezeState.js";

const W = 1280;
const H = 720;
const FLOOR_Y = 578;
const FLOOR_H = H - FLOOR_Y;
const CEIL_H = 48;

const ISAAC_W = 26;
const ISAAC_H = 58;

const DOOR_PROXIMITY = 130;
const DESK_PROXIMITY = 130;

const COL_WALL = [14, 12, 26];
const COL_FLOOR = [16, 13, 28];
const COL_TRIM = [22, 18, 40];

export function initLevel(k) {
    k.scene("level", () => {

        const settings = createSettingsOverlay(k);
        k.setGravity(1100);

        // ── Chunks ────────────────────────────────────────────────
        const c1 = buildChunk1(k, 0);
        const cR2 = buildRandomChunk(k, CHUNK_W, () => k.go("level"), () => isaac);
        const cR3 = buildRandomChunk(k, CHUNK_W * 2, () => k.go("level"), () => isaac);
        const cR4 = buildRandomChunk(k, CHUNK_W * 3, () => k.go("level"), () => isaac);
        const cR5 = buildRandomChunk(k, CHUNK_W * 4, () => k.go("level"), () => isaac);
        const cR6 = buildRandomChunk(k, CHUNK_W * 5, () => k.go("level"), () => isaac);
        const c20 = buildChunk20(k, CHUNK_W * 6, () => fadeToScene(k, "menuRoom"));

        // ── Floor ─────────────────────────────────────────────────
        // ── Floor (decorative background only) ───────────────────
        k.add([
            k.rect(CHUNK_W * 7, FLOOR_H),
            k.pos(0, FLOOR_Y),
            k.color(...COL_FLOOR),
            k.z(0),
        ]);

        // ── Floor trim (decorative only) ──────────────────────────────
        k.add([k.rect(CHUNK_W * 7, 5), k.pos(0, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);
        k.add([k.rect(CHUNK_W * 7, 1), k.pos(0, FLOOR_Y - 1), k.color(3, 2, 9), k.opacity(0.7), k.z(0)]);

        // ── Ceiling ───────────────────────────────────────────────
        k.add([
            k.rect(CHUNK_W * 7, CEIL_H),
            k.pos(0, 0),
            k.color(...COL_WALL),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
        k.add([k.rect(CHUNK_W * 7, 3), k.pos(0, CEIL_H), k.color(...COL_TRIM), k.opacity(0.85), k.z(0)]);
        k.add([k.rect(CHUNK_W * 7, 1), k.pos(0, CEIL_H + 3), k.color(4, 3, 10), k.opacity(0.7), k.z(0)]);

        // ── Light bulb (chunk 1 side) ─────────────────────────────
        const BULB_X = CHUNK_W / 2;
        k.add([k.rect(6, 14), k.pos(BULB_X - 3, CEIL_H - 14), k.color(38, 34, 55), k.z(0)]);
        k.add([k.circle(4), k.pos(BULB_X, CEIL_H + 1), k.color(168, 162, 225), k.opacity(0.65), k.z(0)]);

        // ── Back-wall texture lines ───────────────────────────────
        for (let y = CEIL_H + 55; y < FLOOR_Y - 10; y += 68) {
            k.add([k.rect(CHUNK_W * 2 - WALL_T, 1), k.pos(WALL_T, y), k.color(12, 10, 22), k.opacity(0.38), k.z(0)]);
        }

        // ── Overhead light cone ───────────────────────────────────
        k.add([k.pos(0, 0), k.z(5), {
            draw() {
                for (let i = 28; i >= 0; i--) {
                    const t = i / 28;
                    k.drawCircle({
                        pos: k.vec2(BULB_X, CEIL_H),
                        radius: 420 * t,
                        color: k.rgb(155, 162, 215),
                        opacity: Math.pow(1 - t, 2.2) * 0.2,
                    });
                }
            },
        }]);

        // ── Left boundary ─────────────────────────────────────────
        k.add([
            k.rect(WALL_T, FLOOR_Y - CEIL_H),
            k.pos(0, CEIL_H),
            k.color(...COL_WALL),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);

        // ── Isaac ─────────────────────────────────────────────────
        const isaac = k.add([
            k.rect(ISAAC_W, ISAAC_H),
            k.pos(WALL_T + 70, FLOOR_Y - ISAAC_H - 2),
            k.color(50, 45, 68),
            k.area(),
            k.body(),
            k.z(10),
            "issac",
        ]);

        const isaacHead = k.add([
            k.rect(20, 20),
            k.pos(0, 0),
            k.color(62, 56, 82),
            k.z(10),
        ]);

        // ── Jump ──────────────────────────────────────────────────
        k.onKeyPress("space", () => {
            if (settings.isOpen()) return;
            if (isaac.isGrounded()) isaac.jump(420);
        });

        // ── Isaac update (movement + camera + shard check) ────────
        isaac.onUpdate(() => {
            if (!settings.isOpen()) {
                if (k.isKeyDown("left") || k.isKeyDown("a")) isaac.move(-185, 0);
                else if (k.isKeyDown("right") || k.isKeyDown("d")) isaac.move(185, 0);
            }

            isaacHead.pos.x = isaac.pos.x + ISAAC_W / 2 - 10;
            isaacHead.pos.y = isaac.pos.y - 22;

            c20.checkCollect(isaac);

            cR2.checkDeath(isaac);
            cR3.checkDeath(isaac);
            cR4.checkDeath(isaac);
            cR5.checkDeath(isaac);
            cR6.checkDeath(isaac);

            // Camera follows Isaac horizontally, locked vertically
            const targetX = isaac.pos.x + ISAAC_W / 2;
            k.camPos(Math.max(W / 2, targetX), H / 2);
        });

        // ── Door glow ─────────────────────────────────────────────
        const doorGlow = k.add([
            k.pos(0, 0),
            k.z(90),
            {
                glowOpacity: 0.18,
                draw() {
                    const cx = c1.doorCX, cy = c1.doorCY;
                    for (let i = 14; i >= 0; i--) {
                        const t = i / 14;
                        const gw = (WALL_T + 50) * t;
                        const gh = (138 + 50) * t;
                        k.drawRect({
                            pos: k.vec2(cx - gw / 2, cy - gh / 2),
                            width: gw,
                            height: gh,
                            color: k.rgb(95, 65, 148),
                            opacity: (1 - t) * this.glowOpacity,
                            radius: 4,
                        });
                    }
                },
            },
        ]);

        // ── E-prompts ─────────────────────────────────────────────
        const doorPrompt = k.add([
            k.pos(c1.doorPromptX, c1.doorPromptY),
            k.z(91),
            { alpha: 0, draw() { k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14, font: "monospace", color: k.rgb(195, 175, 230), opacity: this.alpha }); } },
        ]);

        const deskPrompt = k.add([
            k.pos(c1.deskPromptX, c1.deskPromptY),
            k.z(91),
            { alpha: 0, draw() { k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14, font: "monospace", color: k.rgb(195, 175, 230), opacity: this.alpha }); } },
        ]);

        // ── Proximity state ───────────────────────────────────────
        let nearDoor = false;
        let nearDesk = false;

        // ── Single unified onUpdate ───────────────────────────────
        k.onUpdate(() => {
            const isaacCX = isaac.pos.x + ISAAC_W / 2;
            nearDoor = Math.abs(isaacCX - c1.doorCX) < DOOR_PROXIMITY;
            nearDesk = Math.abs(isaacCX - c1.deskCX) < DESK_PROXIMITY;

            const rate = k.dt() * 5;
            const so = settings.isOpen();
            doorGlow.glowOpacity += ((nearDoor && !so ? 0.38 : 0.18) - doorGlow.glowOpacity) * rate;
            doorPrompt.alpha += ((nearDoor && !so ? 1 : 0) - doorPrompt.alpha) * rate;
            deskPrompt.alpha += ((nearDesk && !so ? 1 : 0) - deskPrompt.alpha) * rate;

            // Freeze countdown
            if (freeze.active) {
                freeze.timer -= k.dt();
                if (freeze.timer <= 0) {
                    freeze.active = false;
                    freeze.timer = 0;
                }
            }
        });

        // ── Single unified onKeyPress e ───────────────────────────
        k.onKeyPress("e", () => {
            if (settings.isOpen()) return;
            if (nearDoor) { fadeToScene(k, "menuRoom"); return; }
            if (nearDesk) { settings.open(); return; }
            // Freeze — only fires if not near anything interactable
            // After
            if (freeze.active) {
                freeze.active = false;
                freeze.timer  = 0;
            } else {
                freeze.active = true;
                freeze.timer  = freeze.duration;
            }
        });

        // ── Freeze UI bar ─────────────────────────────────────────
        k.add([k.pos(0, 0), k.z(95), k.fixed(), {
            draw() {
                if (!freeze.active) return;
                const barW = (freeze.timer / freeze.duration) * 400;
                k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: 400, height: 4, color: k.rgb(30, 20, 50), opacity: 0.8 });
                k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: barW, height: 4, color: k.rgb(148, 100, 230), opacity: 0.95 });
                k.drawText({ text: "TIME FROZEN", pos: k.vec2(W / 2 - 54, 65), size: 12, font: "monospace", color: k.rgb(180, 150, 230), opacity: 0.7 });
            },
        }]);

        // ── Vignette ──────────────────────────────────────────────
        k.add([k.pos(0, 0), k.z(80), k.fixed(), {
            draw() { drawVignette(k); },
        }]);

        // ── Narrator scaffold ─────────────────────────────────────
        k.add([k.pos(0, 0), k.z(90), k.fixed(), {
            draw() {
                k.drawRect({ pos: k.vec2(W / 2 - 400, H - 56), width: 800, height: 1, color: k.rgb(50, 42, 68), opacity: 0.22 });
            },
        }]);

        // ── Fade in from black ────────────────────────────────────
        const fadeRect = k.add([
            k.rect(W, H), k.pos(0, 0), k.color(0, 0, 0), k.opacity(1), k.z(100), k.fixed(),
        ]);
        let fadeAlpha = 1;
        const fadeIn = k.onUpdate(() => {
            fadeAlpha -= k.dt() * 2.5;
            fadeRect.opacity = Math.max(fadeAlpha, 0);
            if (fadeAlpha <= 0) fadeIn.cancel();
        });

    });
}