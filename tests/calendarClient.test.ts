import { describe, expect, it } from "vitest";

import {
  buildGoogleCalendarEventResource,
  buildTodayCalendarListRange,
  buildTomorrowCalendarListRange,
  buildWeekCalendarListRange,
  createCalendarEvent,
  listTodayCalendarEvents,
  listTomorrowCalendarEvents,
  listWeekCalendarEvents,
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

  it("builds the Asia/Tokyo range for today", () => {
    const result = buildTodayCalendarListRange(now, "Asia/Tokyo");

    expect(result).toEqual({
      timeMin: "2026-06-25T00:00:00+09:00",
      timeMax: "2026-06-26T00:00:00+09:00",
      timezone: "Asia/Tokyo",
    });
  });

  it("builds the Asia/Tokyo range for tomorrow", () => {
    const result = buildTomorrowCalendarListRange(now, "Asia/Tokyo");

    expect(result).toEqual({
      timeMin: "2026-06-26T00:00:00+09:00",
      timeMax: "2026-06-27T00:00:00+09:00",
      timezone: "Asia/Tokyo",
    });
  });

  it("builds the Asia/Tokyo range for the next 7 days", () => {
    const result = buildWeekCalendarListRange(now, "Asia/Tokyo");

    expect(result).toEqual({
      timeMin: "2026-06-25T00:00:00+09:00",
      timeMax: "2026-07-02T00:00:00+09:00",
      timezone: "Asia/Tokyo",
    });
  });

  it("returns not-configured when listing today's events without Google settings", async () => {
    const result = await listTodayCalendarEvents({ dryRun: false }, now);

    expect(result.success).toBe(false);
    expect(result.mode).toBe("not-configured");

    if (!result.success && result.mode === "not-configured") {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_NOT_CONFIGURED");
      expect(result.missingFields).toEqual([
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN",
      ]);
    }
  });

  it("returns not-configured when listing tomorrow's events without Google settings", async () => {
    const result = await listTomorrowCalendarEvents({ dryRun: false }, now);

    expect(result.success).toBe(false);
    expect(result.mode).toBe("not-configured");

    if (!result.success && result.mode === "not-configured") {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_NOT_CONFIGURED");
      expect(result.missingFields).toEqual([
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN",
      ]);
    }
  });

  it("returns not-configured when listing the next 7 days without Google settings", async () => {
    const result = await listWeekCalendarEvents({ dryRun: false }, now);

    expect(result.success).toBe(false);
    expect(result.mode).toBe("not-configured");

    if (!result.success && result.mode === "not-configured") {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_NOT_CONFIGURED");
      expect(result.missingFields).toEqual([
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_REFRESH_TOKEN",
      ]);
    }
  });

  it("lists today's events with a mocked Google Calendar list call", async () => {
    const result = await listTodayCalendarEvents(
      {
        googleClientId: "client-id",
        googleClientSecret: "client-secret",
        googleRefreshToken: "refresh-token",
        listEvents: async (_config, range) => {
          expect(range.timeMin).toBe("2026-06-25T00:00:00+09:00");
          expect(range.timeMax).toBe("2026-06-26T00:00:00+09:00");

          return [
            {
              id: "work-1",
              summary: "バイト",
              htmlLink: null,
              start: { dateTime: "2026-06-25T17:00:00+09:00", timeZone: "Asia/Tokyo" },
              end: { dateTime: "2026-06-25T23:00:00+09:00", timeZone: "Asia/Tokyo" },
            },
            {
              id: "report-1",
              summary: "レポート",
              htmlLink: null,
              start: { date: "2026-06-25" },
              end: { date: "2026-06-26" },
            },
          ];
        },
      },
      now,
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.events).toMatchObject([
        {
          id: "work-1",
          title: "バイト",
          allDay: false,
          start: "2026-06-25T17:00:00+09:00",
          end: "2026-06-25T23:00:00+09:00",
        },
        {
          id: "report-1",
          title: "レポート",
          allDay: true,
          start: "2026-06-25",
          end: "2026-06-26",
        },
      ]);
    }
  });

  it("lists tomorrow's events with a mocked Google Calendar list call", async () => {
    const result = await listTomorrowCalendarEvents(
      {
        googleClientId: "client-id",
        googleClientSecret: "client-secret",
        googleRefreshToken: "refresh-token",
        listEvents: async (_config, range) => {
          expect(range.timeMin).toBe("2026-06-26T00:00:00+09:00");
          expect(range.timeMax).toBe("2026-06-27T00:00:00+09:00");

          return [
            {
              id: "work-1",
              summary: "バイト",
              htmlLink: null,
              start: { dateTime: "2026-06-26T17:00:00+09:00", timeZone: "Asia/Tokyo" },
              end: { dateTime: "2026-06-26T23:00:00+09:00", timeZone: "Asia/Tokyo" },
            },
            {
              id: "report-1",
              summary: "レポート",
              htmlLink: null,
              start: { date: "2026-06-26" },
              end: { date: "2026-06-27" },
            },
          ];
        },
      },
      now,
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.events).toMatchObject([
        {
          id: "work-1",
          title: "バイト",
          allDay: false,
          start: "2026-06-26T17:00:00+09:00",
          end: "2026-06-26T23:00:00+09:00",
        },
        {
          id: "report-1",
          title: "レポート",
          allDay: true,
          start: "2026-06-26",
          end: "2026-06-27",
        },
      ]);
    }
  });

  it("lists the next 7 days with a mocked Google Calendar list call", async () => {
    const result = await listWeekCalendarEvents(
      {
        googleClientId: "client-id",
        googleClientSecret: "client-secret",
        googleRefreshToken: "refresh-token",
        listEvents: async (_config, range) => {
          expect(range.timeMin).toBe("2026-06-25T00:00:00+09:00");
          expect(range.timeMax).toBe("2026-07-02T00:00:00+09:00");

          return [
            {
              id: "work-1",
              summary: "バイト",
              htmlLink: null,
              start: { dateTime: "2026-06-26T17:00:00+09:00", timeZone: "Asia/Tokyo" },
              end: { dateTime: "2026-06-26T23:00:00+09:00", timeZone: "Asia/Tokyo" },
            },
            {
              id: "report-1",
              summary: "レポート",
              htmlLink: null,
              start: { date: "2026-06-27" },
              end: { date: "2026-06-28" },
            },
          ];
        },
      },
      now,
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.events).toMatchObject([
        {
          id: "work-1",
          title: "バイト",
          allDay: false,
          start: "2026-06-26T17:00:00+09:00",
          end: "2026-06-26T23:00:00+09:00",
        },
        {
          id: "report-1",
          title: "レポート",
          allDay: true,
          start: "2026-06-27",
          end: "2026-06-28",
        },
      ]);
    }
  });

  it("returns an error result when listing today's events fails", async () => {
    const result = await listTodayCalendarEvents(
      {
        googleClientId: "client-id",
        googleClientSecret: "client-secret",
        googleRefreshToken: "refresh-token",
        listEvents: async () => {
          throw new Error("list failed");
        },
      },
      now,
    );

    expect(result.success).toBe(false);
    expect(result.mode).toBe("error");

    if (!result.success && result.mode === "error") {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_LIST_FAILED");
      expect(result.message).toContain("今日の予定取得に失敗しました");
      expect(result.errorMessage).toBe("list failed");
    }
  });

  it("returns an error result when listing tomorrow's events fails", async () => {
    const result = await listTomorrowCalendarEvents(
      {
        googleClientId: "client-id",
        googleClientSecret: "client-secret",
        googleRefreshToken: "refresh-token",
        listEvents: async () => {
          throw new Error("list failed");
        },
      },
      now,
    );

    expect(result.success).toBe(false);
    expect(result.mode).toBe("error");

    if (!result.success && result.mode === "error") {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_LIST_FAILED");
      expect(result.message).toContain("明日の予定取得に失敗しました");
      expect(result.errorMessage).toBe("list failed");
    }
  });

  it("returns an error result when listing the next 7 days fails", async () => {
    const result = await listWeekCalendarEvents(
      {
        googleClientId: "client-id",
        googleClientSecret: "client-secret",
        googleRefreshToken: "refresh-token",
        listEvents: async () => {
          throw new Error("list failed");
        },
      },
      now,
    );

    expect(result.success).toBe(false);
    expect(result.mode).toBe("error");

    if (!result.success && result.mode === "error") {
      expect(result.errorCode).toBe("GOOGLE_CALENDAR_LIST_FAILED");
      expect(result.message).toContain("今後7日間の予定取得に失敗しました");
      expect(result.errorMessage).toBe("list failed");
    }
  });
});
