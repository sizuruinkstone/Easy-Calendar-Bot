import type { EventKind, EventStatus, ParsedEventCandidate } from "../parser/types";

export type CalendarRegistrationMode = "dry-run" | "not-configured" | "live" | "error";

export type CalendarRegistrationErrorCode =
  | "GOOGLE_CALENDAR_NOT_CONFIGURED"
  | "GOOGLE_CALENDAR_INSERT_FAILED"
  | "GOOGLE_CALENDAR_LIST_FAILED"
  | "CALENDAR_EVENT_INVALID";

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
      success: true;
      mode: "live";
      message: string;
      draft: CalendarEventDraft;
      eventId: string | null;
      htmlLink: string | null;
    }
  | {
      success: false;
      mode: "not-configured";
      message: string;
      draft: CalendarEventDraft;
      errorCode: CalendarRegistrationErrorCode;
      missingFields: string[];
    }
  | {
      success: false;
      mode: "error";
      message: string;
      draft: CalendarEventDraft;
      errorCode: CalendarRegistrationErrorCode;
      errorMessage: string;
    };

export type CalendarClientOptions = {
  dryRun?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRefreshToken?: string;
  googleCalendarId?: string;
  timezone?: string;
  insertEvent?: CalendarEventInserter;
  listEvents?: CalendarEventLister;
};

export type CalendarEventCandidateInput = ParsedEventCandidate;

export type GoogleCalendarEventResource = {
  summary: string;
  description: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
};

export type GoogleCalendarInsertConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
};

export type GoogleCalendarInsertResult = {
  eventId: string | null;
  htmlLink: string | null;
};

export type CalendarEventInserter = (
  config: GoogleCalendarInsertConfig,
  event: GoogleCalendarEventResource,
) => Promise<GoogleCalendarInsertResult>;

export type CalendarListRange = {
  timeMin: string;
  timeMax: string;
  timezone: string;
};

export type GoogleCalendarListedEventResource = {
  id: string | null;
  summary: string | null;
  htmlLink: string | null;
  start: {
    date?: string | null;
    dateTime?: string | null;
    timeZone?: string | null;
  };
  end: {
    date?: string | null;
    dateTime?: string | null;
    timeZone?: string | null;
  };
};

export type CalendarEventLister = (
  config: GoogleCalendarInsertConfig,
  range: CalendarListRange,
) => Promise<GoogleCalendarListedEventResource[]>;

export type CalendarListedEvent = {
  id: string | null;
  title: string;
  htmlLink: string | null;
  allDay: boolean;
  start: string;
  end: string | null;
  timezone: string;
};

export type CalendarListResult =
  | {
      success: true;
      mode: "live";
      message: string;
      events: CalendarListedEvent[];
      range: CalendarListRange;
    }
  | {
      success: false;
      mode: "not-configured";
      message: string;
      errorCode: CalendarRegistrationErrorCode;
      missingFields: string[];
      range: CalendarListRange;
    }
  | {
      success: false;
      mode: "error";
      message: string;
      errorCode: CalendarRegistrationErrorCode;
      errorMessage: string;
      range: CalendarListRange;
    };
