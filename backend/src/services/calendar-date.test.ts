import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getCalendarDayBounds,
  localDateTimeToIso,
} from "./calendar-date.js";

function testCairoWallTimeConvertsToUtc() {
  assert.equal(
    localDateTimeToIso("2026-11-21T19:00:00", "Africa/Cairo"),
    "2026-11-21T17:00:00.000Z",
  );
  assert.equal(
    localDateTimeToIso("2026-11-21T20:00:00", "Africa/Cairo"),
    "2026-11-21T18:00:00.000Z",
  );
}

function testNewYorkWallTimeAccountsForDst() {
  assert.equal(
    localDateTimeToIso("2026-03-08T07:00:00", "America/New_York"),
    "2026-03-08T11:00:00.000Z",
  );
}

/** Verifies local-day bounds account for timezone offset changes at DST. */
function testDayBoundsAcrossDaylightSavingTransition() {
  const bounds = getCalendarDayBounds(
    new Date("2026-03-08T16:00:00.000Z"),
    "America/New_York",
  );

  assert.deepEqual(bounds, {
    timeMin: "2026-03-08T05:00:00.000Z",
    timeMax: "2026-03-09T04:00:00.000Z",
  });
}

/** Verifies a UTC instant maps to the correct date in a far-ahead timezone. */
function testDayBoundsUseTheTargetTimezoneDate() {
  const bounds = getCalendarDayBounds(
    new Date("2026-11-21T13:49:00.000Z"),
    "Pacific/Kiritimati",
  );

  assert.deepEqual(bounds, {
    timeMin: "2026-11-21T10:00:00.000Z",
    timeMax: "2026-11-22T10:00:00.000Z",
  });
}

test("calendar-day bounds follow daylight-saving transitions", testDayBoundsAcrossDaylightSavingTransition);
test("calendar-day bounds honor the selected timezone", testDayBoundsUseTheTargetTimezoneDate);
test("Cairo wall-clock meeting times convert to UTC", testCairoWallTimeConvertsToUtc);
test("wall-clock meeting times account for DST", testNewYorkWallTimeAccountsForDst);
