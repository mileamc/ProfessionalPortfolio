// imb-compare.js — the equipment comparison inside the IMB card on the home
// page.
//
// The one on imb-brasil.com.br compares the whole catalogue; this shows the
// four machines below, in this order. Pick two or more and the right-hand
// panel builds a column for each, in the order they were picked; pick fewer
// and it goes back to asking for two. The columns keep their natural width,
// so past two the table scrolls sideways and the next one shows at the edge —
// which is how the visitor knows it is there.
//
// The markup for the shell is the <template data-nh-card="imb-compare"> in
// index.html; the machine cards and the table are built here, from MACHINES.
(function () {
    "use strict";

    var MACHINES = [
        {
            id: "2000hd",
            name: "IMB 2000HD MAX",
            type: "Concrete Paver",
            line: "Hydraulic Line",
            applications: "Curbs, curb & gutter, sidewalks and general channels",
            width: "Offset: 1.200 mm",
            reach: 1200,          // the widest profile it can lay, in mm
            height: "350"
        },
        {
            id: "3500hd",
            name: "IMB 3500HD",
            type: "Concrete Paver",
            line: "Hydraulic Line",
            applications: "Sidewalks, general channels, feed troughs and single New Jersey barriers",
            width: "Offset: 2.000 mm",
            reach: 2000,
            height: "350"
        },
        {
            id: "5500hd-titan",
            name: "IMB 5500HD TITAN",
            type: "Concrete Paver",
            line: "Hydraulic Line",
            applications: "Sidewalks, general channels, feed troughs, single or double New Jersey barriers and concrete pavement",
            width: "Offset: 2.500 mm / Inset: 3.600 mm",
            reach: 3600,
            height: "350"
        },
        {
            id: "5500hd-cronus",
            name: "IMB 5500HD CRONUS",
            type: "Concrete Paver",
            line: "Hydraulic Line",
            applications: "Sidewalks, general channels, feed troughs, single or double New Jersey barriers and concrete pavement",
            width: "Offset: 2.750 mm / Inset: 5.000 mm",
            reach: 5000,
            height: "350"
        }
    ];

    // The bar under "max. profile width" is read against the widest machine
    // here, not against whichever two are being compared — so the same machine
    // always draws the same bar, whatever it is next to.
    var WIDEST = MACHINES.reduce(function (most, machine) {
        return Math.max(most, machine.reach);
    }, 0);

    var SECTIONS = [
        {
            title: "Category & application",
            rows: [
                { label: "Equipment type", value: function (m) { return m.type; } },
                { label: "Line", value: function (m) { return m.line; } },
                { label: "Applications", value: function (m) { return m.applications; } }
            ]
        },
        {
            title: "Profile capacity",
            rows: [
                {
                    label: "Max. profile width",
                    value: function (m) { return m.width; },
                    bar: function (m) { return m.reach / WIDEST; }
                },
                {
                    label: "Max. profile height",
                    value: function (m) { return m.height; },
                    unit: "mm"
                }
            ]
        }
    ];

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

    var initCard = function (root) {
        var list = root.querySelector("[data-ic-machines]");
        var counter = root.querySelector("[data-ic-count]");
        var clear = root.querySelector("[data-ic-clear]");
        var empty = root.querySelector("[data-ic-empty]");
        var emptyTitle = root.querySelector("[data-ic-empty-title]");
        var emptyNote = root.querySelector("[data-ic-empty-note]");
        var scroll = root.querySelector("[data-ic-scroll]");
        var stage = root.querySelector(".ic__stage");
        if (!list || !scroll) {
            return;
        }

        var picked = [];   // machine ids, in the order they were picked

        // --- the list on the left -----------------------------------------

        var PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ic__plus" d="M7 12h10M12 7v10"/>' +
                   '<path class="ic__cross" d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>';

        MACHINES.forEach(function (machine) {
            var card = element(
                '<button class="ic__machine nh-card__interactive" type="button" aria-pressed="false" ' +
                'data-ic-pick="' + escapeHtml(machine.id) + '">' +
                '<span class="ic__thumb"><img src="assets/imb/card-' + escapeHtml(machine.id) + '.png" alt="" loading="lazy"/></span>' +
                '<span class="ic__machine-text">' +
                '<span class="ic__machine-name">' + escapeHtml(machine.name) + '</span>' +
                '<span class="ic__machine-sub">' + escapeHtml(machine.type) + '</span>' +
                '<span class="ic__machine-sub">' + escapeHtml(machine.line) + '</span>' +
                '</span>' +
                '<span class="ic__toggle" aria-hidden="true">' + PLUS + '</span>' +
                '</button>'
            );
            card.addEventListener("click", function () { toggle(machine.id); });
            list.appendChild(card);
        });

        var toggle = function (id) {
            var at = picked.indexOf(id);
            if (at < 0) {
                picked.push(id);
            } else {
                picked.splice(at, 1);
            }
            render();
        };

        // --- the table on the right ---------------------------------------

        var cell = function (machine, row) {
            if (row.bar) {
                var share = Math.round(row.bar(machine) * 100);
                return '<td><span class="ic__value">' + escapeHtml(row.value(machine)) + "</span>" +
                    '<span class="ic__bar"><span class="ic__bar-fill" style="width: ' + share + '%"></span></span></td>';
            }
            if (row.unit) {
                return '<td><span class="ic__figure">' + escapeHtml(row.value(machine)) +
                    '<span class="ic__unit"> ' + escapeHtml(row.unit) + "</span></span></td>";
            }
            return '<td><span class="ic__value">' + escapeHtml(row.value(machine)) + "</span></td>";
        };

        var buildTable = function (machines) {
            var span = machines.length + 1;
            var head = machines.map(function (machine) {
                return '<th scope="col"><span class="ic__col">' +
                    '<span class="ic__shot"><img src="assets/imb/compare-' + escapeHtml(machine.id) + '.png" alt="" loading="lazy"/></span>' +
                    '<span class="ic__col-text">' +
                    '<span class="ic__col-name">' + escapeHtml(machine.name) + "</span>" +
                    '<span class="ic__col-sub">' + escapeHtml(machine.type) + " | " + escapeHtml(machine.line) + "</span>" +
                    "</span></span></th>";
            }).join("");

            var body = SECTIONS.map(function (section) {
                return '<tr class="ic__section"><th colspan="' + span + '" scope="colgroup">' +
                    '<span class="ic__section-label">' +
                    '<span class="ic__mark" aria-hidden="true"></span>' + escapeHtml(section.title) +
                    "</span></th></tr>" +
                    section.rows.map(function (row) {
                        return "<tr>" + '<th scope="row">' + escapeHtml(row.label) + "</th>" +
                            machines.map(function (machine) { return cell(machine, row); }).join("") + "</tr>";
                    }).join("");
            }).join("");

            return '<table class="ic__table"><thead><tr><td class="ic__corner"></td>' + head +
                "</tr></thead><tbody>" + body + "</tbody></table>";
        };

        // --- state --------------------------------------------------------

        var render = function () {
            var machines = picked.map(function (id) {
                return MACHINES.filter(function (machine) { return machine.id === id; })[0];
            });

            list.querySelectorAll("[data-ic-pick]").forEach(function (card) {
                var on = picked.indexOf(card.getAttribute("data-ic-pick")) >= 0;
                card.classList.toggle("is-picked", on);
                card.setAttribute("aria-pressed", on ? "true" : "false");
            });

            if (counter) {
                counter.textContent = picked.length + " selected";
                counter.classList.toggle("is-counting", picked.length > 0);
            }
            if (clear) {
                clear.classList.toggle("is-live", picked.length > 0);
            }

            var enough = machines.length > 1;
            if (empty) {
                empty.hidden = enough;
            }
            // what is still missing, not what was asked for at the start:
            // with one machine picked, one more is enough
            if (emptyTitle && emptyNote) {
                var one = picked.length === 1;
                emptyTitle.textContent = one ? "Select one or more equipment" : "Select 2 or more equipment";
                emptyNote.textContent = one
                    ? "Add one more to generate the comparison."
                    : "Add at least two to generate the comparison.";
            }
            scroll.hidden = !enough;
            scroll.innerHTML = enough ? buildTable(machines) : "";
            if (enough) {
                scroll.scrollLeft = 0;
                markOverflow();
            }
        };

        // A fade at the right edge while there is more table to scroll to.
        // It hangs on the stage, not on the scroller: inside the scroller it
        // would count as content and give the table a screenful of empty
        // space below it.
        var markOverflow = function () {
            var more = scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft > 2;
            (stage || scroll).classList.toggle("has-more", more);
        };

        scroll.addEventListener("scroll", markOverflow, { passive: true });
        if (typeof ResizeObserver === "function") {
            new ResizeObserver(markOverflow).observe(scroll);
        }

        if (clear) {
            clear.addEventListener("click", function () {
                picked = [];
                render();
            });
        }

        // The arrows of the empty state start swinging the first time the card
        // is hovered anywhere at all, and keep swinging from then on — the
        // pointer only sets how far they reach, which is what lets them ease
        // home afterwards.
        root.addEventListener("pointerenter", function () {
            root.classList.add("is-breathing");
        }, { once: true });

        // clicks inside the comparison are its own — they never reach the card
        root.addEventListener("click", function (event) { event.stopPropagation(); });

        render();
    };

    document.querySelectorAll("[data-imb-compare]").forEach(initCard);
})();
