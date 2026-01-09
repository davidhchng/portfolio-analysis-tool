import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";

const MARKET_TIMEZONE = "America/New_York";
const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 30;
const MARKET_CLOSE_HOUR = 16;
const MARKET_CLOSE_MINUTE = 0;

export function isMarketHours(date: Date = new Date()): boolean {
  const nyTime = utcToZonedTime(date, MARKET_TIMEZONE);
  const dayOfWeek = nyTime.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();

  const openMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const closeMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;
  const currentMinutes = hour * 60 + minute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getMarketTimezone(): string {
  return MARKET_TIMEZONE;
}

