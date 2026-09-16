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
            verified: true,
            place: "Afterglow",
            category: "Cocktail Bar",
            price: 2,                      // of three
            rating: 4.5,
            address: "218 Blossom Street, Curitiba",
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
            address: "47 Garden Avenue, Curitiba",
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
            address: "930 Moonlight Street, Curitiba",
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

    // The icons. The roll is the supplied artwork (assets/roll-rating.svg and
    // roll-verified.svg are the same shape in two colours), inlined so it can
    // take a colour from the interface rather than carrying its own; the rest
    // are drawn centred on the same 24 x 24 grid, so an icon and the number
    // beside it sit on one line.
    var ROLL = "M346.424 155.088C341.61 149.446 331.476 143.879 329.99 136.808C328.298 128.758 333.243 122.909 334.785 115.217C340.482 86.7427 320.269 54.7328 290.542 51.4416C282.024 50.5012 273.788 53.5856 266.399 47.4356C261.322 43.204 260.044 33.4995 256.565 27.2555C241.316 -0.109015 205.215 -8.30896 179.173 9.27579C171.257 14.617 168.549 21.9895 156.929 18.9991C153.3 18.0588 149.22 14.0904 145.685 12.4166C116.578 -1.38791 79.8184 13.357 71.1127 44.7838C69.4392 50.8397 69.8529 59.303 65.9607 64.0424C60.8088 70.324 48.5493 69.5529 40.6333 72.4868C14.723 82.0973 1.95588 111.343 9.43941 137.466C11.7898 145.685 20.2698 155.427 20.0442 162.536C19.8186 169.382 9.64624 177.563 6.09251 184.315C-7.2575 209.667 2.0687 242.053 26.8696 256.102C32.8113 259.468 43.9426 261.744 47.628 266.295C52.7611 272.614 50.3168 280.081 50.9561 287.359C53.8141 319.369 85.7601 341.392 116.822 334.509C124.532 332.797 130.041 327.4 138.408 330.334C144.801 332.572 148.411 340.414 153.638 345.116C175.562 364.845 209.934 363.51 229.658 341.355C234.679 335.713 238.533 324.504 244.475 321.438C252.128 317.488 260.044 322.416 268.091 322.623C281.667 322.961 297.104 316.755 306.712 307.238C318.652 295.39 323.296 279.629 322.037 263.004C321.773 259.6 320.288 256.196 320.137 252.698C319.592 239.777 328.091 239.062 336.421 233.251C361.899 215.478 366.637 178.766 346.424 155.088ZM286.311 183.111C278.17 241.921 210.31 272.652 160.595 239.664C89.8591 192.703 159.956 97.4064 222.551 142.017C259.649 168.441 227.571 220.123 190.097 201.711C187.822 200.602 181.504 195.618 180.357 193.624C178.101 189.712 179.248 182.904 183.29 180.497C192.429 175.061 195.493 184.747 202.432 185.612C221.329 187.944 226.198 166.918 209.802 156.668C165.917 129.247 121.899 194.884 173.927 225.408C206.249 244.366 249.796 229.997 263.428 194.959C279.617 153.339 249.871 114.859 209.708 105.155C130.342 85.9716 71.7144 175.024 120 240.887C124.644 247.225 136.095 254.785 127.954 263.079C118.421 272.784 107.816 256.948 102.739 249.707C56.1456 183.337 98.64 90.222 179.304 83.5643C236.183 78.8625 294.791 122.006 286.33 183.13L286.311 183.111Z";

    var ICONS = {
        heart: '<path d="M12 19.5c-.3 0-.6-.1-.8-.3l-6-5.4A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 6.8 7.2l-6 5.4c-.2.2-.5.3-.8.3z"/>',
        comment: '<path d="M12 4.5a7.5 7.5 0 0 1 0 15H4.9l1.8-2.7A7.5 7.5 0 0 1 12 4.5z"/>',
        send: '<path d="M20.3 4.2 3.9 10.7l6.1 2.6 2.6 6.1z"/><path d="M20.3 4.2 10 13.3"/>',
        star: '<path d="m12 4.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 10.2l5.4-.8z"/>',
        roll: '<path d="' + ROLL + '" transform="scale(0.0669)"/>'
    };

    var svg = function (name, cls) {
        return '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + "</svg>";
    };

    // the supplied roll, at its own size, in whatever colour it is given
    var roll = function (cls, label) {
        return '<svg class="' + cls + '" viewBox="0 0 359 359" ' +
            (label ? 'role="img" aria-label="' + escapeHtml(label) + '"' : 'aria-hidden="true"') +
            '><path d="' + ROLL + '"/></svg>';
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

        // Each post keeps its own carousel, and hands the feed a way to
        // drive it while a sideways drag is in flight.
        var rails = new Map();

        // --- a caption, kept to two lines -----------------------------------
        //
        // The word that opens the rest has to sit inside the text, not over
        // it, so the caption is cut back word by word until "\u2026 more" fits
        // the second line with it. Returns the measuring, to be run again
        // whenever the card changes size: the type scales with it.

        var fitCaption = function (caption, full) {
            var text = caption.querySelector(".nm-post__text");
            var body = caption.querySelector("[data-nm-body]");
            var expand = caption.querySelector("[data-nm-expand]");

            return function () {
                if (caption.classList.contains("is-open")) {
                    return;
                }
                body.textContent = full;
                expand.hidden = true;

                var line = parseFloat(window.getComputedStyle(text).lineHeight);
                var room = line * 2 + 1;
                if (text.scrollHeight <= room) {
                    return;                      // it was never cut short
                }

                expand.hidden = false;
                var words = full.split(" ");
                var few = 1;
                var many = words.length;
                while (few < many) {
                    var mid = Math.ceil((few + many) / 2);
                    body.textContent = words.slice(0, mid).join(" ") + "\u2026 ";
                    if (text.scrollHeight <= room) {
                        few = mid;
                    } else {
                        many = mid - 1;
                    }
                }
                body.textContent = words.slice(0, few).join(" ") + "\u2026 ";
            };
        };

        var buildPost = function (review) {
            var post = element(
                '<article class="nm-post" data-nm-post="' + escapeHtml(review.id) + '">' +

                '<header class="nm-post__head">' +
                '<img class="nm-post__avatar" src="' + escapeHtml(review.avatar) + '" alt="" loading="lazy" draggable="false"/>' +
                '<span class="nm-post__who">' +
                '<span class="nm-post__name">' + escapeHtml(review.name) +
                (review.verified ? roll("nm-post__verified", "Verified account") : "") + "</span>" +
                '<span class="nm-post__handle">' + escapeHtml(review.handle) + "</span>" +
                "</span>" +
                '<span class="nm-post__more is-off" aria-hidden="true">•••</span>' +
                "</header>" +

                '<div class="nm-post__media">' +
                '<div class="nm-post__rail" data-nm-rail>' +
                review.photos.map(function (photo) {
                    return '<img src="' + escapeHtml(photo.src) + '" alt="' + escapeHtml(photo.alt) + '" loading="lazy" draggable="false"/>';
                }).join("") +
                "</div>" +
                '<span class="nm-post__badge">' + roll("nm-post__roll") + "<span>" + review.rating.toFixed(1) + "</span></span>" +
                '<div class="nm-post__dots">' +
                review.photos.map(function (photo, index) {
                    return '<button class="nm-post__dot' + (index ? "" : " is-on") + '" type="button" data-nm-go="' + index +
                        '" aria-label="Photo ' + (index + 1) + " of " + review.photos.length + '"></button>';
                }).join("") +
                "</div>" +
                "</div>" +

                '<div class="nm-post__place">' +
                '<span class="nm-post__title">' + escapeHtml(review.place) + "</span>" +
                '<span class="nm-post__cat">' + escapeHtml(review.category) + "</span>" +
                '<span class="nm-post__price">' + priceMarks(review.price) + "</span>" +
                '<span class="nm-post__address">' + escapeHtml(review.address) + "</span>" +
                "</div>" +

                '<div class="nm-post__actions">' +
                '<button class="nm-post__action" type="button" data-nm-like aria-pressed="false" aria-label="Like this review">' +
                svg("heart", "nm-post__icon") + '<span data-nm-likes>' + review.likes + "</span></button>" +
                '<button class="nm-post__action" type="button" data-nm-comments aria-label="Open comments">' +
                svg("comment", "nm-post__icon") + "<span>" + review.commentCount + "</span></button>" +
                '<span class="nm-post__action is-off" aria-hidden="true">' + svg("send", "nm-post__icon") + "<span>" + review.shares + "</span></span>" +
                '<button class="nm-post__action nm-post__save" type="button" data-nm-save aria-pressed="false" aria-label="Save this place">' +
                svg("star", "nm-post__icon") + "</button>" +
                "</div>" +

                '<div class="nm-post__caption" data-nm-caption>' +
                '<p class="nm-post__text"><span data-nm-body>' + escapeHtml(review.text) + "</span>" +
                '<button class="nm-post__expand" type="button" data-nm-expand hidden>more</button></p>' +
                "</div>" +
                '<p class="nm-post__when">' + escapeHtml(review.when) + "</p>" +

                "</article>"
            );

            // --- the two photographs -----------------------------------------

            var rail = post.querySelector("[data-nm-rail]");
            var dots = Array.prototype.slice.call(post.querySelectorAll("[data-nm-go]"));
            var at = 0;

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

            rails.set(rail, {
                grab: function () { rail.classList.add("is-dragging"); },
                move: function (dx) {
                    rail.style.transform = "translateX(" + ((at * -100) + (dx / rail.clientWidth) * 100) + "%)";
                },
                drop: function (dx) {
                    rail.classList.remove("is-dragging");
                    show(dx <= -SWIPE ? at + 1 : dx >= SWIPE ? at - 1 : at);
                }
            });

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
                beat(like);
            });

            var save = post.querySelector("[data-nm-save]");
            var saved = false;

            save.addEventListener("click", function () {
                saved = !saved;
                save.classList.toggle("is-on", saved);
                save.setAttribute("aria-pressed", saved ? "true" : "false");
                save.setAttribute("aria-label", saved ? "Saved" : "Save this place");
                beat(save);
            });

            post.querySelector("[data-nm-comments]").addEventListener("click", function () {
                openComments(review);
            });

            // --- the rest of what was written --------------------------------
            //
            // A caption is kept to two lines so a post stays a post; the word
            // that opens the rest sits on the second line, over its ellipsis.

            var caption = post.querySelector("[data-nm-caption]");
            var expand = post.querySelector("[data-nm-expand]");

            caption.fit = fitCaption(caption, review.text);

            expand.addEventListener("click", function () {
                caption.querySelector("[data-nm-body]").textContent = review.text;
                caption.classList.add("is-open");
                expand.hidden = true;
            });

            return post;
        };

        var beat = function (button) {
            button.classList.remove("is-beating");
            void button.offsetWidth;          // so the beat plays again
            button.classList.add("is-beating");
        };

        REVIEWS.forEach(function (review) {
            feed.appendChild(buildPost(review));
        });

        // --- the welcome and its tabs, carried off the top ---------------------
        //
        // Neither is inside the feed, so the feed hands them its own scroll:
        // they rise by what has been scrolled and hand the same height down,
        // leaving the screen to the reviews.

        var chrome = root.querySelector(".nm-app__chrome");
        var app = root.querySelector("[data-nm-app]");

        var carryTop = function () {
            if (!chrome || !app) {
                return;
            }
            // rounded up, so no sliver of either is left behind
            var height = Math.ceil(chrome.getBoundingClientRect().height);
            var gone = Math.max(0, Math.min(feed.scrollTop, height));
            app.style.setProperty("--nm-lift", gone + "px");
        };

        feed.addEventListener("scroll", carryTop);
        carryTop();

        // Measured once the posts are in the document, and again on a resize.
        var fitCaptions = function () {
            feed.querySelectorAll("[data-nm-caption]").forEach(function (caption) {
                caption.fit();
            });
            carryTop();
        };

        fitCaptions();

        if (window.ResizeObserver) {
            new window.ResizeObserver(fitCaptions).observe(feed);
        }

        // --- dragging the feed, the way a thumb would -------------------------
        //
        // One gesture, one decision: the first few pixels say whether this is
        // the feed being pulled up or a photograph being pushed aside, and the
        // rest of the drag goes there. A drag that has moved is not a click,
        // so the button it ends on is not pressed.

        var FRICTION = 0.93;    // how quickly a flick runs out
        var AXIS = 5;           // px before the gesture picks its direction
        var TAP = 6;            // px of movement still counted as a tap

        var hold = null;
        var glide = 0;
        var moved = false;

        var stopGlide = function () {
            if (glide) {
                window.cancelAnimationFrame(glide);
                glide = 0;
            }
        };

        var coast = function (speed) {
            var last = window.performance.now();
            var step = function (now) {
                var ms = Math.min(now - last, 40);
                last = now;
                feed.scrollTop -= speed * ms;
                speed *= Math.pow(FRICTION, ms / 16);
                glide = Math.abs(speed) > 0.02 ? window.requestAnimationFrame(step) : 0;
            };
            glide = window.requestAnimationFrame(step);
        };

        feed.addEventListener("pointerdown", function (event) {
            if (event.pointerType === "mouse" && event.button !== 0) {
                return;
            }
            stopGlide();
            moved = false;
            hold = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                top: feed.scrollTop,
                axis: null,
                rail: rails.get(event.target.closest ? event.target.closest("[data-nm-rail]") : null) || null,
                lastY: event.clientY,
                lastAt: event.timeStamp,
                speed: 0
            };
        });

        feed.addEventListener("pointermove", function (event) {
            if (!hold || event.pointerId !== hold.id) {
                return;
            }
            var dx = event.clientX - hold.x;
            var dy = event.clientY - hold.y;

            if (!hold.axis) {
                if (Math.abs(dx) < AXIS && Math.abs(dy) < AXIS) {
                    return;
                }
                hold.axis = Math.abs(dx) > Math.abs(dy) && hold.rail ? "x" : "y";
                moved = true;
                try { feed.setPointerCapture(hold.id); } catch (error) { /* older browsers */ }
                if (hold.axis === "x") {
                    hold.rail.grab();
                } else {
                    feed.classList.add("is-dragging");
                }
            }

            event.preventDefault();

            if (hold.axis === "x") {
                hold.rail.move(dx);
                return;
            }

            feed.scrollTop = hold.top - dy;
            var ms = event.timeStamp - hold.lastAt;
            if (ms > 0) {
                hold.speed = (event.clientY - hold.lastY) / ms;
                hold.lastY = event.clientY;
                hold.lastAt = event.timeStamp;
            }
        });

        var release = function (event) {
            if (!hold || (event && event.pointerId !== hold.id)) {
                return;
            }
            var drag = hold;
            hold = null;
            feed.classList.remove("is-dragging");

            if (drag.axis === "x") {
                drag.rail.drop(event ? event.clientX - drag.x : 0);
                return;
            }
            if (drag.axis === "y" && Math.abs(drag.speed) > 0.05) {
                coast(drag.speed);
            }
        };

        feed.addEventListener("pointerup", release);
        feed.addEventListener("pointercancel", release);
        feed.addEventListener("dragstart", function (event) { event.preventDefault(); });

        // a drag that ends on a button does not press it
        feed.addEventListener("click", function (event) {
            if (moved) {
                moved = false;
                event.stopPropagation();
                event.preventDefault();
            }
        }, true);

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
