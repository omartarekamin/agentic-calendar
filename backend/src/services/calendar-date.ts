interface LocalDateParts {
  year: number;
  month: number;
  day: number;
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
