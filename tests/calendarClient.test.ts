import { describe, expect, it } from "vitest";

import {
  buildGoogleCalendarEventResource,
  createCalendarEvent,
} from "../src/calendar/calendarClient";
import { buildCalendarConfirmationContent } from "../src/discord/commands/add";
import { parseNaturalText } from "../src/parser/parseNaturalText";

const now = new Date("2026-06-25T12:00:00+09:00");

describe("calendarClient", () => {
  it("returns a successful dry-run result without registering to Google Calendar", async () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    let insertCalled = false;
    const result = await createCalendarEvent(candidate, {
      dryRun: true,
      insertEvent: async () => {
        insertCalled = true;
        return { eventId: "event-1", htmlLink: null };
      },
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("dry-run");
    expect(result.message).toContain("dry-run");
    expect(result.message).toContain("Google Calendarにはまだ登録していません");
    expect(result.draft.title).toBe("バイト");
    expect(insertCalled).toBe(false);
  });

  it("returns not-configured when dry-run is disabled and Google settings are missing", async () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = await createCalendarEvent(candidate, { dryRun: false });

    expect(result.success).toBe(false);
    expect(result.mode).toBe("not-configured");
    expect(result.message).toContain("Google Calendar連携が未設定です");

    if (!result.success) {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_NOT_CONFIGURED");
      expect(result.missingFields).toEqual([
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN",
      ]);
    }
  });

  it("returns live success when Google insert succeeds", async () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = await createCalendarEvent(candidate, {
      dryRun: false,
      googleClientId: "client-id",
      googleClientSecret: "client-secret",
      googleRefreshToken: "refresh-token",
      googleCalendarId: "primary",
      insertEvent: async (_config, event) => {
        expect(event.summary).toBe("バイト");
        expect(event.start.dateTime).toBe("2026-06-26T17:00:00+09:00");
        expect(event.end.dateTime).toBe("2026-06-26T23:00:00+09:00");

        return {
          eventId: "event-123",
          htmlLink: "https://calendar.google.com/event?eid=event-123",
        };
      },
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("live");
    expect(result.message).toContain("Google Calendarに登録しました");
    expect(result.message).toContain("event-123");
  });

  it("returns an error result when Google insert fails", async () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = await createCalendarEvent(candidate, {
      dryRun: false,
      googleClientId: "client-id",
      googleClientSecret: "client-secret",
      googleRefreshToken: "refresh-token",
      googleCalendarId: "primary",
      insertEvent: async () => {
        throw new Error("insert failed");
      },
    });

    expect(result.success).toBe(false);
    expect(result.mode).toBe("error");

    if (!result.success && result.mode === "error") {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_INSERT_FAILED");
      expect(result.message).toContain("Google Calendar登録に失敗しました");
      expect(result.errorMessage).toBe("insert failed");
    }
  });

  it("builds a timed Google Calendar event resource", () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = buildGoogleCalendarEventResource({
      title: candidate.title,
      kind: candidate.kind,
      status: candidate.status,
      start: candidate.start,
      end: candidate.end,
      allDay: candidate.allDay,
      description: candidate.description,
      originalText: candidate.originalText,
      calendarId: "primary",
      timezone: "Asia/Tokyo",
    });

    expect(result).toMatchObject({
      summary: "バイト",
      start: {
        dateTime: "2026-06-26T17:00:00+09:00",
        timeZone: "Asia/Tokyo",
      },
      end: {
        dateTime: "2026-06-26T23:00:00+09:00",
        timeZone: "Asia/Tokyo",
      },
    });
  });

  it("builds an all-day Google Calendar event resource with an exclusive end date", () => {
    const candidate = parseNaturalText("明日レポート", now);
    const result = buildGoogleCalendarEventResource({
      title: candidate.title,
      kind: candidate.kind,
      status: candidate.status,
      start: candidate.start,
      end: candidate.end,
      allDay: candidate.allDay,
      description: candidate.description,
      originalText: candidate.originalText,
      calendarId: "primary",
      timezone: "Asia/Tokyo",
    });

    expect(result).toMatchObject({
      summary: "レポート",
      start: { date: "2026-06-26" },
      end: { date: "2026-06-27" },
    });
  });

  it("uses the calendarClient result message for confirm replies", async () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = await createCalendarEvent(candidate, { dryRun: true });

    expect(buildCalendarConfirmationContent(result)).toBe(result.message);
  });
});
