// about.js — the file stack on the About page.
//
// The animation (assets/about/file-stack.json, exported from After Effects)
// is loaded stopped on its first frame. Pointing at the card plays it once,
// from the beginning to the end; taking the pointer away does not interrupt
// it — it finishes the pass it is on and then returns to the first frame, so
// it is ready for the next hover and the card is still whenever nobody is
// pointing at it. A hover that arrives while it is still playing is ignored
// rather than restarting it.
//
// Where the visitor asks for less movement, the stack simply stays on its
// first frame.
(function () {
    "use strict";

    if (typeof window.lottie === "undefined") {
        return;   // the CDN did not answer; the card keeps its empty square
    }

    var reduceMotion = window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : { matches: false };

    var initStack = function (root) {
        var path = root.getAttribute("data-ab-lottie");
        if (!path) {
            return;
        }

        var animation = window.lottie.loadAnimation({
            container: root,
            renderer: "svg",
            loop: false,
            autoplay: false,
            path: path
        });

        var playing = false;

        animation.addEventListener("complete", function () {
            playing = false;
            animation.goToAndStop(0, true);
        });

        // the whole card is the target, not just the square the files are in
        var card = root.closest(".nh-card") || root;

        card.addEventListener("pointerenter", function () {
            if (playing || reduceMotion.matches) {
                return;
            }
            playing = true;
            animation.goToAndPlay(0, true);
        });
    };

    document.querySelectorAll("[data-ab-lottie]").forEach(initStack);
})();
