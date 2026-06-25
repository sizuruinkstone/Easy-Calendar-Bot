import { google } from "googleapis";

import type {
  GoogleCalendarEventResource,
  GoogleCalendarInsertConfig,
  GoogleCalendarInsertResult,
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
