// Progressive enhancement for the portfolio's figures. Every figure is complete in the
// HTML; this script only animates or switches what is already there. Under reduced
// motion nothing moves: the race skips to its result and stages highlight instantly.
(function () {
  'use strict';

  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(reduceQuery && reduceQuery.matches); }

  // requestAnimationFrame with a timer fallback, so a paused tab still reaches the end state.
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
    return function () { done = true; cancelAnimationFrame(raf); clearTimeout(timer); };
  }

  function clockText(minutes) {
    var m = Math.round(minutes);
    var h = Math.floor(m / 60);
    var r = m % 60;
    var nb = ' ';
    return h ? h + nb + 'h' + nb + (r < 10 ? '0' : '') + r + nb + 'm' : r + nb + 'm';
  }

  // Fires once the element is half visible, or fills most of a short or zoomed viewport,
  // with a fallback so a figure never stays at its start frame.
  function onFirstView(el, cb) {
    var fired = false;
    function fire() { if (fired) return; fired = true; if (io) io.disconnect(); clearTimeout(fallback); cb(); }
    if (!('IntersectionObserver' in window)) { fire(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= window.innerHeight * 0.9) fire();
      });
    }, { threshold: [0, 0.25, 0.5, 0.75] });
    var fallback = setTimeout(fire, 12000);
    io.observe(el);
  }

  // The race: both runs fill on one clock, so the shorter run visibly finishes first.
  // The longest run takes 6 seconds of animation however long it is in real time.
  function race(fig) {
    var rows = Array.prototype.map.call(fig.querySelectorAll('[data-minutes]'), function (row) {
      return {
        minutes: parseFloat(row.getAttribute('data-minutes')),
        fill: row.querySelector('.run-fill'),
        clock: row.querySelector('[data-clock]'),
        final: row.querySelector('[data-clock]').textContent
      };
    });
    var replay = fig.querySelector('[data-race-replay]');
    var longest = Math.max.apply(null, rows.map(function (r) { return r.minutes; }));
    var seconds = 6;
    var cancel = function () {};

    function render(elapsedMinutes) {
      rows.forEach(function (r) {
        var m = Math.min(r.minutes, elapsedMinutes);
        r.fill.style.setProperty('--share', (m / longest).toFixed(4));
        r.clock.textContent = m >= r.minutes ? r.final : clockText(m);
      });
    }
    function play() {
      cancel();
      if (replay) replay.hidden = true;
      var t0 = performance.now();
      (function frame(now) {
        var minutes = (now - t0) / 1000 / seconds * longest;
        render(minutes);
        if (minutes < longest) { cancel = nextFrame(frame); return; }
        if (replay) replay.hidden = false;
      })(t0);
    }

    // The HTML shows the final result; it resets to zero only as the race starts,
    // so a quick glance or a link preview never shows a half-run clock.
    if (reduced()) return;
    if (replay) replay.addEventListener('click', play);
    onFirstView(fig, play);
  }

  // The switch: two real states of one figure. It flips between them on its own every
  // few seconds while on screen; hover or focus pauses it, and a click hands control
  // to the reader for good. With motion reduced it never flips on its own.
  function switcher(fig) {
    var buttons = Array.prototype.slice.call(fig.querySelectorAll('[data-set]'));
    var live = fig.querySelector('[aria-live]');
    var every = 3500;
    var timer = 0;
    var userControlled = false;
    var hovered = false;
    var focused = false;
    var onScreen = false;

    function show(state) {
      fig.setAttribute('data-state', state);
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set') === state)); });
    }
    function schedule() {
      clearTimeout(timer);
      if (userControlled || hovered || focused || !onScreen) return;
      timer = setTimeout(function () {
        var current = buttons.map(function (b) { return b.getAttribute('data-set'); }).indexOf(fig.getAttribute('data-state'));
        show(buttons[(current + 1) % buttons.length].getAttribute('data-set'));
        schedule();
      }, every);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        userControlled = true;
        clearTimeout(timer);
        if (live) live.setAttribute('aria-live', 'polite');
        show(button.getAttribute('data-set'));
      });
    });

    if (reduced() || !('IntersectionObserver' in window)) return;
    // Automatic flips are not announced; only a reader's own choice is.
    if (live) live.setAttribute('aria-live', 'off');
    fig.addEventListener('mouseenter', function () { hovered = true; schedule(); });
    fig.addEventListener('mouseleave', function () { hovered = false; schedule(); });
    fig.addEventListener('focusin', function () { focused = true; schedule(); });
    fig.addEventListener('focusout', function () { focused = false; schedule(); });
    new IntersectionObserver(function (entries) {
      onScreen = entries[entries.length - 1].isIntersecting;
      schedule();
    }, { threshold: 0.5 }).observe(fig);
  }

  // Stages: all readable at rest; "Walk through it" moves a highlight one stage at a time.
  function steps(fig) {
    var items = fig.querySelectorAll('ol > li');
    var play = fig.querySelector('[data-steps-play]');
    var status = fig.querySelector('[data-steps-status]');
    var timer = 0;

    var walking = false;
    function show(i, announce) {
      Array.prototype.forEach.call(items, function (li, k) { li.classList.toggle('is-current', k === i); });
      if (announce && status && items[i]) {
        var first = items[i].firstElementChild || items[i];
        status.textContent = 'Stage ' + (i + 1) + ' of ' + items.length + ': ' + first.textContent.trim();
      }
    }
    // While walking, the button stays focusable (aria-disabled), so keyboard focus is not lost.
    function walk() {
      if (walking) return;
      clearTimeout(timer);
      walking = true;
      var i = 0;
      play.textContent = 'Walking through';
      play.setAttribute('aria-disabled', 'true');
      (function step() {
        show(i, true);
        i += 1;
        if (i < items.length) { timer = setTimeout(step, reduced() ? 0 : 1600); return; }
        timer = setTimeout(function () {
          walking = false;
          play.textContent = 'Walk through it again';
          play.removeAttribute('aria-disabled');
        }, reduced() ? 0 : 1600);
      })();
    }

    Array.prototype.forEach.call(items, function (li, i) {
      li.addEventListener('mouseenter', function () { if (!walking) show(i, false); });
      li.addEventListener('mouseleave', function () { if (!walking) li.classList.remove('is-current'); });
    });
    play.hidden = false;
    play.addEventListener('click', walk);
  }

  // Ambient vignettes: click or tap the art to pause it (no visible button), and no
  // motion while off-screen. The art only becomes a control when motion is allowed.
  function ambient(fig) {
    var art = fig.querySelector('[data-ambient-toggle]');
    var userPaused = false;
    var onScreen = true;
    // A toggle keeps one fixed name; only its pressed state changes.
    function apply() {
      fig.classList.toggle('is-paused', userPaused || !onScreen);
      fig.classList.toggle('is-user-paused', userPaused);
      if (art) art.setAttribute('aria-pressed', String(userPaused));
      fig.dispatchEvent(new CustomEvent('ambientchange'));
    }
    function toggle() { userPaused = !userPaused; apply(); }
    if (reduced()) return;
    if (art) {
      art.setAttribute('role', 'button');
      art.setAttribute('tabindex', '0');
      art.setAttribute('aria-label', 'Pause the animation');
      art.addEventListener('click', toggle);
      art.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
      });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        apply();
      }).observe(fig);
    }
    apply();
  }

  // The check line: records rise through it and get their verdict as they cross.
  // Without script, or with motion reduced, every record simply shows its verdict.
  function checkLine(fig) {
    if (reduced()) return;
    var stream = fig.querySelector('.v-check-stream');
    var windowEl = fig.querySelector('.v-check');
    var count = fig.querySelector('[data-check-count]');
    var originals = Array.prototype.slice.call(stream.children);
    originals.forEach(function (li) { stream.appendChild(li.cloneNode(true)); });
    var items = Array.prototype.slice.call(stream.children);
    items.forEach(function (li) { li.classList.remove('is-pass', 'is-fail'); li.judged = false; });
    var rowHeight = items[0].offsetHeight || 22;
    var half = rowHeight * originals.length;
    var speed = 18; // pixels per second
    var offset = 0;
    var passed = 0;
    var held = 0;
    var last = performance.now();
    var running = false;
    if (count) count.hidden = false;

    // The loop sleeps while the figure is paused, off-screen or in a background tab.
    function idle() { return fig.classList.contains('is-paused') || document.hidden; }
    function start() {
      if (running || idle()) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
    fig.addEventListener('ambientchange', start);
    document.addEventListener('visibilitychange', start);

    function frame(now) {
      if (idle()) { running = false; return; }
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      {
        offset = (offset + speed * dt) % half;
        // The list is doubled, so shifting by its own height loops without a seam.
        stream.style.transform = 'translateY(' + (-offset).toFixed(1) + 'px)';
        var line = windowEl.clientHeight / 2;
        var shift = -offset;
        items.forEach(function (li, i) {
          var y = i * rowHeight + shift + rowHeight / 2;
          var crossed = y < line;
          if (crossed && !li.judged) {
            li.judged = true;
            var ok = li.getAttribute('data-ok') === '1';
            li.classList.add(ok ? 'is-pass' : 'is-fail');
            if (ok) passed += 1; else held += 1;
          } else if (!crossed && li.judged && y > line + rowHeight) {
            li.judged = false;
            li.classList.remove('is-pass', 'is-fail');
          }
        });
        if (count) count.textContent = passed + ' passed, ' + held + ' held back';
      }
      requestAnimationFrame(frame);
    }
    start();
  }

  // Phone menu: closes on Escape (focus returns to Menu), on choosing a link, and on a click outside.
  Array.prototype.forEach.call(document.querySelectorAll('details.nav-menu'), function (menu) {
    var summary = menu.querySelector('summary');
    menu.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.open) { menu.open = false; summary.focus(); }
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) menu.open = false;
    });
    document.addEventListener('click', function (event) {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-ambient]'), ambient);
  Array.prototype.forEach.call(document.querySelectorAll('[data-check]'), checkLine);
  Array.prototype.forEach.call(document.querySelectorAll('[data-race]'), race);
  Array.prototype.forEach.call(document.querySelectorAll('[data-switch]'), switcher);
  Array.prototype.forEach.call(document.querySelectorAll('[data-steps]'), steps);
})();
