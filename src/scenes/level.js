// ── Level scene ───────────────────────────────────────────────────

import { createSettingsOverlay } from "./settings.js";
import { drawVignette, fadeToScene } from "./menuRoom.js";
import { buildChunk1, CHUNK_W, WALL_T } from "../chunks/chunk1.js";
import { buildChunk20 } from "../chunks/chunk20.js";
import { buildRandomChunk, resetFog } from "../chunks/chunkRandom.js";
import { getCurrentLevel, completeLevel } from "../state/progress.js";
import { loadChallengeSettings } from "./challengeOverlay.js";
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

// ── Level configs ─────────────────────────────────────────────────
// Each level defines how many random chunks it has and what roll
// ranges to pass to buildRandomChunk for each chunk.
//
// rollRanges per chunk: { floor, box, catwalk, light }
// Each is a [min, max] tuple. Omitted = [0, 20] (fully random).
//
// Floor roll thresholds:
//   0-3  → solid floor
//   4-8  → small gap (no platform)
//   9-15 → large gap + 1 flickering platform
//   16-20 → extreme gap + 3 platforms
//
// Box roll thresholds:
//   0-4  → no boxes
//   5-9  → normal boxes
//   10-14 → shaking boxes
//   15-20 → ghost boxes
//
// Catwalk roll thresholds:
//   0-5  → no catwalk
//   6-11 → falling boards
//   12-16 → spider entity
//   17-20 → spider + falling boards
//
// Light roll thresholds:
//   0-13 → normal ceiling light
//   14-17 → fog
//   18-20 → fog + smiley

function buildChunks(count, defaults, overrides = []) {
    return Array.from({ length: count }, (_, i) => ({
        ...defaults,
        ...overrides[i],
    }));
}

