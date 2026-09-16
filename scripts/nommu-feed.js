// nommu-feed.js — the NOMMU prototype inside the phone on the home page.
//
// NOMMU is a social network for places you eat at: people post where they
// went, what it cost and what it was like, and the feed is how everyone else
// finds the next one. What runs here is the Recommended feed — three reviews,
// the ones below, with everything a visitor can do to a post:
//
//   · the two photographs of each place swipe sideways, by drag or by dot
//   · the heart counts, the star saves, both keep their state for the visit
//   · the comments open over the feed rather than instead of it, so closing
//     them puts the visitor back exactly where they were reading
//
// The markup for the shell is the <template data-nh-card="nommu"> in
// index.html; the posts and the comments are built here. Nothing in this
// file touches anything outside the NOMMU card.
(function () {
    "use strict";

    var REVIEWS = [
        {
            id: "afterglow",
            name: "Lia Martins",
            handle: "@liamartins",
            avatar: "assets/girl-profile.jpeg",
            place: "Afterglow",
            category: "Cocktail Bar",
            price: 2,                      // of three
            rating: 4.5,
            address: "Rua das Flores, 218, Curitiba - PR",
            text: "Great drinks, cozy atmosphere, and a playlist that makes you want to stay a little longer.",
            when: "20 minutes ago",
            photos: [
                { src: "assets/girl-dupe-1.jpeg", alt: "A cocktail on the bar at Afterglow" },
                { src: "assets/girl-dupe-2.jpeg", alt: "The room at Afterglow in the evening" }
            ],
            likes: 128,
            comments: [
                { handle: "@sophiem", text: "This place looks so good!" },
                { handle: "@alexr", text: "Adding this to my weekend list." },
                { handle: "@mariac", text: "The atmosphere is everything." },
                { handle: "@jamesk", text: "Those drinks look incredible." },
                { handle: "@ninar", text: "Okay, I need to go here." }
            ],
            commentCount: 8,
            shares: 2
        },
        {
            id: "mori",
            name: "Clara Nunes",
            handle: "@claranunes",
            avatar: "assets/mathca-profile.jpeg",
            place: "Mori Matcha",
            category: "Matcha Café",
            price: 1,
            rating: 4.8,
            address: "Alameda Dom Pedro II, 47, Curitiba - PR",
            text: "Creamy matcha with just the right amount of bitterness. The kind of café you want to come back to every week.",
            when: "2 hours ago",
            photos: [
                { src: "assets/matcha-dupe-1.jpeg", alt: "An iced matcha at Mori Matcha" },
                { src: "assets/matcha-dupe-2.jpeg", alt: "The counter at Mori Matcha" }
            ],
            likes: 246,
            comments: [
                { handle: "@sophiem", text: "This matcha looks perfect." },
                { handle: "@emilyr", text: "Need to try this place!" },
                { handle: "@noahc", text: "Saving this for my next café day." },
                { handle: "@lilym", text: "Okay, this is my kind of spot." },
                { handle: "@juliar", text: "The color alone convinced me." }
            ],
            commentCount: 14,
            shares: 5
        },
        {
            id: "vialuna",
            name: "Theo Almeida",
            handle: "@theoalmeida",
            avatar: "assets/pizza-profile.jpeg",
            place: "Via Luna",
            category: "Pizzeria",
            price: 3,
            rating: 4.7,
            address: "Rua Trajano Reis, 930, Curitiba - PR",
            text: "Light crust, airy edges, and amazing ingredients. The pistachio pizza was the surprise of the night.",
            when: "yesterday",
            photos: [
                { src: "assets/pizza-dupe-1.jpeg", alt: "A pistachio pizza at Via Luna" },
                { src: "assets/pizza-dupe-2.jpeg", alt: "The oven and the counter at Via Luna" }
            ],
            likes: 189,
            comments: [
                { handle: "@alexr", text: "The pistachio pizza looks unreal." },
                { handle: "@sophiem", text: "Adding this to my list immediately." },
                { handle: "@jamesk", text: "That crust looks so good." },
                { handle: "@mariac", text: "I need to know where this is." },
                { handle: "@lucasv", text: "Okay, this is officially saved." }
            ],
            commentCount: 11,
            shares: 3
        }
    ];

    var SWIPE = 18;   // px of drag before the carousel changes photograph

    var escapeHtml = function (value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    };

    var element = function (html) {
        var holder = document.createElement("div");
        holder.innerHTML = html.trim();
        return holder.firstElementChild;
    };

    // "$ $ $", with the ones this place does not reach left pale
    var priceMarks = function (level) {
        var out = "";
        for (var i = 1; i <= 3; i += 1) {
            out += '<span class="nm-post__coin' + (i > level ? " is-off" : "") + '">$</span>';
        }
        return out;
    };

    var ICONS = {
        heart: '<path d="M12 20s-7-4.35-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.65 12 20 12 20z"/>',
        comment: '<path d="M20 12a7 7 0 0 1-7 7H5l2-2.5A7 7 0 1 1 20 12z"/>',
        send: '<path d="M20 4 4 11l6 2.5L12.5 20z"/><path d="M20 4 10 13.5"/>',
        star: '<path d="m12 4 2.4 5.1 5.6.6-4.2 3.8 1.2 5.5-5-2.9-5 2.9 1.2-5.5L4 9.7l5.6-.6z"/>',
        seal: '<circle cx="12" cy="12" r="9"/><path d="m12 7.4 1.4 3 3.2.4-2.4 2.2.7 3.1-2.9-1.6-2.9 1.6.7-3.1-2.4-2.2 3.2-.4z"/>'
    };

    var svg = function (name, cls) {
        return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + "</svg>";
    };

    var initCard = function (root) {
        var feed = root.querySelector("[data-nm-feed]");
        var sheet = root.querySelector("[data-nm-sheet]");
        var sheetPlace = root.querySelector("[data-nm-sheet-place]");
        var sheetList = root.querySelector("[data-nm-sheet-list]");
        if (!feed) {
            return;
        }

        // --- a post ---------------------------------------------------------

        var buildPost = function (review) {
            var post = element(
                '<article class="nm-post" data-nm-post="' + escapeHtml(review.id) + '">' +

                '<header class="nm-post__head">' +
                '<img class="nm-post__avatar" src="' + escapeHtml(review.avatar) + '" alt="" loading="lazy"/>' +
                '<span class="nm-post__who">' +
                '<span class="nm-post__name">' + escapeHtml(review.name) + "</span>" +
                '<span class="nm-post__handle">' + escapeHtml(review.handle) + "</span>" +
                "</span>" +
                '<span class="nm-post__more" aria-hidden="true">•••</span>' +
                "</header>" +

                '<div class="nm-post__media">' +
                '<div class="nm-post__rail" data-nm-rail>' +
                review.photos.map(function (photo) {
                    return '<img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" loading="lazy" draggable="false"/>';
                }).join("") +
                "</div>" +
                '<div class="nm-post__dots" data-nm-dots>' +
                review.photos.map(function (photo, index) {
                    return '<button class="nm-post__dot' + (index ? "" : " is-on") + '" type="button" data-nm-go="' + index +
                        '" aria-label="Photo ' + (index + 1) + ' of ' + review.photos.length + '"></button>';
                }).join("") +
                "</div>" +
                "</div>" +

                '<div class="nm-post__place">' +
                '<span class="nm-post__score">' +
                '<span class="nm-post__rating">' + svg("seal", "nm-post__seal") + review.rating.toFixed(1) + "</span>" +
                '<span class="nm-post__price">' + priceMarks(review.price) + "</span>" +
                "</span>" +
                '<span class="nm-post__about">' +
                '<span class="nm-post__title">' + escapeHtml(review.place) +
                '<span class="nm-post__cat">' + escapeHtml(review.category) + "</span></span>" +
                '<span class="nm-post__address">' + escapeHtml(review.address) + "</span>" +
                "</span>" +
                "</div>" +

                '<div class="nm-post__actions">' +
                '<button class="nm-post__action" type="button" data-nm-like aria-pressed="false" aria-label="Like this review">' +
                svg("heart", "nm-post__icon") + '<span data-nm-likes>' + review.likes + "</span></button>" +
                '<button class="nm-post__action" type="button" data-nm-comments aria-label="Open comments">' +
                svg("comment", "nm-post__icon") + "<span>" + review.commentCount + "</span></button>" +
                '<span class="nm-post__action is-quiet">' + svg("send", "nm-post__icon") + "<span>" + review.shares + "</span></span>" +
                '<button class="nm-post__action nm-post__save" type="button" data-nm-save aria-pressed="false" aria-label="Save this place">' +
                svg("star", "nm-post__icon") + "</button>" +
                "</div>" +

                '<p class="nm-post__text"><b>' + escapeHtml(review.handle) + "</b> " + escapeHtml(review.text) + "</p>" +
                '<p class="nm-post__when">' + escapeHtml(review.when) + "</p>" +

                "</article>"
            );

            // --- the two photographs -----------------------------------------

            var rail = post.querySelector("[data-nm-rail]");
            var dots = Array.prototype.slice.call(post.querySelectorAll("[data-nm-go]"));
            var at = 0;
            var drag = null;

            var show = function (index) {
                at = Math.min(Math.max(index, 0), review.photos.length - 1);
                rail.style.transform = "translateX(" + (-at * 100) + "%)";
                dots.forEach(function (dot, i) {
                    dot.classList.toggle("is-on", i === at);
                });
            };

            dots.forEach(function (dot) {
                dot.addEventListener("click", function () {
                    show(parseInt(dot.getAttribute("data-nm-go"), 10));
                });
            });

            rail.addEventListener("pointerdown", function (event) {
                if (event.pointerType === "mouse" && event.button !== 0) {
                    return;
                }
                drag = { id: event.pointerId, x: event.clientX, y: event.clientY, sideways: false };
                rail.classList.add("is-dragging");
            });

            rail.addEventListener("pointermove", function (event) {
                if (!drag || event.pointerId !== drag.id) {
                    return;
                }
                var dx = event.clientX - drag.x;
                var dy = event.clientY - drag.y;

                // a vertical movement is the feed scrolling, not a swipe
                if (!drag.sideways && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
                    drag.sideways = true;
                    try { rail.setPointerCapture(drag.id); } catch (error) { /* older browsers */ }
                }
                if (!drag.sideways) {
                    return;
                }

                event.preventDefault();
                var held = (at * -100) + (dx / rail.clientWidth) * 100;
                rail.style.transform = "translateX(" + held + "%)";
            });

            var release = function (event) {
                if (!drag || (event && event.pointerId !== drag.id)) {
                    return;
                }
                var dx = event && drag.sideways ? event.clientX - drag.x : 0;
                rail.classList.remove("is-dragging");
                drag = null;
                show(dx <= -SWIPE ? at + 1 : dx >= SWIPE ? at - 1 : at);
            };

            rail.addEventListener("pointerup", release);
            rail.addEventListener("pointercancel", release);
            rail.addEventListener("dragstart", function (event) { event.preventDefault(); });

            show(0);

            // --- the heart, the star and the comments -------------------------

            var like = post.querySelector("[data-nm-like]");
            var count = post.querySelector("[data-nm-likes]");
            var liked = false;

            like.addEventListener("click", function () {
                liked = !liked;
                like.classList.toggle("is-on", liked);
                like.setAttribute("aria-pressed", liked ? "true" : "false");
                count.textContent = review.likes + (liked ? 1 : 0);
                like.classList.remove("is-beating");
                void like.offsetWidth;          // so the beat plays again
                like.classList.add("is-beating");
            });

            var save = post.querySelector("[data-nm-save]");
            var saved = false;

            save.addEventListener("click", function () {
                saved = !saved;
                save.classList.toggle("is-on", saved);
                save.setAttribute("aria-pressed", saved ? "true" : "false");
                save.setAttribute("aria-label", saved ? "Saved" : "Save this place");
                save.classList.remove("is-beating");
                void save.offsetWidth;
                save.classList.add("is-beating");
            });

            post.querySelector("[data-nm-comments]").addEventListener("click", function () {
                openComments(review);
            });

            return post;
        };

        REVIEWS.forEach(function (review) {
            feed.appendChild(buildPost(review));
        });

        // --- the comments ---------------------------------------------------

        var openComments = function (review) {
            if (!sheet) {
                return;
            }
            sheetPlace.innerHTML = '<b>' + escapeHtml(review.place) + "</b> · " + escapeHtml(review.category);
            sheetList.innerHTML = review.comments.map(function (comment) {
                return '<li class="nm-sheet__comment">' +
                    '<span class="nm-sheet__mark" aria-hidden="true">' + escapeHtml(comment.handle.charAt(1).toUpperCase()) + "</span>" +
                    "<span><b>" + escapeHtml(comment.handle) + "</b> " + escapeHtml(comment.text) + "</span>" +
                    "</li>";
            }).join("");

            sheet.hidden = false;
            // the feed is left exactly as it was, under the sheet
            window.requestAnimationFrame(function () {
                sheet.classList.add("is-open");
            });
        };

        var closeComments = function () {
            if (!sheet || sheet.hidden) {
                return;
            }
            sheet.classList.remove("is-open");
            window.setTimeout(function () {
                if (!sheet.classList.contains("is-open")) {
                    sheet.hidden = true;
                }
            }, 260);
        };

        if (sheet) {
            sheet.querySelector("[data-nm-close]").addEventListener("click", closeComments);
            sheet.addEventListener("click", function (event) {
                if (event.target === sheet) {       // the dimmed part, beside the panel
                    closeComments();
                }
            });
            root.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    closeComments();
                }
            });
        }

        // the prototype's clicks are its own — they never reach the card
        root.addEventListener("click", function (event) { event.stopPropagation(); });
    };

    document.querySelectorAll("[data-nommu]").forEach(initCard);
})();
