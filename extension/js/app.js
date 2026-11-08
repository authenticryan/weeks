/* Weeks: new tab page. Depends on Life (life.js) and Store (store.js). */
(function () {
  'use strict';

  var WPR = Life.WEEKS_PER_ROW;
  var DEFAULTS = { birth: '', years: 80, weekStart: 0 };
  var MAX_RULE = 140;
  var PLACEHOLDERS = ['In bed by 11 pm.', 'Up by 8 am.', 'The people I love get my best.'];

  // Must match styles.css
  var BREAKPOINT = 900;
  var RAIL_W = 280;
  var GAP = 64;

  var state = { settings: null, rules: [], view: 'loading', snap: null, pick: -1 };
  var saveTimer = null;
  var lastFocus = null;

  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return n.toLocaleString(); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var plural = function (n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); };

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function normalizeSettings(s) {
    if (!s || !Life.parseISO(s.birth)) return null;
    var years = Math.round(+s.years);
    if (!(years >= 1 && years <= 120)) return null;
    return { birth: s.birth, years: years, weekStart: +s.weekStart === 1 ? 1 : 0 };
  }

  /* ---------------- Views ---------------- */

  function setView(view) {
    state.view = view;
    document.body.dataset.view = view;
    var inApp = view === 'weeks' || view === 'rules';
    $('setup').hidden = view !== 'setup';
    $('app').hidden = !inApp;
    $('switcher').hidden = !inApp;
    document.querySelectorAll('#switcher [role="tab"]').forEach(function (b) {
      var on = b.dataset.view === view;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    hideTip();
    renderToday();
    if (view === 'weeks') renderWeeks();
    if (view === 'rules') renderRules();
  }

  function renderToday() {
    $('today').textContent = new Date().toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /* ---------------- Weeks ---------------- */

  function renderWeeks() {
    var snap = Life.snapshot(state.settings, new Date());
    if (!snap) return setView('setup');
    state.snap = snap;
    renderToday();

    $('s-left').textContent = fmt(snap.left);
    $('s-lived').textContent = fmt(snap.filled);
    $('s-age').textContent = snap.pastExpectancy
      ? plural(snap.age, 'year')
      : plural(snap.age, 'year') + ', ' + plural(snap.weeksThisYear, 'week');
    $('s-year-row').hidden = snap.pastExpectancy;
    $('s-year').textContent = 'Week ' + Math.min(WPR, snap.weeksThisYear + 1) + ' of ' + WPR;
    $('s-pct').textContent = snap.percent.toFixed(1) + '%';
    $('s-bar').style.width = Math.min(100, snap.percent) + '%';

    var notice = $('s-notice');
    if (snap.pastExpectancy) {
      $('s-notice-title').textContent = 'Bonus weeks.';
      $('s-notice-body').textContent = 'You are past the ' + snap.years + ' years you planned for. Every week from here is extra.';
      notice.hidden = false;
    } else if (snap.fresh.length) {
      var done = snap.fresh[snap.fresh.length - 1] + 1;
      $('s-notice-title').textContent = 'One week older.';
      $('s-notice-body').textContent = 'Week ' + fmt(done) + ' is behind you. Make this one count.';
      notice.hidden = false;
    } else {
      notice.hidden = true;
    }

    renderPick();
    drawGrid();
  }

  function renderPick() {
    var current = state.pick >= 0 ? (state.rules[state.pick] || '').trim() : '';
    if (!current) {
      var options = [];
      state.rules.forEach(function (r, i) { if (r.trim()) options.push(i); });
      state.pick = options.length ? options[Math.floor(Math.random() * options.length)] : -1;
    }
    var has = state.pick >= 0;
    $('s-rule').hidden = !has;
    $('s-rule-empty').hidden = has;
    if (has) {
      $('s-rule-n').textContent = 'Rule ' + pad2(state.pick + 1);
      $('s-rule-text').textContent = state.rules[state.pick].trim();
    }
  }

  function gridLayout(years) {
    var narrow = window.innerWidth < BREAKPOINT;
    var padX = narrow ? 16 : 40;
    var padY = narrow ? 24 : 32;
    var LW = 24, TH = 16, RW = 56;
    var availW = narrow ? window.innerWidth - 2 * padX : window.innerWidth - 2 * padX - RAIL_W - GAP;
    var availH = narrow ? Infinity : window.innerHeight - 2 * padY;
    var decades = Math.floor((years - 1) / 10);

    var pick = null;
    [3, 2, 1].some(function (g) {
      var dg = g + 3;
      var sH = Math.floor((availH - TH - (years - 1) * g - decades * dg) / years);
      var sW = Math.floor((availW - LW - RW - (WPR - 1) * g) / WPR);
      pick = { s: Math.min(sH, sW, 16), g: g, dg: dg };
      return (g === 3 && pick.s >= 10) || (g === 2 && pick.s >= 5);
    });
    var s = Math.max(3, pick.s), g = pick.g, dg = pick.dg;
    var gridW = WPR * s + (WPR - 1) * g;
    return {
      s: s, g: g, dg: dg, LW: LW, TH: TH, RW: RW, gridW: gridW,
      width: LW + gridW + RW,
      height: TH + years * s + (years - 1) * g + decades * dg,
      rowY: function (r) { return TH + r * (s + g) + Math.floor(r / 10) * dg; },
      colX: function (c) { return LW + c * (s + g); }
    };
  }

  function drawGrid() {
    var snap = state.snap;
    if (!snap) return;
    var L = gridLayout(snap.years);
    var s = L.s;
    var fs = s >= 8 ? 10 : 9;
    var fresh = {};
    snap.fresh.forEach(function (i) { fresh[i] = true; });

    var out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + L.width + '" height="' + L.height +
      '" viewBox="0 0 ' + L.width + ' ' + L.height + '" role="img" aria-label="' +
      fmt(snap.filled) + ' of ' + fmt(snap.total) + ' weeks lived">');

    // Week numbers across the top
    [1, 10, 20, 30, 40, 52].forEach(function (n) {
      out.push('<text class="ax" font-size="' + fs + '" x="' + (L.colX(n - 1) + s / 2) + '" y="' + (L.TH - 5) +
        '" text-anchor="middle">' + n + '</text>');
    });
    // Age at each decade, down the left
    for (var r = 0; r < snap.years; r += 10) {
      out.push('<text class="ax" font-size="' + fs + '" x="' + (L.LW - 6) + '" y="' + (L.rowY(r) + s / 2) +
        '" text-anchor="end" dominant-baseline="central">' + r + '</text>');
    }

    // Cells
    var d = Math.round(s * 0.4);
    if ((s - d) % 2) d -= 1;
    d = Math.max(1, d);
    var off = (s - d) / 2;
    for (var i = 0; i < snap.total; i++) {
      var x = L.colX(i % WPR), y = L.rowY(Math.floor(i / WPR));
      var cls = 'c' + (i < snap.filled ? ' lived' : '') + (fresh[i] ? ' fresh' : '');
      out.push('<rect class="' + cls + '" data-i="' + i + '" x="' + (x + 0.5) + '" y="' + (y + 0.5) +
        '" width="' + (s - 1) + '" height="' + (s - 1) + '"/>');
      if (i === snap.current) {
        out.push('<rect class="dot" x="' + (x + off) + '" y="' + (y + off) + '" width="' + d + '" height="' + d + '"/>');
      }
    }

    // "You are here" marker on the right of the current row
    if (snap.current >= 0) {
      var row = Math.floor(snap.current / WPR);
      var my = Math.floor(L.rowY(row) + s / 2) + 0.5;
      var gx = L.LW + L.gridW;
      out.push('<line class="tick" x1="' + (gx + 4) + '" x2="' + (gx + 12) + '" y1="' + my + '" y2="' + my + '"/>');
      out.push('<text class="ax now" font-size="' + fs + '" x="' + (gx + 16) + '" y="' + my +
        '" dominant-baseline="central">Age ' + snap.age + '</text>');
    }

    out.push('</svg>');
    $('grid-wrap').innerHTML = out.join('');
  }

  /* ---------------- Tooltip ---------------- */

  function onGridMove(e) {
    var t = e.target;
    var i = t && t.dataset ? t.dataset.i : undefined;
    if (i === undefined || !state.snap) return hideTip();
    showTip(+i, e.clientX, e.clientY);
  }

  function showTip(i, cx, cy) {
    var snap = state.snap;
    var range = snap.range(i);
    var opts = { day: 'numeric', month: 'short', year: 'numeric' };
    var status = i < snap.filled ? 'Lived' : i === snap.current ? 'This week' : 'Ahead';
    var tip = $('tip');
    tip.textContent = '';
    var b = document.createElement('b');
    b.textContent = 'Age ' + Math.floor(i / WPR) + ' · Week ' + ((i % WPR) + 1);
    var dates = document.createElement('span');
    dates.textContent = Life.formatDay(range[0], opts) + ' – ' + Life.formatDay(range[1], opts);
    var st = document.createElement('span');
    st.textContent = status + ' · #' + fmt(i + 1);
    tip.append(b, dates, st);
    tip.hidden = false;

    var w = tip.offsetWidth, h = tip.offsetHeight;
    var x = cx + 14, y = cy + 18;
    if (x + w > window.innerWidth - 8) x = cx - w - 14;
    if (y + h > window.innerHeight - 8) y = cy - h - 14;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  function hideTip() { $('tip').hidden = true; }

  /* ---------------- Rules ---------------- */

  function buildRules() {
    var ol = $('rule-grid');
    for (var i = 0; i < Store.RULE_COUNT; i++) {
      var li = document.createElement('li');
      li.className = 'rule';
      var label = document.createElement('label');
      label.className = 'rule-n';
      label.htmlFor = 'rule-' + i;
      label.textContent = pad2(i + 1);
      var ta = document.createElement('textarea');
      ta.id = 'rule-' + i;
      ta.maxLength = MAX_RULE;
      ta.placeholder = PLACEHOLDERS[i] || 'Write a rule';
      ta.spellcheck = true;
      ta.setAttribute('aria-label', 'Rule ' + (i + 1));
      var count = document.createElement('span');
      count.className = 'rule-count';
      count.setAttribute('aria-hidden', 'true');
      li.append(label, ta, count);
      ol.appendChild(li);
      ta.addEventListener('input', onRuleInput.bind(null, i));
    }
  }

  function syncRuleCell(i) {
    var ta = $('rule-' + i);
    ta.parentNode.classList.toggle('filled', !!ta.value.trim());
    ta.nextSibling.textContent = ta.value.length + '/' + MAX_RULE;
  }

  function renderRules() {
    for (var i = 0; i < Store.RULE_COUNT; i++) {
      var ta = $('rule-' + i);
      if (document.activeElement !== ta && ta.value !== state.rules[i]) ta.value = state.rules[i];
      syncRuleCell(i);
    }
  }

  function onRuleInput(i, e) {
    state.rules[i] = e.target.value;
    syncRuleCell(i);
    setStatus('Saving…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushRules, 500);
  }

  function flushRules() {
    if (saveTimer === null) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    Store.save({ rules: state.rules.slice() })
      .then(function () { setStatus('Saved'); })
      .catch(function () { setStatus('Could not save. Try again in a minute.'); });
  }

  var statusTimer;
  function setStatus(text) {
    $('r-status').textContent = text;
    clearTimeout(statusTimer);
    if (text === 'Saved') statusTimer = setTimeout(function () { $('r-status').textContent = ''; }, 2400);
  }

  /* ---------------- Settings forms ---------------- */

  function mountFields(container, prefix) {
    var frag = $('fields-tpl').content.cloneNode(true);
    frag.querySelectorAll('[id]').forEach(function (el) { el.id = prefix + el.id; });
    frag.querySelectorAll('label[for]').forEach(function (el) { el.htmlFor = prefix + el.htmlFor; });
    container.appendChild(frag);
  }

  function fillForm(form, s) {
    var el = form.elements;
    el.birth.value = s.birth || '';
    el.birth.max = todayISO();
    el.years.value = s.years || DEFAULTS.years;
    form.querySelector('input[name="weekStart"][value="' + (s.weekStart === 1 ? 1 : 0) + '"]').checked = true;
    showErrors(form, []);
  }

  function showErrors(form, errors) {
    var box = form.querySelector('.error');
    form.elements.birth.removeAttribute('aria-invalid');
    form.elements.years.removeAttribute('aria-invalid');
    errors.forEach(function (e) { form.elements[e.field].setAttribute('aria-invalid', 'true'); });
    box.textContent = errors.map(function (e) { return e.msg; }).join(' ');
    box.hidden = !errors.length;
  }

  function readForm(form) {
    var el = form.elements;
    var birth = el.birth.value;
    var years = Math.round(+el.years.value);
    var checked = form.querySelector('input[name="weekStart"]:checked');
    var errors = [];
    if (!Life.parseISO(birth)) errors.push({ field: 'birth', msg: 'Enter your date of birth.' });
    else if (birth > todayISO()) errors.push({ field: 'birth', msg: 'Your date of birth can’t be in the future.' });
    else if (birth < '1900-01-01') errors.push({ field: 'birth', msg: 'Check the year of your date of birth.' });
    if (!(years >= 1 && years <= 120)) errors.push({ field: 'years', msg: 'Life expectancy must be between 1 and 120 years.' });
    showErrors(form, errors);
    if (errors.length) { el[errors[0].field].focus(); return null; }
    return { birth: birth, years: years, weekStart: checked && checked.value === '1' ? 1 : 0 };
  }

  var deleteArmed = null;
  function disarmDelete() {
    clearTimeout(deleteArmed);
    deleteArmed = null;
    $('delete-data').textContent = 'Delete all my data';
  }

  // Two clicks within 4 seconds, so it can't happen by accident.
  function onDeleteClick() {
    if (!deleteArmed) {
      $('delete-data').textContent = 'Click again to delete everything';
      deleteArmed = setTimeout(disarmDelete, 4000);
      return;
    }
    disarmDelete();
    clearTimeout(saveTimer);
    saveTimer = null;
    Store.clear().then(function () {
      state.settings = null;
      state.rules = state.rules.map(function () { return ''; });
      state.pick = -1;
      $('modal').hidden = true;
      fillForm($('setup-form'), DEFAULTS);
      setView('setup');
      $('setup-form').elements.birth.focus();
    });
  }

  function openSettings() {
    disarmDelete();
    lastFocus = document.activeElement;
    var form = $('settings-form');
    fillForm(form, state.settings);
    $('modal').hidden = false;
    hideTip();
    form.elements.birth.focus();
  }

  function closeSettings() {
    disarmDelete();
    $('modal').hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function trapFocus(e) {
    var nodes = Array.prototype.filter.call(
      $('settings-form').querySelectorAll('button, input:not([type="radio"]), input[type="radio"]:checked'),
      function (n) { return !n.disabled && n.offsetParent !== null; }
    );
    if (!nodes.length) return;
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------- Wiring ---------------- */

  function bind() {
    $('setup-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var s = readForm(e.target);
      if (!s) return;
      state.settings = s;
      Store.save({ settings: s });
      setView('weeks');
    });

    $('settings-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var s = readForm(e.target);
      if (!s) return;
      state.settings = s;
      Store.save({ settings: s });
      closeSettings();
      setView(state.view);
    });

    $('open-settings').addEventListener('click', openSettings);
    $('delete-data').addEventListener('click', onDeleteClick);
    $('modal').addEventListener('click', function (e) {
      if (e.target === e.currentTarget || e.target.closest('[data-close]')) closeSettings();
    });

    document.addEventListener('keydown', function (e) {
      if ($('modal').hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeSettings(); }
      if (e.key === 'Tab') trapFocus(e);
    });

    var tabs = Array.prototype.slice.call(document.querySelectorAll('#switcher [role="tab"]'));
    tabs.forEach(function (b, idx) {
      b.addEventListener('click', function () { setView(b.dataset.view); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        var next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        setView(next.dataset.view);
        next.focus();
      });
    });

    $('s-rule-empty').addEventListener('click', function () {
      setView('rules');
      $('rule-0').focus();
    });

    var wrap = $('grid-wrap');
    wrap.addEventListener('mousemove', onGridMove);
    wrap.addEventListener('mouseleave', hideTip);

    var raf = 0;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { if (state.view === 'weeks') drawGrid(); });
    });

    // Catch the day change if the tab was left open or in the background.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { flushRules(); return; }
      if (state.view === 'weeks' && state.snap && state.snap.today !== Life.dayFromLocalDate(new Date())) renderWeeks();
      else renderToday();
    });
    window.addEventListener('pagehide', flushRules);

    Store.onChange(function (data) {
      state.settings = normalizeSettings(data.settings);
      if (saveTimer === null) {
        data.rules.forEach(function (r, i) {
          if (document.activeElement !== $('rule-' + i)) state.rules[i] = r;
        });
      }
      // Data was deleted in another tab.
      if (!state.settings) {
        if (state.view !== 'setup') {
          $('modal').hidden = true;
          fillForm($('setup-form'), DEFAULTS);
          setView('setup');
        }
        return;
      }
      if (state.view === 'setup') setView('weeks');
      else if (state.view === 'weeks') renderWeeks();
      else if (state.view === 'rules') renderRules();
    });
  }

  function scheduleMidnight() {
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    setTimeout(function () {
      if (state.view === 'weeks') renderWeeks(); else renderToday();
      scheduleMidnight();
    }, next - now);
  }

  function init() {
    buildRules();
    mountFields(document.querySelector('[data-fields="setup"]'), 'setup-');
    mountFields(document.querySelector('[data-fields="modal"]'), 'modal-');
    bind();

    Store.load().then(function (data) {
      state.rules = data.rules;
      state.settings = normalizeSettings(data.settings);
      if (state.settings) {
        setView('weeks');
      } else {
        fillForm($('setup-form'), DEFAULTS);
        setView('setup');
        $('setup-form').elements.birth.focus();
      }
      scheduleMidnight();
    });
  }

  init();
})();
