// case-ludis.js — the two things on the LUDIS case that answer a pointer.
//
//   1. the before/after device: drag the handle across the screen
//   2. the band of shipped screens: it runs on, and can be stopped
//
// Both degrade to something sensible without JS: the device shows the shipped
// screen over the old one at its resting position, and the band stands still
// with its five screens in a row.
(function () {
    "use strict";

    /* ---------------------------------------------------------------------
       The before/after device

       The handle sets --cl-ba, which is two things at once: where the shipped
       screen is clipped, and where the handle itself stands. The screen is a
       hole in the device export — 8.669% in from its left and 85.685% of its
       width — so the pointer is mapped through that inset, or the handle
       drifts away from the finger holding it.
    --------------------------------------------------------------------- */

    var HOLE_X = 0.08669;   // the screen's left edge, as a share of the export
    var HOLE_W = 0.85685;   // and its width

    document.querySelectorAll("[data-ba]").forEach(function (device) {
        var handle = device.querySelector(".cl-ba__handle");
        if (!handle) {
            return;
        }

        var value = 73;     // where it rests: enough of each side to read both
        var dragging = false;

        var set = function (next) {
            value = Math.min(100, Math.max(0, next));
            device.style.setProperty("--cl-ba", value + "%");
            handle.setAttribute("aria-valuenow", Math.round(value));
            handle.setAttribute("aria-valuetext", Math.round(value) + "% of the screen before the redesign");
        };

        var fromPointer = function (clientX) {
            var box = device.getBoundingClientRect();
            if (!box.width) {
                return;
            }
            set((((clientX - box.left) / box.width - HOLE_X) / HOLE_W) * 100);
        };

        device.addEventListener("pointerdown", function (event) {
            dragging = true;
            if (handle.setPointerCapture) {
                handle.setPointerCapture(event.pointerId);
            }
            fromPointer(event.clientX);
            event.preventDefault();
        });

        window.addEventListener("pointermove", function (event) {
            if (dragging) {
                fromPointer(event.clientX);
            }
        });

        window.addEventListener("pointerup", function () {
            dragging = false;
        });

        // and by keyboard, since it is a slider and says so
        handle.addEventListener("keydown", function (event) {
            var step = event.shiftKey ? 10 : 2;
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                set(value - step);
            } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                set(value + step);
            } else if (event.key === "Home") {
                set(0);
            } else if (event.key === "End") {
                set(100);
            } else {
                return;
            }
            event.preventDefault();
        });

        set(value);
    });


    /* ---------------------------------------------------------------------
       The band of shipped screens

       One set of five is in the markup. Copying it once gives the track two
       identical halves, so travelling exactly half its width and starting
       over reads as a band that never ends. The copy is hidden from a screen
       reader and its pictures lose their descriptions: it is the same five
       screens, and saying them twice helps nobody.

       Whether it moves at all is CSS's business — the animation is inside a
       prefers-reduced-motion query. This only adds the class that starts it
       and the button that stops it.
    --------------------------------------------------------------------- */

    document.querySelectorAll("[data-reel]").forEach(function (reel) {
        var track = reel.querySelector(".cl-reel__track");
        var set = reel.querySelector(".cl-reel__set");
        var toggle = reel.querySelector("[data-reel-toggle]");
        if (!track || !set) {
            return;
        }

        var copy = set.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll("img").forEach(function (image) {
            image.alt = "";
        });
        track.appendChild(copy);
        reel.classList.add("is-ready");

        if (!toggle) {
            return;
        }

        var PLAY = "M4.5 3.2 12.5 8l-8 4.8z";
        var PAUSE = "M5 3h2.2v10H5zM8.8 3H11v10H8.8z";

        toggle.addEventListener("click", function () {
            var paused = reel.classList.toggle("is-paused");
            var mark = toggle.querySelector("path");
            toggle.setAttribute("aria-pressed", paused ? "true" : "false");
            toggle.setAttribute("aria-label", paused ? "Start the screens" : "Pause the screens");
            if (mark) {
                mark.setAttribute("d", paused ? PLAY : PAUSE);
            }
        });
    });
})();
