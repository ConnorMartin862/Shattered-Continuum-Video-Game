import kaboom from "kaboom";
import { initMenuRoom } from "./scenes/menuRoom.js";
import { initLevel }    from "./scenes/level.js";

const k = kaboom({
    background: [8, 7, 18],
    width: 1280,
    height: 720,
    scale: 1,
    global: false,
    crisp: false,
});

k.loadFont("chalk", "/fonts/CabinSketch-Regular.ttf");

k.loadSprite("isaac", "/assets/isaacDraft.png", {
    sliceX: 8,
    sliceY: 4,
    anims: {
        idle: { from: 0, to: 3, speed: 6, loop: true },
        walk: { from: 8, to: 14, speed: 10, loop: true },
        run:  { from: 16, to: 23, speed: 12, loop: true },
        jump: { from: 24, to: 27, speed: 8, loop: false },
    },
});

k.loadSprite("reaper", "/assets/reaper_face_edited.png");

initMenuRoom(k);
initLevel(k);

k.onLoad(() => {
    k.go("menuRoom");
});
