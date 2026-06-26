import type { ChatInputCommandInteraction } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import type { CalendarListResult } from "../src/calendar/types";
import { commands } from "../src/discord/commands";
import { HELP_MESSAGE } from "../src/discord/commands/help";

const mocks = vi.hoisted(() => ({
  listTodayCalendarEvents: vi.fn(),
  listTomorrowCalendarEvents: vi.fn(),
}));

vi.mock("../src/calendar/calendarClient", () => ({
  listTodayCalendarEvents: mocks.listTodayCalendarEvents,
  listTomorrowCalendarEvents: mocks.listTomorrowCalendarEvents,
}));

import {
  buildNotifyTestReply,
  handleNotifyTestCommand,
  NOTIFY_TEST_COMMAND_NAME,
} from "../src/discord/commands/notifyTest";

describe("notify-test command", () => {
  it("is registered as a slash command target", () => {
    expect(commands.map((command) => command.name)).toContain(NOTIFY_TEST_COMMAND_NAME);
  });

  it("is listed in the help message", () => {
    expect(HELP_MESSAGE).toContain("/notify-test");
  });

  it("replies with today and tomorrow notification preview", async () => {
    const interaction = createInteraction();
    mocks.listTodayCalendarEvents.mockResolvedValue(buildSuccessfulResult("today"));
    mocks.listTomorrowCalendarEvents.mockResolvedValue(buildSuccessfulResult("tomorrow"));

    await handleNotifyTestCommand(interaction);

    expect(mocks.listTodayCalendarEvents).toHaveBeenCalledTimes(1);
    expect(mocks.listTomorrowCalendarEvents).toHaveBeenCalledTimes(1);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: [
        "今日の予定",
        "",
        "* 17:00-23:00 バイト",
        "",
        "明日の予定",
        "",
        "* 終日 レポート",
      ].join("\n"),
      ephemeral: true,
    });
  });

  it("returns the today error message when Google settings are missing", () => {
    const todayResult: CalendarListResult = {
      success: false,
      mode: "not-configured",
      message: "Google Calendar連携が未設定です。",
      errorCode: "GOOGLE_CALENDAR_NOT_CONFIGURED",
      missingFields: ["GOOGLE_CLIENT_ID"],
      range: buildRange(),
    };

    expect(
      buildNotifyTestReply(todayResult, buildSuccessfulResult("tomorrow")),
    ).toMatchObject({
      content: "Google Calendar連携が未設定です。",
      ephemeral: true,
    });
  });

  it("returns the tomorrow error message when the tomorrow list call fails", () => {
    const tomorrowResult: CalendarListResult = {
      success: false,
      mode: "error",
      message: "明日の予定取得に失敗しました。Botは停止していません。理由: list failed",
      errorCode: "GOOGLE_CALENDAR_LIST_FAILED",
      errorMessage: "list failed",
      range: buildRange(),
    };

    expect(buildNotifyTestReply(buildSuccessfulResult("today"), tomorrowResult)).toMatchObject({
      content: "明日の予定取得に失敗しました。Botは停止していません。理由: list failed",
      ephemeral: true,
    });
  });
});

function createInteraction(): ChatInputCommandInteraction {
  return {
    reply: vi.fn(),
  } as unknown as ChatInputCommandInteraction;
}

function buildSuccessfulResult(day: "today" | "tomorrow"): Extract<
  CalendarListResult,
  { success: true }
> {
  return {
    success: true,
    mode: "live",
    message: "予定を取得しました。",
    events:
      day === "today"
        ? [
            {
              id: "work-1",
              title: "バイト",
              htmlLink: null,
              allDay: false,
              start: "2026-06-25T17:00:00+09:00",
              end: "2026-06-25T23:00:00+09:00",
              timezone: "Asia/Tokyo",
            },
          ]
        : [
            {
              id: "report-1",
              title: "レポート",
              htmlLink: null,
              allDay: true,
              start: "2026-06-26",
              end: "2026-06-27",
              timezone: "Asia/Tokyo",
            },
          ],
    range: buildRange(),
  };
}

function buildRange(): Extract<CalendarListResult, { success: true }>["range"] {
  return {
    timeMin: "2026-06-25T00:00:00+09:00",
    timeMax: "2026-06-26T00:00:00+09:00",
    timezone: "Asia/Tokyo",
  };
}
