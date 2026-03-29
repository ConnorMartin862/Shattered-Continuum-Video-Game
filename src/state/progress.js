// ── Progress state ────────────────────────────────────────────────
// Persists current level to localStorage across sessions

const STORAGE_KEY = 'sc_progress';

const defaultProgress = {
    currentLevel: 0,
    highestLevel: 0,
};

function load() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {}
    return { ...defaultProgress };
}

function save(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
}

// ── Public API ────────────────────────────────────────────────────
let state = load();

export function getCurrentLevel() {
    return state.currentLevel;
}

export function getHighestLevel() {
    return state.highestLevel;
}

export function completeLevel() {
    state.currentLevel = Math.min(state.currentLevel + 1, 11);
    if (state.currentLevel > state.highestLevel) {
        state.highestLevel = state.currentLevel;
    }
    save(state);
}

export function resetProgress() {
    state = { ...defaultProgress };
    save(state);
}

export function getChalkProgress() {
    // Returns how many letters of "MY NAME IS ISSAC" have been revealed
    // MY = start (level 0), N after tutorial (level 1), then one per level
    const level = state.highestLevel;
    return Math.min(level + 2, 13); // +2 because "MY" visible from start
}