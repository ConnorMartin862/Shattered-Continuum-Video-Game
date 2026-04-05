import { freeze } from "../state/freezeState.js";

// ── Chunk 20 ──────────────────────────────────────────────────────
// Always the final chunk of every level.
// Contains: pedestal on the right side, glitching memory shard on top.
// Collecting the shard triggers a flash then teleports back to menuRoom.

export const CHUNK_W = Math.floor(1280 * 2 / 3); // 853 — matches chunk1

const FLOOR_Y = 578;
const CEIL_H = 48;
const WALL_T = 82;

// Pedestal
const PED_W = 60;
const PED_H = 55;
const PED_REL_X = CHUNK_W - 180; // right side, near end
const PED_Y = FLOOR_Y - PED_H;

// Shard (circular sector / pizza slice shape, sits on top of pedestal)
const SHARD_CX = PED_REL_X + PED_W / 2;  // center x relative to xOff
const SHARD_CY = PED_Y - 28;              // floats above pedestal top
const SHARD_R = 22;

const COL_WALL = [14, 12, 26];
const COL_FLOOR = [16, 13, 28];
const COL_TRIM = [22, 18, 40];

// Shard teleport positions (y values) — index 0 is the only reachable one
const shardPositions = [
    PED_Y - 28,           // 0 — bottom, on pedestal (reachable)
    PED_Y - 130,          // 1 — mid low
    PED_Y - 230,          // 2 — mid high
    PED_Y - 320,          // 3 — near ceiling (unreachable)
];

let currentPos = 0;
let teleportTimer = 0;
const teleportInterval = 1.4; // seconds between teleports

