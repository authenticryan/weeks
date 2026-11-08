/*
 * Life math. Pure functions, no DOM.
 *
 * Model: one row per year of age, 52 cells per row.
 * Row r starts on your r-th birthday. A cell fills when a week boundary
 * (Sunday or Monday, your choice) passes, so the grid ticks on the same
 * day every week and each row lines up with your real age.
 *
 * Dates are handled as integer "day numbers" (days since 1970-01-01, UTC)
 * so daylight-saving shifts never move a boundary.
 */
(function (root) {
  'use strict';

  var DAY_MS = 86400000;
  var WEEKS_PER_ROW = 52;

  function dayFromParts(y, m, d) {
    return Math.floor(Date.UTC(y, m, d) / DAY_MS);
  }

  function dayFromLocalDate(date) {
    return dayFromParts(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var y = +m[1], mo = +m[2] - 1, d = +m[3];
    var check = new Date(Date.UTC(y, mo, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo || check.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }

  // 0 = Sunday ... 6 = Saturday. 1970-01-01 was a Thursday.
  function weekday(n) {
    return (((n + 4) % 7) + 7) % 7;
  }

  // Feb 29 birthdays roll to Mar 1 in non-leap years (Date.UTC does this).
  function birthdayAt(b, age) {
    return dayFromParts(b.y + age, b.m, b.d);
  }

  function ageOn(b, t) {
    var a = new Date(t * DAY_MS).getUTCFullYear() - b.y;
    if (birthdayAt(b, a) > t) a -= 1;
    return a;
  }

  // First week-start day strictly after day n.
  function firstBoundaryAfter(n, ws) {
    var next = n + 1;
    return next + ((ws - weekday(next) + 7) % 7);
  }

  // How many week-start days fall in (a, b].
  function boundariesIn(a, b, ws) {
    if (b <= a) return 0;
    var f = firstBoundaryAfter(a, ws);
    return f > b ? 0 : Math.floor((b - f) / 7) + 1;
  }

  // Number of filled cells on day t.
  function filledOn(b, years, ws, t) {
    var age = ageOn(b, t);
    if (age < 0) return 0;
    if (age >= years) return years * WEEKS_PER_ROW;
    var done = Math.min(WEEKS_PER_ROW, boundariesIn(birthdayAt(b, age), t, ws));
    return age * WEEKS_PER_ROW + done;
  }

  // Inclusive [start, end] day numbers covered by a cell.
  function cellRange(b, ws, index) {
    var row = Math.floor(index / WEEKS_PER_ROW);
    var col = index % WEEKS_PER_ROW;
    var start = birthdayAt(b, row);
    var b1 = firstBoundaryAfter(start, ws);
    if (col === 0) return [start, b1 - 1];
    return [b1 + 7 * (col - 1), b1 + 7 * col - 1];
  }

  /*
   * Everything the UI needs for one day.
   * settings: { birth: 'YYYY-MM-DD', years: Number, weekStart: 0|1 }
   */
  function snapshot(settings, now) {
    var b = parseISO(settings.birth);
    if (!b) return null;
    var years = Math.max(1, Math.round(settings.years));
    var ws = settings.weekStart === 1 ? 1 : 0;
    var t = dayFromLocalDate(now || new Date());

    var total = years * WEEKS_PER_ROW;
    var filled = filledOn(b, years, ws, t);
    var age = ageOn(b, t);
    var weeksThisYear = age < years ? filled - age * WEEKS_PER_ROW : WEEKS_PER_ROW;

    // On the first two days of a new week, the cell that just filled pulses.
    var intoWeek = (weekday(t) - ws + 7) % 7;
    var fresh = [];
    if (intoWeek <= 1) {
      var before = filledOn(b, years, ws, t - intoWeek - 1);
      for (var i = before; i < filled; i++) fresh.push(i);
    }

    return {
      today: t,
      years: years,
      weekStart: ws,
      total: total,
      filled: filled,
      left: total - filled,
      current: filled < total ? filled : -1,
      age: age,
      weeksThisYear: weeksThisYear,
      fresh: fresh,
      pastExpectancy: age >= years,
      percent: total ? (filled / total) * 100 : 0,
      range: function (index) { return cellRange(b, ws, index); }
    };
  }

  function formatDay(n, opts) {
    return new Date(n * DAY_MS).toLocaleDateString(undefined, Object.assign({ timeZone: 'UTC' }, opts || {}));
  }

  var Life = {
    WEEKS_PER_ROW: WEEKS_PER_ROW,
    parseISO: parseISO,
    weekday: weekday,
    dayFromParts: dayFromParts,
    dayFromLocalDate: dayFromLocalDate,
    ageOn: ageOn,
    boundariesIn: boundariesIn,
    filledOn: filledOn,
    cellRange: cellRange,
    snapshot: snapshot,
    formatDay: formatDay
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Life;
  else root.Life = Life;
})(this);