function getLevelConfig(levelNum) {
    switch (levelNum) {

        case 0: // ── Tutorial ──────────────────────────────────────
            return {
                chunkCount: 5,
                message: "Hi #@$!%@, you have no idea where you are right now so let me help you a little here. You are going to walk to the other side of this room, but there are a couple of obstacles. So you are going to press [SPACE] to jump. And pressing [E] might help you a little too. Good luck!",
                chunks: [
                    // RC1: small gap only, no boxes, no catwalk, no fog
                    { floor: [4, 8],  box: [0, 9], catwalk: [0, 0], light: [0, 0] },
                    // RC2: solid floor only
                    { floor: [0, 3],  box: [0, 9], catwalk: [0, 0], light: [0, 0] },
                    // RC3: large gap + 1 platform (freeze required)
                    { floor: [9, 15], box: [0, 9], catwalk: [0, 0], light: [0, 0] },
                    // RC4: any of the three safe floor types
                    { floor: [0, 15], box: [0, 9], catwalk: [0, 0], light: [0, 0] },
                    // RC5: same as RC4
                    { floor: [0, 15], box: [0, 9], catwalk: [0, 0], light: [0, 0] },
                ],
            };

        case 1: // ─── Level 1: Introductions ──────────────────────────────────
            return {
                chunkCount: 5,
                message: "Consider this an introduction to every other aspect of this room. For some reason the falling floorboards don't listen to your ability, IDK why.",
                chunks: buildChunks(5, { floor: [0, 16], box: [0, 11], catwalk: [0, 11], light: [0, 13] }),
            };

        case 2: // ─── Level 2: Up The Learning Curve ──────────────────────────
            return {
                chunkCount: 6,
                message: "Goood! You're learning, watch out for those shaking boxes, I hear they can shove you across the entire room!",
                chunks: buildChunks(6, { floor: [1, 17], box: [3, 14], catwalk: [0, 11], light: [0, 13] }),
            };
        
        case 3: // ─── Level 3: Box Hungry ────────────────────────────────────
            return {
                chunkCount: 6,
                message: "If the shaking boxes weren't enough, the ghost boxes will get you. But beware, if you see them glow, RUN!",
                chunks: buildChunks(6, { floor: [0, 16], box: [6, 18], catwalk: [0, 9], light: [0, 13] }),
            };

        case 4: // ─── Level 4: Lights Out ────────────────────────────────────
            return {
                chunkCount: 6,
                message: "So we have been behind on the electric bill, no pressure though. You Got This!",
                chunks: buildChunks(6, { floor: [3, 17], box: [0, 14], catwalk: [2, 10], light: [5, 16] }),
            };

        case 5: // ─── Level 5: Mr Spider ─────────────────────────────────────
            return {
                chunkCount: 7,
                message: "So we kind of have a spider infestation here, you should be fine as long as you're not right underneath him. You're ability may or may not work against him.",
                chunks: buildChunks(7, { floor: [4, 18], box: [0, 15], catwalk: [12, 16], light: [0, 14] }),
            };

        case 6: // ─── Level 6: Upping The Ante ─────────────────────────────────────
            return {
                chunkCount: 7,
                message: "So everything here is harder, that's about it.",
                chunks: buildChunks(7, { floor: [0, 20], box: [0, 18], catwalk: [0, 17], light: [0, 16] }),
            };

        case 7: // ─── Level 7: Hey Mr Smiley ─────────────────────────────────────
            return {
                chunkCount: 8,
                message: "So since we've started to have electrical problems, we've been getting reports about this entity caled Mr Smiley, he's fast but hopefully you can press [E] faster!",
                chunks: buildChunks(8, { floor: [0, 8], box: [0, 10], catwalk: [0, 12], light: [10, 20] }),
            };

        case 8: // ─── Level 8: Everything is On The Table ────────────────────────
            return {
                chunkCount: 8,
                message: "I think that is about it. Good Luck!",
                chunks: buildChunks(8, { floor: [0, 20], box: [0, 20], catwalk: [0, 16], light: [0, 20] }),
            };

        case 9: // ─── Level 9: Spider's Return ──────────────────────────────────
            return {
                chunkCount: 9,
                message: "The spiders are back! Hope you're prepared.",
                chunks: buildChunks(9, { floor: [0, 20], box: [0, 20], catwalk: [12, 20], light: [0, 16] }),
            };

        case 10: // ─── Level 10: Raising The Stakes ─────────────────────────────
            return {
                chunkCount: 10,
                message: "Complete this! And you'll finally know who you are!",
                chunks: buildChunks(10, { floor: [6, 20], box: [10, 20], catwalk: [7, 20], light: [6, 20] }),
            };

        case -2: // ─── Level Custom: You Decide ─────────────────────────────────
            const ch = loadChallengeSettings();
            return {
                chunkCount: ch.chunkCount,
                message: "",
                chunks: buildChunks(ch.chunkCount, {
                    floor:   [ch.floor.min,   ch.floor.max],
                    box:     [ch.box.min,     ch.box.max],
                    catwalk: [ch.catwalk.min, ch.catwalk.max],
                    light:   [ch.light.min,   ch.light.max],
                }),
            };

        default: // ── Fully random (fallback for unbuilt levels) ───
            return {
                chunkCount: 5,
                message: "Random Level, enjoy.",
                chunks: Array(5).fill({}), // empty = all [0,20] defaults
            };
    }
}

