import { config } from "../config";
import type {
  CalendarClientOptions,
  CalendarEventCandidateInput,
  CalendarEventDraft,
  CalendarRegistrationResult,
} from "./types";

const DEFAULT_CALENDAR_ID = "primary";
const DEFAULT_TIMEZONE = "Asia/Tokyo";

export function createCalendarEvent(
  candidate: CalendarEventCandidateInput,
  options?: CalendarClientOptions,
): CalendarRegistrationResult {
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
        "Google Calendar連携が未設定です。Discordの仮動作では CALENDAR_DRY_RUN=true を設定してください。Google Calendar本登録はStep 3Bで実装予定です。",
      draft,
      errorCode: "GOOGLE_CALENDAR_NOT_CONFIGURED",
      missingFields,
    };
  }

  return {
    success: false,
    mode: "not-configured",
    message:
      "Google Calendar本登録はStep 3Bで実装予定です。現時点では CALENDAR_DRY_RUN=true で登録予定内容だけ確認できます。",
    draft,
    errorCode: "GOOGLE_CALENDAR_REGISTRATION_NOT_IMPLEMENTED",
    missingFields: [],
  };
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

function resolveCalendarClientOptions(options?: CalendarClientOptions): Required<CalendarClientOptions> {
  if (options) {
    return {
      dryRun: options.dryRun ?? false,
      googleClientId: options.googleClientId ?? "",
      googleClientSecret: options.googleClientSecret ?? "",
      googleRefreshToken: options.googleRefreshToken ?? "",
      googleCalendarId: options.googleCalendarId || DEFAULT_CALENDAR_ID,
      timezone: options.timezone || DEFAULT_TIMEZONE,
    };
  }

  return {
    dryRun: config.calendarDryRun,
    googleClientId: config.googleClientId ?? "",
    googleClientSecret: config.googleClientSecret ?? "",
    googleRefreshToken: config.googleRefreshToken ?? "",
    googleCalendarId: config.googleCalendarId || DEFAULT_CALENDAR_ID,
    timezone: config.timezone || DEFAULT_TIMEZONE,
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
