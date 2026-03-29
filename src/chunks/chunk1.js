// ── Chunk 1 ───────────────────────────────────────────────────────
// Always the first chunk of every level.
// Contains: back-to-menu door (left wall), settings desk, bulletin board.
// Does NOT create floor / ceiling / lighting — those are level-wide.

const FLOOR_Y = 578;
const CEIL_H  = 48;

export const WALL_T  = 82;
export const CHUNK_W = Math.floor(1280 * 2 / 3);   // 853

const COL_FLOOR = [16, 13, 28];
const COL_WALL  = [14, 12, 26];

// Door
const DOOR_H = 138;
const DOOR_Y = FLOOR_Y - DOOR_H;   // 440

// Desk
const DESK_REL_X = 280;
const DESK_W     = 112;
const DESK_TOP_Y = FLOOR_Y - 52;

// Bulletin board
const BULLETIN_REL_X    = CHUNK_W - 120;
const BULLETIN_W        = 72;
const BULLETIN_H        = 90;
const BULLETIN_Y        = FLOOR_Y - 180;
const BULLETIN_PROXIMITY = 120;

export function buildChunk1(k, xOff = 0, message = "") {

    // ── Left wall — split around door opening ──────────────────────
    k.add([
        k.rect(WALL_T, FLOOR_Y - CEIL_H),
        k.pos(30, CEIL_H),
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

    // Below door (small strip between door bottom and floor)
    const doorBottom = DOOR_Y + DOOR_H; // 440 + 138 = 578
    if (doorBottom < FLOOR_Y) {
        k.add([
            k.rect(WALL_T, FLOOR_Y - doorBottom),
            k.pos(xOff, doorBottom),
            k.color(...COL_WALL),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
    }
    const bottomHeight = FLOOR_Y - doorBottom;
    if (bottomHeight > 0) {
        k.add([
            k.rect(WALL_T, bottomHeight),
            k.pos(xOff, doorBottom),
            k.color(...COL_WALL),
            k.area(),
            k.body({ isStatic: true }),
            k.z(0),
        ]);
    }

    // Inner-face shadow line
    k.add([k.rect(2, FLOOR_Y - CEIL_H), k.pos(xOff + WALL_T, CEIL_H), k.color(5, 4, 12), k.opacity(0.55), k.z(0)]);

    // ── Door void + frame ──────────────────────────────────────────
    k.add([k.rect(WALL_T, DOOR_H), k.pos(xOff, DOOR_Y), k.color(4, 3, 9), k.z(15)]);
    // Top bar
    k.add([k.rect(WALL_T + 10, 6), k.pos(xOff - 5, DOOR_Y - 6), k.color(36, 30, 50), k.z(15)]);
    // Right jamb
    k.add([k.rect(6, DOOR_H + 6), k.pos(xOff + WALL_T - 6, DOOR_Y - 2), k.color(36, 30, 50), k.z(15)]);
    // Upper panel recess
    k.add([k.rect(WALL_T - 12, DOOR_H / 2 - 14), k.pos(xOff + 6, DOOR_Y + 8),
           k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
    // Lower panel recess
    k.add([k.rect(WALL_T - 12, DOOR_H / 2 - 20), k.pos(xOff + 6, DOOR_Y + DOOR_H / 2 + 4),
           k.color(9, 7, 14), k.outline(1, k.rgb(38, 32, 52)), k.z(15)]);
    // Handle
    k.add([k.rect(4, 14), k.pos(xOff + WALL_T - 14, DOOR_Y + DOOR_H / 2 - 7), k.color(55, 46, 72), k.z(15)]);

    // ── Desk ──────────────────────────────────────────────────────
    const deskX = xOff + DESK_REL_X;
    // Legs
    k.add([k.rect(7, 44), k.pos(deskX + 8,           DESK_TOP_Y + 10), k.color(25, 20, 38), k.z(8)]);
    k.add([k.rect(7, 44), k.pos(deskX + DESK_W - 15, DESK_TOP_Y + 10), k.color(25, 20, 38), k.z(8)]);
    // Surface
    k.add([k.rect(DESK_W, 11), k.pos(deskX, DESK_TOP_Y),     k.color(28, 24, 44),          k.z(8)]);
    k.add([k.rect(DESK_W, 2),  k.pos(deskX, DESK_TOP_Y),     k.color(40, 34, 62), k.opacity(0.85), k.z(8)]);
    // Items on desk
    k.add([k.rect(34, 5), k.pos(deskX + 18,           DESK_TOP_Y - 5), k.color(48, 44, 65), k.opacity(0.75), k.z(8)]);
    k.add([k.rect(2,  28), k.pos(deskX + DESK_W - 28, DESK_TOP_Y - 5), k.color(55, 50, 72), k.opacity(0.6),  k.z(8)]);

    // ── Bulletin board ─────────────────────────────────────────────
    const bx = xOff + BULLETIN_REL_X;
    // Backing board
    k.add([k.rect(BULLETIN_W + 10, BULLETIN_H + 10), k.pos(bx - 5, BULLETIN_Y - 5),
           k.color(22, 18, 35), k.z(8)]);
    // Paper
    k.add([k.rect(BULLETIN_W, BULLETIN_H), k.pos(bx, BULLETIN_Y),
           k.color(38, 32, 52), k.z(9)]);
    // Pin top-left
    k.add([k.circle(3), k.pos(bx + 6, BULLETIN_Y + 6),
           k.color(140, 100, 180), k.z(10)]);
    // Pin top-right
    k.add([k.circle(3), k.pos(bx + BULLETIN_W - 6, BULLETIN_Y + 6),
           k.color(140, 100, 180), k.z(10)]);
    // Decorative lines suggesting text
    for (let i = 0; i < 5; i++) {
        const lw = i === 4 ? BULLETIN_W * 0.5 : BULLETIN_W - 14;
        k.add([k.rect(lw, 2), k.pos(bx + 7, BULLETIN_Y + 20 + i * 13),
               k.color(55, 48, 72), k.opacity(0.7), k.z(10)]);
    }

    return {
        // Door
        doorCX:           xOff + WALL_T / 2,
        doorCY:           DOOR_Y + DOOR_H / 2,
        doorPromptX:      xOff + WALL_T + 6,
        doorPromptY:      DOOR_Y - 34,
        // Desk
        deskCX:           deskX + DESK_W / 2,
        deskPromptX:      deskX + DESK_W / 2 - 18,
        deskPromptY:      DESK_TOP_Y - 34,
        // Bulletin
        bulletinCX:       bx + BULLETIN_W / 2,
        bulletinPromptX:  bx + BULLETIN_W / 2 - 18,
        bulletinPromptY:  BULLETIN_Y - 34,
        bulletinProximity: BULLETIN_PROXIMITY,
    };
}