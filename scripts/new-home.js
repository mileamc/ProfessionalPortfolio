// new-home.js — renders the bento cards from data/home-projects.js and runs
// the small behaviours the page has:
//
//   1. images that are not there yet become quiet empty shapes
//   2. the navigation marks the section being read
//   3. a plain click on a linked card expands it into the page it opens
//   4. the photo stack in the introduction card can be dragged to cycle
//
// No dependencies. Without JS the intro and contact still render.
(function () {
    "use strict";

    var data = window.homeProjects;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var pending = [];

    var escapeHtml = function (value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // "9:19.5" → "9 / 19.5". Anything unparseable falls back to the CSS default.
    var cssRatio = function (ratio) {
        var match = /^\s*([\d.]+)\s*[:/]\s*([\d.]+)\s*$/.exec(String(ratio || ""));
        return match ? match[1] + " / " + match[2] : "";
    };

    var isDarkTone = function (hex) {
        var match = /^#?([\da-f]{6})$/i.exec(String(hex || ""));
        if (!match) {
            return false;
        }
        var n = parseInt(match[1], 16);
        return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) < 110;
    };


    /* ---------------------------------------------------------------------
       Media
    --------------------------------------------------------------------- */

    // An image slot. If the file is missing the <img> is dropped and the slot
    // stays as an empty shape — no text. The expected paths are listed once
    // in the console so they are easy to find.
    var mediaHtml = function (item, className, eager) {
        var ratio = cssRatio(item && item.ratio);
        var style = ratio ? ' style="--ratio: ' + ratio + '"' : "";
        // The first two cards are on the first screen and are fetched at the
        // usual priority; everything under them waits for that screen to be
        // drawn before it competes for the connection.
        var img = item && item.src
            ? '<img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || "") + '"' +
              ' loading="' + (eager ? "eager" : "lazy") + '"' +
              ' fetchpriority="' + (eager ? "high" : "low") + '" decoding="async">'
            : "";

        return '<span class="' + className + (img ? "" : " is-pending") + '"' + style + ">" + img + "</span>";
    };

    var watchImages = function (root) {
        root.querySelectorAll("img").forEach(function (img) {
            var fail = function () {
                var slot = img.parentElement;
                pending.push(img.getAttribute("src"));
                img.remove();
                if (slot) {
                    slot.classList.add("is-pending");
                }
            };

            if (img.complete && img.naturalWidth === 0) {
                fail();
            } else {
                img.addEventListener("error", fail, { once: true });
            }
        });
    };


    /* ---------------------------------------------------------------------
       Stage content — what is shown inside a card
    --------------------------------------------------------------------- */

    var frameHtml = function (project, eager) {
        var media = project.media || [];

        switch (project.frame) {
            case "phones":
                return '<div class="nh-frame nh-frame--phones" data-count="' + Math.min(media.length, 3) + '">' +
                    media.slice(0, 3).map(function (item) { return mediaHtml(item, "nh-shot nh-shot--phone", eager); }).join("") +
                    "</div>";

            case "browser":
                return '<div class="nh-frame nh-frame--browser">' + mediaHtml(media[0], "nh-shot nh-shot--screen", eager) + "</div>";

            case "stack":
                return '<div class="nh-frame nh-frame--stack">' +
                    media.slice(0, 3).map(function (item) { return mediaHtml(item, "nh-shot nh-shot--screen", eager); }).join("") +
                    "</div>";

            case "prints":
                return '<div class="nh-frame nh-frame--prints">' +
                    media.slice(0, 4).map(function (item) { return mediaHtml(item, "nh-shot nh-shot--print", eager); }).join("") +
                    "</div>";

            case "canvas":
            default:
                return '<div class="nh-frame nh-frame--canvas">' + mediaHtml(media[0], "nh-shot nh-shot--canvas", eager) + "</div>";
        }
    };

    // A <template data-nh-card="id"> in the page wins over the screenshots.
    var stageContent = function (project, eager) {
        var template = document.querySelector('template[data-nh-card="' + project.id + '"]');
        return template ? null : frameHtml(project, eager);
    };


    /* ---------------------------------------------------------------------
       Card
    --------------------------------------------------------------------- */

    var ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6"/></svg>';

    // Anatomy:
    //
    //   <article class="nh-card">
    //     <div class="nh-card__stage">   screenshots or your own component
    //     <a class="nh-card__link">      covers the whole card — the click target
    //       <span class="nh-card__arrow">   the visible affordance
    //
    // The link is a sibling of the stage, not a wrapper, so the stage can
    // later hold its own buttons and inputs without nesting them in a link.
    var linkHtml = function (href, label, inner) {
        return href
            ? '<a class="nh-card__link" href="' + escapeHtml(href) + '" aria-label="' + escapeHtml(label) + '" data-nh-case>' + inner + "</a>"
            : '<a class="nh-card__link" role="link" aria-label="' + escapeHtml(label) + '" aria-disabled="true">' + inner + "</a>";
    };

    // What the card says about itself while the pointer is on its arrow. It
    // rides on the card so scripts/card-brief.js has only the card to read.
    var briefAttrs = function (brief) {
        return brief && brief.name && brief.text
            ? ' data-brief-name="' + escapeHtml(brief.name) + '"' +
              ' data-brief-text="' + escapeHtml(brief.text) + '"'
            : "";
    };

    var cardAttrs = function (options) {
        var tone = options.tone || "";
        var classes = "nh-card" + (options.extraClass ? " " + options.extraClass : "") +
            (isDarkTone(tone) ? " is-dark" : "") + (options.href ? "" : " is-unlinked");
        var ratio = cssRatio(options.ratio);
        var style = "--i: " + options.index + (tone ? "; --tone: " + escapeHtml(tone) : "") +
            (ratio ? "; --card-ratio: " + ratio : "");

        return ' class="' + classes + '" style="' + style + '"' +
            ' data-size="' + escapeHtml(options.size) + '" data-project="' + escapeHtml(options.id) + '"' +
            briefAttrs(options.brief) +
            (options.domId ? ' id="' + escapeHtml(options.domId) + '"' : "");
    };

    // Product design: visuals only. The project name exists only as the
    // link's accessible label.
    //
    // Optional flags from the data:
    //   linkArea: "arrow"  only the arrow opens the project; the rest of the
    //                      card is free for an interactive prototype
    //   ratio: "16:9"      the card keeps that proportion (height from width)
    //                      and pads its content
    //   fit: "content"     the card is as tall as what is inside it, and pads
    //                      its content
    var productCardHtml = function (project, index) {
        var extra = [
            project.linkArea === "arrow" ? "is-arrow-link" : "",
            project.ratio ? "nh-card--ratio" : "",
            project.fit === "content" ? "nh-card--content" : ""
        ].filter(Boolean).join(" ");

        return "<article" + cardAttrs({
                id: project.id, index: index + 1, tone: project.tone, href: project.href,
                size: project.size || "medium", domId: index === 0 ? "work" : "",
                extraClass: extra,
                ratio: project.ratio,
                brief: project.brief
            }) + ">" +
            '<div class="nh-card__stage">' + (stageContent(project, index < 2) || "") + "</div>" +
            linkHtml(project.href, "Open " + (project.title || "project"),
                '<span class="nh-card__arrow">' + ARROW + "</span>") +
            "</article>";
    };

    // Graphic design: a pile of printed pieces, and nothing written on the
    // card. Its title is the link's accessible name, as on the product cards;
    // the surface, the whole-card link and the arrow in the corner are theirs
    // too. What the pile does under a pointer is scripts/gd-prints.js.
    var graphicDesignCardHtml = function (gd, index) {
        var title = gd.title || "Graphic Design";

        return "<article" + cardAttrs({
                id: gd.id || "graphic-design", domId: "graphic-design", index: index + 1,
                tone: gd.tone, href: gd.href, size: "medium", extraClass: "nh-card--text",
                brief: gd.brief
            }) + ">" +
            '<div class="nh-card__stage">' +
            frameHtml({ frame: "prints", media: gd.media }, false) +
            "</div>" +
            linkHtml(gd.href, "Open " + title,
                '<span class="nh-card__arrow">' + ARROW + "</span>") +
            "</article>";
    };

    var mountTemplate = function (card, id) {
        var template = document.querySelector('template[data-nh-card="' + id + '"]');
        var stage = card && card.querySelector(".nh-card__stage");
        if (template && stage) {
            stage.appendChild(template.content.cloneNode(true));
        }
    };

    // Cards go into the same grid as the introduction, after it.
    //
    // Except on a phone, where the grid keeps the introduction alone. Every
    // card here is a prototype built for a pointer, and one of them runs three
    // landing pages in a laptop; none of it is wanted at that width, and none
    // of it — not the markup, not the photographs, not the pages — is fetched,
    // because nothing is built to ask for it. What goes under the introduction
    // instead is the list of projects, from scripts/mobile-work.js.
    var renderGrid = function () {
        var grid = document.querySelector("[data-nh-grid]");
        if (!grid || !data) {
            return;
        }

        if (window.matchMedia("(max-width: 719.98px)").matches) {
            return;
        }

        var projects = Array.isArray(data.projects) ? data.projects : [];
        var html = projects.map(productCardHtml).join("");

        if (data.graphicDesign) {
            html += graphicDesignCardHtml(data.graphicDesign, projects.length);
        }

        grid.insertAdjacentHTML("beforeend", html);

        projects.forEach(function (project) {
            mountTemplate(grid.querySelector('[data-project="' + project.id + '"]'), project.id);
        });

        watchImages(grid);
        grid.classList.add("is-rendered");
    };

    /* ---------------------------------------------------------------------
       Photo stack in the introduction card

       Plain-JS port of the drag-to-cycle image stack. A click or tap on the
       top photo sends it to the back straight away. Dragged, it follows the
       pointer: released past MIN_DRAG it goes to the back, released sooner
       it springs back. Resting positions fan each photo up and to the right
       with an increasing tilt; the top one is straight.
    --------------------------------------------------------------------- */

    var initPhotoStack = function () {
        var root = document.querySelector("[data-nh-stack]");
        var photos = data && Array.isArray(data.introPhotos) ? data.introPhotos : [];
        if (!root || !photos.length) {
            return;
        }

        var MIN_DRAG = 50;        // px before a release counts as a swipe
        var TAP_SLOP = 6;         // px of movement still counted as a click / tap
        var SETTLE_MS = 300;      // pause before the next card can be dragged
        var OFFSET_X = 0.55;      // % of the card's width, per step back (fans right)
        var OFFSET_Y = -2;        // % of the card's height, per step back (fans up)
        var BASE_TILT = 0.8;      // deg — small, the photos are wide
        var TILT_STEP = 0.4;      // deg per step back
        // The steps are tight: just the edge of the next photo shows.

        var cards = photos.map(function (photo, index) {
            var card = document.createElement("div");
            card.className = "nh-stack__card";

            if (photo && photo.src) {
                var img = document.createElement("img");
                img.src = photo.src;
                img.alt = photo.alt || "Photo of Milena Caldas";
                img.draggable = false;
                img.decoding = "async";
                // All six are in the page from the start, since any of them
                // can be a drag away. Only the top one is looked at, though,
                // so it goes to the front of the queue and the rest to the
                // back, where they do not hold up the first screen.
                img.setAttribute("fetchpriority", index === 0 ? "high" : "low");
                img.addEventListener("error", function () {
                    img.replaceWith(Object.assign(document.createElement("span"), { className: "nh-stack__ph" }));
                }, { once: true });
                card.appendChild(img);
            } else {
                var ph = document.createElement("span");
                ph.className = "nh-stack__ph";
                card.appendChild(ph);
            }

            card.setAttribute("aria-hidden", index === 0 ? "false" : "true");
            root.appendChild(card);
            return card;
        });

        root.tabIndex = 0;
        root.setAttribute("role", "group");
        root.setAttribute("aria-label", "Photos of Milena. Click or drag the top photo, or press Enter, to see the next one.");

        var order = cards.slice();   // order[0] is the top card
        var animating = false;

        var layout = function () {
            order.forEach(function (card, index) {
                card.style.setProperty("--x", (index * OFFSET_X) + "%");
                card.style.setProperty("--y", (index * OFFSET_Y) + "%");
                // lean alternates: right, left, right, …
                var lean = index % 2 ? 1 : -1;
                card.style.setProperty("--r", index === 0 ? "0deg" : (lean * (BASE_TILT + index * TILT_STEP)) + "deg");
                card.style.zIndex = String(order.length - index);   // stays positive for any count
                card.classList.toggle("is-top", index === 0);
                card.setAttribute("aria-hidden", index === 0 ? "false" : "true");
            });
        };

        var settle = function () {
            animating = true;
            window.setTimeout(function () { animating = false; }, SETTLE_MS);
        };

        var next = function () {
            order.push(order.shift());
            layout();
            settle();
        };

        var previous = function () {
            order.unshift(order.pop());
            layout();
            settle();
        };

        // --- drag -------------------------------------------------------

        var drag = null;

        // Past this distance the card follows at a fifth of the pointer's
        // speed, so it can't be thrown far outside the introduction card.
        var elastic = function (value, limit) {
            var size = Math.abs(value);
            return size <= limit ? value : Math.sign(value) * (limit + (size - limit) * 0.2);
        };

        var endDrag = function (event, cancelled) {
            if (!drag || (event && event.pointerId !== drag.id)) {
                return;
            }

            var card = drag.card;
            var distance = Math.hypot(drag.dx, drag.dy);
            drag = null;

            card.classList.remove("is-dragging");
            card.style.removeProperty("--dx");
            card.style.removeProperty("--dy");

            // a click / tap (barely moved) or a swipe past the threshold both
            // send the photo to the back
            if (!cancelled && (distance <= TAP_SLOP || distance >= MIN_DRAG)) {
                next();
                return;
            }

            // spring back to its place on top
            card.classList.add("is-returning");
            window.setTimeout(function () { card.classList.remove("is-returning"); }, 480);
        };

        root.addEventListener("pointerdown", function (event) {
            var card = event.target.closest(".nh-stack__card");
            if (!card || card !== order[0] || animating || drag ||
                (event.pointerType === "mouse" && event.button !== 0)) {
                return;
            }

            drag = { id: event.pointerId, card: card, x: event.clientX, y: event.clientY, dx: 0, dy: 0,
                     limit: Math.min(card.offsetWidth * 0.4, 160) };
            card.classList.remove("is-returning");
            card.classList.add("is-dragging");

            try { card.setPointerCapture(event.pointerId); } catch (error) { /* older browsers */ }
        });

        root.addEventListener("pointermove", function (event) {
            if (!drag || event.pointerId !== drag.id) {
                return;
            }

            drag.dx = event.clientX - drag.x;
            drag.dy = event.clientY - drag.y;
            drag.card.style.setProperty("--dx", elastic(drag.dx, drag.limit) + "px");
            drag.card.style.setProperty("--dy", elastic(drag.dy, drag.limit) + "px");
        });

        root.addEventListener("pointerup", function (event) { endDrag(event, false); });
        root.addEventListener("pointercancel", function (event) { endDrag(event, true); });
        root.addEventListener("lostpointercapture", function (event) { endDrag(event, false); });

        // --- keyboard ---------------------------------------------------

        root.addEventListener("keydown", function (event) {
            if (animating) {
                return;
            }
            if (event.key === "Enter" || event.key === " " || event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                next();
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                previous();
            }
        });

        layout();
    };

    /* ---------------------------------------------------------------------
       Navigation: current section
    --------------------------------------------------------------------- */

    var initNavigation = function () {
        var links = Array.prototype.slice.call(document.querySelectorAll("[data-nh-nav]"));
        var ticking = false;

        var byId = function (id) {
            return document.getElementById(id);
        };

        var setCurrent = function (id) {
            links.forEach(function (link) {
                if (id && link.getAttribute("data-nh-nav") === id) {
                    link.setAttribute("aria-current", "location");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        };

        var update = function () {
            ticking = false;

            // Home at the very top. After that the introduction card (About)
            // and the first projects share the top of the grid, so reading
            // order decides: About while the introduction is still on screen,
            // Work once it has scrolled away, Contact once its top passes a
            // third of the way down the window.
            var line = window.innerHeight * 0.33;
            var intro = byId("about");
            var contact = byId("contact");
            var current = "home";

            if (window.scrollY >= 40) {
                current = intro && intro.getBoundingClientRect().bottom > line ? "about" : "work";

                if (contact && (contact.getBoundingClientRect().top <= line ||
                    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)) {
                    current = "contact";
                }
            }

            setCurrent(current);
        };

        var request = function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        };

        window.addEventListener("scroll", request, { passive: true });
        window.addEventListener("resize", request);
        update();
    };


    /* ---------------------------------------------------------------------
       Expand into the linked page
    --------------------------------------------------------------------- */

    var initExpand = function () {
        document.addEventListener("click", function (event) {
            var link = event.target.closest("a.nh-card__link[data-nh-case]");
            if (!link) {
                return;
            }

            // Leave every non-plain click to the browser: new tab, new window,
            // download, or a reader who asked for less motion.
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
                event.shiftKey || event.altKey || reduceMotion.matches ||
                typeof Element.prototype.animate !== "function") {
                return;
            }

            var card = link.closest(".nh-card");
            var rect = card.getBoundingClientRect();
            var vw = document.documentElement.clientWidth;
            var vh = window.innerHeight;

            if (rect.bottom <= 0 || rect.top >= vh) {
                return;
            }

            event.preventDefault();

            var href = link.href;
            var layer = document.createElement("div");
            layer.className = "nh-expand";
            layer.setAttribute("aria-hidden", "true");
            document.body.appendChild(layer);

            var go = function () {
                window.location.href = href;
            };

            var animation = layer.animate(
                [
                    { clipPath: "inset(" + rect.top + "px " + (vw - rect.right) + "px " + (vh - rect.bottom) + "px " + rect.left + "px round 16px)", opacity: 0.6 },
                    { clipPath: "inset(0px 0px 0px 0px round 0px)", opacity: 1 }
                ],
                { duration: 460, easing: "cubic-bezier(0.2, 0.7, 0.1, 1)", fill: "forwards" }
            );

            var fallback = window.setTimeout(go, 700);
            animation.onfinish = function () {
                window.clearTimeout(fallback);
                go();
            };
        });

        // Back from the linked page restores this one from the cache with the
        // layer still over it.
        window.addEventListener("pageshow", function () {
            document.querySelectorAll(".nh-expand").forEach(function (layer) {
                layer.remove();
            });
        });
    };


    // Message bubble. One element with two sizes: the three dots it rests at,
    // and the message it grows into. Its entrance is pure CSS, so the pop
    // plays the moment the page renders, with no wait for this script. It
    // stays open for six seconds, and contracts early if the visitor clicks
    // it or has scrolled 30% of the page. Clicking the dots grows it back,
    // one line further down LINES; the list starts over when it runs out, so
    // the bubble never has nothing to say.
    //
    // A box cannot animate to or from `auto`, so the open width and height
    // are measured here and written on the element, and the text is pinned
    // to the width it was measured at — on the way down the bubble clips it
    // rather than reflowing it into a column. The measurement is taken again
    // when the web font lands or the window changes, both of which move the
    // line breaks.
    var initBubble = function () {
        var bubble = document.querySelector("[data-nh-bubble]");
        if (!bubble) return;

        // Not on a phone. The bubble asks the visitor to interact with
        // everything, and at this width there is nothing to interact with:
        // the prototypes it means are not built. new-home.css takes it off
        // the screen; this keeps it from being timed and measured anyway.
        if (window.matchMedia("(max-width: 719.98px)").matches) return;

        var text = bubble.querySelector("[data-nh-bubble-text]");
        if (!text) return;

        // The first line is the one already in the markup; it shows on load
        // and again on the first click, in case it was missed. From there on
        // every click moves one line down.
        var LINES = [
            "Hey, you should totally interact with everything. Click away!",
            "Yeah, I think you've got it",
            "This really tickles",
            "Rock, paper, scissors...",
            "I chose rock, did I win?",
            "Ok, let's wrap things up now"
        ];

        var canHover = window.matchMedia ? window.matchMedia("(hover: hover)") : null;
        var greeted = false;     // the bubble has shown itself once and gone
        var HIDE_AT = 0.3;       // share of the scrollable page
        var LINGER_MS = 6000;    // how long it stays open
        var ticking = false;
        var timer = null;
        var opened = 0;          // how many times the message has been shown

        // "1s" / "500ms" from the CSS tokens, so the timing follows the animation
        var cssMs = function (name) {
            var value = window.getComputedStyle(bubble).getPropertyValue(name).trim();
            var n = parseFloat(value) || 0;
            return /ms$/.test(value) ? n : n * 1000;
        };

        var isOpen = function () {
            return bubble.classList.contains("is-open");
        };

        // The size the bubble needs for the line it is holding. Measuring is
        // done open and without a transition, then the element is put back
        // the way it was and that is forced through the layout — so the
        // browser starts the growth from the dots, not from the size it was
        // just measured at. It ends leaving the text pinned to its width.
        var measure = function () {
            var wasOpen = isOpen();

            bubble.classList.add("is-still");
            bubble.classList.add("is-measuring");
            bubble.classList.add("is-open");
            text.style.width = "";
            bubble.style.width = "";
            bubble.style.height = "";
            // Rounded up, and from the fractional rect: offsetWidth rounds a
            // 186.3px line down to 186, and the last word wraps out of a
            // bubble measured for one line.
            var box = bubble.getBoundingClientRect();
            var line = text.getBoundingClientRect();
            var size = { w: Math.ceil(box.width), h: Math.ceil(box.height), text: Math.ceil(line.width) };

            // back the way it was: open at its new size, or down at the dots
            text.style.width = size.text + "px";
            bubble.classList.remove("is-measuring");
            if (wasOpen) {
                bubble.style.width = size.w + "px";
                bubble.style.height = size.h + "px";
            } else {
                bubble.classList.remove("is-open");
            }
            void bubble.offsetWidth;   // commit that, still with no transition
            bubble.classList.remove("is-still");

            return size;
        };

        // Once it is open the pointer has room around it: it only closes when
        // the pointer is further than SLACK from the bubble's edge, so a hand
        // that drifts off it by a cursor's width keeps it open. Opening still
        // asks for the pointer on the dots themselves.
        var SLACK = 32;   // px of room around the open bubble
        var watching = false;

        var beyondSlack = function (event) {
            var box = bubble.getBoundingClientRect();
            var x = Math.max(box.left - event.clientX, 0, event.clientX - box.right);
            var y = Math.max(box.top - event.clientY, 0, event.clientY - box.bottom);
            return Math.sqrt(x * x + y * y) > SLACK;
        };

        var unwatch = function () {
            if (!watching) return;
            watching = false;
            document.removeEventListener("pointermove", follow);
            window.removeEventListener("blur", leave);
        };

        var follow = function (event) {
            if (beyondSlack(event)) leave();
        };

        function leave() {
            unwatch();
            if (isOpen()) close();
        }

        var watch = function () {
            if (watching) return;
            watching = true;
            document.addEventListener("pointermove", follow);
            window.addEventListener("blur", leave);   // the pointer left for good
        };

        var close = function () {
            window.clearTimeout(timer);
            unwatch();
            greeted = true;
            bubble.classList.remove("is-open");
            bubble.setAttribute("aria-expanded", "false");
            // back to the size the stylesheet keeps for the dots
            bubble.style.width = "";
            bubble.style.height = "";
        };

        var open = function (waitMs, hold) {
            text.textContent = LINES[opened < 2 ? 0 : (opened - 1) % LINES.length];
            opened += 1;

            var size = measure();
            bubble.style.width = size.w + "px";
            bubble.style.height = size.h + "px";
            bubble.classList.add("is-open");
            bubble.setAttribute("aria-expanded", "true");
            window.clearTimeout(timer);
            // held open means the pointer is on it — it goes when the pointer does
            if (!hold) {
                timer = window.setTimeout(close, waitMs + LINGER_MS);
            }
        };

        var update = function () {
            ticking = false;
            var y = window.scrollY || window.pageYOffset || 0;
            var scrollable = document.documentElement.scrollHeight - window.innerHeight;

            if (scrollable > 0 && y >= scrollable * HIDE_AT && isOpen()) {
                close();
            }
        };

        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });

        // The bubble opens itself once, and a click puts it away. From then on
        // it answers the pointer: it grows while the pointer is on it and
        // contracts when the pointer leaves, with no clicking at all. Where
        // there is no pointer to hover with, the click keeps doing both.
        var pointerOpens = canHover && canHover.matches;

        var pop = function (hold) {
            open(reduceMotion.matches ? 0 : cssMs("--nh-bubble-out") + cssMs("--nh-bubble-in"), hold);
        };

        bubble.addEventListener("pointerenter", function () {
            unwatch();
            if (pointerOpens && greeted && !isOpen()) pop(true);
        });

        // leaving the bubble starts watching the pointer rather than closing:
        // it has the slack above before the bubble goes
        bubble.addEventListener("pointerleave", function () {
            if (pointerOpens && greeted && isOpen()) watch();
        });

        bubble.addEventListener("click", function () {
            if (isOpen()) {
                close();
            } else if (!pointerOpens) {
                pop(false);
            }
        });

        // the line breaks move with the font and the window; measuring while
        // open writes the new size without animating to it
        var remeasure = function () {
            if (isOpen()) measure();
        };
        window.addEventListener("resize", remeasure);
        if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
            document.fonts.ready.then(remeasure);
        }

        // first appearance: the CSS wait plus the pop, then six seconds
        open(reduceMotion.matches ? 0 : cssMs("--nh-bubble-delay") + cssMs("--nh-bubble-in"));
        update();   // a reload that restores the page halfway down starts closed
    };


    renderGrid();
    initPhotoStack();
    initNavigation();
    initExpand();
    initBubble();

    window.addEventListener("load", function () {
        if (pending.length && window.console && console.info) {
            console.info("[new-home] Preview images still to add:\n  " + pending.join("\n  "));
        }
    });
})();
