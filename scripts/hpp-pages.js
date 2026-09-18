// hpp-pages.js — the three landing pages, rebuilt here, and the browser
// around them.
//
// Nothing here is the live site: no frame, no embed, no request that leaves
// this page. Each of the three is markup of its own, written to the same
// shape and the same palette as the page it stands for, and each scrolls in
// a window of its own inside the laptop. The tabs above them pick which one
// is shown, and a page starts at its top every time it is picked.
//
// What is faithful and what is a reconstruction is worth being straight
// about. The Verão Maior hero is the artwork itself, the one piece of these
// campaigns that is in this repository; its copy is read off it word for
// word. The sections under it, and both of the other two pages, are built
// from the campaigns' purpose and the hospital's own palette and hierarchy —
// the real pages could not be opened from here to be copied more closely.
(function () {
    "use strict";

    var escapeHtml = function (value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    };

    /* ---------------------------------------------------------------------
       1 — Verão Maior
       hospital-pequeno-principe.rds.land/acao_verao_maior

       Summer safety for parents, run with the state's Verão Maior Paraná
       season. Sand above, sea below, the hospital's blue for the headings
       and its red for the season's name.
    --------------------------------------------------------------------- */

    // Verão Maior is not rebuilt here: hpp/verao-maior.html is the page as
    // published, saved into this repository and served from it. Its markup,
    // its stylesheets and the sources of its pictures are its own, untouched;
    // what was taken out is every <script> — its tracking, its form handler
    // and the pop-up library — the cookie notice and the tag manager's frame.
    //
    // It is shown in a document of its own so that its stylesheets, which are
    // written for a whole page (body, h1, .bricks--section), stay inside it
    // and never reach the portfolio around it. The document is this
    // repository's own file; nothing of the live site is fetched but the
    // pictures it points at.
    //
    // It is laid out at the width a desktop gives it and then scaled down to
    // the laptop's screen, which is what a screen inside a screen has to do:
    // at the laptop's own width the page would draw its narrow layout, and
    // this is the published one.
    var VERAO_SRC = "hpp/verao-maior.html";
    var VERAO_WIDTH = 1280;       // the width the page is laid out at

    /* ---------------------------------------------------------------------
       2 — Pix Automático
       conteudo.doepequenoprincipe.org.br/pix_automatico

       A recurring donation, authorised once in the visitor's own bank. The
       page it belongs to is a donation page: the amounts are the first thing
       on it, what the money does is the second, and how the authorisation
       works is the third.
    --------------------------------------------------------------------- */

    var PIX = '' +
        '<header class="hp-pix__hero">' +
            '<div class="hp-pix__copy">' +
                '<span class="hp-pix__flag">Novo</span>' +
                '<h1>Doe todo mês pelo <em>Pix Automático</em></h1>' +
                '<p>Você autoriza uma vez no seu banco e a sua doação chega ao Hospital Pequeno Príncipe todos os meses, sem boleto e sem cartão.</p>' +
            '</div>' +
            '<div class="hp-pix__panel">' +
                '<p class="hp-pix__panel-title">Escolha o valor mensal</p>' +
                '<div class="hp-pix__amounts">' +
                    '<button type="button" tabindex="-1">R$ 30</button>' +
                    '<button type="button" class="is-on" tabindex="-1">R$ 50</button>' +
                    '<button type="button" tabindex="-1">R$ 100</button>' +
                    '<button type="button" tabindex="-1">Outro</button>' +
                '</div>' +
                '<label>CPF<input type="text" placeholder="000.000.000-00" tabindex="-1" readonly/></label>' +
                '<label>E-mail<input type="text" placeholder="voce@email.com" tabindex="-1" readonly/></label>' +
                '<button type="button" class="hp-pix__go" tabindex="-1">Autorizar no meu banco</button>' +
                '<small>Você aprova a autorização dentro do app do seu banco.</small>' +
            '</div>' +
        '</header>' +

        '<section class="hp-pix__what">' +
            '<h2>O que a sua doação mantém de pé</h2>' +
            '<div class="hp-pix__cards">' +
                '<article><strong>R$ 30</strong><p>Um mês de material para os curativos de um leito.</p></article>' +
                '<article><strong>R$ 50</strong><p>Exames de acompanhamento de uma criança em tratamento.</p></article>' +
                '<article><strong>R$ 100</strong><p>Um dia de internação em enfermaria, do café à visita médica.</p></article>' +
            '</div>' +
        '</section>' +

        '<section class="hp-pix__how">' +
            '<h2>Como funciona</h2>' +
            '<ol>' +
                '<li><span>1</span><p>Você escolhe o valor e informa o CPF.</p></li>' +
                '<li><span>2</span><p>O seu banco pede a aprovação da autorização, uma única vez.</p></li>' +
                '<li><span>3</span><p>Todo mês o valor sai automaticamente, na data que você escolheu.</p></li>' +
                '<li><span>4</span><p>Você cancela quando quiser, pelo próprio app do banco.</p></li>' +
            '</ol>' +
        '</section>' +

        '<section class="hp-pix__faq">' +
            '<h2>Perguntas frequentes</h2>' +
            '<details open><summary>Preciso ter conta em algum banco específico?</summary><p>Não. O Pix Automático funciona em qualquer banco que ofereça o Pix.</p></details>' +
            '<details><summary>Posso mudar o valor depois?</summary><p>Pode, e sem falar com ninguém: a autorização fica no seu app.</p></details>' +
            '<details><summary>Recebo recibo para o Imposto de Renda?</summary><p>Sim, enviamos o recibo anual por e-mail.</p></details>' +
        '</section>' +

        '<footer class="hp-pix__foot">' +
            '<span class="hp-mark"><b>pequeno</b>PRÍNCIPE</span>' +
            '<p>doepequenoprincipe.org.br</p>' +
        '</footer>';

    /* ---------------------------------------------------------------------
       3 — Todo o Brasil
       lp.pequenoprincipe.org.br/todo-o-brasil

       The hospital is in Curitiba and its patients are not: the page is about
       reach. Numbers first, then the states, then the ask.
    --------------------------------------------------------------------- */

    var BRASIL = '' +
        '<header class="hp-br__hero">' +
            '<div class="hp-br__copy">' +
                '<h1>De <em>todo o Brasil</em> para o Pequeno Príncipe</h1>' +
                '<p>Crianças e adolescentes chegam de todos os estados para um tratamento que muitas vezes não existe perto de casa.</p>' +
                '<button type="button" tabindex="-1">Quero ajudar</button>' +
            '</div>' +
            '<div class="hp-br__map" aria-hidden="true">' +
                // the country as a shape, roughly drawn: the point of it is
                // the spread of the marks on it, not the cartography
                '<svg viewBox="0 0 100 110" class="hp-br__shape"><path d="M30 18 L44 8 L56 14 L62 22 L78 30 L88 42 ' +
                    'L86 55 L76 70 L62 80 L54 92 L44 96 L36 88 L30 78 L26 66 L18 56 L8 46 L14 36 L22 26 Z"/></svg>' +
                '<span class="hp-br__pin" style="--x: 30%; --y: 30%"></span>' +
                '<span class="hp-br__pin" style="--x: 76%; --y: 30%"></span>' +
                '<span class="hp-br__pin" style="--x: 82%; --y: 43%"></span>' +
                '<span class="hp-br__pin" style="--x: 56%; --y: 55%"></span>' +
                '<span class="hp-br__pin" style="--x: 48%; --y: 84%"></span>' +
                '<span class="hp-br__pin hp-br__pin--home" style="--x: 58%; --y: 76%"></span>' +
            '</div>' +
        '</header>' +

        '<section class="hp-br__numbers">' +
            '<article><strong>27</strong><p>estados de onde vêm os pacientes</p></article>' +
            '<article><strong>+3 mil</strong><p>crianças atendidas por mês</p></article>' +
            '<article><strong>34</strong><p>especialidades pediátricas</p></article>' +
            '<article><strong>70%</strong><p>dos atendimentos pelo SUS</p></article>' +
        '</section>' +

        '<section class="hp-br__story">' +
            '<div class="hp-br__photo" aria-hidden="true"></div>' +
            '<div class="hp-br__text">' +
                '<h2>Longe de casa, perto do tratamento</h2>' +
                '<p>Famílias atravessam o país atrás de um diagnóstico. Quando chegam, encontram um hospital que cuida da criança e também de quem veio com ela — acolhimento, alojamento e acompanhamento durante todo o tratamento.</p>' +
                '<p>Manter isso de pé depende de quem doa.</p>' +
            '</div>' +
        '</section>' +

        '<section class="hp-br__cta">' +
            '<h2>Sua doação chega a todos os estados</h2>' +
            '<div class="hp-br__amounts">' +
                '<button type="button" tabindex="-1">R$ 40</button>' +
                '<button type="button" class="is-on" tabindex="-1">R$ 80</button>' +
                '<button type="button" tabindex="-1">R$ 150</button>' +
            '</div>' +
            '<button type="button" class="hp-br__go" tabindex="-1">Doar agora</button>' +
        '</section>' +

        '<footer class="hp-br__foot">' +
            '<span class="hp-mark"><b>pequeno</b>PRÍNCIPE</span>' +
            '<p>pequenoprincipe.org.br</p>' +
        '</footer>';

    var PAGES = [
        { id: "verao",  label: "Verão Maior",    url: "hospital-pequeno-principe.rds.land/acao_verao_maior", src: VERAO_SRC },
        { id: "pix",    label: "Pix Automático", url: "conteudo.doepequenoprincipe.org.br/pix_automatico",   html: PIX },
        { id: "brasil", label: "Todo o Brasil",  url: "lp.pequenoprincipe.org.br/todo-o-brasil",             html: BRASIL }
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

            if (page.src) {
                // the page as published, in a document of its own
                var frame = document.createElement("iframe");
                frame.className = "hp-frame";
                frame.src = page.src;
                frame.title = page.label + " — landing page";
                frame.loading = "lazy";
                frame.setAttribute("scrolling", "yes");
                pane.classList.add("hp-page--framed");
                pane.appendChild(frame);
                pane.frame = frame;
            } else {
                pane.innerHTML = page.html;
            }

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
                screen.style.setProperty("--hp-k", (wide / VERAO_WIDTH).toFixed(5));
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
