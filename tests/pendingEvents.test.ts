import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearPendingEventsForTest,
  deletePendingEvent,
  getPendingEvent,
  savePendingEvent,
} from "../src/storage/pendingEvents";
import type { ParsedEventCandidate } from "../src/parser/types";

const baseNow = new Date("2026-06-25T12:00:00.000Z");

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

describe("pendingEvents storage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseNow);
    clearPendingEventsForTest();
  });

  afterEach(() => {
    clearPendingEventsForTest();
    vi.useRealTimers();
  });

  it("returns a pending event saved by savePendingEvent", () => {
    const pendingEvent = savePendingEvent({
      userId: "user-1",
      channelId: "channel-1",
      candidate,
    });

    expect(getPendingEvent(pendingEvent.id)).toEqual(pendingEvent);
  });

  it("deletes a pending event with deletePendingEvent", () => {
    const pendingEvent = savePendingEvent({
      userId: "user-1",
      channelId: "channel-1",
      candidate,
    });

    expect(deletePendingEvent(pendingEvent.id)).toBe(true);
    expect(getPendingEvent(pendingEvent.id)).toBeUndefined();
  });

  it("keeps a pending event that was created within 30 minutes", () => {
    const pendingEvent = savePendingEvent({
      userId: "user-1",
      channelId: "channel-1",
      candidate,
    });

    vi.setSystemTime(new Date(baseNow.getTime() + 29 * 60 * 1000));

    expect(getPendingEvent(pendingEvent.id)).toEqual(pendingEvent);
  });

  it("expires and removes a pending event that was created 31 minutes ago", () => {
    const pendingEvent = savePendingEvent({
      userId: "user-1",
      channelId: "channel-1",
      candidate,
    });

    vi.setSystemTime(new Date(baseNow.getTime() + 31 * 60 * 1000));

    expect(getPendingEvent(pendingEvent.id)).toBeUndefined();
    expect(deletePendingEvent(pendingEvent.id)).toBe(false);
  });

  it("prunes expired entries when saving a new pending event", () => {
    const expiredEvent = savePendingEvent({
      userId: "user-1",
      channelId: "channel-1",
      candidate,
    });

    vi.setSystemTime(new Date(baseNow.getTime() + 31 * 60 * 1000));

    const freshEvent = savePendingEvent({
      userId: "user-2",
      channelId: "channel-2",
      candidate,
    });

    expect(deletePendingEvent(expiredEvent.id)).toBe(false);
    expect(getPendingEvent(freshEvent.id)).toEqual(freshEvent);
  });
});
