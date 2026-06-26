import { describe, expect, it } from "vitest";

import { parseNaturalText } from "../src/parser/parseNaturalText";

const now = new Date("2026-06-25T12:00:00+09:00");

describe("parseNaturalText", () => {
  it("parses 明日17時から23時バイト", () => {
    const result = parseNaturalText("明日17時から23時バイト", now);

    expect(result.title).toBe("バイト");
    expect(result.kind).toBe("work");
    expect(result.start).toBe("2026-06-26T17:00:00+09:00");
    expect(result.end).toBe("2026-06-26T23:00:00+09:00");
  });

  it("parses 6/28 13:00 物理レポート締切 as a deadline", () => {
    const result = parseNaturalText("6/28 13:00 物理レポート締切", now);

    expect(result.kind).toBe("deadline");
    expect(result.start).toBe("2026-06-28T13:00:00+09:00");
  });

  it("parses 今日22時に課題 as a task", () => {
    const result = parseNaturalText("今日22時に課題", now);

    expect(result.kind).toBe("task");
  });

  it("marks tentative text as tentative", () => {
    const result = parseNaturalText("来週火曜のみ？", now);

    expect(result.status).toBe("tentative");
  });

  it("marks date-only レポート as all day", () => {
    const result = parseNaturalText("明日レポート", now);

    expect(result.allDay).toBe(true);
  });
});
