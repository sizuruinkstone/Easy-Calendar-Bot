import { describe, expect, it } from "vitest";

import type { CalendarListResult } from "../src/calendar/types";
import { buildScheduleNotification } from "../src/notification/buildScheduleNotification";

type SuccessfulCalendarListResult = Extract<CalendarListResult, { success: true }>;

describe("buildScheduleNotification", () => {
  it("formats today and tomorrow events for notification preview", () => {
    const today = buildSuccessfulResult([
      {
        id: "work-1",
        title: "バイト",
        htmlLink: null,
        allDay: false,
        start: "2026-06-25T17:00:00+09:00",
        end: "2026-06-25T23:00:00+09:00",
        timezone: "Asia/Tokyo",
      },
      {
        id: "task-1",
        title: "課題",
        htmlLink: null,
        allDay: false,
        start: "2026-06-25T22:00:00+09:00",
        end: null,
        timezone: "Asia/Tokyo",
      },
    ]);
    const tomorrow = buildSuccessfulResult([
      {
        id: "deadline-1",
        title: "物理レポート締切",
        htmlLink: null,
        allDay: false,
        start: "2026-06-26T13:00:00+09:00",
        end: null,
        timezone: "Asia/Tokyo",
      },
      {
        id: "report-1",
        title: "レポート",
        htmlLink: null,
        allDay: true,
        start: "2026-06-26",
        end: "2026-06-27",
        timezone: "Asia/Tokyo",
      },
    ]);

    expect(buildScheduleNotification(today, tomorrow)).toBe(
      [
        "今日の予定",
        "",
        "* 17:00-23:00 バイト",
        "* 22:00 課題",
        "",
        "明日の予定",
        "",
        "* 13:00 物理レポート締切",
        "* 終日 レポート",
      ].join("\n"),
    );
  });

  it("returns a single empty message when today and tomorrow have no events", () => {
    expect(
      buildScheduleNotification(buildSuccessfulResult([]), buildSuccessfulResult([])),
    ).toBe("今日・明日の予定はありません。");
  });

  it("keeps tomorrow events when today has no events", () => {
    const tomorrow = buildSuccessfulResult([
      {
        id: "report-1",
        title: "レポート",
        htmlLink: null,
        allDay: true,
        start: "2026-06-26",
        end: "2026-06-27",
        timezone: "Asia/Tokyo",
      },
    ]);

    expect(buildScheduleNotification(buildSuccessfulResult([]), tomorrow)).toBe(
      [
        "今日の予定",
        "",
        "今日の予定はありません。",
        "",
        "明日の予定",
        "",
        "* 終日 レポート",
      ].join("\n"),
    );
  });

  it("keeps today events when tomorrow has no events", () => {
    const today = buildSuccessfulResult([
      {
        id: "work-1",
        title: "バイト",
        htmlLink: null,
        allDay: false,
        start: "2026-06-25T17:00:00+09:00",
        end: "2026-06-25T23:00:00+09:00",
        timezone: "Asia/Tokyo",
      },
    ]);

    expect(buildScheduleNotification(today, buildSuccessfulResult([]))).toBe(
      [
        "今日の予定",
        "",
        "* 17:00-23:00 バイト",
        "",
        "明日の予定",
        "",
        "明日の予定はありません。",
      ].join("\n"),
    );
  });
});

function buildSuccessfulResult(
  events: SuccessfulCalendarListResult["events"],
): SuccessfulCalendarListResult {
  return {
    success: true,
    mode: "live",
    message: events.length === 0 ? "予定はありません。" : "予定を取得しました。",
    events,
    range: {
      timeMin: "2026-06-25T00:00:00+09:00",
      timeMax: "2026-06-26T00:00:00+09:00",
      timezone: "Asia/Tokyo",
    },
  };
}
