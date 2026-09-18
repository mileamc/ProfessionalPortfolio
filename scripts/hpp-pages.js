// hpp-pages.js — the three landing pages and the browser around them.
//
// The pages are not rebuilt here. Each of the three is the page as published,
// saved into this repository under hpp/ and served from it: its markup, its
// stylesheets and the sources of its pictures are its own, untouched. What
// was taken out of each is every <script> — the tracking, the form handler
// and the pop-up library — along with the cookie notice and the tag
// manager's frame, and a small stylesheet was added at the end of the head so
// that nothing inside answers a click.
//
// Each page is shown in a document of its own, so that stylesheets written
// for a whole page (body, h1, .bricks--section) stay inside it and never
// reach the portfolio around it. Each keeps a scroll position of its own, and
// starts at its top every time its tab is picked.
//
// Nothing of the live site is fetched but the pictures the pages point at.
(function () {
    "use strict";

    var escapeHtml = function (value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    };

    // Every one of them is laid out at the width a desktop gives it and then
    // scaled down to the laptop's screen, which is what a screen inside a
    // screen has to do: at the laptop's own width they would draw their
    // narrow layouts, and these are the published desktop ones.
    var PAGE_WIDTH = 1280;

    var PAGES = [
        // 1 — Verão Maior. Summer safety for parents, run with the state's
        //     Verão Maior Paraná season.
        {
            id: "verao",
            label: "Verão Maior",
            url: "hospital-pequeno-principe.rds.land/acao_verao_maior",
            src: "hpp/verao-maior.html"
        },
        // 2 — Pix Automático. A recurring donation, authorised once in the
        //     visitor's own bank.
        {
            id: "pix",
            label: "Pix Automático",
            url: "conteudo.doepequenoprincipe.org.br/pix_automatico",
            src: "hpp/pix-automatico.html"
        },
        // 3 — Todo o Brasil. The hospital is in Curitiba and its patients are
        //     not: the page is about reach.
        {
            id: "brasil",
            label: "Todo o Brasil",
            url: "lp.pequenoprincipe.org.br/todo-o-brasil",
            src: "hpp/todo-o-brasil.html"
        }
    ];


    /* ---------------------------------------------------------------------
       The browser
    --------------------------------------------------------------------- */

    var initCard = function (root) {
        var strip = root.querySelector("[data-hpp-tabs]");
        var stack = root.querySelector("[data-hpp-stack]");
        var bar = root.querySelector("[data-hpp-url]");
        if (!strip || !stack) {
            return;
        }

        // one window per page, so each keeps a scroll position of its own
        var panes = PAGES.map(function (page, index) {
            var pane = document.createElement("div");
            pane.className = "hp-page hp-page--" + page.id;
            pane.setAttribute("data-hpp-pane", page.id);
            pane.hidden = index > 0;

            // the page as published, in a document of its own
            var frame = document.createElement("iframe");
            frame.className = "hp-frame";
            frame.src = page.src;
            frame.title = page.label + " — landing page";
            frame.loading = "lazy";
            frame.setAttribute("scrolling", "yes");
            pane.appendChild(frame);
            pane.frame = frame;

            stack.appendChild(pane);
            return pane;
        });

        // A screen inside a screen: the page is laid out at a desktop's width
        // and scaled to the laptop's, so what shows is the layout the visitor
        // would see on a desktop rather than the narrow one.
        var screen = root.querySelector(".hl__screen");

        var fitFrames = function () {
            if (!screen) {
                return;
            }
            var wide = screen.getBoundingClientRect().width;
            if (wide) {
                screen.style.setProperty("--hp-k", (wide / PAGE_WIDTH).toFixed(5));
            }
        };

        fitFrames();
        if (window.ResizeObserver && screen) {
            new window.ResizeObserver(fitFrames).observe(screen);
        }

        var tabs = PAGES.map(function (page, index) {
            var tab = document.createElement("button");
            tab.type = "button";
            tab.className = "hp-tab hp-tab--" + page.id + (index === 0 ? " is-on" : "");
            tab.setAttribute("role", "tab");
            tab.setAttribute("aria-selected", index === 0 ? "true" : "false");
            tab.setAttribute("tabindex", index === 0 ? "0" : "-1");
            tab.innerHTML = '<span class="hp-tab__dot" aria-hidden="true"></span>' +
                '<span class="hp-tab__label">' + escapeHtml(page.label) + "</span>";
            strip.appendChild(tab);
            return tab;
        });

        // artwork that is served from the campaign's own library: if it does
        // not arrive, the tile it is in keeps the colour and the page reads
        // on, rather than showing a broken picture
        stack.querySelectorAll("[data-hpp-art]").forEach(function (art) {
            art.addEventListener("error", function () { art.remove(); }, { once: true });
        });

        var at = 0;

        var show = function (index) {
            at = Math.min(Math.max(index, 0), PAGES.length - 1);
            panes.forEach(function (pane, i) {
                pane.hidden = i !== at;
                if (i !== at) {
                    return;
                }
                pane.scrollTop = 0;            // a page is opened at its top
                if (pane.frame && pane.frame.contentWindow) {
                    try {
                        pane.frame.contentWindow.scrollTo(0, 0);
                    } catch (ignore) {
                        // a document that will not be scrolled from here
                    }
                }
            });
            tabs.forEach(function (tab, i) {
                tab.classList.toggle("is-on", i === at);
                tab.setAttribute("aria-selected", i === at ? "true" : "false");
                tab.setAttribute("tabindex", i === at ? "0" : "-1");
            });
            if (bar) {
                bar.textContent = PAGES[at].url;
            }
        };

        tabs.forEach(function (tab, index) {
            tab.addEventListener("click", function () {
                show(index);
            });
        });

        // left and right move between tabs, the way a tab strip does
        strip.addEventListener("keydown", function (event) {
            var step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            if (!step) {
                return;
            }
            event.preventDefault();
            var next = (at + step + PAGES.length) % PAGES.length;
            show(next);
            tabs[next].focus();
        });

        show(0);

        // the prototype's clicks are its own — they never reach the card, so
        // pointing at the laptop never opens the case page behind it
        root.addEventListener("click", function (event) { event.stopPropagation(); });
    };

    document.querySelectorAll("[data-hpp]").forEach(initCard);
})();
