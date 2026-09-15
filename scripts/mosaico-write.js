// mosaico-write.js — the word "mosaico" written by hand inside the MOSAICO
// card on the home page.
//
// The strokes live in the <template data-nh-card="mosaico"> in index.html:
// one open path per pen-down..pen-up movement, in the order a hand writes the
// word — m, o, s, a, i, its dot, c, o. None of them is an outline of the
// lettering; they are the movements themselves, so what the visitor watches
// is a pen travelling, not a shape being filled or revealed.
//
// Drawing them is one number. `progress` runs 0 → 1 over the whole word: the
// strokes are laid end to end and, at any progress, everything before the pen
// is inked and everything after it is not, by stroke-dashoffset. The pointer
// only ever changes where that number is heading — 1 on the way in, 0 on the
// way out — and it moves there from wherever it is. So leaving halfway
// unwrites from halfway, returning mid-erase carries straight on from there,
// and nothing ever restarts or jumps.
//
// The pen eases in and out of rest but never stops mid-word: its speed is a
// gentle curve with a floor, which reads as a hand writing rather than as a
// progress bar.
(function () {
    "use strict";

    // Pen-down to the end of the last o. The eased pace below averages out
    // at about four fifths of this, so the word takes a little over three
    // seconds end to end.
    var WRITE_MS = 2500;
    var EASE_FLOOR = 0.4;  // slowest the pen goes, as a share of its own pace

    var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var canHover = window.matchMedia ? window.matchMedia("(hover: hover)") : null;

    var initCard = function (root) {
        var paths = Array.prototype.slice.call(root.querySelectorAll("[data-mw-stroke]"));
        if (!paths.length) {
            return;
        }

        var card = root.closest(".nh-card") || root;
        var strokes = [];
        var total = 0;

        paths.forEach(function (path) {
            var length = path.getTotalLength();
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            strokes.push({ path: path, start: total, length: length });
            total += length;
        });

        var progress = 0;    // 0 = blank paper, 1 = the whole word
        var target = 0;
        var frame = 0;
        var last = 0;

        // Ink everything up to `progress` and nothing after it. A stroke the
        // pen has not reached is held at its full offset; the one it is on is
        // part drawn; the ones behind it are whole.
        var paint = function () {
            var pen = progress * total;
            strokes.forEach(function (stroke) {
                var drawn = Math.min(Math.max(pen - stroke.start, 0), stroke.length);
                stroke.path.style.strokeDashoffset = stroke.length - drawn;
            });
        };

        var settle = function (value) {
            progress = target = value;
            paint();
        };

        var step = function (now) {
            var seconds = Math.min((now - last) / 1000, 0.05);   // a slow frame is not a jump
            last = now;

            // eased by position, not by elapsed time, so the pen keeps the
            // same pace whichever way it is going and wherever it resumes
            var pace = EASE_FLOOR + (1 - EASE_FLOOR) * Math.sin(Math.PI * progress);
            var move = seconds * (1000 / WRITE_MS) * pace;

            if (target > progress) {
                progress = Math.min(progress + move, target);
            } else {
                progress = Math.max(progress - move, target);
            }
            paint();

            frame = progress === target ? 0 : window.requestAnimationFrame(step);
        };

        var head = function (value) {
            target = value;
            if (reduceMotion && reduceMotion.matches) {
                settle(value);   // the written state, without the writing
                return;
            }
            if (!frame) {
                last = window.performance.now();
                frame = window.requestAnimationFrame(step);
            }
        };

        var write = function () { head(1); };
        var unwrite = function () { head(0); };

        card.addEventListener("pointerenter", write);
        card.addEventListener("pointerleave", unwrite);

        // the keyboard reaches the card through its link
        var link = card.querySelector(".nh-card__link");
        if (link) {
            link.addEventListener("focus", write);
            link.addEventListener("blur", unwrite);
        }

        // Where there is no pointer to hover with, the word writes itself
        // once, when the card comes into view — otherwise a phone would only
        // ever see the guide.
        if (canHover && !canHover.matches && typeof IntersectionObserver === "function") {
            var watcher = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        write();
                        watcher.disconnect();
                    }
                });
            }, { threshold: 0.55 });
            watcher.observe(card);
        }

        paint();
    };

    document.querySelectorAll("[data-mosaico-write]").forEach(initCard);
})();
