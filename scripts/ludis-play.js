// ludis-play.js — the LUDIS play board inside the LUDIS card on the home page.
//
// Drag from a player to draw its route. While dragging, the line is a live
// preview that follows the pointer; it stops at the edge of the court even if
// the pointer keeps going; releasing fixes it. Every route ends in one of the
// three tips, and takes a body at random from the ones the last route did not
// use, so no two drawn in a row look alike. A player keeps one line at a time
// — drawing a new one replaces its previous line and leaves the others
// untouched. Players never move.
//
// MC pulses gently while the board is untouched, to show where to start;
// the first drag (or an undo/redo) settles it for good.
//
// Drawn as SVG paths in the court's own coordinates (viewBox 635 × 449), so
// the lines scale with the card. Mouse, pen and touch via pointer events.
(function () {
    "use strict";

    var SVG_NS = "http://www.w3.org/2000/svg";

    // --- the players ------------------------------------------------------
    // Positions are in the court's viewBox. `shape` is "circle" or "square"
    // (a rounded square, as in the app).
    var PLAYERS = [
        { id: "mc", label: "MC", x: 150, y: 254, color: "#B388F9", shape: "circle" },
        { id: "pg", label: "PG", x: 245, y: 191, color: "#76B947", shape: "circle" },
        { id: "hp", label: "HP", x: 293, y: 304, color: "#0EA5E0", shape: "square" },
        { id: "vd", label: "VD", x: 401, y: 190, color: "#FF8A00", shape: "square" },
        { id: "bb", label: "BB", x: 478, y: 285, color: "#5B21B6", shape: "circle" }
    ];

    var PLAYER_SIZE = 37;   // diameter / side, in viewBox units
    var HIT_RADIUS = 30;    // generous touch target around each player
    var HINT_PLAYER = "mc"; // the one that pulses until the visitor draws

    // --- the court ----------------------------------------------------------
    // The inside edge of the touchlines in quadra-fundo.svg. Lines never
    // leave this rectangle, nor the part of it that the card shows.
    var COURT = { minX: 30, maxX: 605, minY: 30, maxY: 419 };

    // --- the lines ------------------------------------------------------------
    var STROKE_WIDTH = 3;             // the same for every line
    var STYLES = ["solid", "dashed", "dotted", "zigzag"];
    var TIPS = ["bar", "arrow", "dot"];   // every route ends in one of these
    var MIN_STEP = 3;                 // viewBox units between recorded points
    var MIN_LENGTH = 14;              // shorter than this on release = no line
    var MAX_POINTS = 800;

    var pick = function (list) {
        return list[Math.floor(Math.random() * list.length)];
    };

    var node = function (name, attrs) {
        var el = document.createElementNS(SVG_NS, name);
        Object.keys(attrs || {}).forEach(function (key) {
            el.setAttribute(key, attrs[key]);
        });
        return el;
    };

    var distance = function (a, b) {
        return Math.hypot(b.x - a.x, b.y - a.y);
    };

    var inside = function (p, box) {
        return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
    };

    // Where the segment a → b leaves the box. `a` is inside.
    var clipToBox = function (a, b, box) {
        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var t = 1;

        if (b.x < box.minX) { t = Math.min(t, (box.minX - a.x) / dx); }
        if (b.x > box.maxX) { t = Math.min(t, (box.maxX - a.x) / dx); }
        if (b.y < box.minY) { t = Math.min(t, (box.minY - a.y) / dy); }
        if (b.y > box.maxY) { t = Math.min(t, (box.maxY - a.y) / dy); }

        return { x: a.x + dx * t, y: a.y + dy * t };
    };

    // --- geometry for the path --------------------------------------------

    // Smooth curve through the recorded points (quadratic segments between
    // midpoints), so a hand-drawn route reads as a stroke, not a polyline.
    var smoothPath = function (points) {
        if (points.length < 3) {
            return "M" + points.map(function (p) { return p.x.toFixed(1) + " " + p.y.toFixed(1); }).join(" L");
        }

        var d = "M" + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
        for (var i = 1; i < points.length - 1; i++) {
            var mid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
            d += " Q" + points[i].x.toFixed(1) + " " + points[i].y.toFixed(1) + " " + mid.x.toFixed(1) + " " + mid.y.toFixed(1);
        }
        var last = points[points.length - 1];
        return d + " L" + last.x.toFixed(1) + " " + last.y.toFixed(1);
    };

    // Evenly spaced samples along the polyline.
    var resample = function (points, step) {
        var out = [points[0]];
        var carried = 0;

        for (var i = 1; i < points.length; i++) {
            var a = points[i - 1];
            var b = points[i];
            var length = distance(a, b);
            var at = step - carried;

            while (at <= length) {
                out.push({ x: a.x + (b.x - a.x) * (at / length), y: a.y + (b.y - a.y) * (at / length) });
                at += step;
            }
            carried = length - (at - step);
        }

        out.push(points[points.length - 1]);
        return out;
    };

    // Zig-zag along the route: samples pushed alternately to either side,
    // straight for a short stretch at both ends so it leaves the player and
    // meets the tip cleanly.
    var zigzagPath = function (points) {
        var samples = resample(points, 7);
        var amplitude = 4.5;

        return "M" + samples.map(function (p, i) {
            if (i < 2 || i > samples.length - 3) {
                return p.x.toFixed(1) + " " + p.y.toFixed(1);
            }
            var prev = samples[i - 1];
            var next = samples[i + 1];
            var dx = next.x - prev.x;
            var dy = next.y - prev.y;
            var len = Math.hypot(dx, dy) || 1;
            var side = i % 2 ? 1 : -1;
            return (p.x + (-dy / len) * amplitude * side).toFixed(1) + " " +
                   (p.y + (dx / len) * amplitude * side).toFixed(1);
        }).join(" L");
    };

    // Direction at the end of the route, measured over the last ~10 units.
    var endDirection = function (points) {
        var end = points[points.length - 1];
        for (var i = points.length - 2; i >= 0; i--) {
            if (distance(points[i], end) >= 10 || i === 0) {
                var dx = end.x - points[i].x;
                var dy = end.y - points[i].y;
                var len = Math.hypot(dx, dy) || 1;
                return { x: dx / len, y: dy / len };
            }
        }
        return { x: 1, y: 0 };
    };

    var routeLength = function (points) {
        var total = 0;
        for (var i = 1; i < points.length; i++) {
            total += distance(points[i - 1], points[i]);
        }
        return total;
    };

    // --- one line ------------------------------------------------------------

    var renderLine = function (line) {
        var group = line.group;
        var points = line.points;
        while (group.firstChild) {
            group.removeChild(group.firstChild);
        }
        if (points.length < 2) {
            return;
        }

        var path = node("path", {
            d: line.style === "zigzag" ? zigzagPath(points) : smoothPath(points),
            fill: "none",
            stroke: line.color,
            "stroke-width": STROKE_WIDTH,
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        });

        if (line.style === "dashed") {
            path.setAttribute("stroke-dasharray", "10 7");
        } else if (line.style === "dotted") {
            path.setAttribute("stroke-dasharray", "0.1 7.5");
        }
        group.appendChild(path);

        var end = points[points.length - 1];
        var dir = endDirection(points);

        if (line.tip === "arrow") {
            var size = 11;
            var spread = 0.55;   // radians, each side
            var wing = function (sign) {
                var angle = Math.atan2(-dir.y, -dir.x) + spread * sign;
                return (end.x + Math.cos(angle) * size).toFixed(1) + " " + (end.y + Math.sin(angle) * size).toFixed(1);
            };
            group.appendChild(node("path", {
                d: "M" + wing(1) + " L" + end.x.toFixed(1) + " " + end.y.toFixed(1) + " L" + wing(-1),
                fill: "none",
                stroke: line.color,
                "stroke-width": STROKE_WIDTH,
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
            }));
        } else if (line.tip === "dot") {
            group.appendChild(node("circle", {
                cx: end.x.toFixed(1), cy: end.y.toFixed(1), r: 5, fill: line.color
            }));
        } else if (line.tip === "bar") {
            // a short bar across the end of the route, as a play is drawn
            var reach = 7;
            group.appendChild(node("line", {
                x1: (end.x - dir.y * reach).toFixed(1),
                y1: (end.y + dir.x * reach).toFixed(1),
                x2: (end.x + dir.y * reach).toFixed(1),
                y2: (end.y - dir.x * reach).toFixed(1),
                stroke: line.color,
                "stroke-width": STROKE_WIDTH,
                "stroke-linecap": "round"
            }));
        }
    };

    // --- the board -------------------------------------------------------------

    var initBoard = function (root) {
        var svg = root.querySelector(".lp__board");
        var linesLayer = root.querySelector(".lp__lines");
        var playersLayer = root.querySelector(".lp__players");
        if (!svg || !linesLayer || !playersLayer) {
            return;
        }

        var fixed = {};      // player id → <g> of its current line

        // --- undo / redo --------------------------------------------------
        // Up to HISTORY_LIMIT steps each way. Each fixed line is a step: which
        // player, the line it replaced (or none) and the new line. Undo takes
        // strokes back, newest first; redo brings them back in order. Drawing
        // a new line clears what could be redone; past the limit, the oldest
        // step is forgotten.
        //
        // The buttons always look clickable (black). When there is nothing to
        // undo or redo, a click simply does nothing; assistive technology is
        // told through aria-disabled.
        var HISTORY_LIMIT = 6;
        var undoButton = root.querySelector("[data-lp-undo]");
        var redoButton = root.querySelector("[data-lp-redo]");
        var past = [];     // the last strokes, oldest first, at most HISTORY_LIMIT
        var future = [];   // undone strokes, most recently undone last

        var keepLast = function (list) {
            return list.length > HISTORY_LIMIT ? list.slice(list.length - HISTORY_LIMIT) : list;
        };

        var syncButtons = function () {
            if (undoButton) { undoButton.setAttribute("aria-disabled", past.length ? "false" : "true"); }
            if (redoButton) { redoButton.setAttribute("aria-disabled", future.length ? "false" : "true"); }
        };

        var show = function (playerId, group) {
            if (group) {
                linesLayer.appendChild(group);
                fixed[playerId] = group;
            } else {
                delete fixed[playerId];
            }
        };

        var record = function (step) {
            past = keepLast(past.concat(step));
            future = [];
            syncButtons();
        };

        var undo = function () {
            var step = past.pop();
            if (!step) { return; }
            step.after.remove();
            show(step.playerId, step.before);
            future = keepLast(future.concat(step));
            syncButtons();
        };

        var redo = function () {
            var step = future.pop();
            if (!step) { return; }
            if (step.before) { step.before.remove(); }
            show(step.playerId, step.after);
            past = keepLast(past.concat(step));
            syncButtons();
        };

        // The board pulses only until the visitor has done something with it.
        root.classList.add("is-idle");
        var settle = function () {
            root.classList.remove("is-idle");
        };

        if (undoButton) { undoButton.addEventListener("click", function () { settle(); undo(); }); }
        if (redoButton) { redoButton.addEventListener("click", function () { settle(); redo(); }); }
        syncButtons();

        var drawing = null;  // the line being drawn
        var frame = 0;

        // The body of a route is picked from the styles the last drawn route
        // did not use, so two in a row never look alike. Only a route that
        // was kept counts: a drag too short to leave a line was never seen.
        var lastStyle = null;

        var nextStyle = function () {
            return pick(STYLES.filter(function (style) { return style !== lastStyle; }));
        };

        PLAYERS.forEach(function (player) {
            var g = node("g", {
                class: "lp__player",
                "data-player": player.id,
                transform: "translate(" + player.x + " " + player.y + ")"
            });
            var body = node("g", { class: "lp__player-body" });
            var half = PLAYER_SIZE / 2;

            g.appendChild(node("circle", { class: "lp__hit", r: HIT_RADIUS }));
            if (player.id === HINT_PLAYER) {
                g.classList.add("is-hint");
                g.appendChild(node("circle", { class: "lp__pulse", r: half, stroke: player.color }));
            }
            body.appendChild(player.shape === "square"
                ? node("rect", { x: -half, y: -half, width: PLAYER_SIZE, height: PLAYER_SIZE, rx: 7, fill: player.color })
                : node("circle", { r: half, fill: player.color }));

            var label = node("text", { x: 0, y: 1 });
            label.textContent = player.label;
            body.appendChild(label);

            g.appendChild(body);
            playersLayer.appendChild(g);
        });

        var field = root.querySelector(".lp__field");

        var toBoard = function (event) {
            var matrix = svg.getScreenCTM();
            if (!matrix) {
                return null;
            }
            var point = svg.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            var p = point.matrixTransform(matrix.inverse());
            return { x: p.x, y: p.y };
        };

        // The court is cropped to fit the 16:9 card, so a line stops at
        // whichever comes first: the touchline, or the visible edge of the
        // field.
        var visibleCourt = function () {
            var rect = field ? field.getBoundingClientRect() : null;
            var topLeft = rect && toBoard({ clientX: rect.left, clientY: rect.top });
            var bottomRight = rect && toBoard({ clientX: rect.right, clientY: rect.bottom });
            if (!topLeft || !bottomRight) {
                return COURT;
            }
            return {
                minX: Math.max(COURT.minX, topLeft.x + 2),
                maxX: Math.min(COURT.maxX, bottomRight.x - 2),
                minY: Math.max(COURT.minY, topLeft.y + 2),
                maxY: Math.min(COURT.maxY, bottomRight.y - 2)
            };
        };

        // Line the toolbar's instruction up with the start of the court:
        // measure where the touchline lands inside the screen.
        var TOUCHLINE_X = 27.78;
        var alignHint = function () {
            var matrix = svg.getScreenCTM();
            if (!matrix) {
                return;
            }
            var point = svg.createSVGPoint();
            point.x = TOUCHLINE_X;
            point.y = 0;
            var left = point.matrixTransform(matrix).x - root.getBoundingClientRect().left;
            root.style.setProperty("--lp-court-left", Math.max(10, Math.round(left)) + "px");
        };

        alignHint();
        if (typeof ResizeObserver === "function") {
            new ResizeObserver(alignHint).observe(root);
        } else {
            window.addEventListener("resize", alignHint);
        }

        var schedule = function () {
            if (frame) {
                return;
            }
            frame = window.requestAnimationFrame(function () {
                frame = 0;
                if (drawing) {
                    renderLine(drawing);
                }
            });
        };

        var addPoint = function (p) {
            var points = drawing.points;
            var last = points[points.length - 1];

            if (drawing.stopped || distance(last, p) < MIN_STEP || points.length >= MAX_POINTS) {
                return;
            }

            if (inside(p, drawing.bounds)) {
                points.push(p);
            } else {
                // stop at the edge of the court, in the direction of travel
                points.push(clipToBox(last, p, drawing.bounds));
                drawing.stopped = true;
            }
            schedule();
        };

        var finish = function (commit) {
            if (!drawing) {
                return;
            }

            var line = drawing;
            var previous = fixed[line.playerId];
            drawing = null;
            if (frame) {
                window.cancelAnimationFrame(frame);
                frame = 0;
            }
            line.playerEl.classList.remove("is-drawing");
            root.classList.remove("is-drawing");

            if (commit && routeLength(line.points) >= MIN_LENGTH) {
                renderLine(line);
                if (previous) {
                    previous.remove();
                    previous.style.opacity = "";
                }
                fixed[line.playerId] = line.group;
                lastStyle = line.style;
                record({ playerId: line.playerId, before: previous || null, after: line.group });
            } else {
                line.group.remove();
                if (previous) {
                    previous.style.opacity = "";
                }
            }
        };

        svg.addEventListener("pointerdown", function (event) {
            var playerEl = event.target.closest && event.target.closest(".lp__player");
            if (!playerEl || drawing || (event.pointerType === "mouse" && event.button !== 0)) {
                return;
            }

            event.preventDefault();   // no text selection, no native drag
            settle();
            var player = PLAYERS.filter(function (p) { return p.id === playerEl.getAttribute("data-player"); })[0];

            drawing = {
                pointerId: event.pointerId,
                playerId: player.id,
                playerEl: playerEl,
                color: player.color,
                style: nextStyle(),
                tip: pick(TIPS),
                points: [{ x: player.x, y: player.y }],
                bounds: visibleCourt(),
                stopped: false,
                group: node("g", { class: "lp__line", "data-player": player.id })
            };

            // the player's previous line steps aside while the new one is drawn
            if (fixed[player.id]) {
                fixed[player.id].style.opacity = "0";
            }

            linesLayer.appendChild(drawing.group);
            playerEl.classList.add("is-drawing");
            root.classList.add("is-drawing");

            try { svg.setPointerCapture(event.pointerId); } catch (error) { /* older browsers */ }
        });

        svg.addEventListener("pointermove", function (event) {
            if (!drawing || event.pointerId !== drawing.pointerId) {
                return;
            }
            var events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
            (events.length ? events : [event]).forEach(function (e) {
                var p = toBoard(e);
                if (p) {
                    addPoint(p);
                }
            });
        });

        svg.addEventListener("pointerup", function (event) {
            if (drawing && event.pointerId === drawing.pointerId) {
                var p = toBoard(event);
                if (p) {
                    addPoint(p);
                }
                finish(true);
            }
        });

        svg.addEventListener("pointercancel", function (event) {
            if (drawing && event.pointerId === drawing.pointerId) {
                finish(false);
            }
        });

        // Clicks on the board are the board's own — they never reach the card.
        root.addEventListener("click", function (event) {
            event.stopPropagation();
        });
    };

    document.querySelectorAll("[data-ludis-play]").forEach(initBoard);
})();
