import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type {
  ParsedSchedule,
  ScheduleSource,
  ScheduleType,
} from "../types/schedule";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Tokyo";

const WEEKDAY_MAP = new Map<string, number>([
  ["日", 0],
  ["月", 1],
  ["火", 2],
  ["水", 3],
  ["木", 4],
  ["金", 5],
  ["土", 6],
]);

type ParsedDate = {
  value: dayjs.Dayjs | null;
  matched: boolean;
};

type ParsedTime = {
  hour: number;
  minute: number;
  matched: boolean;
};

export function parseScheduleText(
  text: string,
  now: Date,
  source: ScheduleSource = "manual",
): ParsedSchedule {
  const rawText = text.trim();
  const base = dayjs(now).tz(TIMEZONE);
  const parsedDate = parseDate(rawText, base);
  const parsedTime = parseTime(rawText);
  const title = extractTitle(rawText);
  const type = detectScheduleType(title || rawText);
  const start =
    parsedDate.value && parsedTime.matched
      ? parsedDate.value
          .hour(parsedTime.hour)
          .minute(parsedTime.minute)
          .second(0)
          .millisecond(0)
          .format()
      : null;

  return {
    title: title || rawText,
    type,
    start,
    end: null,
    source,
    rawText,
    confidence: calculateConfidence({
      hasDate: parsedDate.matched,
      hasTime: parsedTime.matched,
      hasTitle: Boolean(title),
      type,
    }),
  };
}

function parseDate(text: string, base: dayjs.Dayjs): ParsedDate {
  const startOfToday = base.startOf("day");

  if (/今日/.test(text)) {
    return { value: startOfToday, matched: true };
  }

  if (/明日|あした/.test(text)) {
    return { value: startOfToday.add(1, "day"), matched: true };
  }

  const nextWeekdayMatch = text.match(/来週([日月火水木金土])(?:曜|曜日)?/);
  if (nextWeekdayMatch) {
    const targetWeekday = WEEKDAY_MAP.get(nextWeekdayMatch[1]);
    if (targetWeekday !== undefined) {
      return {
        value: startOfToday.add(daysUntilNextWeekday(base.day(), targetWeekday), "day"),
        matched: true,
      };
    }
  }

  const numericDateMatch = text.match(/(?:^|[^\d])(\d{1,2})[\/月](\d{1,2})(?:日)?/);
  if (numericDateMatch) {
    const month = Number(numericDateMatch[1]);
    const date = Number(numericDateMatch[2]);
    let value = startOfToday.year(base.year()).month(month - 1).date(date);

    if (value.isBefore(startOfToday, "day")) {
      value = value.add(1, "year");
    }

    return { value, matched: true };
  }

  return { value: null, matched: false };
}

function parseTime(text: string): ParsedTime {
  const colonTimeMatch = text.match(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?:[^\d]|$)/);
  if (colonTimeMatch) {
    return {
      hour: Number(colonTimeMatch[1]),
      minute: Number(colonTimeMatch[2]),
      matched: true,
    };
  }

  const japaneseTimeMatch = text.match(/([01]?\d|2[0-3])時(半)?/);
  if (japaneseTimeMatch) {
    return {
      hour: Number(japaneseTimeMatch[1]),
      minute: japaneseTimeMatch[2] ? 30 : 0,
      matched: true,
    };
  }

  if (/朝/.test(text)) {
    return { hour: 8, minute: 0, matched: true };
  }

  if (/昼/.test(text)) {
    return { hour: 12, minute: 0, matched: true };
  }

  if (/夕方/.test(text)) {
    return { hour: 17, minute: 0, matched: true };
  }

  if (/夜/.test(text)) {
    return { hour: 21, minute: 0, matched: true };
  }

  return { hour: 0, minute: 0, matched: false };
}

function detectScheduleType(text: string): ScheduleType {
  if (/バイト|勤務|シフト/.test(text)) {
    return "work";
  }

  if (/課題|レポート|締切|提出/.test(text)) {
    return "assignment";
  }

  if (/ゴミ出し|リマインド|忘れない/.test(text)) {
    return "reminder";
  }

  return text.trim() ? "event" : "unknown";
}

function extractTitle(text: string): string {
  return text
    .replace(/今日|明日|あした/g, "")
    .replace(/来週[日月火水木金土](?:曜|曜日)?/g, "")
    .replace(/(?:^|[^\d])\d{1,2}[\/月]\d{1,2}(?:日)?/g, " ")
    .replace(/(?:^|[^\d])(?:[01]?\d|2[0-3]):[0-5]\d(?:[^\d]|$)/g, " ")
    .replace(/(?:[01]?\d|2[0-3])時半?/g, "")
    .replace(/(?:[01]?\d|2[0-3])時/g, "")
    .replace(/朝|昼|夕方|夜/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(から|に|まで|で|の|を|は|が)+/, "")
    .replace(/(から|に|まで|で|の|を|は|が)+$/, "")
    .trim();
}

function daysUntilNextWeekday(currentWeekday: number, targetWeekday: number): number {
  const days = (targetWeekday - currentWeekday + 7) % 7;
  return days === 0 ? 7 : days;
}

function calculateConfidence(input: {
  hasDate: boolean;
  hasTime: boolean;
  hasTitle: boolean;
  type: ScheduleType;
}): number {
  let confidence = 0.1;

  if (input.hasDate) {
    confidence += 0.25;
  }

  if (input.hasTime) {
    confidence += 0.25;
  }

  if (input.hasTitle) {
    confidence += 0.15;
  }

  if (input.type !== "unknown") {
    confidence += 0.05;
  }

  return Math.min(1, Number(confidence.toFixed(2)));
}
