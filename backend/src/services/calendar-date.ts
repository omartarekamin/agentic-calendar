interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

/**
 * Returns true for ISO datetimes that are already tied to an absolute instant.
 */
export function hasExplicitUtcOffset(value: string): boolean {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
}

/**
 * Converts a timezone-local wall-clock datetime to an absolute ISO instant.
 * Offset-bearing ISO datetimes are returned unchanged.
 */
export function localDateTimeToIso(
  value: string,
  timeZone: string,
): string {
  if (hasExplicitUtcOffset(value)) {
    return new Date(value).toISOString();
  }

  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    throw new Error("Provide a valid ISO local datetime.");
  }

  const [, year, month, day, hour, minute, second = "0", fraction = "0"] =
    match;
  const requestedParts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: Number(fraction.padEnd(3, "0")),
  };
  const wallClockUtc = Date.UTC(
    requestedParts.year,
    requestedParts.month - 1,
    requestedParts.day,
    requestedParts.hour,
    requestedParts.minute,
    requestedParts.second,
    requestedParts.millisecond,
  );

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let lowerBound = wallClockUtc - 36 * 60 * 60 * 1000;
  let upperBound = wallClockUtc + 36 * 60 * 60 * 1000;

  while (upperBound - lowerBound > 1) {
    const midpoint = Math.floor((lowerBound + upperBound) / 2);
    const instant = new Date(midpoint);
    const parts = getLocalDateTimeParts(instant, formatter);
    const representedWallClock = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0,
    );

    if (representedWallClock >= wallClockUtc) {
      upperBound = midpoint;
    } else {
      lowerBound = midpoint;
    }
  }

  const result = new Date(upperBound);
  const resultParts = getLocalDateTimeParts(result, formatter);
  if (
    resultParts.year !== requestedParts.year ||
    resultParts.month !== requestedParts.month ||
    resultParts.day !== requestedParts.day ||
    resultParts.hour !== requestedParts.hour ||
    resultParts.minute !== requestedParts.minute ||
    resultParts.second !== requestedParts.second
  ) {
    throw new Error(
      "The local datetime does not exist in the requested timezone.",
    );
  }

  return result.toISOString();
}

function getLocalDateTimeParts(
  instant: Date,
  formatter: Intl.DateTimeFormat,
) {
  const parts = formatter.formatToParts(instant);
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const part of parts) {
    if (part.type === "year") year = Number(part.value);
    if (part.type === "month") month = Number(part.value);
    if (part.type === "day") day = Number(part.value);
    if (part.type === "hour") hour = Number(part.value);
    if (part.type === "minute") minute = Number(part.value);
    if (part.type === "second") second = Number(part.value);
  }

  return { year, month, day, hour, minute, second };
}

/**
 * Finds the UTC start and exclusive end of the calendar day containing `now`.
 */
export function getCalendarDayBounds(
  now: Date,
  timeZone: string,
): { timeMin: string; timeMax: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const localDate = getLocalDateParts(now, formatter);
  const startOfDay = Date.UTC(
    localDate.year,
    localDate.month - 1,
    localDate.day,
  );
  const nextDate = new Date(startOfDay + 24 * 60 * 60 * 1000);
  const nextLocalDate = {
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate(),
  };

  return {
    timeMin: getFirstInstantOfDate(localDate, formatter),
    timeMax: getFirstInstantOfDate(nextLocalDate, formatter),
  };
}

/**
 * Reads the year, month, and day represented by an instant in the target zone.
 */
function getLocalDateParts(
  instant: Date,
  formatter: Intl.DateTimeFormat,
): LocalDateParts {
  const parts = formatter.formatToParts(instant);
  let year = 0;
  let month = 0;
  let day = 0;

  for (const part of parts) {
    if (part.type === "year") {
      year = Number(part.value);
    } else if (part.type === "month") {
      month = Number(part.value);
    } else if (part.type === "day") {
      day = Number(part.value);
    }
  }

  return { year, month, day };
}

/**
 * Converts a local calendar date to its first representable instant in UTC.
 */
function getFirstInstantOfDate(
  date: LocalDateParts,
  formatter: Intl.DateTimeFormat,
): string {
  const targetDate = Date.UTC(date.year, date.month - 1, date.day);
  let lowerBound = targetDate - 36 * 60 * 60 * 1000;
  let upperBound = targetDate + 36 * 60 * 60 * 1000;

  while (upperBound - lowerBound > 1) {
    const midpoint = Math.floor((lowerBound + upperBound) / 2);
    const localDate = getLocalDateParts(new Date(midpoint), formatter);
    const localDateValue = Date.UTC(
      localDate.year,
      localDate.month - 1,
      localDate.day,
    );

    if (localDateValue >= targetDate) {
      upperBound = midpoint;
    } else {
      lowerBound = midpoint;
    }
  }

  return new Date(upperBound).toISOString();
}
