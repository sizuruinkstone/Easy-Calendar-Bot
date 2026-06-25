import { describe, expect, it } from "vitest";

import { createCalendarEvent } from "../src/calendar/calendarClient";
import { buildCalendarConfirmationContent } from "../src/discord/commands/add";
import { parseNaturalText } from "../src/parser/parseNaturalText";

const now = new Date("2026-06-25T12:00:00+09:00");

describe("calendarClient", () => {
  it("returns a successful dry-run result without registering to Google Calendar", () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = createCalendarEvent(candidate, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("dry-run");
    expect(result.message).toContain("dry-run");
    expect(result.message).toContain("Google Calendarにはまだ登録していません");
    expect(result.draft.title).toBe("バイト");
  });

  it("returns not-configured when dry-run is disabled and Google settings are missing", () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = createCalendarEvent(candidate, { dryRun: false });

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

  it("uses the calendarClient result message for confirm replies", () => {
    const candidate = parseNaturalText("明日17時から23時バイト", now);
    const result = createCalendarEvent(candidate, { dryRun: true });

    expect(buildCalendarConfirmationContent(result)).toBe(result.message);
  });
});
