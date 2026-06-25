import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { config } from "../config";
import {
  insertGoogleCalendarEvent,
  listGoogleCalendarEvents,
} from "./googleCalendarClient";
import type {
  CalendarEventInserter,
  CalendarClientOptions,
  CalendarEventCandidateInput,
  CalendarEventDraft,
  CalendarListedEvent,
  CalendarListRange,
  CalendarListResult,
  CalendarRegistrationResult,
  GoogleCalendarEventResource,
  GoogleCalendarInsertConfig,
  GoogleCalendarListedEventResource,
} from "./types";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_CALENDAR_ID = "primary";
const DEFAULT_TIMEZONE = "Asia/Tokyo";

export async function createCalendarEvent(
  candidate: CalendarEventCandidateInput,
  options?: CalendarClientOptions,
): Promise<CalendarRegistrationResult> {
  const resolvedOptions = resolveCalendarClientOptions(options);
  const draft = toCalendarEventDraft(candidate, resolvedOptions);

  if (resolvedOptions.dryRun) {
    return {
      success: true,
      mode: "dry-run",
      message: `dry-run: Google Calendarにはまだ登録していません。登録予定: ${formatDraftSummary(draft)}`,
      draft,
    };
  }

  const missingFields = getMissingGoogleConfigFields(resolvedOptions);
  if (missingFields.length > 0) {
    return {
      success: false,
      mode: "not-configured",
      message:
        "Google Calendar連携が未設定です。GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN を設定するか、CALENDAR_DRY_RUN=true にしてください。",
      draft,
      errorCode: "GOOGLE_CALENDAR_NOT_CONFIGURED",
      missingFields,
    };
  }

  const googleConfig: GoogleCalendarInsertConfig = {
    clientId: resolvedOptions.googleClientId,
    clientSecret: resolvedOptions.googleClientSecret,
    refreshToken: resolvedOptions.googleRefreshToken,
    calendarId: draft.calendarId,
  };

  try {
    const eventResource = buildGoogleCalendarEventResource(draft);
    const insertResult = await resolvedOptions.insertEvent(googleConfig, eventResource);

    return {
      success: true,
      mode: "live",
      message: formatLiveSuccessMessage(insertResult.eventId, insertResult.htmlLink),
      draft,
      eventId: insertResult.eventId,
      htmlLink: insertResult.htmlLink,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      mode: "error",
      message: `Google Calendar登録に失敗しました。Botは停止していません。理由: ${errorMessage}`,
      draft,
      errorCode:
        error instanceof InvalidCalendarEventError
          ? "CALENDAR_EVENT_INVALID"
          : "GOOGLE_CALENDAR_INSERT_FAILED",
      errorMessage,
    };
  }
}

export function toCalendarEventDraft(
  candidate: CalendarEventCandidateInput,
  options?: CalendarClientOptions,
): CalendarEventDraft {
  return {
    title: candidate.title,
    kind: candidate.kind,
    status: candidate.status,
    start: candidate.start,
    end: candidate.end,
    allDay: candidate.allDay,
    description: candidate.description,
    originalText: candidate.originalText,
    calendarId: options?.googleCalendarId || DEFAULT_CALENDAR_ID,
    timezone: options?.timezone || DEFAULT_TIMEZONE,
  };
}

export async function listTodayCalendarEvents(
  options?: CalendarClientOptions,
  now: Date = new Date(),
): Promise<CalendarListResult> {
  return listCalendarEventsForDay({
    options,
    now,
    dayOffset: 0,
    emptyMessage: "今日の予定はありません。",
    successMessage: (count) => `今日の予定を${count}件取得しました。`,
    errorLabel: "今日の予定取得",
  });
}

export async function listTomorrowCalendarEvents(
  options?: CalendarClientOptions,
  now: Date = new Date(),
): Promise<CalendarListResult> {
  return listCalendarEventsForDay({
    options,
    now,
    dayOffset: 1,
    emptyMessage: "明日の予定はありません。",
    successMessage: (count) => `明日の予定を${count}件取得しました。`,
    errorLabel: "明日の予定取得",
  });
}

