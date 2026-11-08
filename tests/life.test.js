/*
 * Tests for the date model. No dependencies: `node tests/life.test.js`.
 *
 * The strongest check walks every single day across 50 years for several
 * awkward birthdays (leap day, year end, new year) and both week starts,
 * and proves the grid never skips, never double-fills, and that each cell's
 * date range ends exactly the day before it fills.
 */
'use strict';

const assert = require('assert');
const path = require('path');
const Life = require(path.join(__dirname, '..', 'extension', 'js', 'life.js'));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok   ' + name);
  } catch (err) {
    console.error('  FAIL ' + name + '\n       ' + err.message);
    process.exitCode = 1;
  }
}

const local = (y, m, d) => new Date(y, m - 1, d);

console.log('Life model');

test('weekday is anchored correctly', () => {
  assert.strictEqual(Life.weekday(Life.dayFromParts(1970, 0, 1)), 4); // Thursday
  assert.strictEqual(Life.weekday(Life.dayFromParts(2026, 10, 8)), 0); // Sunday
  assert.strictEqual(Life.weekday(Life.dayFromParts(2000, 0, 1)), 6); // Saturday
});

test('rejects impossible dates', () => {
  assert.strictEqual(Life.parseISO('2023-02-29'), null);
  assert.strictEqual(Life.parseISO('1991-13-01'), null);
  assert.strictEqual(Life.parseISO('not a date'), null);
  assert.deepStrictEqual(Life.parseISO('2024-02-29'), { y: 2024, m: 1, d: 29 });
});

test('a Sunday start fills a cell on Sunday and blinks Sunday + Monday only', () => {
  const s = { birth: '1991-04-12', years: 80, weekStart: 0 };
  const sat = Life.snapshot(s, local(2026, 11, 7));
  const sun = Life.snapshot(s, local(2026, 11, 8));
  const mon = Life.snapshot(s, local(2026, 11, 9));
  const tue = Life.snapshot(s, local(2026, 11, 10));
  assert.strictEqual(sun.filled, sat.filled + 1);
  assert.strictEqual(mon.filled, sun.filled);
  assert.deepStrictEqual(sat.fresh, []);
  assert.deepStrictEqual(sun.fresh, [sat.filled]);
  assert.deepStrictEqual(mon.fresh, [sat.filled]);
  assert.deepStrictEqual(tue.fresh, []);
});

test('a Monday start fills on Monday and blinks Monday + Tuesday', () => {
  const s = { birth: '1991-04-12', years: 80, weekStart: 1 };
  const sun = Life.snapshot(s, local(2026, 11, 8));
  const mon = Life.snapshot(s, local(2026, 11, 9));
  const tue = Life.snapshot(s, local(2026, 11, 10));
  const wed = Life.snapshot(s, local(2026, 11, 11));
  assert.strictEqual(mon.filled, sun.filled + 1);
  assert.deepStrictEqual(mon.fresh, [sun.filled]);
  assert.deepStrictEqual(tue.fresh, [sun.filled]);
  assert.deepStrictEqual(wed.fresh, []);
});

test('rows line up with birthdays', () => {
  const s = { birth: '1991-04-12', years: 80, weekStart: 0 };
  const dayBefore = Life.snapshot(s, local(2026, 4, 11));
  const birthday = Life.snapshot(s, local(2026, 4, 12));
  assert.strictEqual(dayBefore.age, 34);
  assert.strictEqual(birthday.age, 35);
  assert.strictEqual(birthday.filled, 35 * 52); // row 35 starts empty
  assert.strictEqual(dayBefore.filled, 35 * 52); // row 34 is complete
});

test('every day for 50 years: no skips, no double fills, ranges match', () => {
  for (const birth of ['1991-04-12', '1988-02-29', '2000-01-02', '1995-12-31']) {
    for (const ws of [0, 1]) {
      const b = Life.parseISO(birth);
      const start = Life.dayFromParts(b.y, b.m, b.d);
      let prev = Life.filledOn(b, 80, ws, start);
      for (let t = start + 1; t < start + 365 * 50; t++) {
        const f = Life.filledOn(b, 80, ws, t);
        assert.ok(f === prev || f === prev + 1, `${birth} ws=${ws} day ${t}: ${prev} -> ${f}`);
        if (f === prev + 1) {
          const range = Life.cellRange(b, ws, prev);
          assert.strictEqual(range[1], t - 1, `${birth} ws=${ws} cell ${prev} should end the day before it fills`);
        }
        prev = f;
      }
    }
  }
});

test('born today means nothing filled yet', () => {
  const d = new Date();
  const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const snap = Life.snapshot({ birth: iso, years: 80, weekStart: 0 }, d);
  assert.strictEqual(snap.filled, 0);
  assert.strictEqual(snap.current, 0);
});

test('past life expectancy: grid is full and flagged', () => {
  const snap = Life.snapshot({ birth: '1940-01-01', years: 60, weekStart: 0 }, local(2026, 11, 8));
  assert.strictEqual(snap.left, 0);
  assert.strictEqual(snap.current, -1);
  assert.ok(snap.pastExpectancy);
});

test('invalid settings return null', () => {
  assert.strictEqual(Life.snapshot({ birth: '', years: 80, weekStart: 0 }), null);
});

console.log(`\n${passed} passed${process.exitCode ? ', some failed' : ''}`);
