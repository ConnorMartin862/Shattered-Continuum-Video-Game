// ── Shared ability state ────────────────────────────────────────
export const STAMINA_MAX = 5;
export const FREEZE_DRAIN_RATE = 1 * (2 / 3);      // 33% slower drain
export const COOLDOWN_DURATION = 2.5;
export const REFILL_RATE = STAMINA_MAX / COOLDOWN_DURATION;
export const RESET_COST_PCT = 0.30;

export const ability = {
    freezeActive: false,
    stamina: STAMINA_MAX,
    cooldown: 0,
    resetPulse: 0,
};

export function triggerReset() {
    ability.stamina = Math.max(0, ability.stamina - STAMINA_MAX * RESET_COST_PCT);
    ability.resetPulse++;
}