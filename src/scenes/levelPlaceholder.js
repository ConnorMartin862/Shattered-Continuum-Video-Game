import { drawVignette, fadeToScene } from "./menuRoom.js";

const W = 1280;
const H = 720;

export function initLevelPlaceholder(k) {
    k.scene("levelPlaceholder", () => {

        // Fade in from black
        const fadeRect = k.add([
            k.rect(W, H),
            k.pos(0, 0),
            k.color(0, 0, 0),
            k.opacity(1),
            k.z(100),
        ]);

        let alpha = 1;
        const fadeIn = k.onUpdate(() => {
            alpha -= k.dt() * 2.5;
            fadeRect.opacity = Math.max(alpha, 0);
            if (alpha <= 0) fadeIn.cancel();
        });

        // Chapter label (small, upper)
        k.add([
            k.text("chapter 1", {
                size: 14,
                font: "monospace",
            }),
            k.pos(W / 2, H / 2 - 52),
            k.anchor("center"),
            k.color(90, 82, 105),
            k.opacity(0.55),
            k.z(10),
        ]);

        // Main title
        k.add([
            k.text("LEVEL 1  —  WAREHOUSE", {
                size: 34,
                font: "monospace",
            }),
            k.pos(W / 2, H / 2),
            k.anchor("center"),
            k.color(200, 195, 215),
            k.opacity(0.9),
            k.z(10),
        ]);

        // Subtitle hint
        k.add([
            k.text("[ work in progress ]", {
                size: 13,
                font: "monospace",
            }),
            k.pos(W / 2, H / 2 + 44),
            k.anchor("center"),
            k.color(75, 68, 88),
            k.opacity(0.5),
            k.z(10),
        ]);

        // Return prompt
        k.add([
            k.text("press  ESC  to return", {
                size: 13,
                font: "monospace",
            }),
            k.pos(W / 2, H - 36),
            k.anchor("center"),
            k.color(65, 60, 78),
            k.opacity(0.45),
            k.z(10),
        ]);

        // ── Narrator scaffold — bottom caption bar ──────────────
        // This is where the mad scientist's dialogue will live.
        k.add([
            k.rect(900, 1),
            k.pos(W / 2 - 450, H - 70),
            k.color(55, 50, 68),
            k.opacity(0.25),
            k.z(10),
        ]);

        // ── Vignette ────────────────────────────────────────────
        k.add([
            k.pos(0, 0),
            k.z(80),
            {
                draw() {
                    drawVignette(k);
                },
            },
        ]);

        // ── Input ───────────────────────────────────────────────
        k.onKeyPress("escape", () => {
            fadeToScene(k, "menuRoom");
        });

    });
}