export function buildChunk20(k, xOff = 0, onCollect) {

    // ── Right wall ────────────────────────────────────────────────
    k.add([
        k.rect(WALL_T, FLOOR_Y - CEIL_H),
        k.pos(xOff + CHUNK_W - WALL_T, CEIL_H),
        k.color(...COL_WALL),
        k.area(),
        k.body({ isStatic: true }),
        k.z(0),
    ]);

    // ── Floor ─────────────────────────────────────────────────────
    k.add([
        k.rect(CHUNK_W, 20),
        k.pos(xOff, FLOOR_Y),
        k.color(...COL_FLOOR),
        k.area(),
        k.body({ isStatic: true }),
        k.z(0),
    ]);

    // ── Light bulb hanging from ceiling ───────────────────────────
    const bulbX = xOff + CHUNK_W / 2;
    const bulbY = 200;
    // Cord
    k.add([k.rect(2, bulbY - CEIL_H - 18), k.pos(bulbX - 1, CEIL_H), k.color(10, 10, 10), k.z(0)]);
    // Socket
    k.add([k.rect(10, 10), k.pos(bulbX - 5, bulbY - 18), k.color(32, 28, 48), k.z(0)]);
    // Bulb base
    k.add([k.rect(8, 6), k.pos(bulbX - 4, bulbY - 10), k.color(42, 38, 58), k.z(0)]);
    // Bulb
    k.add([k.pos(0, 0), k.z(5), {
        draw() {
            k.drawCircle({ pos: k.vec2(bulbX, bulbY + 6), radius: 12, color: k.rgb(180, 175, 220), opacity: 0.15 });
            k.drawCircle({ pos: k.vec2(bulbX, bulbY + 6), radius: 7,  color: k.rgb(200, 195, 235), opacity: 0.9 });
            k.drawCircle({ pos: k.vec2(bulbX, bulbY + 5), radius: 3,  color: k.rgb(240, 238, 255), opacity: 1 });
        },
    }]);
    // Light cone
    k.add([k.pos(0, 0), k.z(5), {
        draw() {
            for (let i = 28; i >= 0; i--) {
                const t = i / 28;
                k.drawCircle({
                    pos:     k.vec2(bulbX, bulbY),
                    radius:  420 * t,
                    color:   k.rgb(155, 162, 215),
                    opacity: Math.pow(1 - t, 3.5) * 0.12,
                });
            }
        },
    }]);

    // Inner shadow
    k.add([
        k.rect(2, FLOOR_Y - CEIL_H),
        k.pos(xOff + CHUNK_W - WALL_T - 2, CEIL_H),
        k.color(5, 4, 12),
        k.opacity(0.55),
        k.z(0),
    ]);

    // ── Pedestal ──────────────────────────────────────────────────
    const pedX = xOff + PED_REL_X;

    // Base slab
    k.add([
        k.rect(PED_W, PED_H),
        k.pos(pedX, PED_Y),
        k.color(28, 22, 48),
        k.area(),
        k.body({ isStatic: true }),
        k.z(8),
    ]);
    // Top highlight
    k.add([k.rect(PED_W, 3), k.pos(pedX, PED_Y), k.color(52, 40, 82), k.opacity(0.9), k.z(8)]);
    // Side shadow
    k.add([k.rect(4, PED_H), k.pos(pedX + PED_W - 4, PED_Y), k.color(8, 6, 16), k.opacity(0.6), k.z(8)]);
    // Carved detail lines
    k.add([k.rect(PED_W - 12, 1), k.pos(pedX + 6, PED_Y + 14), k.color(42, 32, 68), k.opacity(0.7), k.z(8)]);
    k.add([k.rect(PED_W - 12, 1), k.pos(pedX + 6, PED_Y + 28), k.color(42, 32, 68), k.opacity(0.7), k.z(8)]);

    // ── Shard ─────────────────────────────────────────────────────
    // Drawn as a custom shape using triangles to approximate a pizza slice
    // Glitches by randomly offsetting draw position each frame

    const shardCX = xOff + SHARD_CX;
    const shardCY = SHARD_CY;  // kept for the purple ambient light below

    // Move these INSIDE buildChunk20, after pedestal code
    let collected = false;
    let glitchTimer = 0;
    let glitchX = 0;
    let glitchY = 0;
    let bobTimer = 0;
    let currentPos = 0;
    let teleportTimer = 0;
    const teleportInterval = 1.4;

    const shardPositions = [
        PED_Y - 28,   // 0 — bottom, reachable
        PED_Y - 130,  // 1 — mid low
        PED_Y - 230,  // 2 — mid high
        PED_Y - 320,  // 3 — near ceiling
    ];

    // Invisible hitbox for collection
    const shardHitbox = k.add([
        k.rect(SHARD_R * 2, SHARD_R * 2),
        k.pos(shardCX - SHARD_R, shardCY - SHARD_R),
        k.area(),
        k.opacity(0),
        k.z(8),
        "shard",
    ]);

    // Visual shard object
    const shardVisual = k.add([
        k.pos(0, 0),
        k.z(25),
        {
            update() {
                if (collected) return;

                bobTimer += k.dt();
                glitchTimer += k.dt();

                // Glitch offset
                if (glitchTimer > 0.08) {
                    glitchTimer = 0;
                    const glitching = Math.random() < 0.55;
                    glitchX = glitching ? (Math.random() - 0.5) * 6 : 0;
                    glitchY = glitching ? (Math.random() - 0.5) * 4 : 0;
                }

                // Shard teleport movement — skip if frozen
                if (!freeze.active) {
                    teleportTimer += k.dt();
                    if (teleportTimer >= teleportInterval) {
                        teleportTimer = 0;
                        // Pick a random different position
                        let next = currentPos;
                        while (next === currentPos) next = Math.floor(Math.random() * shardPositions.length);
                        currentPos = next;
                    }
                }

                // Sync hitbox to current position — only reachable at position 0 (bottom)
                const target = shardPositions[currentPos];
                shardHitbox.pos.x = shardCX - SHARD_R + (glitchX * 0.5);
                shardHitbox.pos.y = target - SHARD_R;
            },

            draw() {
                if (collected) return;

                const target = shardPositions[currentPos];
                const cx = shardCX + glitchX;
                const cy = target + glitchY;  // ← uses current position, not hardcoded shardCY

                // Glow layers
                const glowSteps = 10;
                for (let i = glowSteps; i >= 0; i--) {
                    const t = i / glowSteps;
                    k.drawCircle({
                        pos: k.vec2(cx, cy),
                        radius: (SHARD_R + 20) * t,
                        color: k.rgb(148, 80, 210),
                        opacity: (1 - t) * 0.22,
                    });
                }

                const angles = [[-50, -17], [-17, 17], [17, 50]];
                const toRad = deg => (deg * Math.PI) / 180;

                for (const [a1, a2] of angles) {
                    k.drawTriangle({
                        p1: k.vec2(cx, cy),
                        p2: k.vec2(cx + Math.cos(toRad(a1)) * SHARD_R, cy + Math.sin(toRad(a1)) * SHARD_R),
                        p3: k.vec2(cx + Math.cos(toRad(a2)) * SHARD_R, cy + Math.sin(toRad(a2)) * SHARD_R),
                        color: k.rgb(168, 100, 230),
                        opacity: 0.92,
                    });
                }

                k.drawCircle({ pos: k.vec2(cx, cy), radius: 4, color: k.rgb(210, 180, 255), opacity: 0.85 });

                if (glitchX !== 0) {
                    for (const [a1, a2] of angles) {
                        k.drawTriangle({
                            p1: k.vec2(cx + 3, cy),
                            p2: k.vec2(cx + 3 + Math.cos(toRad(a1)) * SHARD_R, cy + Math.sin(toRad(a1)) * SHARD_R),
                            p3: k.vec2(cx + 3 + Math.cos(toRad(a2)) * SHARD_R, cy + Math.sin(toRad(a2)) * SHARD_R),
                            color: k.rgb(80, 200, 255),
                            opacity: 0.18,
                        });
                    }
                }
            },
        },
    ]);

    // ── Dim purple light around pedestal area ─────────────────────
    k.add([k.pos(0, 0), k.z(5), {
        draw() {
            for (let i = 12; i >= 0; i--) {
                const t = i / 12;
                k.drawCircle({
                    pos: k.vec2(shardCX, shardCY),
                    radius: 160 * t,
                    color: k.rgb(130, 60, 200),
                    opacity: Math.pow(1 - t, 2) * 0.18,
                });
            }
        },
    }]);

    // ── Collection flash effect ───────────────────────────────────
    function triggerCollect() {
        if (collected) return;
        collected = true;

        // White flash overlay
        const flash = k.add([
            k.rect(1280, 720),
            k.pos(0, 0),
            k.color(200, 180, 255),
            k.opacity(0),
            k.z(150),
            k.fixed(),
        ]);

        let phase = 0; // 0 = flash in, 1 = hold, 2 = fade out
        let timer = 0;

        const ev = k.onUpdate(() => {
            timer += k.dt();

            if (phase === 0) {
                flash.opacity = Math.min(timer / 0.12, 1);
                if (timer >= 0.12) { phase = 1; timer = 0; }
            } else if (phase === 1) {
                if (timer >= 0.18) { phase = 2; timer = 0; }
            } else {
                flash.opacity = Math.max(1 - timer / 0.35, 0);
                if (timer >= 0.35) {
                    ev.cancel();
                    if (onCollect) onCollect();
                    else k.go("menuRoom");
                }
            }
        });
    }

    // ── Overlap detection ─────────────────────────────────────────
    // Called from level.js each frame — pass Isaac's area component
    return {
        checkCollect(isaac) {
            if (collected) return;
            if (isaac.isColliding(shardHitbox)) {
                triggerCollect();
            }
        },
        chunkRight: xOff + CHUNK_W,
    };
}