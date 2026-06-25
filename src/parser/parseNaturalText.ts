import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type { EventKind, EventStatus, ParsedEventCandidate } from "./types";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Tokyo";

type ParsedDate = {
  value: dayjs.Dayjs | null;
  matched: boolean;
};

type ParsedTimePoint = {
  hour: number;
  minute: number;
  matched: boolean;
};

type ParsedTimeRange = {
  start: ParsedTimePoint;
  end: ParsedTimePoint;
};

const EMPTY_TIME: ParsedTimePoint = {
  hour: 0,
  minute: 0,
  matched: false,
};

export function parseNaturalText(text: string, now: Date = new Date()): ParsedEventCandidate {
  const originalText = text.trim();
  const base = dayjs(now).tz(TIMEZONE);
  const parsedDate = parseDate(originalText, base);
  const parsedTime = parseTimeRange(originalText);
  const kind = detectKind(originalText);
  const status = detectStatus(originalText);
  const title = extractTitle(originalText, kind);
  const startDate = parsedDate.value ?? (parsedTime.start.matched ? base.startOf("day") : null);
  const start =
    startDate && parsedTime.start.matched
      ? startDate
          .hour(parsedTime.start.hour)
          .minute(parsedTime.start.minute)
          .second(0)
          .millisecond(0)
      : startDate;
  const allDay = Boolean(parsedDate.matched && !parsedTime.start.matched);
  const end = buildEnd(start, parsedTime, kind);

  return {
    title,
    kind,
    status,
    start: start ? start.format() : null,
    end: end ? end.format() : null,
    allDay,
    description: originalText || null,
    confidence: calculateConfidence({
      hasDate: parsedDate.matched,
      hasTime: parsedTime.start.matched,
      hasTitle: Boolean(title),
      hasExplicitEnd: parsedTime.end.matched,
      kind,
      status,
    }),
    needsConfirmation: true,
    originalText,
  };
}

