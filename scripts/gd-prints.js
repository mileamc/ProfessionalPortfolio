// gd-prints.js — the pile of printed pieces on the graphic design card.
//
// At rest the pile lies as new-home.css lays it out: four pieces overlapping,
// each with a lean of its own. Hovering the card sets them afloat. They drift
// apart a little, rise and fall as though the card were water, and they keep
// away from the pointer: come near one and it slides off, come nearer and it
// slides further. Nothing of this is layout — every piece is moved by a
// translation written on it as --float-x and --float-y, so the pile keeps the
// shape and the size it has at rest and the card is free to clip whatever
// leaves it.
//
// Two rules hold the drift in: a piece may pass the card's own edge, because
// the card clips and a piece half out of frame reads as a piece floating out
// of frame, but it may not pass 30px beyond it. It meets that line, stops
// against it, and comes back when the pointer goes.
//
// When the pointer leaves, every piece eases home and the loop stops. Nothing
// runs while the card is not being looked at.
(function () {
    "use strict";

    var EDGE   = 30;     // how far past the card's edge a piece may drift, px
    var REACH  = 210;    // how near the pointer has to be to move a piece, px
    var PUSH   = 34;     // and how far it moves the piece it is right on top of
    var SPREAD = 0.3;    // how much further from each other the pile floats
    var LIFT   = 7;      // how far apart they float up and down, px
    var SWELL  = 2.6;    // the water under them, px
    var EASE   = 0.12;   // how much of the way to its mark a piece goes a frame
    var REST   = 0.05;   // near enough to home to stop, px

    var clamp = function (value, low, high) {
        return value < low ? low : (value > high ? high : value);
    };

    var initCard = function (card) {
        var frame = card.querySelector(".nh-frame--prints");
        var pieces = frame ? [].slice.call(frame.querySelectorAll(".nh-shot--print")) : [];
        if (!pieces.length) {
            return;
        }

        // Where each piece lies when nothing is pushing it, in the card's own
        // terms, and how big the card is. Measured off the page rather than
        // assumed, and measured again whenever the card changes size.
        var box = { w: 0, h: 0 };
        var rest = [];

        var state = pieces.map(function (el, index) {
            return { x: 0, y: 0, phase: index * 1.9 };
        });

        var measure = function () {
            var card_rect = card.getBoundingClientRect();
            box.w = card_rect.width;
            box.h = card_rect.height;
            rest = pieces.map(function (el, index) {
                var r = el.getBoundingClientRect();
                return {
                    // the piece's centre with its own drift taken back out
                    cx: r.left + r.width / 2 - card_rect.left - state[index].x,
                    cy: r.top + r.height / 2 - card_rect.top - state[index].y,
                    w: r.width,
                    h: r.height
                };
            });
        };

        var afloat = false;               // the card is being hovered or focused
        var pointer = null;               // where the pointer is, in the card
        var running = false;
        var started = 0;

        var step = function (now) {
            if (!started) {
                started = now;
            }

            var centre_x = 0;
            var centre_y = 0;
            rest.forEach(function (r) { centre_x += r.cx; centre_y += r.cy; });
            centre_x /= rest.length;
            centre_y /= rest.length;

            var moving = false;

            pieces.forEach(function (el, index) {
                var r = rest[index];
                var s = state[index];
                var tx = 0;
                var ty = 0;

                if (afloat) {
                    // adrift: further out from the middle of the pile, and
                    // riding the swell
                    tx += (r.cx - centre_x) * SPREAD;
                    ty += (r.cy - centre_y) * SPREAD + (index % 2 ? LIFT : -LIFT);
                    ty += Math.sin((now - started) / 1150 + s.phase) * SWELL;
                    tx += Math.cos((now - started) / 1630 + s.phase) * (SWELL * 0.6);

                    // and keeping out of the pointer's way
                    if (pointer) {
                        var dx = r.cx + tx - pointer.x;
                        var dy = r.cy + ty - pointer.y;
                        var d = Math.sqrt(dx * dx + dy * dy);
                        if (d < REACH) {
                            var f = 1 - d / REACH;
                            var away = PUSH * f * f;
                            if (d < 0.001) {
                                ty -= away;
                            } else {
                                tx += (dx / d) * away;
                                ty += (dy / d) * away;
                            }
                        }
                    }
                }

                // the line it cannot pass: the card's own edge, and 30px more
                tx = clamp(tx, -EDGE + r.w / 2 - r.cx, box.w + EDGE - r.w / 2 - r.cx);
                ty = clamp(ty, -EDGE + r.h / 2 - r.cy, box.h + EDGE - r.h / 2 - r.cy);

                s.x += (tx - s.x) * EASE;
                s.y += (ty - s.y) * EASE;

                if (Math.abs(tx - s.x) > REST || Math.abs(ty - s.y) > REST) {
                    moving = true;
                }

                el.style.setProperty("--float-x", s.x.toFixed(2) + "px");
                el.style.setProperty("--float-y", s.y.toFixed(2) + "px");
            });

            if (afloat || moving) {
                window.requestAnimationFrame(step);
            } else {
                running = false;
                started = 0;
                pieces.forEach(function (el) {
                    el.style.removeProperty("--float-x");
                    el.style.removeProperty("--float-y");
                });
            }
        };

        var run = function () {
            if (!running) {
                running = true;
                window.requestAnimationFrame(step);
            }
        };

        var enter = function () {
            if (!afloat) {
                measure();
                afloat = true;
                run();
            }
        };

        var leave = function () {
            afloat = false;
            pointer = null;
            run();
        };

        card.addEventListener("pointerenter", function (event) {
            if (event.pointerType === "touch") {
                return;         // a tap would leave the pile adrift for good
            }
            enter();
        });

        card.addEventListener("pointermove", function (event) {
            if (!afloat) {
                return;
            }
            var r = card.getBoundingClientRect();
            pointer = { x: event.clientX - r.left, y: event.clientY - r.top };
        });

        card.addEventListener("pointerleave", leave);

        // the keyboard gets the drift without the pointer's part of it
        card.addEventListener("focusin", enter);
        card.addEventListener("focusout", function () {
            if (!card.matches(":hover")) {
                leave();
            }
        });

        if (window.ResizeObserver) {
            new window.ResizeObserver(function () {
                if (afloat) {
                    measure();
                }
            }).observe(card);
        }
    };

    var start = function () {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;             // the pile stays where it lies
        }
        [].slice.call(document.querySelectorAll(".nh-card--text")).forEach(initCard);
    };

    // the cards are written into the grid by scripts/new-home.js, so wait for
    // the page rather than for the parser
    if (document.readyState === "complete" || document.readyState === "interactive") {
        window.setTimeout(start, 0);
    } else {
        document.addEventListener("DOMContentLoaded", start);
    }
}());
