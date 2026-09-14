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
        var img = item && item.src
            ? '<img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || "") + '"' +
              ' loading="' + (eager ? "eager" : "lazy") + '" decoding="async">'
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

    var cardAttrs = function (options) {
        var tone = options.tone || "";
        var classes = "nh-card" + (options.extraClass ? " " + options.extraClass : "") +
            (isDarkTone(tone) ? " is-dark" : "") + (options.href ? "" : " is-unlinked");
        var ratio = cssRatio(options.ratio);
        var style = "--i: " + options.index + (tone ? "; --tone: " + escapeHtml(tone) : "") +
            (ratio ? "; --card-ratio: " + ratio : "");

        return ' class="' + classes + '" style="' + style + '"' +
            ' data-size="' + escapeHtml(options.size) + '" data-project="' + escapeHtml(options.id) + '"' +
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
                ratio: project.ratio
            }) + ">" +
            '<div class="nh-card__stage">' + (stageContent(project, index < 2) || "") + "</div>" +
            linkHtml(project.href, "Open " + (project.title || "project"),
                '<span class="nh-card__arrow">' + ARROW + "</span>") +
            "</article>";
    };

    // Graphic design: the one card with text — label, title, description and
    // a call to action — above a small pile of printed pieces.
    var graphicDesignCardHtml = function (gd, index) {
        var label = (gd.label || []).map(function (part) {
            return "<span>" + escapeHtml(part) + "</span>";
        }).join("");

        return "<article" + cardAttrs({
                id: gd.id || "graphic-design", domId: "graphic-design", index: index + 1,
                tone: gd.tone, href: gd.href, size: "medium", extraClass: "nh-card--text"
            }) + ' aria-labelledby="gd-title">' +
            '<div class="nh-card__stage">' +
            '<div class="nh-gd__text">' +
            (label ? '<p class="nh-label">' + label + "</p>" : "") +
            '<h2 class="nh-gd__title" id="gd-title">' + escapeHtml(gd.title || "Graphic Design") + "</h2>" +
            (gd.description ? '<p class="nh-gd__desc">' + escapeHtml(gd.description) + "</p>" : "") +
            (gd.cta ? '<p class="nh-gd__cta">' + escapeHtml(gd.cta) + ' <span class="nh-arrow" aria-hidden="true">→</span></p>' : "") +
            "</div>" +
            frameHtml({ frame: "prints", media: gd.media }, false) +
            "</div>" +
            linkHtml(gd.href, (gd.cta || "Open") + ": " + (gd.title || "Graphic Design"), "") +
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
    var renderGrid = function () {
        var grid = document.querySelector("[data-nh-grid]");
        if (!grid || !data) {
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

    var renderContactLinks = function () {
        var list = document.querySelector("[data-nh-contact-links]");
        var links = data && data.links;
        if (!list || !links) {
            return;
        }

        [["LinkedIn", links.linkedin], ["Behance", links.behance], ["Instagram", links.instagram]]
            .filter(function (entry) { return /^https:\/\//.test(entry[1] || ""); })
            .forEach(function (entry) {
                var li = document.createElement("li");
                li.innerHTML = '<a class="nh-link" href="' + escapeHtml(entry[1]) + '" target="_blank" rel="noopener noreferrer">' +
                    escapeHtml(entry[0]) + '<span class="nh-link__ext" aria-hidden="true">↗</span>' +
                    '<span class="nh-visually-hidden"> (opens in a new tab)</span></a>';
                list.appendChild(li);
            });
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


    // Message bubble. Its entrance is pure CSS, so it plays the moment the
    // page renders, with no wait for this script. It stays for six seconds,
    // and goes early if the visitor clicks it or has scrolled 30% of the
    // page. Once it is gone the dot takes its corner: each click brings it
    // back for another six seconds, one line further down LINES. The list
    // starts over when it runs out, so the bubble never has nothing to say.
    var initBubble = function () {
        var bubble = document.querySelector("[data-nh-bubble]");
        if (!bubble) return;

        var dot = document.querySelector("[data-nh-bubble-dot]");

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

        var HIDE_AT = 0.3;       // share of the scrollable page
        var LINGER_MS = 6000;    // how long it stays once fully shown
        var ticking = false;
        var timer = null;
        var opened = 0;          // how many times the bubble has been shown

        // "1s" / "500ms" from the CSS tokens, so the timing follows the animation
        var cssMs = function (name) {
            var value = window.getComputedStyle(bubble).getPropertyValue(name).trim();
            var n = parseFloat(value) || 0;
            return /ms$/.test(value) ? n : n * 1000;
        };

        var hide = function () {
            window.clearTimeout(timer);
            bubble.classList.add("is-hidden");
            if (dot) dot.classList.remove("is-hidden");
        };

        var show = function (waitMs) {
            bubble.textContent = LINES[opened < 2 ? 0 : (opened - 1) % LINES.length];
            opened += 1;
            if (dot) dot.classList.add("is-hidden");
            bubble.classList.remove("is-hidden");
            window.clearTimeout(timer);
            timer = window.setTimeout(hide, waitMs + LINGER_MS);
        };

        var update = function () {
            ticking = false;
            var y = window.scrollY || window.pageYOffset || 0;
            var scrollable = document.documentElement.scrollHeight - window.innerHeight;

            if (scrollable > 0 && y >= scrollable * HIDE_AT && !bubble.classList.contains("is-hidden")) {
                hide();
            }
        };

        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });

        // a click on the bubble puts it away without waiting out the six seconds
        bubble.addEventListener("click", hide);

        if (dot) {
            dot.addEventListener("click", function () {
                show(reduceMotion.matches ? 0 : cssMs("--nh-bubble-in"));
            });
        }

        // first appearance: the CSS wait plus the pop, then six seconds
        show(reduceMotion.matches ? 0 : cssMs("--nh-bubble-delay") + cssMs("--nh-bubble-in"));
        update();   // a reload that restores the page halfway down starts hidden
    };


    renderGrid();
    initPhotoStack();
    renderContactLinks();
    initNavigation();
    initExpand();
    initBubble();

    window.addEventListener("load", function () {
        if (pending.length && window.console && console.info) {
            console.info("[new-home] Preview images still to add:\n  " + pending.join("\n  "));
        }
    });
})();
