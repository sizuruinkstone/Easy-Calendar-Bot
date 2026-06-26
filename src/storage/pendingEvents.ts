import { randomUUID } from "crypto";

import type { ParsedEventCandidate } from "../parser/types";

export type PendingEvent = {
  id: string;
  userId: string;
  channelId: string | null;
  candidate: ParsedEventCandidate;
  createdAt: string;
};

const PENDING_EVENT_TTL_MS = 30 * 60 * 1000;
const pendingEvents = new Map<string, PendingEvent>();

export function savePendingEvent(input: {
  userId: string;
  channelId: string | null;
  candidate: ParsedEventCandidate;
}): PendingEvent {
  pruneExpiredPendingEvents();

  const pendingEvent: PendingEvent = {
    id: randomUUID(),
    userId: input.userId,
    channelId: input.channelId,
    candidate: input.candidate,
    createdAt: new Date().toISOString(),
  };

  pendingEvents.set(pendingEvent.id, pendingEvent);

  return pendingEvent;
}

export function getPendingEvent(id: string): PendingEvent | undefined {
  const pendingEvent = pendingEvents.get(id);

  if (!pendingEvent) {
    return undefined;
  }

  if (isExpired(pendingEvent)) {
    pendingEvents.delete(id);
    return undefined;
  }

  return pendingEvent;
}

export function deletePendingEvent(id: string): boolean {
  return pendingEvents.delete(id);
}

export function clearPendingEventsForTest(): void {
  pendingEvents.clear();
}

function pruneExpiredPendingEvents(): void {
  for (const [id, pendingEvent] of pendingEvents) {
    if (isExpired(pendingEvent)) {
      pendingEvents.delete(id);
    }
  }
}

function isExpired(pendingEvent: PendingEvent): boolean {
  const createdAtMs = Date.parse(pendingEvent.createdAt);

  if (Number.isNaN(createdAtMs)) {
    return true;
  }

  return Date.now() - createdAtMs >= PENDING_EVENT_TTL_MS;
}
