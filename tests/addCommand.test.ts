import type { ButtonInteraction } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CalendarRegistrationResult } from "../src/calendar/types";
import type { ParsedEventCandidate } from "../src/parser/types";

const mocks = vi.hoisted(() => ({
  callOrder: [] as string[],
  createCalendarEvent: vi.fn(),
  deletePendingEvent: vi.fn(),
  getPendingEvent: vi.fn(),
  savePendingEvent: vi.fn(),
}));

vi.mock("../src/calendar/calendarClient", () => ({
  createCalendarEvent: mocks.createCalendarEvent,
}));

vi.mock("../src/storage/pendingEvents", () => ({
  deletePendingEvent: mocks.deletePendingEvent,
  getPendingEvent: mocks.getPendingEvent,
  savePendingEvent: mocks.savePendingEvent,
}));

import { handleAddButton } from "../src/discord/commands/add";

const candidate: ParsedEventCandidate = {
  title: "バイト",
  kind: "work",
  status: "confirmed",
  start: "2026-06-26T17:00:00+09:00",
  end: "2026-06-26T23:00:00+09:00",
  allDay: false,
  description: null,
  confidence: 0.9,
  needsConfirmation: false,
  originalText: "明日17時から23時バイト",
};

const calendarResult: CalendarRegistrationResult = {
  success: true,
  mode: "live",
  message: "Google Calendarに登録しました。",
  draft: {
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
  },
  eventId: "event-1",
  htmlLink: null,
};

const calendarFailureResult: CalendarRegistrationResult = {
  success: false,
  mode: "error",
  message: "Google Calendar登録に失敗しました。Botは停止していません。理由: insert failed",
  draft: calendarResult.draft,
  errorCode: "GOOGLE_CALENDAR_INSERT_FAILED",
  errorMessage: "insert failed",
};

describe("add command button handling", () => {
  beforeEach(() => {
    mocks.callOrder.length = 0;
    mocks.createCalendarEvent.mockReset();
    mocks.deletePendingEvent.mockReset();
    mocks.getPendingEvent.mockReset();
    mocks.savePendingEvent.mockReset();
  });

  it("defers, deletes pending state, then registers and edits the reply on confirm", async () => {
    const pendingEvent = {
      id: "pending-1",
      userId: "user-1",
      channelId: "channel-1",
      candidate,
      createdAt: "2026-06-25T12:00:00.000Z",
    };
    const interaction = createButtonInteraction("pending-event:confirm:pending-1");

    mocks.getPendingEvent.mockReturnValue(pendingEvent);
    mocks.deletePendingEvent.mockImplementation(() => {
      mocks.callOrder.push("deletePendingEvent");
      return true;
    });
    mocks.createCalendarEvent.mockImplementation(async () => {
      mocks.callOrder.push("createCalendarEvent");
      return calendarResult;
    });

    await handleAddButton(interaction);

    expect(mocks.callOrder).toEqual([
      "deferUpdate",
      "deletePendingEvent",
      "createCalendarEvent",
      "editReply",
    ]);
    expect(interaction.deferUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.deletePendingEvent).toHaveBeenCalledWith("pending-1");
    expect(mocks.createCalendarEvent).toHaveBeenCalledWith(candidate);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Google Calendarに登録しました。",
      embeds: [],
      components: [],
    });
    expect(interaction.update).not.toHaveBeenCalled();
  });

  it("shows the calendar failure message when confirm registration returns an error result", async () => {
    const pendingEvent = {
      id: "pending-1",
      userId: "user-1",
      channelId: "channel-1",
      candidate,
      createdAt: "2026-06-25T12:00:00.000Z",
    };
    const interaction = createButtonInteraction("pending-event:confirm:pending-1");

    mocks.getPendingEvent.mockReturnValue(pendingEvent);
    mocks.deletePendingEvent.mockReturnValue(true);
    mocks.createCalendarEvent.mockResolvedValue(calendarFailureResult);

    await expect(handleAddButton(interaction)).resolves.toBeUndefined();

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: calendarFailureResult.message,
      embeds: [],
      components: [],
    });
  });

  it("keeps the cancel branch using update and clearing the confirmation UI", async () => {
    const pendingEvent = {
      id: "pending-1",
      userId: "user-1",
      channelId: "channel-1",
      candidate,
      createdAt: "2026-06-25T12:00:00.000Z",
    };
    const interaction = createButtonInteraction("pending-event:cancel:pending-1");

    mocks.getPendingEvent.mockReturnValue(pendingEvent);
    mocks.deletePendingEvent.mockReturnValue(true);

    await handleAddButton(interaction);

    expect(interaction.deferUpdate).not.toHaveBeenCalled();
    expect(mocks.createCalendarEvent).not.toHaveBeenCalled();
    expect(mocks.deletePendingEvent).toHaveBeenCalledWith("pending-1");
    expect(interaction.update).toHaveBeenCalledWith({
      content: "予定候補をキャンセルしました。",
      embeds: [],
      components: [],
    });
    expect(interaction.editReply).not.toHaveBeenCalled();
  });
});

function createButtonInteraction(customId: string): ButtonInteraction {
  return {
    customId,
    user: { id: "user-1" },
    deferUpdate: vi.fn(async () => {
      mocks.callOrder.push("deferUpdate");
    }),
    editReply: vi.fn(async () => {
      mocks.callOrder.push("editReply");
    }),
    reply: vi.fn(),
    update: vi.fn(),
  } as unknown as ButtonInteraction;
}
