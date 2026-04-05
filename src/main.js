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

initMenuRoom(k);
initLevel(k);

k.onLoad(() => {
    k.go("menuRoom");
});
