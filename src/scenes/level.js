// ── Level scene ───────────────────────────────────────────────────

import { createSettingsOverlay } from "./settings.js";
import { drawVignette, fadeToScene } from "./menuRoom.js";
import { buildChunk1, CHUNK_W, WALL_T } from "../chunks/chunk1.js";
import { buildChunk20 } from "../chunks/chunk20.js";
import { buildRandomChunk } from "../chunks/chunkRandom.js";
import { getCurrentLevel, completeLevel } from "../state/progress.js";
import { loadChallengeSettings } from "./challengeOverlay.js";
import { ability, triggerReset, STAMINA_MAX, FREEZE_DRAIN_RATE, COOLDOWN_DURATION, REFILL_RATE } from "../state/abilityState.js";
import { reaper, initReaper, registerReaperPulse, getReaperOpacity } from "../state/reaperState.js";

const W = 1280;
const H = 720;
const FLOOR_Y = 578;
const FLOOR_H = H - FLOOR_Y;
const CEIL_H = 48;

const ISAAC_W = 50;
const ISAAC_H = 125;

const DOOR_PROXIMITY = 130;
const DESK_PROXIMITY = 130;

const COL_WALL = [14, 12, 26];
const COL_FLOOR = [16, 13, 28];
const COL_TRIM = [22, 18, 40];



