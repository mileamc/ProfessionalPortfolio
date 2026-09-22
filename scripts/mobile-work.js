// mobile-work.js — what the home page is on a phone.
//
// The bento grid is a desktop composition: every card in it is a prototype
// that wants a pointer — a play to drag, a comparison to pick through, three
// landing pages running in a laptop. None of that is a phone's, so on a phone
// none of it is built. scripts/new-home.js stops at the introduction, and this
// file puts the list of projects under it instead: the same six the Work page
// lists, from data/work-projects.js, stacked one above the other.
//
// There is no separate Work page on a phone. This IS it.
//
// The width is read once, as the page loads, and never again: the prototypes'
// own scripts look for their markup the moment they run, so a grid rendered
// later would be a grid of dead cards. A phone turned on its side keeps the
// list it was given — which is the right content for a phone either way — and
// the list widens into two columns rather than leaving a photograph the whole
// width of the screen.
(function () {
    "use strict";

    // The site's own breakpoint, the one new-home.css calls a phone.
    if (!window.matchMedia("(max-width: 719.98px)").matches) {
        return;
    }

    var projects = Array.isArray(window.workProjects) ? window.workProjects : [];
    var grid = document.querySelector("[data-nh-grid]");
    if (!projects.length || !grid) {
        return;
    }

    var ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"' +
        ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        '<path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6"/></svg>';

    var escapeHtml = function (value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // The pill the tags are made of is the page's own .nh-tag — the shape the
    // availability tag and the hospital's credit already carry.
    var tagsHtml = function (tags) {
        if (!Array.isArray(tags) || !tags.length) {
            return "";
        }
        return '<ul class="nh-mob-card__tags">' + tags.map(function (tag) {
            return '<li class="nh-tag" data-tag="' + escapeHtml(tag.key) + '">' +
                escapeHtml(tag.label) + "</li>";
        }).join("") + "</ul>";
    };

    // Every photograph waits until it is scrolled to: on a phone the
    // introduction alone is more than a screenful, so not one of the six is
    // wanted while the page is landing.
    var cardHtml = function (project) {
        var cover = project.cover || {};
        var heading = "mob-" + escapeHtml(project.id);

        return '<article class="nh-card nh-card--content nh-mob-card"' +
            ' data-project="' + escapeHtml(project.id) + '"' +
            ' aria-labelledby="' + heading + '">' +

            '<div class="nh-mob-card__shot">' +
            '<img src="' + escapeHtml(cover.src) + '" alt=""' +
            ' width="' + escapeHtml(cover.w) + '" height="' + escapeHtml(cover.h) + '"' +
            ' loading="lazy" fetchpriority="low" decoding="async">' +
            "</div>" +

            '<div class="nh-mob-card__text">' +
            '<h3 class="nh-mob-card__name" id="' + heading + '">' + escapeHtml(project.name) + "</h3>" +
            '<p class="nh-mob-card__desc">' + escapeHtml(project.desc) + "</p>" +
            tagsHtml(project.tags) +
            "</div>" +

            // A project with a case page opens it. One without is a link in
            // name only: it keeps the arrow, and says it leads nowhere rather
            // than looking like it leads somewhere.
            (project.href
                ? '<a class="nh-card__link" href="' + escapeHtml(project.href) + '"'
                : '<a class="nh-card__link" role="link" aria-disabled="true"') +
            ' aria-label="Open ' + escapeHtml(project.name) + '">' +
            '<span class="nh-card__arrow">' + ARROW + "</span></a>" +

            "</article>";
    };

    var list = document.createElement("div");
    list.className = "nh-shell nh-mob-list";
    list.id = "work";
    list.innerHTML = projects.map(cardHtml).join("");

    // Under the grid, which at this width holds the introduction alone.
    grid.insertAdjacentElement("afterend", list);
    document.body.classList.add("is-phone-home");

    // #work is how work.html sends a phone here, and the browser looked for it
    // while this list was still a script. Now that it exists, go to it — and
    // without a scroll that travels the whole page to get there, which is what
    // arriving at an anchor should look like.
    if (window.location.hash === "#work") {
        var behavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        list.scrollIntoView();
        document.documentElement.style.scrollBehavior = behavior;
    }
})();
