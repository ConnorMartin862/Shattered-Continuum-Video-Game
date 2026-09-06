// ── Reaper state ─────────────────────────────────────────────────
// Level-wide entity (not per-chunk). Tracks how many Time Reset (Pulse)
// presses the player has used this level, and derives the on-screen
// overlay opacity and death condition from that count. Resets every
// level — initReaper() is called fresh each time the level scene builds.

export const reaper = {
    aiLevel: 0,        // 0-20, rolled once per level
    maxUses: Infinity, // max Pulse presses allowed before death
    pulseCount: 0,     // Pulse presses used so far this level
    dying: false,      // true once the kill threshold is crossed
    dyingTimer: 0,     // counts down the 5s full-occupancy hold
};

const DYING_DURATION = 5;

function rollInRange([min, max]) {
    return Math.floor(min + Math.random() * (max - min + 1));
}

function scaledValue(x, xMin, xMax, yMin, yMax) {
    const t = xMax > xMin ? (x - xMin) / (xMax - xMin) : 1;
    const clampedT = Math.min(Math.max(t, 0), 1);
    return yMin + (yMax - yMin) * clampedT;
}

// Call once per level, right after chunkCount is known.
export function initReaper(reaperRange, chunkCount) {
    reaper.aiLevel = rollInRange(reaperRange);
    reaper.pulseCount = 0;
    reaper.dying = false;
    reaper.dyingTimer = 0;

    if (reaper.aiLevel === 0) {
        reaper.maxUses = Infinity;
    } else {
        const multiplier = scaledValue(reaper.aiLevel, 1, 20, 3, 0.8);
        reaper.maxUses = Math.round(chunkCount * multiplier);
    }
}

// Call every time Pulse fires. Returns true if this press was fatal.
export function registerReaperPulse() {
    if (reaper.aiLevel === 0 || reaper.dying) return false;
    reaper.pulseCount++;
    if (reaper.pulseCount > reaper.maxUses) {
        reaper.dying = true;
        reaper.dyingTimer = DYING_DURATION;
        return true;
    }
    return false;
}

// 0..1 — current overlay opacity (caps at 0.5 pre-death, 1 during dying)
export function getReaperOpacity() {
    if (reaper.dying) return 1;
    if (reaper.maxUses === Infinity) return 0;
    const t = Math.min(reaper.pulseCount / reaper.maxUses, 1);
    return t * 0.5;
}