// ── Level configs ─────────────────────────────────────────────────
// Each level defines how many random chunks it has and what roll
// ranges to pass to buildRandomChunk for each chunk.
//
// rollRanges per chunk: { floor, box, catwalk, spider, light }
// Each is a [min, max] tuple. Omitted = [0, 20] (fully random).
// reaper is a level-wide [min, max] set on the level config itself
// (a sibling of chunkCount/message), not per-chunk — it's rolled once
// per level and stays constant for that entire playthrough.
//
// Floor roll thresholds:
//   0-3   → solid floor
//   4-7   → gap, no platform
//   8-11  → single platform
//   12-16 → double platform (synced flash)
//   17-20 → triple platform (staggered flash)
//
// Box roll thresholds:
//   0-4   → no boxes
//   5-9   → normal boxes (ramps 1→3)
//   10-14 → normal + shaking boxes
//   15-20 → normal + shaking + ghost boxes (1 ghost at 15-17, 2 at 18-20)
//
// Catwalk roll thresholds:
//   > 10 → falling boards present
//   ≤ 10 → no boards
//
// Spider roll thresholds:
//   > 10 → spider present, crawl speed scales 11→20
//   ≤ 10 → no spider
//
// Light roll thresholds:
//   0-10  → normal ceiling light
//   11-14 → fog
//   15-17 → fog + 1 smiley
//   18-20 → fog + 2 smilies
//
// Reaper roll thresholds:
//   0     → doesn't exist (infinite Pulse uses)
//   1-20  → exists; max Pulse uses per level scales from
//           chunkCount × 3 (at roll 1) down to chunkCount × 0.8 (at roll 20)

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
                reaper: [0,0],
                chunks: [
                    // RC1: small gap only, no boxes, no catwalk, no fog
                    { floor: [4, 7],  box: [0, 0], catwalk: [0, 0], spider: [0, 0], light: [0, 0] },
                    // RC2: solid floor only
                    { floor: [0, 3],  box: [0, 0], catwalk: [0, 0], spider: [0, 0], light: [0, 0] },
                    // RC3: large gap + 1 platform (freeze required)
                    { floor: [8, 8], box: [0, 0], catwalk: [0, 0], spider: [0, 0], light: [0, 0] },
                    // RC4: any of the three safe floor types
                    { floor: [0, 10], box: [0, 0], catwalk: [0, 0], spider: [0, 0], light: [0, 0] },
                    // RC5: same as RC4
                    { floor: [0, 10], box: [0, 0], catwalk: [0, 0], spider: [0, 0], light: [0, 0] },
                ],
            };

        case 1: // ─── Level 1: Introductions ──────────────────────────────────
            return {
                chunkCount: 5,
                message: "Consider this an introduction to every other aspect of this room. For some reason the falling floorboards don't listen to your ability, IDK why.",
                reaper: [0, 0],
                chunks: buildChunks(5, { floor: [0, 16], box: [0, 10], catwalk: [0, 15], spider: [0, 10], light: [0, 10] }),
            };

        case 2: // ─── Level 2: Up The Learning Curve ──────────────────────────
            return {
                chunkCount: 6,
                message: "Goood! You're learning, watch out for those shaking boxes, I hear they can shove you across the entire room!",
                reaper: [0, 0],
                chunks: buildChunks(6, { floor: [1, 17], box: [3, 14], catwalk: [0, 15], spider: [0, 10], light: [0, 10] }),
            };
        
        case 3: // ─── Level 3: Box Hungry ────────────────────────────────────
            return {
                chunkCount: 6,
                message: "If the shaking boxes weren't enough, the ghost boxes will get you. But beware, if you see them glow, RUN!",
                reaper: [0, 0],
                chunks: buildChunks(6, { floor: [0, 16], box: [6, 18], catwalk: [0, 10], spider: [0, 10], light: [0, 10] }),
            };

        case 4: // ─── Level 4: Lights Out ────────────────────────────────────
            return {
                chunkCount: 6,
                message: "So we have been behind on the electric bill, no pressure though. You Got This!",
                reaper: [0, 0],
                chunks: buildChunks(6, { floor: [3, 17], box: [0, 14], catwalk: [2, 15], spider: [0, 10], light: [5, 14] }),
            };

        case 5: // ─── Level 5: Mr Spider ─────────────────────────────────────
            return {
                chunkCount: 7,
                message: "So we kind of have a spider infestation here, you should be fine as long as you're not right underneath him. You're ability may or may not work against him.",
                reaper: [0, 0],
                chunks: buildChunks(7, { floor: [4, 18], box: [0, 15], catwalk: [0, 10], spider: [11, 20], light: [0, 14] }),
            };

        case 6: // ─── Level 6: Upping The Ante ─────────────────────────────────────
            return {
                chunkCount: 7,
                message: "So everything here is harder, that's about it.",
                reaper: [0, 0],
                chunks: buildChunks(7, { floor: [0, 20], box: [0, 18], catwalk: [0, 17], spider: [0, 17], light: [0, 16] }),
            };

        case 7: // ─── Level 7: Hey Mr Smiley ─────────────────────────────────────
            return {
                chunkCount: 8,
                message: "So since we've started to have electrical problems, we've been getting reports about this entity caled Mr Smiley, he's fast but hopefully you can press [E] faster!",
                reaper: [0, 2],
                chunks: buildChunks(8, { floor: [0, 8], box: [0, 10], catwalk: [0, 12], spider: [0, 10], light: [10, 20] }),
            };

        case 8: // ─── Level 8: Everything is On The Table ────────────────────────
            return {
                chunkCount: 8,
                message: "One additional tip, if you press [R], you can reset everything around you. Bet you would've loved to know about that in the last level, huh! Just don't use it too much, trust me.",
                reaper: [1, 5],
                chunks: buildChunks(8, { floor: [0, 20], box: [0, 20], catwalk: [0, 16], spider: [0, 20], light: [0, 17] }),
            };

        case 9: // ─── Level 9: Spider's Return ──────────────────────────────────
            return {
                chunkCount: 9,
                message: "The spiders are back! Hope you're prepared.",
                reaper: [1, 6],
                chunks: buildChunks(9, { floor: [0, 20], box: [0, 20], catwalk: [0, 20], spider: [11, 20], light: [0, 18] }),
            };

        case 10: // ─── Level 10: Raising The Stakes ─────────────────────────────
            return {
                chunkCount: 10,
                message: "Complete this! And you'll finally know who you are!",
                reaper: [2, 8],
                chunks: buildChunks(10, { floor: [6, 20], box: [10, 20], catwalk: [7, 20], spider: [7, 20], light: [6, 20] }),
            };

        case -2: // ─── Level Custom: You Decide ─────────────────────────────────
            const ch = loadChallengeSettings();
            return {
                chunkCount: ch.chunkCount,
                message: "",
                reaper: [ch.reaper.min, ch.reaper.max],
                chunks: buildChunks(ch.chunkCount, {
                    floor:   [ch.floor.min,   ch.floor.max],
                    box:     [ch.box.min,     ch.box.max],
                    catwalk: [ch.catwalk.min, ch.catwalk.max],
                    spider:  [ch.spider.min,  ch.spider.max],
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
    k.scene("level", () => {

        const settings = createSettingsOverlay(k);

        let isDying = false
        let staminaFlashTimer = 0;

        const bulletin = (() => {
            let open = false;
            return {
                isOpen: () => open,
                open()  { open = true; },
                close() { open = false; },
            };
        })();
        k.setGravity(1400);

        const levelNum = getCurrentLevel();
        const config   = getLevelConfig(levelNum);
        initReaper(config.reaper ?? [0, 0], config.chunkCount);

        // ── Chunks ────────────────────────────────────────────────
        const c1  = buildChunk1(k, 0, config.message);

        const c20xOff = CHUNK_W * (config.chunkCount + 1);
        const randomChunks = [];
        let builtCount = 0;
        let c20 = null;

        function buildNextChunk() {
            if (builtCount >= config.chunkCount) return;
            const i = builtCount;
            const xOff = CHUNK_W * (i + 1);
            const chunk = buildRandomChunk(k, xOff, () => {
                if (isDying) return;
                isDying = true;
                k.go("level");
            }, () => isaac, config.chunks[i]);
            randomChunks.push(chunk);
            builtCount++;
            console.log(`Built chunk ${i + 1} of ${config.chunkCount} at xOff ${xOff}`);


            if (builtCount === config.chunkCount) {
                c20 = buildChunk20(k, c20xOff, () => {
                    if (levelNum >= 0) completeLevel();
                    fadeToScene(k, "menuRoom");
                });
            }
        }

        // Seed first 3 chunks
        buildNextChunk();
        buildNextChunk();
        buildNextChunk();

        // ── Global fog overlay ────────────────────────────────────
        let fogTimer = 0;
        k.add([k.pos(0, 0), k.z(78), k.fixed(), {
            update() { fogTimer += k.dt(); },
            draw() {
                const inFogChunk = randomChunks.some((chunk, i) => {
                    if (!chunk.hasFog) return false;
                    const chunkXOff = CHUNK_W * (i + 1);
                    return isaac.pos.x > chunkXOff && isaac.pos.x < chunkXOff + CHUNK_W;
                });
                if (!inFogChunk) return;

                k.drawRect({ pos: k.vec2(0, 0), width: 1280, height: 720,
                            color: k.rgb(4, 3, 9), opacity: 0.55 });
                for (let i = 0; i < 5; i++) {
                    const speed   = 0.08 + i * 0.03;
                    const yPos    = 120 + i * 120;
                    const drift   = Math.sin(fogTimer * speed + i * 1.8) * 40;
                    const opacity = 0.06 + Math.sin(fogTimer * 0.4 + i) * 0.03;
                    k.drawRect({ pos: k.vec2(drift, yPos), width: 1280, height: 60,
                                color: k.rgb(8, 6, 16), opacity: Math.max(opacity, 0.03) });
                }
                for (let i = 8; i >= 0; i--) {
                    const t = i / 8;
                    k.drawCircle({ pos: k.vec2(1280 / 2, 720 / 2 + 60), radius: 80 * t,
                                color: k.rgb(20, 16, 35), opacity: (1 - t) * 0.35 });
                }
            },
        }]);

        // Total width = chunk1 + N random chunks + chunk20
        const totalChunks = config.chunkCount + 2;

        // ── Floor (decorative background only) ───────────────────
        k.add([
            k.rect(CHUNK_W, 20),
            k.pos(k.pos(30, CEIL_H), FLOOR_Y),
            k.color(...COL_FLOOR),
            k.area(),
            k.body({ isStatic: true }),
            k.z(1),   // was k.z(0)
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
        const BULB_X    = CHUNK_W / 2;
        const BULB_Y    = 200;
        // Cord
        k.add([k.rect(2, BULB_Y - CEIL_H - 18), k.pos(BULB_X - 1, CEIL_H), k.color(10, 10, 10), k.z(5)]);
        // Socket
        k.add([k.rect(10, 10), k.pos(BULB_X - 5, BULB_Y - 18), k.color(32, 28, 48), k.z(5)]);
        // Bulb base
        k.add([k.rect(8, 6), k.pos(BULB_X - 4, BULB_Y - 10), k.color(42, 38, 58), k.z(5)]);
        // Bulb
        k.add([k.pos(0, 0), k.z(5), {
            draw() {
                k.drawCircle({ pos: k.vec2(BULB_X, BULB_Y + 6), radius: 12, color: k.rgb(180, 175, 220), opacity: 0.15 });
                k.drawCircle({ pos: k.vec2(BULB_X, BULB_Y + 6), radius: 7,  color: k.rgb(200, 195, 235), opacity: 0.9 });
                k.drawCircle({ pos: k.vec2(BULB_X, BULB_Y + 5), radius: 3,  color: k.rgb(240, 238, 255), opacity: 1 });
            },
        }]);

        // ── Overhead light cone ───────────────────────────────────
        k.add([k.pos(0, 0), k.z(5), {
            draw() {
                for (let i = 28; i >= 0; i--) {
                    const t = i / 28;
                    k.drawCircle({
                        pos:     k.vec2(BULB_X, BULB_Y),
                        radius:  420 * t,
                        color:   k.rgb(155, 162, 215),
                        opacity: Math.pow(1 - t, 3.5) * 0.12,
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
            k.sprite("isaac"),
            k.pos(WALL_T + 70, FLOOR_Y - ISAAC_H),
            k.scale(1),
            k.area({ shape: new k.Rect(k.vec2(35, 26), ISAAC_W - 15, ISAAC_H - 30) }),
            k.body(),
            k.z(79),
            "issac",
        ]);
        isaac.play("idle");

        // ── Jump ──────────────────────────────────────────────────
        k.onKeyPress("space", () => {
            if (settings.isOpen() || reaper.dying) return;
            if (isaac.isGrounded()) {
                isaac.jump(420);
                isaac.play("jump");   // add this
            }
        });

        // ── Spawn grace timer ─────────────────────────────────────
        let spawnTimer = 0;
        k.onUpdate(() => { spawnTimer += k.dt(); });

        // ── Isaac update ──────────────────────────────────────────
        isaac.onUpdate(() => {
            if (!settings.isOpen() && !bulletin.isOpen() && !reaper.dying) {
                const speed = isaac.isGrounded() ? 185 : 240;
                if (k.isKeyDown("left") || k.isKeyDown("a")) {
                    isaac.move(-speed, 0);
                    isaac.flipX = true;
                    if (isaac.isGrounded() && isaac.curAnim() !== "run") isaac.play("run");
                } else if (k.isKeyDown("right") || k.isKeyDown("d")) {
                    isaac.move(speed, 0);
                    isaac.flipX = false;
                    if (isaac.isGrounded() && isaac.curAnim() !== "run") isaac.play("run");
                } else {
                    if (isaac.isGrounded() && isaac.curAnim() !== "idle") isaac.play("idle");
                }
            }

            if (isaac.isGrounded() && isaac.curAnim() === "jump") isaac.play("idle");

            const currentChunkIndex = Math.floor(isaac.pos.x / CHUNK_W);
            if (currentChunkIndex >= builtCount - 1 && builtCount < config.chunkCount) {
                buildNextChunk();
            }
            if (c20) c20.checkCollect(isaac);

            if (spawnTimer > 0.5) {
                for (let i = 0; i < randomChunks.length; i++) {
                    const chunk = randomChunks[i];
                    const chunkXOff = CHUNK_W * (i + 1);
                    chunk.checkDeath(isaac);
                    if (!chunk.destroyed && isaac.pos.x > chunkXOff + CHUNK_W * 2) {
                        chunk.destroyChunk();
                        chunk.destroyed = true;
                    }
                }
            }

            if (isaac.pos.y > H) {
                isaac.pos.x = WALL_T + 70;
                isaac.pos.y = FLOOR_Y - ISAAC_H - 80;
            }

            const targetX = isaac.pos.x + ISAAC_W / 2;
            k.camPos(Math.max(W / 2, targetX), H / 2);

            // Isaac Collider
            k.drawRect({
                pos: k.vec2(isaac.pos.x + 35, isaac.pos.y + 26),
                width: ISAAC_W - 15,
                height: ISAAC_H - 30,
                color: k.rgb(255, 0, 0),
                opacity: 0.0,
                fixed: false,
            });
        });

        // ── Door glow ─────────────────────────────────────────────
        const doorGlow = k.add([
            k.pos(80, 0),
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
            doorGlow.glowOpacity += ((nearDoor && !so ? 0.22 : 0.08) - doorGlow.glowOpacity) * rate;
            doorPrompt.alpha += ((nearDoor && !so ? 1 : 0) - doorPrompt.alpha) * rate;
            deskPrompt.alpha += ((nearDesk && !so ? 1 : 0) - deskPrompt.alpha) * rate;
            bulletinPrompt.alpha += ((nearBulletin && !so && !bulletin.isOpen() ? 1 : 0) - bulletinPrompt.alpha) * rate;

            // Freeze countdown
            if (ability.freezeActive) {
                ability.stamina -= k.dt() * FREEZE_DRAIN_RATE;
                if (ability.stamina <= 0) {
                    ability.stamina = 0;
                    ability.freezeActive = false;
                    ability.cooldown = COOLDOWN_DURATION;
                }
            } else if (ability.cooldown > 0) {
                ability.cooldown -= k.dt();
                if (ability.cooldown <= 0) {
                    ability.cooldown = 0;
                    ability.stamina = STAMINA_MAX;
                }
            } else {
                ability.stamina = Math.min(ability.stamina + k.dt() * REFILL_RATE, STAMINA_MAX);
            }

            if (staminaFlashTimer > 0) {
                staminaFlashTimer -= k.dt();
            }

            if (reaper.dying) {
                reaper.dyingTimer -= k.dt();
                if (reaper.dyingTimer <= 0) {
                    fadeToScene(k, "menuRoom");
                }
            }
        });

        // ── Single unified onKeyPress e ───────────────────────────
        k.onKeyPress("e", () => {
            if (settings.isOpen() || reaper.dying) return;
            if (nearDoor) {
                ability.freezeActive = false;
                ability.stamina  = STAMINA_MAX;
                ability.cooldown = 0;  
                fadeToScene(k, "menuRoom");
                return;
            }
            if (nearDesk) { settings.open(); return; }
            if (nearBulletin && !bulletin.isOpen()) { bulletin.open(); return; }
            if (ability.freezeActive) {
                ability.freezeActive = false;
            } else if (ability.cooldown <= 0 && ability.stamina > 0) {
                ability.freezeActive = true;
            }
        });

        k.onKeyPress("r", () => {
            if (settings.isOpen() || bulletin.isOpen() || reaper.dying) return;
            triggerReset();
            staminaFlashTimer = 1;
            registerReaperPulse();
        });

        k.onKeyPress((key) => {
            if (bulletin.isOpen() && key !== "e") bulletin.close();
        });

        // ── Freeze UI bar ─────────────────────────────────────────
        k.add([k.pos(0, 0), k.z(95), k.fixed(), {
            draw() {
                if (ability.freezeActive || staminaFlashTimer > 0) {
                    const barW = (ability.stamina / STAMINA_MAX) * 400;
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: 400, height: 4, color: k.rgb(18, 32, 22), opacity: 0.8 });
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: barW, height: 4, color: k.rgb(90, 210, 130), opacity: 0.95 });
                    k.drawText({ text: "STAMINA", pos: k.vec2(W / 2 - 25, 65), size: 12, font: "monospace", color: k.rgb(130, 220, 155), opacity: 0.7 });
                } else if (ability.cooldown > 0) {
                    const fillW = (1 - ability.cooldown / COOLDOWN_DURATION) * 400;
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: 400, height: 4, color: k.rgb(18, 32, 22), opacity: 0.8 });
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: fillW, height: 4, color: k.rgb(45, 110, 70), opacity: 0.95 });
                    k.drawText({ text: "RECHARGING", pos: k.vec2(W / 2 - 36, 65), size: 12, font: "monospace", color: k.rgb(90, 150, 110), opacity: 0.7 });
                } else {
                    // Progress bar
                    const totalWidth = CHUNK_W * (config.chunkCount + 2); // chunk1 + randoms + chunk20
                    const progress = Math.min(isaac.pos.x / totalWidth, 1);
                    const barW = progress * 400;
                    const chunk = Math.min(Math.floor(isaac.pos.x / CHUNK_W), config.chunkCount + 1);
                    const total = config.chunkCount + 2;
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: 400, height: 4, color: k.rgb(20, 16, 35), opacity: 0.7 });
                    k.drawRect({ pos: k.vec2(W / 2 - 200, 58), width: barW, height: 4, color: k.rgb(80, 130, 180), opacity: 0.85 });
                    k.drawText({ text: `${Math.floor(progress * 100)}%`, pos: k.vec2(W / 2 + 206, 52), size: 12, font: "monospace", color: k.rgb(100, 150, 200), opacity: 0.65 });                }
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

        // ── Reaper overlay ────────────────────────────────────────────
        k.add([k.pos(0, 0), k.z(500), k.fixed(), {
            draw() {
                const op = getReaperOpacity();
                if (op <= 0) return;
                k.drawSprite({ sprite: "reaper", pos: k.vec2(0, 0), width: W, height: H, opacity: op });
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