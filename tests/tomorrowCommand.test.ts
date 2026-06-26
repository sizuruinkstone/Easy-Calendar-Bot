import { describe, expect, it } from "vitest";

import type { CalendarListResult } from "../src/calendar/types";
import {
  buildTomorrowReply,
  formatTomorrowEventLine,
} from "../src/discord/commands/tomorrow";

describe("tomorrow command formatting", () => {
  it("formats timed and all-day events", () => {
    expect(
      formatTomorrowEventLine(
        {
          id: "work-1",
          title: "バイト",
          htmlLink: null,
          allDay: false,
          start: "2026-06-26T17:00:00+09:00",
          end: "2026-06-26T23:00:00+09:00",
          timezone: "Asia/Tokyo",
        },
        "Asia/Tokyo",
      ),
    ).toBe("17:00-23:00 バイト");

    expect(
      formatTomorrowEventLine(
        {
          id: "report-1",
          title: "レポート",
          htmlLink: null,
          allDay: true,
          start: "2026-06-26",
          end: "2026-06-27",
          timezone: "Asia/Tokyo",
        },
        "Asia/Tokyo",
      ),
    ).toBe("終日 レポート");
  });

  it("builds an empty schedule reply", () => {
    const result: CalendarListResult = {
      success: true,
      mode: "live",
      message: "明日の予定はありません。",
      events: [],
      range: {
        timeMin: "2026-06-26T00:00:00+09:00",
        timeMax: "2026-06-27T00:00:00+09:00",
        timezone: "Asia/Tokyo",
      },
    };

    expect(buildTomorrowReply(result)).toMatchObject({
      content: "明日の予定はありません。",
      ephemeral: true,
    });
  });
});
