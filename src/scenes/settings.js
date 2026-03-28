// Settings overlay — drawn at z=200, above everything in the room.
// createSettingsOverlay(k) returns an API: { open, close, isOpen, getSensitivity }
//
// Mouse tracking uses raw DOM events scaled to game coordinates.
// k.mousePos() uses a different coordinate space than the draw() calls,
// so we bypass it entirely for hit-testing.

const W = 1280;
const H = 720;

// Panel
const PW = 500, PH = 360;
const PX = (W - PW) / 2;   // 390
const PY = (H - PH) / 2;   // 180

// Sensitivity slider
const SLW = 260;
const SLX = W / 2 - SLW / 2;   // 510
const SLY = PY + 158;           // 338

// Quit button
const QW = 190, QH = 40;
const QX = W / 2 - QW / 2;
const QY = PY + 252;

// Quit confirmation buttons (sit where the single quit button was)
const YES_X = QX, YES_W = 88, YES_Y = QY, YES_H = QH;
const NO_X = QX + 102, NO_W = 88, NO_Y = QY, NO_H = QH;

function inRect(mx, my, x, y, w, h) {
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
}

export function createSettingsOverlay(k) {
    // ── DOM mouse tracking (scaled to 1280×720 game space) ──────────
    let mouseX = 0;
    let mouseY = 0;
    let mouseBtn = false;   // true while left button is held

    function onMove(e) {
        const canvas = document.querySelector("canvas");
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        mouseX = (e.clientX - r.left) / r.width * W;
        mouseY = (e.clientY - r.top) / r.height * H;
    }

    function onDown(e) {
        if (e.button !== 0) return;
        mouseBtn = true;
        if (!overlay.open) return;

        // Slider — start drag
        if (inRect(mouseX, mouseY, SLX - 12, SLY - 10, SLW + 24, 26)) {
            overlay.sensitivity = Math.max(0, Math.min(1, (mouseX - SLX) / SLW));
            dragging = true;
            return;
        }

        if (confirmQuit) {
            if (inRect(mouseX, mouseY, YES_X, YES_Y, YES_W, YES_H)) {
                window.location.href = "about:blank";
            }
            if (inRect(mouseX, mouseY, NO_X, NO_Y, NO_W, NO_H)) {
                confirmQuit = false;
            }
            return;
        }

        // Quit button
        if (inRect(mouseX, mouseY, QX, QY, QW, QH)) {
            confirmQuit = true;
        }
    }

    function onUp(e) {
        if (e.button !== 0) return;
        mouseBtn = false;
        if (dragging) {
            dragging = false;
            save(overlay.sensitivity);
        }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    // ── State ────────────────────────────────────────────────────────
    let dragging = false;
    let quitHover = false;
    let yesHover = false;
    let noHover = false;
    let confirmQuit = false;

    let initSens = 0.5;
    try {
        const s = parseFloat(localStorage.getItem("sc_sensitivity"));
        if (!isNaN(s)) initSens = Math.max(0, Math.min(1, s));
    } catch { }

    function save(val) {
        try { localStorage.setItem("sc_sensitivity", val.toFixed(4)); } catch { }
    }

    // ── Kaboom overlay object ────────────────────────────────────────
    const overlay = k.add([
        k.pos(0, 0),
        k.z(200),
        {
            open: false,
            sensitivity: initSens,

            update() {
                if (!this.open) return;

                // Drag slider
                if (dragging) {
                    if (mouseBtn) {
                        this.sensitivity = Math.max(0, Math.min(1, (mouseX - SLX) / SLW));
                    } else {
                        dragging = false;
                        save(this.sensitivity);
                    }
                }

                // Arrow / AD nudge (when not dragging)
                if (!dragging) {
                    if (k.isKeyDown("left") || k.isKeyDown("a")) {
                        this.sensitivity = Math.max(0, this.sensitivity - k.dt() * 0.45);
                    }
                    if (k.isKeyDown("right") || k.isKeyDown("d")) {
                        this.sensitivity = Math.min(1, this.sensitivity + k.dt() * 0.45);
                    }
                }

                // Hover states
                if (!confirmQuit) {
                    quitHover = inRect(mouseX, mouseY, QX, QY, QW, QH);
                    yesHover = false;
                    noHover = false;
                } else {
                    quitHover = false;
                    yesHover = inRect(mouseX, mouseY, YES_X, YES_Y, YES_W, YES_H);
                    noHover = inRect(mouseX, mouseY, NO_X, NO_Y, NO_W, NO_H);
                }
            },

            draw() {
                if (!this.open) return;

                // Scrim
                k.drawRect({ pos: k.vec2(0, 0), width: W, height: H, color: k.rgb(0, 0, 0), opacity: 0.78 });

                // Panel border
                k.drawRect({ pos: k.vec2(PX - 1, PY - 1), width: PW + 2, height: PH + 2, color: k.rgb(55, 40, 88), opacity: 0.85 });

                // Panel fill
                k.drawRect({ pos: k.vec2(PX, PY), width: PW, height: PH, color: k.rgb(10, 8, 22), opacity: 0.97 });

                // Top accent
                k.drawRect({ pos: k.vec2(PX, PY), width: PW, height: 3, color: k.rgb(88, 60, 138), opacity: 0.9 });

                // Title
                k.drawText({ text: "SETTINGS", pos: k.vec2(PX + PW / 2 - 56, PY + 28), size: 20, font: "monospace", color: k.rgb(190, 182, 220), opacity: 0.92 });

                // Divider
                k.drawRect({ pos: k.vec2(PX + 22, PY + 65), width: PW - 44, height: 1, color: k.rgb(42, 30, 65), opacity: 0.9 });

                // ── Sensitivity ────────────────────────────────────
                k.drawText({ text: "SENSITIVITY", pos: k.vec2(SLX, SLY - 34), size: 12, font: "monospace", color: k.rgb(125, 112, 158), opacity: 0.8 });

                // Track bg
                k.drawRect({ pos: k.vec2(SLX, SLY), width: SLW, height: 6, color: k.rgb(24, 18, 42), opacity: 1 });

                // Track fill
                const fillW = SLW * this.sensitivity;
                if (fillW > 0) {
                    k.drawRect({ pos: k.vec2(SLX, SLY), width: fillW, height: 6, color: k.rgb(98, 68, 155), opacity: 0.95 });
                }

                // Knob
                const kx = SLX + SLW * this.sensitivity;
                k.drawCircle({ pos: k.vec2(kx + 1, SLY + 4), radius: 9, color: k.rgb(0, 0, 0), opacity: 0.45 });
                k.drawCircle({ pos: k.vec2(kx, SLY + 3), radius: 9, color: k.rgb(140, 108, 200), opacity: 1 });
                k.drawCircle({ pos: k.vec2(kx - 1, SLY + 2), radius: 4, color: k.rgb(185, 162, 228), opacity: 0.7 });

                // Value
                k.drawText({ text: Math.round(this.sensitivity * 100).toString(), pos: k.vec2(SLX + SLW + 16, SLY - 4), size: 13, font: "monospace", color: k.rgb(145, 132, 172), opacity: 0.8 });

                // ── Quit button ────────────────────────────────────
                if (!confirmQuit) {
                    k.drawRect({ pos: k.vec2(QX - 1, QY - 1), width: QW + 2, height: QH + 2, color: k.rgb(70, 28, 28), opacity: quitHover ? 0.9 : 0.5 });
                    k.drawRect({ pos: k.vec2(QX, QY), width: QW, height: QH, color: quitHover ? k.rgb(58, 18, 18) : k.rgb(28, 12, 12), opacity: 1 });
                    k.drawText({ text: "QUIT GAME", pos: k.vec2(QX + QW / 2 - 48, QY + 13), size: 14, font: "monospace", color: quitHover ? k.rgb(225, 85, 85) : k.rgb(170, 58, 58), opacity: 1 });
                } else {
                    k.drawRect({ pos: k.vec2(QX - 1, QY - 1), width: QW + 2, height: QH + 2, color: k.rgb(80, 24, 24), opacity: 0.8 });
                    k.drawRect({ pos: k.vec2(QX, QY), width: QW, height: QH, color: k.rgb(22, 8, 8), opacity: 1 });
                    k.drawText({ text: "ARE YOU SURE?", pos: k.vec2(QX + QW / 2 - 66, QY + 13), size: 13, font: "monospace", color: k.rgb(195, 75, 75), opacity: 0.95 });

                    // YES
                    k.drawRect({ pos: k.vec2(YES_X - 1, YES_Y - 1), width: YES_W + 2, height: YES_H + 2, color: k.rgb(70, 25, 25), opacity: yesHover ? 0.9 : 0.5 });
                    k.drawRect({ pos: k.vec2(YES_X, YES_Y), width: YES_W, height: YES_H, color: yesHover ? k.rgb(65, 20, 20) : k.rgb(32, 10, 10), opacity: 1 });
                    k.drawText({ text: "YES", pos: k.vec2(YES_X + YES_W / 2 - 18, YES_Y + 13), size: 13, font: "monospace", color: yesHover ? k.rgb(225, 80, 80) : k.rgb(175, 60, 60), opacity: 1 });

                    // NO
                    k.drawRect({ pos: k.vec2(NO_X - 1, NO_Y - 1), width: NO_W + 2, height: NO_H + 2, color: k.rgb(40, 32, 58), opacity: noHover ? 0.9 : 0.5 });
                    k.drawRect({ pos: k.vec2(NO_X, NO_Y), width: NO_W, height: NO_H, color: noHover ? k.rgb(30, 24, 46) : k.rgb(16, 12, 28), opacity: 1 });
                    k.drawText({ text: "NO", pos: k.vec2(NO_X + NO_W / 2 - 14, NO_Y + 13), size: 13, font: "monospace", color: noHover ? k.rgb(185, 172, 218) : k.rgb(135, 122, 162), opacity: 1 });
                }

                // Close hint
                k.drawText({ text: "[ ESC ]  close", pos: k.vec2(PX + PW / 2 - 58, PY + PH - 30), size: 12, font: "monospace", color: k.rgb(68, 58, 88), opacity: 0.55 });
            },
        },
        "settingsOverlay",
    ]);

    // Remove DOM listeners when this scene ends
    overlay.onDestroy(() => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("mouseup", onUp);
    });

    // ESC key — close panel or cancel quit confirm
    k.onKeyPress("escape", () => {
        if (!overlay.open) return;
        if (confirmQuit) { confirmQuit = false; return; }
        overlay.open = false;
        save(overlay.sensitivity);
    });

    return {
        open() { overlay.open = true; confirmQuit = false; },
        close() { overlay.open = false; save(overlay.sensitivity); },
        isOpen() { return overlay.open; },
        getSensitivity() { return overlay.sensitivity; },
    };
}
