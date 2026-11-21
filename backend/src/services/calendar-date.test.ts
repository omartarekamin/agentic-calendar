import assert from "node:assert/strict";
import { test } from "node:test";
import { getCalendarDayBounds } from "./calendar-date.js";

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