export async function listWeekCalendarEvents(
  options?: CalendarClientOptions,
  now: Date = new Date(),
): Promise<CalendarListResult> {
  return listCalendarEventsForRange({
    options,
    now,
    dayOffset: 0,
    durationDays: 7,
    emptyMessage: "今後7日間の予定はありません。",
    successMessage: (count) => `今後7日間の予定を${count}件取得しました。`,
    errorLabel: "今後7日間の予定取得",
  });
}

export function buildTodayCalendarListRange(
  now: Date,
  timezoneName: string = DEFAULT_TIMEZONE,
): CalendarListRange {
  return buildCalendarListRange(now, 0, 1, timezoneName);
}

export function buildTomorrowCalendarListRange(
  now: Date,
  timezoneName: string = DEFAULT_TIMEZONE,
): CalendarListRange {
  return buildCalendarListRange(now, 1, 1, timezoneName);
}

export function buildWeekCalendarListRange(
  now: Date,
  timezoneName: string = DEFAULT_TIMEZONE,
): CalendarListRange {
  return buildCalendarListRange(now, 0, 7, timezoneName);
}

function buildCalendarListRange(
  now: Date,
  dayOffset: number,
  durationDays: number,
  timezoneName: string,
): CalendarListRange {
  const start = dayjs(now).tz(timezoneName).startOf("day").add(dayOffset, "day");
  const end = start.add(durationDays, "day");

  return {
    timeMin: start.format(),
    timeMax: end.format(),
    timezone: timezoneName,
  };
}

async function listCalendarEventsForDay({
  options,
  now,
  dayOffset,
  emptyMessage,
  successMessage,
  errorLabel,
}: {
  options?: CalendarClientOptions;
  now: Date;
  dayOffset: number;
  emptyMessage: string;
  successMessage: (count: number) => string;
  errorLabel: string;
}): Promise<CalendarListResult> {
  return listCalendarEventsForRange({
    options,
    now,
    dayOffset,
    durationDays: 1,
    emptyMessage,
    successMessage,
    errorLabel,
  });
}

async function listCalendarEventsForRange({
  options,
  now,
  dayOffset,
  durationDays,
  emptyMessage,
  successMessage,
  errorLabel,
}: {
  options?: CalendarClientOptions;
  now: Date;
  dayOffset: number;
  durationDays: number;
  emptyMessage: string;
  successMessage: (count: number) => string;
  errorLabel: string;
}): Promise<CalendarListResult> {
  const resolvedOptions = resolveCalendarClientOptions(options);
  const range = buildCalendarListRange(
    now,
    dayOffset,
    durationDays,
    resolvedOptions.timezone,
  );
  const missingFields = getMissingGoogleConfigFields(resolvedOptions);

  if (missingFields.length > 0) {
    return {
      success: false,
      mode: "not-configured",
      message:
        "Google Calendar連携が未設定です。GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN を設定してください。",
      errorCode: "GOOGLE_CALENDAR_NOT_CONFIGURED",
      missingFields,
      range,
    };
  }

  const googleConfig: GoogleCalendarInsertConfig = {
    clientId: resolvedOptions.googleClientId,
    clientSecret: resolvedOptions.googleClientSecret,
    refreshToken: resolvedOptions.googleRefreshToken,
    calendarId: resolvedOptions.googleCalendarId,
  };

  try {
    const events = await resolvedOptions.listEvents(googleConfig, range);
    const normalizedEvents = events.map((event) =>
      toCalendarListedEvent(event, resolvedOptions.timezone),
    );

    return {
      success: true,
      mode: "live",
      message:
        normalizedEvents.length === 0
          ? emptyMessage
          : successMessage(normalizedEvents.length),
      events: normalizedEvents,
      range,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      mode: "error",
      message: `${errorLabel}に失敗しました。Botは停止していません。理由: ${errorMessage}`,
      errorCode: "GOOGLE_CALENDAR_LIST_FAILED",
      errorMessage,
      range,
    };
  }
}

