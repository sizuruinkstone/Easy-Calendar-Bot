import { describe, expect, it } from "vitest";

import { parseScheduleText } from "../src/parser/parseScheduleText";

const now = new Date("2026-06-25T12:00:00+09:00");

describe("parseScheduleText", () => {
  it("parses 明日17時からバイト", () => {
    const result = parseScheduleText("明日17時からバイト", now);

    expect(result.title).toBe("バイト");
    expect(result.type).toBe("work");
    expect(result.start).toBe("2026-06-26T17:00:00+09:00");
    expect(result.source).toBe("manual");
  });

  it("parses 今日21時に課題", () => {
    const result = parseScheduleText("今日21時に課題", now);

    expect(result.title).toBe("課題");
    expect(result.type).toBe("assignment");
    expect(result.start).toBe("2026-06-25T21:00:00+09:00");
  });

  it("parses 6/28 13:00 物理レポート締切", () => {
    const result = parseScheduleText("6/28 13:00 物理レポート締切", now);

    expect(result.title).toBe("物理レポート締切");
    expect(result.type).toBe("assignment");
    expect(result.start).toBe("2026-06-28T13:00:00+09:00");
  });

  it("parses 来週月曜 朝にゴミ出し", () => {
    const result = parseScheduleText("来週月曜 朝にゴミ出し", now);

    expect(result.title).toBe("ゴミ出し");
    expect(result.type).toBe("reminder");
    expect(result.start).toBe("2026-06-29T08:00:00+09:00");
  });
});