function parseDate(text: string, base: dayjs.Dayjs): ParsedDate {
  const startOfToday = base.startOf("day");

  if (/明後日|あさって/.test(text)) {
    return { value: startOfToday.add(2, "day"), matched: true };
  }

  if (/明日|あした/.test(text)) {
    return { value: startOfToday.add(1, "day"), matched: true };
  }

  if (/今日/.test(text)) {
    return { value: startOfToday, matched: true };
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

function parseTimeRange(text: string): ParsedTimeRange {
  const japaneseRangeMatch = text.match(
    /(午前|午後)?\s*([0-2]?\d)時(?:(半)|([0-5]\d)分?)?\s*(?:から|まで|[-〜～~])\s*(午前|午後)?\s*([0-2]?\d)時(?:(半)|([0-5]\d)分?)?/,
  );
  if (japaneseRangeMatch) {
    return {
      start:
        normalizeTimePoint(
          japaneseRangeMatch[2],
          japaneseRangeMatch[4],
          japaneseRangeMatch[3],
          japaneseRangeMatch[1],
        ) ?? EMPTY_TIME,
      end:
        normalizeTimePoint(
          japaneseRangeMatch[6],
          japaneseRangeMatch[8],
          japaneseRangeMatch[7],
          japaneseRangeMatch[5] ?? japaneseRangeMatch[1],
        ) ?? EMPTY_TIME,
    };
  }

  const numericRangeMatch = text.match(
    /(?:^|[^\d])([01]?\d|2[0-3])(?::([0-5]\d))?\s*[-〜～~]\s*([01]?\d|2[0-3])(?::([0-5]\d))?(?:[^\d]|$)/,
  );
  if (numericRangeMatch) {
    return {
      start: {
        hour: Number(numericRangeMatch[1]),
        minute: numericRangeMatch[2] ? Number(numericRangeMatch[2]) : 0,
        matched: true,
      },
      end: {
        hour: Number(numericRangeMatch[3]),
        minute: numericRangeMatch[4] ? Number(numericRangeMatch[4]) : 0,
        matched: true,
      },
    };
  }

  const colonTimeMatch = text.match(/(?:^|[^\d])([01]?\d|2[0-3]):([0-5]\d)(?:[^\d]|$)/);
  if (colonTimeMatch) {
    return {
      start: {
        hour: Number(colonTimeMatch[1]),
        minute: Number(colonTimeMatch[2]),
        matched: true,
      },
      end: EMPTY_TIME,
    };
  }

  const japaneseTimeMatch = text.match(/(午前|午後)?\s*([0-2]?\d)時(?:(半)|([0-5]\d)分?)?/);
  if (japaneseTimeMatch) {
    return {
      start:
        normalizeTimePoint(
          japaneseTimeMatch[2],
          japaneseTimeMatch[4],
          japaneseTimeMatch[3],
          japaneseTimeMatch[1],
        ) ?? EMPTY_TIME,
      end: EMPTY_TIME,
    };
  }

  return {
    start: EMPTY_TIME,
    end: EMPTY_TIME,
  };
}

function normalizeTimePoint(
  hourText: string,
  minuteText: string | undefined,
  halfText: string | undefined,
  meridiem: string | undefined,
): ParsedTimePoint | null {
  let hour = Number(hourText);

  if (Number.isNaN(hour) || hour > 23) {
    return null;
  }

  if (meridiem === "午後" && hour < 12) {
    hour += 12;
  }

  if (meridiem === "午前" && hour === 12) {
    hour = 0;
  }

  if (hour > 23) {
    return null;
  }

  return {
    hour,
    minute: halfText ? 30 : minuteText ? Number(minuteText) : 0,
    matched: true,
  };
}

function buildEnd(
  start: dayjs.Dayjs | null,
  parsedTime: ParsedTimeRange,
  kind: EventKind,
): dayjs.Dayjs | null {
  if (!start) {
    return null;
  }

  if (parsedTime.end.matched) {
    let end = start
      .hour(parsedTime.end.hour)
      .minute(parsedTime.end.minute)
      .second(0)
      .millisecond(0);

    if (!end.isAfter(start)) {
      end = end.add(1, "day");
    }

    return end;
  }

  if (parsedTime.start.matched && kind !== "task" && kind !== "deadline") {
    return start.add(1, "hour");
  }

  return null;
}

function detectKind(text: string): EventKind {
  if (/バイト|イオン/.test(text)) {
    return "work";
  }

  if (/授業|講義|実験/.test(text)) {
    return "class";
  }

  if (/締切|期限|提出/.test(text)) {
    return "deadline";
  }

  if (/課題|レポート/.test(text)) {
    return "task";
  }

  if (/支払い|振込|契約/.test(text)) {
    return "payment";
  }

  if (/歯医者|美容院|健康診断/.test(text)) {
    return "health";
  }

  if (/飲み|のみ|パチンコ/.test(text)) {
    return "social";
  }

  if (/LOL|LoL|シャドバ/i.test(text)) {
    return "game";
  }

  return "general";
}

function detectStatus(text: string): EventStatus {
  return /[?？]|候補日?|どっちか|かも|未定|仮/.test(text) ? "tentative" : "confirmed";
}

function extractTitle(text: string, kind: EventKind): string {
  if (/バイト/.test(text)) {
    return "バイト";
  }

  const title = text
    .replace(/明後日|あさって|明日|あした|今日/g, "")
    .replace(/(?<!\d)\d{1,2}[\/月]\d{1,2}(?:日)?/g, " ")
    .replace(
      /(午前|午後)?\s*\d{1,2}時(?:(?:半)|(?:[0-5]\d)分?)?\s*(?:から|まで|[-〜～~])\s*(午前|午後)?\s*\d{1,2}時(?:(?:半)|(?:[0-5]\d)分?)?/g,
      " ",
    )
    .replace(/(?<!\d)\d{1,2}(?::[0-5]\d)?\s*[-〜～~]\s*\d{1,2}(?::[0-5]\d)?(?!\d)/g, " ")
    .replace(/(?<!\d)(?:[01]?\d|2[0-3]):[0-5]\d(?!\d)/g, " ")
    .replace(/(午前|午後)?\s*\d{1,2}時(?:(?:半)|(?:[0-5]\d)分?)?/g, " ")
    .replace(/[?？]|候補日?|どっちか|かも|未定|仮/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(から|まで|に|で|の|を|は|が)+/, "")
    .replace(/(から|まで|に|で|の|を|は|が)+$/, "")
    .trim();

  return title || fallbackTitle(kind);
}

function fallbackTitle(kind: EventKind): string {
  switch (kind) {
    case "work":
      return "仕事";
    case "class":
      return "授業";
    case "task":
      return "課題";
    case "deadline":
      return "締切";
    case "payment":
      return "支払い";
    case "health":
      return "通院・健康";
    case "social":
      return "予定";
    case "game":
      return "ゲーム";
    case "general":
      return "予定";
  }
}

function calculateConfidence(input: {
  hasDate: boolean;
  hasTime: boolean;
  hasTitle: boolean;
  hasExplicitEnd: boolean;
  kind: EventKind;
  status: EventStatus;
}): number {
  let confidence = 0.2;

  if (input.hasDate) {
    confidence += 0.25;
  }

  if (input.hasTime) {
    confidence += 0.25;
  }

  if (input.hasExplicitEnd) {
    confidence += 0.1;
  }

  if (input.hasTitle) {
    confidence += 0.1;
  }

  if (input.kind !== "general") {
    confidence += 0.05;
  }

  if (input.status === "tentative") {
    confidence -= 0.1;
  }

  return Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
}
