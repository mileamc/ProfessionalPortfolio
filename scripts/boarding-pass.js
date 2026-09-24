// boarding-pass.js — the card on the About page that asks where you are.
//
// Type a city, pick it off the list, and the stub works out how far that is
// from Curitiba and writes it on the arrivals board, where the next visitor
// will see it. Three outside things are involved, and nothing is asked of any
// of them until the card is near enough to the window to matter:
//
//   Nominatim (OpenStreetMap)  turns what was typed into a place with a
//                              latitude and a longitude. Asked at most once
//                              every 400ms of quiet, and never under three
//                              characters.
//   Supabase, over REST        reads the last eight check-ins, and writes
//                              this one. Plain fetch; no library needed.
//   Supabase, over a socket    tells every open page the moment a row lands.
//                              This is the one part that wants the client
//                              library, so it is imported on its own, late,
//                              and the board works without it if it never
//                              arrives — it just will not hear about other
//                              people's check-ins until the page is opened
//                              again.
//
// The key below is the project's publishable key. It is meant to be public:
// it can do exactly what the row level security policies in
// supabase/checkins.sql allow, which is read the board and add one row.

(function () {
    "use strict";

    var SUPABASE_URL = "https://seiuolaoyycdinvfzwoq.supabase.co";
    var SUPABASE_KEY = "sb_publishable_3GggLADFaZ4KsW8RhJffqQ_jmCq_ZV3";
    var SUPABASE_LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

    var HOME = { lat: -25.4284, lon: -49.2733 };   // Curitiba
    var ROWS = 8;                 // what the board's height holds
    var TYPING_PAUSE = 400;       // ms of quiet before the search goes out
    var MIN_QUERY = 3;            // characters before it goes out at all
    var BYE_AFTER = 3600;         // ms the distance is shown before the sign-off

    var card = document.querySelector("[data-boarding-pass]");
    if (!card) {
        return;
    }

    var el = function (name) { return card.querySelector("[data-bp-" + name + "]"); };

    var input = el("input");
    var menu  = el("menu");
    var error = el("error");
    var go    = el("go");
    var rows  = el("rows");
    var dots  = el("dots");
    var km    = el("km");
    var bye   = el("bye");
    var code  = el("code");
    var place = el("place");

    // --- the day on the stub ------------------------------------------------

    var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    (function stampToday() {
        var now = new Date();
        var stamp = now.getDate() + ". " + MONTHS[now.getMonth()] + "  " +
            String(now.getFullYear() % 100).padStart(2, "0");
        // twice: once where the drawing used to carry it, once for the phone,
        // which lays the stub out without the drawing
        el("date").textContent = stamp;
        el("date-2").textContent = stamp;
    }());


    // --- how far apart two points on the Earth are --------------------------
    //
    // The great-circle distance, by the haversine formula, on a sphere of
    // 6371km. It is the distance an aeroplane would fly if nothing were in
    // the way, which is the only distance a boarding pass could mean.

    var EARTH_KM = 6371;
    var rad = function (deg) { return deg * Math.PI / 180; };

    var distanceKm = function (from, to) {
        var dLat = rad(to.lat - from.lat);
        var dLon = rad(to.lon - from.lon);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };


    // --- names ---------------------------------------------------------------

    var group = function (n) { return Math.round(n).toLocaleString("en-US"); };

    // The three letters over the route. There is no airport in any of this —
    // Nominatim knows cities, not aerodromes — so the code is made from the
    // city's own name, accents taken off. It is a boarding pass, not a ticket.
    var codeFor = function (city) {
        var plain = city.normalize("NFD").replace(/[̀-ͯ]/g, "");
        var letters = plain.toUpperCase().replace(/[^A-Z]/g, "");
        return (letters.slice(0, 3) || "???").padEnd(3, "·");
    };

    // "20min", "1d" — the board's own shorthand
    var sinceThen = function (iso) {
        var seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
        if (seconds < 60)      { return "now"; }
        if (seconds < 3600)    { return Math.floor(seconds / 60) + "min"; }
        if (seconds < 86400)   { return Math.floor(seconds / 3600) + "h"; }
        if (seconds < 2592000) { return Math.floor(seconds / 86400) + "d"; }
        return Math.floor(seconds / 2592000) + "mo";
    };


    // --- the board -----------------------------------------------------------

    var board = [];        // newest first

    var emptyRow = function () {
        var li = document.createElement("li");
        li.className = "bp__row bp__row--empty";
        li.style.setProperty("--n", 0);
        li.textContent = "Nobody has landed yet — be the first.";
        return li;
    };

    var rowFor = function (entry, index, isNew) {
        var li = document.createElement("li");
        li.className = "bp__row" + (isNew ? " is-new" : "");
        li.style.setProperty("--n", index);
        li.dataset.at = entry.created_at;

        var origin = document.createElement("span");
        origin.textContent = entry.city + (entry.country ? ", " + entry.country : "");

        var far = document.createElement("span");
        far.textContent = group(entry.distance_km) + "km";

        var when = document.createElement("span");
        when.textContent = sinceThen(entry.created_at);

        li.append(origin, far, when);
        return li;
    };

    var drawBoard = function (newestId) {
        rows.textContent = "";
        if (!board.length) {
            rows.appendChild(emptyRow());
            return;
        }
        board.slice(0, ROWS).forEach(function (entry, index) {
            rows.appendChild(rowFor(entry, index, entry.id === newestId));
        });
    };

    // A row that is already on the board is not added again. The check-in you
    // made yourself arrives twice — once because you made it, once because the
    // socket says so — and this is where the second one stops.
    var addToBoard = function (entry) {
        if (!entry || board.some(function (row) { return row.id === entry.id; })) {
            return;
        }
        board.unshift(entry);
        board = board.slice(0, ROWS);
        drawBoard(entry.id);
    };

    // the times on the board go stale on their own
    window.setInterval(function () {
        [].forEach.call(rows.querySelectorAll("[data-at]"), function (li) {
            li.lastElementChild.textContent = sinceThen(li.dataset.at);
        });
    }, 30000);


    // --- Supabase, over REST -------------------------------------------------

    var rest = function (path, options) {
        var settings = options || {};
        return window.fetch(SUPABASE_URL + "/rest/v1/" + path, {
            method: settings.method || "GET",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": "Bearer " + SUPABASE_KEY,
                "Content-Type": "application/json",
                "Prefer": settings.prefer || "return=representation"
            },
            body: settings.body ? JSON.stringify(settings.body) : undefined
        }).then(function (response) {
            if (!response.ok) {
                return response.text().then(function (text) {
                    throw new Error(response.status + " " + text);
                });
            }
            return response.json();
        });
    };

    var loadBoard = function () {
        return rest("checkins?select=id,city,country,distance_km,distance_miles,created_at" +
                    "&order=created_at.desc&limit=" + ROWS)
            .then(function (data) {
                board = data;
                drawBoard();
            })
            .catch(function (reason) {
                window.console.warn("boarding pass: the board could not be read.", reason);
                drawBoard();      // the friendly empty row rather than nothing
            });
    };


    // --- Supabase, over a socket ---------------------------------------------
    //
    // The only part that needs the client library, and the only part the card
    // can do without. If the module does not arrive, everything else still
    // works; the board simply stops hearing about other people's check-ins.

    var listen = function () {
        import(SUPABASE_LIB).then(function (mod) {
            var client = mod.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: { persistSession: false },
                realtime: { params: { eventsPerSecond: 2 } }
            });
            client.channel("checkins-board")
                .on("postgres_changes",
                    { event: "INSERT", schema: "public", table: "checkins" },
                    function (payload) { addToBoard(payload.new); })
                .subscribe();
        }).catch(function (reason) {
            window.console.warn("boarding pass: live updates are off.", reason);
        });
    };


    // --- looking a city up ----------------------------------------------------

    var chosen = null;          // the place the field is currently agreed on
    var options = [];
    var active = -1;
    var pending = null;         // the request in the air, so it can be dropped
    var timer = null;

    var say = function (message) {
        error.textContent = message || "";
        error.hidden = !message;
    };

    var closeMenu = function () {
        menu.hidden = true;
        input.setAttribute("aria-expanded", "false");
        active = -1;
    };

    var settle = function (found) {
        chosen = found;
        go.disabled = !found;
        if (found) {
            say("");
        }
    };

    // What Nominatim hands back is a place of some kind; a city is what is
    // wanted. The name is the first part of the display name, the country the
    // last, and anything without both is not offered.
    var tidy = function (result) {
        var parts = (result.display_name || "").split(",").map(function (s) { return s.trim(); });
        if (parts.length < 2) {
            return null;
        }
        var country = parts[parts.length - 1];
        var region = parts.length > 2 ? parts.slice(1, -1).join(", ") : "";
        return {
            city: parts[0].slice(0, 80),
            country: country.slice(0, 80),
            region: region,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
        };
    };

    var showOptions = function (list) {
        options = list;
        menu.textContent = "";

        if (!list.length) {
            closeMenu();
            return;
        }

        list.forEach(function (found, index) {
            var li = document.createElement("li");
            li.className = "bp__option";
            li.id = "bp-option-" + index;
            li.setAttribute("role", "option");
            li.setAttribute("aria-selected", "false");
            li.textContent = found.city;

            var under = document.createElement("small");
            under.textContent = [found.region, found.country].filter(Boolean).join(", ");
            li.appendChild(under);

            li.addEventListener("mousedown", function (event) {
                event.preventDefault();     // keep the field's focus
                pick(index);
            });
            menu.appendChild(li);
        });

        menu.hidden = false;
        input.setAttribute("aria-expanded", "true");
        highlight(0);
    };

    var highlight = function (index) {
        var items = menu.children;
        if (active >= 0 && items[active]) {
            items[active].setAttribute("aria-selected", "false");
        }
        active = Math.max(0, Math.min(index, items.length - 1));
        if (items[active]) {
            items[active].setAttribute("aria-selected", "true");
            input.setAttribute("aria-activedescendant", items[active].id);
            items[active].scrollIntoView({ block: "nearest" });
        }
    };

    var pick = function (index) {
        var found = options[index];
        if (!found) {
            return;
        }
        input.value = found.city + ", " + found.country;
        settle(found);
        closeMenu();
    };

    var search = function (query) {
        if (pending) {
            pending.abort();
        }
        pending = new window.AbortController();

        var url = "https://nominatim.openstreetmap.org/search" +
            "?q=" + encodeURIComponent(query) +
            "&format=jsonv2&limit=6&accept-language=en&addressdetails=0";

        window.fetch(url, { signal: pending.signal })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                var list = data.map(tidy).filter(Boolean).slice(0, 6);
                showOptions(list);
                if (!list.length) {
                    say("No such place — try the city on its own.");
                }
            })
            .catch(function (reason) {
                if (reason.name !== "AbortError") {
                    window.console.warn("boarding pass: the city search failed.", reason);
                    say("The map service is not answering. Try again in a moment.");
                }
            });
    };

    input.addEventListener("input", function () {
        settle(null);
        say("");
        window.clearTimeout(timer);

        var query = input.value.trim();
        if (query.length < MIN_QUERY) {
            closeMenu();
            return;
        }
        timer = window.setTimeout(function () { search(query); }, TYPING_PAUSE);
    });

    input.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" && !menu.hidden) {
            event.preventDefault();
            highlight(active + 1);
        } else if (event.key === "ArrowUp" && !menu.hidden) {
            event.preventDefault();
            highlight(active - 1);
        } else if (event.key === "Escape") {
            closeMenu();
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (!menu.hidden && active >= 0) {
                pick(active);
            } else if (chosen) {
                checkIn();
            } else {
                say("Pick a city from the list first.");
            }
        }
    });

    input.addEventListener("blur", function () {
        window.setTimeout(closeMenu, 120);
    });


    // --- checking in ----------------------------------------------------------

    var swap = function (show) {
        [dots, km, bye].forEach(function (one) { one.hidden = one !== show; });
    };

    var byeTimer = null;

    var checkIn = function () {
        if (!chosen) {
            say("Pick a city from the list first.");
            return;
        }

        var far = distanceKm(chosen, HOME);
        var entry = {
            city: chosen.city,
            country: chosen.country,
            distance_km: Math.round(far),
            distance_miles: Math.round(far * 0.621371)
        };

        // the stub answers first, whatever the network does next
        km.innerHTML = group(entry.distance_km) + "km" +
            '<small class="bp__miles">AKA ' + group(entry.distance_miles) + " miles</small>";
        swap(km);

        code.textContent = codeFor(chosen.city);
        place.textContent = chosen.country;

        card.classList.remove("is-arrived");
        void card.offsetWidth;              // so the plane flies again on a second go
        card.classList.add("is-arrived");

        go.disabled = true;
        input.disabled = true;

        window.clearTimeout(byeTimer);
        byeTimer = window.setTimeout(function () { swap(bye); }, BYE_AFTER);

        rest("checkins", { method: "POST", body: entry })
            .then(function (written) { addToBoard(written[0]); })
            .catch(function (reason) {
                window.console.warn("boarding pass: the check-in was not recorded.", reason);
                say("You are checked in, but the board did not take it down.");
            });
    };

    go.addEventListener("click", checkIn);


    // --- nothing happens until the card is worth it ---------------------------

    var start = function () {
        loadBoard().then(listen);
    };

    if (window.IntersectionObserver) {
        var watcher = new window.IntersectionObserver(function (entries) {
            if (entries.some(function (e) { return e.isIntersecting; })) {
                watcher.disconnect();
                start();
            }
        }, { rootMargin: "400px" });
        watcher.observe(card);
    } else {
        start();
    }
}());
