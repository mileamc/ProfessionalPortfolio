// warm-assets.js — the one set of files nothing else asks for.
//
// Everything else on this page is already fetched while it loads: the cards
// are all in the markup from the start, and `loading="lazy"` only defers what
// is far below the fold, which on a screen this size is almost nothing. What
// the page needed was not more fetching but an order — which is what the three
// preloads in the head and the low priorities on the heavy images do.
//
// This is the exception: the photograph each machine in the comparison shows
// once it is picked. Nothing asks for it until a click, so a click is when it
// would start loading. Fetched here, once the page has finished and the
// browser is idle, it is in the cache before the first machine is chosen.
//
// The reviews' photographs in the NOMMU phone are deliberately not here, or
// anywhere else that hurries them: at 28MB between them they are the one thing
// on this page that wants resizing rather than scheduling.
(function () {
    "use strict";

    var LATER = [
        "assets/imb/compare-2000hd.png",
        "assets/imb/compare-3500hd.png",
        "assets/imb/compare-5500hd-titan.png",
        "assets/imb/compare-5500hd-cronus.png"
    ];      // 1MB, wanted on a click, fetched before the click

    // On a phone the comparison is not built at all, so there is no click
    // coming and nothing to have ready for it.
    if (window.matchMedia("(max-width: 719.98px)").matches) {
        return;
    }

    // Someone on a metered or a slow connection has asked, in the only way a
    // browser lets them, not to be sent anything they did not ask for.
    var link = navigator.connection;
    if (link && (link.saveData || /(^|-)2g$/.test(link.effectiveType || ""))) {
        return;
    }

    var warm = function () {
        var head = document.head;
        LATER.forEach(function (href) {
            var hint = document.createElement("link");
            hint.rel = "prefetch";
            hint.as = "image";
            hint.href = href;
            head.appendChild(hint);
        });
    };

    var whenIdle = function (run) {
        if (window.requestIdleCallback) {
            window.requestIdleCallback(run, { timeout: 2000 });
        } else {
            window.setTimeout(run, 200);
        }
    };

    if (document.readyState === "complete") {
        whenIdle(warm);
    } else {
        window.addEventListener("load", function () { whenIdle(warm); }, { once: true });
    }
})();
