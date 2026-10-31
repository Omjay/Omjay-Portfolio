// Explanatory motion for the portfolio. Static file, no dependencies.
// Each piece is a pure render(t) over a fixed duration: it plays once when it
// scrolls into view, ends on a readable final state, and can be replayed.
// Visitors who prefer reduced motion see the final state immediately.
(function () {
  'use strict';

  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(reduceQuery && reduceQuery.matches); }

  // cubic-bezier(0.16, 1, 0.3, 1), the entrance curve from DESIGN.md.
  function bezier(x1, y1, x2, y2) {
    function a(p1, p2) { return 1 - 3 * p2 + 3 * p1; }
    function b(p1, p2) { return 3 * p2 - 6 * p1; }
    function c(p1) { return 3 * p1; }
    function at(t, p1, p2) { return ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t; }
    function slope(t, p1, p2) { return 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1); }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var t = x;
      for (var i = 0; i < 8; i++) {
        var d = slope(t, x1, x2);
        if (Math.abs(d) < 1e-6) break;
        t -= (at(t, x1, x2) - x) / d;
      }
      return at(Math.min(1, Math.max(0, t)), y1, y2);
    };
  }
  var easeOut = bezier(0.16, 1, 0.3, 1);
  var easeInOut = bezier(0.65, 0, 0.35, 1);

  // requestAnimationFrame with a timer fallback: hidden or embedded views can
  // pause rAF, and every animation must still reach its final frame.
  function nextFrame(cb) {
    var done = false;
    function run() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      cb(performance.now());
    }
    var raf = requestAnimationFrame(run);
    var timer = setTimeout(run, 50);
    return function cancel() { done = true; cancelAnimationFrame(raf); clearTimeout(timer); };
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function prog(t, t0, t1, ease) { var p = clamp((t - t0) / (t1 - t0)); return ease ? ease(p) : p; }

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function card(key, heading, label, extraClass) {
    var root = el('figure', 'pm-card' + (extraClass ? ' ' + extraClass : ''));
    root.setAttribute('data-pm-piece', key);
    root.setAttribute('data-pm-heading', heading);
    var head = el('div', 'pm-head');
    head.appendChild(el('figcaption', 'pm-label', label));
    var replay = el('button', 'pm-replay', 'Replay ↻');
    replay.type = 'button';
    replay.hidden = true;
    head.appendChild(replay);
    root.appendChild(head);
    return { root: root, replay: replay };
  }

  // Runs a piece: render(0) now, play on first view, settle on render(duration).
  function animate(piece) {
    var cancel = function () {};
    var started = false;
    function finish() {
      cancel();
      piece.render(piece.duration);
      piece.replay.hidden = reduced();
    }
    function play() {
      started = true;
      if (reduced()) { finish(); return; }
      piece.replay.hidden = true;
      cancel();
      var t0 = performance.now();
      (function frame(now) {
        var t = (now - t0) / 1000;
        if (t >= piece.duration) { finish(); return; }
        piece.render(t);
        cancel = nextFrame(frame);
      })(t0);
    }
    piece.replay.addEventListener('click', play);
    if (reduced() || !('IntersectionObserver' in window)) { finish(); return; }
    piece.render(0);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !started) { io.disconnect(); play(); }
      });
    }, { threshold: 0.45 });
    io.observe(piece.root);
  }

  function minutes(m) {
    m = Math.round(m);
    var h = Math.floor(m / 60);
    var r = m % 60;
    return h ? h + 'h ' + (r < 10 ? '0' : '') + r + 'm' : r + 'm';
  }

  // Azimuth GRC: legacy SQL procedures rebuilt as a medallion Lakehouse.
  function medallion(heading) {
    var c = card('medallion', heading, 'Lakehouse flow · legacy SQL to Gold');
    var stages = [
      ['Legacy SQL', 'procedures'],
      ['Bronze', 'raw Delta'],
      ['Silver', 'validated'],
      ['Gold', 'star schema'],
      ['Tableau', 'dashboards']
    ];
    var flow = el('div', 'pm-flow');
    flow.setAttribute('aria-hidden', 'true');
    var nodes = [];
    var links = [];
    stages.forEach(function (s, i) {
      if (i) {
        var link = el('div', 'pm-link', '<i></i><i class="pm-dot"></i><i class="pm-dot"></i><i class="pm-dot"></i>');
        links.push({ el: link, dots: link.querySelectorAll('.pm-dot') });
        flow.appendChild(link);
      }
      var node = el('div', 'pm-node', '<strong>' + s[0] + '</strong><span>' + s[1] + '</span>');
      nodes.push(node);
      flow.appendChild(node);
    });
    c.root.appendChild(flow);

    var stats = el('div', 'pm-stats');
    stats.innerHTML =
      '<div class="pm-stat"><b data-to="65">65%</b><span>faster Gold-layer queries across 50M+ records</span></div>' +
      '<div class="pm-stat"><b data-to="30">30%</b><span>smaller storage footprint after compaction and vacuuming</span></div>';
    c.root.appendChild(stats);
    c.root.appendChild(el('p', 'pm-sr', 'Legacy SQL procedures were rebuilt in PySpark as Bronze, Silver and Gold Delta layers feeding Tableau dashboards. The Gold star schema made queries 65% faster across 50M+ records, and compaction and vacuuming cut storage by 30%.'));
    var statEls = stats.querySelectorAll('.pm-stat');

    var step = 0.85;
    var travel = 0.65;
    var statsAt = 0.3 + (stages.length - 1) * step + 0.35;

    return {
      root: c.root,
      replay: c.replay,
      duration: statsAt + 0.25 + 1.2,
      render: function (t) {
        nodes.forEach(function (node, i) {
          node.classList.toggle('is-on', t >= 0.3 + i * step);
        });
        links.forEach(function (link, i) {
          var start = 0.3 + i * step + 0.12;
          var p = prog(t, start, start + travel, easeInOut);
          link.el.style.setProperty('--p', p.toFixed(4));
          Array.prototype.forEach.call(link.dots, function (dot, k) {
            var d = prog(t, start + k * 0.1, start + k * 0.1 + travel * 0.75);
            dot.style.setProperty('--d', d.toFixed(4));
            dot.style.opacity = d > 0 && d < 1 ? '1' : '0';
          });
        });
        Array.prototype.forEach.call(statEls, function (stat, i) {
          var s = statsAt + i * 0.25;
          var p = prog(t, s, s + 0.6, easeOut);
          stat.style.opacity = p.toFixed(3);
          stat.style.transform = 'translateY(' + ((1 - p) * 6).toFixed(2) + 'px)';
          var num = stat.querySelector('b');
          var to = +num.getAttribute('data-to');
          num.textContent = Math.round(to * prog(t, s, s + 1.0, easeOut)) + '%';
        });
      }
    };
  }

  // ExaQube: one oversized partition holds the whole stage; rebalanced, every task ends together.
  function skew(heading) {
    var c = card('skew', heading, 'Data skew · illustrative stage, 8 tasks');
    var SCALE = 110; // minutes on the shared time axis
    var runs = [
      { cls: 'pm-run--before', title: 'Before · one skewed partition', total: 110,
        tasks: [22, 25, 19, 27, 23, 26, 21, 110] },
      { cls: 'pm-run--after', title: 'After · rebalanced, on job clusters', total: 30,
        tasks: [27, 30, 28, 29, 30, 27, 29, 30] }
    ];
    var wrap = el('div', 'pm-runs');
    wrap.setAttribute('aria-hidden', 'true');
    runs.forEach(function (run) {
      var box = el('div', 'pm-run ' + run.cls);
      box.innerHTML = '<div class="pm-run-head"><span class="pm-run-title">' + run.title + '</span><span class="pm-clock">0m</span></div>';
      var tasks = el('div', 'pm-tasks');
      run.tasks.forEach(function (m) {
        var straggler = m === SCALE && run.total === SCALE;
        tasks.appendChild(el('div', 'pm-task' + (straggler ? ' pm-task--straggler' : ''), '<i></i>'));
      });
      tasks.appendChild(el('div', 'pm-sweep'));
      box.appendChild(tasks);
      box.appendChild(el('div', 'pm-axis', '<span>0</span><span>1h 50m</span>'));
      run.el = box;
      run.bars = tasks.querySelectorAll('.pm-task i');
      run.sweep = tasks.querySelector('.pm-sweep');
      run.clock = box.querySelector('.pm-clock');
      wrap.appendChild(box);
    });
    c.root.appendChild(wrap);
    c.root.appendChild(el('p', 'pm-note', 'Task lengths are illustrative. The real result: the thrice-daily pipeline went from ~1h 50m to ~30m per run after the skew fix and the move to job clusters.'));
    c.root.appendChild(el('p', 'pm-sr', 'Before the fix, one oversized partition kept a Spark stage running for about 1 hour 50 minutes while the other tasks finished early. After rebalancing, all tasks finished together in about 30 minutes.'));

    var speed = 3.3 / SCALE; // seconds of animation per minute of runtime
    runs[0].start = 0.3;
    runs[1].start = runs[0].start + runs[0].total * speed + 0.9;
    var end = runs[1].start + runs[1].total * speed;

    return {
      root: c.root,
      replay: c.replay,
      duration: end + 1.0,
      render: function (t) {
        runs.forEach(function (run) {
          var clock = Math.min(run.total, Math.max(0, (t - run.start) / speed));
          Array.prototype.forEach.call(run.bars, function (bar, i) {
            bar.style.setProperty('--w', (Math.min(clock, run.tasks[i]) / SCALE).toFixed(4));
          });
          var running = t >= run.start && clock < run.total;
          run.sweep.style.setProperty('--s', (clock / SCALE).toFixed(4));
          run.sweep.style.opacity = running ? '0.5' : '0';
          run.clock.textContent = minutes(clock);
          run.el.classList.toggle('is-done', clock >= run.total);
        });
      }
    };
  }

  // Azimuth GRC: the Liquid Clustering change, typed out.
  function terminal(heading) {
    var c = card('liquid', heading, 'Liquid Clustering · Databricks SQL', 'pm-card--term');
    var code = el('pre', 'pm-code');
    code.setAttribute('aria-hidden', 'true');
    c.root.appendChild(code);
    c.root.appendChild(el('p', 'pm-note', 'Table and column names are simplified for illustration.'));
    c.root.appendChild(el('p', 'pm-sr', 'Liquid Clustering was applied to the 500M+ record Delta tables with ALTER TABLE CLUSTER BY and OPTIMIZE, cutting pipeline runtime from 6 hours to 30 minutes.'));

    // Segments: [class, text]. Typed segments appear a character at a time.
    var typed = [
      ['pm-kw', 'ALTER TABLE'], ['', ' silver.compliance_records\n  '],
      ['pm-kw', 'CLUSTER BY'], ['', ' (entity_id, record_date);\n'],
      ['pm-kw', 'OPTIMIZE'], ['', ' silver.compliance_records;\n']
    ];
    var chars = typed.reduce(function (n, s) { return n + s[1].length; }, 0);
    var cps = 0.03;
    var typeStart = 0.3;
    var typeEnd = typeStart + chars * cps;
    var out1 = typeEnd + 0.45;
    var out2 = out1 + 0.25;
    var roll = [out2, out2 + 1.1];

    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

    return {
      root: c.root,
      replay: c.replay,
      duration: roll[1] + 1.2,
      render: function (t) {
        var shown = Math.floor(clamp((t - typeStart) / (typeEnd - typeStart)) * chars);
        var html = '';
        var left = shown;
        typed.forEach(function (s) {
          if (left <= 0) return;
          var part = s[1].slice(0, left);
          left -= part.length;
          html += s[0] ? '<span class="' + s[0] + '">' + esc(part) + '</span>' : esc(part);
        });
        if (t < typeEnd + 0.2) html += '<span class="pm-caret"></span>';
        if (t >= out1) html += '\n<span class="pm-ok">✓</span> <span class="pm-cm">500M+ records clustered</span>';
        if (t >= out2) {
          var m = 360 - (360 - 30) * prog(t, roll[0], roll[1], easeOut);
          html += '\n<span class="pm-ok">✓</span> <span class="pm-cm">pipeline runtime</span>  <span class="pm-big">6h 00m → ' + minutes(m) + '</span>';
        }
        code.innerHTML = html;
      }
    };
  }

  var PIECES = [
    { heading: 'Architectural Migration & Lakehouse Transition', build: medallion },
    { heading: 'High-Volume Performance & Governance', build: terminal },
    { heading: 'Spark performance tuning', build: skew }
  ];

  function headingOf(article) {
    var h = article && article.querySelector('h2');
    return h ? h.textContent.trim() : '';
  }

  function sync() {
    // React reuses article elements between company pages, so drop pieces whose project changed.
    Array.prototype.forEach.call(document.querySelectorAll('[data-pm-piece]'), function (node) {
      if (headingOf(node.parentElement) !== node.getAttribute('data-pm-heading')) node.remove();
    });
    Array.prototype.forEach.call(document.querySelectorAll('main article > h2'), function (h) {
      var text = h.textContent.trim();
      var spec = PIECES.filter(function (p) { return p.heading === text; })[0];
      var article = h.parentElement;
      if (!spec || article.querySelector(':scope > [data-pm-piece]')) return;
      var piece = spec.build(text);
      var list = article.querySelector(':scope > ul');
      if (list) list.after(piece.root); else article.appendChild(piece.root);
      animate(piece);
    });
    countHero();
  }

  // Homepage impact numbers roll up once per page load.
  var heroDone = false;
  function countHero() {
    if (heroDone) return;
    var cards = document.querySelectorAll('.portfolio-impact-card');
    if (!cards.length) return;
    heroDone = true;
    if (reduced() || document.visibilityState !== 'visible') return;
    Array.prototype.forEach.call(cards, function (cardEl, i) {
      var num = Array.prototype.filter.call(cardEl.children, function (c) {
        return /^\d+%$/.test(c.textContent.trim());
      })[0];
      var text = num && num.firstChild;
      if (!text || text.nodeType !== 3) return;
      var to = parseInt(text.nodeValue, 10);
      num.classList.add('pm-count');
      text.nodeValue = '0%';
      var delay = 0.15 + i * 0.15;
      var t0 = performance.now();
      (function frame(now) {
        var p = prog((now - t0) / 1000, delay, delay + 1.1, easeOut);
        text.nodeValue = Math.round(to * p) + '%';
        if (p < 1) nextFrame(frame);
      })(t0);
    });
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    // A timer, not requestAnimationFrame: background tabs pause rAF.
    setTimeout(function () { queued = false; sync(); }, 30);
  }

  // Ignore the pieces' own frame-by-frame updates; react only to page changes.
  new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var target = records[i].target;
      if (!(target.closest && target.closest('[data-pm-piece]'))) { schedule(); return; }
    }
  }).observe(document, { childList: true, subtree: true });
  schedule();
})();