function resolveCalendarClientOptions(options?: CalendarClientOptions): Required<CalendarClientOptions> {
  if (options) {
    return {
      dryRun: options.dryRun ?? false,
      googleClientId: options.googleClientId ?? "",
      googleClientSecret: options.googleClientSecret ?? "",
      googleRefreshToken: options.googleRefreshToken ?? "",
      googleCalendarId: options.googleCalendarId || DEFAULT_CALENDAR_ID,
      timezone: options.timezone || DEFAULT_TIMEZONE,
      insertEvent: options.insertEvent ?? insertGoogleCalendarEvent,
      listEvents: options.listEvents ?? listGoogleCalendarEvents,
    };
  }

  return {
    dryRun: config.calendarDryRun,
    googleClientId: config.googleClientId ?? "",
    googleClientSecret: config.googleClientSecret ?? "",
    googleRefreshToken: config.googleRefreshToken ?? "",
    googleCalendarId: config.googleCalendarId || DEFAULT_CALENDAR_ID,
    timezone: config.timezone || DEFAULT_TIMEZONE,
    insertEvent: insertGoogleCalendarEvent,
    listEvents: listGoogleCalendarEvents,
  };
}

function getMissingGoogleConfigFields(options: Required<CalendarClientOptions>): string[] {
  const missingFields: string[] = [];

  if (!options.googleClientId) {
    missingFields.push("GOOGLE_CLIENT_ID");
  }

  if (!options.googleClientSecret) {
    missingFields.push("GOOGLE_CLIENT_SECRET");
  }

  if (!options.googleRefreshToken) {
    missingFields.push("GOOGLE_REFRESH_TOKEN");
  }

  if (!options.googleCalendarId) {
    missingFields.push("GOOGLE_CALENDAR_ID");
  }

  return missingFields;
}

function formatDraftSummary(draft: CalendarEventDraft): string {
  const start = draft.start ?? "開始未判定";
  const end = draft.end ? ` - ${draft.end}` : "";

  return `${draft.title} / ${start}${end}`;
}

function toCalendarListedEvent(
  event: GoogleCalendarListedEventResource,
  timezoneName: string,
): CalendarListedEvent {
  const allDay = Boolean(event.start.date);
  const start = event.start.date ?? event.start.dateTime;

  if (!start) {
    throw new Error("Google Calendar event start is missing.");
  }

  return {
    id: event.id,
    title: event.summary || "無題",
    htmlLink: event.htmlLink,
    allDay,
    start,
    end: event.end.date ?? event.end.dateTime ?? null,
    timezone: event.start.timeZone ?? timezoneName,
  };
}

export function buildGoogleCalendarEventResource(
  draft: CalendarEventDraft,
): GoogleCalendarEventResource {
  if (!draft.start) {
    throw new InvalidCalendarEventError("開始日時が未判定のためGoogle Calendarへ登録できません。");
  }

  const description = [
    draft.description,
    "",
    `kind: ${draft.kind}`,
    `status: ${draft.status}`,
    `originalText: ${draft.originalText}`,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n");

  if (draft.allDay) {
    const startDate = dayjs(draft.start).tz(draft.timezone).format("YYYY-MM-DD");
    const endDate = draft.end
      ? dayjs(draft.end).tz(draft.timezone).add(1, "day").format("YYYY-MM-DD")
      : dayjs(draft.start).tz(draft.timezone).add(1, "day").format("YYYY-MM-DD");

    return {
      summary: draft.title,
      description,
      start: { date: startDate },
      end: { date: endDate },
    };
  }

  const start = dayjs(draft.start).tz(draft.timezone);
  const end = draft.end ? dayjs(draft.end).tz(draft.timezone) : start.add(1, "hour");

  return {
    summary: draft.title,
    description,
    start: {
      dateTime: start.format(),
      timeZone: draft.timezone,
    },
    end: {
      dateTime: end.format(),
      timeZone: draft.timezone,
    },
  };
}

function formatLiveSuccessMessage(eventId: string | null, htmlLink: string | null): string {
  const details = [
    eventId ? `event id: ${eventId}` : null,
    htmlLink ? `link: ${htmlLink}` : null,
  ].filter(Boolean);

  return details.length > 0
    ? `Google Calendarに登録しました。${details.join(" / ")}`
    : "Google Calendarに登録しました。";
}

class InvalidCalendarEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCalendarEventError";
  }
}
