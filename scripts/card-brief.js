// card-brief.js — what a card says about itself when you reach for its arrow.
//
// Rest the pointer on a card's arrow and the page goes behind glass: a veil is
// drawn over everything, blurred and whitened, and that one card is lifted
// above it so it stays sharp. Under the card, on the glass, its name and a
// line about it. Take the pointer off and all of it fades back.
//
// The veil is one element for the whole page rather than a blur on each card,
// because blurring an ancestor blurs the card inside it too. The card is
// lifted over the veil instead of being left out of it.
//
// A card says its own name and line through data-brief-name and
// data-brief-text, written by scripts/new-home.js out of data/home-projects.js.
// A card without them keeps its arrow and does nothing.
(function () {
    "use strict";

    var GAP = 12;          // between the card's foot and the line under it
    var WIDE = 560;        // the line's own measure, where the window allows

    var root = document.querySelector(".nh");
    var veil = document.querySelector("[data-nh-veil]");
    var brief = document.querySelector("[data-nh-brief]");
    var briefName = brief && brief.querySelector("[data-nh-brief-name]");
    var briefText = brief && brief.querySelector("[data-nh-brief-text]");

    if (!root || !veil || !brief || !briefName || !briefText) {
        return;
    }

    var card = null;       // the card being spoken for, while there is one
    var ticking = false;

    // The line sits under the card, from the same edge the arrow stands at. It
    // goes above the card instead when there is no room under it.
    var place = function () {
        if (!card) {
            return;
        }

        var box = card.getBoundingClientRect();
        var style = window.getComputedStyle(card);
        var inset = parseFloat(style.getPropertyValue("--nh-chrome-inset")) || 14;
        var gutter = parseFloat(style.getPropertyValue("--nh-gutter")) || 24;

        var left = box.left + inset;
        var width = Math.min(WIDE, window.innerWidth - left - gutter);
        brief.style.left = Math.round(left) + "px";
        brief.style.width = Math.round(Math.max(200, width)) + "px";

        // measured with the line where it will be, so its own height is known.
        // It goes under the card unless it would run off the foot of the
        // window, and only then above it.
        brief.style.top = Math.round(box.bottom + GAP) + "px";
        var height = brief.getBoundingClientRect().height;
        if (box.bottom + GAP + height > window.innerHeight - gutter / 2) {
            brief.style.top = Math.round(box.top - GAP - height) + "px";
        }
    };

    var follow = function () {
        if (ticking || !card) {
            return;
        }
        ticking = true;
        window.requestAnimationFrame(function () {
            ticking = false;
            place();
        });
    };

    var speak = function (next) {
        if (next === card) {
            return;
        }
        if (card) {
            card.classList.remove("is-lifted");
        }
        card = next;
        card.classList.add("is-lifted");

        briefName.textContent = card.getAttribute("data-brief-name");
        briefText.textContent = card.getAttribute("data-brief-text");

        place();
        root.classList.add("is-briefing");
        window.addEventListener("scroll", follow, { passive: true });
        window.addEventListener("resize", follow);
    };

    var hush = function () {
        if (!card) {
            return;
        }
        card.classList.remove("is-lifted");
        card = null;
        root.classList.remove("is-briefing");
        window.removeEventListener("scroll", follow);
        window.removeEventListener("resize", follow);
    };

    // The arrow is the whole of the trigger: a card is a card until the pointer
    // is on the one corner that opens it.
    document.addEventListener("pointerover", function (event) {
        if (event.pointerType === "touch") {
            return;
        }
        var arrow = event.target.closest && event.target.closest(".nh-card__arrow");
        var owner = arrow && arrow.closest(".nh-card[data-brief-name]");
        if (owner) {
            speak(owner);
        } else if (card && !(event.target.closest && event.target.closest(".nh-brief"))) {
            hush();
        }
    });

    // the keyboard reaches the same corner through the card's link
    document.addEventListener("focusin", function (event) {
        var link = event.target.closest && event.target.closest(".nh-card__link");
        var owner = link && link.closest(".nh-card[data-brief-name]");
        if (owner && link.matches(":focus-visible")) {
            speak(owner);
        }
    });

    document.addEventListener("focusout", function () {
        if (card && !card.contains(document.activeElement)) {
            hush();
        }
    });

    // nothing should stay behind glass because the pointer left the window
    window.addEventListener("blur", hush);
    document.documentElement.addEventListener("pointerleave", hush);
}());
