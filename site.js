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

  function onFirstView(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); cb(); }
    }, { threshold: 0.5 });
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

    if (reduced()) return;
    if (replay) replay.addEventListener('click', play);
    render(0);
    onFirstView(fig, play);
  }

  // The switch: two real states of one figure, chosen by the reader.
  function switcher(fig) {
    var buttons = fig.querySelectorAll('[data-set]');
    Array.prototype.forEach.call(buttons, function (button) {
      button.addEventListener('click', function () {
        fig.setAttribute('data-state', button.getAttribute('data-set'));
        Array.prototype.forEach.call(buttons, function (b) {
          b.setAttribute('aria-pressed', String(b === button));
        });
      });
    });
  }

  // Stages: all readable at rest; "Walk through it" moves a highlight one stage at a time.
  function steps(fig) {
    var items = fig.querySelectorAll('ol > li');
    var play = fig.querySelector('[data-steps-play]');
    var status = fig.querySelector('[data-steps-status]');
    var timer = 0;

    function show(i) {
      Array.prototype.forEach.call(items, function (li, k) { li.classList.toggle('is-current', k === i); });
      if (status && items[i]) {
        var parts = Array.prototype.map.call(items[i].children, function (c) { return c.textContent.trim(); });
        status.textContent = 'Stage ' + (i + 1) + ' of ' + items.length + ': ' + parts.join(': ');
      }
    }
    function walk() {
      clearTimeout(timer);
      var i = 0;
      play.textContent = 'Walking through';
      play.disabled = true;
      (function step() {
        show(i);
        i += 1;
        if (i < items.length) { timer = setTimeout(step, reduced() ? 0 : 1600); return; }
        timer = setTimeout(function () {
          play.textContent = 'Walk through it again';
          play.disabled = false;
        }, reduced() ? 0 : 1600);
      })();
    }

    Array.prototype.forEach.call(items, function (li, i) {
      li.addEventListener('mouseenter', function () { if (!play.disabled) show(i); });
    });
    play.hidden = false;
    play.addEventListener('click', walk);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-race]'), race);
  Array.prototype.forEach.call(document.querySelectorAll('[data-switch]'), switcher);
  Array.prototype.forEach.call(document.querySelectorAll('[data-steps]'), steps);
})();
