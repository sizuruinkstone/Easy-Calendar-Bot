export type ScheduleType =
  | "work"
  | "assignment"
  | "reminder"
  | "event"
  | "unknown";

export type ScheduleSource = "discord" | "manual";

export type ParsedSchedule = {
  title: string;
  type: ScheduleType;
  start: string | null;
  end: string | null;
  source: ScheduleSource;
  rawText: string;
  confidence: number;
};
