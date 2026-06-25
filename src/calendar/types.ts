import type { EventKind, EventStatus, ParsedEventCandidate } from "../parser/types";

export type CalendarRegistrationMode = "dry-run" | "not-configured";

export type CalendarRegistrationErrorCode =
  | "GOOGLE_CALENDAR_NOT_CONFIGURED"
  | "GOOGLE_CALENDAR_REGISTRATION_NOT_IMPLEMENTED";

export type CalendarEventDraft = {
  title: string;
  kind: EventKind;
  status: EventStatus;
  start: string | null;
  end: string | null;
  allDay: boolean;
  description: string | null;
  originalText: string;
  calendarId: string;
  timezone: string;
};

export type CalendarRegistrationResult =
  | {
      success: true;
      mode: "dry-run";
      message: string;
      draft: CalendarEventDraft;
    }
  | {
      success: false;
      mode: "not-configured";
      message: string;
      draft: CalendarEventDraft;
      errorCode: CalendarRegistrationErrorCode;
      missingFields: string[];
    };

export type CalendarClientOptions = {
  dryRun?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRefreshToken?: string;
  googleCalendarId?: string;
  timezone?: string;
};

export type CalendarEventCandidateInput = ParsedEventCandidate;
