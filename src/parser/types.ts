export type EventKind =
  | "work"
  | "class"
  | "task"
  | "deadline"
  | "payment"
  | "health"
  | "social"
  | "game"
  | "general";

export type EventStatus = "confirmed" | "tentative";

export type ParsedEventCandidate = {
  title: string;
  kind: EventKind;
  status: EventStatus;
  start: string | null;
  end: string | null;
  allDay: boolean;
  description: string | null;
  confidence: number;
  needsConfirmation: boolean;
  originalText: string;
};