export function initLevel(k) {
    resetFog();

    k.scene("level", () => {

        const settings = createSettingsOverlay(k);
        const bulletin = (() => {
            let open = false;
            return {
                isOpen: () => open,
                open()  { open = true; },
                close() { open = false; },
            };
        })();
        k.setGravity(1100);

        const levelNum = getCurrentLevel();
        const config   = getLevelConfig(levelNum);

        // ── Chunks ────────────────────────────────────────────────
        const c1  = buildChunk1(k, 0, config.message);

        const randomChunks = config.chunks.map((rollRanges, i) => {
            const xOff = CHUNK_W * (i + 1);
            return buildRandomChunk(k, xOff, () => k.go("level"), () => isaac, rollRanges);
        });

        const c20xOff = CHUNK_W * (config.chunkCount + 1);
        const c20 = buildChunk20(k, c20xOff, () => {
            if (levelNum >= 0) completeLevel();
            resetFog();
            fadeToScene(k, "menuRoom");
        });

        // Total width = chunk1 + N random chunks + chunk20
        const totalChunks = config.chunkCount + 2;

        // ── Floor (decorative background only) ───────────────────
        k.add([
            k.rect(CHUNK_W * totalChunks, FLOOR_H),
            k.pos(0, FLOOR_Y),
            k.color(...COL_FLOOR),
            k.z(0),
        ]);

        // ── Floor trim ────────────────────────────────────────────
        k.add([k.rect(CHUNK_W * totalChunks, 5), k.pos(0, FLOOR_Y), k.color(...COL_TRIM), k.opacity(0.9), k.z(0)]);
        k.add([k.rect(CHUNK_W * totalChunks, 1), k.pos(0, FLOOR_Y - 1), k.color(3, 2, 9), k.opacity(0.7), k.z(0)]);

        // ── Ceiling ───────────────────────────────────────────────
        k.add([
            k.rect(CHUNK_W * totalChunks, CEIL_H),
            k.pos(0, 0),
            k.color(...COL_WALL),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
        k.add([k.rect(CHUNK_W * totalChunks, 3), k.pos(0, CEIL_H), k.color(...COL_TRIM), k.opacity(0.85), k.z(0)]);
        k.add([k.rect(CHUNK_W * totalChunks, 1), k.pos(0, CEIL_H + 3), k.color(4, 3, 10), k.opacity(0.7), k.z(0)]);

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

        // ── Spawn grace timer ─────────────────────────────────────
        let spawnTimer = 0;
        k.onUpdate(() => { spawnTimer += k.dt(); });

        // ── Isaac update ──────────────────────────────────────────
        isaac.onUpdate(() => {
            if (!settings.isOpen() && !bulletin.isOpen()) {
                if (k.isKeyDown("left") || k.isKeyDown("a")) isaac.move(-185, 0);
                else if (k.isKeyDown("right") || k.isKeyDown("d")) isaac.move(185, 0);
            }

            isaacHead.pos.x = isaac.pos.x + ISAAC_W / 2 - 10;
            isaacHead.pos.y = isaac.pos.y - 22;

            c20.checkCollect(isaac);

            if (spawnTimer > 0.5) {
                for (let i = 0; i < randomChunks.length; i++) {
                    const chunk    = randomChunks[i];
                    const chunkXOff = CHUNK_W * (i + 1);
                    chunk.checkDeath(isaac);
                    if (!chunk.destroyed && isaac.pos.x > chunkXOff + CHUNK_W * 2) {
                        chunk.destroyChunk();
                        chunk.destroyed = true;
                    }
                }
            }

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

        const bulletinPrompt = k.add([
            k.pos(c1.bulletinPromptX, c1.bulletinPromptY),
            k.z(91),
            { alpha: 0, draw() { k.drawText({ text: "[ E ]", pos: k.vec2(0, 0), size: 14,
            font: "monospace", color: k.rgb(195, 175, 230), opacity: this.alpha }); } },
        ]);

        // ── Proximity state ───────────────────────────────────────
        let nearDoor = false;
        let nearDesk = false;
        let nearBulletin = false;


        // ── Single unified onUpdate ───────────────────────────────
        k.onUpdate(() => {
            const isaacCX = isaac.pos.x + ISAAC_W / 2;
            nearDoor = Math.abs(isaacCX - c1.doorCX) < DOOR_PROXIMITY;
            nearDesk = Math.abs(isaacCX - c1.deskCX) < DESK_PROXIMITY;
            nearBulletin = Math.abs(isaacCX - c1.bulletinCX) < c1.bulletinProximity;

            const rate = k.dt() * 5;
            const so = settings.isOpen();
            doorGlow.glowOpacity += ((nearDoor && !so ? 0.38 : 0.18) - doorGlow.glowOpacity) * rate;
            doorPrompt.alpha += ((nearDoor && !so ? 1 : 0) - doorPrompt.alpha) * rate;
            deskPrompt.alpha += ((nearDesk && !so ? 1 : 0) - deskPrompt.alpha) * rate;
            bulletinPrompt.alpha += ((nearBulletin && !so && !bulletin.isOpen() ? 1 : 0) - bulletinPrompt.alpha) * rate;

            // Freeze countdown
            if (freeze.active) {
                freeze.timer -= k.dt();
                if (freeze.timer <= 0) {
                    freeze.timer = 0;
                    freeze.active = false;
                    freeze.cooldown = freeze.cooldownDuration;
                }
            } else if (freeze.cooldown > 0) {
                freeze.cooldown -= k.dt();
            } else {
                // refill when cooldown is done
                freeze.timer = Math.min(freeze.timer + k.dt() * (freeze.duration / freeze.cooldownDuration), freeze.duration);
            }
        });

        // ── Single unified onKeyPress e ───────────────────────────
        k.onKeyPress("e", () => {
            if (settings.isOpen()) return;
            if (nearDoor) {
                resetFog();
                freeze.active = false;
                freeze.timer  = freeze.duration;
                freeze.cooldown = 0;  
                fadeToScene(k, "menuRoom");
                return;
            }
            if (nearDesk) { settings.open(); return; }
            if (nearBulletin && !bulletin.isOpen()) { bulletin.open(); return; }
            if (freeze.active) {
                freeze.active = false;
            } else if (freeze.cooldown <= 0 && freeze.timer > 0) {
                freeze.active = true;
            }
        });

        // new:
        k.onKeyPress((key) => {
            if (bulletin.isOpen() && key !== "e") bulletin.close();
        });

        // ── Freeze UI bar ─────────────────────────────────────────
        k.add([k.pos(0, 0), k.z(95), k.fixed(), {
            draw() {
                if (freeze.active) {
                    const barW = (freeze.timer / freeze.duration) * 400;
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: 400, height: 4, color: k.rgb(30, 20, 50), opacity: 0.8 });
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: barW, height: 4, color: k.rgb(148, 100, 230), opacity: 0.95 });
                    k.drawText({ text: "TIME FROZEN", pos: k.vec2(W / 2 - 54, 65), size: 12, font: "monospace", color: k.rgb(180, 150, 230), opacity: 0.7 });
                } else if (freeze.cooldown > 0) {
                    const fillW = (1 - freeze.cooldown / freeze.cooldownDuration) * 400;
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: 400, height: 4, color: k.rgb(30, 20, 50), opacity: 0.8 });
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: fillW, height: 4, color: k.rgb(80, 50, 130), opacity: 0.95 });
                    k.drawText({ text: "RECHARGING", pos: k.vec2(W / 2 - 44, 65), size: 12, font: "monospace", color: k.rgb(120, 90, 170), opacity: 0.7 });
                }
            },
        }]);

        

        // ── Bulletin Object ─────────────────────────────────────────
        k.add([k.pos(0, 0), k.z(200), k.fixed(), {
            draw() {
                if (!bulletin.isOpen()) return;
                k.drawRect({ pos: k.vec2(0, 0), width: W, height: H,
                            color: k.rgb(0, 0, 0), opacity: 0.6 });
                const PW = 480, PH = 320;
                const PX = W / 2 - PW / 2, PY = H / 2 - PH / 2;
                k.drawRect({ pos: k.vec2(PX, PY), width: PW, height: PH,
                            color: k.rgb(22, 18, 35), opacity: 0.97, radius: 4 });
                k.drawRect({ pos: k.vec2(PX, PY), width: PW, height: 2,
                            color: k.rgb(80, 60, 120), opacity: 0.8 });
                k.drawRect({ pos: k.vec2(PX, PY + PH - 2), width: PW, height: 2,
                            color: k.rgb(80, 60, 120), opacity: 0.8 });
                k.drawText({ text: config.message,
                            pos: k.vec2(PX + 36, PY + 36),
                            size: 16, font: "monospace",
                            color: k.rgb(195, 180, 220), width: PW - 72 });
                k.drawText({ text: "[ any key to close ]",
                            pos: k.vec2(PX + PW / 2 - 80, PY + PH - 32),
                            size: 12, font: "monospace",
                            color: k.rgb(100, 85, 130), opacity: 0.7 });
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