import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";

import type {
  CalendarListRange,
  GoogleCalendarEventResource,
  GoogleCalendarInsertConfig,
  GoogleCalendarInsertResult,
  GoogleCalendarListedEventResource,
} from "./types";

export async function insertGoogleCalendarEvent(
  config: GoogleCalendarInsertConfig,
  event: GoogleCalendarEventResource,
): Promise<GoogleCalendarInsertResult> {
  const oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret);
  oauth2Client.setCredentials({ refresh_token: config.refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const response = await calendar.events.insert({
    calendarId: config.calendarId,
    requestBody: event,
  });

  return {
    eventId: response.data.id ?? null,
    htmlLink: response.data.htmlLink ?? null,
  };
}

export async function listGoogleCalendarEvents(
  config: GoogleCalendarInsertConfig,
  range: CalendarListRange,
): Promise<GoogleCalendarListedEventResource[]> {
  const oauth2Client = new google.auth.OAuth2(config.clientId, config.clientSecret);
  oauth2Client.setCredentials({ refresh_token: config.refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const response = await calendar.events.list({
    calendarId: config.calendarId,
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items ?? []).map(toListedEventResource);
}

function toListedEventResource(
  event: calendar_v3.Schema$Event,
): GoogleCalendarListedEventResource {
  return {
    id: event.id ?? null,
    summary: event.summary ?? null,
    htmlLink: event.htmlLink ?? null,
    start: {
      date: event.start?.date ?? null,
      dateTime: event.start?.dateTime ?? null,
      timeZone: event.start?.timeZone ?? null,
    },
    end: {
      date: event.end?.date ?? null,
      dateTime: event.end?.dateTime ?? null,
      timeZone: event.end?.timeZone ?? null,
    },
  };
}
